// =============================================================
// LoginPage.jsx – Premium Glassmorphic Sign In Page
// =============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Divider from '../components/common/Divider';
import NeuralBackground from '../components/landing/NeuralBackground';
import { isValidEmail } from '../utils/helpers';
import styles from './LoginPage.module.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login, signInWithGoogle, isLoading, authError, setAuthError } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  /** Update a single form field and clear its error */
  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: '' }));
    setAuthError('');
  };

  /** Client-side validation */
  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required.';
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    return errs;
  };

  /** Handle form submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const profile = await login(form.email, form.password);
    if (profile) {
      navigate(profile.setupCompleted ? '/dashboard' : '/setup', { replace: true });
    }
  };

  /** Google sign-in via Firebase */
  const handleGoogleSignIn = async () => {
    const profile = await signInWithGoogle();
    if (profile) {
      navigate(profile.setupCompleted ? '/dashboard' : '/setup', { replace: true });
    }
  };

  return (
    <div className={styles.page}>
      {/* Background Neural Canvas */}
      <NeuralBackground />

      {/* ── Left Panel ── */}
      <div className={styles.left}>
        <div className={styles.leftContent}>
          <div className={styles.brandHeader}>
            <div className={styles.logoIcon}>
              <Zap size={24} color="#ffffff" strokeWidth={2.5} />
            </div>
            <span className={styles.brandTitle}>SYNAPSE</span>
          </div>

          <h2 className={styles.leftTitle}>
            Study Smarter.<br />Focus Better.<br />Achieve More.
          </h2>
          <p className={styles.leftSubtitle}>
            Welcome back to SYNAPSE. Your personalized workspace adapts to your academic pace — from regular lectures to exam week.
          </p>

          <div className={styles.leftFeatures}>
            {[
              '24/7 AI Tutor & context assistant',
              'Personalized academic Resource Vault',
              'Spaced-repetition flashcards workspace',
              'Focus Mode with Pomodoro & ambient soundscapes',
            ].map((f) => (
              <div key={f} className={styles.leftFeatureItem}>
                <span className={styles.leftFeatureDot} />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.leftGlow} aria-hidden="true" />
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className={styles.right}>
        <div className={styles.formContainer}>
          {/* Back button */}
          <Link to="/welcome" className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>Sign In</h1>
            <p className={styles.subtitle}>
              Access your SYNAPSE academic workspace.
            </p>
          </div>

          {/* Global error */}
          {authError && (
            <div className={styles.globalError} role="alert">
              {authError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
              label="Email address"
              type="email"
              id="login-email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
              iconLeft={<Mail size={15} />}
              autoComplete="email"
              disabled={isLoading}
            />

            <div className={styles.passwordWrapper}>
              <Input
                label="Password"
                type="password"
                id="login-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
                iconLeft={<Lock size={15} />}
                showToggle
                autoComplete="current-password"
                disabled={isLoading}
              />
              <Link to="/welcome" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign in to SYNAPSE'}
            </Button>
          </form>

          {/* OR divider */}
          <Divider label="OR" />

          {/* Google Sign In */}
          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Sign up link */}
          <p className={styles.signupLink}>
            Don't have an account?{' '}
            <Link to="/signup">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
