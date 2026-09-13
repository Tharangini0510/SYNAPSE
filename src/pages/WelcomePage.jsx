// =============================================================
// WelcomePage.jsx – SYNAPSE Redesigned Hero Landing Page
// =============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  BookOpen,
  Target,
  TrendingUp,
  ChevronDown,
  Brain,
  Clock,
  CheckCircle,
} from 'lucide-react';

import LandingNav from '../components/landing/LandingNav';
import NeuralBackground from '../components/landing/NeuralBackground';
import FeatureCards from '../components/landing/FeatureCards';
import InteractivePreview from '../components/landing/InteractivePreview';

import styles from './WelcomePage.module.css';

const FAQ_ITEMS = [
  {
    question: 'What makes SYNAPSE different from static note-taking apps?',
    answer:
      'Unlike traditional apps, SYNAPSE is an adaptive workspace. It pairs an interactive AI Tutor with automated quiz generation, spaced-repetition flashcards, a personal Resource Vault, and real-time exam readiness analytics.',
  },
  {
    question: 'Is SYNAPSE free for university students?',
    answer:
      'Yes! SYNAPSE is 100% free to use for students, with full access to focus sessions, resource management, task boards, and AI study helpers.',
  },
  {
    question: 'How do Adaptive Modes work during Exam Week?',
    answer:
      'Adaptive Modes automatically adjust your interface based on your current semester phase. During Exam Week, SYNAPSE prioritizes flashcards, quick quizzes, and high-yield study references while minimizing non-urgent UI distractions.',
  },
  {
    question: 'Can I save links to Google Drive, YouTube lectures, and GitHub repos?',
    answer:
      'Yes! The Resource Vault allows you to save and organize all your study links, lecture videos, documentation, research papers, and reference websites in one structured academic library.',
  },
];

function WelcomePage() {
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });
  const [openFaq, setOpenFaq] = useState(null);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  useEffect(() => {
    // Ensure document attribute matches active state
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className={styles.page}>
      {/* ── Top Navigation Bar ── */}
      <LandingNav theme={theme} toggleTheme={toggleTheme} />

      {/* ── Animated Background Canvas ── */}
      <NeuralBackground theme={theme} />

      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        {/* Feature Pills */}
        <div className={styles.pillRow}>
          <div className={styles.pill}>
            <Brain size={14} color="#6366F1" />
            <span>AI-Driven Workspace</span>
          </div>
          <div className={styles.pill}>
            <Clock size={14} color="#3B82F6" />
            <span>Adaptive Focus Modes</span>
          </div>
          <div className={styles.pill}>
            <TrendingUp size={14} color="#10B981" />
            <span>Predictive Study Analytics</span>
          </div>
        </div>

        {/* Primary Headline */}
        <h1 className={styles.headline}>
          <span className={styles.headlineText}>Study Smarter.</span>{' '}
          <span className={styles.headlineAccent}>Focus Better.</span>
          <br />
          <span className={styles.headlineText}>Achieve More.</span>
        </h1>

        {/* Supporting Subheading */}
        <p className={styles.subtext}>
          An AI-powered adaptive learning workspace designed to help students manage tasks, resources, focus sessions, quizzes, flashcards, and academic growth.
        </p>

        {/* Primary Call To Action Buttons */}
        <div className={styles.ctaGroup}>
          <Link to="/signup" className={styles.primaryCta}>
            <span>Get Started Free</span>
            <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={styles.secondaryCta}
          >
            <span>Learn More</span>
          </a>
        </div>

        {/* Trust & Social Proof Line */}
        <div className={styles.trustLine}>
          <CheckCircle size={15} color="#10B981" />
          <span>Trusted by 2,400+ university students</span>
          <span>·</span>
          <span>100% Free</span>
          <span>·</span>
          <span>No credit card required</span>
        </div>
      </section>

      {/* ── Interactive Workspace Showcase Demo ── */}
      <InteractivePreview />

      {/* ── Core Feature Highlights (Required 6 Cards) ── */}
      <FeatureCards />

      {/* ── Adaptive Modes Showcase ── */}
      <section id="modes" className={styles.modesSection}>
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          <div className={styles.pill} style={{ marginBottom: '1rem' }}>
            <Zap size={14} color="#6366F1" />
            <span>Adaptive Intelligence</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            A Workspace That Adapts to Your Academic Pace
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.05rem', marginTop: '0.75rem' }}>
            SYNAPSE dynamically morphs its interface to match your exact study phase — from regular lectures to exam cramming.
          </p>
        </div>

        <div className={styles.modesGrid}>
          <div className={styles.modeCard}>
            <div className={styles.modeIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Normal Mode
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Balanced layout designed for regular semester study, assignment tracking, and course material organization.
            </p>
          </div>

          <div className={styles.modeCard}>
            <div className={styles.modeIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              <Target size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Deadline Priority
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              High-intensity view that brings impending assignment deadlines and urgent task kanban items into sharp focus.
            </p>
          </div>

          <div className={styles.modeCard}>
            <div className={styles.modeIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Exam Week Mode
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.925rem', lineHeight: 1.6 }}>
              Maximizes flashcards and practice quizzes while muting non-essential notifications for deep exam preparation.
            </p>
          </div>
        </div>
      </section>

      {/* ── Student Impact Telemetry ── */}
      <section className={styles.statsSection}>
        <div className={styles.statsGrid}>
          <div>
            <div className={styles.statValue}>2.4x</div>
            <div className={styles.statLabel}>Study Efficiency Boost</div>
          </div>
          <div>
            <div className={styles.statValue}>98.4%</div>
            <div className={styles.statLabel}>Course Retention Rate</div>
          </div>
          <div>
            <div className={styles.statValue}>50k+</div>
            <div className={styles.statLabel}>Practice Questions Answered</div>
          </div>
          <div>
            <div className={styles.statValue}>100%</div>
            <div className={styles.statLabel}>Student Privacy & Free Access</div>
          </div>
        </div>
      </section>

      {/* ── Frequently Asked Questions ── */}
      <section id="faq" className={styles.faqSection}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 800 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
            Everything you need to know about getting started with SYNAPSE.
          </p>
        </div>

        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => (
            <div key={item.question} className={styles.faqItem}>
              <button
                onClick={() => toggleFaq(index)}
                className={styles.faqQuestion}
              >
                <span>{item.question}</span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                  }}
                />
              </button>
              {openFaq === index && (
                <div className={styles.faqAnswer}>
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final Call to Action Banner ── */}
      <section className={styles.finalCtaSection}>
        <div className={styles.finalCtaBox}>
          <h2 className={styles.finalTitle}>
            Ready to Transform How You Study?
          </h2>
          <p className={styles.finalSub}>
            Join thousands of students who plan smarter, stay focused, and achieve their academic goals with SYNAPSE.
          </p>
          <Link to="/signup" className={styles.primaryCta} style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            <span>Get Started Free in 60 Seconds</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366F1, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#ffffff" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>SYNAPSE</span>
        </div>
        <p className={styles.footerText}>
          © 2026 SYNAPSE · Adaptive Learning Workspace · Smart Learning. Personalized Productivity. AI-Powered Growth.
        </p>
      </footer>
    </div>
  );
}

export default WelcomePage;
