import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { ACHIEVEMENTS } from '@/lib/gameData';

export default function Achievements() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
      if (profiles[0]) setProfile(profiles[0]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  const earned = profile?.achievements || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Star className="w-5 h-5 text-amber-400" />
        <h1 className="font-heading text-xl text-amber-200">Achievements</h1>
        <span className="text-xs text-muted-foreground ml-auto">
          {earned.length}/{ACHIEVEMENTS.length}
        </span>
      </div>

      <div className="max-w-lg mx-auto space-y-2">
        {ACHIEVEMENTS.map((ach, i) => {
          const unlocked = earned.includes(ach.id) || (profile && ach.check(profile));
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                unlocked
                  ? 'bg-amber-900/10 border-amber-500/20'
                  : 'bg-slate-800/30 border-slate-700/20 opacity-60'
              }`}
            >
              <span className="text-2xl">{ach.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${unlocked ? 'text-amber-200' : ''}`}>{ach.name}</p>
                <p className="text-xs text-muted-foreground">{ach.description}</p>
              </div>
              {unlocked && <span className="text-emerald-400 text-xs">✓ Unlocked</span>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}