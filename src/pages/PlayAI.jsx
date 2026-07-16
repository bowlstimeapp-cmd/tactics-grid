import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot } from 'lucide-react';

const DIFFICULTIES = [
  { key: 'easy', label: 'Easy', icon: '🟢', desc: 'Random play, no passives', color: 'border-emerald-500/30 hover:border-emerald-500/60' },
  { key: 'medium', label: 'Medium', icon: '🟡', desc: 'One-step lookahead, uses passives', color: 'border-amber-500/30 hover:border-amber-500/60' },
  { key: 'hard', label: 'Hard', icon: '🔴', desc: 'Minimax search, optimises endgame', color: 'border-red-500/30 hover:border-red-500/60' },
];

const GAME_MODES = [
  { key: 'standard', label: 'Standard', icon: '🔲', desc: '3×3 grid · 7-card decks · 9 turns', color: 'border-blue-500/30 hover:border-blue-500/60' },
  { key: 'enlarged', label: 'Enlarged', icon: '⬛', desc: '4×4 grid · 12-card decks · 16 turns', color: 'border-purple-500/30 hover:border-purple-500/60' },
];

export default function PlayAI() {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState('standard');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Bot className="w-6 h-6 text-emerald-400" />
        <h1 className="font-heading text-xl text-amber-200">Play vs AI</h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h2 className="font-heading text-sm text-amber-200 mb-3">Game Mode</h2>
          <div className="space-y-3">
            {GAME_MODES.map((m, i) => (
              <motion.button
                key={m.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setGameMode(m.key)}
                className={`w-full text-left p-4 rounded-xl bg-slate-800/40 border transition-all ${m.color} ${
                  gameMode === m.key ? 'ring-2 ring-amber-400/60 bg-amber-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <h3 className="font-heading text-lg text-amber-100">{m.label}</h3>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-sm text-amber-200 mb-3">Difficulty</h2>
          <div className="space-y-3">
            {DIFFICULTIES.map((d, i) => (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/match?difficulty=${d.key}&mode=${gameMode}`}
                  className={`block p-5 rounded-xl bg-slate-800/40 border ${d.color} transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{d.icon}</span>
                    <div>
                      <h3 className="font-heading text-lg text-amber-100">{d.label}</h3>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}