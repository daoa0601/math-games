import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages';
import { MagicGraphGame } from './games/MagicGraph';
import { SequenceRaceGame } from './games/SequenceRace';
import { ShapeArchitectGame } from './games/ShapeArchitect';
import './index.css';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/magic-graph" element={<MagicGraphGame />} />
        <Route path="/sequence-race" element={<SequenceRaceGame />} />
        <Route path="/shape-architect" element={<ShapeArchitectGame />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
