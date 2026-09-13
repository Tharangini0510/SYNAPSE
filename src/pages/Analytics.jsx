// =============================================================
// Analytics.jsx – Study analytics derived from Firestore data
// =============================================================
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Clock, CheckSquare, Flame, BarChart2 } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { useData } from '../contexts/DataContext';
import styles from './Analytics.module.css';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: color + '18', color }}>
        <Icon size={20} />
      </div>
      <div>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className={styles.tooltipRow} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}{p.name === 'hours' ? 'h' : ''}</strong>
        </div>
      ))}
    </div>
  );
}

function Analytics() {
  const { analytics } = useData();
  const [period, setPeriod] = useState('This Week');

  const periodData = useMemo(() => ({
    'This Week': {
      hours: analytics.weeklyHours,
      label: 'Daily study hours (hrs)',
    },
    'This Month': {
      hours: analytics.monthlyHours,
      label: 'Weekly study hours (hrs)',
    },
    'All Time': {
      hours: analytics.monthlyHours.map((d) => ({
        ...d,
        hours: Math.round(d.hours * 4 * 10) / 10,
      })),
      label: 'Monthly study hours (hrs)',
    },
  }), [analytics]);

  const { hours, label } = periodData[period];
  const stats = analytics.stats;
  const subjectDist = analytics.subjectDist;
  const taskTrend = analytics.taskTrend;
  const subjectPerf = analytics.subjectPerf;

  return (
    <PageWrapper title="Analytics">
      <div className={styles.page}>
        <div className={styles.topRow}>
          <div>
            <h2 className={styles.sectionTitle}>Your Study Analytics</h2>
            <p className={styles.sectionSub}>Track your progress and identify patterns.</p>
          </div>
          <div className={styles.periodTabs}>
            {Object.keys(periodData).map((p) => (
              <button
                key={p}
                className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard
            icon={Clock}
            label="Total Study Hours"
            value={`${stats.totalStudyHours}h`}
            sub={`${stats.focusSessionsToday} sessions today`}
            color="#4F46E5"
          />
          <StatCard
            icon={CheckSquare}
            label="Tasks Completed"
            value={String(stats.tasksCompleted)}
            sub="All time"
            color="#10B981"
          />
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`}
            sub={stats.streak > 0 ? 'Keep it going!' : 'Start a focus session'}
            color="#F59E0B"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Daily Study"
            value={`${stats.avgDaily}h`}
            sub={`Progress: ${stats.weeklyProgress}%`}
            color="#60A5FA"
          />
        </div>

        <div className={styles.chartsRow}>
          <Card className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>{label}</h3>
                <p className={styles.chartSub}>Time spent studying per day</p>
              </div>
              <Badge variant="primary" size="sm">
                <BarChart2 size={10} /> {period}
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hours} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EEF2FF' }} />
                <Bar dataKey="hours" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Subject Distribution</h3>
                <p className={styles.chartSub}>Time spent per subject</p>
              </div>
            </div>
            <div className={styles.pieRow}>
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={subjectDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subjectDist.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {subjectDist.map((s) => (
                  <div key={s.name} className={styles.pieLegendItem}>
                    <span className={styles.pieLegendDot} style={{ background: s.color }} />
                    <span className={styles.pieLegendName}>{s.name}</span>
                    <span className={styles.pieLegendVal}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <Card className={styles.lineCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Task Completion Trend</h3>
              <p className={styles.chartSub}>Completed vs total tasks per week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={taskTrend} margin={{ top: 4, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line type="monotone" dataKey="total" stroke="#E2E8F0" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="completed" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 4 }} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className={styles.chartTitle} style={{ marginBottom: 'var(--space-4)' }}>
            Subject Performance
          </h3>
          <div className={styles.perfTable}>
            {subjectPerf.length === 0 ? (
              <p className={styles.sectionSub}>Add tasks to see subject performance.</p>
            ) : (
              subjectPerf.map((row) => (
                <div key={row.subject} className={styles.perfRow}>
                  <div className={styles.perfSubject}>{row.subject}</div>
                  <div className={styles.perfHours}>{row.hours}h</div>
                  <div className={styles.perfTasks}>{row.tasks} tasks</div>
                  <div className={styles.perfBarWrapper}>
                    <div
                      className={styles.perfBar}
                      style={{
                        width: `${row.score}%`,
                        background:
                          row.score > 80 ? '#10B981' : row.score > 70 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                  <div className={styles.perfScore}>{row.score}%</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

export default Analytics;
