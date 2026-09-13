import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Search, Plus, Star, Folder, FileText,
  Tag, Trash2, Edit2, Save, X,
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import { useData } from '../contexts/DataContext';
import styles from './Notes.module.css';

const SUBJECT_COLORS = {
  CS301:   '#6366f1',
  Math:    '#06b6d4',
  Physics: '#f59e0b',
  Other:   '#a855f7',
};

export default function Notes() {
  const { notes, addNote, editNote, removeNote } = useData();
  const [folder, setFolder] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const textRef = useRef(null);

  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0].id);
    }
    if (selectedId && notes.length > 0 && !notes.find((n) => n.id === selectedId)) {
      setSelectedId(notes[0]?.id || null);
    }
  }, [notes, selectedId]);

  const folders = useMemo(() => {
    const dynamic = [...new Set(notes.map((n) => n.folder).filter(Boolean))];
    return [
      { id: 'all', label: 'All Notes', icon: <FileText size={15} /> },
      { id: 'starred', label: 'Starred', icon: <Star size={15} /> },
      ...dynamic.map((f) => ({
        id: f,
        label: f,
        icon: <Folder size={15} />,
      })),
    ];
  }, [notes]);

  const filtered = notes.filter((n) => {
    const matchFolder =
      folder === 'all' ? true :
      folder === 'starred' ? n.starred :
      n.folder === folder;
    const matchSearch =
      search === '' || n.title.toLowerCase().includes(search.toLowerCase());
    return matchFolder && matchSearch;
  });

  const selected = notes.find((n) => n.id === selectedId) || filtered[0];

  const toggleStar = async (id) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    await editNote(id, { starred: !note.starred });
  };

  const startEdit = () => {
    if (!selected) return;
    setEditContent(selected.content);
    setEditTitle(selected.title);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    await editNote(selected.id, {
      content: editContent,
      title: editTitle,
      date: new Date().toISOString().split('T')[0],
    });
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  const deleteNote = async (id) => {
    await removeNote(id);
    if (selectedId === id) setSelectedId(null);
  };

  const handleAddNote = async () => {
    const id = await addNote({
      title: 'Untitled Note',
      subject: 'Other',
      folder: 'Other',
      content: '# Untitled Note\n\nStart writing here…',
    });
    if (id) {
      setSelectedId(id);
      setEditing(true);
      setEditTitle('Untitled Note');
      setEditContent('# Untitled Note\n\nStart writing here…');
    }
  };

  return (
    <PageWrapper title="Notes" subtitle="Your knowledge, organised">
      <div className={styles.layout}>
        <div className={styles.foldersPanel}>
          <div className={styles.foldersList}>
            {folders.map((f) => (
              <button
                key={f.id}
                className={`${styles.folderBtn} ${folder === f.id ? styles.activeFolder : ''}`}
                onClick={() => setFolder(f.id)}
              >
                <span className={styles.folderIcon}>{f.icon}</span>
                <span className={styles.folderLabel}>{f.label}</span>
                <span className={styles.folderCount}>
                  {f.id === 'all' ? notes.length :
                   f.id === 'starred' ? notes.filter((n) => n.starred).length :
                   notes.filter((n) => n.folder === f.id).length}
                </span>
              </button>
            ))}
          </div>
          <button className={styles.newNoteBtn} onClick={handleAddNote}>
            <Plus size={20} /> New Note
          </button>
        </div>

        <div className={styles.notesPanel}>
          <div className={styles.searchRow}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.notesList}>
            {filtered.length === 0 && (
              <div className={styles.emptySearch}>
                <FileText size={56} />
                <p>No notes found</p>
              </div>
            )}
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`${styles.noteCard} ${n.id === selectedId ? styles.activeNote : ''}`}
                onClick={() => { setSelectedId(n.id); setEditing(false); }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(n.id)}
              >
                <div className={styles.noteCardTop}>
                  <span className={styles.noteTitle}>{n.title}</span>
                  <button
                    className={`${styles.starBtn} ${n.starred ? styles.starred : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleStar(n.id); }}
                    aria-label={n.starred ? 'Unstar' : 'Star'}
                  >
                    <Star size={13} fill={n.starred ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className={styles.notePreview}>
                  {(n.content || '').replace(/[#*\n]/g, ' ').slice(0, 80)}…
                </p>
                <div className={styles.noteMeta}>
                  <span
                    className={styles.subjectChip}
                    style={{
                      background: `${SUBJECT_COLORS[n.subject] || SUBJECT_COLORS.Other}18`,
                      color: SUBJECT_COLORS[n.subject] || SUBJECT_COLORS.Other,
                    }}
                  >
                    <Tag size={9} /> {n.subject}
                  </span>
                  <span className={styles.noteDate}>{n.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.viewerPanel}>
          {!selected ? (
            <Card className={styles.emptyViewer}>
              <FileText size={40} />
              <p>Select a note to view it</p>
            </Card>
          ) : (
            <Card className={styles.viewerCard}>
              <div className={styles.viewerToolbar}>
                {editing ? (
                  <>
                    <input
                      className={styles.titleInput}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <div className={styles.toolbarActions}>
                      <button className={styles.toolBtn} onClick={cancelEdit} title="Cancel"><X size={16} /></button>
                      <button className={`${styles.toolBtn} ${styles.saveBtn}`} onClick={saveEdit} title="Save">
                        <Save size={16} /> Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className={styles.viewerTitle}>{selected.title}</h2>
                    <div className={styles.toolbarActions}>
                      <button
                        className={`${styles.starBtn} ${selected.starred ? styles.starred : ''}`}
                        onClick={() => toggleStar(selected.id)}
                      >
                        <Star size={16} fill={selected.starred ? 'currentColor' : 'none'} />
                      </button>
                      <button className={styles.toolBtn} onClick={startEdit} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`${styles.toolBtn} ${styles.deleteBtn}`}
                        onClick={() => deleteNote(selected.id)}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {!editing && (
                <div className={styles.viewerMeta}>
                  <span
                    className={styles.subjectChip}
                    style={{
                      background: `${SUBJECT_COLORS[selected.subject] || SUBJECT_COLORS.Other}18`,
                      color: SUBJECT_COLORS[selected.subject] || SUBJECT_COLORS.Other,
                    }}
                  >
                    <Tag size={10} /> {selected.subject}
                  </span>
                  <span className={styles.viewerDate}>{selected.date}</span>
                </div>
              )}

              {editing ? (
                <textarea
                  ref={textRef}
                  className={styles.editor}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  autoFocus
                />
              ) : (
                <div className={styles.content}>
                  {(selected.content || '').split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className={styles.h1}>{line.slice(2)}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i} className={styles.h2}>{line.slice(3)}</h2>;
                    if (line.startsWith('- ')) return <li key={i} className={styles.li}>{line.slice(2)}</li>;
                    if (line === '') return <br key={i} />;
                    return <p key={i} className={styles.p}>{line}</p>;
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
