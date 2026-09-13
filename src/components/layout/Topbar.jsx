// =============================================================
// Topbar.jsx – Top navigation bar
// =============================================================
import { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAdaptive } from '../../contexts/AdaptiveContext';
import { useData } from '../../contexts/DataContext';
import { ADAPTIVE_MODES } from '../../utils/constants';
import styles from './Topbar.module.css';

function Topbar({ pageTitle }) {
  const { user } = useAuth();
  const { currentMode, setMode, modeConfig } = useAdaptive();
  const { notifications } = useData();
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const unread = notifications.filter((n) => !n.read);
  const badgeCount = unread.length || notifications.length;
  const displayNotifs = notifications.slice(0, 5);

  const avatarLetter = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header className={styles.topbar} role="banner">
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
      </div>

      <div className={styles.right}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search anything…"
            className={styles.searchInput}
            aria-label="Search"
          />
        </div>

        <div className={styles.modeDropdown}>
          <button
            className={styles.modeBtn}
            onClick={() => setShowModeMenu((m) => !m)}
            aria-haspopup="true"
            aria-expanded={showModeMenu}
            id="mode-switcher"
          >
            <span className={styles.modeDot} style={{ background: modeConfig.color }} />
            <span className={styles.modeLabel}>{modeConfig.label}</span>
            <ChevronDown size={14} />
          </button>

          {showModeMenu && (
            <div
              className={styles.modeMenu}
              role="menu"
              aria-labelledby="mode-switcher"
            >
              {Object.values(ADAPTIVE_MODES).map((mode) => (
                <button
                  key={mode.id}
                  className={`${styles.modeOption} ${currentMode === mode.id ? styles.modeOptionActive : ''}`}
                  role="menuitem"
                  onClick={() => { setMode(mode.id); setShowModeMenu(false); }}
                >
                  <span className={styles.modeOptionDot} style={{ background: mode.color }} />
                  <div className={styles.modeOptionText}>
                    <span className={styles.modeOptionLabel}>{mode.icon} {mode.label}</span>
                    <span className={styles.modeOptionDesc}>{mode.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.notifWrapper}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowNotif((n) => !n)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {badgeCount > 0 && (
              <span className={styles.notifBadge} aria-label={`${badgeCount} notifications`}>
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className={styles.notifPanel}>
              <div className={styles.notifHeader}>
                <span className={styles.notifTitle}>Notifications</span>
              </div>
              {displayNotifs.length === 0 ? (
                <div className={styles.notifItem}>
                  <div>
                    <p className={styles.notifText}>No notifications yet</p>
                    <span className={styles.notifTime}>You're all caught up</span>
                  </div>
                </div>
              ) : (
                displayNotifs.map((n) => (
                  <div key={n.id} className={styles.notifItem}>
                    <span className={`${styles.notifDot} ${styles[n.type] || styles.info}`} />
                    <div>
                      <p className={styles.notifText}>{n.text}</p>
                      <span className={styles.notifTime}>{n.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Link to="/profile" className={styles.userAvatar} aria-label="Profile">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" />
          ) : (
            avatarLetter
          )}
        </Link>
      </div>

      {(showModeMenu || showNotif) && (
        <div
          className={styles.overlay}
          onClick={() => { setShowModeMenu(false); setShowNotif(false); }}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

export default Topbar;
