import React, { useState } from 'react';
import { Plus, X, Flag, Calendar, Tag, CheckCircle2, Circle, Clock } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import { useData } from '../contexts/DataContext';
import styles from './TaskBoard.module.css';

const PRIORITY_META = {
  high:   { color: 'var(--color-danger, #ef4444)',   label: 'High'   },
  medium: { color: 'var(--color-warning, #f59e0b)',  label: 'Medium' },
  low:    { color: 'var(--color-success, #10b981)',  label: 'Low'    },
};

const SUBJECT_COLORS = {
  CS301:   '#6366f1',
  Math:    '#06b6d4',
  Physics: '#f59e0b',
  English: '#10b981',
  Other:   '#a855f7',
};

const COLUMNS = [
  { id: 'todo',       label: 'To Do',      icon: <Circle       size={16} /> },
  { id: 'inProgress', label: 'In Progress', icon: <Clock        size={16} /> },
  { id: 'done',       label: 'Done',        icon: <CheckCircle2 size={16} /> },
];

function isTaskOverdue(task) {
  if (!task?.due || task.status === 'done') return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return task.due < todayStr;
}

export default function TaskBoard() {
  const { tasksByStatus, addTask, removeTask, moveTask } = useData();
  const [addingCol, setAddingCol] = useState(null);
  const [form, setForm] = useState({
    title: '', subject: 'Other', priority: 'medium', due: '',
  });
  const [saving, setSaving] = useState(false);

  const openAddForm = (colId) => {
    setAddingCol(colId);
    setForm({ title: '', subject: 'Other', priority: 'medium', due: '' });
  };
  const closeAddForm = () => setAddingCol(null);

  const handleFormChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddTask = async (colId) => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      await addTask({ ...form, status: colId });
      closeAddForm();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (taskId) => {
    await removeTask(taskId);
  };

  const handleMove = async (fromCol, toCol, taskId) => {
    await moveTask(taskId, toCol);
  };

  const tasks = tasksByStatus;

  return (
    <PageWrapper title="Task Board" subtitle="Manage your academic workload">
      <div className={styles.board}>
        {COLUMNS.map((col) => (
          <div key={col.id} className={styles.column}>
            <div className={styles.colHeader}>
              <div className={styles.colTitleRow}>
                <span className={`${styles.colIcon} ${styles[col.id]}`}>{col.icon}</span>
                <span className={styles.colLabel}>{col.label}</span>
                <span className={styles.countBadge}>{tasks[col.id].length}</span>
              </div>
              <button
                className={styles.addBtn}
                onClick={() => openAddForm(col.id)}
                aria-label={`Add task to ${col.label}`}
              >
                <Plus size={16} />
              </button>
            </div>

            {addingCol === col.id && (
              <Card className={styles.addForm}>
                <div className={styles.formHeader}>
                  <span className={styles.formTitle}>New Task</span>
                  <button className={styles.closeBtn} onClick={closeAddForm}>
                    <X size={14} />
                  </button>
                </div>
                <input
                  className={styles.formInput}
                  placeholder="Task title…"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  autoFocus
                />
                <div className={styles.formRow}>
                  <select
                    className={styles.formSelect}
                    value={form.subject}
                    onChange={(e) => handleFormChange('subject', e.target.value)}
                  >
                    {Object.keys(SUBJECT_COLORS).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    className={styles.formSelect}
                    value={form.priority}
                    onChange={(e) => handleFormChange('priority', e.target.value)}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <input
                  className={styles.formInput}
                  type="date"
                  value={form.due}
                  onChange={(e) => handleFormChange('due', e.target.value)}
                />
                <div className={styles.formActions}>
                  <button className={styles.cancelBtn} onClick={closeAddForm}>Cancel</button>
                  <button
                    className={styles.saveBtn}
                    onClick={() => handleAddTask(col.id)}
                    disabled={saving}
                  >
                    {saving ? 'Adding…' : 'Add Task'}
                  </button>
                </div>
              </Card>
            )}

            <div className={styles.taskList}>
              {tasks[col.id].length === 0 && (
                <div className={styles.emptyCol}>
                  <CheckCircle2 size={48} />
                  <span>No tasks here</span>
                </div>
              )}

              {tasks[col.id].map((task) => {
                const overdue = isTaskOverdue(task);
                return (
                <Card
                  key={task.id}
                  className={`${styles.taskCard} ${overdue ? styles.taskOverdue : ''}`}
                >
                  <div
                    className={styles.priorityStripe}
                    style={{ backgroundColor: PRIORITY_META[task.priority]?.color }}
                  />

                  <div className={styles.taskBody}>
                    <div className={styles.taskTop}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemove(task.id)}
                        aria-label="Remove task"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className={styles.taskMeta}>
                      <span
                        className={styles.subjectBadge}
                        style={{
                          backgroundColor: `${SUBJECT_COLORS[task.subject] || SUBJECT_COLORS.Other}22`,
                          color: SUBJECT_COLORS[task.subject] || SUBJECT_COLORS.Other,
                        }}
                      >
                        <Tag size={10} /> {task.subject}
                      </span>
                      <span
                        className={styles.priorityBadge}
                        style={{ color: PRIORITY_META[task.priority]?.color }}
                      >
                        <Flag size={10} /> {PRIORITY_META[task.priority]?.label}
                      </span>
                    </div>

                    {task.due && (
                      <div
                        className={`${styles.dueDate} ${overdue ? styles.dueDateOverdue : ''}`}
                      >
                        <Calendar size={11} /> Due {task.due}
                      </div>
                    )}

                    <div className={styles.moveRow}>
                      {col.id !== 'todo' && (
                        <button
                          className={styles.moveBtn}
                          onClick={() =>
                            handleMove(
                              col.id,
                              col.id === 'done' ? 'inProgress' : 'todo',
                              task.id
                            )
                          }
                        >
                          ← Move Back
                        </button>
                      )}
                      {col.id !== 'done' && (
                        <button
                          className={`${styles.moveBtn} ${styles.moveFwd}`}
                          onClick={() =>
                            handleMove(
                              col.id,
                              col.id === 'todo' ? 'inProgress' : 'done',
                              task.id
                            )
                          }
                        >
                          Move Forward →
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
