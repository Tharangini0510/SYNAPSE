// =============================================================
// AdaptiveSetup.jsx – 3-step onboarding wizard
// =============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Calendar, Zap, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdaptive } from '../contexts/AdaptiveContext';
import { ADAPTIVE_MODES } from '../utils/constants';
import Button from '../components/common/Button';
import styles from './AdaptiveSetup.module.css';

const STEPS = [
  { id: 1, label: 'About You', icon: GraduationCap },
  { id: 2, label: 'Your Schedule', icon: Calendar },
  { id: 3, label: 'Choose Mode', icon: Zap },
];

function StepIndicator({ currentStep }) {
  return (
    <div className={styles.stepIndicator}>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <div key={step.id} className={styles.stepItem}>
            <div className={`${styles.stepCircle} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}>
              {isDone ? <Check size={14} /> : <Icon size={14} />}
            </div>
            <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>{step.label}</span>
            {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${isDone ? styles.stepLineDone : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

function AdaptiveSetup() {
  const navigate = useNavigate();
  const { completeSetup, user } = useAuth();
  const { setMode } = useAdaptive();

  // Existing / already-onboarded users should never stay on this page
  useEffect(() => {
    if (user?.setupCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.setupCompleted, navigate]);

  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    major: user?.course || '',
    year: user?.semester || '',
    semesterStart: user?.adaptiveSettings?.semesterStart || '',
    semesterEnd: user?.adaptiveSettings?.semesterEnd || '',
    mode: user?.adaptiveSettings?.mode || 'normal',
  });

  const update = (field) => (e) => setData(d => ({ ...d, [field]: e.target.value }));

  const handleFinish = async () => {
    setMode(data.mode);
    await completeSetup({
      major: data.major,
      year: data.year,
      semesterStart: data.semesterStart,
      semesterEnd: data.semesterEnd,
      mode: data.mode,
      university: user?.university || '',
    });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoMark}>
            <Zap size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Let's set up your workspace</h1>
          <p className={styles.subtitle}>
            Hi {user?.name?.split(' ')[0] || 'there'}! A few quick questions to personalise Synapse for you.
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        {/* Step content */}
        <div className={styles.card}>
          {/* ── Step 1: About You ── */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Tell us about you</h2>
              <p className={styles.stepDesc}>We'll use this to personalise your dashboard and AI suggestions.</p>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>Field of Study / Major</label>
                  <input className={styles.input} placeholder="e.g. Computer Science" value={data.major} onChange={update('major')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Year of Study</label>
                  <select className={styles.input} value={data.year} onChange={update('year')}>
                    <option value="">Select year…</option>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'PhD'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Schedule ── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Your semester schedule</h2>
              <p className={styles.stepDesc}>Help Synapse track your academic calendar automatically.</p>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>Semester Start Date</label>
                  <input className={styles.input} type="date" value={data.semesterStart} onChange={update('semesterStart')} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Semester End Date</label>
                  <input className={styles.input} type="date" value={data.semesterEnd} onChange={update('semesterEnd')} />
                </div>
              </div>
              <p className={styles.hint}>You can update these anytime in Settings.</p>
            </div>
          )}

          {/* ── Step 3: Choose Mode ── */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Choose your starting mode</h2>
              <p className={styles.stepDesc}>Pick the mode that matches where you are right now. You can switch anytime.</p>
              <div className={styles.modeGrid}>
                {Object.values(ADAPTIVE_MODES).map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    className={`${styles.modeCard} ${data.mode === mode.id ? styles.modeCardActive : ''}`}
                    onClick={() => setData(d => ({ ...d, mode: mode.id }))}
                    style={{ '--mode-color': mode.color }}
                  >
                    <span className={styles.modeEmoji}>{mode.icon}</span>
                    <div className={styles.modeCardTitle}>{mode.label}</div>
                    <div className={styles.modeCardDesc}>{mode.description}</div>
                    {data.mode === mode.id && (
                      <div className={styles.modeCheck}><Check size={12} /></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className={styles.navRow}>
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={16} />
                Back
              </Button>
            ) : <div />}

            {step < 3 ? (
              <Button variant="primary" onClick={() => setStep(s => s + 1)}>
                Continue
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleFinish}>
                Open my workspace
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>

        <button className={styles.skipLink} onClick={handleFinish}>
          Skip for now — I'll set up later
        </button>
      </div>
    </div>
  );
}

export default AdaptiveSetup;
