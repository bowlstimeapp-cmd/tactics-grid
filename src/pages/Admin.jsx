import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ALL_CARDS } from '@/lib/cardDatabase';
import { FACTION_CONFIG, RARITY_CONFIG, ACHIEVEMENTS, PASSIVE_LIST } from '@/lib/gameData';
import { loadGameConfig, saveGameConfig } from '@/lib/gameConfig';
import { REWARD_PACK_OPTIONS, REWARD_LABELS } from '@/lib/packLogic';

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
  const [guaranteedRareCost, setGuaranteedRareCost] = useState(300);
  const [guaranteedEpicCost, setGuaranteedEpicCost] = useState(600);
  const [packOdds, setPackOdds] = useState([]);
  const [cardStats, setCardStats] = useState({});
  const [achievementRewards, setAchievementRewards] = useState({});
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
        setGuaranteedRareCost(cfg.guaranteed_rare_cost ?? 300);
        setGuaranteedEpicCost(cfg.guaranteed_epic_cost ?? 600);
        setPackOdds(cfg.pack_odds || []);
        setAchievementRewards(cfg.achievement_rewards || {});
        const stats = {};
        ALL_CARDS.forEach(c => {
          stats[c.card_id] = { north: c.north, east: c.east, south: c.south, west: c.west, passive_id: c.passive_id };
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

  const updateCardPassive = (cardId, passiveId) => {
    setCardStats(prev => ({
      ...prev,
      [cardId]: { ...prev[cardId], passive_id: passiveId }
    }));
  };

  const updateOdd = (rarity, weight) => {
    setPackOdds(prev => prev.map(o => o.rarity === rarity ? { ...o, weight: parseFloat(weight) || 0 } : o));
  };

  const updateAchievementReward = (achId, packType) => {
    setAchievementRewards(prev => ({ ...prev, [achId]: packType }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveGameConfig(configId, {
        standard_pack_cost: standardPackCost,
        standard_pack_size: standardPackSize,
        faction_pack_cost: factionPackCost,
        guaranteed_rare_cost: guaranteedRareCost,
        guaranteed_epic_cost: guaranteedEpicCost,
        pack_odds: packOdds,
        card_overrides: cardStats,
        achievement_rewards: achievementRewards,
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

      <Tabs defaultValue="packs" className="max-w-5xl mx-auto">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="packs">Pack Settings</TabsTrigger>
          <TabsTrigger value="achievements">Achievement Rewards</TabsTrigger>
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
            <h3 className="font-heading text-amber-200">Guaranteed Packs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1" style={{ color: RARITY_CONFIG.Rare.color }}>Guaranteed Rare cost</label>
                <Input type="number" value={guaranteedRareCost} onChange={e => setGuaranteedRareCost(parseInt(e.target.value) || 0)} className="bg-slate-900 border-amber-900/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1" style={{ color: RARITY_CONFIG.Epic.color }}>Guaranteed Epic cost</label>
                <Input type="number" value={guaranteedEpicCost} onChange={e => setGuaranteedEpicCost(parseInt(e.target.value) || 0)} className="bg-slate-900 border-amber-900/30" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Guaranteed packs always award 1 card of the specified rarity.</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4 space-y-4">
            <h3 className="font-heading text-amber-200">Pack Odds (weights)</h3>
            <p className="text-xs text-muted-foreground">Weights are relative. Total doesn't need to be 100. Applies to standard and faction packs.</p>
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

        <TabsContent value="achievements" className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl border border-amber-900/20 p-4 space-y-4">
            <h3 className="font-heading text-amber-200">Achievement Rewards</h3>
            <p className="text-xs text-muted-foreground">Select a booster pack to award when a player completes each achievement.</p>
            <div className="space-y-2">
              {ACHIEVEMENTS.map(ach => (
                <div key={ach.id} className="flex items-center gap-3 bg-slate-800/30 rounded-lg border border-slate-700/20 p-2.5">
                  <span className="text-xl">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-100">{ach.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{ach.description}</p>
                  </div>
                  <select
                    value={achievementRewards[ach.id] || ''}
                    onChange={e => updateAchievementReward(ach.id, e.target.value)}
                    className="bg-slate-900 border border-amber-900/30 rounded-md px-2 py-1 text-xs"
                  >
                    {REWARD_PACK_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
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
                <div className="shrink-0 w-14 h-14 rounded-md border-2 border-amber-700/40 bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center shadow-inner">
                  <span className="font-heading text-[9px] font-bold tracking-widest text-amber-300/80 text-center leading-tight px-0.5">{card.faction.toUpperCase()}</span>
                </div>
                <div className="w-28 min-w-0 shrink-0">
                  <p className="text-sm font-medium text-amber-100 truncate">{card.name}</p>
                  <p className="text-xs text-muted-foreground">{card.rarity}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-muted-foreground uppercase block mb-0.5">Bonus</label>
                  <select
                    value={cardStats[card.card_id]?.passive_id ?? 'none'}
                    onChange={e => updateCardPassive(card.card_id, e.target.value)}
                    className="bg-slate-900 border border-amber-900/30 rounded-md px-2 py-1 text-xs w-full"
                  >
                    {PASSIVE_LIST.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.description}</option>
                    ))}
                  </select>
                </div>
                {['north', 'east', 'south', 'west'].map(dir => (
                  <div key={dir} className="flex items-center gap-1 shrink-0">
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