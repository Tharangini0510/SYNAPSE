// =============================================================
// AuthContext.jsx – Firebase Authentication + user profile
// =============================================================
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
} from '../services/authService';
import {
  ensureUserDocument,
  subscribeToUserProfile,
  updateUserProfile,
} from '../services/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Persist auth session via Firebase; hydrate Firestore profile
  useEffect(() => {
    let unsubProfile = null;

    const unsubAuth = subscribeToAuth(async (fbUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setFirebaseUser(fbUser);

      if (!fbUser) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      try {
        const profile = await ensureUserDocument(fbUser);
        setUser(profile);
        unsubProfile = subscribeToUserProfile(
          fbUser.uid,
          (live) => {
            if (live) setUser(live);
          },
          (err) => {
            console.warn('User profile subscription notice:', err);
          }
        );
      } catch (err) {
        console.error('Failed to load user profile', err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const { user: fbUser, profile } = await loginWithEmail(email, password);
      // Set uid immediately so DataContext can subscribe before onAuthStateChanged
      setFirebaseUser(fbUser);
      setUser(profile);
      return profile;
    } catch (err) {
      setAuthError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async ({ name, email, password, university }) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const { user: fbUser, profile } = await registerWithEmail({
        name,
        email,
        password,
        university,
      });
      setFirebaseUser(fbUser);
      setUser(profile);
      return profile;
    } catch (err) {
      setAuthError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setAuthError('');
    try {
      const { user: fbUser, profile } = await loginWithGoogle();
      setFirebaseUser(fbUser);
      setUser(profile);
      return profile;
    } catch (err) {
      setAuthError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setAuthError('');
    try {
      await logoutUser();
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeSetup = useCallback(
    async (setupPayload = {}) => {
      if (!firebaseUser) return;
      // Only write provided/non-empty fields so Skip/empty values cannot wipe Firestore
      const patch = {
        setupCompleted: true,
        studyPreference:
          setupPayload.studyPreference || user?.studyPreference || 'balanced',
        adaptiveSettings: {
          mode: setupPayload.mode || user?.adaptiveSettings?.mode || 'normal',
        },
      };
      const course = setupPayload.major || setupPayload.course || user?.course;
      if (course) patch.course = course;
      const semester = setupPayload.year || setupPayload.semester || user?.semester;
      if (semester) patch.semester = semester;
      if (setupPayload.semesterStart) {
        patch.adaptiveSettings.semesterStart = setupPayload.semesterStart;
      }
      if (setupPayload.semesterEnd) {
        patch.adaptiveSettings.semesterEnd = setupPayload.semesterEnd;
      }
      if (setupPayload.university) patch.university = setupPayload.university;

      const profile = await updateUserProfile(firebaseUser.uid, patch);
      setUser(profile);
    },
    [firebaseUser, user]
  );

  const refreshProfile = useCallback(
    async (patch) => {
      if (!firebaseUser) return null;
      const profile = await updateUserProfile(firebaseUser.uid, patch);
      setUser(profile);
      return profile;
    },
    [firebaseUser]
  );

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      isAuthenticated: !!firebaseUser,
      // Existing users (flag or established profile) never re-enter onboarding
      isFirstTime: authReady && !!firebaseUser && !!user && !user.setupCompleted,
      authReady,
      isLoading,
      authError,
      login,
      signUp,
      signInWithGoogle,
      logout,
      completeSetup,
      refreshProfile,
      setAuthError,
    }),
    [
      user,
      firebaseUser,
      authReady,
      isLoading,
      authError,
      login,
      signUp,
      signInWithGoogle,
      logout,
      completeSetup,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
