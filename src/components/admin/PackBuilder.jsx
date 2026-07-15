import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Trash2, Plus, Package, CheckCheck, X } from 'lucide-react';
import { ALL_CARDS, getCardById } from '@/lib/cardDatabase';
import { FACTION_CONFIG, RARITY_CONFIG } from '@/lib/gameData';
import { getCustomPackRarityAllocation } from '@/lib/packLogic';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const FACTIONS = Object.keys(FACTION_CONFIG);

export default function PackBuilder({ customPacks, setCustomPacks }) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState(100);
  const [selected, setSelected] = useState(new Set());
  const [rarityFilter, setRarityFilter] = useState('all');
  const [factionFilter, setFactionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const filteredCards = useMemo(() => ALL_CARDS.filter(c =>
    (rarityFilter === 'all' || c.rarity === rarityFilter) &&
    (factionFilter === 'all' || c.faction === factionFilter) &&
    (search === '' || c.name.toLowerCase().includes(search.toLowerCase()))
  ), [rarityFilter, factionFilter, search]);

  const toggleCard = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected(prev => {
      const next = new Set(prev);
      filteredCards.forEach(c => next.add(c.card_id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const addPack = () => {
    if (!name.trim() || selected.size === 0) return;
    const pack = {
      id: crypto.randomUUID(),
      name: name.trim(),
      cost: parseInt(cost) || 0,
      card_ids: Array.from(selected),
      in_shop: false,
    };
    setCustomPacks([...customPacks, pack]);
    setName('');
    setCost(100);
    setSelected(new Set());
  };

  const removePack = (id) => {
    setCustomPacks(customPacks.filter(p => p.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const toggleShop = (id) => {
    setCustomPacks(customPacks.map(p => p.id === id ? { ...p, in_shop: !p.in_shop } : p));
  };

  return (
    <div className="space-y-6">
      {/* Builder */}
      <div className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4 space-y-4">
        <h3 className="font-heading text-amber-200">Build a New Pack</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Pack Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dragon Hoard" className="bg-slate-900 border-amber-900/30" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Cost (coins)</label>
            <Input type="number" value={cost} onChange={e => setCost(parseInt(e.target.value) || 0)} className="bg-slate-900 border-amber-900/30" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Input placeholder="Search cards..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border-amber-900/30 w-40 h-9" />
          <select value={rarityFilter} onChange={e => setRarityFilter(e.target.value)} className="bg-slate-900 border border-amber-900/30 rounded-md px-2 py-1.5 text-sm h-9">
            <option value="all">All Rarities</option>
            {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={factionFilter} onChange={e => setFactionFilter(e.target.value)} className="bg-slate-900 border border-amber-900/30 rounded-md px-2 py-1.5 text-sm h-9">
            <option value="all">All Factions</option>
            {FACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={selectAllFiltered} className="border-amber-900/30 h-9">
            <CheckCheck className="w-4 h-4 mr-1" /> Select All Filtered
          </Button>
          {selected.size > 0 && (
            <Button size="sm" variant="ghost" onClick={clearSelection} className="h-9 text-muted-foreground">
              <X className="w-4 h-4 mr-1" /> Clear ({selected.size})
            </Button>
          )}
        </div>

        {/* Card grid */}
        <div className="max-h-72 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredCards.map(card => {
            const isSel = selected.has(card.card_id);
            return (
              <label key={card.card_id} className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${isSel ? 'border-amber-500/60 bg-amber-900/20' : 'border-slate-700/30 bg-slate-800/30 hover:border-amber-500/30'}`}>
                <Checkbox checked={isSel} onCheckedChange={() => toggleCard(card.card_id)} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-amber-100 truncate">{card.name}</p>
                  <p className="text-[10px] text-muted-foreground">{card.faction} · {card.rarity}</p>
                </div>
              </label>
            );
          })}
        </div>

        <Button onClick={addPack} disabled={!name.trim() || selected.size === 0} className="bg-amber-600 hover:bg-amber-500 text-black">
          <Plus className="w-4 h-4 mr-1" /> Add to Pack ({selected.size} cards)
        </Button>
      </div>

      {/* Existing packs */}
      <div className="space-y-3">
        <h3 className="font-heading text-amber-200">Created Packs ({customPacks.length})</h3>
        {customPacks.length === 0 && (
          <p className="text-sm text-muted-foreground">No custom packs yet. Build one above.</p>
        )}
        {customPacks.map(pack => {
          const alloc = getCustomPackRarityAllocation(pack);
          const isOpen = expanded === pack.id;
          return (
            <div key={pack.id} className="bg-slate-800/40 rounded-xl border border-slate-700/30 overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <button onClick={() => setExpanded(isOpen ? null : pack.id)} className="text-muted-foreground hover:text-amber-200">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                  <Package className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading text-amber-100 truncate">{pack.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-0.5">
                    {RARITIES.filter(r => alloc[r]).map(r => (
                      <span key={r} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: RARITY_CONFIG[r].color, background: RARITY_CONFIG[r].color + '20' }}>
                        {alloc[r]} {r[0]}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground">{pack.card_ids.length} cards</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-300 mr-2">
                  <span className="text-xs">🪙</span>
                  <span className="font-heading text-sm">{pack.cost}</span>
                </div>
                {pack.in_shop ? (
                  <Button size="sm" variant="outline" onClick={() => toggleShop(pack.id)} className="border-emerald-700/40 text-emerald-400 h-8">
                    Remove from Shop
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => toggleShop(pack.id)} className="bg-amber-600 hover:bg-amber-500 text-black h-8">
                    Add to Shop
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => removePack(pack.id)} className="h-8 text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {isOpen && (
                <div className="border-t border-slate-700/30 p-3 bg-slate-900/40">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {pack.card_ids.map(id => {
                      const card = getCardById(id);
                      if (!card) return null;
                      return (
                        <div key={id} className="flex items-center gap-1.5 bg-slate-800/40 rounded-md p-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: RARITY_CONFIG[card.rarity].color }} />
                          <p className="text-[11px] text-amber-100 truncate">{card.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}