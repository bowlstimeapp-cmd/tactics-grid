import React from 'react';
import GameCard from './GameCard';
import { getEffectiveStats } from '@/lib/gameEngine';

export default function GameBoard({ gameState, onCellClick, selectedCard, flippingCells, myPlayerNum = 1 }) {
  const { board, tiles, turn } = gameState;

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-amber-900/30 shadow-2xl">
      {[0, 1, 2].map(row =>
        [0, 1, 2].map(col => {
          const card = board[row][col];
          const tileIdx = row * 3 + col;
          const tile = tiles?.[tileIdx];
          const boardWithTiles = board;
          if (!boardWithTiles._tiles) {
            Object.defineProperty(boardWithTiles, '_tiles', { value: tiles, writable: true, enumerable: false, configurable: true });
          }
          const isJustPlaced = card && card.placedTurn === turn - 1;
          const effectiveStats = card ? getEffectiveStats(card, [row, col], boardWithTiles, turn, isJustPlaced ? 'attack' : 'defend') : null;
          const cellKey = `${row}-${col}`;
          const isFlipping = flippingCells?.has(cellKey);

          return (
            <div
              key={`${row}-${col}`}
              onClick={() => onCellClick(row, col)}
              className={`
                relative aspect-[3/4] rounded-lg border transition-all duration-200 cursor-pointer
                min-w-[72px] min-h-[96px] sm:min-w-[88px] sm:min-h-[116px]
                ${card
                  ? 'border-transparent'
                  : selectedCard !== null
                    ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60'
                    : 'border-slate-700/40 bg-slate-800/30'
                }
              `}
            >
              {/* Tile indicator */}
              {tile && !card && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
                  <span className="text-lg">{tile.icon}</span>
                  <span className="text-[8px] text-amber-400/70 mt-0.5">{tile.label}</span>
                </div>
              )}

              {/* Tile subtle background when card is on it */}
              {tile && card && (
                <div className="absolute top-0.5 right-0.5 text-[8px] z-10 opacity-50">{tile.icon}</div>
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
  );
}