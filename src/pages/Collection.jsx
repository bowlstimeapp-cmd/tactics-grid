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
import { getEnabledCards } from '@/lib/expansions';
import { loadGameConfig } from '@/lib/gameConfig';

export default function Collection() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [faction, setFaction] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [ownedFilter, setOwnedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedCard, setSelectedCard] = useState(null);
  const [profile, setProfile] = useState(null);
  const [expansionSettings, setExpansionSettings] = useState(null);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const profiles = await base44.entities.PlayerProfile.filter({ created_by_id: me.id });
      if (profiles[0]) setProfile(profiles[0]);
      try {
        const cfg = await loadGameConfig();
        setExpansionSettings(cfg.expansion_settings);
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  const owned = profile?.collection || {};
  const altArts = profile?.alt_arts || {};
  const altArtCount = Object.keys(altArts).length;

  const cardPool = expansionSettings ? getEnabledCards(expansionSettings) : ALL_CARDS;
  let filtered = cardPool.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (faction !== 'all' && c.faction !== faction) return false;
    if (rarity !== 'all' && c.rarity !== rarity) return false;
    if (ownedFilter === 'owned' && !owned[c.card_id] && !altArts[c.card_id]) return false;
    if (ownedFilter === 'missing' && (owned[c.card_id] || altArts[c.card_id])) return false;
    return true;
  });

  if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === 'rarity') {
    const order = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 };
    filtered.sort((a, b) => order[a.rarity] - order[b.rarity]);
  }
  if (sortBy === 'power') filtered.sort((a, b) => (b.north + b.east + b.south + b.west) - (a.north + a.east + a.south + a.west));

  // Expand to show alt art versions as separate collection entries.
  // Alt arts share the same card_id (so deck limits still apply) but
  // appear as their own grid tile with the rainbow overlay effect.
  const displayCards = filtered.flatMap(card => {
    const ownCount = owned[card.card_id] || 0;
    const altCount = altArts[card.card_id] || 0;
    const entries = [];
    if (ownedFilter === 'all' || ownedFilter === 'missing' || ownCount > 0) {
      entries.push({ card, isAlt: false, count: ownCount });
    }
    if (altCount > 0) {
      entries.push({ card: { ...card, is_alt_art: true }, isAlt: true, count: altCount });
    }
    return entries;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-heading text-xl text-amber-200">Collection</h1>
        <span className="text-xs text-muted-foreground ml-auto">
          {Object.keys(owned).length}/{cardPool.length} owned
          {altArtCount > 0 && <span className="ml-2 font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #ff0080, #ffd700, #00ff00, #00b4ff, #8b00ff, #ff0080)', backgroundSize: '200% 100%' }}>✨ {altArtCount} alt art{altArtCount !== 1 ? 's' : ''}</span>}
        </span>
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
        {displayCards.map((entry, i) => {
          const { card, isAlt, count } = entry;
          const isOwned = count > 0;
          return (
            <motion.div
              key={card.card_id + (isAlt ? '_alt' : '')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className={isOwned ? '' : 'opacity-40 grayscale'}
            >
              <GameCard
                card={card}
                size="md"
                onClick={() => setSelectedCard(card)}
              />
              <p className="text-center text-[10px] font-heading text-amber-200/90 mt-0.5 truncate px-0.5">{card.name}</p>
              {isOwned && isAlt && (
                <p className="text-center text-[9px] font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #ff0080, #ffd700, #00ff00, #00b4ff, #8b00ff, #ff0080)', backgroundSize: '200% 100%' }}>✨ {count} alt art</p>
              )}
              {isOwned && !isAlt && (
                <p className="text-center text-[9px] text-amber-300/60"># {count} owned</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {displayCards.length === 0 && (
        <div className="text-center text-muted-foreground mt-12">No cards match your filters.</div>
      )}

      <CardDetailModal card={selectedCard} onClose={() => setSelectedCard(null)} owned={!!owned[selectedCard?.card_id]} altArtOwned={!!altArts[selectedCard?.card_id]} />
    </div>
  );
}