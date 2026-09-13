// =============================================================
// helpers.js – General utility functions
// =============================================================

/**
 * Format a Date object to a short readable string.
 * e.g. "Mon, 25 Jul"
 */
export function formatDateShort(date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

/**
 * Format a Date object to a full readable string.
 * e.g. "Friday, 25 July 2026"
 */
export function formatDateFull(date) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format seconds into MM:SS display.
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Get a greeting based on the time of day.
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Calculate password strength score (0–4).
 * 0 = very weak, 4 = very strong
 */
export function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

/**
 * Returns label and color for password strength score.
 */
export function getPasswordStrengthLabel(score) {
  const levels = [
    { label: 'Very Weak', color: '#EF4444' },
    { label: 'Weak',      color: '#F97316' },
    { label: 'Fair',      color: '#F59E0B' },
    { label: 'Strong',    color: '#10B981' },
    { label: 'Very Strong', color: '#059669' },
  ];
  return levels[score] ?? levels[0];
}

/**
 * Generate a random ID string.
 */
export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get all days in a given month.
 * @param {number} year
 * @param {number} month - 0-indexed (January = 0)
 * @returns {Date[]}
 */
export function getDaysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

/**
 * Get the first day of the week (0=Sun) for a given month.
 */
export function getMonthStartDay(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Check if two dates fall on the same calendar day.
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/**
 * Truncate a string to maxLen characters.
 */
export function truncate(str, maxLen = 60) {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
