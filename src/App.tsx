import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { Dashboard } from './pages';
import { Login } from './pages/Login';
import { PlayerProvider, AuthProvider, useAuthState } from './shared/contexts';
import { ErrorBoundary } from './shared/components';
import { FirebaseAuthProvider, initSyncManager, destroySyncManager } from './firebase';
import { loadGameTranslations } from './i18n/lazyLoader';
import type { PlayerProfile } from './shared/services/player';
import './index.css';

// Lazy load game components for code splitting
// Each game will be bundled separately, reducing initial load time
// Translations are also lazy-loaded alongside each game
const MagicGraphGame = lazy(() =>
  Promise.all([
    import('./games/MagicGraph').then(m => ({ default: m.MagicGraphGame })),
    loadGameTranslations('magicGraph'),
  ]).then(([module]) => module)
);

const SequenceRaceGame = lazy(() =>
  Promise.all([
    import('./games/SequenceRace').then(m => ({ default: m.SequenceRaceGame })),
    loadGameTranslations('sequenceRace'),
  ]).then(([module]) => module)
);

const ShapeArchitectGame = lazy(() =>
  Promise.all([
    import('./games/ShapeArchitect').then(m => ({ default: m.ShapeArchitectGame })),
    loadGameTranslations('shapeArchitect'),
  ]).then(([module]) => module)
);

// Simple loading spinner for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="loading-spinner__icon">
        <svg viewBox="0 0 50 50" width="48" height="48">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80, 200"
            strokeDashoffset="0"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 25 25"
              to="360 25 25"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    </div>
  );
}

// Protected routes - only accessible when logged in
function ProtectedRoutes() {
  const { isLoggedIn, isLoading } = useAuthState();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/magic-graph" element={<ErrorBoundary><MagicGraphGame /></ErrorBoundary>} />
        <Route path="/sequence-race" element={<ErrorBoundary><SequenceRaceGame /></ErrorBoundary>} />
        <Route path="/shape-architect" element={<ErrorBoundary><ShapeArchitectGame /></ErrorBoundary>} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const [serverProfile, setServerProfile] = useState<PlayerProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const handleLogin = useCallback((profile: PlayerProfile) => {
    setServerProfile(profile);
  }, []);

  const handleLogout = useCallback(() => {
    setServerProfile(null);
  }, []);

  const handleFirebaseUserChange = useCallback((user: User | null) => {
    setFirebaseUser(user);
  }, []);

  // Initialize sync manager when Firebase user is authenticated
  useEffect(() => {
    if (firebaseUser) {
      initSyncManager().catch(console.error);
    }

    return () => {
      if (firebaseUser) {
        destroySyncManager();
      }
    };
  }, [firebaseUser]);

  return (
    <FirebaseAuthProvider onUserChange={handleFirebaseUserChange}>
      <AuthProvider onLogin={handleLogin} onLogout={handleLogout}>
        <PlayerProvider initialProfile={serverProfile}>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <ProtectedRoutes />
          </BrowserRouter>
        </PlayerProvider>
      </AuthProvider>
    </FirebaseAuthProvider>
  );
}

export default App;
