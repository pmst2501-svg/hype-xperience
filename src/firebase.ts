import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  getDocs,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  UserProfile,
  UserRole,
  EventItem,
  Ticket,
  Collaborator,
  OrganizerProfile,
  StripeOrder,
} from './types/ticket';
import { LEGACY_DEMO_IDS, LEGACY_DEMO_EMAILS } from './data/mockData';

const CURRENT_SCHEMA_VERSION = 5;

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

/**
 * Purges any pre-v4 legacy demo documents from Firestore so only accounts, organizations,
 * events, staff, and tickets registered from zero (schemaVersion === 4) remain.
 */
export async function purgeLegacyDemoDataFromCloud(): Promise<void> {
  const targetCollections = ['users', 'organizers', 'events', 'collaborators', 'tickets'];
  try {
    for (const colName of targetCollections) {
      const snap = await getDocs(collection(db, colName));
      const deletions: Promise<void>[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const emailLower = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
        if (
          data?.schemaVersion !== CURRENT_SCHEMA_VERSION ||
          LEGACY_DEMO_IDS.has(docSnap.id) ||
          (emailLower && LEGACY_DEMO_EMAILS.has(emailLower))
        ) {
          deletions.push(deleteDoc(doc(db, colName, docSnap.id)));
        }
      });
      if (deletions.length > 0) {
        await Promise.allSettled(deletions);
      }
    }
  } catch {
    // Ignore errors during background cleanup
  }
}

testFirestoreConnection().catch(() => {});
purgeLegacyDemoDataFromCloud().catch(() => {});

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
    const raw = localStorage.getItem('hype_ticket_user_profile_v5');
    const savedRole = localStorage.getItem('hype_ticket_role_v5') as UserRole | null;
    const parsed = raw ? (JSON.parse(raw) as Partial<UserProfile>) : {};
    if (savedRole && !parsed.role) {
      parsed.role = savedRole;
    }
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Attempts to register a new user in Firebase Auth with email and password,
 * and always saves the complete profile to Firestore (/users/{uid}) with schemaVersion: 4.
 */
export async function registerUserWithEmailInCloud(
  profile: UserProfile,
  rawPassword: string
): Promise<UserProfile> {
  let finalProfile = { ...profile };
  try {
    const cred = await createUserWithEmailAndPassword(auth, profile.email, rawPassword);
    if (cred.user) {
      finalProfile = { ...profile, uid: cred.user.uid };
      try {
        await updateProfile(cred.user, {
          displayName: profile.displayName,
        });
      } catch {
        // ignore
      }
    }
  } catch (err: any) {
    console.info('[Firebase Auth] Using Firestore credential persistence:', err?.code || err?.message);
  }

  await saveUserProfileToCloud(finalProfile);
  return finalProfile;
}

/**
 * Attempts to sign in via Firebase Auth with email and password.
 */
export async function signInWithEmailInCloud(
  email: string,
  rawPassword: string
): Promise<FirebaseUser | null> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), rawPassword);
    return cred.user;
  } catch {
    return null;
  }
}

export async function signInWithGoogle(preferredRole?: UserRole): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const localSaved = getSavedLocalUser();

  let existingProfile: Partial<UserProfile> = {};
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      if (data?.schemaVersion === CURRENT_SCHEMA_VERSION) {
        existingProfile = data as Partial<UserProfile>;
      }
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
      'Usuario Verificado',
    email: fbUser.email || existingProfile.email || localSaved.email || '',
    phoneNumber:
      fbUser.phoneNumber || existingProfile.phoneNumber || localSaved.phoneNumber || undefined,
    photoURL:
      existingProfile.photoURL ||
      fbUser.photoURL ||
      localSaved.photoURL ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || 'HT')}`,
    role: resolvedRole,
    company: existingProfile.company || localSaved.company || '',
    bio: existingProfile.bio || localSaved.bio || 'Cuenta autenticada con Google',
    provider: 'google',
    isRegistered: true,
    createdAt: existingProfile.createdAt || localSaved.createdAt || new Date().toISOString(),
  };

  await saveUserProfileToCloud(profile);
  return profile;
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

  const profile: UserProfile = {
    uid: fbUser.uid,
    displayName:
      initialDetails?.displayName?.trim() ||
      fbUser.displayName ||
      `Usuario (${fbUser.phoneNumber?.slice(-4) || 'Móvil'})`,
    email: initialDetails?.email?.trim() || fbUser.email || '',
    phoneNumber: fbUser.phoneNumber || undefined,
    photoURL:
      initialDetails?.photoURL ||
      fbUser.photoURL ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${fbUser.uid}`,
    role: initialDetails?.role || 'user',
    company: initialDetails?.company || '',
    bio: initialDetails?.bio || 'Cuenta autenticada por SMS',
    provider: 'phone',
    isRegistered: true,
    createdAt: new Date().toISOString(),
  };

  await saveUserProfileToCloud(profile);
  return profile;
}

export async function logOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('[Firebase Auth] Error logging out:', error);
  }
}

export function subscribeToAuthChanges(
  onUserChanged: (user: UserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      return;
    }

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (
          data?.schemaVersion === CURRENT_SCHEMA_VERSION &&
          !LEGACY_DEMO_IDS.has(data.uid)
        ) {
          onUserChanged({ ...(data as UserProfile), isRegistered: true });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
    }
  });
}

export async function saveUserProfileToCloud(
  profile: Partial<UserProfile> & { uid: string }
): Promise<void> {
  if (!profile.uid || LEGACY_DEMO_IDS.has(profile.uid)) return;
  try {
    const cleanProfile: Record<string, any> = Object.fromEntries(
      Object.entries(profile).filter(([, v]) => v !== undefined)
    );
    cleanProfile.schemaVersion = CURRENT_SCHEMA_VERSION;
    if (cleanProfile.photoURL && cleanProfile.photoURL.length > 800_000) {
      cleanProfile.photoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        cleanProfile.displayName || 'HT'
      )}`;
    }
    await setDoc(doc(db, 'users', profile.uid), cleanProfile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${profile.uid}`);
  }
}

export async function saveOrganizerToCloud(organizer: OrganizerProfile): Promise<void> {
  if (!organizer.id || LEGACY_DEMO_IDS.has(organizer.id)) return;
  try {
    const cleanOrg: Record<string, any> = Object.fromEntries(
      Object.entries(organizer).filter(([, v]) => v !== undefined)
    );
    cleanOrg.schemaVersion = CURRENT_SCHEMA_VERSION;
    if (cleanOrg.avatar && cleanOrg.avatar.length > 800_000) {
      delete cleanOrg.avatar;
    }
    if (cleanOrg.coverImage && cleanOrg.coverImage.length > 800_000) {
      delete cleanOrg.coverImage;
    }
    await setDoc(doc(db, 'organizers', organizer.id), cleanOrg, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `organizers/${organizer.id}`);
  }
}

export async function saveEventToCloud(event: EventItem): Promise<void> {
  if (!event.id || event.id === 'evt-template' || LEGACY_DEMO_IDS.has(event.id)) return;
  try {
    const payload: Record<string, any> = { ...event, schemaVersion: CURRENT_SCHEMA_VERSION };
    if (payload.videoStoryUrl && payload.videoStoryUrl.startsWith('blob:')) {
      delete payload.videoStoryUrl;
    }
    if (payload.heroImage && payload.heroImage.length > 800_000) {
      delete payload.heroImage;
    }
    await setDoc(doc(db, 'events', event.id), payload, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${event.id}`);
  }
}

export async function deleteEventFromCloud(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `events/${eventId}`);
  }
}

export async function saveTicketToCloud(_eventId: string, ticket: Ticket): Promise<void> {
  if (!ticket.id || LEGACY_DEMO_IDS.has(ticket.id)) return;
  try {
    const cleanTicket: Record<string, any> = Object.fromEntries(
      Object.entries(ticket).filter(([, v]) => v !== undefined)
    );
    cleanTicket.schemaVersion = CURRENT_SCHEMA_VERSION;
    await setDoc(doc(db, 'tickets', ticket.id), cleanTicket, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `tickets/${ticket.id}`);
  }
}

export async function saveCollaboratorToCloud(collab: Collaborator): Promise<void> {
  if (!collab.id || LEGACY_DEMO_IDS.has(collab.id)) return;
  try {
    const cleanCollab: Record<string, any> = Object.fromEntries(
      Object.entries(collab).filter(([, v]) => v !== undefined)
    );
    cleanCollab.schemaVersion = CURRENT_SCHEMA_VERSION;
    if (cleanCollab.avatar && cleanCollab.avatar.length > 800_000) {
      delete cleanCollab.avatar;
    }
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

export async function saveStripeOrderToCloud(order: StripeOrder): Promise<void> {
  if (!order.id) return;
  try {
    const cleanOrder: Record<string, any> = Object.fromEntries(
      Object.entries(order).filter(([, v]) => v !== undefined)
    );
    cleanOrder.schemaVersion = CURRENT_SCHEMA_VERSION;
    await setDoc(doc(db, 'orders', order.id), cleanOrder, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
  }
}

/**
 * Real-time listener for registered users (/users)
 */
export function subscribeToUsers(
  onUpdate: (users: UserProfile[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as UserProfile & { schemaVersion?: number })
          .filter(
            (u) =>
              u &&
              u.uid &&
              u.schemaVersion === CURRENT_SCHEMA_VERSION &&
              !LEGACY_DEMO_IDS.has(u.uid) &&
              !LEGACY_DEMO_EMAILS.has((u.email || '').trim().toLowerCase())
          );
        onUpdate(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
    return () => {};
  }
}

/**
 * Real-time listener for registered organizers (/organizers)
 */
export function subscribeToOrganizers(
  onUpdate: (organizers: OrganizerProfile[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'organizers'),
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as OrganizerProfile & { schemaVersion?: number })
          .filter(
            (o) =>
              o &&
              o.id &&
              o.schemaVersion === CURRENT_SCHEMA_VERSION &&
              !LEGACY_DEMO_IDS.has(o.id)
          );
        onUpdate(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'organizers');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'organizers');
    return () => {};
  }
}

/**
 * Real-time listener for events collection (/events)
 */
export function subscribeToEvents(
  onUpdate: (events: EventItem[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'events'),
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as EventItem & { schemaVersion?: number })
          .filter(
            (e) =>
              e &&
              e.id &&
              e.id !== 'evt-template' &&
              e.schemaVersion === CURRENT_SCHEMA_VERSION &&
              !LEGACY_DEMO_IDS.has(e.id)
          );
        onUpdate(items);
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
 * Real-time listener for tickets collection (/tickets)
 */
export function subscribeToTickets(
  onUpdate: (tickets: Ticket[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'tickets'),
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as Ticket & { schemaVersion?: number })
          .filter(
            (t) =>
              t &&
              t.id &&
              t.schemaVersion === CURRENT_SCHEMA_VERSION &&
              !LEGACY_DEMO_IDS.has(t.id)
          );
        onUpdate(items);
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
 * Real-time listener for collaborators collection (/collaborators)
 */
export function subscribeToCollaborators(
  onUpdate: (collaborators: Collaborator[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'collaborators'),
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as Collaborator & { schemaVersion?: number })
          .filter(
            (c) =>
              c &&
              c.id &&
              c.schemaVersion === CURRENT_SCHEMA_VERSION &&
              !LEGACY_DEMO_IDS.has(c.id)
          );
        onUpdate(items);
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

/**
 * Real-time listener for Stripe orders collection (/orders)
 */
export function subscribeToStripeOrders(
  onUpdate: (orders: StripeOrder[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const items = snap.docs
          .map((d) => d.data() as StripeOrder & { schemaVersion?: number })
          .filter((o) => o && o.id && o.schemaVersion === CURRENT_SCHEMA_VERSION);
        onUpdate(items);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'orders');
    return () => {};
  }
}
