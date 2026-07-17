import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { computeMatchSummary } from '@/lib/matchSummary';

export default function PvpGameOverModal({ open, gameState, winner, myPlayerNum, eloResult, onGoHome }) {
  if (!gameState && !eloResult) return null;

  const resolvedWinner = winner ?? gameState?.winner ?? 0;
  const isWin = resolvedWinner === myPlayerNum;
  const isDraw = resolvedWinner === 0;

  const myScore = gameState?.scores?.[myPlayerNum] ?? 0;
  const oppScore = gameState?.scores?.[myPlayerNum === 1 ? 2 : 1] ?? 0;

  const myEloBefore = eloResult ? (myPlayerNum === 1 ? eloResult.player1_elo_before : eloResult.player2_elo_before) : null;
  const myEloAfter = eloResult ? (myPlayerNum === 1 ? eloResult.player1_elo_after : eloResult.player2_elo_after) : null;
  const eloChange = (myEloBefore != null && myEloAfter != null) ? myEloAfter - myEloBefore : null;

  return (
    <Dialog open={open}>
      <DialogContent className="bg-slate-900 border-amber-900/30 text-center max-w-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 py-4"
        >
          <div className="text-5xl">
            {isWin ? '🏆' : isDraw ? '🤝' : '💀'}
          </div>
          <h2 className="font-heading text-2xl text-amber-200">
            {isWin ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
          </h2>

          {gameState && (
            <div className="flex justify-center gap-8 text-lg">
              <div className="text-center">
                <div className="text-blue-400 font-bold text-2xl">{myScore}</div>
                <div className="text-xs text-muted-foreground">You</div>
              </div>
              <div className="text-muted-foreground self-center">vs</div>
              <div className="text-center">
                <div className="text-red-400 font-bold text-2xl">{oppScore}</div>
                <div className="text-xs text-muted-foreground">Opponent</div>
              </div>
            </div>
          )}

          {eloResult && eloChange != null && (
            <div className="bg-slate-800/60 rounded-lg p-3 space-y-1">
              <p className="text-xs text-amber-400 font-heading">ELO Rating</p>
              <div className="flex justify-center items-center gap-3">
                <span className="text-sm text-muted-foreground">{myEloBefore}</span>
                <span className={`text-sm font-bold ${eloChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {eloChange >= 0 ? '+' : ''}{eloChange}
                </span>
                <span className="text-sm text-amber-300">{myEloAfter}</span>
              </div>
            </div>
          )}

          {(() => {
            const summary = computeMatchSummary(gameState?.moves);
            if (!summary) return null;
            return (
              <div className="bg-slate-800/60 rounded-lg p-3 space-y-2 text-left">
                <p className="text-xs text-amber-400 font-heading text-center">Match Highlights</p>
                {summary.biggestCapture && summary.biggestCapture.count > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-lg">💥</span>
                    <span className="text-amber-100">Biggest capture: <b>{summary.biggestCapture.card_name}</b> flipped {summary.biggestCapture.count} card{summary.biggestCapture.count > 1 ? 's' : ''}</span>
                  </div>
                )}
                {summary.mvpCard && summary.mvpCard.totalCaptures > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-lg">{summary.mvpCard.passive_icon || '⭐'}</span>
                    <span className="text-amber-100">MVP: <b>{summary.mvpCard.card_name}</b> ({summary.mvpCard.totalCaptures} captures)</span>
                  </div>
                )}
                {summary.keyChain && summary.keyChain.chain_order > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-lg">⚡</span>
                    <span className="text-amber-100"><b>{summary.keyChain.card_name}</b> triggered a {summary.keyChain.chain_order}-chain reaction</span>
                  </div>
                )}
              </div>
            );
          })()}

          <Button onClick={onGoHome} className="bg-amber-600 hover:bg-amber-500 text-black font-heading w-full">
            Back to Home
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}