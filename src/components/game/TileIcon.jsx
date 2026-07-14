import React from 'react';
import { Shield, Flame, Trees, Sparkles, Hammer, Gem, Moon, Cross, Zap, Orbit, Feather } from 'lucide-react';

const TILE_ICON_MAP = {
  battlement: Shield,
  lair: Flame,
  wild: Trees,
  forest: Trees,
  arcane: Sparkles,
  forge: Hammer,
  shrine: Gem,
  shadow: Moon,
  crypt: Cross,
  power: Zap,
  portal: Orbit,
  sanctuary: Feather,
};

// Subtle background gradients for tile types
export const TILE_BG = {
  battlement: 'from-blue-900/30 to-blue-800/10',
  lair: 'from-red-900/30 to-orange-900/10',
  wild: 'from-green-900/30 to-emerald-900/10',
  forest: 'from-green-900/30 to-emerald-900/10',
  arcane: 'from-purple-900/30 to-violet-900/10',
  forge: 'from-amber-900/30 to-yellow-900/10',
  shrine: 'from-cyan-900/30 to-teal-900/10',
  shadow: 'from-slate-800/40 to-slate-900/20',
  crypt: 'from-violet-900/30 to-purple-900/10',
  power: 'from-amber-700/30 to-yellow-700/10',
  portal: 'from-cyan-700/25 to-blue-700/10',
  sanctuary: 'from-slate-300/10 to-white/5',
};

export function getTileEffect(tile) {
  if (!tile) return null;
  if (tile.mod) return `+${tile.mod.north || 0} all sides`;
  if (tile.factionBonus) {
    const mod = tile.factionBonus.mod || 0;
    const phase = tile.factionBonus.phase;
    return `${tile.factionBonus.faction} +${mod}${phase ? ` on ${phase}` : ''}`;
  }
  if (tile.doublePassive) return 'Passive abilities ×2';
  if (tile.noBuff) return 'No buffs/debuffs';
  return 'Special';
}

export default function TileIcon({ tile, size = 16, className = '', strokeWidth = 2 }) {
  if (!tile) return null;
  const Icon = TILE_ICON_MAP[tile.type];
  if (!Icon) return <span className={className}>{tile.icon}</span>;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}