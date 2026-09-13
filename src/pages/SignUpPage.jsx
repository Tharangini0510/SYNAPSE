// =============================================================
// SignUpPage.jsx – Premium Glassmorphic Registration Page
// =============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building, ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Divider from '../components/common/Divider';
import NeuralBackground from '../components/landing/NeuralBackground';
import { isValidEmail, getPasswordStrength, getPasswordStrengthLabel } from '../utils/helpers';
import styles from './SignUpPage.module.css';

/** Password strength meter component */
function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const score = getPasswordStrength(password);
  const { label, color } = getPasswordStrengthLabel(score);
  const filled = Math.max(1, score);

  return (
    <div className={styles.strengthMeter}>
      <div className={styles.strengthBars}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={styles.strengthBar}
            style={{ backgroundColor: i < filled ? color : undefined }}
          />
        ))}
      </div>
      <span className={styles.strengthLabel} style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, isLoading, authError, setAuthError } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    university: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: '' }));
    setAuthError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email) errs.email = 'Email is required.';
    else if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const profile = await signUp({
      name: form.name,
      email: form.email,
      university: form.university,
      password: form.password,
    });
    if (profile) navigate('/setup', { replace: true });
  };

  const handleGoogleSignUp = async () => {
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
            Start your academic journey with SYNAPSE.
          </h2>
          <p className={styles.leftSubtitle}>
            Set up your intelligent workspace in under a minute. Free forever for students.
          </p>

          <div className={styles.steps}>
            {[
              'Create your student account',
              'Configure your subjects & semester goals',
              'Let SYNAPSE adapt to your study pace',
            ].map((s, i) => (
              <div key={s} className={styles.step}>
                <div className={styles.stepNum}>{i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.leftGlow} aria-hidden="true" />
      </div>

      {/* ── Right Panel ── */}
      <div className={styles.right}>
        <div className={styles.formContainer}>
          <Link to="/welcome" className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          <div className={styles.header}>
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>Join university students on SYNAPSE.</p>
          </div>

          {authError && (
            <div className={styles.globalError} role="alert">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
              label="Full name"
              id="signup-name"
              placeholder="Alex Johnson"
              value={form.name}
              onChange={handleChange('name')}
              error={errors.name}
              iconLeft={<User size={15} />}
              autoComplete="name"
              disabled={isLoading}
            />
            <Input
              label="University email"
              type="email"
              id="signup-email"
              placeholder="you@university.edu"
              value={form.email}
              onChange={handleChange('email')}
              error={errors.email}
              iconLeft={<Mail size={15} />}
              autoComplete="email"
              disabled={isLoading}
            />
            <Input
              label="University / Institution (optional)"
              id="signup-university"
              placeholder="State University"
              value={form.university}
              onChange={handleChange('university')}
              iconLeft={<Building size={15} />}
              disabled={isLoading}
            />
            <div>
              <Input
                label="Password"
                type="password"
                id="signup-password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={handleChange('password')}
                error={errors.password}
                iconLeft={<Lock size={15} />}
                showToggle
                autoComplete="new-password"
                disabled={isLoading}
              />
              <PasswordStrengthMeter password={form.password} />
            </div>
            <Input
              label="Confirm password"
              type="password"
              id="signup-confirm"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
              iconLeft={<Lock size={15} />}
              showToggle
              autoComplete="new-password"
              disabled={isLoading}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading}>
              {isLoading ? 'Creating account…' : 'Create SYNAPSE Account'}
            </Button>
          </form>

          <Divider label="OR" />

          <button type="button" className={styles.googleBtn} onClick={handleGoogleSignUp} disabled={isLoading}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className={styles.loginLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <p className={styles.terms}>
            By creating an account you agree to our{' '}
            <a href="#terms">Terms of Service</a> and{' '}
            <a href="#privacy">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
