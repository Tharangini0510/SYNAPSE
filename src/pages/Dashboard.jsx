// =============================================================
// Dashboard.jsx – Main dashboard with adaptive greeting & stats
// =============================================================
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, CheckSquare, Flame, Plus, ArrowRight, BookOpen } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { useAdaptive } from '../contexts/AdaptiveContext';
import { useData } from '../contexts/DataContext';
import { getGreeting } from '../utils/helpers';
import styles from './Dashboard.module.css';

function StatCard({ icon: Icon, label, value, trend, color }) {
  return (
    <Card className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color + '18', color }}>
        <Icon size={20} />
      </div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
      {trend && <div className={styles.statTrend}>{trend}</div>}
    </Card>
  );
}

function TaskItem({ task, onToggle }) {
  return (
    <div className={`${styles.taskItem} ${task.done ? styles.taskDone : ''}`}>
      <button
        className={`${styles.taskCheck} ${task.done ? styles.taskCheckDone : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.done && <span className={styles.checkmark}>✓</span>}
      </button>
      <div className={styles.taskContent}>
        <span className={styles.taskTitle}>{task.title}</span>
        <span className={styles.taskMeta}>
          {task.subject}
          {task.due ? ` · Due ${task.due}` : ''}
        </span>
      </div>
      <Badge
        variant={
          task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'
        }
        size="sm"
      >
        {task.priority}
      </Badge>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { modeConfig } = useAdaptive();
  const {
    tasks,
    notes,
    events,
    analytics,
    aiSuggestions,
    toggleTaskDone,
    formatRelativeTime,
  } = useData();
  const [aiIndex, setAiIndex] = useState(0);

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = useMemo(() => {
    const open = tasks.filter((t) => t.status !== 'done' || t.due === todayStr);
    const dueToday = tasks.filter(
      (t) => t.due === todayStr || (!t.due && t.status !== 'done')
    );
    const list = (dueToday.length ? dueToday : open).slice(0, 6);
    return list.map((t) => ({
      ...t,
      done: t.status === 'done' || t.done,
    }));
  }, [tasks, todayStr]);

  const schedule = useMemo(() => {
    return events
      .filter((e) => e.date === todayStr)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
      .slice(0, 6)
      .map((e) => ({
        time: e.time || '--:--',
        label: e.title,
        dur: e.duration || e.type,
        color: e.color,
      }));
  }, [events, todayStr]);

  const recentNotes = useMemo(() => notes.slice(0, 3), [notes]);

  const suggestions = aiSuggestions.length
    ? aiSuggestions
    : [{ id: 1, text: 'Add tasks and notes to get personalised suggestions.' }];

  const doneCount = todayTasks.filter((t) => t.done).length;
  const stats = analytics.stats;

  return (
    <PageWrapper title="Dashboard">
      <div className={styles.page}>
        <div className={styles.greeting}>
          <div>
            <h2 className={styles.greetingText}>
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'} 👋
            </h2>
            <p className={styles.greetingSubtext}>
              You're in <strong>{modeConfig.label}</strong> mode. Here's your overview for today.
            </p>
          </div>
          <div
            className={styles.modeBadge}
            style={{ background: modeConfig.color + '18', color: modeConfig.color }}
          >
            <span>{modeConfig.icon}</span>
            <span>{modeConfig.label}</span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard
            icon={CheckSquare}
            label="Tasks Due Today"
            value={String(stats.tasksDueToday)}
            trend={`${tasks.filter((t) => t.status !== 'done').length} open total`}
            color="#EF4444"
          />
          <StatCard
            icon={Clock}
            label="Study Hours Today"
            value={`${Math.round(((stats.focusSessionsToday || 0) * 25) / 60 * 10) / 10}h`}
            trend={`Lifetime: ${stats.totalStudyHours}h`}
            color="#4F46E5"
          />
          <StatCard
            icon={Flame}
            label="Study Streak"
            value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`}
            trend={stats.streak > 0 ? 'Keep it going!' : 'Start a focus session'}
            color="#F59E0B"
          />
          <StatCard
            icon={TrendingUp}
            label="Weekly Progress"
            value={`${stats.weeklyProgress || 0}%`}
            trend={`${stats.tasksCompleted} tasks done`}
            color="#10B981"
          />
        </div>

        <div className={styles.mainGrid}>
          <Card className={styles.tasksCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>Today's Tasks</h3>
                <p className={styles.cardSubtitle}>
                  {doneCount}/{todayTasks.length || 0} completed
                </p>
              </div>
              <Link to="/tasks">
                <Button variant="ghost" size="sm">
                  <Plus size={14} />
                  Add task
                </Button>
              </Link>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${todayTasks.length ? (doneCount / todayTasks.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className={styles.taskList}>
              {todayTasks.length === 0 ? (
                <p className={styles.cardSubtitle}>No tasks yet. Add some on the Task Board.</p>
              ) : (
                todayTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onToggle={toggleTaskDone} />
                ))
              )}
            </div>
          </Card>

          <div className={styles.rightCol}>
            <Card
              className={styles.aiCard}
              style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #F0FDF4 100%)' }}
            >
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>✨ AI Suggestion</h3>
                  <p className={styles.cardSubtitle}>Personalised for {modeConfig.label}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiIndex((i) => (i + 1) % suggestions.length)}
                >
                  Next →
                </Button>
              </div>
              <p className={styles.aiText}>{suggestions[aiIndex % suggestions.length].text}</p>
              <div className={styles.aiDots}>
                {suggestions.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.aiDot} ${i === aiIndex % suggestions.length ? styles.aiDotActive : ''}`}
                    onClick={() => setAiIndex(i)}
                    aria-label={`Suggestion ${i + 1}`}
                  />
                ))}
              </div>
            </Card>

            <Card>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>⏱️ Today's Schedule</h3>
              </div>
              <div className={styles.scheduleList}>
                {schedule.length === 0 ? (
                  <p className={styles.cardSubtitle}>
                    No events today. Add some on the Calendar.
                  </p>
                ) : (
                  schedule.map((s) => (
                    <div key={`${s.time}-${s.label}`} className={styles.scheduleItem}>
                      <div className={styles.scheduleTime}>{s.time}</div>
                      <div className={styles.scheduleDot} style={{ background: s.color }} />
                      <div className={styles.scheduleLabel}>{s.label}</div>
                      <Badge variant="neutral" size="sm">
                        {s.dur}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className={styles.notesSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <BookOpen size={18} />
              Recent Notes
            </h3>
            <Link to="/notes">
              <Button variant="ghost" size="sm">
                View all <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          <div className={styles.notesGrid}>
            {recentNotes.length === 0 ? (
              <p className={styles.cardSubtitle}>No notes yet. Create one in Notes.</p>
            ) : (
              recentNotes.map((note) => (
                <Card key={note.id} hoverable className={styles.noteCard}>
                  <div className={styles.noteTitle}>{note.title}</div>
                  <div className={styles.notePreview}>{note.preview || note.content?.slice(0, 80)}</div>
                  <div className={styles.noteUpdated}>
                    Updated {formatRelativeTime(note.updatedAt) || note.date}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default Dashboard;
