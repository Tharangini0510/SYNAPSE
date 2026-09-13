// =============================================================
// SplashScreen.jsx – Animated loading / brand screen
// =============================================================
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './SplashScreen.module.css';

function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, isFirstTime, authReady } = useAuth();

  useEffect(() => {
    if (!authReady) return undefined;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate(isFirstTime ? '/setup' : '/dashboard', { replace: true });
      } else {
        navigate('/welcome', { replace: true });
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated, isFirstTime, authReady]);

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logo}>
          <Zap size={40} color="#fff" strokeWidth={2.5} />
        </div>

        {/* Brand name */}
        <h1 className={styles.brandName}>Synapse</h1>
        <p className={styles.tagline}>Adaptive Learning Workspace</p>

        {/* Loading dots */}
        <div className={styles.dots} aria-label="Loading" role="status">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
