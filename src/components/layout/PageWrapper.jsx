// =============================================================
// PageWrapper.jsx – Authenticated page shell (Sidebar + Topbar)
// =============================================================
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
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar pageTitle={title} />
        <AdaptiveModeBanner />
        <main className={styles.content} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default PageWrapper;
