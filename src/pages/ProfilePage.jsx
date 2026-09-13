// =============================================================
// ProfilePage.jsx – User profile and academic progress
// =============================================================
import { useState, useEffect, useMemo } from 'react';
import { Edit3, Save, X, GraduationCap, BookOpen, CheckSquare, Flame, Clock } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../contexts/AuthContext';
import { useAdaptive } from '../contexts/AdaptiveContext';
import { useData } from '../contexts/DataContext';
import styles from './ProfilePage.module.css';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color + '18', color }}>
        <Icon size={18} />
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { modeConfig, setupData } = useAdaptive();
  const { analytics, recentActivity, notes, tasks } = useData();
  const [editing, setEditing] = useState(false);

  const profileFromUser = useMemo(
    () => ({
      name: user?.name || '',
      email: user?.email || '',
      university: user?.university || setupData?.university || '',
      major: user?.course || setupData?.major || '',
      year: user?.semester || setupData?.year || '',
      gpa: user?.gpa || '',
      bio: user?.bio || '',
      courses: user?.courses || [],
      photoURL: user?.photoURL || null,
      semesterStart: user?.adaptiveSettings?.semesterStart || setupData?.semesterStart || '',
      semesterEnd: user?.adaptiveSettings?.semesterEnd || setupData?.semesterEnd || '',
    }),
    [user, setupData]
  );

  const [profile, setProfile] = useState(profileFromUser);
  const [draft, setDraft] = useState(profileFromUser);

  useEffect(() => {
    setProfile(profileFromUser);
    if (!editing) setDraft(profileFromUser);
  }, [profileFromUser, editing]);

  const save = async () => {
    await refreshProfile({
      displayName: draft.name,
      university: draft.university,
      course: draft.major,
      semester: draft.year,
      bio: draft.bio,
      gpa: draft.gpa,
    });
    setProfile(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const initials = (profile.name || profile.email || '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const semProgress = analytics.stats.weeklyProgress || 0;
  const subjectPerf = analytics.subjectPerf;
  const courses =
    profile.courses?.length > 0
      ? profile.courses
      : [...new Set(tasks.map((t) => t.subject).filter(Boolean))].slice(0, 8);

  const stats = analytics.stats;

  return (
    <PageWrapper title="Profile">
      <div className={styles.page}>
        <Card className={styles.headerCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {profile.photoURL ? <img src={profile.photoURL} alt="" /> : initials}
            </div>
            <div
              className={styles.modePill}
              style={{ background: modeConfig.color + '18', color: modeConfig.color }}
            >
              {modeConfig.icon} {modeConfig.label}
            </div>
          </div>

          <div className={styles.headerInfo}>
            {editing ? (
              <div className={styles.editFields}>
                <div className={styles.editRow}>
                  <Input
                    label="Full Name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                    disabled
                  />
                </div>
                <div className={styles.editRow}>
                  <Input
                    label="University"
                    value={draft.university}
                    onChange={(e) => setDraft((d) => ({ ...d, university: e.target.value }))}
                  />
                  <Input
                    label="Major"
                    value={draft.major}
                    onChange={(e) => setDraft((d) => ({ ...d, major: e.target.value }))}
                  />
                </div>
                <div className={styles.editActions}>
                  <Button variant="primary" size="sm" onClick={save}>
                    <Save size={14} /> Save
                  </Button>
                  <Button variant="secondary" size="sm" onClick={cancel}>
                    <X size={14} /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.nameRow}>
                  <h2 className={styles.name}>{profile.name || 'Student'}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                    <Edit3 size={14} /> Edit
                  </Button>
                </div>
                <div className={styles.metaRow}>
                  {profile.university && (
                    <span className={styles.metaItem}>
                      <GraduationCap size={14} /> {profile.university}
                    </span>
                  )}
                  {profile.major && (
                    <span className={styles.metaItem}>
                      <BookOpen size={14} /> {profile.major}
                    </span>
                  )}
                  {profile.year && (
                    <Badge variant="primary" size="sm">
                      {profile.year}
                    </Badge>
                  )}
                </div>
                {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
                <div className={styles.contactRow}>
                  <span className={styles.email}>{profile.email}</span>
                  {profile.gpa && (
                    <span className={styles.gpa}>
                      GPA: <strong>{profile.gpa}</strong>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        <div className={styles.statsRow}>
          <StatCard icon={BookOpen} label="Notes" value={String(notes.length)} color="#4F46E5" />
          <StatCard
            icon={CheckSquare}
            label="Tasks Done"
            value={String(stats.tasksCompleted)}
            color="#10B981"
          />
          <StatCard
            icon={Flame}
            label="Streak"
            value={`${stats.streak}d`}
            color="#F59E0B"
          />
          <StatCard
            icon={Clock}
            label="Study Hrs"
            value={`${stats.totalStudyHours}h`}
            color="#60A5FA"
          />
        </div>

        <div className={styles.twoCol}>
          <Card className={styles.colCard}>
            <h3 className={styles.colTitle}>Current Courses</h3>
            <div className={styles.courseChips}>
              {courses.length === 0 ? (
                <span className={styles.metaItem}>No courses yet — add tasks with subjects</span>
              ) : (
                courses.map((c) => (
                  <Badge key={c} variant="primary" size="md">
                    {c}
                  </Badge>
                ))
              )}
            </div>

            <div className={styles.semSection}>
              <div className={styles.semHeader}>
                <span className={styles.colTitle}>Semester Progress</span>
                <span className={styles.semPct}>{semProgress}%</span>
              </div>
              <div className={styles.semBar}>
                <div className={styles.semFill} style={{ width: `${semProgress}%` }} />
              </div>
              <div className={styles.semDates}>
                <span>
                  Started:{' '}
                  {profile.semesterStart || '—'}
                </span>
                <span>
                  Ends:{' '}
                  {profile.semesterEnd || '—'}
                </span>
              </div>
            </div>
          </Card>

          <Card className={styles.colCard}>
            <h3 className={styles.colTitle}>Subject Performance</h3>
            <div className={styles.perfList}>
              {subjectPerf.length === 0 ? (
                <span className={styles.metaItem}>Complete tasks to see performance</span>
              ) : (
                subjectPerf.map((row) => (
                  <div key={row.subject} className={styles.perfItem}>
                    <div className={styles.perfSubject}>{row.subject}</div>
                    <div className={styles.perfBarWrapper}>
                      <div
                        className={styles.perfBar}
                        style={{ width: `${row.score}%`, background: row.color }}
                      />
                    </div>
                    <div className={styles.perfScore} style={{ color: row.color }}>
                      {row.score}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card>
          <h3 className={styles.colTitle} style={{ marginBottom: 'var(--space-4)' }}>
            Recent Activity
          </h3>
          <div className={styles.activity}>
            {recentActivity.length === 0 ? (
              <div className={styles.activityItem}>
                <span className={styles.activityIcon}>✨</span>
                <span className={styles.activityText}>No activity yet — start studying!</span>
                <span className={styles.activityTime}>Now</span>
              </div>
            ) : (
              recentActivity.map((a, i) => (
                <div key={i} className={styles.activityItem}>
                  <span className={styles.activityIcon}>{a.icon}</span>
                  <span className={styles.activityText}>{a.text}</span>
                  <span className={styles.activityTime}>{a.time}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

export default ProfilePage;
