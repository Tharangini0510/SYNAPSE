// =============================================================
// FeatureCards.jsx – Core 6 Synapse Feature Cards Showcase
// =============================================================
import {
  Bot,
  FolderArchive,
  Layers,
  HelpCircle,
  Timer,
  BarChart3,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import styles from './FeatureCards.module.css';

const FEATURES = [
  {
    id: 'ai-tutor',
    title: 'AI Tutor',
    desc: 'Personalized 24/7 AI study assistant that breaks down complex course concepts, resolves homework queries, and summarizes lecture content.',
    icon: Bot,
    color: '#6366F1',
    tag: '24/7 Assistance',
  },
  {
    id: 'resource-vault',
    title: 'Resource Vault',
    desc: 'Save and organize your academic resources, study links, documentation, video lectures, and research references in one place.',
    icon: FolderArchive,
    color: '#3B82F6',
    tag: 'Academic Library',
  },
  {
    id: 'flashcards',
    title: 'Flashcards Workspace',
    desc: 'AI-generated spaced-repetition card decks designed to optimize memory recall and supercharge active learning before exams.',
    icon: Layers,
    color: '#10B981',
    tag: 'Spaced Repetition',
  },
  {
    id: 'quiz-center',
    title: 'Quiz Center',
    desc: 'Dynamic practice quiz generator with instant automated grading, detailed solution breakdowns, and topic mastery tracking.',
    icon: HelpCircle,
    color: '#8B5CF6',
    tag: 'Adaptive Testing',
  },
  {
    id: 'focus-mode',
    title: 'Focus Mode',
    desc: 'Distraction-free Pomodoro session timer equipped with custom ambient audio soundscapes, streak counters, and focus analytics.',
    icon: Timer,
    color: '#F59E0B',
    tag: 'Deep Work',
  },
  {
    id: 'ai-insights',
    title: 'AI Insights',
    desc: 'Predictive academic telemetry that analyzes study velocity, forecasts exam readiness, and suggests schedule optimizations.',
    icon: BarChart3,
    color: '#EC4899',
    tag: 'Predictive Analytics',
  },
];

export default function FeatureCards() {
  return (
    <section id="features" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={14} />
          <span>Intelligent Toolkit</span>
        </div>
        <h2 className={styles.title}>Everything You Need to Master Your Studies</h2>
        <p className={styles.subtitle}>
          Synapse replaces fragmented tools with a single unified, AI-powered academic workspace engineered for student success.
        </p>
      </div>

      <div className={styles.grid}>
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.id} className={styles.card}>
              <div>
                <div className={styles.cardHeader}>
                  <div className={styles.iconBox}>
                    <Icon size={26} color={feature.color} strokeWidth={2.2} />
                  </div>
                  <span className={styles.tag}>{feature.tag}</span>
                </div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDesc}>{feature.desc}</p>
              </div>

              <div className={styles.cardFooter}>
                <span>Explore {feature.title}</span>
                <ArrowRight size={15} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
