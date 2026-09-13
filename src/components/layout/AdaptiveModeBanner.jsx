// =============================================================
// AdaptiveModeBanner.jsx – Contextual banner for current mode
// =============================================================
import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { useAdaptive } from '../../contexts/AdaptiveContext';
import styles from './AdaptiveModeBanner.module.css';

/** Mode-specific tip messages */
const MODE_TIPS = {
  normal: "You're in Normal Semester mode. Stay consistent and keep building good habits.",
  exam: "📝 Exam Week — Prioritise past papers, limit new content. Review beats reading.",
  deadline: "🔥 Deadline mode active — focus on completing deliverables. No new tasks today.",
  focus: "🎯 Focus mode — distractions are hidden. Deep work time. You've got this.",
};

function AdaptiveModeBanner() {
  const { modeConfig, currentMode } = useAdaptive();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || currentMode === 'normal') return null;

  return (
    <div
      className={styles.banner}
      role="status"
      aria-label={`Current mode: ${modeConfig.label}`}
    >
      <div className={styles.inner}>
        <span className={styles.icon} aria-hidden="true">
          <Info size={15} />
        </span>
        <p className={styles.text}>
          <strong className={styles.modeName}>{modeConfig.icon} {modeConfig.label}:</strong>{' '}
          {MODE_TIPS[currentMode]}
        </p>
        <button
          className={styles.closeBtn}
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default AdaptiveModeBanner;
