import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AllGoalsPage from './pages/AllGoalsPage';
import CreateGoalPage from './pages/CreateGoalPage';
import AuthPage from './pages/AuthPage';
import UserStatsPage from './pages/UserStatsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/goals" element={<AllGoalsPage />} />
      <Route path="/create" element={<CreateGoalPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/stats" element={<UserStatsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
