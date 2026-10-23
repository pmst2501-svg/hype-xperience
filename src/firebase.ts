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
  getDocFromServer,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, UserRole } from './types/ticket';

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

// Automatically trigger handshake on module import
testFirestoreConnection().catch(() => {});

// Global reference for RecaptchaVerifier
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initializes an invisible or normal reCAPTCHA verifier for Phone Auth.
 * Automatically cleans up any previously rendered verifier instance to prevent duplication.
 */
export function getOrCreateRecaptchaVerifier(
  containerIdOrElement: string | HTMLElement = 'recaptcha-container',
  size: 'invisible' | 'normal' = 'invisible'
): RecaptchaVerifier {
  // If an active verifier exists and has not been cleared, check if it's still attached
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

/**
 * Format phone numbers to E.164 international standard (+[country code][number]).
 * Defaults to Mexican code (+52) if no plus prefix is specified.
 */
export function formatPhoneNumberE164(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // If 10 digits without code, assume Mexico (+52)
  if (cleaned.length === 10) {
    return `+52${cleaned}`;
  }
  // Otherwise prepend '+'
  return `+${cleaned}`;
}

function getSavedLocalUser(): Partial<UserProfile> {
  try {
    const raw = localStorage.getItem('hype_ticket_user_profile_v2');
    const savedRole = localStorage.getItem('hype_ticket_role_v2') as UserRole | null;
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
 * Google Sign-In with popup.
 * Authenticates via Firebase Auth, retrieves or initializes the profile in Firestore,
 * and returns the unified UserProfile.
 */
export async function signInWithGoogle(preferredRole?: UserRole): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const localSaved = getSavedLocalUser();

    // Check if user already has an existing profile in Firestore
    let existingProfile: Partial<UserProfile> = {};
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        existingProfile = userDocSnap.data() as Partial<UserProfile>;
      }
    } catch (readErr) {
      console.warn('[Firebase Auth] Could not read existing Firestore profile:', readErr);
    }

    const resolvedRole: UserRole =
      preferredRole ||
      (existingProfile.role as UserRole) ||
      (localSaved.role as UserRole) ||
      'admin';

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
      bio: existingProfile.bio || localSaved.bio || 'Productor & Miembro Oficial Hype Ticket',
      provider: 'google',
      createdAt: existingProfile.createdAt || localSaved.createdAt || new Date().toISOString(),
    };

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
    } catch (syncErr) {
      console.warn('[Firebase Auth] Firestore user sync fallback:', syncErr);
    }

    return profile;
  } catch (error: any) {
    console.error('[Firebase Auth] Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Sends an SMS verification code to the provided phone number.
 * Uses Firebase signInWithPhoneNumber with reCAPTCHA.
 */
export async function sendPhoneVerificationCode(
  rawPhoneNumber: string,
  containerIdOrElement: string | HTMLElement = 'recaptcha-container'
): Promise<ConfirmationResult> {
  try {
    const formattedPhone = formatPhoneNumberE164(rawPhoneNumber);
    const verifier = getOrCreateRecaptchaVerifier(containerIdOrElement, 'invisible');
    
    console.info(`[Firebase Auth] Requesting SMS verification code for: ${formattedPhone}`);
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    return confirmationResult;
  } catch (error: any) {
    console.error('[Firebase Auth] Error sending phone verification code:', error);
    // Reset verifier so it can be re-rendered cleanly on retry
    if (activeRecaptchaVerifier) {
      try {
        activeRecaptchaVerifier.clear();
      } catch (e) {
        console.debug(e);
      }
      activeRecaptchaVerifier = null;
    }
    throw error;
  }
}

/**
 * Confirms the SMS code entered by the user.
 * Upon successful authentication, creates or updates the user profile in Firestore
 * and returns the unified UserProfile.
 */
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
  try {
    const result = await confirmationResult.confirm(verificationCode.trim());
    const fbUser = result.user;

    // Optionally update auth user display name / photo
    if (initialDetails?.displayName || initialDetails?.photoURL) {
      try {
        await updateProfile(fbUser, {
          displayName: initialDetails.displayName || fbUser.displayName,
          photoURL: initialDetails.photoURL || fbUser.photoURL,
        });
      } catch (e) {
        console.debug('[Firebase Auth] updateProfile notice:', e);
      }
    }

    // Check if user already exists in Firestore
    let existingProfile: Partial<UserProfile> = {};
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        existingProfile = userDocSnap.data() as Partial<UserProfile>;
      }
    } catch (readErr) {
      console.warn('[Firebase Auth] Could not read existing Firestore profile:', readErr);
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
      phoneNumber: fbUser.phoneNumber || initialDetails?.email || existingProfile.phoneNumber || undefined,
      photoURL:
        initialDetails?.photoURL ||
        existingProfile.photoURL ||
        fbUser.photoURL ||
        `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}`,
      role: initialDetails?.role || (existingProfile.role as UserRole) || 'user',
      company: initialDetails?.company || existingProfile.company || 'Bush Brothers Producciones',
      bio: initialDetails?.bio || existingProfile.bio || 'Usuario registrado con autenticación móvil',
      provider: 'phone',
      createdAt: existingProfile.createdAt || new Date().toISOString(),
    };

    // Save/update in Firestore
    try {
      await setDoc(doc(db, 'users', fbUser.uid), profile, { merge: true });
    } catch (syncErr) {
      console.warn('[Firebase Auth] Firestore user sync fallback:', syncErr);
    }

    return profile;
  } catch (error: any) {
    console.error('[Firebase Auth] Error confirming verification code:', error);
    throw error;
  }
}

/**
 * Signs out the currently authenticated Firebase user.
 */
export async function logOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
    console.info('[Firebase Auth] User successfully logged out');
  } catch (error) {
    console.error('[Firebase Auth] Error logging out:', error);
    throw error;
  }
}

/**
 * Subscribes to Firebase Auth state changes and syncs with Firestore profile.
 */
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
          role: (localSaved.role as UserRole) || data.role || 'admin',
          displayName: localSaved.displayName || data.displayName || fbUser.displayName || 'Usuario Hype',
          company: localSaved.company || data.company || 'Bush Brothers Producciones',
          bio: localSaved.bio || data.bio || 'Productor & Miembro Oficial Hype Ticket',
          photoURL: localSaved.photoURL || data.photoURL || fbUser.photoURL || `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}`,
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
          role: (localSaved.role as UserRole) || 'admin',
          company: localSaved.company || 'Bush Brothers Producciones',
          bio: localSaved.bio || 'Productor & Miembro Oficial Hype Ticket',
          provider: fbUser.phoneNumber ? 'phone' : 'google',
          createdAt: localSaved.createdAt || new Date().toISOString(),
        };
        onUserChanged(defaultProfile);
      }
    } catch (err) {
      console.warn('[Firebase Auth] Error resolving user profile from Firestore:', err);
      const fallbackProfile: UserProfile = {
        uid: fbUser.uid,
        displayName: localSaved.displayName || fbUser.displayName || 'Usuario Hype',
        email: fbUser.email || localSaved.email || '',
        phoneNumber: fbUser.phoneNumber || localSaved.phoneNumber || undefined,
        photoURL:
          localSaved.photoURL ||
          fbUser.photoURL ||
          `https://api.dicebear.com/7.x/micah/svg?seed=${fbUser.uid}`,
        role: (localSaved.role as UserRole) || 'admin',
        company: localSaved.company || 'Bush Brothers Producciones',
        bio: localSaved.bio || 'Productor & Miembro Oficial Hype Ticket',
        provider: fbUser.phoneNumber ? 'phone' : 'google',
        createdAt: localSaved.createdAt || new Date().toISOString(),
      };
      onUserChanged(fallbackProfile);
    }
  });
}

/**
 * Save or update user profile to Firestore
 */
export async function saveUserProfileToCloud(profile: Partial<UserProfile> & { uid: string }): Promise<void> {
  try {
    if (auth.currentUser && (profile.displayName || profile.photoURL)) {
      await updateProfile(auth.currentUser, {
        displayName: profile.displayName || auth.currentUser.displayName,
        photoURL: profile.photoURL || auth.currentUser.photoURL,
      });
    }
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    console.info('[Firebase Firestore] User profile updated for UID:', profile.uid);
  } catch (err) {
    console.warn('[Firebase Firestore] Could not save user profile to cloud:', err);
  }
}

/**
 * Sync wristband verification to Firestore
 */
export async function saveWristbandToCloud(eventId: string, record: any): Promise<void> {
  try {
    await setDoc(doc(db, 'events', eventId, 'wristbands', record.id), record);
  } catch (err) {
    console.warn('[Firebase] Wristband cloud sync fallback:', err);
  }
}

/**
 * Sync ticket to Firestore
 */
export async function saveTicketToCloud(eventId: string, ticket: any): Promise<void> {
  try {
    await setDoc(doc(db, 'events', eventId, 'tickets', ticket.id), ticket);
  } catch (err) {
    console.warn('[Firebase] Ticket cloud sync fallback:', err);
  }
}
