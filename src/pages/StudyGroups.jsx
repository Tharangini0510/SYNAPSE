// =============================================================
// StudyGroups.jsx – Collaborative Academic Study Groups
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Plus, Search, LogIn, LogOut, Edit3, Trash2,
  Megaphone, FileText, CheckSquare, Calendar, UserMinus,
  X, Check, ExternalLink, Globe, Shield, Clock
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS } from '../utils/constants';
import {
  subscribeToStudyGroups,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  removeGroupMember,
  updateStudyGroup,
  deleteStudyGroup,
  addGroupAnnouncement,
  addSharedNoteLink,
  addSharedVaultLink,
  addGroupTask,
  addStudySession,
} from '../services/studyGroupService';
import styles from './StudyGroups.module.css';

export default function StudyGroups() {
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [directoryTab, setDirectoryTab] = useState('all'); // 'all' | 'my'

  // Selected Group Workspace State
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [subTab, setSubTab] = useState('announcements'); // 'announcements' | 'resources' | 'tasks' | 'sessions' | 'members'

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(null); // null | 'announcement' | 'note' | 'task' | 'session'

  // Forms
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    subject: SUBJECTS[0] || 'Computer Science',
  });
  const [modalInput, setModalInput] = useState({ text: '', title: '', url: '', date: '', time: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToStudyGroups(
      (list) => {
        setGroups(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching study groups:', err);
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, []);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const isMember = g.members?.some((m) => m.uid === uid);
      const matchesDirectory = directoryTab === 'all' || isMember;
      const matchesSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = selectedSubject === 'All' || g.subject === selectedSubject;
      return matchesDirectory && matchesSearch && matchesSubject;
    });
  }, [groups, directoryTab, search, selectedSubject, uid]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const isUserMember = useMemo(() => {
    if (!activeGroup || !uid) return false;
    return activeGroup.members?.some((m) => m.uid === uid);
  }, [activeGroup, uid]);

  const isUserCreator = useMemo(() => {
    if (!activeGroup || !uid) return false;
    return activeGroup.creatorId === uid;
  }, [activeGroup, uid]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!uid || !groupForm.name.trim()) return;

    setSubmitting(true);
    try {
      const newId = await createStudyGroup(uid, user || {}, groupForm);
      setShowCreateModal(false);
      setSelectedGroupId(newId);
    } catch (err) {
      console.error('Error creating study group:', err);
      alert('Failed to create group: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (group) => {
    if (!uid) return;
    await joinStudyGroup(uid, user || {}, group.id, group.members);
    setSelectedGroupId(group.id);
  };

  const handleLeave = async (group) => {
    if (!uid) return;
    if (window.confirm(`Leave group "${group.name}"?`)) {
      await leaveStudyGroup(uid, group.id, group.members);
      if (selectedGroupId === group.id) setSelectedGroupId(null);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (window.confirm(`Are you sure you want to delete "${group.name}"? This cannot be undone.`)) {
      await deleteStudyGroup(group.id);
      if (selectedGroupId === group.id) setSelectedGroupId(null);
    }
  };

  const handleRemoveMember = async (memberObj) => {
    if (!activeGroup) return;
    if (window.confirm(`Remove ${memberObj.name} from group?`)) {
      await removeGroupMember(activeGroup.id, memberObj);
    }
  };

  const handleSaveSubItem = async (e) => {
    e.preventDefault();
    if (!activeGroup || !showAddModal) return;

    setSubmitting(true);
    try {
      if (showAddModal === 'announcement') {
        await addGroupAnnouncement(activeGroup.id, modalInput.text, user?.name || user?.email, uid);
      } else if (showAddModal === 'note') {
        await addSharedNoteLink(activeGroup.id, {
          title: modalInput.title,
          url: modalInput.url,
          sharedBy: user?.name || 'Member',
        });
      } else if (showAddModal === 'task') {
        await addGroupTask(activeGroup.id, {
          title: modalInput.title,
          assignedTo: 'Group',
        });
      } else if (showAddModal === 'session') {
        await addStudySession(activeGroup.id, {
          title: modalInput.title,
          date: modalInput.date,
          time: modalInput.time,
          link: modalInput.url,
          host: user?.name || 'Group',
        });
      }
      setShowAddModal(null);
      setModalInput({ text: '', title: '', url: '', date: '', time: '' });
    } catch (err) {
      console.error('Error adding content:', err);
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Study Groups" subtitle="Collaborate with peers, share resources & schedule study sessions">
      <div className={styles.container}>
        {/* Header Action Bar */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 className={styles.pageTitle}>Study Group Workspace</h2>
            <p className={styles.pageSubtitle}>
              {selectedGroupId ? `Active Workspace: ${activeGroup?.name}` : 'Browse and join academic study groups'}
            </p>
          </div>
          <div className={styles.actionGroup}>
            {selectedGroupId && (
              <button className={styles.secondaryBtn} onClick={() => setSelectedGroupId(null)}>
                &larr; Back to Directory
              </button>
            )}
            <button className={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
              <Plus size={20} /> Create Study Group
            </button>
          </div>
        </div>

        {/* ── MODE A: Directory View ── */}
        {!selectedGroupId ? (
          <>
            {/* Control Bar */}
            <div className={styles.controlBar}>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search groups by name or topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  className={styles.selectInput}
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="All">All Subjects</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <div className={styles.tabGroup}>
                  <button
                    className={`${styles.tabBtn} ${directoryTab === 'all' ? styles.activeTab : ''}`}
                    onClick={() => setDirectoryTab('all')}
                  >
                    <Globe size={14} /> All Groups ({groups.length})
                  </button>
                  <button
                    className={`${styles.tabBtn} ${directoryTab === 'my' ? styles.activeTab : ''}`}
                    onClick={() => setDirectoryTab('my')}
                  >
                    <Users size={14} /> My Groups ({groups.filter((g) => g.members?.some((m) => m.uid === uid)).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Groups Grid */}
            {loading ? (
              <div className={styles.emptyState}>
                <Users size={40} />
                <p>Loading study groups...</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className={styles.emptyState}>
                <Users size={64} />
                <h3>No study groups found</h3>
                <p>Create a group to collaborate with fellow students.</p>
                <button className={styles.primaryBtn} onClick={() => setShowCreateModal(true)} style={{ marginTop: '8px' }}>
                  <Plus size={20} /> Create Study Group
                </button>
              </div>
            ) : (
              <div className={styles.groupsGrid}>
                {filteredGroups.map((g) => {
                  const isMember = g.members?.some((m) => m.uid === uid);
                  const isCreator = g.creatorId === uid;
                  return (
                    <div key={g.id} className={styles.groupCard}>
                      <div>
                        <div className={styles.groupHeader}>
                          <span className={styles.subjectTag}>{g.subject}</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-muted)' }}>
                            {g.members?.length || 0} Members
                          </span>
                        </div>
                        <h4 className={styles.groupTitle}>{g.name}</h4>
                        {g.description && <p className={styles.groupDesc}>{g.description}</p>}
                      </div>

                      <div className={styles.groupMetaRow}>
                        <span>Created {g.createdDate}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className={styles.secondaryBtn}
                            onClick={() => setSelectedGroupId(g.id)}
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            Open Group
                          </button>

                          {isMember ? (
                            <button
                              className={styles.secondaryBtn}
                              onClick={() => handleLeave(g)}
                              style={{ padding: '4px 8px', fontSize: '12px', color: '#EF4444' }}
                              title="Leave Group"
                            >
                              <LogOut size={14} />
                            </button>
                          ) : (
                            <button
                              className={styles.primaryBtn}
                              onClick={() => handleJoin(g)}
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                            >
                              <LogIn size={14} /> Join
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* ── MODE B: Group Workspace Detail View ── */
          activeGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Group Workspace Header Card */}
              <div className={styles.detailHeaderCard}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.subjectTag}>{activeGroup.subject}</span>
                    {isUserCreator && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <Shield size={12} /> Group Creator
                      </span>
                    )}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>{activeGroup.name}</h2>
                  {activeGroup.description && (
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-muted)' }}>{activeGroup.description}</p>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                    Created by {activeGroup.creatorName} &bull; {activeGroup.members?.length || 0} Members
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isUserCreator && (
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => handleDeleteGroup(activeGroup)}
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 size={15} /> Delete Group
                    </button>
                  )}
                  {isUserMember ? (
                    <button className={styles.secondaryBtn} onClick={() => handleLeave(activeGroup)}>
                      <LogOut size={15} /> Leave Group
                    </button>
                  ) : (
                    <button className={styles.primaryBtn} onClick={() => handleJoin(activeGroup)}>
                      <LogIn size={15} /> Join Group
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-tabs Row */}
              <div className={styles.subTabsRow}>
                <button
                  className={`${styles.subTabBtn} ${subTab === 'announcements' ? styles.activeSubTab : ''}`}
                  onClick={() => setSubTab('announcements')}
                >
                  <Megaphone size={14} /> Announcements ({activeGroup.announcements?.length || 0})
                </button>
                <button
                  className={`${styles.subTabBtn} ${subTab === 'resources' ? styles.activeSubTab : ''}`}
                  onClick={() => setSubTab('resources')}
                >
                  <FileText size={14} /> Shared Resources ({activeGroup.sharedNotes?.length + activeGroup.sharedVault?.length || 0})
                </button>
                <button
                  className={`${styles.subTabBtn} ${subTab === 'tasks' ? styles.activeSubTab : ''}`}
                  onClick={() => setSubTab('tasks')}
                >
                  <CheckSquare size={14} /> Group Tasks ({activeGroup.sharedTasks?.length || 0})
                </button>
                <button
                  className={`${styles.subTabBtn} ${subTab === 'sessions' ? styles.activeSubTab : ''}`}
                  onClick={() => setSubTab('sessions')}
                >
                  <Calendar size={14} /> Study Sessions ({activeGroup.upcomingSessions?.length || 0})
                </button>
                <button
                  className={`${styles.subTabBtn} ${subTab === 'members' ? styles.activeSubTab : ''}`}
                  onClick={() => setSubTab('members')}
                >
                  <Users size={14} /> Members ({activeGroup.members?.length || 0})
                </button>
              </div>

              {/* Sub-tab Content Panels */}
              <div className={styles.contentCard}>
                {/* 1. Announcements */}
                {subTab === 'announcements' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 className={styles.cardTitle}>Group Announcements</h3>
                      {isUserMember && (
                        <button className={styles.primaryBtn} onClick={() => setShowAddModal('announcement')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Plus size={14} /> Post Announcement
                        </button>
                      )}
                    </div>
                    {activeGroup.announcements?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No announcements posted yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeGroup.announcements.map((ann) => (
                          <div key={ann.id} className={styles.listItem} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {ann.authorName}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{ann.createdAt}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text)' }}>{ann.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Shared Resources */}
                {subTab === 'resources' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 className={styles.cardTitle}>Shared Notes & Study Vault Links</h3>
                      {isUserMember && (
                        <button className={styles.primaryBtn} onClick={() => setShowAddModal('note')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Plus size={14} /> Share Link
                        </button>
                      )}
                    </div>
                    {activeGroup.sharedNotes?.length === 0 && activeGroup.sharedVault?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No shared resources yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[...activeGroup.sharedNotes, ...activeGroup.sharedVault].map((res) => (
                          <div key={res.id} className={styles.listItem}>
                            <div>
                              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{res.title}</span>
                              <span style={{ fontSize: '11px', color: 'var(--color-muted)', marginLeft: '8px' }}>
                                Shared by {res.sharedBy}
                              </span>
                            </div>
                            {res.url && (
                              <a href={res.url} target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn} style={{ padding: '4px 8px' }}>
                                <ExternalLink size={14} /> Open
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Group Tasks */}
                {subTab === 'tasks' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 className={styles.cardTitle}>Group Study Tasks</h3>
                      {isUserMember && (
                        <button className={styles.primaryBtn} onClick={() => setShowAddModal('task')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Plus size={14} /> Add Group Task
                        </button>
                      )}
                    </div>
                    {activeGroup.sharedTasks?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No group tasks created yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeGroup.sharedTasks.map((t) => (
                          <div key={t.id} className={styles.listItem}>
                            <span style={{ fontWeight: 600 }}>{t.title}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Assigned: {t.assignedTo}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Study Sessions */}
                {subTab === 'sessions' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 className={styles.cardTitle}>Upcoming Group Study Sessions</h3>
                      {isUserMember && (
                        <button className={styles.primaryBtn} onClick={() => setShowAddModal('session')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                          <Plus size={14} /> Schedule Session
                        </button>
                      )}
                    </div>
                    {activeGroup.upcomingSessions?.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>No study sessions scheduled yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activeGroup.upcomingSessions.map((sess) => (
                          <div key={sess.id} className={styles.listItem}>
                            <div>
                              <span style={{ fontWeight: 700 }}>{sess.title}</span>
                              <span style={{ fontSize: '12px', color: 'var(--color-muted)', marginLeft: '8px' }}>
                                {sess.date} at {sess.time} (Host: {sess.host})
                              </span>
                            </div>
                            {sess.link && (
                              <a href={sess.link} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn} style={{ padding: '4px 10px', fontSize: '12px' }}>
                                Join Session
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Members List */}
                {subTab === 'members' && (
                  <div>
                    <h3 className={styles.cardTitle} style={{ marginBottom: '1rem' }}>Group Members ({activeGroup.members?.length || 0})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activeGroup.members?.map((m) => (
                        <div key={m.uid} className={styles.listItem}>
                          <div>
                            <span style={{ fontWeight: 700 }}>{m.name}</span>
                            {m.role === 'creator' && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', marginLeft: '8px' }}>[Creator]</span>
                            )}
                            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{m.email} &bull; Joined {m.joinedAt}</div>
                          </div>

                          {isUserCreator && m.uid !== uid && (
                            <button
                              className={styles.secondaryBtn}
                              onClick={() => handleRemoveMember(m)}
                              style={{ padding: '4px 8px', color: '#EF4444' }}
                              title="Remove Member"
                            >
                              <UserMinus size={14} /> Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowCreateModal(false)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Create New Study Group</h3>
                <button className={styles.closeBtn} onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Group Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Data Structures Study Circle"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <select
                    className={styles.formSelect}
                    value={groupForm.subject}
                    onChange={(e) => setGroupForm({ ...groupForm, subject: e.target.value })}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    rows={3}
                    className={styles.formTextarea}
                    placeholder="Brief description of group goals, meeting times, or topics..."
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Content Modal */}
        {showAddModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowAddModal(null)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {showAddModal === 'announcement' && 'Post Announcement'}
                  {showAddModal === 'note' && 'Share Resource Link'}
                  {showAddModal === 'task' && 'Add Group Task'}
                  {showAddModal === 'session' && 'Schedule Study Session'}
                </h3>
                <button className={styles.closeBtn} onClick={() => setShowAddModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSubItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {showAddModal === 'announcement' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Announcement Text</label>
                    <textarea
                      rows={4}
                      className={styles.formTextarea}
                      placeholder="Write your group announcement..."
                      value={modalInput.text}
                      onChange={(e) => setModalInput({ ...modalInput, text: e.target.value })}
                      required
                    />
                  </div>
                )}

                {(showAddModal === 'note' || showAddModal === 'task' || showAddModal === 'session') && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="Title..."
                      value={modalInput.title}
                      onChange={(e) => setModalInput({ ...modalInput, title: e.target.value })}
                      required
                    />
                  </div>
                )}

                {(showAddModal === 'note' || showAddModal === 'session') && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Link URL</label>
                    <input
                      type="url"
                      className={styles.formInput}
                      placeholder="https://..."
                      value={modalInput.url}
                      onChange={(e) => setModalInput({ ...modalInput, url: e.target.value })}
                    />
                  </div>
                )}

                {showAddModal === 'session' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Date</label>
                      <input
                        type="date"
                        className={styles.formInput}
                        value={modalInput.date}
                        onChange={(e) => setModalInput({ ...modalInput, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Time</label>
                      <input
                        type="time"
                        className={styles.formInput}
                        value={modalInput.time}
                        onChange={(e) => setModalInput({ ...modalInput, time: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setShowAddModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Post Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
