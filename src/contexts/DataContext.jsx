// =============================================================
// DataContext.jsx – Live Firestore data for the signed-in user
// =============================================================
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTaskStatus,
  groupTasksByStatus,
} from '../services/taskService';
import {
  subscribeToNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../services/noteService';
import {
  subscribeToEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../services/eventService';
import {
  subscribeToNotifications,
  createNotification,
  markNotificationRead,
} from '../services/notificationService';
import { updateUserProfile } from '../services/userService';
import {
  computeAnalytics,
  buildRecentActivity,
  buildAiSuggestions,
  formatRelativeTime,
} from '../services/analyticsService';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user, firebaseUser, authReady } = useAuth();
  const uid = firebaseUser?.uid;

  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    // Wait for auth to settle so we do not clear workspace during hydration
    if (!authReady) {
      setDataLoading(true);
      return undefined;
    }

    if (!uid) {
      setTasks([]);
      setNotes([]);
      setEvents([]);
      setNotifications([]);
      setDataError('');
      setDataLoading(false);
      return undefined;
    }

    setDataLoading(true);
    setDataError('');

    let cancelled = false;
    const ready = { tasks: false, notes: false, events: false, notifs: false };
    const checkReady = () => {
      if (!cancelled && Object.values(ready).every(Boolean)) setDataLoading(false);
    };

    const onErr = (key) => (err) => {
      console.error(err);
      if (!cancelled) {
        setDataError(err.message || 'Failed to load data.');
        // Do not wipe lists on error — keep any already-loaded data
        ready[key] = true;
        checkReady();
      }
    };

    const unsubs = [
      subscribeToTasks(
        uid,
        (list) => {
          if (cancelled) return;
          setTasks(list);
          ready.tasks = true;
          checkReady();
        },
        onErr('tasks')
      ),
      subscribeToNotes(
        uid,
        (list) => {
          if (cancelled) return;
          setNotes(list);
          ready.notes = true;
          checkReady();
        },
        onErr('notes')
      ),
      subscribeToEvents(
        uid,
        (list) => {
          if (cancelled) return;
          setEvents(list);
          ready.events = true;
          checkReady();
        },
        onErr('events')
      ),
      subscribeToNotifications(
        uid,
        (list) => {
          if (cancelled) return;
          setNotifications(list);
          ready.notifs = true;
          checkReady();
        },
        onErr('notifs')
      ),
    ];

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u && u());
    };
  }, [uid, authReady]);

  const tasksByStatus = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  const analytics = useMemo(
    () =>
      computeAnalytics({
        tasks,
        notes,
        events,
        studyStats: user?.studyStats || {},
      }),
    [tasks, notes, events, user?.studyStats]
  );

  const recentActivity = useMemo(
    () =>
      buildRecentActivity({
        tasks,
        notes,
        events,
        modeLabel: user?.adaptiveSettings?.mode,
      }),
    [tasks, notes, events, user?.adaptiveSettings?.mode]
  );

  const aiSuggestions = useMemo(
    () =>
      buildAiSuggestions({
        modeLabel: user?.adaptiveSettings?.mode || 'Normal Semester',
        tasks,
        streak: user?.studyStats?.streak || 0,
      }),
    [user, tasks]
  );

  // ── Task actions ──
  const addTask = useCallback(
    async (task) => {
      if (!uid) return null;
      return createTask(uid, task);
    },
    [uid]
  );

  const editTask = useCallback(
    async (taskId, data) => {
      if (!uid) return;
      await updateTask(uid, taskId, data);
    },
    [uid]
  );

  const removeTask = useCallback(
    async (taskId) => {
      if (!uid) return;
      await deleteTask(uid, taskId);
    },
    [uid]
  );

  const moveTask = useCallback(
    async (taskId, status) => {
      if (!uid) return;
      await moveTaskStatus(uid, taskId, status);
    },
    [uid]
  );

  const toggleTaskDone = useCallback(
    async (taskId) => {
      if (!uid) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const next = task.status === 'done' ? 'todo' : 'done';
      await moveTaskStatus(uid, taskId, next);
    },
    [uid, tasks]
  );

  // ── Note actions ──
  const addNote = useCallback(
    async (note) => {
      if (!uid) return null;
      return createNote(uid, note);
    },
    [uid]
  );

  const editNote = useCallback(
    async (noteId, data) => {
      if (!uid) return;
      await updateNote(uid, noteId, data);
    },
    [uid]
  );

  const removeNote = useCallback(
    async (noteId) => {
      if (!uid) return;
      await deleteNote(uid, noteId);
    },
    [uid]
  );

  // ── Event actions ──
  const addEvent = useCallback(
    async (event) => {
      if (!uid) return null;
      return createEvent(uid, event);
    },
    [uid]
  );

  const editEvent = useCallback(
    async (eventId, data) => {
      if (!uid) return;
      await updateEvent(uid, eventId, data);
    },
    [uid]
  );

  const removeEvent = useCallback(
    async (eventId) => {
      if (!uid) return;
      await deleteEvent(uid, eventId);
    },
    [uid]
  );

  // ── Notifications ──
  const pushNotification = useCallback(
    async (payload) => {
      if (!uid) return null;
      return createNotification(uid, payload);
    },
    [uid]
  );

  const readNotification = useCallback(
    async (id) => {
      if (!uid) return;
      await markNotificationRead(uid, id);
    },
    [uid]
  );

  // ── Focus / study stats ──
  const recordFocusSession = useCallback(
    async (minutes = 25) => {
      if (!uid || !user) return;
      const today = new Date().toISOString().split('T')[0];
      const stats = { ...(user.studyStats || {}) };
      const sameDay = stats.focusSessionsDate === today;

      const last = stats.lastStudyDate;
      let streak = stats.streak || 0;
      if (last !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        streak = last === yStr ? streak + 1 : 1;
      }

      await updateUserProfile(uid, {
        studyStats: {
          ...stats,
          streak,
          lastStudyDate: today,
          totalFocusMinutes: (stats.totalFocusMinutes || 0) + minutes,
          focusSessionsToday: sameDay ? (stats.focusSessionsToday || 0) + 1 : 1,
          focusSessionsDate: today,
          weeklyProgress: Math.min(100, (stats.weeklyProgress || 0) + 5),
        },
      });

      await createNotification(uid, {
        text: `Focus session completed — ${minutes} min`,
        type: 'success',
      });
    },
    [uid, user]
  );

  const value = useMemo(
    () => ({
      tasks,
      tasksByStatus,
      notes,
      events,
      notifications,
      analytics,
      recentActivity,
      aiSuggestions,
      dataLoading,
      dataError,
      formatRelativeTime,
      addTask,
      editTask,
      removeTask,
      moveTask,
      toggleTaskDone,
      addNote,
      editNote,
      removeNote,
      addEvent,
      editEvent,
      removeEvent,
      pushNotification,
      readNotification,
      recordFocusSession,
    }),
    [
      tasks,
      tasksByStatus,
      notes,
      events,
      notifications,
      analytics,
      recentActivity,
      aiSuggestions,
      dataLoading,
      dataError,
      addTask,
      editTask,
      removeTask,
      moveTask,
      toggleTaskDone,
      addNote,
      editNote,
      removeNote,
      addEvent,
      editEvent,
      removeEvent,
      pushNotification,
      readNotification,
      recordFocusSession,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used inside <DataProvider>');
  }
  return context;
}
