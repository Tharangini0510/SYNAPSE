import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, User, RotateCcw, BookOpen, Brain, Calendar, Clock } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import { useAdaptive } from '../contexts/AdaptiveContext';
import { useData } from '../contexts/DataContext';
import { sendChatMessageToGemini } from '../services/aiService';
import styles from './AIPlanner.module.css';

const QUICK_PROMPTS = [
  { id: 'week',  icon: <Calendar size={16} />, label: 'Plan my study week' },
  { id: 'now',   icon: <Brain size={16} />,    label: 'What should I study now?' },
  { id: 'exam',  icon: <BookOpen size={16} />, label: 'Break down my exam prep' },
  { id: 'sched', icon: <Clock size={16} />,    label: 'Suggest a study schedule' },
];

let msgId = 10;

/**
 * Formats inline Markdown elements (bold, inline code, etc.)
 */
function renderInlineFormatting(text) {
  // Regex to split bold (**...**), inline code (`...`), and italics (*...*)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j} className={styles.bold}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={j} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={j}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/**
 * Formats Markdown text with support for code blocks, headings, lists, and paragraphs.
 */
function renderText(text) {
  if (!text) return null;

  // Split text by fenced code blocks: ```code```
  const codeBlockRegex = /```[\s\S]*?```/g;
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const fullBlock = match[0];
    const codeContent = fullBlock.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
    blocks.push({ type: 'code', content: codeContent });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return blocks.map((block, blockIdx) => {
    if (block.type === 'code') {
      return (
        <pre key={blockIdx} className={styles.codeBlock}>
          <code>{block.content}</code>
        </pre>
      );
    }

    const lines = block.content.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={`${blockIdx}-${lineIdx}`} style={{ height: '0.4rem' }} />;

      if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
        const headingText = line.replace(/^#+\s*/, '');
        return (
          <h4 key={`${blockIdx}-${lineIdx}`} className={styles.heading}>
            {renderInlineFormatting(headingText)}
          </h4>
        );
      }

      return (
        <p key={`${blockIdx}-${lineIdx}`} className={styles.msgLine}>
          {renderInlineFormatting(line)}
        </p>
      );
    });
  });
}

export default function AIPlanner() {
  const { user } = useAuth();
  const { modeConfig } = useAdaptive();
  const { tasks, notes, events } = useData();

  const intro = useMemo(
    () => ({
      id: 1,
      role: 'ai',
      text: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm your Synapse AI Tutor 🎓✨\n\nI can help you understand tough topics, plan your study schedule, break down exam prep, and optimize your workload — using your live Synapse context. Ask me anything or click a quick prompt below!`,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }),
    [user?.name]
  );

  const [messages, setMessages] = useState([intro]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages([intro]);
  }, [intro]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text) => {
    if (!text.trim() || typing) return;

    const userMsg = {
      id: ++msgId,
      role: 'user',
      text: text.trim(),
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setTyping(true);

    try {
      // Call real Google Gemini API via aiService
      const aiResponseText = await sendChatMessageToGemini(newHistory, {
        user,
        modeLabel: modeConfig?.label,
        tasks,
        notes,
        events,
      });

      const aiMsg = {
        id: ++msgId,
        role: 'ai',
        text: aiResponseText,
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error sending message to Gemini:', err);
      const errorMsg = {
        id: ++msgId,
        role: 'ai',
        text: '⚠️ An error occurred while generating a response. Please check your connection and try again.',
        ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([intro]);
    setInput('');
    setTyping(false);
  };

  return (
    <PageWrapper title="AI Planner" subtitle="Your intelligent study companion">
      <div className={styles.layout}>
        {/* ── Chat Panel ── */}
        <div className={styles.chatPanel}>
          <Card className={styles.chatCard}>
            {/* Messages */}
            <div className={styles.messagesList}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.aiRow}`}
                >
                  {/* Avatar */}
                  {msg.role === 'ai' && (
                    <div className={styles.aiAvatar}>
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.aiBubble}`}>
                    {renderText(msg.text)}
                    <span className={styles.ts}>{msg.ts}</span>
                  </div>

                  {msg.role === 'user' && (
                    <div className={styles.userAvatar}>
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className={`${styles.messageRow} ${styles.aiRow}`}>
                  <div className={styles.aiAvatar}>
                    <Sparkles size={16} />
                  </div>
                  <div className={`${styles.bubble} ${styles.aiBubble} ${styles.typingBubble}`}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className={styles.quickPrompts}>
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.id}
                  className={styles.promptChip}
                  onClick={() => sendMessage(q.label)}
                  disabled={typing}
                >
                  {q.icon} {q.label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className={styles.inputRow}>
              <button className={styles.resetBtn} onClick={resetChat} title="Reset chat">
                <RotateCcw size={18} />
              </button>
              <textarea
                className={styles.inputBox}
                placeholder="Ask me anything about your studies…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={typing}
              />
              <button
                className={styles.sendBtn}
                onClick={() => sendMessage(input)}
                disabled={typing || !input.trim()}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </Card>
        </div>

        {/* ── Tips sidebar ── */}
        <div className={styles.sidebar}>
          <Card className={styles.tipsCard}>
            <div className={styles.tipsHeader}>
              <Sparkles size={16} className={styles.sparkle} />
              <h3 className={styles.tipsTitle}>How I Can Help</h3>
            </div>
            <ul className={styles.tipsList}>
              <li>📆 Build personalised weekly schedules</li>
              <li>📌 Prioritise urgent tasks from your board</li>
              <li>📝 Break down big topics into steps</li>
              <li>⏱️ Recommend Pomodoro session lengths</li>
              <li>📊 Analyse study patterns & gaps</li>
              <li>🎯 Suggest focus areas before exams</li>
            </ul>
          </Card>

          <Card className={styles.infoCard}>
            <h3 className={styles.tipsTitle}>Quick Tips</h3>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>💡</span>
                <span>Ask specific questions for better answers</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>🔁</span>
                <span>Use quick chips to get started instantly</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>↵</span>
                <span>Press Enter to send, Shift+Enter for new line</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
