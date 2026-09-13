import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap, Star, CheckCircle, Clock, Flame } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import styles from './FocusMode.module.css';

const QUOTES = [
  '"The secret of getting ahead is getting started." – Mark Twain',
  '"Focus on being productive instead of busy." – Tim Ferriss',
  '"Do the hard jobs first. The easy jobs will take care of themselves." – Dale Carnegie',
  '"You don\'t have to see the whole staircase, just take the first step." – MLK',
  '"Success is the sum of small efforts, repeated day in and day out." – R. Collier',
];

/** Soft chime when a Pomodoro session ends (no external assets). */
function playSessionEndSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    /* ignore audio errors — never block the timer */
  }
}

export default function FocusMode() {
  const { user } = useAuth();
  const { recordFocusSession } = useData();
  const pomo = user?.settings?.pomodoro || { work: 25, shortBreak: 5, longBreak: 15 };
  const soundOn = user?.settings?.sound !== false;

  const SESSIONS = useMemo(
    () => [
      { id: 'work', label: 'Work', duration: (pomo.work || 25) * 60, icon: <Zap size={16} /> },
      { id: 'short', label: 'Short Break', duration: (pomo.shortBreak || 5) * 60, icon: <Coffee size={16} /> },
      { id: 'long', label: 'Long Break', duration: (pomo.longBreak || 15) * 60, icon: <Star size={16} /> },
    ],
    [pomo.work, pomo.shortBreak, pomo.longBreak]
  );

  const [sessionIndex, setSessionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSIONS[0].duration);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [focusTask, setFocusTask] = useState('');
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const intervalRef = useRef(null);
  const sessionIndexRef = useRef(0);
  const soundOnRef = useRef(soundOn);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  const today = new Date().toISOString().split('T')[0];
  const stats = user?.studyStats || {};
  const completedToday =
    stats.focusSessionsDate === today ? stats.focusSessionsToday || 0 : 0;
  const totalMinutes = stats.totalFocusMinutes || 0;

  useEffect(() => {
    sessionIndexRef.current = sessionIndex;
  }, [sessionIndex]);

  useEffect(() => {
    setTimeLeft(SESSIONS[sessionIndex].duration);
  }, [SESSIONS, sessionIndex]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (soundOnRef.current) playSessionEndSound();
            const current = sessionIndexRef.current;
            const finished = SESSIONS[current];
            if (finished.id === 'work') {
              const mins = Math.round(finished.duration / 60);
              recordFocusSession(mins);
              setSessionCount((sc) => sc + 1);
            }
            setSessionIndex((si) => {
              const next = (si + 1) % SESSIONS.length;
              setTimeLeft(SESSIONS[next].duration);
              return next;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, SESSIONS, recordFocusSession]);

  const selectSession = (idx) => {
    setRunning(false);
    setSessionIndex(idx);
    setTimeLeft(SESSIONS[idx].duration);
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(SESSIONS[sessionIndex].duration);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const totalDuration = SESSIONS[sessionIndex].duration;
  const progress = (totalDuration - timeLeft) / totalDuration;
  const RADIUS = 90;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const sessionInCycle = ((sessionCount - 1) % 4) + 1;

  return (
    <PageWrapper title="Focus Mode" subtitle="Deep work, distraction free">
      <div className={styles.layout}>
        {/* ── Timer Card ── */}
        <div className={styles.timerSection}>
          <Card className={styles.timerCard}>
            {/* Session type selector */}
            <div className={styles.sessionTabs}>
              {SESSIONS.map((s, i) => (
                <button
                  key={s.id}
                  className={`${styles.sessionTab} ${i === sessionIndex ? styles.activeTab : ''}`}
                  onClick={() => selectSession(i)}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* SVG ring */}
            <div className={styles.ringWrapper}>
              <svg
                className={styles.ring}
                viewBox="0 0 220 220"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Track */}
                <circle
                  cx="110" cy="110" r={RADIUS}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="12"
                />
                {/* Progress */}
                <circle
                  cx="110" cy="110" r={RADIUS}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 110 110)"
                  style={{ transition: 'stroke-dashoffset 0.8s linear' }}
                />
              </svg>
              <div className={styles.timerDisplay}>
                <span className={styles.timerTime}>{mm}:{ss}</span>
                <span className={styles.timerLabel}>{SESSIONS[sessionIndex].label}</span>
                <span className={styles.sessionCounter}>
                  Session {sessionInCycle} of 4
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
              <button className={styles.resetBtn} onClick={reset} title="Reset">
                <RotateCcw size={18} />
              </button>
              <button
                className={`${styles.playBtn} ${running ? styles.pauseBtn : ''}`}
                onClick={() => setRunning(r => !r)}
              >
                {running ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <div style={{ width: 44 }} /> {/* spacer */}
            </div>

            {/* Focus task input */}
            <div className={styles.focusTaskRow}>
              <CheckCircle size={16} className={styles.focusIcon} />
              <input
                className={styles.focusInput}
                placeholder="What are you working on?"
                value={focusTask}
                onChange={e => setFocusTask(e.target.value)}
              />
            </div>
          </Card>
        </div>

        {/* ── Stats & Info ── */}
        <div className={styles.sidebar}>
          {/* Stats */}
          <Card className={styles.statsCard}>
            <h3 className={styles.sideTitle}>Today's Progress</h3>
            <div className={styles.statsList}>
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ background: '#6366f120', color: '#6366f1' }}>
                  <Flame size={18} />
                </div>
                <div>
                  <div className={styles.statValue}>{completedToday}</div>
                  <div className={styles.statLabel}>Sessions Completed</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ background: '#10b98120', color: '#10b981' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div className={styles.statValue}>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</div>
                  <div className={styles.statLabel}>Total Focus Time</div>
                </div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                  <Star size={18} />
                </div>
                <div>
                  <div className={styles.statValue}>{sessionInCycle}/4</div>
                  <div className={styles.statLabel}>Pomodoros This Cycle</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quote */}
          <Card className={styles.quoteCard}>
            <div className={styles.quoteIcon}>✦</div>
            <p className={styles.quoteText}>{quote}</p>
          </Card>

          {/* How to use */}
          <Card className={styles.guideCard}>
            <h3 className={styles.sideTitle}>Pomodoro Method</h3>
            <ol className={styles.guideList}>
              <li>Choose a task to work on</li>
              <li>Work for 25 minutes without interruption</li>
              <li>Take a 5-minute short break</li>
              <li>After 4 sessions, take a 15-min long break</li>
            </ol>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
