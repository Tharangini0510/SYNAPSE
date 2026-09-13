// =============================================================
// AIInsights.jsx – Personalised Academic Insights Dashboard
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain, Sparkles, Clock, AlertTriangle, TrendingUp,
  BookOpen, HelpCircle, Layers, Target, CheckCircle2,
  FolderArchive, Bell
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  subscribeToAcademicGrowthData,
  computeAiInsightsData,
} from '../services/academicGrowthService';
import styles from './AIInsights.module.css';

export default function AIInsights() {
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid;

  const { tasks, notes, events } = useData();

  const [growthData, setGrowthData] = useState({
    vault: [],
    flashcards: [],
    quizzes: [],
    attempts: [],
  });

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToAcademicGrowthData(uid, (data) => {
      setGrowthData(data);
    });
    return () => unsub && unsub();
  }, [uid]);

  const insights = useMemo(() => {
    return computeAiInsightsData({
      tasks,
      notes,
      events,
      vault: growthData.vault,
      flashcards: growthData.flashcards,
      quizzes: growthData.quizzes,
      attempts: growthData.attempts,
      studyStats: user?.studyStats || {},
    });
  }, [tasks, notes, events, growthData, user?.studyStats]);

  return (
    <PageWrapper title="AI Insights" subtitle="Intelligent study analytics & personalized recommendations">
      <div className={styles.container}>
        {/* Header Title */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 className={styles.pageTitle}>Personalized Academic Insights</h2>
            <p className={styles.pageSubtitle}>
              Data-driven study analytics, productivity trends, and AI-powered study recommendations
            </p>
          </div>
        </div>

        {/* AI Banner */}
        <div className={styles.aiBanner}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className={styles.aiBadge}>
              <Sparkles size={14} /> AI Analysis Engine Ready
            </div>
            <h3 style={{ margin: '8px 0 0', fontSize: '18px', fontWeight: 800 }}>
              Academic Health & Productivity Overview
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
              Synthesized from your study logs, quiz scores, focus sessions, and task completion metrics.
            </p>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className={styles.recommendationsCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={22} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Smart Study Recommendations</h3>
          </div>
          <div className={styles.recList}>
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className={styles.recItem}>
                <span className={styles.recBullet}>{idx + 1}</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights Grid */}
        <div className={styles.insightsGrid}>
          {/* Most Productive Hours */}
          <div className={styles.insightCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#4F46E5' }}>
                <Clock size={20} />
              </div>
              <h4 className={styles.cardTitle}>Peak Productivity Window</h4>
            </div>
            <p className={styles.cardContent}>
              Your highest task completion and focus rate occurs during <strong>{insights.mostProductiveTime}</strong>.
            </p>
          </div>

          {/* Subject Attention & Neglect */}
          <div className={styles.insightCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                <BookOpen size={20} />
              </div>
              <h4 className={styles.cardTitle}>Subject Focus Balance</h4>
            </div>
            <p className={styles.cardContent}>
              Most Attention: <strong>{insights.mostAttentionSubject}</strong>
              <br />
              Receiving Least Focus: <strong>{insights.neglectedSubject}</strong>
            </p>
          </div>

          {/* Overdue Tasks & Deadlines */}
          <div className={styles.insightCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
                <AlertTriangle size={20} />
              </div>
              <h4 className={styles.cardTitle}>Deadlines & Overdue Tasks</h4>
            </div>
            <p className={styles.cardContent}>
              {insights.overdueTasksCount > 0 ? (
                <>You have <strong style={{ color: '#EF4444' }}>{insights.overdueTasksCount} overdue task(s)</strong> that require immediate attention.</>
              ) : (
                <>No overdue tasks! All your deadlines are currently up to date.</>
              )}
            </p>
          </div>

          {/* Weekly Productivity Trend */}
          <div className={styles.insightCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
                <TrendingUp size={20} />
              </div>
              <h4 className={styles.cardTitle}>Productivity Trend</h4>
            </div>
            <p className={styles.cardContent}>
              {insights.weeklyProductivityTrend}
            </p>
          </div>

          {/* Quiz Performance Analysis */}
          <div className={styles.insightCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#EC4899' }}>
                <HelpCircle size={20} />
              </div>
              <h4 className={styles.cardTitle}>Quiz Diagnostics</h4>
            </div>
            <p className={styles.cardContent}>
              {insights.quizPerformanceSummary}
            </p>
          </div>

          {/* Flashcard Review Consistency */}
          <div className={styles.insightCard}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0EA5E9' }}>
                <Layers size={20} />
              </div>
              <h4 className={styles.cardTitle}>Flashcard Consistency</h4>
            </div>
            <p className={styles.cardContent}>
              {insights.flashcardConsistency}
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
