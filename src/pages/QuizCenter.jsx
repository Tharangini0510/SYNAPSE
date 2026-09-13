// =============================================================
// QuizCenter.jsx – Modern Interactive Quiz Assessment Center
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, Plus, Search, Play, Award, CheckCircle2, XCircle,
  Clock, RotateCcw, Edit3, Trash2, Sparkles, X, ChevronRight,
  ListOrdered, BarChart, BookOpen, FolderArchive, ArrowRight, Layers
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS } from '../utils/constants';
import {
  subscribeToQuizzes,
  subscribeToQuizAttempts,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  saveQuizAttempt,
} from '../services/quizService';
import { subscribeToStudyVault } from '../services/studyVaultService';
import { generateQuizFromResourceItem } from '../services/resourceIntegrationService';
import styles from './QuizCenter.module.css';

export default function QuizCenter() {
  const navigate = useNavigate();
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid || user?.uid;

  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [vaultResources, setVaultResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' | 'history'

  // Quiz Runner Active Session State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizTimer, setQuizTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState(null);

  // Modal State for Quiz Creation / Editing
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    subject: SUBJECTS[0] || 'Computer Science',
    questions: [
      {
        id: 'q_1',
        questionText: '',
        options: ['', '', '', ''],
        correctIndex: 0,
      },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [aiNotice, setAiNotice] = useState('');

  // Resource Selection Modal State
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [generatingResource, setGeneratingResource] = useState(false);

  // Subscribe to Quizzes, Quiz Attempts, & Vault Resources
  useEffect(() => {
    if (!uid) {
      setQuizzes([]);
      setAttempts([]);
      setVaultResources([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let qReady = false;
    let aReady = false;
    const checkDone = () => { if (qReady && aReady) setLoading(false); };

    const unsubQ = subscribeToQuizzes(
      uid,
      (list) => { setQuizzes(list); qReady = true; checkDone(); },
      (err) => { console.error('Error fetching quizzes:', err); qReady = true; checkDone(); }
    );

    const unsubA = subscribeToQuizAttempts(
      uid,
      (list) => { setAttempts(list); aReady = true; checkDone(); },
      (err) => { console.error('Error fetching quiz attempts:', err); aReady = true; checkDone(); }
    );

    const unsubV = subscribeToStudyVault(
      uid,
      (list) => setVaultResources(list),
      (err) => console.error('Error fetching vault resources:', err)
    );

    return () => {
      unsubQ && unsubQ();
      unsubA && unsubA();
      unsubV && unsubV();
    };
  }, [uid]);

  // Quiz Timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setQuizTimer((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = selectedSubject === 'All' || q.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [quizzes, search, selectedSubject]);

  // Start Quiz runner session
  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setQuizTimer(0);
    setTimerActive(true);
    setCompletedAttempt(null);
  };

  // Submit Quiz session
  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !uid) return;
    setTimerActive(false);

    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const totalQuestions = activeQuiz.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    const attemptData = {
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      subject: activeQuiz.subject,
      score,
      correctCount,
      totalQuestions,
      timeSpentSeconds: quizTimer,
    };

    try {
      await saveQuizAttempt(uid, attemptData);
    } catch (err) {
      console.error('Error saving quiz attempt:', err);
    }

    setCompletedAttempt(attemptData);
  };

  // Modal Open/Close handlers
  const handleOpenModal = (quiz = null) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        title: quiz.title,
        description: quiz.description,
        subject: quiz.subject,
        questions: quiz.questions && quiz.questions.length ? quiz.questions : [
          { id: 'q_1', questionText: '', options: ['', '', '', ''], correctIndex: 0 }
        ],
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({
        title: '',
        description: '',
        subject: SUBJECTS[0] || 'Computer Science',
        questions: [
          { id: 'q_1', questionText: '', options: ['', '', '', ''], correctIndex: 0 },
        ],
      });
    }
    setShowModal(true);
  };

  const handleAddQuestion = () => {
    setQuizForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q_${Date.now()}_${prev.questions.length + 1}`,
          questionText: '',
          options: ['', '', '', ''],
          correctIndex: 0,
        },
      ],
    }));
  };

  const handleRemoveQuestion = (index) => {
    if (quizForm.questions.length <= 1) return;
    setQuizForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setQuizForm((prev) => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    setQuizForm((prev) => {
      const updated = [...prev.questions];
      const newOpts = [...updated[qIndex].options];
      newOpts[oIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: newOpts };
      return { ...prev, questions: updated };
    });
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!uid) return;

    if (!quizForm.title) {
      alert('Please enter a Quiz Title.');
      return;
    }

    const invalidQ = quizForm.questions.some(
      (q) => !q.questionText || q.options.some((opt) => !opt)
    );
    if (invalidQ) {
      alert('Please complete all question prompts and answer options.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingQuiz) {
        await updateQuiz(uid, editingQuiz.id, {
          title: quizForm.title,
          description: quizForm.description,
          subject: quizForm.subject,
          questions: quizForm.questions,
        });
      } else {
        await createQuiz(uid, {
          title: quizForm.title,
          description: quizForm.description,
          subject: quizForm.subject,
          questions: quizForm.questions,
        });
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert('Failed to save quiz: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (window.confirm(`Are you sure you want to delete "${quizTitle}"?`)) {
      await deleteQuiz(uid, quizId);
    }
  };

  const handleOpenResourceGen = () => {
    setShowResourceModal(true);
    if (vaultResources.length > 0) {
      setSelectedResourceId(vaultResources[0].id);
    }
  };

  const handleGenerateQuizFromResource = async () => {
    if (!selectedResourceId || !uid) return;
    const targetResource = vaultResources.find((r) => r.id === selectedResourceId);
    if (!targetResource) return;

    setGeneratingResource(true);
    try {
      const generatedQuiz = generateQuizFromResourceItem(targetResource);
      const newQuizId = await createQuiz(uid, generatedQuiz);
      setShowResourceModal(false);
      setAiNotice(`Quiz "${generatedQuiz.title}" created from "${targetResource.title}".`);
      setTimeout(() => setAiNotice(''), 6000);
      handleStartQuiz({ id: newQuizId, ...generatedQuiz });
    } catch (err) {
      console.error('Error generating quiz:', err);
      alert('Failed to generate quiz from resource.');
    } finally {
      setGeneratingResource(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <PageWrapper title="Quiz Center" subtitle="Evaluate your knowledge with interactive multiple-choice quizzes">
      <div className={styles.container}>
        {/* Header Action Bar */}
        {!activeQuiz && (
          <div className={styles.headerRow}>
            <div className={styles.headerText}>
              <h2 className={styles.pageTitle}>Quiz Assessment Center</h2>
              <p className={styles.pageSubtitle}>
                {quizzes.length} available quizzes &bull; {attempts.length} completed attempts
              </p>
            </div>
            <div className={styles.actionGroup}>
              <button className={styles.secondaryBtn} onClick={handleOpenResourceGen}>
                <Sparkles size={20} /> AI Quiz Gen
              </button>
              <button className={styles.primaryBtn} onClick={() => handleOpenModal()}>
                <Plus size={20} /> Create Quiz
              </button>
            </div>
          </div>
        )}

        {/* Global AI Notice Banner */}
        {aiNotice && !activeQuiz && (
          <div className={styles.aiBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 500 }}>
                {aiNotice}
              </span>
            </div>
            <button className={styles.tabBtn} onClick={() => setAiNotice('')}>Dismiss</button>
          </div>
        )}

        {/* ==========================================================
            QUIZ RUNNER ACTIVE SESSION VIEW
           ========================================================== */}
        {activeQuiz ? (
          <div className={styles.quizRunnerContainer}>
            {completedAttempt ? (
              /* ================= COMPLETION RESULT SCREEN ================= */
              <div className={styles.resultsCard}>
                <div className={styles.scoreCircle}>
                  <span className={styles.scoreNum}>{completedAttempt.score}%</span>
                  <span className={styles.scoreTextLabel}>
                    {completedAttempt.score >= 80 ? 'EXCELLENT' : completedAttempt.score >= 60 ? 'PASSED' : 'REVISION'}
                  </span>
                </div>

                <div>
                  <h2 className={styles.resultsTitle}>Quiz Completed!</h2>
                  <p className={styles.resultsSubtitle}>
                    {activeQuiz.title} &bull; {activeQuiz.subject}
                  </p>
                </div>

                {/* 4 Metrics Grid */}
                <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                    <span className={styles.statVal}>{completedAttempt.score}%</span>
                    <span className={styles.statLbl}>Overall Score</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statVal} style={{ color: '#10B981' }}>
                      {completedAttempt.correctCount} / {completedAttempt.totalQuestions}
                    </span>
                    <span className={styles.statLbl}>Correct Answers</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statVal} style={{ color: '#EF4444' }}>
                      {completedAttempt.totalQuestions - completedAttempt.correctCount} / {completedAttempt.totalQuestions}
                    </span>
                    <span className={styles.statLbl}>Incorrect</span>
                  </div>
                  <div className={styles.statBox}>
                    <span className={styles.statVal}>
                      {formatTimer(completedAttempt.timeSpentSeconds)}
                    </span>
                    <span className={styles.statLbl}>Time Taken</span>
                  </div>
                </div>

                {/* Performance Summary & Next Steps */}
                <div className={styles.recommendationCard}>
                  <span className={styles.recommendationTitle}>Performance Summary & Next Steps</span>
                  <p className={styles.recommendationText}>
                    {completedAttempt.score >= 80
                      ? 'Outstanding performance! You have mastered the core concepts of this material. Try creating flashcards to reinforce long-term memory.'
                      : completedAttempt.score >= 60
                      ? 'Good job! You demonstrated solid understanding, but reviewing key missed topics will help achieve mastery.'
                      : 'More practice needed. We recommend reviewing the original resource material and retaking this assessment.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className={styles.resultsActionsRow}>
                  <button className={styles.secondaryBtn} onClick={() => handleStartQuiz(activeQuiz)}>
                    <RotateCcw size={16} /> Retry Quiz
                  </button>
                  <button className={styles.secondaryBtn} onClick={() => navigate('/flashcards')}>
                    <Layers size={16} /> Generate Flashcards
                  </button>
                  <button className={styles.primaryBtn} onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* ================= ACTIVE QUESTION RUNNER STAGE ================= */
              <>
                {/* 1. Header Card */}
                <div className={styles.runnerHeaderCard}>
                  <div className={styles.headerTopRow}>
                    <div className={styles.quizInfoMeta}>
                      <h3 className={styles.runnerQuizTitle}>{activeQuiz.title}</h3>
                      <div className={styles.metaPillsRow}>
                        <span className={styles.subjectChip}>{activeQuiz.subject}</span>
                        <span className={styles.metaPill}>Standard Assessment</span>
                        <span className={styles.metaPill}>{activeQuiz.questions.length} Questions</span>
                      </div>
                    </div>
                    <div className={styles.timerBadge}>
                      <Clock size={16} /> {formatTimer(quizTimer)}
                    </div>
                  </div>

                  {/* Progress Tracker Bar */}
                  <div className={styles.progressTrackerRow}>
                    <div className={styles.progressLabelRow}>
                      <span>Question {currentQIndex + 1} of {activeQuiz.questions.length}</span>
                      <span>
                        {Math.round(((currentQIndex + 1) / activeQuiz.questions.length) * 100)}% Complete
                      </span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Question Card */}
                <div className={styles.questionCard}>
                  <div className={styles.questionHeader}>
                    <span className={styles.questionBadge}>
                      Question {currentQIndex + 1}
                    </span>
                  </div>
                  <h4 className={styles.questionText}>
                    {activeQuiz.questions[currentQIndex]?.questionText}
                  </h4>

                  {/* 3. Answer Option Cards */}
                  <div className={styles.optionsGrid}>
                    {activeQuiz.questions[currentQIndex]?.options.map((optText, oIdx) => {
                      const isSelected = selectedAnswers[currentQIndex] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          className={`${styles.optionCard} ${isSelected ? styles.selectedOption : ''}`}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [currentQIndex]: oIdx,
                            }))
                          }
                        >
                          <span className={styles.optionLetterBadge}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className={styles.optionTextContent}>{optText}</span>
                          {isSelected && <CheckCircle2 size={20} className={styles.selectedCheck} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Navigation Bar */}
                <div className={styles.runnerNavRow}>
                  <button
                    className={styles.secondaryBtn}
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex((i) => i - 1)}
                  >
                    Previous
                  </button>

                  <div className={styles.navActionGroup}>
                    <button
                      className={styles.dangerBtn}
                      onClick={() => {
                        if (window.confirm('Quit quiz session? Progress will not be saved.')) {
                          setActiveQuiz(null);
                        }
                      }}
                    >
                      Quit Quiz
                    </button>

                    {currentQIndex < activeQuiz.questions.length - 1 ? (
                      <button
                        className={styles.primaryBtn}
                        onClick={() => setCurrentQIndex((i) => i + 1)}
                      >
                        Next Question <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button className={styles.primaryBtn} onClick={handleSubmitQuiz}>
                        Finish Quiz
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ==========================================================
              MAIN QUIZ CENTER DASHBOARD
             ========================================================== */
          <>
            {/* Control Bar: Tabs, Search, Filters */}
            <div className={styles.controlBar}>
              <div className={styles.tabNav}>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'quizzes' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('quizzes')}
                >
                  <ListOrdered size={15} /> All Quizzes ({quizzes.length})
                </button>
                <button
                  className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <BarChart size={15} /> Attempt History ({attempts.length})
                </button>
              </div>

              {activeTab === 'quizzes' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div className={styles.searchBox}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search quizzes by title or description..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

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
                </div>
              )}
            </div>

            {/* TAB 1: QUIZZES GRID */}
            {activeTab === 'quizzes' && (
              loading ? (
                <div className={styles.emptyStateCard}>
                  <HelpCircle size={40} />
                  <p className={styles.emptyStateSubtitle}>Loading quizzes...</p>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className={styles.emptyStateCard}>
                  <HelpCircle size={64} color="var(--color-primary)" />
                  <h3 className={styles.emptyStateTitle}>No quizzes available</h3>
                  <p className={styles.emptyStateSubtitle}>
                    Create your first quiz assessment manually or generate a quiz from your Resource Vault.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className={styles.primaryBtn} onClick={() => handleOpenModal()}>
                      <Plus size={20} /> Create Quiz
                    </button>
                    <button className={styles.secondaryBtn} onClick={handleOpenResourceGen}>
                      <Sparkles size={20} /> AI Quiz Gen
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.quizGrid}>
                  {filteredQuizzes.map((quiz) => (
                    <div key={quiz.id} className={styles.quizCard}>
                      <div className={styles.cardHeader}>
                        <span className={styles.subjectChip}>{quiz.subject}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className={styles.iconBtn}
                            onClick={() => handleOpenModal(quiz)}
                            title="Edit Quiz"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.danger}`}
                            onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                            title="Delete Quiz"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.cardBody}>
                        <h4 className={styles.quizTitle}>{quiz.title}</h4>
                        {quiz.description && (
                          <p className={styles.quizDesc}>{quiz.description}</p>
                        )}
                      </div>

                      <div className={styles.cardFooter}>
                        <span className={styles.questionCount}>
                          <HelpCircle size={14} /> {quiz.questions?.length || 0} Questions
                        </span>
                        <button
                          className={styles.primaryBtn}
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                          onClick={() => handleStartQuiz(quiz)}
                        >
                          <Play size={14} /> Start Quiz
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* TAB 2: ATTEMPT HISTORY */}
            {activeTab === 'history' && (
              attempts.length === 0 ? (
                <div className={styles.emptyStateCard}>
                  <Award size={48} color="var(--color-primary)" />
                  <h3 className={styles.emptyStateTitle}>No quiz attempts recorded</h3>
                  <p className={styles.emptyStateSubtitle}>
                    Complete a quiz to track your scores and performance metrics here.
                  </p>
                </div>
              ) : (
                <div className={styles.historyList}>
                  {attempts.map((att) => (
                    <div key={att.id} className={styles.historyItem}>
                      <div>
                        <h4 className={styles.historyTitle}>{att.quizTitle}</h4>
                        <div className={styles.historyMeta}>
                          <span>Subject: {att.subject}</span>
                          <span>&bull;</span>
                          <span>Time: {formatTimer(att.timeSpentSeconds)}</span>
                          <span>&bull;</span>
                          <span>Completed: {att.completedAt}</span>
                        </div>
                      </div>

                      <div>
                        <span className={styles.scorePill}>
                          {att.correctCount} / {att.totalQuestions} ({att.score}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {/* Resource Selection Modal */}
        {showResourceModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowResourceModal(false)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>AI Quiz Generator</h3>
                <button className={styles.iconBtn} onClick={() => setShowResourceModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {vaultResources.length === 0 ? (
                <div style={{ padding: '24px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <FolderArchive size={44} color="var(--color-primary)" />
                  <h3 className={styles.emptyStateTitle}>No quizzes available.</h3>
                  <p className={styles.emptyStateSubtitle}>
                    Add academic resources to Resource Vault to generate quizzes.
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
                    Select an academic resource from your Resource Vault to generate a quiz:
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
                      onClick={handleGenerateQuizFromResource}
                      disabled={generatingResource}
                    >
                      {generatingResource ? 'Generating...' : 'Generate & Start Quiz'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Quiz Creator / Editor */}
        {showModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                </h3>
                <button className={styles.iconBtn} onClick={() => setShowModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quiz Title</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Data Structures Midterm Quiz"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <select
                    className={styles.selectInput}
                    value={quizForm.subject}
                    onChange={(e) => setQuizForm({ ...quizForm, subject: e.target.value })}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description (Optional)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Brief summary or scope..."
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  />
                </div>

                {/* Question Builder List */}
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label className={styles.formLabel}>Quiz Questions ({quizForm.questions.length})</label>
                  {quizForm.questions.map((q, qIdx) => (
                    <div key={q.id || qIdx} className={styles.qBuildCard}>
                      <div className={styles.qBuildHeader}>
                        <span>Question #{qIdx + 1}</span>
                        {quizForm.questions.length > 1 && (
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.danger}`}
                            onClick={() => handleRemoveQuestion(qIdx)}
                          >
                            <X size={14} /> Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Enter question prompt..."
                        value={q.questionText}
                        onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                        required
                        style={{ marginBottom: '10px' }}
                      />

                      <div className={styles.optionsGridBuild}>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={styles.optInputRow}>
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctIndex === oIdx}
                              onChange={() => handleQuestionChange(qIdx, 'correctIndex', oIdx)}
                              title="Mark as correct answer"
                            />
                            <input
                              type="text"
                              className={styles.formInput}
                              placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={handleAddQuestion}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Plus size={15} /> Add Another Question
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                    {submitting ? 'Saving...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
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
