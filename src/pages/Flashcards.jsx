// =============================================================
// Flashcards.jsx – Modern Interactive Flashcard Deck Suite
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Plus, Search, RotateCw, ChevronLeft, ChevronRight,
  Edit3, Trash2, Sparkles, X, Check, Eye, Grid, BookOpen, Shuffle,
  FolderArchive, Star, CheckCircle, AlertCircle, ExternalLink, RefreshCw
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS } from '../utils/constants';
import {
  subscribeToFlashcards,
  createFlashcard,
  updateFlashcard,
  updateFlashcardDifficulty,
  deleteFlashcard,
} from '../services/flashcardService';
import { subscribeToStudyVault } from '../services/studyVaultService';
import { generateFlashcardsFromResourceItem } from '../services/resourceIntegrationService';
import styles from './Flashcards.module.css';

export default function Flashcards() {
  const navigate = useNavigate();
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid || user?.uid;

  const [cards, setCards] = useState([]);
  const [vaultResources, setVaultResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState('All'); // 'All' | 'easy' | 'medium' | 'hard'
  const [viewMode, setViewMode] = useState('study'); // 'study' | 'manage'

  // Study Stage State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    subject: SUBJECTS[0] || 'Computer Science',
  });
  const [submitting, setSubmitting] = useState(false);
  const [aiNotice, setAiNotice] = useState('');

  // Resource Selection Modal State
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [generatingResource, setGeneratingResource] = useState(false);

  useEffect(() => {
    if (!uid) {
      setCards([]);
      setVaultResources([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubFlash = subscribeToFlashcards(
      uid,
      (list) => {
        setCards(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading flashcards:', err);
        setLoading(false);
      }
    );

    const unsubVault = subscribeToStudyVault(
      uid,
      (list) => {
        setVaultResources(list);
      },
      (err) => console.error('Error loading vault resources:', err)
    );

    return () => {
      unsubFlash && unsubFlash();
      unsubVault && unsubVault();
    };
  }, [uid]);

  // Filtered Cards Memo
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        card.front.toLowerCase().includes(search.toLowerCase()) ||
        card.back.toLowerCase().includes(search.toLowerCase());
      const matchesSubject =
        selectedSubject === 'All' || card.subject === selectedSubject;
      const matchesDiff =
        selectedDifficultyFilter === 'All' || card.difficulty === selectedDifficultyFilter;
      return matchesSearch && matchesSubject && matchesDiff;
    });
  }, [cards, search, selectedSubject, selectedDifficultyFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = cards.length;
    const reviewed = cards.filter((c) => c.difficulty && c.difficulty !== 'unreviewed').length;
    const known = cards.filter((c) => c.difficulty === 'easy').length;
    const revision = cards.filter((c) => c.difficulty === 'hard' || c.difficulty === 'medium').length;
    const remaining = total - reviewed;
    return { total, reviewed, known, revision, remaining };
  }, [cards]);

  useEffect(() => {
    if (currentIndex >= filteredCards.length) {
      setCurrentIndex(Math.max(0, filteredCards.length - 1));
    }
  }, [filteredCards, currentIndex]);

  const currentCard = filteredCards[currentIndex];

  // Active Resource Vault Item being studied
  const activeStudyResource = useMemo(() => {
    if (!vaultResources.length) return null;
    if (currentCard?.subject) {
      const found = vaultResources.find((r) => r.subject === currentCard.subject);
      if (found) return found;
    }
    return vaultResources[0];
  }, [vaultResources, currentCard]);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    if (filteredCards.length <= 1) return;
    let rand = Math.floor(Math.random() * filteredCards.length);
    if (rand === currentIndex) rand = (rand + 1) % filteredCards.length;
    setCurrentIndex(rand);
  };

  const handleMarkDifficulty = async (difficulty) => {
    if (!currentCard || !uid) return;
    await updateFlashcardDifficulty(uid, currentCard.id, difficulty);
  };

  const handleToggleFavourite = async () => {
    if (!currentCard || !uid) return;
    const isFav = !currentCard.isFavourite;
    await updateFlashcard(uid, currentCard.id, { isFavourite: isFav });
  };

  const handleOpenModal = (card = null) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        front: card.front,
        back: card.back,
        subject: card.subject,
      });
    } else {
      setEditingCard(null);
      setFormData({
        front: '',
        back: '',
        subject: SUBJECTS[0] || 'Computer Science',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCard(null);
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!uid) return;

    if (!formData.front || !formData.back) {
      alert('Please fill out both the front question and back answer.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCard) {
        await updateFlashcard(uid, editingCard.id, {
          front: formData.front,
          back: formData.back,
          subject: formData.subject,
        });
      } else {
        await createFlashcard(uid, {
          front: formData.front,
          back: formData.back,
          subject: formData.subject,
        });
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving flashcard:', err);
      alert('Failed to save flashcard: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm('Delete this flashcard?')) {
      await deleteFlashcard(uid, cardId);
    }
  };

  const handleOpenResourceGen = () => {
    setShowResourceModal(true);
    if (vaultResources.length > 0) {
      setSelectedResourceId(vaultResources[0].id);
    }
  };

  const handleGenerateFromResource = async () => {
    if (!selectedResourceId || !uid) return;
    const targetResource = vaultResources.find((r) => r.id === selectedResourceId);
    if (!targetResource) return;

    setGeneratingResource(true);
    try {
      const generated = generateFlashcardsFromResourceItem(targetResource);
      for (const card of generated) {
        await createFlashcard(uid, card);
      }
      setShowResourceModal(false);
      setAiNotice(`Generated ${generated.length} flashcards from "${targetResource.title}".`);
      setTimeout(() => setAiNotice(''), 6000);
    } catch (err) {
      console.error('Error generating flashcards:', err);
      alert('Failed to generate flashcards from resource.');
    } finally {
      setGeneratingResource(false);
    }
  };

  return (
    <PageWrapper title="Flashcards" subtitle="Master concepts with interactive spaced-repetition flashcards">
      <div className={styles.container}>
        {/* Header Action Bar */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 className={styles.pageTitle}>Flashcard Workspace</h2>
            <p className={styles.pageSubtitle}>
              {cards.length} cards total &bull; Organised by subjects & mastery ratings
            </p>
          </div>
          <div className={styles.actionGroup}>
            <button className={styles.secondaryBtn} onClick={handleOpenResourceGen}>
              <Sparkles size={20} /> AI Flashcard Gen
            </button>
            <button className={styles.primaryBtn} onClick={() => handleOpenModal()}>
              <Plus size={20} /> Create Flashcard
            </button>
          </div>
        </div>

        {/* Global AI Notice Banner */}
        {aiNotice && (
          <div className={styles.aiBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 500 }}>
                {aiNotice}
              </span>
            </div>
            <button className={styles.toggleBtn} onClick={() => setAiNotice('')}>Dismiss</button>
          </div>
        )}

        {/* Resource Information Card & Study Stats */}
        {activeStudyResource && (
          <div className={styles.resourceInfoCard}>
            <div className={styles.resourceMeta}>
              <div className={styles.resourceIconBadge}>
                <BookOpen size={20} />
              </div>
              <div>
                <h4 className={styles.resourceTitleText}>{activeStudyResource.title}</h4>
                <p className={styles.resourceSubtitleText}>
                  {activeStudyResource.subject} &bull; {activeStudyResource.type}
                </p>
              </div>
            </div>
            {activeStudyResource.url && activeStudyResource.url !== '#' && (
              <a
                href={activeStudyResource.url}
                target="_blank"
                rel="noreferrer"
                className={styles.secondaryBtn}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Open Resource <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}

        {/* Study Statistics Grid (Dashboard Style) */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statVal}>{stats.reviewed}</span>
            <span className={styles.statLbl}>Cards Reviewed</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal} style={{ color: 'var(--color-primary)' }}>{stats.remaining}</span>
            <span className={styles.statLbl}>Cards Remaining</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal} style={{ color: '#10B981' }}>{stats.known}</span>
            <span className={styles.statLbl}>Known Cards</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statVal} style={{ color: '#EF4444' }}>{stats.revision}</span>
            <span className={styles.statLbl}>Needs Revision</span>
          </div>
        </div>

        {/* Control Bar: Filters, Search, View Mode, Difficulty Filter */}
        <div className={styles.controlBar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search flashcards by question or answer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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

            {/* Segmented Difficulty Filter */}
            <div className={styles.diffChipsRow}>
              {['All', 'easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`${styles.chipBtn} ${selectedDifficultyFilter === level ? styles.activeChip : ''}`}
                  onClick={() => setSelectedDifficultyFilter(level)}
                >
                  {level === 'All' ? 'All Rating' : level}
                </button>
              ))}
            </div>

            <div className={styles.modeToggle}>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'study' ? styles.activeMode : ''}`}
                onClick={() => setViewMode('study')}
              >
                <BookOpen size={14} /> Study Stage
              </button>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'manage' ? styles.activeMode : ''}`}
                onClick={() => setViewMode('manage')}
              >
                <Grid size={14} /> All Cards ({filteredCards.length})
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Empty States */}
        {loading ? (
          <div className={styles.emptyStateCard}>
            <Layers size={40} />
            <p className={styles.emptyStateSubtitle}>Loading flashcards...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className={styles.emptyStateCard}>
            <FolderArchive size={64} color="var(--color-primary)" />
            <h3 className={styles.emptyStateTitle}>No flashcards available</h3>
            <p className={styles.emptyStateSubtitle}>
              Create your first flashcard manually or generate flashcards from your Resource Vault.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button className={styles.primaryBtn} onClick={() => handleOpenModal()}>
                <Plus size={20} /> Create Flashcard
              </button>
              <button className={styles.secondaryBtn} onClick={handleOpenResourceGen}>
                <Sparkles size={20} /> AI Flashcard Gen
              </button>
            </div>
          </div>
        ) : viewMode === 'study' ? (
          /* ================= 3D INTERACTIVE CARD STUDY STAGE ================= */
          <div className={styles.stageContainer}>
            {/* Progress Tracker Card */}
            <div className={styles.progressCard}>
              <div className={styles.progressMetaRow}>
                <span>Card {currentIndex + 1} of {filteredCards.length}</span>
                <span>
                  {Math.round(((currentIndex + 1) / filteredCards.length) * 100)}% Complete &bull; {filteredCards.length - (currentIndex + 1)} Remaining
                </span>
              </div>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{
                    width: `${((currentIndex + 1) / filteredCards.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Central 3D Card Display */}
            <div
              className={styles.cardPerspective}
              onClick={() => setIsFlipped((f) => !f)}
              title="Click to flip flashcard"
            >
              <div className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}>
                {/* Front Side */}
                <div className={styles.cardFront}>
                  <div className={styles.cardStageHeader}>
                    <span className={styles.subjectBadge}>{currentCard?.subject}</span>
                    <span className={styles.flipHint}>
                      <RotateCw size={13} /> Click to flip
                    </span>
                  </div>
                  <div className={styles.cardTextContent}>
                    {currentCard?.front}
                  </div>
                  <div className={styles.cardStageFooter}>
                    <span className={`${styles.difficultyPill} ${styles[currentCard?.difficulty || 'unreviewed']}`}>
                      Rating: {currentCard?.difficulty || 'Unreviewed'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      Card {currentIndex + 1} of {filteredCards.length}
                    </span>
                  </div>
                </div>

                {/* Back Side */}
                <div className={styles.cardBack}>
                  <div className={styles.cardStageHeader}>
                    <span className={styles.subjectBadge}>{currentCard?.subject}</span>
                    <span className={styles.flipHint}>
                      <RotateCw size={13} /> Click to flip
                    </span>
                  </div>
                  <div className={styles.cardTextContent}>
                    {currentCard?.back}
                  </div>
                  <div className={styles.cardStageFooter}>
                    <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                      Card {currentIndex + 1} of {filteredCards.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flashcard Controls Bar */}
            <div className={styles.controlsRow}>
              <div className={styles.controlGroup}>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={handlePrev}
                  title="Previous Card"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={handleShuffle}
                  title="Shuffle Deck"
                >
                  <Shuffle size={15} /> Shuffle
                </button>
              </div>

              <div className={styles.controlGroup}>
                <button
                  type="button"
                  className={`${styles.ctrlBtn} ${styles.knownBtn}`}
                  onClick={() => handleMarkDifficulty('easy')}
                >
                  <Check size={15} /> Mark Known
                </button>
                <button
                  type="button"
                  className={`${styles.ctrlBtn} ${styles.revisionBtn}`}
                  onClick={() => handleMarkDifficulty('hard')}
                >
                  <AlertCircle size={15} /> Needs Revision
                </button>
              </div>

              <div className={styles.controlGroup}>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={handleToggleFavourite}
                  title="Favourite Card"
                  style={{ color: currentCard?.isFavourite ? '#F59E0B' : 'inherit' }}
                >
                  <Star size={15} fill={currentCard?.isFavourite ? '#F59E0B' : 'none'} />
                </button>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={() => setIsFlipped((f) => !f)}
                >
                  <RotateCw size={15} /> Flip Card
                </button>
                <button
                  type="button"
                  className={styles.ctrlBtn}
                  onClick={handleNext}
                  title="Next Card"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= ALL CARDS GRID VIEW ================= */
          <div className={styles.cardsGrid}>
            {filteredCards.map((card) => (
              <div key={card.id} className={styles.miniCard}>
                <div className={styles.cardStageHeader}>
                  <span className={styles.subjectBadge}>{card.subject}</span>
                  <div className={styles.cardActionBtns}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => handleOpenModal(card)}
                      title="Edit Card"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.danger}`}
                      onClick={() => handleDeleteCard(card.id)}
                      title="Delete Card"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className={styles.miniFront}>Q: {card.front}</p>
                  <p className={styles.miniBack}>A: {card.back}</p>
                </div>

                <div className={styles.miniMeta}>
                  <span className={`${styles.difficultyPill} ${styles[card.difficulty || 'unreviewed']}`}>
                    {card.difficulty || 'Unreviewed'}
                  </span>
                  {card.isFavourite && <Star size={14} color="#F59E0B" fill="#F59E0B" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resource Selection Modal */}
        {showResourceModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowResourceModal(false)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>AI Flashcard Generator</h3>
                <button className={styles.iconBtn} onClick={() => setShowResourceModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {vaultResources.length === 0 ? (
                <div style={{ padding: '24px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <FolderArchive size={44} color="var(--color-primary)" />
                  <h3 className={styles.emptyStateTitle}>No flashcards available.</h3>
                  <p className={styles.emptyStateSubtitle}>
                    Generate flashcards from a resource in your Resource Vault.
                  </p>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => {
                      setShowResourceModal(false);
                      navigate('/study-vault');
                    }}
                    style={{ marginTop: '8px' }}
                  >
                    Go to Resource Vault
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                    Select an academic resource from your Resource Vault to generate flashcards:
                  </p>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Choose Resource</label>
                    <select
                      className={styles.selectInput}
                      style={{ width: '100%' }}
                      value={selectedResourceId}
                      onChange={(e) => setSelectedResourceId(e.target.value)}
                    >
                      {vaultResources.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.title} ({res.type} - {res.subject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setShowResourceModal(false)}
                      disabled={generatingResource}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={handleGenerateFromResource}
                      disabled={generatingResource}
                    >
                      {generatingResource ? 'Generating...' : 'Generate Flashcards'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Create / Edit Modal */}
        {showModal && (
          <div className={styles.modalBackdrop} onClick={handleCloseModal}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingCard ? 'Edit Flashcard' : 'Create New Flashcard'}
                </h3>
                <button className={styles.iconBtn} onClick={handleCloseModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <select
                    className={styles.selectInput}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Front (Question / Prompt)</label>
                  <textarea
                    rows={3}
                    className={styles.formInput}
                    placeholder="e.g. What is the time complexity of QuickSort average case?"
                    value={formData.front}
                    onChange={(e) => setFormData({ ...formData, front: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Back (Answer / Explanation)</label>
                  <textarea
                    rows={3}
                    className={styles.formInput}
                    placeholder="e.g. O(n log n)"
                    value={formData.back}
                    onChange={(e) => setFormData({ ...formData, back: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className={styles.secondaryBtn} onClick={handleCloseModal} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                    {submitting ? 'Saving...' : editingCard ? 'Update Flashcard' : 'Create Flashcard'}
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
