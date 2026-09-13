// =============================================================
// InteractivePreview.jsx – Interactive Workspace Showcase
// =============================================================
import { useState } from 'react';
import {
  Bot,
  Layers,
  Timer,
  FolderArchive,
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Globe,
  Video,
  FileText,
} from 'lucide-react';
import styles from './InteractivePreview.module.css';

export default function InteractivePreview() {
  const [activeTab, setActiveTab] = useState('ai-tutor');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTime, setTimerTime] = useState(25 * 60);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimerTime(25 * 60);
  };

  return (
    <section id="demo" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={14} />
          <span>Interactive Preview</span>
        </div>
        <h2 className={styles.title}>Experience the Workspace in Action</h2>
        <p className={styles.subtitle}>
          Switch between workspace modes below to test Synapse's live interactive tools.
        </p>
      </div>

      <div className={styles.window}>
        {/* Top Control Bar */}
        <div className={styles.windowBar}>
          <div className={styles.dots}>
            <div className={styles.dot} />
            <div className={styles.dot} />
            <div className={styles.dot} />
          </div>

          {/* Interactive Feature Tabs */}
          <div className={styles.tabs}>
            <button
              onClick={() => setActiveTab('ai-tutor')}
              className={`${styles.tabBtn} ${activeTab === 'ai-tutor' ? styles.tabActive : ''}`}
            >
              <Bot size={16} />
              <span>AI Tutor</span>
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`${styles.tabBtn} ${activeTab === 'flashcards' ? styles.tabActive : ''}`}
            >
              <Layers size={16} />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => setActiveTab('focus')}
              className={`${styles.tabBtn} ${activeTab === 'focus' ? styles.tabActive : ''}`}
            >
              <Timer size={16} />
              <span>Focus Mode</span>
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`${styles.tabBtn} ${activeTab === 'vault' ? styles.tabActive : ''}`}
            >
              <FolderArchive size={16} />
              <span>Resource Vault</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`${styles.tabBtn} ${activeTab === 'insights' ? styles.tabActive : ''}`}
            >
              <BarChart3 size={16} />
              <span>AI Insights</span>
            </button>
          </div>

          <div className={styles.statusPill}>
            <div className={styles.pulseDot} />
            <span>Live Workspace</span>
          </div>
        </div>

        {/* Dynamic Interactive Body */}
        <div className={styles.windowBody}>
          {activeTab === 'ai-tutor' && (
            <div className={styles.aiView}>
              <div className={styles.chatBubbleUser}>
                Can you explain the difference between Breadth-First Search and Depth-First Search in simple terms?
              </div>
              <div className={styles.chatBubbleAI}>
                <div className={styles.aiHeader}>
                  <Sparkles size={16} />
                  <span>Synapse AI Tutor</span>
                </div>
                Think of <strong>BFS</strong> like exploring a building floor-by-floor: it checks all neighboring nodes at the current depth before moving deeper.
                <br /><br />
                In contrast, <strong>DFS</strong> goes as deep as possible down one single path until it hits a dead end, then backtracks. BFS uses a <em>Queue (FIFO)</em>, while DFS uses a <em>Stack (LIFO)</em>.
              </div>
              <div className={styles.promptChips}>
                <button className={styles.chipBtn}>Generate 3 Practice Questions</button>
                <button className={styles.chipBtn}>Summarize as Flashcards</button>
                <button className={styles.chipBtn}>Give me a real-world code example</button>
              </div>
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className={styles.flashcardView}>
              <p className={styles.flipHint}>Click card below to flip between Question and Answer</p>
              <div
                className={styles.card3D}
                onClick={() => setCardFlipped(!cardFlipped)}
              >
                <div className={`${styles.cardInner} ${cardFlipped ? styles.flipped : ''}`}>
                  <div className={styles.cardFace}>
                    <span className={styles.cardLabel}>Question • Computer Science 101</span>
                    <h4 className={styles.cardQuestion}>
                      What is the time complexity of searching in a balanced Binary Search Tree (BST)?
                    </h4>
                  </div>
                  <div className={`${styles.cardFace} ${styles.cardBack}`}>
                    <span className={styles.cardLabel}>Answer • Spaced Repetition</span>
                    <p className={styles.cardAnswer}>
                      <strong>O(log N)</strong> — because each comparison eliminates half of the remaining tree nodes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'focus' && (
            <div className={styles.focusView}>
              <div className={styles.timerCircle}>
                <span className={styles.timerTime}>{formatTime(timerTime)}</span>
                <span className={styles.timerLabel}>Deep Focus Session</span>
              </div>
              <div className={styles.timerControls}>
                <button onClick={toggleTimer} className={styles.primaryControlBtn}>
                  {timerRunning ? <Pause size={18} /> : <Play size={18} />}
                  <span>{timerRunning ? 'Pause Session' : 'Start Focus'}</span>
                </button>
                <button onClick={resetTimer} className={styles.secControlBtn}>
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div>
              <table className={styles.vaultTable}>
                <thead>
                  <tr>
                    <th>Academic Resource Title</th>
                    <th>Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.vaultDoc}>
                      <FileText size={18} color="#3B82F6" />
                      <span>Data Structures & Algorithms Course Drive Notes</span>
                    </td>
                    <td><span className={styles.tagBlue}>Lecture Notes</span></td>
                    <td><ExternalLink size={16} color="#4F46E5" /></td>
                  </tr>
                  <tr>
                    <td className={styles.vaultDoc}>
                      <Video size={18} color="#EF4444" />
                      <span>MIT OpenCourseWare – Linear Algebra Lecture 1</span>
                    </td>
                    <td><span className={styles.tagGreen}>Video Lecture</span></td>
                    <td><ExternalLink size={16} color="#4F46E5" /></td>
                  </tr>
                  <tr>
                    <td className={styles.vaultDoc}>
                      <Globe size={18} color="#10B981" />
                      <span>MDN Web Docs – JavaScript Event Loop Guide</span>
                    </td>
                    <td><span className={styles.tagBlue}>Documentation</span></td>
                    <td><ExternalLink size={16} color="#4F46E5" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Exam Readiness Prediction</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>Based on last 14 days activity telemetry</p>
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981' }}>94%</div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Algorithms & Data Structures</span>
                  <span>96% Mastery</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(15, 23, 42, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '96%', height: '100%', background: '#4F46E5', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Calculus & Differential Equations</span>
                  <span>88% Mastery</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(15, 23, 42, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '88%', height: '100%', background: '#3B82F6', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
