// =============================================================
// LandingNav.jsx – Premium Glass Navigation Bar for Landing Page
// =============================================================
import { Link } from 'react-router-dom';
import { Zap, Sun, Moon, ArrowRight } from 'lucide-react';
import styles from './LandingNav.module.css';

export default function LandingNav({ theme, toggleTheme }) {
  const scrollToSection = (e, id) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {/* Brand Logo */}
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Zap size={20} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span className={styles.logoText}>SYNAPSE</span>
        </Link>

        {/* Section Links */}
        <ul className={styles.links}>
          <li>
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, 'features')}
              className={styles.link}
            >
              Features
            </a>
          </li>
          <li>
            <a
              href="#demo"
              onClick={(e) => scrollToSection(e, 'demo')}
              className={styles.link}
            >
              Workspace
            </a>
          </li>
          <li>
            <a
              href="#modes"
              onClick={(e) => scrollToSection(e, 'modes')}
              className={styles.link}
            >
              Adaptive Modes
            </a>
          </li>
          <li>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, 'faq')}
              className={styles.link}
            >
              FAQ
            </a>
          </li>
        </ul>

        {/* Header Actions */}
        <div className={styles.actions}>
          {/* Dark/Light mode theme toggle button */}
          <button
            onClick={toggleTheme}
            className={styles.themeBtn}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} color="#FBBF24" />
            ) : (
              <Moon size={18} color="#4F46E5" />
            )}
          </button>

          <Link to="/login" className={styles.loginBtn}>
            Log In
          </Link>

          <Link to="/signup" className={styles.getStartedBtn}>
            <span>Get Started</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
