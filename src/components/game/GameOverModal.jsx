import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function GameOverModal({ open, gameState, onPlayAgain, onGoHome, rewards }) {
  if (!gameState) return null;
  const { winner, scores } = gameState;

  const isWin = winner === 1;
  const isDraw = winner === 0;

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
          <div className="flex justify-center gap-8 text-lg">
            <div className="text-center">
              <div className="text-blue-400 font-bold text-2xl">{scores[1]}</div>
              <div className="text-xs text-muted-foreground">You</div>
            </div>
            <div className="text-muted-foreground self-center">vs</div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-2xl">{scores[2]}</div>
              <div className="text-xs text-muted-foreground">Opponent</div>
            </div>
          </div>

          {rewards && (
            <div className="bg-slate-800/60 rounded-lg p-3 space-y-1">
              <p className="text-xs text-amber-400 font-heading">Rewards</p>
              <div className="flex justify-center gap-4 text-sm">
                {rewards.coins > 0 && <span>🪙 {rewards.coins}</span>}
                {rewards.xp > 0 && <span>⭐ {rewards.xp} XP</span>}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={onPlayAgain} className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-heading">
              Play Again
            </Button>
            <Button onClick={onGoHome} variant="outline" className="flex-1 border-amber-900/30">
              Home
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}