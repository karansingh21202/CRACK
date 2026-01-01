
import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { GameState, Room } from '../types';
import { TrophyIcon, ShareIcon, CheckCircleIcon, ExitIcon, ImageIcon } from './Icon';
import { triggerConfetti } from '../utils/confetti';
import { useSound } from '../hooks/useSound';
import { ConfirmationModal } from './ConfirmationModal';
import { socketService } from '../services/socketService';
import { ShareResult } from './ShareResult';
import html2canvas from 'html2canvas';

interface ResultModalProps {
    room: Room | null;
    playerId: string | null;
    onPlayAgain: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ room, playerId, onPlayAgain }) => {
    const { playPop } = useSound();
    const [copied, setCopied] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const shareRef = React.useRef<HTMLDivElement>(null);

    // Calculate derived state safely at the top level
    const isWon = room?.gameState === GameState.Won;

    // Safe winner extraction
    // For FFA, winner is the one with highest score breakdown total
    // For others, it's the one who guessed correctly
    const winner = isWon && room ? (
        room.gameMode === 'FFA'
            ? [...room.players].sort((a, b) => (b.scoreBreakdown?.total || 0) - (a.scoreBreakdown?.total || 0))[0]
            : room.players.find(p => p.guesses.some(g => g.hits === room.settings.codeLength))
    ) : null;

    const isPlayerWinner = winner ? winner.id === playerId : false;

    // HOOKS MUST BE CALLED UNCONDITIONALLY
    useEffect(() => {
        if (isWon && isPlayerWinner) {
            triggerConfetti();
        }
    }, [isWon, isPlayerWinner]);

    if (!isWon || !room) return null;

    const guessCount = winner?.guesses.length ?? 0;
    const winningGuess = winner?.guesses.find(g => g.hits === room.settings.codeLength);

    // For Duel PVP: Get player and opponent to show both codes
    const currentPlayer = room.players.find(p => p.id === playerId);
    const opponent = room.gameMode === 'DUEL'
        ? room.players.find(p => p.id !== playerId)
        : null;

    // Determine which code to display based on game mode
    // Duel PVP: Show opponent's code (what you were trying to crack)
    // Other modes: Show room.secretCode or winning guess
    const codeToDisplay = room.gameMode === 'DUEL' && room.settings.duelModeType === 'PVP'
        ? (opponent?.secretCode || winningGuess?.code || "????")
        : (room.secretCode || winningGuess?.code || "????");

    // For Duel PVP: Also get your code (what opponent was trying to crack)
    const yourCodeInDuel = currentPlayer?.secretCode || "????";

    const winnerName = winner?.name || 'Unknown';

    const handleShare = async () => {
        if (!winner) return;
        const mode = room.gameMode === 'SINGLE' ? 'Solo' : room.gameMode === 'DUEL' ? 'Duel' : 'FFA';
        const emoji = isPlayerWinner ? '🧠' : '🤖';
        const scoreText = room.gameMode === 'FFA' && winner.scoreBreakdown ? `Score: ${winner.scoreBreakdown.total} pts` : `Solved in ${guessCount} guesses`;

        let shareText = `Crack The Code (${mode}) ${emoji}\n${scoreText}\n\n`;

        // Generate Emoji Grid (limit to last 6)
        const guessesToShare = winner.guesses.length > 8 ? winner.guesses.slice(-8) : winner.guesses;
        guessesToShare.forEach(g => {
            let row = '';
            const hits = g.hits;
            const pseudos = g.pseudoHits;
            const misses = room.settings.codeLength - hits - pseudos;
            for (let i = 0; i < hits; i++) row += '🟩';
            for (let i = 0; i < pseudos; i++) row += '🟨';
            for (let i = 0; i < misses; i++) row += '⬜';
            shareText += row + '\n';
        });
        if (winner.guesses.length > 8) shareText += '...\n';
        shareText += `\nCan you beat my score?`;

        const shareData = { title: 'Crack The Code', text: shareText, url: window.location.origin };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try { await navigator.share(shareData); return; } catch (err) { console.log("Share failed", err); }
        }

        const clipboardText = `${shareText} Play now: ${window.location.origin}`;
        navigator.clipboard.writeText(clipboardText).then(() => {
            setCopied(true);
            playPop();
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => console.error('Failed to copy:', err));
    };

    const handleImageShare = async () => {
        if (!shareRef.current || !winner) return;
        setIsGeneratingImage(true);

        try {
            // Wait a tick for render
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(shareRef.current, {
                scale: 2, // High res
                backgroundColor: '#09090b',
                logging: false,
                useCORS: true
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                // Try native share
                if (navigator.share && navigator.canShare) {
                    const file = new File([blob], 'crack-the-code-result.png', { type: 'image/png' });
                    const shareData = {
                        title: 'Crack The Code Result',
                        text: `I just cracked the code! Can you beat my score?`,
                        files: [file]
                    };
                    if (navigator.canShare(shareData)) {
                        try {
                            await navigator.share(shareData);
                            setIsGeneratingImage(false);
                            return;
                        } catch (err) {
                            console.log("Native share failed/cancelled", err);
                        }
                    }
                }

                // Fallback: Download
                const link = document.createElement('a');
                link.download = 'crack-the-code-result.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                setIsGeneratingImage(false);
                showToast("Image saved!");
            }, 'image/png');

        } catch (err) {
            console.error("Image generation failed", err);
            setIsGeneratingImage(false);
            showToast("Failed to generate image");
        }
    };

    // Helper to show toast (since we don't have direct access to showToast prop here, we'll just log or alert for now if prop missing, 
    // BUT wait, ResultModal doesn't have showToast prop. We should probably add it or just rely on button feedback.
    // For now, let's just use console.
    const showToast = (msg: string) => console.log(msg);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
            <Card className="w-full max-w-md p-0 text-center relative overflow-hidden shadow-2xl border-2 border-secondary-accent/50 ring-4 ring-secondary-accent/20 my-auto">

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
                            {isPlayerWinner ? "YOU WON!" : "YOU LOST!"}
                        </h2>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 pt-2 relative bg-light-card dark:bg-dark-card -mt-6 rounded-t-3xl">
                    <p className="text-lg text-light-text dark:text-dark-text mb-4 font-medium">
                        {isPlayerWinner ? "You are the Mastermind!" : `${winnerName} won the round — You lost the game.`}
                    </p>

                    {/* Score Breakdown for FFA */}
                    {room.gameMode === 'FFA' && winner?.scoreBreakdown && (
                        <div className="mb-6 bg-light-bg dark:bg-dark-bg rounded-xl p-4 border border-light-subtle-border dark:border-dark-subtle-border">
                            {isPlayerWinner ? (
                                <>
                                    {/* Show the secret code that was cracked */}
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <span className="text-xs text-light-text/50 dark:text-dark-text/50 uppercase tracking-wider">The Code:</span>
                                        <span className="font-mono font-black text-xl text-secondary-accent dark:text-primary-accent tracking-widest">{codeToDisplay}</span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase text-light-text/60 dark:text-dark-text/60 mb-3 tracking-wider">Score Breakdown</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-light-text/80 dark:text-dark-text/80">Base Score</span>
                                            <span className="font-mono font-bold text-secondary-accent dark:text-primary-accent">{winner.scoreBreakdown.base}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-light-text/80 dark:text-dark-text/80">Efficiency Bonus ({10 - guessCount} saved)</span>
                                            <span className="font-mono font-bold text-green-500">+{winner.scoreBreakdown.efficiency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-light-text/80 dark:text-dark-text/80">Speed Bonus</span>
                                            <span className="font-mono font-bold text-blue-500">+{winner.scoreBreakdown.speed}</span>
                                        </div>
                                        <div className="h-px bg-light-subtle-border dark:bg-dark-subtle-border my-2"></div>
                                        <div className="flex justify-between text-lg font-black">
                                            <span className="text-light-text dark:text-dark-text">TOTAL</span>
                                            <span className="text-secondary-accent dark:text-primary-accent">{winner.scoreBreakdown.total}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Show the secret code that was cracked */}
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <span className="text-xs text-light-text/50 dark:text-dark-text/50 uppercase tracking-wider">The Code:</span>
                                        <span className="font-mono font-black text-xl text-secondary-accent dark:text-primary-accent tracking-widest">{codeToDisplay}</span>
                                    </div>
                                    <h3 className="text-sm font-bold uppercase text-light-text/60 dark:text-dark-text/60 mb-3 tracking-wider text-center">Head-to-Head</h3>
                                    <div className="grid grid-cols-3 gap-2 text-sm mb-2 border-b border-light-subtle-border dark:border-dark-subtle-border pb-2">
                                        <div className="text-left font-bold text-light-text/40 dark:text-dark-text/40">METRIC</div>
                                        <div className="text-center font-black text-light-text dark:text-dark-text">YOU</div>
                                        <div className="text-right font-black text-secondary-accent dark:text-primary-accent">WINNER</div>
                                    </div>

                                    {/* Base Score */}
                                    <div className="grid grid-cols-3 gap-2 py-1">
                                        <div className="text-left text-light-text/80 dark:text-dark-text/80">Base</div>
                                        <div className="text-center font-mono font-bold text-light-text/60 dark:text-dark-text/60">
                                            {room.players.find(p => p.id === playerId)?.scoreBreakdown?.base || 0}
                                        </div>
                                        <div className="text-right font-mono font-bold text-secondary-accent dark:text-primary-accent">
                                            {winner.scoreBreakdown.base}
                                        </div>
                                    </div>

                                    {/* Efficiency */}
                                    <div className="grid grid-cols-3 gap-2 py-1">
                                        <div className="text-left text-light-text/80 dark:text-dark-text/80">Efficiency</div>
                                        <div className="text-center font-mono font-bold text-green-500/70">
                                            +{room.players.find(p => p.id === playerId)?.scoreBreakdown?.efficiency || 0}
                                        </div>
                                        <div className="text-right font-mono font-bold text-green-500">
                                            +{winner.scoreBreakdown.efficiency}
                                        </div>
                                    </div>

                                    {/* Speed */}
                                    <div className="grid grid-cols-3 gap-2 py-1">
                                        <div className="text-left text-light-text/80 dark:text-dark-text/80">Speed</div>
                                        <div className="text-center font-mono font-bold text-blue-500/70">
                                            +{room.players.find(p => p.id === playerId)?.scoreBreakdown?.speed || 0}
                                        </div>
                                        <div className="text-right font-mono font-bold text-blue-500">
                                            +{winner.scoreBreakdown.speed}
                                        </div>
                                    </div>

                                    <div className="h-px bg-light-subtle-border dark:bg-dark-subtle-border my-2"></div>

                                    {/* Total */}
                                    <div className="grid grid-cols-3 gap-2 text-lg">
                                        <div className="text-left font-black text-light-text dark:text-dark-text">TOTAL</div>
                                        <div className="text-center font-black text-light-text/60 dark:text-dark-text/60">
                                            {room.players.find(p => p.id === playerId)?.scoreBreakdown?.total || 0}
                                        </div>
                                        <div className="text-right font-black text-secondary-accent dark:text-primary-accent">
                                            {winner.scoreBreakdown.total}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Simple Stats for Non-FFA */}
                    {room.gameMode !== 'FFA' && (
                        <div className="flex flex-col gap-4 my-6 bg-light-bg dark:bg-dark-bg p-4 rounded-2xl border border-light-subtle-border dark:border-dark-subtle-border">
                            {/* Duel PVP: Show both codes with context-aware labels */}
                            {room.gameMode === 'DUEL' && room.settings.duelModeType === 'PVP' ? (
                                <>
                                    <div className="flex justify-center gap-6">
                                        {/* Left: Opponent's Code (what you were trying to crack) */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] uppercase text-light-text/50 dark:text-dark-text/50 font-bold tracking-widest mb-1">
                                                {isPlayerWinner ? "You Cracked" : "Target Code"}
                                            </span>
                                            <span className={`text-3xl font-black tracking-wider font-mono ${isPlayerWinner ? 'text-green-500 dark:text-green-400' : 'text-red-400 dark:text-red-400'}`}>
                                                {codeToDisplay}
                                            </span>
                                            <span className="text-[9px] text-light-text/40 dark:text-dark-text/40 mt-1">
                                                {opponent?.name}'s code
                                            </span>
                                        </div>
                                        <div className="w-px bg-light-subtle-border dark:bg-dark-subtle-border"></div>
                                        {/* Right: Your Code (what opponent was trying to crack) */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] uppercase text-light-text/50 dark:text-dark-text/50 font-bold tracking-widest mb-1">
                                                {isPlayerWinner ? "Your Code" : "Got Cracked"}
                                            </span>
                                            <span className={`text-3xl font-black tracking-wider font-mono ${isPlayerWinner ? 'text-secondary-accent dark:text-primary-accent' : 'text-orange-500 dark:text-orange-400'}`}>
                                                {yourCodeInDuel}
                                            </span>
                                            <span className="text-[9px] text-light-text/40 dark:text-dark-text/40 mt-1">
                                                Set by you
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-center pt-2 border-t border-light-subtle-border/50 dark:border-dark-subtle-border/50">
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-black text-secondary-accent dark:text-primary-accent">{guessCount}</span>
                                            <span className="text-[10px] uppercase text-light-text/60 dark:text-dark-text/60 font-bold tracking-widest">
                                                {isPlayerWinner ? "Your Guesses" : `${winnerName}'s Guesses`}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Single / CPU Duel: Show single code */
                                <div className="flex justify-center gap-6">
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
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            <Button onClick={handleShare} variant="ghost" className="flex-1 py-3 border-2 border-light-subtle-border dark:border-dark-subtle-border rounded-xl font-bold text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg transition-all active:scale-95">
                                {copied ? (
                                    <span className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 animate-popIn">
                                        <CheckCircleIcon className="w-5 h-5" /> Copied
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Share Link <ShareIcon className="w-4 h-4 opacity-70" />
                                    </span>
                                )}
                            </Button>

                            <Button
                                onClick={handleImageShare}
                                disabled={isGeneratingImage}
                                variant="ghost"
                                className="flex-1 py-3 border-2 border-purple-500/30 rounded-xl font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all active:scale-95"
                            >
                                {isGeneratingImage ? (
                                    <span className="flex items-center justify-center gap-2 animate-pulse">
                                        ...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Share Score <ImageIcon className="w-4 h-4 opacity-70" />
                                    </span>
                                )}
                            </Button>
                        </div>

                        <Button onClick={onPlayAgain} className="w-full py-4 text-lg shadow-lg shadow-secondary-accent/30 rounded-xl hover:translate-y-[-2px] transition-transform">
                            {room.gameMode === 'SINGLE' ? 'Play Again' : 'Back to Lobby'}
                        </Button>

                        {room.gameMode !== 'SINGLE' && (
                            <Button variant="ghost" onClick={() => setShowLeaveConfirm(true)} className="w-full py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <ExitIcon className="w-4 h-4" /> Leave Room
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <ConfirmationModal
                isOpen={showLeaveConfirm}
                title="Leave Room?"
                message="Are you sure you want to leave? You will return to the main menu."
                onConfirm={() => {
                    if (room) socketService.leaveRoom(room.id);
                    setShowLeaveConfirm(false);
                    window.location.href = '/';
                }}
                onCancel={() => setShowLeaveConfirm(false)}
                confirmText="Leave"
            />

            {/* Hidden Share Component for Capture */}
            <div className="fixed left-[-9999px] top-[-9999px]">
                {winner && room && (
                    <ShareResult
                        ref={shareRef}
                        room={room}
                        playerId={playerId || ''}
                        winner={winner}
                    />
                )}
            </div>
        </div>
    );
};
