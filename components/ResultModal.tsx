
import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { GameState, Room } from '../types';
import { TrophyIcon, ClipboardIcon, CheckCircleIcon } from './Icon';
import { triggerConfetti } from '../utils/confetti';
import { useSound } from '../hooks/useSound';

interface ResultModalProps {
  room: Room | null;
  playerId: string | null;
  onPlayAgain: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ room, playerId, onPlayAgain }) => {
  const { playPop } = useSound();
  const [copied, setCopied] = useState(false);

  // Calculate derived state safely at the top level
  const isWon = room?.gameState === GameState.Won;
  
  // Safe winner extraction with fallbacks - must be calculated before conditional return if used in effects
  // We default to null/false if not won to satisfy hook dependencies without errors
  const winner = isWon && room ? room.players.find(p => p.guesses.some(g => g.hits === room.settings.codeLength)) : null;
  const isPlayerWinner = winner ? winner.id === playerId : false;

  // HOOKS MUST BE CALLED UNCONDITIONALLY (Before any return statements)
  useEffect(() => {
    if (isWon && isPlayerWinner) {
      triggerConfetti();
    }
  }, [isWon, isPlayerWinner]);

  // NOW we can return null if not won
  if (!isWon || !room) return null;

  const guessCount = winner?.guesses.length ?? 0;
  const winningGuess = winner?.guesses.find(g => g.hits === room.settings.codeLength);
  const codeToDisplay = room.secretCode || winningGuess?.code || "????";

  const handleShare = async () => {
      if (!winner) return;
      
      const mode = room.gameMode === 'SINGLE' ? 'Solo' : room.gameMode === 'DUEL' ? 'Duel' : 'FFA';
      const emoji = isPlayerWinner ? '🧠' : '🤖';
      let shareText = `Crack The Code (${mode}) ${emoji}\nSolved in ${guessCount} ${guessCount === 1 ? 'guess' : 'guesses'}!\n\n`;
      
      // Generate Emoji Grid - Limit to last 6 guesses for brevity in social posts if list is long
      const guessesToShare = winner.guesses.length > 8 ? winner.guesses.slice(-8) : winner.guesses;
      
      guessesToShare.forEach(g => {
          let row = '';
          const hits = g.hits;
          const pseudos = g.pseudoHits;
          const misses = room.settings.codeLength - hits - pseudos;

          for(let i=0; i<hits; i++) row += '🟩'; // Green Square
          for(let i=0; i<pseudos; i++) row += '🟨'; // Yellow Square
          for(let i=0; i<misses; i++) row += '⬜'; // White Square
          
          shareText += row + '\n';
      });

      if (winner.guesses.length > 8) shareText += '...\n';
      
      shareText += `\nCan you beat my score?`;

      const shareData = {
          title: 'Crack The Code',
          text: shareText,
          url: window.location.origin
      };

      // Use Native Share API if available and safe
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
              await navigator.share(shareData);
              return;
          } catch (err) {
              console.log("Share cancelled or failed, falling back to clipboard", err);
          }
      }

      // Fallback to clipboard
      const clipboardText = `${shareText} Play now: ${window.location.origin}`;
      navigator.clipboard.writeText(clipboardText).then(() => {
          setCopied(true);
          playPop();
          setTimeout(() => setCopied(false), 2000);
      }).catch(err => console.error('Failed to copy:', err));
  };

  const winnerName = winner?.name || 'Unknown';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <Card className="w-full max-w-sm p-0 text-center relative overflow-hidden shadow-2xl border-2 border-secondary-accent/50 ring-4 ring-secondary-accent/20">
        
        {/* Header Background */}
        <div className="bg-secondary-accent dark:bg-primary-accent p-8 pb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 pattern-grid-lg opacity-20"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-4 animate-popIn transform hover:scale-110 transition-transform duration-500">
                    <TrophyIcon className="w-10 h-10 text-secondary-accent" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight uppercase drop-shadow-md">
                    {isPlayerWinner ? "CRACKED!" : "GAME OVER"}
                </h2>
            </div>
        </div>

        {/* Body */}
        <div className="p-6 pt-2 relative bg-light-card dark:bg-dark-card -mt-6 rounded-t-3xl">
             <p className="text-lg text-light-text dark:text-dark-text mb-4 font-medium">
              {isPlayerWinner ? "You are a certified mastermind." : `${winnerName} cracked the code.`}
            </p>
            
            <div className="flex justify-center gap-6 my-6 bg-light-bg dark:bg-dark-bg p-4 rounded-2xl border border-light-subtle-border dark:border-dark-subtle-border">
                <div className="flex flex-col items-center w-24">
                    <span className="text-4xl font-black text-secondary-accent dark:text-primary-accent">{guessCount}</span>
                    <span className="text-[10px] uppercase text-light-text/60 dark:text-dark-text/60 font-bold tracking-widest">Guesses</span>
                </div>
                <div className="w-px bg-light-subtle-border dark:bg-dark-subtle-border"></div>
                 <div className="flex flex-col items-center w-24">
                    <span className="text-4xl font-black text-secondary-accent dark:text-primary-accent tracking-wider">{codeToDisplay}</span>
                    <span className="text-[10px] uppercase text-light-text/60 dark:text-dark-text/60 font-bold tracking-widest">Code</span>
                </div>
            </div>
            
            <div className="flex flex-col gap-3">
                <Button onClick={handleShare} variant="ghost" className="w-full py-3 border-2 border-light-subtle-border dark:border-dark-subtle-border rounded-xl font-bold text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg transition-all active:scale-95">
                   {copied ? (
                       <span className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-popIn">
                           <CheckCircleIcon className="w-5 h-5" /> Copied to Clipboard
                       </span>
                   ) : (
                       <span className="flex items-center gap-2">
                           Share Result <ClipboardIcon className="w-4 h-4 opacity-70" />
                       </span>
                   )}
                </Button>
                
                <Button onClick={onPlayAgain} className="w-full py-4 text-lg shadow-lg shadow-secondary-accent/30 rounded-xl hover:translate-y-[-2px] transition-transform">
                  {room.gameMode === 'SINGLE' ? 'Play Again' : 'Back to Lobby'}
                </Button>
            </div>
        </div>
      </Card>
    </div>
  );
};
