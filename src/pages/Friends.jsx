import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, UserPlus, Check, X, Swords, Users } from 'lucide-react';
import { getRankForElo } from '@/lib/gameData';
import DeckSelectModal from '@/components/game/DeckSelectModal';

export default function Friends() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingChallenges, setIncomingChallenges] = useState([]);
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [challengePhase, setChallengePhase] = useState('idle'); // idle, deckselect, searching
  const [challengeError, setChallengeError] = useState('');
  const cancelRef = useRef(false);

  const loadData = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
      if (profiles[0]) setProfile(profiles[0]);

      const [sent, received] = await Promise.all([
        base44.entities.Friendship.filter({ requester_id: me.id, status: 'pending' }),
        base44.entities.Friendship.filter({ recipient_id: me.id, status: 'pending' }),
      ]);
      setOutgoingRequests(sent);
      setIncomingRequests(received);

      const acceptedSent = await base44.entities.Friendship.filter({ requester_id: me.id, status: 'accepted' });
      const acceptedReceived = await base44.entities.Friendship.filter({ recipient_id: me.id, status: 'accepted' });
      const allFriendships = [...acceptedSent, ...acceptedReceived];
      const friendIds = allFriendships.map(f => f.requester_id === me.id ? f.recipient_id : f.requester_id);
      const friendProfiles = await Promise.all(
        friendIds.map(id => base44.entities.PlayerProfile.filter({ created_by_id: id }).then(r => r[0]).catch(() => null))
      );
      setFriends(friendProfiles.filter(Boolean));

      // Check for incoming challenges
      const challenges = await base44.entities.MatchQueue.filter({ challenged_id: me.id, status: 'searching' });
      setIncomingChallenges(challenges);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Poll for challenge match
  useEffect(() => {
    if (challengePhase !== 'searching') return;
    let active = true;
    const poll = async () => {
      if (!active || cancelRef.current) return;
      try {
        const me = await base44.auth.me();
        const queues = await base44.entities.MatchQueue.filter({ player_id: me.id, status: 'matched' });
        if (active && queues.length > 0 && queues[0].match_id) {
          navigate(`/pvp-match?match_id=${queues[0].match_id}`);
        }
      } catch (e) { console.error(e); }
    };
    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [challengePhase, navigate]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const me = await base44.auth.me();
      const all = await base44.entities.PlayerProfile.list('-created_date', 50);
      const results = all.filter(p =>
        p.created_by_id !== me.id &&
        (p.username || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } catch (e) { console.error(e); }
    setSearching(false);
  };

  const sendRequest = async (targetProfile) => {
    try {
      const me = await base44.auth.me();
      await base44.entities.Friendship.create({
        requester_id: me.id,
        recipient_id: targetProfile.created_by_id,
        requester_name: profile?.username || 'Player',
        recipient_name: targetProfile.username || 'Player',
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      setSearchResults(prev => prev.filter(p => p.created_by_id !== targetProfile.created_by_id));
      setOutgoingRequests(prev => [...prev, { recipient_id: targetProfile.created_by_id, recipient_name: targetProfile.username }]);
    } catch (e) { console.error(e); }
  };

  const acceptRequest = async (friendship) => {
    await base44.entities.Friendship.update(friendship.id, { status: 'accepted' });
    loadData();
  };

  const declineRequest = async (friendship) => {
    await base44.entities.Friendship.update(friendship.id, { status: 'declined' });
    setIncomingRequests(prev => prev.filter(r => r.id !== friendship.id));
  };

  const startChallenge = (friendProfile) => {
    setChallengeTarget(friendProfile);
    setChallengePhase('deckselect');
  };

  const handleChallengeDeckSelect = async (cards) => {
    if (!profile || !challengeTarget) return;
    setChallengePhase('searching');
    setChallengeError('');
    cancelRef.current = false;
    try {
      const res = await base44.functions.invoke('pvpMatch', {
        action: 'join',
        player_name: profile.username,
        elo: profile.elo || 1200,
        cards,
        game_mode: 'standard',
        challenged_id: challengeTarget.created_by_id,
      });
      if (res.data.status === 'matched' && res.data.match) {
        navigate(`/pvp-match?match_id=${res.data.match.id}`);
      }
    } catch (e) {
      setChallengeError(e.message || 'Failed to challenge');
      setChallengePhase('idle');
    }
  };

  const acceptChallenge = (challenge) => {
    setChallengeTarget({ created_by_id: challenge.player_id, username: challenge.player_name });
    setChallengePhase('deckselect');
  };

  const cancelChallenge = async () => {
    cancelRef.current = true;
    try { await base44.functions.invoke('pvpMatch', { action: 'cancel' }); } catch (e) { console.error(e); }
    setChallengePhase('idle');
    setChallengeTarget(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  if (challengePhase === 'deckselect' && challengeTarget) {
    return <DeckSelectModal open={true} onConfirm={handleChallengeDeckSelect} gameMode="standard"
      onClose={() => { setChallengePhase('idle'); setChallengeTarget(null); }} />;
  }

  if (challengePhase === 'searching') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-8 p-4">
        {challengeError && <p className="text-red-400 text-sm">{challengeError}</p>}
        <div className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full mx-auto" />
          <h2 className="font-heading text-2xl text-amber-200">Waiting for {challengeTarget?.username}...</h2>
          <p className="text-sm text-muted-foreground">Your challenge has been sent</p>
        </div>
        <Button onClick={cancelChallenge} variant="outline" className="border-amber-900/30">Cancel</Button>
      </div>
    );
  }

  const isAlreadyFriend = (profileId) => {
    return friends.some(f => f.created_by_id === profileId) ||
      outgoingRequests.some(r => r.recipient_id === profileId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-heading text-xl text-amber-200">Friends</h1>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search by username..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="bg-slate-800/50 border-slate-700/40"
        />
        <Button onClick={handleSearch} disabled={searching} className="bg-amber-600 hover:bg-amber-500 text-black">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-xs text-amber-400/70 uppercase tracking-widest">Search Results</h3>
          {searchResults.map(p => (
            <div key={p.created_by_id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-heading text-black">
                {(p.username || 'P')[0].toUpperCase()}
              </div>
              <span className="flex-1 text-sm text-amber-100">{p.username}</span>
              {!isAlreadyFriend(p.created_by_id) ? (
                <Button size="sm" variant="ghost" onClick={() => sendRequest(p)} className="text-amber-400">
                  <UserPlus className="w-4 h-4 mr-1" /> Add
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Incoming challenges */}
      {incomingChallenges.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-xs text-amber-400/70 uppercase tracking-widest">Incoming Challenges</h3>
          {incomingChallenges.map(ch => (
            <div key={ch.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-900/20 border border-amber-500/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-heading text-black">
                {(ch.player_name || 'P')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="text-sm text-amber-100">{ch.player_name}</span>
                <span className="text-xs text-muted-foreground ml-2">ELO {ch.elo}</span>
              </div>
              <Button size="sm" onClick={() => acceptChallenge(ch)} className="bg-amber-600 hover:bg-amber-500 text-black">
                <Swords className="w-4 h-4 mr-1" /> Accept
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Incoming friend requests */}
      {incomingRequests.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-xs text-amber-400/70 uppercase tracking-widest">Friend Requests</h3>
          {incomingRequests.map(req => (
            <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-heading text-black">
                {(req.requester_name || 'P')[0].toUpperCase()}
              </div>
              <span className="flex-1 text-sm text-amber-100">{req.requester_name}</span>
              <Button size="sm" variant="ghost" onClick={() => acceptRequest(req)} className="text-emerald-400">
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => declineRequest(req)} className="text-red-400">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div className="space-y-2">
        <h3 className="text-xs text-amber-400/70 uppercase tracking-widest">Friends ({friends.length})</h3>
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No friends yet. Search for players above!</p>
        ) : (
          friends.map(f => {
            const rank = getRankForElo(f.elo || 1200);
            return (
              <div key={f.created_by_id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-xs font-heading text-black">
                  {(f.username || 'P')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-amber-100">{f.username}</span>
                  <span className="text-xs ml-2" style={{ color: rank.color }}>{rank.icon} {rank.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">· {f.elo || 1200}</span>
                </div>
                <Button size="sm" onClick={() => startChallenge(f)} className="bg-amber-600 hover:bg-amber-500 text-black">
                  <Swords className="w-4 h-4 mr-1" /> Challenge
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}