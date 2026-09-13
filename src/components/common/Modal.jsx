// =============================================================
// Modal.jsx – Overlay dialog with animation
// =============================================================
import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * Modal dialog with backdrop, close button, and keyboard support.
 *
 * @param {boolean} isOpen    - Controls visibility
 * @param {Function} onClose  - Called when modal should close
 * @param {string} title      - Modal heading
 * @param {string} size       - 'sm'|'md'|'lg'
 */
function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className={`${styles.modal} ${styles[size]} ${className}`}>
        {/* Header */}
        {title && (
          <div className={styles.header}>
            <h3 id="modal-title" className={styles.title}>{title}</h3>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
