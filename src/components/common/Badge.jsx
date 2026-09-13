// =============================================================
// Badge.jsx – Status pill / label component
// =============================================================
import styles from './Badge.module.css';

/**
 * Badge component for status labels, tags, and counts.
 *
 * @param {'success'|'warning'|'danger'|'info'|'neutral'|'primary'} variant
 * @param {'sm'|'md'} size
 */
function Badge({ children, variant = 'neutral', size = 'md', className = '' }) {
  const classes = [styles.badge, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}

export default Badge;
