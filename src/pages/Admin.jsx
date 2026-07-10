import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ALL_CARDS } from '@/lib/cardDatabase';
import { FACTION_CONFIG, RARITY_CONFIG } from '@/lib/gameData';
import { loadGameConfig, saveGameConfig } from '@/lib/gameConfig';

const FACTIONS = Object.keys(FACTION_CONFIG);

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [configId, setConfigId] = useState(null);
  const [standardPackCost, setStandardPackCost] = useState(100);
  const [standardPackSize, setStandardPackSize] = useState(3);
  const [factionPackCost, setFactionPackCost] = useState(150);
  const [packOdds, setPackOdds] = useState([]);
  const [cardStats, setCardStats] = useState({});
  const [factionFilter, setFactionFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        if (me.role !== 'admin') {
          navigate('/');
          return;
        }
        const cfg = await loadGameConfig();
        setConfigId(cfg.id);
        setStandardPackCost(cfg.standard_pack_cost ?? 100);
        setStandardPackSize(cfg.standard_pack_size ?? 3);
        setFactionPackCost(cfg.faction_pack_cost ?? 150);
        setPackOdds(cfg.pack_odds || []);
        const stats = {};
        ALL_CARDS.forEach(c => {
          stats[c.card_id] = { north: c.north, east: c.east, south: c.south, west: c.west };
        });
        setCardStats(stats);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const updateCardStat = (cardId, dir, value) => {
    setCardStats(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], [dir]: parseInt(value) || 0 }
    }));
  };

  const updateOdd = (rarity, weight) => {
    setPackOdds(prev => prev.map(o => o.rarity === rarity ? { ...o, weight: parseFloat(weight) || 0 } : o));
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveGameConfig(configId, {
        standard_pack_cost: standardPackCost,
        standard_pack_size: standardPackSize,
        faction_pack_cost: factionPackCost,
        pack_odds: packOdds,
        card_overrides: cardStats,
      });
      setSavedMsg('Saved successfully!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) {
      setSavedMsg('Error: ' + e.message);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  );

  const filteredCards = ALL_CARDS.filter(c =>
    (factionFilter === 'all' || c.faction === factionFilter) &&
    (search === '' || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-heading text-xl text-amber-200">Admin Dashboard</h1>
        <Button onClick={save} disabled={saving} className="ml-auto bg-amber-600 hover:bg-amber-500 text-black">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save Changes
        </Button>
      </div>

      {savedMsg && <p className="text-sm text-emerald-400 mb-4">{savedMsg}</p>}

      <Tabs defaultValue="packs" className="max-w-3xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="packs">Pack Settings</TabsTrigger>
          <TabsTrigger value="cards">Card Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="packs" className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4 space-y-4">
            <h3 className="font-heading text-amber-200">Standard Pack</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Cost (coins)</label>
                <Input type="number" value={standardPackCost} onChange={e => setStandardPackCost(parseInt(e.target.value) || 0)} className="bg-slate-900 border-amber-900/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Cards per pack</label>
                <Input type="number" value={standardPackSize} onChange={e => setStandardPackSize(parseInt(e.target.value) || 0)} className="bg-slate-900 border-amber-900/30" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4 space-y-4">
            <h3 className="font-heading text-amber-200">Faction Packs</h3>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Cost per faction pack (coins)</label>
              <Input type="number" value={factionPackCost} onChange={e => setFactionPackCost(parseInt(e.target.value) || 0)} className="bg-slate-900 border-amber-900/30" />
            </div>
            <p className="text-xs text-muted-foreground">Each faction pack awards 1 card from that faction.</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4 space-y-4">
            <h3 className="font-heading text-amber-200">Pack Odds (weights)</h3>
            <p className="text-xs text-muted-foreground">Weights are relative. Total doesn't need to be 100.</p>
            <div className="space-y-2">
              {packOdds.map(odd => (
                <div key={odd.rarity} className="flex items-center gap-3">
                  <span className="text-sm flex-1 font-medium" style={{ color: RARITY_CONFIG[odd.rarity]?.color }}>{odd.rarity}</span>
                  <Input type="number" step="0.1" value={odd.weight} onChange={e => updateOdd(odd.rarity, e.target.value)} className="bg-slate-900 border-amber-900/30 w-28" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Search cards..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border-amber-900/30" />
            <select value={factionFilter} onChange={e => setFactionFilter(e.target.value)} className="bg-slate-900 border border-amber-900/30 rounded-md px-3 text-sm">
              <option value="all">All Factions</option>
              {FACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filteredCards.map(card => (
              <div key={card.card_id} className="flex items-center gap-2 bg-slate-800/30 rounded-lg border border-slate-700/20 p-2">
                <span className="text-lg">{FACTION_CONFIG[card.faction]?.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-100 truncate">{card.name}</p>
                  <p className="text-xs text-muted-foreground">{card.faction} · {card.rarity}</p>
                </div>
                {['north', 'east', 'south', 'west'].map(dir => (
                  <div key={dir} className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground uppercase">{dir[0]}</span>
                    <Input type="number" value={cardStats[card.card_id]?.[dir] ?? 0} onChange={e => updateCardStat(card.card_id, dir, e.target.value)} className="bg-slate-900 border-amber-900/30 w-14 h-8 text-center px-1" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}