import React from 'react';
import { RARITY_CONFIG, FACTION_CONFIG, PASSIVES } from '@/lib/gameData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SIZES = {
  sm: 'w-16 h-20 text-[10px]',
  md: 'w-24 h-32 text-xs',
  lg: 'w-32 h-44 text-sm',
  xl: 'w-40 h-56 text-base',
};

const STAT_SIZES = {
  sm: 'text-[8px] min-w-[14px] h-3.5 px-0.5',
  md: 'text-[10px] min-w-[18px] h-4 px-1',
  lg: 'text-xs min-w-[22px] h-5 px-1',
  xl: 'text-sm min-w-[26px] h-6 px-1',
};

export default function GameCard({ card, size = 'md', onClick, selected, showStats = true, effectiveStats, isFlipping, myPlayerNum = 1, faceDown = false, className = '' }) {
  if (!card) return null;

  if (faceDown) {
    return (
      <div
        onClick={onClick}
        className={`
          relative rounded-lg border-2 overflow-hidden select-none cursor-pointer
          transition-all duration-300
          ${SIZES[size]}
          ${selected ? 'ring-2 ring-amber-400 scale-105' : ''}
          ${className}
        `}
        style={{ background: 'linear-gradient(135deg, hsl(230, 15%, 14%), hsl(230, 15%, 10%))' }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-900/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl opacity-30">⚔️</span>
        </div>
      </div>
    );
  }

  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.Common;
  const faction = FACTION_CONFIG[card.faction] || {};
  const passive = PASSIVES[card.passive_id];

  const es = effectiveStats;
  const getMod = (dir) => (es && es.mods ? es.mods[dir] : 0) || 0;

  const renderStat = (dir, posClass) => {
    const mod = getMod(dir);
    return (
      <div className={`absolute ${posClass} ${STAT_SIZES[size]} flex items-center justify-center rounded-full bg-black/70 font-bold`}>
        <span className="text-amber-100 leading-none">{card[dir]}</span>
        {mod !== 0 && (
          <span className={`text-[6px] leading-none ml-px ${mod > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {mod > 0 ? '+' : ''}{mod}
          </span>
        )}
      </div>
    );
  };

  const ownerBorder = !card.owner
    ? 'border-transparent'
    : card.owner === myPlayerNum
      ? 'border-blue-500/60'
      : 'border-red-500/60';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={onClick}
            className={`
              relative rounded-lg border-2 cursor-pointer overflow-hidden
              transition-all duration-300 select-none
              ${SIZES[size]}
              ${ownerBorder}
              ${selected ? 'ring-2 ring-amber-400 scale-105 shadow-lg shadow-amber-500/30' : ''}
              ${isFlipping ? 'card-flipping' : ''}
              ${className}
            `}
            style={{
              background: `linear-gradient(135deg, hsl(230, 15%, 14%), hsl(230, 15%, 10%))`,
            }}
          >
            {/* Rarity top bar */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: rarity.color }} />

            {/* Faction icon */}
            <div className="absolute top-1 left-1 text-[10px] opacity-60">{faction.icon}</div>

            {/* Card name */}
            <div className="absolute top-1 right-1 left-5 font-heading text-[7px] leading-tight truncate text-amber-200/80">
              {size !== 'sm' && card.name}
            </div>

            {/* Artwork area */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="text-3xl">{faction.icon}</span>
            </div>

            {/* Passive icon */}
            {passive && (
              <div className="absolute bottom-1 left-1 text-[10px]">{passive.icon}</div>
            )}

            {/* Stats diamond */}
            {showStats && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative" style={{ width: size === 'sm' ? 36 : size === 'md' ? 52 : 68, height: size === 'sm' ? 36 : size === 'md' ? 52 : 68 }}>
                  {renderStat('north', 'top-0 left-1/2 -translate-x-1/2')}
                  {renderStat('south', 'bottom-0 left-1/2 -translate-x-1/2')}
                  {renderStat('west', 'top-1/2 left-0 -translate-y-1/2')}
                  {renderStat('east', 'top-1/2 right-0 -translate-y-1/2')}
                </div>
              </div>
            )}

            {/* Rarity glow */}
            {(card.rarity === 'Legendary' || card.rarity === 'Epic') && (
              <div className="absolute inset-0 card-shimmer pointer-events-none" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-900 border-amber-500/30 max-w-xs">
          <div className="space-y-1">
            <p className="font-heading text-amber-200 font-bold">{card.name}</p>
            <p className="text-xs text-muted-foreground">{card.faction} · {card.rarity}</p>
            <p className="text-xs">⬆{card.north} ➡{card.east} ⬇{card.south} ⬅{card.west}</p>
            {passive && (
              <p className="text-xs text-amber-300">{passive.icon} {passive.name}: {passive.description}</p>
            )}
            {card.flavour_text && (
              <p className="text-xs italic text-muted-foreground">{card.flavour_text}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}