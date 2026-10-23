import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocFromServer,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, UserRole, EventItem, Ticket, Collaborator } from './types/ticket';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
  };
  console.warn('[Firestore Notice]', JSON.stringify(errInfo));
}

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (with provisioned database ID or default fallback)
let firestoreDb;
try {
  firestoreDb = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

// Test connection on boot per Firebase skill directive
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('[Firebase] Firestore connected successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or Firestore initializing, fallback active');
    } else {
      console.info('[Firebase] Connection handshake:', error);
    }
    return false;
  }
}

testFirestoreConnection().catch(() => {});

// Global reference for RecaptchaVerifier
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

export function getOrCreateRecaptchaVerifier(
  containerIdOrElement: string | HTMLElement = 'recaptcha-container',
  size: 'invisible' | 'normal' = 'invisible'
): RecaptchaVerifier {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch (e) {
      console.debug('[Firebase Auth] Recaptcha clear notice:', e);
    }
    activeRecaptchaVerifier = null;
  }

  const verifier = new RecaptchaVerifier(auth, containerIdOrElement, {
    size,
    callback: () => {
      console.info('[Firebase Auth] reCAPTCHA verified successfully');
    },
    'expired-callback': () => {
      console.warn('[Firebase Auth] reCAPTCHA token expired, re-verification needed');
    },
  });

  activeRecaptchaVerifier = verifier;
  return verifier;
}

export function formatPhoneNumberE164(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+52${cleaned}`;
  }
  return `+${cleaned}`;
}

function getSavedLocalUser(): Partial<UserProfile> {
  try {
    const raw = localStorage.getItem('hype_ticket_user_profile_v3');
    const savedRole = localStorage.getItem('hype_ticket_role_v3') as UserRole | null;
    const parsed = raw ? (JSON.parse(raw) as Partial<UserProfile>) : {};
    if (savedRole && !parsed.role) {
      parsed.role = savedRole;
    }
    return parsed;
  } catch {
    return {};
  }
}

export async function signInWithGoogle(preferredRole?: UserRole): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const localSaved = getSavedLocalUser();

    let existingProfile: Partial<UserProfile> = {};
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        existingProfile = userDocSnap.data() as Partial<UserProfile>;
      }
    } catch (readErr) {
      handleFirestoreError(readErr, OperationType.GET, `users/${fbUser.uid}`);
    }

    const resolvedRole: UserRole =
      preferredRole ||
      (existingProfile.role as UserRole) ||
      (localSaved.role as UserRole) ||
      'user';

    const profile: UserProfile = {
      uid: fbUser.uid,
      displayName:
        existingProfile.displayName ||
        fbUser.displayName ||
        localSaved.displayName ||
        'Usuario Hype',
      email: fbUser.email || existingProfile.email || localSaved.email || '',
      phoneNumber:
        fbUser.phoneNumber || existingProfile.phoneNumber || localSaved.phoneNumber || undefined,
      photoURL:
        existingProfile.photoURL ||
        fbUser.photoURL ||
        localSaved.photoURL ||
        `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}`,
      role: resolvedRole,
      company: existingProfile.company || localSaved.company || 'Bush Brothers Producciones',
      bio: existingProfile.bio || localSaved.bio || 'Miembro Verificado · Oleaje Beach Club',
      provider: 'google',
      isRegistered: true,
      createdAt: existingProfile.createdAt || localSaved.createdAt || new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
    } catch (syncErr) {
      handleFirestoreError(syncErr, OperationType.WRITE, `users/${fbUser.uid}`);
    }

    return profile;
  } catch (error: any) {
    console.error('[Firebase Auth] Error signing in with Google:', error);
    throw error;
  }
}

export async function sendPhoneVerificationCode(
  rawPhoneNumber: string,
  containerIdOrElement: string | HTMLElement = 'recaptcha-container'
): Promise<ConfirmationResult> {
  try {
    const formattedPhone = formatPhoneNumberE164(rawPhoneNumber);
    const verifier = getOrCreateRecaptchaVerifier(containerIdOrElement, 'invisible');
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return confirmationResult;
  } catch (error: any) {
    if (activeRecaptchaVerifier) {
      try {
        activeRecaptchaVerifier.clear();
      } catch {
        // ignore
      }
      activeRecaptchaVerifier = null;
    }
    throw error;
  }
}

export async function verifyPhoneCode(
  confirmationResult: ConfirmationResult,
  verificationCode: string,
  initialDetails?: {
    displayName?: string;
    role?: UserRole;
    company?: string;
    bio?: string;
    photoURL?: string;
    email?: string;
  }
): Promise<UserProfile> {
  const result = await confirmationResult.confirm(verificationCode.trim());
  const fbUser = result.user;

  if (initialDetails?.displayName || initialDetails?.photoURL) {
    try {
      await updateProfile(fbUser, {
        displayName: initialDetails.displayName || fbUser.displayName,
        photoURL: initialDetails.photoURL || fbUser.photoURL,
      });
    } catch {
      // ignore
    }
  }

  let existingProfile: Partial<UserProfile> = {};
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      existingProfile = userDocSnap.data() as Partial<UserProfile>;
    }
  } catch (readErr) {
    handleFirestoreError(readErr, OperationType.GET, `users/${fbUser.uid}`);
  }

  const profile: UserProfile = {
    uid: fbUser.uid,
    displayName:
      initialDetails?.displayName?.trim() ||
      existingProfile.displayName ||
      fbUser.displayName ||
      `Usuario (${fbUser.phoneNumber?.slice(-4) || 'Móvil'})`,
    email:
      initialDetails?.email?.trim() ||
      existingProfile.email ||
      fbUser.email ||
      `usuario.${fbUser.phoneNumber?.replace(/\D/g, '').slice(-4) || 'app'}@hypeticket.com`,
    phoneNumber: fbUser.phoneNumber || existingProfile.phoneNumber || undefined,
    photoURL:
      initialDetails?.photoURL ||
      existingProfile.photoURL ||
      fbUser.photoURL ||
      `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}`,
    role: initialDetails?.role || (existingProfile.role as UserRole) || 'user',
    company: initialDetails?.company || existingProfile.company || 'Bush Brothers Producciones',
    bio: initialDetails?.bio || existingProfile.bio || 'Asistente Verificado · Oleaje Beach Club',
    provider: 'phone',
    isRegistered: true,
    createdAt: existingProfile.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
  } catch (syncErr) {
    handleFirestoreError(syncErr, OperationType.WRITE, `users/${fbUser.uid}`);
  }

  return profile;
}

export async function logOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Firebase Auth] Error logging out:', error);
    throw error;
  }
}

export function subscribeToAuthChanges(
  onUserChanged: (user: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      onUserChanged(null);
      return;
    }

    const localSaved = getSavedLocalUser();

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserProfile;
        const merged: UserProfile = {
          ...data,
          role: (localSaved.role as UserRole) || data.role || 'user',
          displayName:
            localSaved.displayName || data.displayName || fbUser.displayName || 'Usuario Hype',
          company: localSaved.company || data.company || 'Bush Brothers Producciones',
          bio: localSaved.bio || data.bio || 'Miembro Oficial Hype Ticket',
          photoURL:
            localSaved.photoURL ||
            data.photoURL ||
            fbUser.photoURL ||
            `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}`,
          isRegistered: true,
        };
        onUserChanged(merged);
      } else {
        const defaultProfile: UserProfile = {
          uid: fbUser.uid,
          displayName: localSaved.displayName || fbUser.displayName || 'Usuario Hype',
          email: fbUser.email || localSaved.email || '',
          phoneNumber: fbUser.phoneNumber || localSaved.phoneNumber || undefined,
          photoURL:
            localSaved.photoURL ||
            fbUser.photoURL ||
            `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}`,
          role: (localSaved.role as UserRole) || 'user',
          company: localSaved.company || 'Bush Brothers Producciones',
          bio: localSaved.bio || 'Miembro Oficial Hype Ticket',
          provider: fbUser.phoneNumber ? 'phone' : 'google',
          isRegistered: true,
          createdAt: localSaved.createdAt || new Date().toISOString(),
        };
        onUserChanged(defaultProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
      const fallbackProfile: UserProfile = {
        uid: fbUser.uid,
        displayName: localSaved.displayName || fbUser.displayName || 'Usuario Hype',
        email: fbUser.email || localSaved.email || '',
        phoneNumber: fbUser.phoneNumber || localSaved.phoneNumber || undefined,
        photoURL:
          localSaved.photoURL ||
          fbUser.photoURL ||
          `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}`,
        role: (localSaved.role as UserRole) || 'user',
        company: localSaved.company || 'Bush Brothers Producciones',
        bio: localSaved.bio || 'Miembro Oficial Hype Ticket',
        provider: fbUser.phoneNumber ? 'phone' : 'google',
        isRegistered: true,
        createdAt: localSaved.createdAt || new Date().toISOString(),
      };
      onUserChanged(fallbackProfile);
    }
  });
}

export async function saveUserProfileToCloud(
  profile: Partial<UserProfile> & { uid: string }
): Promise<void> {
  try {
    if (auth.currentUser && (profile.displayName || profile.photoURL)) {
      await updateProfile(auth.currentUser, {
        displayName: profile.displayName || auth.currentUser.displayName,
        photoURL: profile.photoURL || auth.currentUser.photoURL,
      });
    }
    const cleanProfile = Object.fromEntries(
      Object.entries(profile).filter(([, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'users', profile.uid), cleanProfile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${profile.uid}`);
  }
}

/**
 * Sync an EventItem to Firestore (/events/{eventId}).
 * Avoids syncing transient blob: video URLs that only exist in the browser tab memory.
 */
export async function saveEventToCloud(event: EventItem): Promise<void> {
  try {
    const payload: Record<string, any> = { ...event };
    if (payload.videoStoryUrl && payload.videoStoryUrl.startsWith('blob:')) {
      delete payload.videoStoryUrl;
    }
    if (payload.heroImage && payload.heroImage.length > 850_000) {
      delete payload.heroImage;
    }
    await setDoc(doc(db, 'events', event.id), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${event.id}`);
  }
}

/**
 * Sync a Ticket to Firestore (/tickets/{ticketId}).
 */
export async function saveTicketToCloud(_eventId: string, ticket: Ticket): Promise<void> {
  try {
    const cleanTicket = Object.fromEntries(
      Object.entries(ticket).filter(([, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'tickets', ticket.id), cleanTicket, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `tickets/${ticket.id}`);
  }
}

/**
 * Sync a Collaborator to Firestore (/collaborators/{collabId}).
 */
export async function saveCollaboratorToCloud(collab: Collaborator): Promise<void> {
  try {
    const cleanCollab = Object.fromEntries(
      Object.entries(collab).filter(([, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'collaborators', collab.id), cleanCollab, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `collaborators/${collab.id}`);
  }
}

export async function deleteCollaboratorFromCloud(collabId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'collaborators', collabId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `collaborators/${collabId}`);
  }
}

/**
 * Real-time listener for events collection
 */
export function subscribeToEvents(
  onUpdate: (events: EventItem[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'events'),
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs.map((d) => d.data() as EventItem);
          onUpdate(items);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'events');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'events');
    return () => {};
  }
}

/**
 * Real-time listener for tickets collection
 */
export function subscribeToTickets(
  onUpdate: (tickets: Ticket[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'tickets'),
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs.map((d) => d.data() as Ticket);
          onUpdate(items);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'tickets');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'tickets');
    return () => {};
  }
}

/**
 * Real-time listener for collaborators collection
 */
export function subscribeToCollaborators(
  onUpdate: (collaborators: Collaborator[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'collaborators'),
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs.map((d) => d.data() as Collaborator);
          onUpdate(items);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'collaborators');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'collaborators');
    return () => {};
  }
}
