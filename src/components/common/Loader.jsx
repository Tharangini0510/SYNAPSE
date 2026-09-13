// =============================================================
// Loader.jsx – Spinner and skeleton loader components
// =============================================================
import styles from './Loader.module.css';

/** Centered spinning circle loader */
export function Spinner({ size = 24, color = 'var(--color-primary)' }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size, borderTopColor: color }}
      aria-label="Loading"
      role="status"
    />
  );
}

/** Full-page centered loader */
export function PageLoader() {
  return (
    <div className={styles.pageLoader} role="status" aria-label="Loading page">
      <Spinner size={36} />
      <span className={styles.pageLoaderText}>Loading…</span>
    </div>
  );
}

/** Skeleton placeholder block */
export function Skeleton({ width = '100%', height = 16, borderRadius = 6, className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

/** Skeleton card with multiple lines */
export function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} width="100%" />
      <Skeleton height={14} width="80%" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Skeleton height={24} width={60} borderRadius={20} />
        <Skeleton height={24} width={80} borderRadius={20} />
      </div>
    </div>
  );
}

export default Spinner;
