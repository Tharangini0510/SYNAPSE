// =============================================================
// Sidebar.jsx – Collapsible navigation sidebar
// =============================================================
import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, KanbanSquare, Target,
  BarChart2, FileText, Sparkles, Settings, User,
  ChevronLeft, ChevronRight, LogOut, Zap,
  Library, FolderArchive, Layers, HelpCircle, BookOpen, ChevronDown,
  GraduationCap, TrendingUp, Award, Brain,
  Users, LifeBuoy
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdaptive } from '../../contexts/AdaptiveContext';
import { NAV_ITEMS, NAV_BOTTOM_ITEMS } from '../../utils/constants';
import styles from './Sidebar.module.css';

/** Map icon name strings to Lucide components */
const ICON_MAP = {
  LayoutDashboard, Calendar, KanbanSquare, Target,
  BarChart2, FileText, Sparkles, Settings, User,
  Library, FolderArchive, Layers, HelpCircle, BookOpen,
  GraduationCap, TrendingUp, Award, Brain,
  Users, LifeBuoy,
};

function NavItem({ item, collapsed, isSubItem = false }) {
  const Icon = ICON_MAP[item.icon];
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.active : ''}`
      }
      style={isSubItem && !collapsed ? { paddingLeft: '2.25rem', fontSize: '13px' } : undefined}
      title={collapsed ? item.label : undefined}
    >
      <span className={styles.navIcon}>{Icon && <Icon size={isSubItem ? 16 : 19} />}</span>
      {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
    </NavLink>
  );
}

function NavGroupItem({ item, collapsed }) {
  const location = useLocation();
  const Icon = ICON_MAP[item.icon];
  const isChildActive = item.children?.some((c) => location.pathname.startsWith(c.path));
  const [open, setOpen] = useState(true);

  if (!item.children) {
    return <NavItem item={item} collapsed={collapsed} />;
  }

  return (
    <div className={styles.navGroupWrapper}>
      {!collapsed ? (
        <>
          <button
            type="button"
            className={`${styles.navGroupHeader} ${isChildActive ? styles.activeGroupHeader : ''}`}
            onClick={() => setOpen((o) => !o)}
          >
            <span className={styles.navIcon}>{Icon && <Icon size={19} />}</span>
            <span className={styles.navLabel}>{item.label}</span>
            <ChevronDown
              size={15}
              style={{
                transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform var(--transition-fast)',
                opacity: 0.7,
              }}
            />
          </button>
          {open && (
            <div className={styles.subItemsList}>
              {item.children.map((child) => (
                <NavItem key={child.id} item={child} collapsed={collapsed} isSubItem={true} />
              ))}
            </div>
          )}
        </>
      ) : (
        item.children.map((child) => (
          <NavItem key={child.id} item={child} collapsed={collapsed} />
        ))
      )}
    </div>
  );
}

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const { modeConfig } = useAdaptive();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
      aria-label="Main navigation"
    >
      {/* ── Logo / Brand ── */}
      <div className={styles.brand}>
        <div className={styles.logo} style={{ background: modeConfig.color }}>
          <Zap size={18} color="#fff" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className={styles.brandText}>
            <span className={styles.brandName}>Synapse</span>
            <span className={styles.brandMode}>{modeConfig.label}</span>
          </div>
        )}
      </div>

      {/* ── Main Navigation ── */}
      <nav className={styles.nav} aria-label="Primary navigation">
        <div className={styles.navGroup}>
          {NAV_ITEMS.map((item) => (
            <NavGroupItem key={item.id} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* ── Bottom Items ── */}
      <div className={styles.bottom}>
        {NAV_BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} collapsed={collapsed} />
        ))}

        {/* User info */}
        {!collapsed && user && (
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" />
              ) : (
                (user.name || user.email || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div className={styles.userText}>
              <span className={styles.userName}>
                {(user.name || 'Student').split(' ')[0]}
              </span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title={collapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
        >
          <LogOut size={17} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        className={styles.collapseBtn}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}

export default Sidebar;
