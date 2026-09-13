// =============================================================
// services/analyticsService.js – Derive analytics from live data
// =============================================================

const SUBJECT_COLORS = [
  '#4F46E5',
  '#F59E0B',
  '#10B981',
  '#60A5FA',
  '#EF4444',
  '#94A3B8',
  '#A855F7',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Build chart-ready analytics from tasks, notes, events, and studyStats.
 */
export function computeAnalytics({ tasks = [], notes = [], events = [], studyStats = {} }) {
  const now = new Date();
  const today = startOfDay(now);

  // Weekly hours placeholder from focus minutes distributed if no session log
  const totalFocusHours = (studyStats.totalFocusMinutes || 0) / 60;

  const weeklyHours = DAY_LABELS.map((day, i) => {
    // Attribute focus sessions today to today's weekday; others 0 unless we have data
    const isToday = i === now.getDay();
    const hours = isToday
      ? Math.round(((studyStats.focusSessionsToday || 0) * 25) / 60 * 10) / 10
      : 0;
    return { day, hours };
  });

  // If we have total focus but nothing today-specific, show a flat weekly estimate
  if (totalFocusHours > 0 && weeklyHours.every((d) => d.hours === 0)) {
    const perDay = Math.round((totalFocusHours / 7) * 10) / 10;
    weeklyHours.forEach((d) => {
      d.hours = perDay;
    });
  }

  const monthlyHours = [
    { day: 'Week 1', hours: Math.round(totalFocusHours * 0.2 * 10) / 10 },
    { day: 'Week 2', hours: Math.round(totalFocusHours * 0.25 * 10) / 10 },
    { day: 'Week 3', hours: Math.round(totalFocusHours * 0.25 * 10) / 10 },
    { day: 'Week 4', hours: Math.round(totalFocusHours * 0.3 * 10) / 10 },
  ];

  // Task completion by week (last 4 weeks)
  const taskTrend = [3, 2, 1, 0].map((weeksAgo) => {
    const end = new Date(today);
    end.setDate(end.getDate() - weeksAgo * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const inRange = tasks.filter((t) => {
      const d = toDate(t.updatedAt) || toDate(t.createdAt);
      return d && d >= start && d < end;
    });
    const completed = inRange.filter((t) => t.status === 'done' || t.done).length;
    return {
      week: `Week ${4 - weeksAgo}`,
      completed,
      total: inRange.length,
    };
  });

  // Subject distribution from tasks
  const subjectCounts = {};
  tasks.forEach((t) => {
    const s = t.subject || 'Other';
    subjectCounts[s] = (subjectCounts[s] || 0) + 1;
  });
  notes.forEach((n) => {
    const s = n.subject || 'Other';
    subjectCounts[s] = (subjectCounts[s] || 0) + 0.5;
  });

  const totalSubject = Object.values(subjectCounts).reduce((a, b) => a + b, 0) || 1;
  const subjectDist = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], i) => ({
      name,
      value: Math.round((value / totalSubject) * 100),
      color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
    }));

  // Subject performance table
  const subjectPerf = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([subject, count], i) => {
      const subjectTasks = tasks.filter((t) => t.subject === subject);
      const done = subjectTasks.filter((t) => t.status === 'done' || t.done).length;
      const score =
        subjectTasks.length > 0
          ? Math.round((done / subjectTasks.length) * 100)
          : Math.min(100, Math.round(40 + count * 10));
      return {
        subject,
        hours: Math.round(count * 2),
        tasks: subjectTasks.length,
        score,
        color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
      };
    });

  const doneTasks = tasks.filter((t) => t.status === 'done' || t.done).length;
  const dueToday = tasks.filter((t) => {
    if (!t.due || t.status === 'done') return false;
    return t.due === today.toISOString().split('T')[0];
  }).length;

  const avgDaily =
    totalFocusHours > 0 ? Math.round((totalFocusHours / Math.max(1, studyStats.streak || 1)) * 10) / 10 : 0;

  return {
    weeklyHours,
    monthlyHours,
    taskTrend,
    subjectDist: subjectDist.length
      ? subjectDist
      : [{ name: 'No data yet', value: 100, color: '#94A3B8' }],
    subjectPerf,
    stats: {
      totalStudyHours: Math.round(totalFocusHours * 10) / 10,
      tasksCompleted: doneTasks,
      streak: studyStats.streak || 0,
      avgDaily,
      tasksDueToday: dueToday,
      notesCount: notes.length,
      eventsCount: events.length,
      weeklyProgress: studyStats.weeklyProgress || 0,
      focusSessionsToday: studyStats.focusSessionsToday || 0,
      totalFocusMinutes: studyStats.totalFocusMinutes || 0,
    },
  };
}

/**
 * Format relative time for activity feeds.
 */
export function formatRelativeTime(value) {
  const d = toDate(value);
  if (!d) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 2880) return 'Yesterday';
  return `${Math.floor(mins / 1440)}d ago`;
}

/**
 * Build recent activity list from tasks/notes/events.
 */
export function buildRecentActivity({ tasks = [], notes = [], events = [], modeLabel }) {
  const items = [];

  tasks.slice(0, 10).forEach((t) => {
    const when = t.updatedAt || t.createdAt;
    items.push({
      icon: t.status === 'done' ? '✅' : '📋',
      text:
        t.status === 'done'
          ? `Completed "${t.title}"`
          : `Task updated: "${t.title}"`,
      time: formatRelativeTime(when),
      sort: toDate(when)?.getTime() || 0,
    });
  });

  notes.slice(0, 10).forEach((n) => {
    const when = n.updatedAt || n.createdAt;
    items.push({
      icon: '📝',
      text: `Note: "${n.title}"`,
      time: formatRelativeTime(when),
      sort: toDate(when)?.getTime() || 0,
    });
  });

  events.slice(0, 5).forEach((e) => {
    const when = e.updatedAt || e.createdAt;
    items.push({
      icon: '📅',
      text: `Event: "${e.title}"`,
      time: formatRelativeTime(when),
      sort: toDate(when)?.getTime() || 0,
    });
  });

  if (modeLabel) {
    items.push({
      icon: '🎯',
      text: `Current mode: ${modeLabel}`,
      time: 'Now',
      sort: Date.now(),
    });
  }

  return items.sort((a, b) => b.sort - a.sort).slice(0, 8);
}

/**
 * Generate AI suggestion texts from live user context (no hardcoded student data).
 */
export function buildAiSuggestions({ modeLabel, tasks = [], streak = 0 }) {
  const open = tasks.filter((t) => t.status !== 'done');
  const high = open.filter((t) => t.priority === 'high');
  const dueSoon = open.filter((t) => t.due).slice(0, 3);

  return [
    {
      id: 1,
      text: `You're in ${modeLabel} mode. ${
        high.length
          ? `Prioritise ${high.length} high-priority task${high.length > 1 ? 's' : ''}: "${high[0].title}".`
          : open.length
            ? `You have ${open.length} open task${open.length > 1 ? 's' : ''}. Start with a focused 25-minute session.`
            : 'No open tasks yet — add something on the Task Board to get a personalised plan.'
      }`,
    },
    {
      id: 2,
      text: dueSoon.length
        ? `Upcoming deadlines: ${dueSoon.map((t) => `${t.title} (${t.due})`).join(', ')}. Block time on your calendar today.`
        : 'No upcoming due dates found. Add due dates to tasks so Synapse can prioritise for you.',
    },
    {
      id: 3,
      text:
        streak > 0
          ? `Your study streak is ${streak} day${streak > 1 ? 's' : ''} strong. Take short breaks every 90 minutes to stay sharp.`
          : 'Start a Focus Mode session today to begin building your study streak.',
    },
  ];
}
