import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Moon, Bell, Zap, User,
  Volume2, Mail, Smartphone, Shield, LogOut, Trash2, Save,
  ChevronRight, Monitor, Sliders,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import { useAuth } from '../contexts/AuthContext';
import styles from './Settings.module.css';

function Toggle({ checked, onChange, id }) {
  return (
    <label className={styles.toggle} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.toggleTrack}>
        <span className={styles.toggleThumb} />
      </span>
    </label>
  );
}

function Section({ id, title, icon, children, onSave, saved }) {
  return (
    <Card
      className={styles.section}
      id={id}
      style={{ scrollMarginTop: 'calc(var(--topbar-height) + 16px)' }}
    >
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </div>
      <div className={styles.sectionBody}>{children}</div>
      {onSave && (
        <div className={styles.sectionFooter}>
          {saved && <span className={styles.savedLabel}>✓ Saved!</span>}
          <button className={styles.saveBtn} onClick={onSave}>
            <Save size={14} /> Save Changes
          </button>
        </div>
      )}
    </Card>
  );
}

const NAV_ITEMS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'adaptive', label: 'Adaptive Mode', icon: Zap },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Monitor },
  { id: 'pomodoro', label: 'Pomodoro', icon: Sliders },
  { id: 'account', label: 'Account', icon: User },
];

export default function Settings() {
  const { user, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const settings = user?.settings || {};
  const [activeNav, setActiveNav] = useState('general');

  const [darkMode, setDarkMode] = useState(!!settings.darkMode);
  const [sound, setSound] = useState(settings.sound !== false);
  const [savedGen, setSavedGen] = useState(false);

  const [adaptMode, setAdaptMode] = useState(user?.studyPreference || 'balanced');
  const [savedAdapt, setSavedAdapt] = useState(false);

  const [emailNotif, setEmailNotif] = useState(settings.emailNotifications !== false);
  const [pushNotif, setPushNotif] = useState(!!settings.pushNotifications);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || '09:00');
  const [savedNotif, setSavedNotif] = useState(false);

  const [workMin, setWorkMin] = useState(settings.pomodoro?.work || 25);
  const [breakMin, setBreakMin] = useState(settings.pomodoro?.shortBreak || 5);
  const [longBreak, setLongBreak] = useState(settings.pomodoro?.longBreak || 15);
  const [savedPomo, setSavedPomo] = useState(false);

  const [savedAppear, setSavedAppear] = useState(false);

  useEffect(() => {
    if (!user?.settings) return;
    const s = user.settings;
    setDarkMode(!!s.darkMode);
    setSound(s.sound !== false);
    setEmailNotif(s.emailNotifications !== false);
    setPushNotif(!!s.pushNotifications);
    setReminderTime(s.reminderTime || '09:00');
    setWorkMin(s.pomodoro?.work || 25);
    setBreakMin(s.pomodoro?.shortBreak || 5);
    setLongBreak(s.pomodoro?.longBreak || 15);
    setAdaptMode(user.studyPreference || 'balanced');
  }, [user]);

  const flash = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const scrollToSection = (id) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const saveGeneral = async () => {
    await refreshProfile({
      settings: { ...settings, sound },
    });
    flash(setSavedGen);
  };

  const saveAppear = async () => {
    await refreshProfile({
      theme: darkMode ? 'dark' : 'light',
      settings: { ...settings, darkMode },
    });
    flash(setSavedAppear);
  };

  const saveAdapt = async () => {
    await refreshProfile({
      studyPreference: adaptMode,
      settings: { ...settings, studyPreference: adaptMode },
    });
    flash(setSavedAdapt);
  };

  const saveNotif = async () => {
    await refreshProfile({
      settings: {
        ...settings,
        emailNotifications: emailNotif,
        pushNotifications: pushNotif,
        reminderTime,
      },
    });
    flash(setSavedNotif);
  };

  const savePomo = async () => {
    await refreshProfile({
      settings: {
        ...settings,
        pomodoro: { work: workMin, shortBreak: breakMin, longBreak },
      },
    });
    flash(setSavedPomo);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/welcome', { replace: true });
  };

  const handleClearData = async () => {
    if (!window.confirm('Clear study stats on your profile? This cannot be undone.')) return;
    await refreshProfile({
      studyStats: {
        streak: 0,
        lastStudyDate: null,
        totalFocusMinutes: 0,
        focusSessionsToday: 0,
        focusSessionsDate: null,
        weeklyProgress: 0,
      },
    });
  };

  return (
    <PageWrapper title="Settings" subtitle="Customise your learning environment">
      <div className={styles.layout}>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={styles.navItem}
                style={
                  activeNav === item.id
                    ? { color: 'var(--color-primary)', background: 'var(--color-primary-light)' }
                    : undefined
                }
                onClick={() => scrollToSection(item.id)}
              >
                <Icon size={15} /> {item.label}
                <ChevronRight size={14} className={styles.navArrow} />
              </button>
            );
          })}
        </nav>

        <div className={styles.sections}>
          <Section
            id="general"
            title="General"
            icon={<SettingsIcon size={17} />}
            onSave={saveGeneral}
            saved={savedGen}
          >
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}><Volume2 size={15} /> Sound Effects</span>
                <span className={styles.settingDesc}>Play sounds on timer end & task completion</span>
              </div>
              <Toggle id="sound" checked={sound} onChange={setSound} />
            </div>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Account Email</span>
                <span className={styles.settingDesc}>{user?.email || '—'}</span>
              </div>
            </div>
          </Section>

          <Section
            id="adaptive"
            title="Adaptive Mode"
            icon={<Zap size={17} />}
            onSave={saveAdapt}
            saved={savedAdapt}
          >
            <p className={styles.sectionDesc}>
              Choose how Synapse adapts content and scheduling to your learning style.
            </p>
            <div className={styles.radioCards}>
              {[
                { value: 'aggressive', label: 'Aggressive', desc: 'Push harder, more sessions per day' },
                { value: 'balanced', label: 'Balanced', desc: 'Smart mix of intensity and rest' },
                { value: 'gentle', label: 'Gentle', desc: 'Lighter pace, prioritise wellbeing' },
                { value: 'manual', label: 'Manual', desc: 'Full control, no AI adjustments' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`${styles.radioCard} ${adaptMode === opt.value ? styles.radioCardActive : ''}`}
                >
                  <input
                    type="radio"
                    name="adaptMode"
                    value={opt.value}
                    checked={adaptMode === opt.value}
                    onChange={() => setAdaptMode(opt.value)}
                    className={styles.radioInput}
                  />
                  <div className={styles.radioCardContent}>
                    <span className={styles.radioLabel}>{opt.label}</span>
                    <span className={styles.radioDesc}>{opt.desc}</span>
                  </div>
                  <div className={`${styles.radioDot} ${adaptMode === opt.value ? styles.radioDotActive : ''}`} />
                </label>
              ))}
            </div>
          </Section>

          <Section
            id="notifications"
            title="Notifications"
            icon={<Bell size={17} />}
            onSave={saveNotif}
            saved={savedNotif}
          >
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}><Mail size={15} /> Email Notifications</span>
                <span className={styles.settingDesc}>Receive weekly progress reports via email</span>
              </div>
              <Toggle id="email" checked={emailNotif} onChange={setEmailNotif} />
            </div>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}><Smartphone size={15} /> Push Notifications</span>
                <span className={styles.settingDesc}>Get reminders for tasks and study sessions</span>
              </div>
              <Toggle id="push" checked={pushNotif} onChange={setPushNotif} />
            </div>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Reminder Time</span>
                <span className={styles.settingDesc}>Daily study reminder</span>
              </div>
              <input
                type="time"
                className={styles.settingInput}
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
          </Section>

          <Section
            id="appearance"
            title="Appearance"
            icon={<Monitor size={17} />}
            onSave={saveAppear}
            saved={savedAppear}
          >
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}><Moon size={15} /> Dark Mode</span>
                <span className={styles.settingDesc}>Toggle dark/light theme preference</span>
              </div>
              <Toggle id="darkMode" checked={darkMode} onChange={setDarkMode} />
            </div>
          </Section>

          <Section
            id="pomodoro"
            title="Pomodoro Timer"
            icon={<Sliders size={17} />}
            onSave={savePomo}
            saved={savedPomo}
          >
            <div className={styles.sliderRow}>
              <div className={styles.sliderInfo}>
                <span className={styles.settingLabel}>Work Duration</span>
                <span className={styles.sliderValue}>{workMin} min</span>
              </div>
              <input
                type="range" min={15} max={60} step={5}
                value={workMin}
                onChange={(e) => setWorkMin(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.sliderTicks}>
                {[15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((v) => (
                  <span key={v} className={styles.tick}>{v}</span>
                ))}
              </div>
            </div>
            <div className={styles.sliderRow}>
              <div className={styles.sliderInfo}>
                <span className={styles.settingLabel}>Short Break</span>
                <span className={styles.sliderValue}>{breakMin} min</span>
              </div>
              <input
                type="range" min={3} max={15} step={1}
                value={breakMin}
                onChange={(e) => setBreakMin(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.sliderRow}>
              <div className={styles.sliderInfo}>
                <span className={styles.settingLabel}>Long Break</span>
                <span className={styles.sliderValue}>{longBreak} min</span>
              </div>
              <input
                type="range" min={10} max={30} step={5}
                value={longBreak}
                onChange={(e) => setLongBreak(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </Section>

          <Section
            id="account"
            title="Account"
            icon={<User size={17} />}
          >
            <div className={styles.dangerZone}>
              <div className={styles.dangerHeader}>
                <Shield size={16} className={styles.dangerIcon} />
                <span className={styles.dangerTitle}>Danger Zone</span>
              </div>
              <p className={styles.dangerDesc}>
                These actions are irreversible. Please proceed with caution.
              </p>
              <div className={styles.dangerActions}>
                <button className={styles.dangerBtnOutline} onClick={handleClearData}>
                  <Trash2 size={15} /> Clear All Data
                </button>
                <button className={styles.dangerBtnFilled} onClick={handleSignOut}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </PageWrapper>
  );
}
