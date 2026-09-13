// =============================================================
// Divider.jsx – Horizontal rule with optional label
// =============================================================
import styles from './Divider.module.css';

function Divider({ label, className = '' }) {
  if (label) {
    return (
      <div className={`${styles.withLabel} ${className}`} role="separator">
        <span className={styles.line} />
        <span className={styles.label}>{label}</span>
        <span className={styles.line} />
      </div>
    );
  }
  return <hr className={`${styles.divider} ${className}`} />;
}

export default Divider;
