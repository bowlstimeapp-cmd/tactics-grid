import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp, TrendingDown, AlertTriangle, Swords, Layers, Target, BookOpen, Star } from 'lucide-react';
import {
  BUDGET_TARGETS, BUDGET_EXPLANATION, CARD_ANALYSES, COMBINATIONS, META,
  ADJUSTMENTS, SUMMARY, RARITY_STATS,
} from '@/lib/balanceReportData';
import { RARITY_CONFIG, FACTION_CONFIG } from '@/lib/gameData';

const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

function ScoreCell({ value }) {
  const color = value >= 8 ? 'text-emerald-400' : value >= 6 ? 'text-amber-400' : value >= 4 ? 'text-orange-400' : 'text-red-400';
  return <span className={`font-bold ${color}`}>{value}</span>;
}

function BudgetBar({ ratio }) {
  const color = ratio > 115 ? 'bg-red-500' : ratio > 105 ? 'bg-amber-500' : ratio > 80 ? 'bg-emerald-500' : 'bg-orange-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, ratio)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-10 text-right">{ratio}%</span>
    </div>
  );
}

function RatingBadge({ rating }) {
  const colors = {
    'Fair': 'bg-green-600', 'Strong': 'bg-blue-600', 'Very Strong': 'bg-purple-600',
    'Potentially Overpowered': 'bg-red-600', 'Game Breaking': 'bg-red-800',
  };
  return <Badge className={`${colors[rating] || 'bg-slate-600'} text-white`}>{rating}</Badge>;
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-amber-900/30">
        <CardHeader>
          <CardTitle className="font-heading text-amber-200 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Power Budget Methodology
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{BUDGET_EXPLANATION}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
            {Object.entries(BUDGET_TARGETS).map(([rarity, target]) => (
              <div key={rarity} className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{rarity}</div>
                <div className="text-2xl font-heading font-bold" style={{ color: RARITY_CONFIG[rarity]?.color }}>{target}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-amber-900/30">
        <CardHeader>
          <CardTitle className="font-heading text-amber-200 flex items-center gap-2">
            <Layers className="w-5 h-5" /> Rarity Aggregate Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(RARITY_STATS).map(([rarity, stats]) => (
              <div key={rarity} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: RARITY_CONFIG[rarity]?.color }}>{rarity}</span>
                    <span className="text-xs text-muted-foreground">({stats.count} cards)</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Avg Budget: <span className="text-amber-400 font-bold">{stats.avgBudget}</span> / {stats.target}</span>
                    <span>Avg Overall: <span className="text-amber-400 font-bold">{stats.avgOverall}</span>/10</span>
                    <span className="text-red-400">↑{stats.overBudget} over</span>
                    <span className="text-orange-400">↓{stats.underBudget} under</span>
                  </div>
                </div>
                <BudgetBar ratio={stats.avgRatio} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-amber-900/30">
          <CardHeader>
            <CardTitle className="font-heading text-amber-200 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Most Balanced: {SUMMARY.mostBalancedRarity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{SUMMARY.mostBalancedRarityReason}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-red-900/30">
          <CardHeader>
            <CardTitle className="font-heading text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Least Balanced: {SUMMARY.leastBalancedRarity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{SUMMARY.leastBalancedRarityReason}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CardsTab() {
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('overall');

  const filtered = useMemo(() => {
    let cards;
    if (filter === 'All') cards = [...CARD_ANALYSES];
    else if (filter === 'Normal') cards = CARD_ANALYSES.filter(c => c.rarity === 'Common' || c.rarity === 'Uncommon');
    else cards = CARD_ANALYSES.filter(c => c.rarity === filter);
    return cards.sort((a, b) => {
      if (sort === 'overall') return b.scores.overall - a.scores.overall;
      if (sort === 'budget') return b.powerBudget - a.powerBudget;
      if (sort === 'ratio') return b.budgetRatio - a.budgetRatio;
      if (sort === 'total') return b.total - a.total;
      return 0;
    });
  }, [filter, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Normal', 'Rare', 'Epic', 'Legendary'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          {['overall', 'budget', 'ratio', 'total'].map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-2 py-1 rounded text-xs ${sort === s ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'overall' ? 'Overall' : s === 'budget' ? 'Budget' : s === 'ratio' ? 'Ratio' : 'Stat Total'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="bg-secondary/80 sticky top-0">
            <tr className="text-left">
              <th className="px-2 py-2 font-medium text-muted-foreground">Card</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center">N</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center">E</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center">S</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center">W</th>
              <th className="px-2 py-2 font-medium text-muted-foreground">Passive</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center" title="Raw Power">RP</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center" title="Board Control">BC</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center" title="Consistency">CN</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center" title="Flexibility">FL</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center" title="Synergy">SY</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center" title="Counterplay">CP</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center" title="Complexity">CX</th>
              <th className="px-1 py-2 font-medium text-muted-foreground text-center" title="Overall">⭐</th>
              <th className="px-2 py-2 font-medium text-muted-foreground text-center">Budget</th>
              <th className="px-2 py-2 font-medium text-muted-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.card_id} className="border-t border-border hover:bg-secondary/30">
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span>{FACTION_CONFIG[c.faction]?.icon}</span>
                    <div>
                      <div className="font-medium text-foreground whitespace-nowrap">{c.name}</div>
                      <div className="text-[10px]" style={{ color: RARITY_CONFIG[c.rarity]?.color }}>{c.rarity}</div>
                    </div>
                  </div>
                </td>
                <td className="px-1 py-1.5 text-center text-amber-300 font-mono">{c.north}</td>
                <td className="px-1 py-1.5 text-center text-amber-300 font-mono">{c.east}</td>
                <td className="px-1 py-1.5 text-center text-amber-300 font-mono">{c.south}</td>
                <td className="px-1 py-1.5 text-center text-amber-300 font-mono">{c.west}</td>
                <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap max-w-[120px] truncate" title={c.passive_desc}>{c.passive_name}</td>
                <td className="px-1 py-1.5 text-center"><ScoreCell value={c.scores.rawPower} /></td>
                <td className="px-1 py-1.5 text-center"><ScoreCell value={c.scores.boardControl} /></td>
                <td className="px-1 py-1.5 text-center"><ScoreCell value={c.scores.consistency} /></td>
                <td className="px-1 py-1.5 text-center"><ScoreCell value={c.scores.flexibility} /></td>
                <td className="px-1 py-1.5 text-center"><ScoreCell value={c.scores.synergy} /></td>
                <td className="px-1 py-1.5 text-center"><ScoreCell value={c.scores.counterplay} /></td>
                <td className="px-1 py-1.5 text-center"><ScoreCell value={c.scores.complexity} /></td>
                <td className="px-1 py-1.5 text-center"><ScoreCell value={c.scores.overall} /></td>
                <td className="px-2 py-1.5 min-w-[80px]"><BudgetBar ratio={c.budgetRatio} /></td>
                <td className="px-2 py-1.5 text-[10px] text-amber-400/70 max-w-[200px]">{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">RP=Raw Power · BC=Board Control · CN=Consistency · FL=Flexibility · SY=Synergy · CP=Counterplay · CX=Complexity · ⭐=Overall</p>
    </div>
  );
}

function CombinationsTab() {
  return (
    <div className="space-y-4">
      {COMBINATIONS.map((combo, i) => (
        <Card key={i} className="bg-card border-amber-900/30">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="font-heading text-amber-200 text-base">{combo.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{combo.cards.join(' + ')} ({combo.size} cards)</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <RatingBadge rating={combo.rating} />
                <Badge variant="outline" className="text-amber-400 border-amber-500/30">Synergy: {combo.synergy}/10</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-foreground"><span className="text-muted-foreground font-medium">Interaction: </span>{combo.interaction}</p>
            <p className="text-foreground"><span className="text-muted-foreground font-medium">Feedback Loop: </span>{combo.feedbackLoop}</p>
            <p className="text-foreground"><span className="text-muted-foreground font-medium">Infinite? </span>{combo.infinite ? '⚠️ Yes' : 'No'}</p>
            <div className="bg-red-950/30 border border-red-900/30 rounded-md p-2 mt-2">
              <p className="text-xs text-red-300"><span className="font-medium">Why it's strong: </span>{combo.why}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MetaTab() {
  const sections = [
    { title: 'Auto-Includes', icon: Star, data: META.autoIncludes, color: 'text-amber-400' },
    { title: 'Trap Cards', icon: AlertTriangle, data: META.trapCards, color: 'text-red-400' },
    { title: 'Combo Pieces', icon: Layers, data: META.comboPieces, color: 'text-blue-400' },
    { title: 'Win-More Cards', icon: TrendingUp, data: META.winMore, color: 'text-purple-400' },
    { title: 'Meta-Defining', icon: Target, data: META.metaDefining, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-4">
      {sections.map(sec => {
        const Icon = sec.icon;
        return (
          <Card key={sec.title} className="bg-card border-amber-900/30">
            <CardHeader>
              <CardTitle className={`font-heading text-base flex items-center gap-2 ${sec.color}`}>
                <Icon className="w-4 h-4" /> {sec.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sec.data.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground min-w-[120px]">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.reason}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AdjustmentsTab() {
  const priorityColors = {
    Critical: 'border-red-600 bg-red-950/30',
    High: 'border-orange-600 bg-orange-950/30',
    Medium: 'border-amber-600 bg-amber-950/20',
    Low: 'border-blue-600 bg-blue-950/20',
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-amber-900/30">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            Each adjustment suggests the <span className="text-amber-400">smallest possible change</span> to address the balance issue.
            Avoid redesigning cards unless absolutely necessary.
          </p>
        </CardContent>
      </Card>
      {ADJUSTMENTS.map((adj, i) => (
        <Card key={i} className={`bg-card border-l-4 ${priorityColors[adj.priority] || ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-heading text-sm text-amber-200">{adj.card}</CardTitle>
              <Badge variant={adj.priority === 'Critical' ? 'destructive' : 'outline'}>{adj.priority}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground font-medium">Issue: </span><span className="text-foreground">{adj.issue}</span></p>
            <p><span className="text-emerald-400 font-medium">Fix: </span><span className="text-foreground">{adj.fix}</span></p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SummaryTab() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-emerald-900/30">
          <CardHeader>
            <CardTitle className="font-heading text-emerald-300 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Top 10 Strongest Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {SUMMARY.topStrongest.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-foreground flex-1">{c.name}</span>
                  <span className="text-xs" style={{ color: RARITY_CONFIG[c.rarity]?.color }}>{c.rarity}</span>
                  <span className="text-amber-400 font-bold">{c.overall}/10</span>
                  <span className="text-xs text-muted-foreground">PB:{c.budget}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-red-900/30">
          <CardHeader>
            <CardTitle className="font-heading text-red-300 text-base flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Top 10 Weakest Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {SUMMARY.topWeakest.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-foreground flex-1">{c.name}</span>
                  <span className="text-xs" style={{ color: RARITY_CONFIG[c.rarity]?.color }}>{c.rarity}</span>
                  <span className="text-amber-400 font-bold">{c.overall}/10</span>
                  <span className="text-xs text-muted-foreground">PB:{c.budget}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-amber-900/30">
        <CardHeader>
          <CardTitle className="font-heading text-amber-200 text-base flex items-center gap-2">
            <Swords className="w-4 h-4" /> Top 10 Strongest Combinations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {SUMMARY.topCombos.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-5">{i + 1}.</span>
                <span className="text-foreground flex-1">{c.name}</span>
                <RatingBadge rating={c.rating} />
                <span className="text-amber-400 font-bold">{c.synergy}/10</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-red-900/30">
        <CardHeader>
          <CardTitle className="font-heading text-red-300 text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Biggest Balance Concerns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SUMMARY.biggestConcerns.map((concern, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-400 mt-0.5">⚠</span>
                <span className="text-foreground">{concern}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-emerald-900/30">
        <CardHeader>
          <CardTitle className="font-heading text-emerald-300 text-base flex items-center gap-2">
            <Shield className="w-4 h-4" /> Recommendations Before Playtesting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SUMMARY.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span className="text-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BalanceReport() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-card border-red-900/40 max-w-md text-center">
          <CardContent className="pt-6 space-y-3">
            <Shield className="w-12 h-12 mx-auto text-red-400/60" />
            <h2 className="font-heading text-xl text-red-300">Access Denied</h2>
            <p className="text-sm text-muted-foreground">This balance report is restricted to platform administrators only.</p>
            <button onClick={() => navigate('/')} className="text-sm text-amber-400 hover:underline">Return to Home</button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="font-heading text-2xl md:text-3xl text-amber-200">Balance Report</h1>
            <p className="text-xs text-muted-foreground">Comprehensive card game balance analysis · Admin only</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/50 p-1">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="cards" className="text-xs">Card Analysis ({CARD_ANALYSES.length})</TabsTrigger>
            <TabsTrigger value="combos" className="text-xs">Combinations ({COMBINATIONS.length})</TabsTrigger>
            <TabsTrigger value="meta" className="text-xs">Meta Analysis</TabsTrigger>
            <TabsTrigger value="adjustments" className="text-xs">Adjustments ({ADJUSTMENTS.length})</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
          <TabsContent value="cards" className="mt-4"><CardsTab /></TabsContent>
          <TabsContent value="combos" className="mt-4"><CombinationsTab /></TabsContent>
          <TabsContent value="meta" className="mt-4"><MetaTab /></TabsContent>
          <TabsContent value="adjustments" className="mt-4"><AdjustmentsTab /></TabsContent>
          <TabsContent value="summary" className="mt-4"><SummaryTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}