// =============================================================
// App.jsx – Root component with routing and context providers
// =============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdaptiveProvider } from './contexts/AdaptiveContext';
import { DataProvider } from './contexts/DataContext';
import { PageLoader } from './components/common/Loader';

import SplashScreen    from './pages/SplashScreen';
import WelcomePage     from './pages/WelcomePage';
import LoginPage       from './pages/LoginPage';
import SignUpPage      from './pages/SignUpPage';
import AdaptiveSetup   from './pages/AdaptiveSetup';

import Dashboard       from './pages/Dashboard';
import CalendarPage    from './pages/CalendarPage';
import TaskBoard       from './pages/TaskBoard';
import FocusMode       from './pages/FocusMode';
import Analytics       from './pages/Analytics';
import Notes           from './pages/Notes';
import AIPlanner       from './pages/AIPlanner';
import Settings        from './pages/Settings';
import ProfilePage     from './pages/ProfilePage';

import StudyVault       from './pages/StudyVault';
import Flashcards       from './pages/Flashcards';
import QuizCenter       from './pages/QuizCenter';
import ProgressTracker  from './pages/ProgressTracker';
import Achievements     from './pages/Achievements';
import AIInsights       from './pages/AIInsights';
import StudyGroups      from './pages/StudyGroups';
import HelpSupport      from './pages/HelpSupport';

function ProtectedRoute({ children }) {
  const { isAuthenticated, authReady } = useAuth();
  if (!authReady) return <PageLoader />;
  return isAuthenticated ? children : <Navigate to="/welcome" replace />;
}

function SetupGuard({ children }) {
  const { isAuthenticated, isFirstTime, authReady } = useAuth();
  if (!authReady) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/welcome" replace />;
  if (isFirstTime) return <Navigate to="/setup" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/signup"  element={<SignUpPage />} />

      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <AdaptiveSetup />
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard"        element={<SetupGuard><Dashboard /></SetupGuard>} />
      <Route path="/study-vault"      element={<SetupGuard><StudyVault /></SetupGuard>} />
      <Route path="/flashcards"       element={<SetupGuard><Flashcards /></SetupGuard>} />
      <Route path="/quiz-center"      element={<SetupGuard><QuizCenter /></SetupGuard>} />
      <Route path="/progress-tracker" element={<SetupGuard><ProgressTracker /></SetupGuard>} />
      <Route path="/achievements"     element={<SetupGuard><Achievements /></SetupGuard>} />
      <Route path="/ai-insights"      element={<SetupGuard><AIInsights /></SetupGuard>} />
      <Route path="/study-groups"     element={<SetupGuard><StudyGroups /></SetupGuard>} />
      <Route path="/help-support"     element={<SetupGuard><HelpSupport /></SetupGuard>} />
      <Route path="/calendar"         element={<SetupGuard><CalendarPage /></SetupGuard>} />
      <Route path="/tasks"       element={<SetupGuard><TaskBoard /></SetupGuard>} />
      <Route path="/focus"       element={<SetupGuard><FocusMode /></SetupGuard>} />
      <Route path="/analytics"   element={<SetupGuard><Analytics /></SetupGuard>} />
      <Route path="/notes"       element={<SetupGuard><Notes /></SetupGuard>} />
      <Route path="/ai-planner"  element={<SetupGuard><AIPlanner /></SetupGuard>} />
      <Route path="/settings"    element={<SetupGuard><Settings /></SetupGuard>} />
      <Route path="/profile"     element={<SetupGuard><ProfilePage /></SetupGuard>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdaptiveProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AdaptiveProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
