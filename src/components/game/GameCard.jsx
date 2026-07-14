import React from 'react';
import { Swords } from 'lucide-react';
import { RARITY_CONFIG, FACTION_CONFIG, PASSIVES } from '@/lib/gameData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FactionIcon from './FactionIcon';

const SIZES = {
  sm: 'w-16 h-20 text-[10px]',
  md: 'w-24 h-32 text-xs',
  lg: 'w-32 h-44 text-sm',
  xl: 'w-40 h-56 text-base',
  '2xl': 'w-48 h-72 text-base',
};

const STAT_SIZES = {
  sm: 'text-[8px] min-w-[14px] h-3.5 px-0.5',
  md: 'text-[10px] min-w-[18px] h-4 px-1',
  lg: 'text-xs min-w-[22px] h-5 px-1',
  xl: 'text-sm min-w-[26px] h-6 px-1',
  '2xl': 'text-base min-w-[30px] h-7 px-1',
};

export default function GameCard({ card, size = 'md', onClick, selected, showStats = true, effectiveStats, isFlipping, myPlayerNum = 1, faceDown = false, displayMode = 'effective', className = '' }) {
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
          <Swords size={28} className="opacity-30 text-amber-700" />
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

    if (displayMode === 'baseWithMods') {
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
    }

    // effective mode — show total value, colored by mod
    const totalVal = es ? es[dir] : card[dir];
    const colorClass = mod > 0 ? 'text-emerald-400' : mod < 0 ? 'text-red-400' : '';
    return (
      <div className={`absolute ${posClass} ${STAT_SIZES[size]} flex items-center justify-center rounded-full bg-black/60 font-bold ${colorClass}`}>
        {totalVal}
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
            {/* Artwork area */}
            {card.artwork_url ? (
              <div className="absolute inset-0 overflow-hidden">
                <img src={card.artwork_url} alt={card.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <FactionIcon faction={card.faction} size={32} />
              </div>
            )}

            {/* Rarity top bar */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: rarity.color }} />

            {/* Faction type label — embossed gold plate */}
            <div
              className="absolute top-1 left-1"
              style={{
                background: 'linear-gradient(145deg, #D4AF37 0%, #B8860B 45%, #8B4513 55%, #B8860B 100%)',
                borderRadius: '3px',
                padding: '1px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.7), 0 0.5px 0 rgba(255,220,120,0.4) inset',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(180deg, #2E1A0E 0%, #3B2314 50%, #2E1A0E 100%)',
                  borderRadius: '2px',
                  boxShadow: '0 1px 1.5px rgba(0,0,0,0.5) inset, 0 0.5px 0 rgba(255,220,120,0.15) inset',
                  padding: size === 'sm' ? '1px 3px' : size === 'md' ? '1px 4px' : size === 'lg' ? '1.5px 5px' : size === 'xl' ? '2px 6px' : '2px 7px',
                }}
              >
                <span
                  className={`font-heading leading-none tracking-wider ${size === 'sm' ? 'text-[5px]' : size === 'md' ? 'text-[6px]' : size === 'lg' ? 'text-[7px]' : size === 'xl' ? 'text-[8px]' : 'text-[9px]'}`}
                  style={{
                    background: 'linear-gradient(180deg, #F4E075 0%, #D4AF37 50%, #B8860B 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 2px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(0 0.5px 0 rgba(60,30,10,0.9))',
                  }}
                >
                  {card.faction.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Stats — top-right corner, below rarity bar */}
            {showStats && (
              <div className="absolute top-1.5 right-0.5 pointer-events-none">
                <div className="relative" style={{ width: size === 'sm' ? 28 : size === 'md' ? 36 : size === 'lg' ? 40 : size === 'xl' ? 44 : 52, height: size === 'sm' ? 28 : size === 'md' ? 36 : size === 'lg' ? 40 : size === 'xl' ? 44 : 52 }}>
                  {renderStat('north', 'top-0 left-1/2 -translate-x-1/2')}
                  {renderStat('south', 'bottom-0 left-1/2 -translate-x-1/2')}
                  {renderStat('west', 'top-1/2 left-0 -translate-y-1/2')}
                  {renderStat('east', 'top-1/2 right-0 -translate-y-1/2')}
                </div>
              </div>
            )}

            {/* Bottom area: card name + ability caption */}
            <div className="absolute bottom-0 left-0 right-0">
              {/* Card name — above caption, increased size */}
              {size !== 'sm' && (
                <div className="px-1 pb-0.5 bg-gradient-to-t from-black/90 to-transparent">
                  <p className={`font-heading truncate text-amber-100 ${size === 'md' ? 'text-[9px]' : size === 'lg' ? 'text-[10px]' : size === 'xl' ? 'text-[11px]' : 'text-[13px]'}`}>{card.name}</p>
                </div>
              )}
              {/* Ability caption box — reduced by ~1/3 */}
              {passive && (
                <div className="bg-gradient-to-t from-black/95 via-black/85 to-black/60 border-t border-amber-500/20 px-1 pt-0.5 pb-0.5">
                  <div className="flex items-center gap-0.5">
                    <span className={size === 'sm' ? 'text-[6px] leading-none' : size === 'md' ? 'text-[7px] leading-none' : size === '2xl' ? 'text-[10px] leading-none' : 'text-[8px] leading-none'}>{passive.icon}</span>
                    <span className={`font-heading leading-tight truncate text-amber-200/90 ${size === 'sm' ? 'text-[5px]' : size === 'md' ? 'text-[6px]' : size === 'lg' ? 'text-[7px]' : size === 'xl' ? 'text-[7px]' : 'text-[8px]'}`}>{passive.name}</span>
                  </div>
                  {size !== 'sm' && (
                    <p className={`${size === 'md' ? 'text-[6px]' : size === 'lg' ? 'text-[6px]' : size === 'xl' ? 'text-[7px]' : 'text-[8px]'} leading-tight text-slate-300/80 line-clamp-2`}>{passive.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Holographic effect for Legendary cards */}
            {card.rarity === 'Legendary' && (
              <div className="absolute inset-0 holo-effect pointer-events-none" />
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