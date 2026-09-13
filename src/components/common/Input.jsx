// =============================================================
// Input.jsx – Reusable input component
// =============================================================
import { useState, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import styles from './Input.module.css';

/**
 * Input component with label, icon support, show/hide password,
 * error state, and helper text.
 *
 * @param {string}  label       - Field label text
 * @param {string}  error       - Error message (renders error state if non-empty)
 * @param {string}  helperText  - Optional hint below the input
 * @param {React.ReactNode} iconLeft  - Icon element for left side
 * @param {boolean} showToggle  - If true, renders an eye toggle (for password fields)
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    iconLeft,
    type = 'text',
    showToggle = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const resolvedType = showToggle ? (showPassword ? 'text' : 'password') : type;

  const wrapperClasses = [
    styles.wrapper,
    error ? styles.error : '',
    iconLeft ? styles.hasLeftIcon : '',
    showToggle ? styles.hasRightIcon : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {/* Left icon */}
        {iconLeft && (
          <span className={styles.iconLeft} aria-hidden="true">
            {iconLeft}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {/* Show/Hide password toggle */}
        {showToggle && (
          <button
            type="button"
            className={styles.iconRight}
            onClick={() => setShowPassword(p => !p)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <span id={`${inputId}-error`} className={styles.errorMessage} role="alert">
          <AlertCircle size={12} />
          {error}
        </span>
      )}

      {/* Helper text (only when no error) */}
      {helperText && !error && (
        <span id={`${inputId}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  );
});

export default Input;
