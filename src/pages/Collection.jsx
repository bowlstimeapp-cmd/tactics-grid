import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import GameCard from '@/components/game/GameCard';
import CardDetailModal from '@/components/game/CardDetailModal';
import { ALL_CARDS } from '@/lib/cardDatabase';
import { FACTION_CONFIG } from '@/lib/gameData';

export default function Collection() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [faction, setFaction] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [ownedFilter, setOwnedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedCard, setSelectedCard] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
      if (profiles[0]) setProfile(profiles[0]);
    }
    load();
  }, []);

  const owned = profile?.collection || {};

  let filtered = ALL_CARDS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (faction !== 'all' && c.faction !== faction) return false;
    if (rarity !== 'all' && c.rarity !== rarity) return false;
    if (ownedFilter === 'owned' && !owned[c.card_id]) return false;
    if (ownedFilter === 'missing' && owned[c.card_id]) return false;
    return true;
  });

  if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'rarity') {
    const order = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 };
    filtered.sort((a, b) => order[a.rarity] - order[b.rarity]);
  }
  if (sortBy === 'power') filtered.sort((a, b) => (b.north + b.east + b.south + b.west) - (a.north + a.east + a.south + a.west));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-heading text-xl text-amber-200">Collection</h1>
        <span className="text-xs text-muted-foreground ml-auto">{Object.keys(owned).length}/{ALL_CARDS.length} owned</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 bg-slate-800/50 border-slate-700/40 h-9 text-sm"
          />
        </div>
        <Select value={faction} onValueChange={setFaction}>
          <SelectTrigger className="w-[120px] h-9 bg-slate-800/50 border-slate-700/40 text-sm">
            <SelectValue placeholder="Faction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Factions</SelectItem>
            {Object.keys(FACTION_CONFIG).map(f => (
              <SelectItem key={f} value={f}>{FACTION_CONFIG[f].icon} {f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rarity} onValueChange={setRarity}>
          <SelectTrigger className="w-[110px] h-9 bg-slate-800/50 border-slate-700/40 text-sm">
            <SelectValue placeholder="Rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rarities</SelectItem>
            <SelectItem value="Common">Common</SelectItem>
            <SelectItem value="Uncommon">Uncommon</SelectItem>
            <SelectItem value="Rare">Rare</SelectItem>
            <SelectItem value="Epic">Epic</SelectItem>
            <SelectItem value="Legendary">Legendary</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownedFilter} onValueChange={setOwnedFilter}>
          <SelectTrigger className="w-[100px] h-9 bg-slate-800/50 border-slate-700/40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="owned">Owned</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[100px] h-9 bg-slate-800/50 border-slate-700/40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rarity">Rarity</SelectItem>
            <SelectItem value="power">Power</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {filtered.map((card, i) => {
          const count = owned[card.card_id] || 0;
          return (
            <motion.div
              key={card.card_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className={count === 0 ? 'opacity-40 grayscale' : ''}
            >
              <GameCard
                card={card}
                size="md"
                onClick={() => setSelectedCard(card)}
              />
              <p className="text-center text-[10px] font-heading text-amber-200/90 mt-0.5 truncate px-0.5">{card.name}</p>
              {count > 0 && (
                <p className="text-center text-[9px] text-amber-300/60"># {count} owned</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground mt-12">No cards match your filters.</div>
      )}

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} owned={!!owned[selectedCard?.card_id]} />
    </div>
  );
}