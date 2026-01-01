import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages';
import { PlayerProvider } from './shared/contexts';
import { ErrorBoundary } from './shared/components';
import './index.css';

// Lazy load game components for code splitting
// Each game will be bundled separately, reducing initial load time
const MagicGraphGame = lazy(() => import('./games/MagicGraph').then(m => ({ default: m.MagicGraphGame })));
const SequenceRaceGame = lazy(() => import('./games/SequenceRace').then(m => ({ default: m.SequenceRaceGame })));
const ShapeArchitectGame = lazy(() => import('./games/ShapeArchitect').then(m => ({ default: m.ShapeArchitectGame })));

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

function App() {
  return (
    <PlayerProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/magic-graph" element={<ErrorBoundary><MagicGraphGame /></ErrorBoundary>} />
            <Route path="/sequence-race" element={<ErrorBoundary><SequenceRaceGame /></ErrorBoundary>} />
            <Route path="/shape-architect" element={<ErrorBoundary><ShapeArchitectGame /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </PlayerProvider>
  );
}

export default App;
