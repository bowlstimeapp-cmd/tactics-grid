import React from 'react';
import { Swords, Flame, PawPrint, Orbit, Cog, Ghost, Crosshair, Skull } from 'lucide-react';
import { FACTION_CONFIG } from '@/lib/gameData';

const ICON_MAP = {
  Knights: Swords,
  Dragons: Flame,
  Beasts: PawPrint,
  Mages: Orbit,
  Machines: Cog,
  Spirits: Ghost,
  Assassins: Crosshair,
  Undead: Skull,
};

export default function FactionIcon({ faction, size = 16, className = '', strokeWidth = 2 }) {
  const Icon = ICON_MAP[faction];
  if (!Icon) return null;
  const color = FACTION_CONFIG[faction]?.color || '#ffffff';
  return <Icon size={size} strokeWidth={strokeWidth} className={className} style={{ color }} />;
}