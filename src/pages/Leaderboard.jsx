import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { getRankForElo } from '@/lib/gameData';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const profiles = await base44.entities.PlayerProfile.list('-elo', 50);
      setPlayers(profiles);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Trophy className="w-5 h-5 text-amber-400" />
        <h1 className="font-heading text-xl text-amber-200">Leaderboard</h1>
      </div>

      <div className="max-w-lg mx-auto space-y-2">
        {players.map((player, i) => {
          const rank = getRankForElo(player.elo);
          const medals = ['🥇', '🥈', '🥉'];
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/20"
            >
              <span className="w-8 text-center font-heading text-sm text-muted-foreground">
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-heading text-black">
                {(player.username || 'P')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{player.username}</p>
                <p className="text-xs" style={{ color: rank.color }}>{rank.icon} {rank.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-amber-300">{player.elo}</p>
                <p className="text-xs text-muted-foreground">{player.wins || 0}W / {player.losses || 0}L</p>
              </div>
            </motion.div>
          );
        })}

        {players.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">No players yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}