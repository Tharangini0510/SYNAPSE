// =============================================================
// Button.jsx – Reusable button component
// =============================================================
import styles from './Button.module.css';

/**
 * Button component with multiple variants, sizes, and loading state.
 *
 * @param {'primary'|'secondary'|'ghost'|'danger'|'accent'} variant
 * @param {'sm'|'md'|'lg'|'xl'} size
 * @param {boolean} loading  - Shows spinner when true
 * @param {boolean} fullWidth
 * @param {React.ReactNode} children
 * @param {string} className - Additional class names
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  type = 'button',
  spinnerDark = false,
  ...props
}) {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={loading || props.disabled} {...props}>
      {loading && (
        <span
          className={`${styles.spinner} ${spinnerDark ? styles.spinnerDark : ''}`}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

export default Button;
