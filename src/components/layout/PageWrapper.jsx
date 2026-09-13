// =============================================================
// PageWrapper.jsx – Authenticated page shell (Sidebar + Topbar)
// =============================================================
import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AdaptiveModeBanner from './AdaptiveModeBanner';
import styles from './PageWrapper.module.css';

/**
 * PageWrapper wraps every authenticated page with the
 * Sidebar, Topbar, and AdaptiveModeBanner.
 *
 * @param {string} title - Page title shown in the Topbar
 */
function PageWrapper({ children, title }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className={styles.shell}>
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={closeMobileMenu} />
      <div className={styles.main}>
        <Topbar pageTitle={title} onToggleMobileMenu={toggleMobileMenu} />
        <AdaptiveModeBanner />
        <main className={styles.content} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default PageWrapper;
