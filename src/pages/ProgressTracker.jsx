// =============================================================
// ProgressTracker.jsx – Semester & Subject Academic Progress
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, CheckCircle2, Clock, Award, Flame,
  FolderArchive, Layers, HelpCircle, BookOpen, Target,
  Calendar, ArrowUpRight
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  subscribeToAcademicGrowthData,
  computeProgressMetrics,
} from '../services/academicGrowthService';
import styles from './ProgressTracker.module.css';

export default function ProgressTracker() {
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid;

  const { tasks, notes, events, recentActivity } = useData();

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

  const metrics = useMemo(() => {
    return computeProgressMetrics({
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

  // SVG Circular progress math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (metrics.semesterProgress / 100) * circumference;

  return (
    <PageWrapper title="Progress Tracker" subtitle="Monitor your semester journey, subject mastery & study streak">
      <div className={styles.container}>
        {/* Header Title */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 className={styles.pageTitle}>Academic Journey & Progress</h2>
            <p className={styles.pageSubtitle}>
              Live analytics synchronized with your tasks, study vault, quizzes, and focus sessions
            </p>
          </div>
        </div>

        {/* Circular Progress & Subject Breakdown Section */}
        <div className={styles.circularSection}>
          {/* Circular Indicator */}
          <div className={styles.circularCard}>
            <h3 className={styles.cardTitle}>Semester Completion</h3>
            <div className={styles.circleSvgContainer}>
              <svg width="140" height="140" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="rgba(79, 70, 229, 0.12)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="var(--color-primary)"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className={styles.circleSvgText}>{metrics.semesterProgress}%</div>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 600 }}>
              Overall Semester Index
            </span>
          </div>

          {/* Subject Breakdown Card */}
          <div className={styles.subjectsCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={styles.cardTitle}>Subject Mastery Progress</h3>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                {metrics.subjectProgress.length} Enrolled Subjects
              </span>
            </div>

            <div className={styles.subjectProgressList}>
              {metrics.subjectProgress.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                  Add tasks or notes to populate subject progress tracking.
                </p>
              ) : (
                metrics.subjectProgress.map((sp) => (
                  <div key={sp.subject} className={styles.subjectProgressItem}>
                    <div className={styles.subjectHeaderRow}>
                      <span>{sp.subject}</span>
                      <span>{sp.completed} / {sp.total} items ({sp.percentage}%)</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${sp.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className={styles.overviewGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconBadge} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <CheckCircle2 size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{metrics.taskCompletionRate}%</span>
              <span className={styles.statLabel}>Tasks Done ({metrics.completedTasks}/{metrics.totalTasks})</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBadge} style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#4F46E5' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{metrics.focusHours}h</span>
              <span className={styles.statLabel}>Total Focus Hours Logged</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBadge} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
              <Flame size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{metrics.streak} Days</span>
              <span className={styles.statLabel}>Active Study Streak</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBadge} style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#EC4899' }}>
              <HelpCircle size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{metrics.avgQuizScore}%</span>
              <span className={styles.statLabel}>Average Quiz Score ({metrics.quizAttemptsCount} attempts)</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBadge} style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0EA5E9' }}>
              <Layers size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{metrics.flashcardMasteryRate}%</span>
              <span className={styles.statLabel}>Flashcards Mastered ({metrics.easyFlashcards}/{metrics.totalFlashcards})</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconBadge} style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
              <FolderArchive size={24} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{metrics.totalResources}</span>
              <span className={styles.statLabel}>Study Vault Resources</span>
            </div>
          </div>
        </div>

        {/* Milestone Cards */}
        <div>
          <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Academic Milestones</h3>
          <div className={styles.milestonesGrid}>
            <div className={styles.milestoneCard}>
              <div className={styles.milestoneTop}>
                <div className={styles.milestoneIcon}>
                  <Target size={20} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                  Weekly Target
                </span>
              </div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Weekly Study Milestone</h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                Target: Complete 5 tasks & 2 focus sessions
              </p>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${Math.min(100, (metrics.completedTasks / Math.max(1, metrics.totalTasks)) * 100)}%` }}
                />
              </div>
            </div>

            <div className={styles.milestoneCard}>
              <div className={styles.milestoneTop}>
                <div className={styles.milestoneIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                  <Award size={20} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                  Monthly Target
                </span>
              </div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Knowledge Base Building</h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>
                Target: Upload 10 materials & master 15 flashcards
              </p>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${Math.min(100, ((metrics.totalResources + metrics.totalFlashcards) / 25) * 100)}%`, background: '#10B981' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity Timeline */}
        <div className={styles.timelineCard}>
          <h3 className={styles.cardTitle}>Recent Academic Activity Timeline</h3>
          <div className={styles.timelineList}>
            {recentActivity.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                No recent activity recorded yet. Create tasks, notes, or quiz attempts to populate your timeline.
              </p>
            ) : (
              recentActivity.slice(0, 5).map((act, idx) => (
                <div key={idx} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                      {act.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                      {act.type} &bull; {act.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
