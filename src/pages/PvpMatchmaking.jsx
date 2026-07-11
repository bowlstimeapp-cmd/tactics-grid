import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import DeckSelectModal from '@/components/game/DeckSelectModal';
import { loadGameConfig } from '@/lib/gameConfig';
import { applyCardOverrides } from '@/lib/cardDatabase';

export default function PvpMatchmaking() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('deckselect');
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

  // Timer for search duration
  useEffect(() => {
    if (phase !== 'searching') return;
    const interval = setInterval(() => setSearchTime(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Poll for match
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
    setPhase('deckselect');
    setSearchTime(0);
  };

  if (phase === 'deckselect') {
    return <DeckSelectModal open={true} onConfirm={handleDeckSelect} />;
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
        <p className="text-sm text-muted-foreground">Finding a player with similar ELO</p>
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