// =============================================================
// services/authService.js – Firebase Authentication operations
// =============================================================
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getAuthErrorMessage } from './errors';
import { ensureUserDocument } from './userService';

const googleProvider = new GoogleAuthProvider();

/**
 * Register with email/password and ensure Firestore user doc exists.
 */
export async function registerWithEmail({ name, email, password, university = '' }) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    const profile = await ensureUserDocument(credential.user, {
      displayName: name,
      university,
      setupCompleted: false,
    });
    return { user: credential.user, profile };
  } catch (error) {
    throw Object.assign(new Error(getAuthErrorMessage(error)), { code: error.code });
  }
}

/**
 * Sign in with email/password.
 */
export async function loginWithEmail(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await ensureUserDocument(credential.user);
    return { user: credential.user, profile };
  } catch (error) {
    throw Object.assign(new Error(getAuthErrorMessage(error)), { code: error.code });
  }
}

/**
 * Sign in / sign up with Google popup.
 */
export async function loginWithGoogle() {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const isNew =
      credential.user.metadata?.creationTime === credential.user.metadata?.lastSignInTime;
    const profile = await ensureUserDocument(credential.user, {
      setupCompleted: isNew ? false : undefined,
    });
    return { user: credential.user, profile };
  } catch (error) {
    throw Object.assign(new Error(getAuthErrorMessage(error)), { code: error.code });
  }
}

/**
 * Sign out current user.
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw Object.assign(new Error(getAuthErrorMessage(error)), { code: error.code });
  }
}

/**
 * Subscribe to Firebase auth state changes.
 */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
