import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot } from 'lucide-react';

const DIFFICULTIES = [
  { key: 'easy', label: 'Easy', icon: '🟢', desc: 'Random play, no passives', color: 'border-emerald-500/30 hover:border-emerald-500/60' },
  { key: 'medium', label: 'Medium', icon: '🟡', desc: 'One-step lookahead, uses passives', color: 'border-amber-500/30 hover:border-amber-500/60' },
  { key: 'hard', label: 'Hard', icon: '🔴', desc: 'Minimax search, optimises endgame', color: 'border-red-500/30 hover:border-red-500/60' },
];

export default function PlayAI() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Bot className="w-6 h-6 text-emerald-400" />
        <h1 className="font-heading text-xl text-amber-200">Play vs AI</h1>
      </div>

      <div className="space-y-3 max-w-md mx-auto">
        {DIFFICULTIES.map((d, i) => (
          <motion.div
            key={d.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={`/match?difficulty=${d.key}`}
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
  );
}