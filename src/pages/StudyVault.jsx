// =============================================================
// StudyVault.jsx – Academic Resource Vault (Firestore Only)
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Globe, Video, Link as LinkIcon, FileCode,
  BookOpen, GraduationCap, Layers, Search, Plus, Trash2, Edit3,
  ExternalLink, Copy, Star, Check, Sparkles, FolderArchive, BookMarked
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS } from '../utils/constants';
import {
  subscribeToStudyVault,
  addVaultResource,
  updateVaultResource,
  toggleFavouriteResource,
  deleteVaultResource,
} from '../services/studyVaultService';
import styles from './StudyVault.module.css';

const RESOURCE_TYPES = [
  { label: 'Lecture Notes', value: 'Lecture Notes', icon: FileText, color: '#6366F1' },
  { label: 'Video Lecture', value: 'Video Lecture', icon: Video, color: '#EF4444' },
  { label: 'Research Paper', value: 'Research Paper', icon: GraduationCap, color: '#EC4899' },
  { label: 'Documentation', value: 'Documentation', icon: FileCode, color: '#10B981' },
  { label: 'Tutorial', value: 'Tutorial', icon: Globe, color: '#0EA5E9' },
  { label: 'Assignment', value: 'Assignment', icon: BookMarked, color: '#D97706' },
  { label: 'Practice Problems', value: 'Practice Problems', icon: Layers, color: '#F59E0B' },
  { label: 'Reference Material', value: 'Reference Material', icon: BookOpen, color: '#3B82F6' },
  { label: 'Book / eBook', value: 'Book / eBook', icon: BookOpen, color: '#8B5CF6' },
  { label: 'External Resource', value: 'External Resource', icon: LinkIcon, color: '#1FA463' },
  { label: 'Other', value: 'Other', icon: Layers, color: '#6B7280' },
];

function getResourceTypeIcon(type) {
  const item = RESOURCE_TYPES.find((t) => t.value === type);
  if (!item) return { Icon: Globe, color: '#4F46E5' };
  return { Icon: item.icon, color: item.color };
}

export default function StudyVault() {
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid || user?.uid;

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controls
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [favOnly, setFavOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Modals & Feedback
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [aiNotice, setAiNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subject: SUBJECTS[0] || 'Computer Science',
    type: 'Lecture Notes',
    url: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (!uid) {
      setResources([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToStudyVault(
      uid,
      (list) => {
        setResources(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading resources:', err);
        setLoading(false);
      }
    );

    return () => unsub && unsub();
  }, [uid]);

  const filteredResources = useMemo(() => {
    return resources
      .filter((res) => {
        const query = search.toLowerCase().trim();
        const matchesTitle = (res.title || '').toLowerCase().includes(query);
        const matchesSubjectText = (res.subject || '').toLowerCase().includes(query);
        const matchesTags = (res.tags || []).some((t) => t.toLowerCase().includes(query));
        const matchesDesc = (res.description || '').toLowerCase().includes(query);
        const matchesSearch = !query || matchesTitle || matchesSubjectText || matchesTags || matchesDesc;

        const matchesSubjectFilter = selectedSubject === 'All' || res.subject === selectedSubject;
        const matchesTypeFilter = selectedType === 'All' || res.type === selectedType;
        const matchesFavFilter = !favOnly || res.isFavourite;

        return matchesSearch && matchesSubjectFilter && matchesTypeFilter && matchesFavFilter;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dateAdded || a.uploadDate || 0);
        const dateB = new Date(b.dateAdded || b.uploadDate || 0);
        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        if (sortBy === 'alphabetical') return (a.title || '').localeCompare(b.title || '');
        return 0;
      });
  }, [resources, search, selectedSubject, selectedType, favOnly, sortBy]);

  const handleOpenModal = (resource = null) => {
    setAiNotice('');
    if (resource) {
      setEditingResource(resource);
      setFormData({
        title: resource.title || '',
        subject: resource.subject || SUBJECTS[0] || 'Computer Science',
        type: resource.type || 'Lecture Notes',
        url: resource.url || '',
        description: resource.description || '',
        tags: (resource.tags || []).join(', '),
      });
    } else {
      setEditingResource(null);
      setFormData({
        title: '',
        subject: SUBJECTS[0] || 'Computer Science',
        type: 'Lecture Notes',
        url: '',
        description: '',
        tags: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResource(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid) {
      alert('Authentication required. Please sign in.');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter a Resource Title.');
      return;
    }

    if (!formData.url.trim()) {
      alert('Please enter a Resource Link (URL).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingResource) {
        await updateVaultResource(uid, editingResource.id, {
          title: formData.title,
          subject: formData.subject,
          type: formData.type,
          url: formData.url,
          description: formData.description,
          tags: formData.tags,
        });
      } else {
        await addVaultResource(uid, {
          title: formData.title,
          subject: formData.subject,
          type: formData.type,
          url: formData.url,
          description: formData.description,
          tags: formData.tags,
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving resource:', err);
      alert('Error saving resource: ' + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (res) => {
    if (!uid) return;
    if (window.confirm(`Are you sure you want to delete "${res.title}"?`)) {
      try {
        await deleteVaultResource(uid, res.id);
      } catch (err) {
        console.error('Error deleting resource:', err);
        alert('Failed to delete resource: ' + (err.message || err));
      }
    }
  };

  const handleToggleFav = async (res) => {
    if (!uid) return;
    try {
      await toggleFavouriteResource(uid, res.id, res.isFavourite);
    } catch (err) {
      console.error('Error toggling favourite:', err);
    }
  };

  const handleCopyLink = (res) => {
    if (!res.url) return;
    navigator.clipboard.writeText(res.url);
    setCopiedId(res.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAiAction = (actionType, resourceTitle) => {
    setAiNotice(`AI ${actionType} feature ready for "${resourceTitle}". Context indexing linked for study synthesis.`);
    setTimeout(() => setAiNotice(''), 6000);
  };

  return (
    <PageWrapper title="Resource Vault" subtitle="Your personal academic resource manager">
      <div className={styles.container}>
        {/* Header Action Bar */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 className={styles.pageTitle}>Academic Resource Vault</h2>
            <p className={styles.pageSubtitle}>
              Save and organize your study links, video lectures, documentation, and research references in one place.
            </p>
          </div>
          <div className={styles.actionGroup}>
            <button className={styles.primaryBtn} onClick={() => handleOpenModal()}>
              <Plus size={20} /> Add Resource
            </button>
          </div>
        </div>

        {/* Global AI Notice Banner */}
        {aiNotice && (
          <div className={styles.aiSection} style={{ marginBottom: '1rem' }}>
            <div className={styles.aiBadge}>
              <Sparkles size={14} /> AI Context Ready
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text)', flex: 1, marginLeft: '8px' }}>
              {aiNotice}
            </span>
            <button className={styles.aiPillBtn} onClick={() => setAiNotice('')}>Dismiss</button>
          </div>
        )}

        {/* Control Bar: Search, Filters, Sorting */}
        <div className={styles.controlBar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by title, subject, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
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

            <select
              className={styles.selectInput}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All">All Resource Types</option>
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <button
              type="button"
              className={`${styles.secondaryBtn} ${favOnly ? styles.favActiveBtn : ''}`}
              onClick={() => setFavOnly((f) => !f)}
              style={{
                borderColor: favOnly ? '#F59E0B' : undefined,
                color: favOnly ? '#D97706' : undefined,
                background: favOnly ? 'rgba(245, 158, 11, 0.12)' : undefined,
              }}
            >
              <Star size={14} fill={favOnly ? '#F59E0B' : 'none'} color={favOnly ? '#F59E0B' : 'currentColor'} />
              {favOnly ? 'Favourites Only' : 'All Favourites'}
            </button>

            <select
              className={styles.selectInput}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="alphabetical">Sort: Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className={styles.emptyState}>
            <FolderArchive size={40} className={styles.emptyIcon} />
            <p>Loading your academic resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderArchive size={64} className={styles.emptyIcon} />
            <h3>No academic resources saved yet</h3>
            <p>Click "Add Resource" to save study links, video lectures, documentation, and references.</p>
          </div>
        ) : (
          <div className={styles.resourceGrid}>
            {filteredResources.map((res) => {
              const { Icon, color } = getResourceTypeIcon(res.type);
              const isCopied = copiedId === res.id;
              return (
                <div key={res.id} className={styles.resourceCard}>
                  <div className={styles.cardTop}>
                    <div
                      className={styles.typeBadgeIcon}
                      style={{ background: `${color}18`, color: color }}
                    >
                      <Icon size={22} />
                    </div>
                    <div className={styles.cardInfo}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <h4 className={styles.resourceTitle}>{res.title}</h4>
                        <button
                          type="button"
                          className={styles.favToggleBtn}
                          onClick={() => handleToggleFav(res)}
                          title={res.isFavourite ? 'Unfavourite' : 'Mark as Favourite'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        >
                          <Star
                            size={16}
                            color={res.isFavourite ? '#F59E0B' : 'var(--color-muted)'}
                            fill={res.isFavourite ? '#F59E0B' : 'none'}
                          />
                        </button>
                      </div>

                      {res.description && (
                        <p className={styles.resourceDesc}>{res.description}</p>
                      )}

                      {res.tags && res.tags.length > 0 && (
                        <div className={styles.tagRow}>
                          {res.tags.map((tag, idx) => (
                            <span key={idx} className={styles.customTagChip}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Assistance Suite */}
                  <div className={styles.aiSection}>
                    <div className={styles.aiBadge}>
                      <Sparkles size={13} /> AI Suite
                    </div>
                    <div className={styles.aiActions}>
                      <button
                        className={styles.aiPillBtn}
                        onClick={() => handleAiAction('Summarize', res.title)}
                        title="Summarise resource"
                      >
                        Summarise
                      </button>
                      <button
                        className={styles.aiPillBtn}
                        onClick={() => handleAiAction('Flashcard Generator', res.title)}
                        title="Generate flashcards"
                      >
                        Flashcards
                      </button>
                      <button
                        className={styles.aiPillBtn}
                        onClick={() => handleAiAction('Quiz Generator', res.title)}
                        title="Generate quiz questions"
                      >
                        Quiz
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardMeta}>
                    <span>Added: {res.dateAdded || res.uploadDate}</span>
                    <div className={styles.cardActions}>
                      {/* Copy Link */}
                      <button
                        className={styles.actionIconButton}
                        onClick={() => handleCopyLink(res)}
                        title={isCopied ? 'Link Copied!' : 'Copy Link'}
                      >
                        {isCopied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      </button>

                      {/* Open Resource Link */}
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionIconButton}
                        title="Open Resource Link"
                      >
                        <ExternalLink size={14} />
                      </a>

                      {/* Edit Resource */}
                      <button
                        className={styles.actionIconButton}
                        onClick={() => handleOpenModal(res)}
                        title="Edit Resource"
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Delete Resource */}
                      <button
                        className={`${styles.actionIconButton} ${styles.danger}`}
                        onClick={() => handleDelete(res)}
                        title="Delete Resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Resource Modal */}
        {showModal && (
          <div className={styles.modalBackdrop} onClick={handleCloseModal}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingResource ? 'Edit Academic Resource' : 'Add Academic Resource'}
                </h3>
                <button className={styles.closeBtn} onClick={handleCloseModal}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>&times;</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resource Title *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Data Structures & Algorithms Guide"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resource Link (URL) *</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    placeholder="e.g. https://youtube.com/watch?v=... or Google Drive / GitHub / Documentation link"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description (Optional)</label>
                  <textarea
                    rows={3}
                    className={styles.formTextarea}
                    placeholder="Brief summary, key chapters, or reference notes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tags (Optional, comma-separated)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. revision, midterms, algorithms"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className={styles.secondaryBtn} onClick={handleCloseModal} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                    {submitting ? 'Saving...' : editingResource ? 'Update Resource' : 'Save Resource'}
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
