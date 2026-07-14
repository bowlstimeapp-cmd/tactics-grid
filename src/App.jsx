import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Game pages
import Home from '@/pages/Home';
import GameMatch from '@/pages/GameMatch';
import PlayAI from '@/pages/PlayAI';
import Collection from '@/pages/Collection';
import DeckBuilder from '@/pages/DeckBuilder';
import Shop from '@/pages/Shop';
import Leaderboard from '@/pages/Leaderboard';
import Achievements from '@/pages/Achievements';
import Quests from '@/pages/Quests';
import Admin from '@/pages/Admin';
import PvpMatchmaking from '@/pages/PvpMatchmaking';
import PvpGameMatch from '@/pages/PvpGameMatch';
import BalanceReport from '@/pages/BalanceReport';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="font-heading text-amber-200 text-sm tracking-widest">GRIDFALL</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Home />} />
        <Route path="/match" element={<GameMatch />} />
        <Route path="/play-ai" element={<PlayAI />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/decks" element={<DeckBuilder />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/quests" element={<Quests />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/pvp" element={<PvpMatchmaking />} />
        <Route path="/pvp-match" element={<PvpGameMatch />} />
        <Route path="/balancereport" element={<BalanceReport />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App