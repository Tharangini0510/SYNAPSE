// =============================================================
// Achievements.jsx – Gamified Student Badges & Milestones
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { Award, CheckCircle2, Lock, Sparkles, Trophy, Star, Flame } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  subscribeToAcademicGrowthData,
  computeProgressMetrics,
  evaluateAchievements,
} from '../services/academicGrowthService';
import styles from './Achievements.module.css';

export default function Achievements() {
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid;

  const { tasks, notes, events } = useData();

  const [growthData, setGrowthData] = useState({
    vault: [],
    flashcards: [],
    quizzes: [],
    attempts: [],
  });

  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const achievements = useMemo(() => {
    return evaluateAchievements(metrics, growthData.attempts);
  }, [metrics, growthData.attempts]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const categories = useMemo(() => {
    const cats = [...new Set(achievements.map((a) => a.category))];
    return ['All', ...cats];
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'All') return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  return (
    <PageWrapper title="Achievements" subtitle="Earn badges and celebrate consistent study behavior">
      <div className={styles.container}>
        {/* Header Title */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 className={styles.pageTitle}>Academic Badges & Achievements</h2>
            <p className={styles.pageSubtitle}>
              Automatically unlocks as you complete tasks, build flashcard decks, take quizzes, and log focus hours
            </p>
          </div>
        </div>

        {/* Summary Banner */}
        <div className={styles.summaryBanner}>
          <div className={styles.summaryText}>
            <h3 className={styles.summaryTitle}>
              🏆 {unlockedCount} of {achievements.length} Badges Unlocked
            </h3>
            <p className={styles.summaryDesc}>
              Keep up your daily study momentum to unlock all achievements and master your semester goals.
            </p>
          </div>
          <div className={styles.summaryBadge}>
            {Math.round((unlockedCount / achievements.length) * 100)}% Unlocked
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border)',
                background: selectedCategory === cat ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.6)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--color-text)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className={styles.badgesGrid}>
          {filteredAchievements.map((ach) => (
            <div
              key={ach.id}
              className={`${styles.badgeCard} ${ach.unlocked ? styles.unlocked : styles.locked}`}
            >
              <div className={styles.badgeHeader}>
                <div className={styles.badgeIconWrapper}>
                  {ach.badge}
                </div>
                <div className={styles.badgeInfo}>
                  <h4 className={styles.badgeTitle}>{ach.title}</h4>
                  <p className={styles.badgeDesc}>{ach.description}</p>
                </div>
              </div>

              <div className={styles.badgeMeta}>
                <div className={styles.badgeMetaRow}>
                  {ach.unlocked ? (
                    <span className={styles.unlockedPill}>
                      <CheckCircle2 size={13} /> Unlocked
                    </span>
                  ) : (
                    <span className={styles.lockedPill}>
                      <Lock size={13} /> Locked ({ach.progress} / {ach.target})
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                    {ach.category}
                  </span>
                </div>

                {!ach.unlocked && (
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${ach.percent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
