import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  Clock,
  BookOpen,
  FileText,
  AlertCircle,
  StickyNote,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import { useData } from '../contexts/DataContext';
import styles from './CalendarPage.module.css';

const TYPE_ICONS = {
  class: <BookOpen size={12} />,
  assignment: <FileText size={12} />,
  exam: <AlertCircle size={12} />,
};

const TYPE_LABELS = { class: 'Class', assignment: 'Assignment', exam: 'Exam' };

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const {
    events: allEvents,
    notes: allNotes,
    addNote,
    editNote,
    removeNote,
  } = useData();

  const today = new Date();
  const [view, setView] = useState('month');
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // Calendar Note Form State
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth((m) => m + 1);
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentYear, currentMonth);
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDayOfWeek + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const eventsForDate = (dateStr) => allEvents.filter((e) => e.date === dateStr);
  const notesForDate = (dateStr) => allNotes.filter((n) => n.date === dateStr);

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Notes attached to selectedDate or current month
  const activeDateNotes = useMemo(() => {
    if (!selectedDate) return [];
    return notesForDate(selectedDate);
  }, [selectedDate, allNotes]);

  const activeDateEvents = useMemo(() => {
    if (selectedDate) return eventsForDate(selectedDate);
    return allEvents
      .filter((e) => {
        const [y, m] = e.date.split('-').map(Number);
        return y === currentYear && m === currentMonth + 1;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedDate, allEvents, currentYear, currentMonth]);

  // Handle Note Create/Update
  const handleOpenNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setShowNoteForm(true);
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title || '');
    setNoteContent(note.content || note.description || '');
    setShowNoteForm(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    if (!noteTitle.trim()) {
      alert('Please enter a note title.');
      return;
    }

    setSavingNote(true);
    try {
      if (editingNoteId) {
        await editNote(editingNoteId, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          date: selectedDate,
          folder: 'Calendar',
        });
      } else {
        await addNote({
          title: noteTitle.trim(),
          content: noteContent.trim(),
          date: selectedDate,
          subject: 'Calendar Note',
          folder: 'Calendar',
        });
      }
      setShowNoteForm(false);
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent('');
    } catch (err) {
      console.error('Error saving calendar note:', err);
      alert('Failed to save note: ' + (err.message || err));
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await removeNote(noteId);
      } catch (err) {
        console.error('Error deleting calendar note:', err);
      }
    }
  };

  return (
    <PageWrapper title="Calendar" subtitle="Schedule your academic life & manage personal date notes">
      <div className={styles.layout}>
        {/* ── Left: Calendar ── */}
        <div className={styles.calendarPanel}>
          <Card className={styles.calendarCard}>
            {/* Header */}
            <div className={styles.calHeader}>
              <div className={styles.calNav}>
                <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">
                  <ChevronLeft size={18} />
                </button>
                <h2 className={styles.monthTitle}>
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className={styles.viewToggle}>
                <button
                  className={`${styles.toggleBtn} ${view === 'month' ? styles.activeToggle : ''}`}
                  onClick={() => setView('month')}
                >
                  <Calendar size={14} /> Month
                </button>
                <button
                  className={`${styles.toggleBtn} ${view === 'week' ? styles.activeToggle : ''}`}
                  onClick={() => setView('week')}
                >
                  <List size={14} /> Week
                </button>
              </div>
            </div>

            {/* Day-of-week headers */}
            <div className={styles.dayHeaders}>
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className={styles.dayHeader}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className={styles.calGrid}>
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} className={styles.emptyCell} />;
                const dateStr = toDateStr(currentYear, currentMonth, day);
                const events = eventsForDate(dateStr);
                const dayNotes = notesForDate(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const hasNotes = dayNotes.length > 0;

                return (
                  <div
                    key={idx}
                    className={`${styles.dayCell}
                      ${isToday ? styles.today : ''}
                      ${isSelected ? styles.selected : ''}`}
                    onClick={() => {
                      setSelectedDate(isSelected ? null : dateStr);
                      setShowNoteForm(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && setSelectedDate(isSelected ? null : dateStr)
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span className={styles.dayNumber}>{day}</span>

                      {/* Visual Indicator for Calendar Note */}
                      {hasNotes && (
                        <span
                          className={styles.noteIndicatorBadge}
                          title={`${dayNotes.length} Note(s) attached`}
                        >
                          <StickyNote size={12} color="#F59E0B" />
                        </span>
                      )}
                    </div>

                    <div className={styles.eventDots}>
                      {events.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={styles.eventDot}
                          style={{ backgroundColor: ev.color }}
                          title={ev.title}
                        />
                      ))}
                      {events.length > 3 && (
                        <span className={styles.moreEventsLabel}>+{events.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              {[
                { type: 'class', color: '#6366f1', label: 'Class' },
                { type: 'assignment', color: '#f59e0b', label: 'Assignment' },
                { type: 'exam', color: '#ef4444', label: 'Exam' },
              ].map((l) => (
                <div key={l.type} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ backgroundColor: l.color }} />
                  <span>{l.label}</span>
                </div>
              ))}
              <div className={styles.legendItem}>
                <StickyNote size={13} color="#F59E0B" />
                <span>Personal Note</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right: Events & Personal Date Notes Sidebar ── */}
        <div className={styles.sidebar}>
          <Card className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>
                {selectedDate ? `Date: ${selectedDate}` : `${MONTH_NAMES[currentMonth]} Overview`}
              </h3>
              {selectedDate && (
                <button
                  className={styles.clearBtn}
                  onClick={() => {
                    setSelectedDate(null);
                    setShowNoteForm(false);
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Personal Date Notes Section */}
            {selectedDate ? (
              <div className={styles.notesSection}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleRow}>
                    <StickyNote size={16} color="#F59E0B" />
                    <h4>Personal Date Notes</h4>
                  </div>
                  {!showNoteForm && (
                    <button className={styles.addNoteBtn} onClick={handleOpenNewNote}>
                      <Plus size={14} /> Add Note
                    </button>
                  )}
                </div>

                {/* Note Form Drawer / Inline Form */}
                {showNoteForm && (
                  <form onSubmit={handleSaveNote} className={styles.noteFormBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className={styles.formTitle}>
                        {editingNoteId ? 'Edit Date Note' : 'Add Note for Date'}
                      </span>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => setShowNoteForm(false)}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <input
                      type="text"
                      className={styles.noteInput}
                      placeholder="Note Title (e.g. Math Midterm Prep)..."
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      required
                    />
                    <textarea
                      rows={3}
                      className={styles.noteTextarea}
                      placeholder="Enter description, study topics, or reminders..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => setShowNoteForm(false)}
                        disabled={savingNote}
                      >
                        Cancel
                      </button>
                      <button type="submit" className={styles.saveBtn} disabled={savingNote}>
                        {savingNote ? 'Saving...' : editingNoteId ? 'Update' : 'Save Note'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Display Attached Notes */}
                {activeDateNotes.length === 0 && !showNoteForm ? (
                  <div className={styles.emptyNotesBox}>
                    <p>No personal notes attached to this date yet.</p>
                    <button className={styles.addNoteLink} onClick={handleOpenNewNote}>
                      + Create a note for {selectedDate}
                    </button>
                  </div>
                ) : (
                  <div className={styles.notesList}>
                    {activeDateNotes.map((note) => (
                      <div key={note.id} className={styles.dateNoteCard}>
                        <div className={styles.noteCardHeader}>
                          <span className={styles.noteCardTitle}>{note.title}</span>
                          <div className={styles.noteActions}>
                            <button
                              className={styles.iconBtn}
                              onClick={() => handleEditNote(note)}
                              title="Edit Note"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              className={`${styles.iconBtn} ${styles.danger}`}
                              onClick={() => handleDeleteNote(note.id)}
                              title="Delete Note"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {note.content && (
                          <p className={styles.noteCardContent}>{note.content}</p>
                        )}
                        <span className={styles.noteCardDate}>
                          Attached: {note.date || selectedDate}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.divider} />
              </div>
            ) : (
              <div className={styles.selectHintBox}>
                <p>Click any date on the calendar to view or attach personal notes.</p>
              </div>
            )}

            {/* Scheduled Events Section */}
            <div className={styles.eventsSection}>
              <div className={styles.sectionHeader} style={{ marginBottom: '8px' }}>
                <div className={styles.sectionTitleRow}>
                  <Calendar size={15} color="#4F46E5" />
                  <h4>{selectedDate ? 'Scheduled Events' : 'Upcoming Month Events'}</h4>
                </div>
              </div>

              {activeDateEvents.length === 0 ? (
                <div className={styles.noEvents}>
                  <Calendar size={56} />
                  <p>No events scheduled for this view.</p>
                </div>
              ) : (
                <div className={styles.eventsList}>
                  {activeDateEvents.map((ev) => (
                    <div key={ev.id} className={styles.eventCard}>
                      <div
                        className={styles.eventColorBar}
                        style={{ backgroundColor: ev.color }}
                      />
                      <div className={styles.eventInfo}>
                        <div className={styles.eventTitle}>{ev.title}</div>
                        <div className={styles.eventMeta}>
                          <span className={styles.eventType}>
                            {TYPE_ICONS[ev.type]}
                            {TYPE_LABELS[ev.type]}
                          </span>
                          {ev.time && (
                            <span className={styles.eventTime}>
                              <Clock size={11} /> {ev.time}
                            </span>
                          )}
                        </div>
                        <div className={styles.eventDate}>{ev.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
