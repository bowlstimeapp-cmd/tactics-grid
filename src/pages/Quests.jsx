import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scroll } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

const DAILY_QUEST_TEMPLATES = [
  { type: 'win_matches', description: 'Win 3 matches', target: 3, reward_coins: 75, reward_xp: 50 },
  { type: 'play_beasts', description: 'Play 20 Beast cards', target: 20, reward_coins: 50, reward_xp: 30 },
  { type: 'capture_cards', description: 'Capture 15 enemy cards', target: 15, reward_coins: 60, reward_xp: 40 },
  { type: 'use_passives', description: 'Trigger 5 passive abilities', target: 5, reward_coins: 40, reward_xp: 25 },
  { type: 'play_matches', description: 'Play 5 matches', target: 5, reward_coins: 50, reward_xp: 35 },
];

export default function Quests() {
  const navigate = useNavigate();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      let userQuests = await base44.entities.DailyQuest.filter({ created_by_id: me.id });

      // If no quests today, generate them
      const today = new Date().toISOString().split('T')[0];
      const todayQuests = userQuests.filter(q => q.expires_at?.startsWith(today));

      if (todayQuests.length === 0) {
        const shuffled = [...DAILY_QUEST_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3);
        const created = [];
        for (const t of shuffled) {
          const q = await base44.entities.DailyQuest.create({
            ...t,
            progress: 0,
            completed: false,
            claimed: false,
            expires_at: today + 'T23:59:59Z',
          });
          created.push(q);
        }
        userQuests = created;
      } else {
        userQuests = todayQuests;
      }

      setQuests(userQuests);
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
        <Scroll className="w-5 h-5 text-amber-400" />
        <h1 className="font-heading text-xl text-amber-200">Daily Quests</h1>
      </div>

      <div className="max-w-lg mx-auto space-y-3">
        {quests.map((quest, i) => {
          const progress = Math.min((quest.progress || 0) / quest.target * 100, 100);
          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border ${
                quest.completed
                  ? 'bg-emerald-900/10 border-emerald-500/20'
                  : 'bg-slate-800/40 border-slate-700/20'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">{quest.description}</p>
                  <p className="text-xs text-muted-foreground">{quest.progress || 0}/{quest.target}</p>
                </div>
                <div className="text-right text-xs">
                  {quest.reward_coins > 0 && <span className="text-amber-300">🪙 {quest.reward_coins}</span>}
                  {quest.reward_xp > 0 && <span className="text-blue-300 ml-2">⭐ {quest.reward_xp}</span>}
                </div>
              </div>
              <Progress value={progress} className="h-2 bg-slate-700" />
              {quest.completed && !quest.claimed && (
                <Button size="sm" className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                  Claim Reward
                </Button>
              )}
            </motion.div>
          );
        })}

        {quests.length === 0 && (
          <p className="text-center text-muted-foreground mt-12">No quests available today.</p>
        )}
      </div>
    </div>
  );
}