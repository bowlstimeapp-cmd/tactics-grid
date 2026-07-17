import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sword, ShieldHalf, Bot, Library, Layers, Store, Trophy, Scroll, Star, ChevronRight, LogOut, Settings, Repeat, BookOpen, Users, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getRankForElo, FACTION_CONFIG } from '@/lib/gameData';
const NAV_ITEMS = [
  { label: 'Play Ranked', icon: Sword, path: '/pvp', color: 'text-amber-400', desc: 'Live PvP matches' },
  { label: 'Play Casual', icon: ShieldHalf, path: '/match?difficulty=medium', color: 'text-blue-400', desc: 'Relaxed games' },
  { label: 'Play AI', icon: Bot, path: '/play-ai', color: 'text-emerald-400', desc: 'Practice vs AI' },
];

const MENU_ITEMS = [
  { label: 'Friends', icon: Users, path: '/friends', badge: true },
  { label: 'Collection', icon: Library, path: '/collection' },
  { label: 'Deck Builder', icon: Layers, path: '/decks' },
  { label: 'Shop', icon: Store, path: '/shop' },
  { label: 'Card Exchange', icon: Repeat, path: '/exchange' },
  { label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
  { label: 'Achievements', icon: Star, path: '/achievements' },
  { label: 'Quests', icon: Scroll, path: '/quests' },
  { label: 'Help Guide', icon: BookOpen, path: '/help' },
];

export default function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendsBadge, setFriendsBadge] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
        let currentProfile = null;
        if (profiles.length > 0) {
          currentProfile = profiles[0];
        } else {
          // Create initial profile — starter packs are claimed on the Welcome screen
          currentProfile = await base44.entities.PlayerProfile.create({
            username: me.full_name || me.email?.split('@')[0] || 'Player',
            coins: 500,
            xp: 0,
            level: 1,
            elo: 1200,
            collection: {},
          });
        }
        // Login streak logic
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (currentProfile.last_login_date !== today) {
          let newStreak = 1;
          if (currentProfile.last_login_date === yesterday) {
            newStreak = (currentProfile.login_streak || 0) + 1;
          }
          currentProfile = await base44.entities.PlayerProfile.update(currentProfile.id, {
            login_streak: newStreak,
            last_login_date: today,
          });
        }

        setProfile(currentProfile);

        // Friends notification badge
        try {
          const [reqs, challenges] = await Promise.all([
            base44.entities.Friendship.filter({ recipient_id: me.id, status: 'pending' }),
            base44.entities.MatchQueue.filter({ challenged_id: me.id, status: 'searching' }),
          ]);
          setFriendsBadge(reqs.length + challenges.length);
        } catch (e) { console.error(e); }

        if (!currentProfile.has_seen_welcome) {
          navigate('/welcome', { replace: true });
          return;
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const rank = profile ? getRankForElo(profile.elo) : getRankForElo(1200);
  const xpForLevel = (profile?.level || 1) * 100;
  const xpProgress = ((profile?.xp || 0) % xpForLevel) / xpForLevel * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent" />
        <div className="relative px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-2xl sm:text-3xl text-amber-200 tracking-wide">Gridfall</h1>
            <Button
              variant="ghost" size="sm"
              onClick={() => base44.auth.logout('/')}
              className="text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-2xl font-heading text-black">
                {(profile?.username || 'P')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-heading text-lg text-amber-100 truncate">{profile?.username}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm" style={{ color: rank.color }}>{rank.icon} {rank.name}</span>
                  <span className="text-xs text-muted-foreground">ELO {profile?.elo || 1200}</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-xs text-amber-400">Lv.{profile?.level || 1}</span>
                  <Progress value={xpProgress} className="h-1.5 flex-1 bg-slate-700" />
                  {profile?.login_streak > 1 && (
                    <span className="flex items-center gap-0.5 text-xs text-orange-400 font-medium">
                      <Flame className="w-3 h-3" /> {profile.login_streak}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Currencies */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-slate-700/40">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🪙</span>
                <span className="text-sm font-medium text-amber-300">{profile?.coins || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">💎</span>
                <span className="text-sm font-medium text-purple-300">{profile?.essence || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🎮</span>
                <span className="text-sm font-medium text-blue-300">{profile?.games_played || 0} games</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-sm text-emerald-400">{profile?.wins || 0}W</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-sm text-red-400">{profile?.losses || 0}L</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Play buttons */}
      <div className="px-4 space-y-3 mt-2">
        <h3 className="font-heading text-sm text-amber-400/70 uppercase tracking-widest">Quick Play</h3>
        <div className="grid grid-cols-3 gap-2">
          {NAV_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={item.path}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-amber-500/30 hover:bg-slate-800/60 transition-all"
              >
                <item.icon className={`w-7 h-7 ${item.color}`} />
                <span className="text-xs font-medium text-center">{item.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <div className="px-4 mt-6 space-y-3 pb-8">
        <h3 className="font-heading text-sm text-amber-400/70 uppercase tracking-widest">Menu</h3>
        <div className="grid grid-cols-2 gap-2">
          {MENU_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <Link
                to={item.path}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/20 hover:border-amber-500/20 hover:bg-slate-800/50 transition-all"
              >
                <item.icon className="w-5 h-5 text-amber-400/60" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {item.badge && friendsBadge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {friendsBadge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </motion.div>
          ))}
        </div>

        {user?.role === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-900/20 border border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-900/30 transition-all mt-3"
          >
            <Settings className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium flex-1">Admin Dashboard</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        )}
      </div>
    </div>
  );
}