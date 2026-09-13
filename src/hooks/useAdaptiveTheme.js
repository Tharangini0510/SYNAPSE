// =============================================================
// useAdaptiveTheme.js – Hook to get current mode tokens
// =============================================================
import { useAdaptive } from '../contexts/AdaptiveContext';

/**
 * Returns convenient theme tokens derived from the current mode.
 * Components can use these to apply dynamic inline styles where
 * CSS variables alone aren't sufficient.
 */
function useAdaptiveTheme() {
  const { currentMode, modeConfig } = useAdaptive();

  return {
    mode: currentMode,
    label: modeConfig.label,
    color: modeConfig.color,
    icon: modeConfig.icon,
    description: modeConfig.description,
    isExam:     currentMode === 'exam',
    isDeadline: currentMode === 'deadline',
    isFocus:    currentMode === 'focus',
    isNormal:   currentMode === 'normal',
  };
}

export default useAdaptiveTheme;
