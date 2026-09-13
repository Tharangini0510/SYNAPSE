// =============================================================
// AdaptiveContext.jsx – Academic mode synced to Firestore user
// =============================================================
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { ADAPTIVE_MODES } from '../utils/constants';
import { useAuth } from './AuthContext';
import { updateUserProfile } from '../services/userService';

const AdaptiveContext = createContext(null);

const PREFERENCES = new Set(['aggressive', 'balanced', 'gentle', 'manual']);

export function AdaptiveProvider({ children }) {
  const { user, firebaseUser } = useAuth();

  const currentMode = user?.adaptiveSettings?.mode || 'normal';
  const studyPreference =
    (PREFERENCES.has(user?.studyPreference) && user.studyPreference) ||
    (PREFERENCES.has(user?.settings?.studyPreference) && user.settings.studyPreference) ||
    'balanced';
  const isDark =
    !!user?.settings?.darkMode || user?.theme === 'dark';

  const setupData = useMemo(
    () => ({
      university: user?.university || '',
      major: user?.course || '',
      year: user?.semester || '',
      semesterStart: user?.adaptiveSettings?.semesterStart || '',
      semesterEnd: user?.adaptiveSettings?.semesterEnd || '',
    }),
    [user]
  );

  // Apply saved settings to the document so CSS themes take effect app-wide
  useEffect(() => {
    const root = document.documentElement;
    if (!user) {
      root.setAttribute('data-mode', 'normal');
      root.removeAttribute('data-preference');
      root.setAttribute('data-theme', 'light');
      return;
    }
    root.setAttribute('data-mode', currentMode);
    root.setAttribute('data-preference', studyPreference);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [user, currentMode, studyPreference, isDark]);

  const setMode = useCallback(
    async (modeId) => {
      if (!ADAPTIVE_MODES[modeId] || !firebaseUser) return;
      // Partial nested update — userService merges with Firestore (preserves dates)
      await updateUserProfile(firebaseUser.uid, {
        adaptiveSettings: { mode: modeId },
      });
    },
    [firebaseUser]
  );

  const updateSetupData = useCallback(
    async (data) => {
      if (!firebaseUser) return;
      const patch = {};
      if (data.university !== undefined) patch.university = data.university;
      if (data.major !== undefined) patch.course = data.major;
      if (data.year !== undefined) patch.semester = data.year;
      if (
        data.semesterStart !== undefined ||
        data.semesterEnd !== undefined ||
        data.mode !== undefined
      ) {
        // Only include changed keys; merge in userService keeps the rest
        patch.adaptiveSettings = {
          ...(data.mode !== undefined ? { mode: data.mode } : {}),
          ...(data.semesterStart !== undefined
            ? { semesterStart: data.semesterStart }
            : {}),
          ...(data.semesterEnd !== undefined
            ? { semesterEnd: data.semesterEnd }
            : {}),
        };
      }
      if (Object.keys(patch).length) {
        await updateUserProfile(firebaseUser.uid, patch);
      }
    },
    [firebaseUser]
  );

  const value = useMemo(
    () => ({
      currentMode,
      modeConfig: ADAPTIVE_MODES[currentMode] ?? ADAPTIVE_MODES.normal,
      allModes: ADAPTIVE_MODES,
      setMode,
      setupData,
      updateSetupData,
    }),
    [currentMode, setMode, setupData, updateSetupData]
  );

  return (
    <AdaptiveContext.Provider value={value}>{children}</AdaptiveContext.Provider>
  );
}

export function useAdaptive() {
  const context = useContext(AdaptiveContext);
  if (!context) {
    throw new Error('useAdaptive must be used inside <AdaptiveProvider>');
  }
  return context;
}
