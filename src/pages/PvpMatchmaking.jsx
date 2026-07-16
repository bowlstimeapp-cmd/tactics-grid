import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import DeckSelectModal from '@/components/game/DeckSelectModal';
import { loadGameConfig } from '@/lib/gameConfig';
import { applyCardOverrides } from '@/lib/cardDatabase';

const GAME_MODES = [
  { key: 'standard', label: 'Standard', icon: '🔲', desc: '3×3 grid · 7-card decks', color: 'border-blue-500/30 hover:border-blue-500/60' },
  { key: 'enlarged', label: 'Enlarged', icon: '⬛', desc: '4×4 grid · 12-card decks', color: 'border-purple-500/30 hover:border-purple-500/60' },
];

export default function PvpMatchmaking() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('modeselect');
  const [gameMode, setGameMode] = useState('standard');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [searchTime, setSearchTime] = useState(0);
  const cancelRef = useRef(false);

  useEffect(() => {
    async function init() {
      try {
        const cfg = await loadGameConfig();
        applyCardOverrides(cfg.card_overrides);
      } catch (e) { console.error(e); }
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
        if (profiles[0]) setProfile(profiles[0]);
      } catch (e) { console.error(e); }
    }
    init();
  }, []);

  useEffect(() => {
    if (phase !== 'searching') return;
    const interval = setInterval(() => setSearchTime(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'searching') return;
    let active = true;

    const poll = async () => {
      if (!active || cancelRef.current) return;
      try {
        const me = await base44.auth.me();
        const queues = await base44.entities.MatchQueue.filter({
          player_id: me.id, status: 'matched'
        });
        if (active && queues.length > 0 && queues[0].match_id) {
          navigate(`/pvp-match?match_id=${queues[0].match_id}`);
        }
      } catch (e) { console.error(e); }
    };

    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [phase, navigate]);

  const handleDeckSelect = async (cards) => {
    if (!profile) { setError('Profile not loaded yet'); return; }
    setError('');
    setPhase('searching');
    setSearchTime(0);
    cancelRef.current = false;

    try {
      const res = await base44.functions.invoke('pvpMatch', {
        action: 'join',
        player_name: profile.username,
        elo: profile.elo || 1200,
        cards,
        game_mode: gameMode,
      });

      if (res.data.status === 'matched' && res.data.match) {
        navigate(`/pvp-match?match_id=${res.data.match.id}`);
      }
    } catch (e) {
      setError(e.message || 'Failed to join queue');
      setPhase('deckselect');
    }
  };

  const handleCancel = async () => {
    cancelRef.current = true;
    try {
      await base44.functions.invoke('pvpMatch', { action: 'cancel' });
    } catch (e) { console.error(e); }
    setPhase('modeselect');
    setSearchTime(0);
  };

  if (phase === 'modeselect') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
            ← Back
          </Button>
          <h1 className="font-heading text-xl text-amber-200">Ranked Match</h1>
        </div>
        <div className="max-w-md mx-auto space-y-3">
          <h2 className="font-heading text-sm text-amber-200 mb-2">Choose Game Mode</h2>
          {GAME_MODES.map((m, i) => (
            <motion.button
              key={m.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => { setGameMode(m.key); setPhase('deckselect'); }}
              className={`w-full text-left p-5 rounded-xl bg-slate-800/40 border ${m.color} transition-all`}
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
    );
  }

  if (phase === 'deckselect') {
    return <DeckSelectModal open={true} onConfirm={handleDeckSelect} gameMode={gameMode} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-8 p-4">
      {error && <p className="text-red-400 text-sm absolute top-4">{error}</p>}

      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full mx-auto"
        />
        <h2 className="font-heading text-2xl text-amber-200">Searching for Opponent...</h2>
        <p className="text-sm text-muted-foreground">
          Finding a player with similar ELO · {gameMode === 'enlarged' ? '4×4 Enlarged' : '3×3 Standard'}
        </p>
        {profile && (
          <p className="text-xs text-amber-400/70">Your ELO: {profile.elo || 1200}</p>
        )}
        <p className="text-xs text-muted-foreground">{searchTime}s elapsed</p>
      </div>

      <Button onClick={handleCancel} variant="outline" className="border-amber-900/30">
        Cancel
      </Button>
    </div>
  );
}