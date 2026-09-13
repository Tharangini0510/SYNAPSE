// =============================================================
// Card.jsx – Reusable card / surface component
// =============================================================
import styles from './Card.module.css';

/**
 * Card component — a styled surface container.
 *
 * @param {'default'|'glass'|'flat'|'bordered'} variant
 * @param {boolean} hoverable - Adds hover lift effect
 * @param {string}  padding   - CSS padding override
 */
function Card({ children, variant = 'default', hoverable = false, className = '', style, ...props }) {
  const classes = [
    styles.card,
    styles[variant],
    hoverable ? styles.hoverable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} {...props}>
      {children}
    </div>
  );
}

export default Card;
