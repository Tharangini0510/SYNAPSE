// =============================================================
// HelpSupport.jsx – Synapse Professional Help & Support Center
// =============================================================
import React, { useState, useEffect } from 'react';
import {
  HelpCircle, BookOpen, Command, MessageSquare, Bug,
  Sparkles, Info, Shield, FileText, ChevronDown, ChevronUp,
  X, Check, Send, LifeBuoy, Code
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../contexts/AuthContext';
import { submitSupportTicket, subscribeToUserTickets } from '../services/supportService';
import styles from './HelpSupport.module.css';

const FAQS_LIST = [
  {
    q: 'What is Synapse Adaptive Learning Workspace?',
    a: 'Synapse is an intelligent academic workspace featuring adaptive study modes (Normal Semester, Exam Week, Deadline Tomorrow, Focus Mode), study vault storage, interactive flashcards, self-assessment quiz center, task boards, and growth tracking analytics.',
  },
  {
    q: 'How does the Study Vault work?',
    a: 'The Study Vault stores academic files (PDFs, DOCX, PPTX, Images) securely in Firebase Storage and saves external links (GitHub, YouTube, Google Drive) under your personal user document in Firestore.',
  },
  {
    q: 'How are Quiz Center scores calculated?',
    a: 'When you take a multiple-choice quiz, Synapse automatically evaluates your choices against the correct answer key, computes your percentage score, records time spent, and logs the attempt to your history.',
  },
  {
    q: 'How do Adaptive Modes work?',
    a: 'Adaptive Modes change Synapse UI themes, urgency colors, and banner priorities depending on whether you are in normal semester flow, preparing for exam week, clearing immediate deadlines, or engaging in deep focus mode.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Yes! Every authenticated user only has access to their own Study Vault, Flashcards, Quizzes, Tasks, Notes, and submitted Support Tickets through user-scoped Firestore rules and authentication guards.',
  },
];

const KEYBOARD_SHORTCUTS = [
  { label: 'Toggle Focus Mode', key: 'Alt + F' },
  { label: 'Create New Note', key: 'Ctrl + N' },
  { label: 'Create New Task', key: 'Ctrl + T' },
  { label: 'Search Workspace', key: 'Ctrl + K' },
  { label: 'Flip Flashcard', key: 'Spacebar' },
  { label: 'Next Flashcard', key: 'Right Arrow' },
  { label: 'Previous Flashcard', key: 'Left Arrow' },
];

export default function HelpSupport() {
  const { firebaseUser, user } = useAuth();
  const uid = firebaseUser?.uid;

  const [activeTab, setActiveTab] = useState('faq'); // 'faq' | 'guide' | 'shortcuts' | 'tickets' | 'about'
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Tickets state
  const [userTickets, setUserTickets] = useState([]);
  const [showFormModal, setShowFormModal] = useState(null); // null | 'contact' | 'bug_report' | 'feature_request'
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToUserTickets(
      uid,
      (list) => setUserTickets(list),
      (err) => console.error('Error fetching user tickets:', err)
    );
    return () => unsub && unsub();
  }, [uid]);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!uid || !formData.subject || !formData.message) return;

    setSubmitting(true);
    try {
      await submitSupportTicket(uid, user || {}, {
        type: showFormModal,
        subject: formData.subject,
        message: formData.message,
      });
      setShowFormModal(null);
      setFormData({ subject: '', message: '' });
      setSuccessNotice('Your submission has been saved successfully! Our team will review it.');
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      alert('Error submitting request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Help & Support" subtitle="Guides, FAQs, keyboard shortcuts & support ticketing center">
      <div className={styles.container}>
        {/* Header Title */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h2 className={styles.pageTitle}>Support & Documentation Center</h2>
            <p className={styles.pageSubtitle}>
              Find answers, learn keyboard shortcuts, or submit support tickets directly to the developer team
            </p>
          </div>
          <div className={styles.actionGroup}>
            <button className={styles.secondaryBtn} onClick={() => setShowFormModal('bug_report')}>
              <Bug size={20} /> Report a Bug
            </button>
            <button className={styles.primaryBtn} onClick={() => setShowFormModal('contact')}>
              <MessageSquare size={20} /> Contact Support
            </button>
          </div>
        </div>

        {/* Global Success Banner */}
        {successNotice && (
          <div className={styles.infoCard} style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10B981' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} /> {successNotice}
            </span>
          </div>
        )}

        {/* Sub-tabs Row */}
        <div className={styles.tabsRow}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'faq' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <HelpCircle size={14} /> FAQs
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'guide' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <BookOpen size={14} /> Getting Started Guide
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'shortcuts' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            <Command size={14} /> Keyboard Shortcuts
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'tickets' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <LifeBuoy size={14} /> My Support Requests ({userTickets.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'about' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Info size={14} /> About & Legal
          </button>
        </div>

        {/* 1. FAQs Accordion */}
        {activeTab === 'faq' && (
          <div className={styles.faqList}>
            {FAQS_LIST.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className={styles.faqItem}>
                  <div
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                  {isOpen && <div className={styles.faqAnswer}>{faq.a}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* 2. User Guide */}
        {activeTab === 'guide' && (
          <div className={styles.infoCard}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Getting Started with Synapse</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '14px', lineHeight: 1.6 }}>
              <div>
                <strong>1. Setup your Academic Mode & Enrolled Subjects</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-muted)' }}>
                  Tailor your semester workflow in Settings or setup wizard. Select your mode (Normal Semester, Exam Week, Deadline Tomorrow, Focus Mode).
                </p>
              </div>
              <div>
                <strong>2. Organize Materials in Study Vault</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-muted)' }}>
                  Upload PDFs, DOCX, PPTX notes, or save web links to build your personal repository.
                </p>
              </div>
              <div>
                <strong>3. Master Concepts with Flashcards & Quiz Center</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-muted)' }}>
                  Practice spaced repetition in Flashcards and self-assess using timed Multiple Choice Quizzes.
                </p>
              </div>
              <div>
                <strong>4. Track Growth & Earn Badges</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--color-muted)' }}>
                  Monitor your semester index in Progress Tracker and automatically unlock student achievement badges.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Keyboard Shortcuts */}
        {activeTab === 'shortcuts' && (
          <div>
            <h3 style={{ margin: '0 0 1rem', fontSize: '18px', fontWeight: 800 }}>Keyboard Shortcuts Cheat Sheet</h3>
            <div className={styles.shortcutsGrid}>
              {KEYBOARD_SHORTCUTS.map((s, idx) => (
                <div key={idx} className={styles.shortcutCard}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{s.label}</span>
                  <span className={styles.kbd}>{s.key}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Support Tickets */}
        {activeTab === 'tickets' && (
          <div className={styles.infoCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>My Support Submissions</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={styles.secondaryBtn} onClick={() => setShowFormModal('feature_request')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Sparkles size={14} /> Request Feature
                </button>
                <button className={styles.primaryBtn} onClick={() => setShowFormModal('contact')} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <MessageSquare size={14} /> New Support Ticket
                </button>
              </div>
            </div>

            {userTickets.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
                You have not submitted any support tickets yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {userTickets.map((ticket) => (
                  <div key={ticket.id} className={styles.ticketItem}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                        {ticket.type?.replace('_', ' ')}
                      </span>
                      <h4 style={{ margin: '2px 0', fontSize: '14px', fontWeight: 700 }}>{ticket.subject}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)' }}>{ticket.message}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '12px' }}>
                      {ticket.status || 'open'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. About & Legal */}
        {activeTab === 'about' && (
          <div className={styles.infoCard}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  Synapse – Adaptive Learning Workspace
                </h3>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Version 1.0.0 Stable (Production Release)
                </span>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>Developer Credits</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)' }}>
                  Designed & Developed by the Google DeepMind Advanced Agentic Coding Team.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>Privacy Policy Overview</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  Synapse strictly enforces isolated per-user data access. Your study vault materials, flashcards, notes, tasks, and analytics are accessible solely by your authenticated user account.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>Terms of Service</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                  Synapse is provided for educational and academic productivity purposes. Users retain full ownership over all uploaded resources and personal study notes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Submission Modal */}
        {showFormModal && (
          <div className={styles.modalBackdrop} onClick={() => setShowFormModal(null)}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {showFormModal === 'contact' && 'Contact Support'}
                  {showFormModal === 'bug_report' && 'Report a Bug'}
                  {showFormModal === 'feature_request' && 'Request a Feature'}
                </h3>
                <button className={styles.closeBtn} onClick={() => setShowFormModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Brief summary..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Details / Message</label>
                  <textarea
                    rows={5}
                    className={styles.formTextarea}
                    placeholder="Describe your request, issue, or feature idea..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setShowFormModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
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
