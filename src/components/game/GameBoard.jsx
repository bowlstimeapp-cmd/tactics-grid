import React from 'react';
import GameCard from './GameCard';
import TileIcon, { TILE_BG } from './TileIcon';
import TileLegend from './TileLegend';
import { getEffectiveStats } from '@/lib/gameEngine';

export default function GameBoard({ gameState, onCellClick, selectedTile, flippingCells, myPlayerNum = 1 }) {
  const { board, tiles, turn } = gameState;

  return (
    <div>
      <TileLegend tiles={tiles} />
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-amber-900/30 shadow-2xl">
        {[0, 1, 2].map(row =>
          [0, 1, 2].map(col => {
            const card = board[row][col];
            const tileIdx = row * 3 + col;
            const tile = tiles?.[tileIdx];
            const isJustPlaced = card && card.placedTurn === turn - 1;
            const effectiveStats = card ? getEffectiveStats(card, [row, col], board, turn, isJustPlaced ? 'attack' : 'defend') : null;
            const cellKey = `${row}-${col}`;
            const isFlipping = flippingCells?.has(cellKey);
            const tileBgClass = tile ? `bg-gradient-to-br ${TILE_BG[tile.type] || ''}` : '';

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => onCellClick(row, col)}
                className={`
                  relative aspect-[3/4] rounded-lg border transition-all duration-200 cursor-pointer
                  min-w-[72px] min-h-[96px] sm:min-w-[88px] sm:min-h-[116px]
                  ${card
                    ? 'border-transparent'
                    : selectedTile && selectedTile.row === row && selectedTile.col === col
                      ? 'border-amber-500 ring-2 ring-amber-400/60 bg-amber-500/15'
                      : 'border-slate-700/40 bg-slate-800/30 hover:border-slate-600/50'
                  }
                `}
              >
                {/* Tile background tint */}
                {tile && (
                  <div className={`absolute inset-0 rounded-lg pointer-events-none ${tileBgClass}`} />
                )}

                {/* Tile indicator */}
                {tile && !card && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
                    <TileIcon tile={tile} size={20} />
                    <span className="text-[8px] text-amber-400/70 mt-0.5">{tile.label}</span>
                  </div>
                )}

                {/* Tile icon when card is on it */}
                {tile && card && (
                  <div className="absolute top-0.5 right-0.5 z-10 opacity-50">
                    <TileIcon tile={tile} size={10} />
                  </div>
                )}

                {card && (
                  <GameCard
                    card={card}
                    size="md"
                    effectiveStats={effectiveStats}
                    isFlipping={isFlipping}
                    myPlayerNum={myPlayerNum}
                    className="w-full h-full"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}