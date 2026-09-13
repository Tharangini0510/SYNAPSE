// =============================================================
// services/errors.js – Map Firebase Auth errors to user messages
// =============================================================

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/user-not-found': 'No account found with this email. Please sign up.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Pop-up blocked. Allow pop-ups for this site and try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with the same email using a different sign-in method.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Check Firebase console settings.',
  'auth/requires-recent-login': 'Please sign in again to complete this action.',
  'permission-denied': 'Permission denied. Please check your account permissions or try again.',
  'unavailable': 'Service is temporarily unavailable. Please try again.',
};

/**
 * Convert a Firebase (or generic) error into a readable message.
 */
export function getAuthErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';
  const code = error.code || '';
  if (AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  if (error.message && !error.message.startsWith('Firebase:')) return error.message;
  return 'Something went wrong. Please try again.';
}
