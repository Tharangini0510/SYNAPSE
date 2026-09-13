// =============================================================
// constants.js – Application-wide constants
// =============================================================

/** Adaptive learning modes with display metadata */
export const ADAPTIVE_MODES = {
  normal: {
    id: 'normal',
    label: 'Normal Semester',
    description: 'Balanced productivity for your regular schedule.',
    icon: '📚',
    color: '#4F46E5',
  },
  exam: {
    id: 'exam',
    label: 'Exam Week',
    description: 'Intensified focus — prioritise revision and past papers.',
    icon: '📝',
    color: '#7C3AED',
  },
  deadline: {
    id: 'deadline',
    label: 'Deadline Tomorrow',
    description: 'High urgency mode — clear the queue fast.',
    icon: '🔥',
    color: '#EF4444',
  },
  focus: {
    id: 'focus',
    label: 'Focus Mode',
    description: 'Distraction-free deep work. Minimal UI, maximum output.',
    icon: '🎯',
    color: '#0F172A',
  },
};

/** Navigation items for the sidebar */
export const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',   icon: 'LayoutDashboard', path: '/dashboard' },
  {
    id: 'knowledge-hub',
    label: 'Knowledge Hub',
    icon: 'Library',
    children: [
      { id: 'study-vault', label: 'Resource Vault', icon: 'FolderArchive', path: '/study-vault' },
      { id: 'flashcards',  label: 'Flashcards',  icon: 'Layers',        path: '/flashcards' },
      { id: 'quiz-center', label: 'Quiz Center', icon: 'HelpCircle',    path: '/quiz-center' },
    ],
  },
  {
    id: 'academic-growth',
    label: 'Academic Growth',
    icon: 'GraduationCap',
    children: [
      { id: 'progress-tracker', label: 'Progress Tracker', icon: 'TrendingUp', path: '/progress-tracker' },
      { id: 'achievements',     label: 'Achievements',     icon: 'Award',      path: '/achievements' },
      { id: 'ai-insights',      label: 'AI Insights',      icon: 'Brain',      path: '/ai-insights' },
    ],
  },
  {
    id: 'community-support',
    label: 'Community & Support',
    icon: 'Users',
    children: [
      { id: 'study-groups', label: 'Study Groups',  icon: 'Users',    path: '/study-groups' },
      { id: 'help-support', label: 'Help & Support', icon: 'LifeBuoy', path: '/help-support' },
    ],
  },
  { id: 'calendar',   label: 'Calendar',    icon: 'Calendar',        path: '/calendar' },
  { id: 'tasks',      label: 'Task Board',  icon: 'KanbanSquare',    path: '/tasks' },
  { id: 'focus',      label: 'Focus Mode',  icon: 'Target',          path: '/focus' },
  { id: 'analytics',  label: 'Analytics',   icon: 'BarChart2',       path: '/analytics' },
  { id: 'notes',      label: 'Notes',       icon: 'FileText',        path: '/notes' },
  { id: 'ai-planner', label: 'AI Planner',  icon: 'Sparkles',        path: '/ai-planner' },
];

export const NAV_BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
  { id: 'profile',  label: 'Profile',  icon: 'User',     path: '/profile' },
];

/** Pomodoro timer defaults (seconds) */
export const POMODORO_DEFAULTS = {
  work:       25 * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
};

/** Sample subjects for demo data */
export const SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Data Structures',
  'Algorithms',
  'Database Systems',
  'Software Engineering',
  'Machine Learning',
];

/** Task priority levels */
export const PRIORITIES = {
  low:    { label: 'Low',    color: '#10B981' },
  medium: { label: 'Medium', color: '#F59E0B' },
  high:   { label: 'High',   color: '#EF4444' },
};

/** Task board columns */
export const TASK_COLUMNS = [
  { id: 'todo',        label: 'To Do' },
  { id: 'inprogress',  label: 'In Progress' },
  { id: 'done',        label: 'Done' },
];
