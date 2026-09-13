// =============================================================
// services/academicGrowthService.js – Academic Growth Data Aggregator
// =============================================================
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

/** Subscribe to all Academic Growth data sources for a user */
export function subscribeToAcademicGrowthData(uid, callback, onError) {
  if (!uid) return () => {};

  const state = {
    vault: [],
    flashcards: [],
    quizzes: [],
    attempts: [],
  };

  const ready = { vault: false, flashcards: false, quizzes: false, attempts: false };

  const checkEmit = () => {
    if (Object.values(ready).every(Boolean)) {
      callback({ ...state });
    }
  };

  const unsubs = [
    onSnapshot(
      query(collection(db, 'users', uid, 'studyVault'), orderBy('createdAt', 'desc')),
      (snap) => {
        state.vault = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.vault = true;
        checkEmit();
      },
      (err) => { console.warn('Vault sub error:', err); ready.vault = true; checkEmit(); }
    ),
    onSnapshot(
      query(collection(db, 'users', uid, 'flashcards'), orderBy('createdAt', 'desc')),
      (snap) => {
        state.flashcards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.flashcards = true;
        checkEmit();
      },
      (err) => { console.warn('Flashcards sub error:', err); ready.flashcards = true; checkEmit(); }
    ),
    onSnapshot(
      query(collection(db, 'users', uid, 'quizzes'), orderBy('createdAt', 'desc')),
      (snap) => {
        state.quizzes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.quizzes = true;
        checkEmit();
      },
      (err) => { console.warn('Quizzes sub error:', err); ready.quizzes = true; checkEmit(); }
    ),
    onSnapshot(
      query(collection(db, 'users', uid, 'quizAttempts'), orderBy('createdAt', 'desc')),
      (snap) => {
        state.attempts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ready.attempts = true;
        checkEmit();
      },
      (err) => { console.warn('Attempts sub error:', err); ready.attempts = true; checkEmit(); }
    ),
  ];

  return () => unsubs.forEach((u) => u && u());
}

/** Compute Progress Metrics from all modules */
export function computeProgressMetrics({
  tasks = [],
  notes = [],
  events = [],
  vault = [],
  flashcards = [],
  quizzes = [],
  attempts = [],
  studyStats = {},
}) {
  const completedTasks = tasks.filter((t) => t.status === 'done' || t.done).length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusMinutes = studyStats.totalFocusMinutes || (completedTasks * 30);
  const focusHours = (totalFocusMinutes / 60).toFixed(1);
  const streak = studyStats.streak || (completedTasks > 0 ? Math.min(7, completedTasks) : 0);

  // Quiz Performance
  const avgQuizScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
      : 0;

  // Flashcard Mastery
  const reviewedFlashcards = flashcards.filter((f) => f.difficulty && f.difficulty !== 'unreviewed').length;
  const easyFlashcards = flashcards.filter((f) => f.difficulty === 'easy').length;
  const flashcardMasteryRate =
    flashcards.length > 0 ? Math.round((easyFlashcards / flashcards.length) * 100) : 0;

  // Subject Progress breakdown
  const subjectMap = {};
  const allItems = [
    ...tasks.map((t) => ({ subject: t.subject, done: t.status === 'done' || t.done })),
    ...notes.map((n) => ({ subject: n.subject, done: true })),
    ...vault.map((v) => ({ subject: v.subject, done: true })),
    ...flashcards.map((f) => ({ subject: f.subject, done: f.difficulty === 'easy' })),
    ...quizzes.map((q) => ({ subject: q.subject, done: true })),
  ];

  allItems.forEach((item) => {
    const s = item.subject || 'Computer Science';
    if (!subjectMap[s]) subjectMap[s] = { total: 0, completed: 0 };
    subjectMap[s].total += 1;
    if (item.done) subjectMap[s].completed += 1;
  });

  const subjectProgress = Object.keys(subjectMap).map((subj) => {
    const { total, completed } = subjectMap[subj];
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { subject: subj, total, completed, percentage: pct };
  });

  // Semester Progress % (weighted average of tasks, quizzes, flashcards, resources)
  const semesterProgress = Math.min(
    100,
    Math.round(
      taskCompletionRate * 0.35 +
      avgQuizScore * 0.25 +
      flashcardMasteryRate * 0.2 +
      Math.min(100, vault.length * 10) * 0.2
    )
  );

  return {
    semesterProgress,
    taskCompletionRate,
    completedTasks,
    totalTasks,
    pendingTasks: totalTasks - completedTasks,
    focusHours,
    totalFocusMinutes,
    streak,
    avgQuizScore,
    quizAttemptsCount: attempts.length,
    totalFlashcards: flashcards.length,
    reviewedFlashcards,
    easyFlashcards,
    flashcardMasteryRate,
    totalResources: vault.length,
    totalNotes: notes.length,
    subjectProgress,
  };
}

/** Definition of all Achievements */
export const ACHIEVEMENTS_LIST = [
  {
    id: 'first_resource',
    badge: '📦',
    title: 'First Resource Added',
    description: 'Add your first academic resource to Resource Vault',
    category: 'Vault',
    evaluate: (data) => ({
      unlocked: data.totalResources >= 1,
      current: Math.min(1, data.totalResources),
      target: 1,
    }),
  },
  {
    id: 'first_flashcard_deck',
    badge: '🎴',
    title: 'First Flashcard Deck Created',
    description: 'Create your first flashcard deck in Flashcards Workspace',
    category: 'Flashcards',
    evaluate: (data) => ({
      unlocked: data.totalFlashcards >= 1,
      current: Math.min(1, data.totalFlashcards),
      target: 1,
    }),
  },
  {
    id: 'first_quiz_completed',
    badge: '📝',
    title: 'First Quiz Completed',
    description: 'Complete your first quiz assessment in Quiz Center',
    category: 'Quizzes',
    evaluate: (data) => ({
      unlocked: data.quizAttemptsCount >= 1,
      current: Math.min(1, data.quizAttemptsCount),
      target: 1,
    }),
  },
  {
    id: 'flashcards_reviewed_10',
    badge: '🔍',
    title: '10 Flashcards Reviewed',
    description: 'Review and rate difficulty for 10 flashcards',
    category: 'Flashcards',
    evaluate: (data) => ({
      unlocked: data.reviewedFlashcards >= 10,
      current: Math.min(10, data.reviewedFlashcards),
      target: 10,
    }),
  },
  {
    id: 'quizzes_completed_5',
    badge: '🎯',
    title: '5 Quizzes Completed',
    description: 'Complete 5 quiz assessments in Quiz Center',
    category: 'Quizzes',
    evaluate: (data) => ({
      unlocked: data.quizAttemptsCount >= 5,
      current: Math.min(5, data.quizAttemptsCount),
      target: 5,
    }),
  },
  {
    id: 'streak_7',
    badge: '🔥',
    title: '7-Day Study Streak',
    description: 'Maintain an active study streak for 7 consecutive days',
    category: 'Consistency',
    evaluate: (data) => ({
      unlocked: data.streak >= 7,
      current: Math.min(7, data.streak),
      target: 7,
    }),
  },
  {
    id: 'tasks_completed_10',
    badge: '✅',
    title: '10 Completed Tasks',
    description: 'Complete 10 academic tasks on your Task Board',
    category: 'Tasks',
    evaluate: (data) => ({
      unlocked: data.completedTasks >= 10,
      current: Math.min(10, data.completedTasks),
      target: 10,
    }),
  },
  {
    id: 'study_hours_25',
    badge: '⏳',
    title: '25 Study Hours',
    description: 'Log 25 focus study hours across your courses',
    category: 'Focus',
    evaluate: (data) => {
      const hours = parseFloat(data.focusHours || 0);
      return {
        unlocked: hours >= 25,
        current: Math.min(25, Math.round(hours)),
        target: 25,
      };
    },
  },
  {
    id: 'flashcards_reviewed_100',
    badge: '🧠',
    title: '100 Flashcards Reviewed',
    description: 'Review and master 100 flashcard study items',
    category: 'Flashcards',
    evaluate: (data) => ({
      unlocked: data.reviewedFlashcards >= 100,
      current: Math.min(100, data.reviewedFlashcards),
      target: 100,
    }),
  },
  {
    id: 'resource_collector',
    badge: '📚',
    title: 'Resource Collector',
    description: 'Store 10 or more academic resources in Resource Vault',
    category: 'Vault',
    evaluate: (data) => ({
      unlocked: data.totalResources >= 10,
      current: Math.min(10, data.totalResources),
      target: 10,
    }),
  },
  {
    id: 'quiz_master',
    badge: '🏆',
    title: 'Quiz Master',
    description: 'Achieve an average quiz score of 80% or higher',
    category: 'Quizzes',
    evaluate: (data) => ({
      unlocked: data.quizAttemptsCount >= 3 && data.avgQuizScore >= 80,
      current: Math.min(80, data.avgQuizScore),
      target: 80,
    }),
  },
  {
    id: 'deep_focus',
    badge: '⚡',
    title: 'Deep Focus',
    description: 'Log at least 5 focus study hours in Synapse',
    category: 'Focus',
    evaluate: (data) => {
      const hours = parseFloat(data.focusHours || 0);
      return {
        unlocked: hours >= 5,
        current: Math.min(5, Math.round(hours)),
        target: 5,
      };
    },
  },
  {
    id: 'productivity_master',
    badge: '⭐',
    title: 'Productivity Master',
    description: 'Achieve an overall semester completion progress of 75% or higher',
    category: 'Mastery',
    evaluate: (data) => ({
      unlocked: data.semesterProgress >= 75,
      current: Math.min(75, data.semesterProgress),
      target: 75,
    }),
  },
];

/** Evaluate all achievements against aggregated metrics */
export function evaluateAchievements(metrics, attempts = []) {
  const data = { ...metrics, attempts };
  return ACHIEVEMENTS_LIST.map((ach) => {
    const res = ach.evaluate(data);
    return {
      ...ach,
      unlocked: res.unlocked,
      progress: res.current,
      target: res.target,
      percent: Math.min(100, Math.round((res.current / Math.max(1, res.target)) * 100)),
      unlockDate: res.unlocked ? 'Unlocked' : null,
    };
  });
}

/** Compute AI Insights statistics & recommendations */
export function computeAiInsightsData({
  tasks = [],
  notes = [],
  events = [],
  vault = [],
  flashcards = [],
  quizzes = [],
  attempts = [],
  studyStats = {},
}) {
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'done' || t.done || !t.due) return false;
    return new Date(t.due) < new Date();
  });

  // Calculate most productive time dynamically based on activity timestamps
  const hourCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  [...tasks, ...attempts, ...vault].forEach((item) => {
    const dateStr = item.createdAt || item.uploadDate || item.completedAt;
    if (dateStr) {
      const hr = new Date(dateStr).getHours();
      if (hr >= 6 && hr < 12) hourCounts.morning++;
      else if (hr >= 12 && hr < 18) hourCounts.afternoon++;
      else if (hr >= 18 && hr < 24) hourCounts.evening++;
      else hourCounts.night++;
    }
  });

  let mostProductiveTime = '9:00 AM - 12:00 PM (Morning Focus)';
  const maxHr = Math.max(hourCounts.morning, hourCounts.afternoon, hourCounts.evening, hourCounts.night);
  if (maxHr > 0) {
    if (hourCounts.afternoon === maxHr) mostProductiveTime = '1:00 PM - 5:00 PM (Afternoon Study)';
    else if (hourCounts.evening === maxHr) mostProductiveTime = '6:00 PM - 10:00 PM (Evening Session)';
    else if (hourCounts.night === maxHr) mostProductiveTime = '12:00 AM - 4:00 AM (Night Owl Focus)';
  }

  // Subject Attention & Neglect breakdown
  const subjectCounts = {};
  [...tasks, ...notes, ...vault, ...flashcards, ...quizzes].forEach((item) => {
    const s = item.subject || 'Computer Science';
    subjectCounts[s] = (subjectCounts[s] || 0) + 1;
  });

  const sortedSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
  const mostAttentionSubject = sortedSubjects[0] ? sortedSubjects[0][0] : 'General Studies';
  const neglectedSubject = sortedSubjects.length > 1 ? sortedSubjects[sortedSubjects.length - 1][0] : 'None';

  // Dynamic recommendations array derived from live user data
  const recommendations = [];
  if (overdueTasks.length > 0) {
    recommendations.push(`Clear ${overdueTasks.length} overdue task(s) on your Task Board to maintain academic momentum.`);
  }
  if (neglectedSubject && neglectedSubject !== 'None') {
    recommendations.push(`Dedicate your next focus session to ${neglectedSubject}, as it currently receives the least study activity.`);
  }
  if (flashcards.length < 10) {
    recommendations.push(`Create more flashcards in ${mostAttentionSubject} to reinforce active recall and memory retention.`);
  }
  if (attempts.length === 0) {
    recommendations.push(`Take a quiz in Quiz Center to evaluate your knowledge and generate your first diagnostic performance report.`);
  }
  if (vault.length === 0) {
    recommendations.push(`Add academic reference materials to your Resource Vault to populate flashcards and quizzes.`);
  }
  if (recommendations.length === 0) {
    recommendations.push(`Excellent work! You are maintaining balanced study habits across all your enrolled subjects.`);
  }

  const totalFocusMin = studyStats.totalFocusMinutes || (tasks.filter((t) => t.status === 'done').length * 30);

  return {
    mostProductiveTime,
    mostAttentionSubject,
    neglectedSubject,
    overdueTasksCount: overdueTasks.length,
    overdueTasks,
    weeklyProductivityTrend: tasks.length > 0
      ? `Active study velocity: ${tasks.filter((t) => t.status === 'done').length} of ${tasks.length} tasks completed`
      : 'Start logging tasks to track weekly productivity trends',
    focusSessionTrend: `${totalFocusMin} total focus minutes logged (${(totalFocusMin / 60).toFixed(1)} hours)`,
    quizPerformanceSummary: attempts.length > 0
      ? `Average quiz score: ${Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length)}% across ${attempts.length} attempts`
      : 'No quiz attempts recorded yet',
    flashcardConsistency: flashcards.length > 0
      ? `${flashcards.filter((f) => f.difficulty === 'easy').length} / ${flashcards.length} cards mastered (${Math.round((flashcards.filter((f) => f.difficulty === 'easy').length / flashcards.length) * 100)}%)`
      : 'No flashcards created yet',
    recommendations,
  };
}
