import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameBoard } from './components/GameBoard';
import { GuessRow } from './components/GuessRow';
import { SettingsPanel } from './components/SettingsPanel';
import { ResultModal } from './components/ResultModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { Logo } from './components/Logo';
import { QuitGameModal } from './components/QuitGameModal';
import { MoonIcon, SunIcon, SpeakerOnIcon, SpeakerOffIcon, InfoIcon, CheckCircleIcon, CopyIcon, ClipboardIcon, CrownIcon, UserIcon, ZapIcon, TrophyIcon, TargetIcon, PartyIcon, DoorExitIcon, ExitIcon } from './components/Icon';
import { Toast, ToastMessage } from './components/Toast';
import { GameTimer } from './components/GameTimer';
import { useTTS } from './hooks/useTTS';
import { useSound } from './hooks/useSound';
import { generateSecretCode, calculateFeedback, generateFeedbackMessage } from './utils/feedback';
import { calculateScore } from './server/src/utils/scoring'; // This might fail if outside src
import type { Theme, Screen, Room, Player, GameMode } from './types';
import { GameState } from './types';
import { socketService } from './services/socketService';
import { DuelHeader, DuelHeaderStyle } from './components/DuelHeader';
import { NameInput } from './components/NameInput';

const LobbyScreen: React.FC<{ room: Room; playerId: string; onStartGame: () => void; onSetReady: (isReady: boolean) => void; showToast: (msg: string) => void; onLeave: () => void; }> = ({ room, playerId, onStartGame, onSetReady, showToast, onLeave }) => {
    const player = room.players.find(p => p.id === playerId);

    if (!player) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse text-purple-600 dark:text-purple-400 font-bold tracking-widest">CONNECTING...</div>
            </div>
        );
    }

    const isHost = player.isHost;

    const canStart = room.gameMode === 'DUEL'
        ? room.players.length === 2 && room.players.every(p => p.isReady)
        : (room.players.length > 1 && room.players.every(p => p.isReady));

    const copyLink = () => {
        const url = `${window.location.origin}/room/${room.id}`;
        navigator.clipboard.writeText(url);
        showToast("Room link copied!");
    };

    const copyCode = () => {
        navigator.clipboard.writeText(room.id);
        showToast("Room code copied!");
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto bg-gray-50 dark:bg-[#09090b] relative transition-colors duration-500">
            {/* Background Abstract Lines Effect (Dark Mode Only) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
                {/* Broad Straight Line 1 */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[2px] bg-purple-500/10 rotate-45 transform origin-top-left scale-150 blur-[1px]"></div>
                {/* Broad Straight Line 2 */}
                <div className="absolute bottom-[20%] right-[-10%] w-[80%] h-[3px] bg-purple-500/10 -rotate-12 blur-[1px]"></div>
                {/* Broad Straight Line 3 */}
                <div className="absolute top-[40%] left-[-20%] w-[120%] h-[2px] bg-purple-500/05 rotate-[25deg] blur-[0.5px]"></div>

                {/* Curvy Line 1 (Large Circle Arc) */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] border-[3px] border-purple-500/10 rounded-full opacity-50 blur-[1px]"></div>
                {/* Curvy Line 2 (Elliptical Arc) */}
                <div className="absolute bottom-[-10%] left-[10%] w-[800px] h-[400px] border-t-[4px] border-purple-500/05 rounded-[100%] rotate-[-10deg] blur-[2px]"></div>
                {/* Random Tech Line */}
                <div className="absolute top-[20%] right-[30%] w-[200px] h-[2px] bg-purple-500/10 rotate-90"></div>

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/50 to-[#09090b]"></div>
            </div>

            <div className="w-full max-w-5xl animate-fadeIn my-auto z-10">
                <Card className="p-6 sm:p-8 shadow-2xl bg-white dark:bg-[#13111a]/90 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl transition-colors duration-300">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-10 border-b border-gray-100 dark:border-white/5 pb-8">
                        <div>
                            <div className="flex items-center gap-3 group">
                                <h2
                                    className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-white dark:to-white/50 tracking-tighter cursor-pointer hover:scale-105 transition-all duration-300 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                    onClick={copyCode}
                                    title="Click to copy code"
                                >
                                    {room.id}
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={copyCode}
                                    className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 border border-purple-200/50 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30 dark:hover:shadow-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                                    title="Copy room code"
                                >
                                    <CopyIcon className="w-5 h-5" />
                                </Button>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/30 mt-3 ml-1">Room Code</p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            <span className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm">
                                {room.gameMode === 'DUEL' ? <><TargetIcon className="w-4 h-4" /> 1v1 Duel</> : <><PartyIcon className="w-4 h-4" /> Party FFA</>}
                            </span>
                            <Button
                                variant="ghost"
                                onClick={onLeave}
                                className="p-3 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20 border border-red-200/50 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 dark:hover:shadow-red-500/50 transition-all duration-300 backdrop-blur-sm"
                                title="Leave Room"
                            >
                                <DoorExitIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* Left Column: Players */}
                        <div className="lg:col-span-7">
                            <h3 className="font-bold text-sm mb-6 text-gray-400 dark:text-white/50 uppercase tracking-widest flex items-center gap-3">
                                Players <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs text-gray-600 dark:text-white/80">{room.players.length}/{room.gameMode === 'DUEL' ? 2 : 8}</span>
                            </h3>
                            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
                                <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent hover:scrollbar-thumb-purple-500/40">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-white/95 dark:bg-[#13111a]/95 backdrop-blur-sm z-10">
                                            <tr className="border-b border-gray-100 dark:border-white/5 text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider">
                                                <th className="p-4 pl-6 w-16">Rank</th>
                                                <th className="p-4">Player</th>
                                                <th className="p-4 text-center">Score</th>
                                                <th className="p-4 text-right pr-6">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {room.players.slice().sort((a, b) => b.score - a.score).map((p, index) => {
                                                const isYou = p.id === playerId;
                                                return (
                                                    <tr
                                                        key={p.id}
                                                        className={`group transition-colors duration-200 ${isYou
                                                            ? 'bg-green-50/50 dark:bg-green-500/10 hover:bg-green-100/50 dark:hover:bg-green-500/20'
                                                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <td className="p-4 pl-6 font-mono font-bold text-gray-400 dark:text-white/40">
                                                            #{index + 1}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isYou ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/60'
                                                                    }`}>
                                                                    {p.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className={`font-bold text-sm ${isYou ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-white/80'}`}>
                                                                        {p.name} {isYou && '(You)'}
                                                                    </span>
                                                                    {p.isHost && <span className="text-[10px] uppercase tracking-wider text-yellow-500 font-bold flex items-center gap-1"><CrownIcon className="w-3 h-3" /> Host</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-100 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold">
                                                                <TrophyIcon className="w-3 h-3" />
                                                                {p.score}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right pr-6">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${p.isReady
                                                                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30'
                                                                : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10'
                                                                }`}>
                                                                {p.isReady ? <><CheckCircleIcon className="w-3 h-3" /> Ready</> : 'Waiting'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Empty State / Min Players Warning */}
                                            {room.players.length < 2 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-gray-400 dark:text-white/30 text-sm font-medium italic border-t border-gray-100 dark:border-white/5">
                                                        Waiting for more players to join...
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="lg:col-span-5 flex flex-col h-full">
                            <SettingsPanel
                                codeLength={room.settings.codeLength}
                                setCodeLength={(len) => socketService.updateSettings(room.id, { ...room.settings, codeLength: len })}
                                allowRepeats={room.settings.allowRepeats}
                                setAllowRepeats={(allow) => socketService.updateSettings(room.id, { ...room.settings, allowRepeats: allow })}
                                duelModeType={room.gameMode === 'DUEL' ? (room.settings.duelModeType || 'PVP') : undefined}
                                setDuelModeType={room.gameMode === 'DUEL' ? (type) => socketService.updateSettings(room.id, { ...room.settings, duelModeType: type }) : undefined}
                                onCtaClick={() => socketService.startGame(room.id)}
                                ctaText={canStart ? (room.gameMode === 'DUEL' ? 'Start Duel' : 'Start Game') : 'Waiting...'}
                                isGameInProgress={false}
                                isHost={isHost}
                                ctaDisabled={!canStart}
                            />

                            {!isHost && (
                                <div className="mt-6">
                                    <Button
                                        onClick={() => onSetReady(!player.isReady)}
                                        className={`w-full py-4 text-lg font-bold tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 rounded-xl flex items-center justify-center gap-2 ${player.isReady
                                            ? 'bg-transparent border-2 border-purple-500/50 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500'
                                            : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]'
                                            }`}
                                    >
                                        <ZapIcon className="w-5 h-5" />
                                        {player.isReady ? 'Cancel Ready' : 'Ready Up!'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};


// --- CONSTANTS ---
// const PLAYER_ID = 'player-human'; // REMOVED: Now dynamic

// --- HELPER COMPONENTS ---

const PlayerAvatar: React.FC<{ player: Player }> = ({ player }) => {
    const colors = [
        'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const colorIndex = player.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    return (
        <div className="relative">
            <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center font-bold text-white text-lg ring-2 ring-offset-2 dark:ring-offset-dark-card ring-transparent shadow-sm`}>
                {player.name.charAt(0).toUpperCase()}
            </div>
            {player.isReady && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-light-card dark:border-dark-card flex items-center justify-center">
                    <CheckCircleIcon className="w-3 h-3 text-white" />
                </div>
            )}
        </div>
    );
};

const ProgressBar: React.FC<{ value: number; max: number; label: string; }> = ({ value, max, label }) => (
    <div className="w-full">
        <div className="flex justify-between items-center mb-1 text-sm text-light-text dark:text-dark-text">
            <span className="font-bold">{label}</span>
            <span className="font-mono opacity-70">{value}</span>
        </div>
        <div className="w-full bg-light-subtle-border/30 dark:bg-dark-subtle-border/30 rounded-full h-3 overflow-hidden">
            <div
                className="bg-gradient-to-r from-secondary-accent to-purple-400 dark:from-primary-accent dark:to-indigo-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(124,58,237,0.4)]"
                style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
            ></div>
        </div>
    </div>
);


// --- UI SCREENS ---

const LandingScreen: React.FC<{
    onCreateRoom: (mode: GameMode) => void;
    onJoinRoom: (roomId: string) => void;
}> = ({ onCreateRoom, onJoinRoom }) => {
    const [showJoinInput, setShowJoinInput] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const { playPop } = useSound();

    const handleJoinClick = () => {
        if (joinRoomId.trim()) {
            setIsJoining(true);
            onJoinRoom(joinRoomId.trim().toUpperCase());
            // Reset loading after a timeout in case of error (or let parent handle it)
            setTimeout(() => setIsJoining(false), 3000);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 text-center animate-fadeIn shadow-2xl bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-t-4 border-t-secondary-accent">
                <div className="flex justify-center mb-8">
                    <div className="w-28 h-28 animate-popIn drop-shadow-2xl">
                        <Logo className="w-full h-full" />
                    </div>
                </div>
                <h2 className="text-5xl font-black text-secondary-accent dark:text-primary-accent mb-2 tracking-tighter">CRACK IT.</h2>
                <p className="text-light-text dark:text-dark-text mb-10 text-lg font-medium opacity-70">Join the viral puzzle sensation.</p>

                <div className="flex flex-col gap-4">
                    <Button onClick={() => onCreateRoom('SINGLE')} className="w-full py-4 text-xl font-black rounded-2xl shadow-lg hover:scale-[1.02] hover:-translate-y-1 transition-all bg-gradient-to-r from-secondary-accent to-purple-600 border-0">
                        SINGLE PLAYER
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => onCreateRoom('DUEL')} className="w-full py-4 text-base font-bold rounded-2xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            <TargetIcon className="w-5 h-5" /> VS DUEL
                        </Button>
                        <Button onClick={() => onCreateRoom('FFA')} className="w-full py-4 text-base font-bold rounded-2xl hover:scale-[1.02] transition-transform">
                            PARTY FFA
                        </Button>
                    </div>

                    <div className="mt-4">
                        {!showJoinInput ? (
                            <p onClick={() => setShowJoinInput(true)} className="text-sm font-bold text-secondary-accent dark:text-primary-accent cursor-pointer hover:underline opacity-80">
                                Have a room code? Join here
                            </p>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-2 animate-fadeIn mt-2">
                                <input
                                    type="text"
                                    value={joinRoomId}
                                    onChange={(e) => { setJoinRoomId(e.target.value); playPop(); }}
                                    placeholder="CODE"
                                    maxLength={5}
                                    className="flex-grow w-full px-4 py-3 text-xl font-mono font-bold text-center uppercase bg-light-input-bg dark:bg-dark-bg border-2 border-light-subtle-border dark:border-dark-subtle-border rounded-xl transition-all text-light-text dark:text-dark-text focus:outline-none focus:border-secondary-accent dark:focus:border-primary-accent focus:ring-4 focus:ring-secondary-accent/20"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleJoinClick(); }}
                                    disabled={isJoining}
                                />
                                <Button onClick={handleJoinClick} disabled={isJoining} className="px-6 py-3 text-lg font-bold rounded-xl min-w-[80px]">
                                    {isJoining ? '...' : 'GO'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
};


const DuelSetupScreen: React.FC<{ room: Room; playerId: string; onSetCode: (code: string) => void; onCountdownComplete: () => void; }> = ({ room, playerId, onSetCode, onCountdownComplete }) => {
    const player = room.players.find(p => p.id === playerId);
    const opponent = room.players.find(p => p.id !== playerId);
    const { playPop } = useSound();
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        if (player?.secretCode && opponent?.secretCode) {
            setCount(3);
        }
    }, [player?.secretCode, opponent?.secretCode]);

    useEffect(() => {
        if (count === null) return;
        if (count > 0) {
            const timer = setTimeout(() => setCount(count - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            onCountdownComplete();
        }
    }, [count, onCountdownComplete]);

    if (!player) return <div className="w-full h-full flex items-center justify-center">Loading...</div>;

    const handleGenerateCode = () => {
        playPop();
        const code = generateSecretCode(room.settings.codeLength, room.settings.allowRepeats);
        onSetCode(code);
    }

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 text-center animate-fadeIn shadow-xl">
                <h2 className="text-2xl font-bold text-secondary-accent dark:text-primary-accent mb-2">Set Your Secret Code</h2>
                <p className="text-light-text dark:text-dark-text mb-6 opacity-80">Your opponent, <span className="font-bold">{opponent?.name || '...'}</span>, will try to guess this code.</p>
                {player.secretCode ? (
                    <div className="flex flex-col items-center gap-4 animate-popIn">
                        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-2 shadow-lg shadow-green-500/30">
                            <CheckCircleIcon className="w-10 h-10" />
                        </div>
                        <div className="text-4xl font-mono font-bold tracking-[0.5em] p-6 bg-light-bg dark:bg-dark-bg rounded-xl border border-light-subtle-border dark:border-dark-subtle-border shadow-inner text-light-text dark:text-dark-text">
                            {player.secretCode}
                        </div>
                        <p className="text-sm font-medium text-light-text/60 dark:text-dark-text/60 mt-2 animate-pulse">
                            {opponent?.secretCode ? (
                                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                    Starting in {count}...
                                </span>
                            ) : "Waiting for opponent..."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
                        {opponent?.secretCode && (
                            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg text-sm font-bold animate-pulse flex items-center gap-2">
                                <ZapIcon className="w-4 h-4" />
                                Opponent is ready! Set your code to start.
                            </div>
                        )}
                        <GameBoard
                            codeLength={room.settings.codeLength}
                            onSubmitGuess={onSetCode}
                            isGameWon={false}
                            allowRepeats={room.settings.allowRepeats}
                        />
                        <div className="w-full border-t border-light-subtle-border dark:border-dark-subtle-border"></div>
                        <Button variant="ghost" onClick={handleGenerateCode} className="w-full text-light-text/70 hover:text-secondary-accent">
                            Randomize Code
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};


const GameScreen: React.FC<{ room: Room; playerId: string; onSubmitGuess: (guess: string) => void; onInvalidGuess: (message: string) => void; onQuit: () => void; duelHeaderStyle: DuelHeaderStyle; onToggleDuelHeaderStyle: () => void; }> = ({ room, playerId, onSubmitGuess, onInvalidGuess, onQuit, duelHeaderStyle, onToggleDuelHeaderStyle }) => {
    const player = room.players.find(p => p.id === playerId);

    if (!player) return <div className="w-full h-full flex items-center justify-center">Loading game...</div>;

    const isGameOver = room.gameState === GameState.Won;

    const allGuessesSorted = useMemo(() =>
        room.players.flatMap(p => p.guesses).sort((a, b) => b.id - a.id)
        , [room.players]);

    const opponent = room.gameMode === 'DUEL' ? room.players.find(p => p.id === player.opponentId) : null;
    const yourGuesses = player.guesses.slice().sort((a, b) => b.id - a.id);
    const maxGuesses = Math.max(10, player.guesses.length, opponent?.guesses.length ?? 0);

    // Check if THIS player has solved the code (even if game is still in Panic mode)
    const hasPlayerSolved = player.guesses.some(g => g.hits === room.settings.codeLength);

    return (
        <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 p-2 lg:p-6 animate-fadeIn overflow-hidden">

            {room.gameMode === 'DUEL' && opponent && (
                <DuelHeader
                    player={player}
                    opponent={opponent}
                    maxGuesses={maxGuesses}
                    style={duelHeaderStyle}
                    onToggleStyle={onToggleDuelHeaderStyle}
                />
            )}

            {/* --- History --- */}
            <div className="hidden lg:flex lg:col-span-4 flex-col h-full min-h-0">
                <h2 className="text-xs font-black uppercase tracking-widest mb-3 text-light-text/60 dark:text-dark-text/60 px-1">Your History</h2>
                <Card className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-dark-card shadow-md border border-light-subtle-border dark:border-dark-subtle-border">
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {yourGuesses.length > 0 ? (
                            yourGuesses.map((guess, index) => (
                                <GuessRow key={`${guess.playerId}-${guess.id}-${index}`} guess={guess} showPlayerName={false} />
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-4">
                                <ClipboardIcon className="w-12 h-12 mb-2" />
                                <p className="font-medium">Your guesses will appear here</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* --- Game Board --- */}
            <div className="flex-1 lg:col-span-4 flex flex-col h-full min-h-0">
                <Card className="flex-1 p-4 lg:p-8 flex flex-col relative shadow-2xl bg-white dark:bg-dark-card border border-light-subtle-border dark:border-dark-subtle-border overflow-y-auto">
                    {/* Timer & Header */}
                    <div className="flex justify-between items-center mb-8 lg:mb-12">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black text-secondary-accent dark:text-primary-accent tracking-widest uppercase">
                                {room.gameMode === 'DUEL' ? `TARGET: ${opponent?.name}` : "CODE BREAKER"}
                            </h2>
                            <div className="h-1 w-8 bg-secondary-accent/30 dark:bg-primary-accent/30 rounded-full mt-1"></div>
                        </div>
                        <div className="flex items-center gap-4">
                            {room.gameState === GameState.Panic ? (
                                <PanicTimer startTime={room.panicStartTime} />
                            ) : (
                                <GameTimer isPlaying={!isGameOver} />
                            )}
                            {room.gameMode !== 'SINGLE' && room.gameMode !== 'DUEL' && (
                                <Button variant="ghost" onClick={onQuit} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Quit Game">
                                    <ExitIcon className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="my-auto w-full flex flex-col items-center">
                        <GameBoard
                            codeLength={room.settings.codeLength}
                            onSubmitGuess={onSubmitGuess}
                            onInvalidGuess={onInvalidGuess}
                            isGameWon={isGameOver || hasPlayerSolved}
                            allowRepeats={room.settings.allowRepeats}
                        />
                    </div>
                </Card>
            </div>

            {/* --- Live Feed --- */}
            <div className="hidden lg:flex lg:col-span-4 flex-col h-full min-h-0">
                <h2 className="text-xs font-black uppercase tracking-widest mb-3 text-light-text/60 dark:text-dark-text/60 px-1">{room.gameMode === 'DUEL' ? "Opponent Activity" : "Live Feed"}</h2>
                <Card className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-dark-card shadow-md border border-light-subtle-border dark:border-dark-subtle-border">
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                        {room.gameMode === 'DUEL' && opponent ? (
                            opponent.guesses.length > 0 ? opponent.guesses.slice().sort((a, b) => b.id - a.id).map(guess => (
                                <GuessRow key={`opp-${guess.id}`} guess={guess} showPlayerName={false} />
                            )) : <div className="h-full flex flex-col items-center justify-center opacity-40 font-medium text-center p-4">
                                <div className="animate-pulse mb-2">...</div>
                                <div>Waiting for move</div>
                            </div>
                        ) : (
                            allGuessesSorted.length > 0 ? allGuessesSorted.map((guess, index) => {
                                const isMyGuess = guess.playerId === playerId;
                                // Mask code if it's not my guess and game is not over (or even if over, maybe keep masked? No, reveal on end usually, but for now mask always for opponents in feed)
                                // Actually, user said "live feeds mein player ek dusre ka code dekh le rhe h".
                                // So we mask for opponents.
                                const displayGuess = isMyGuess ? guess : { ...guess, code: '****' };

                                return (
                                    <GuessRow key={`feed-${guess.playerId}-${guess.id}-${index}`} guess={displayGuess} showPlayerName={true} />
                                );
                            }) : <div className="h-full flex items-center justify-center opacity-40 font-medium">No activity yet...</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* --- Mobile History (Compact) --- */}
            <div className="lg:hidden flex flex-col gap-3 mt-1 pb-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-black text-secondary-accent dark:text-primary-accent uppercase text-xs tracking-wider">History ({yourGuesses.length})</h3>
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    {yourGuesses.length > 0 ? yourGuesses.map((guess, index) => (
                        <GuessRow key={`mob-${index}`} guess={guess} />
                    )) : (
                        <Card className="p-4 text-center text-light-text/50 dark:text-dark-text/50 border-dashed text-sm">
                            <p>Enter your first code above</p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

const PanicTimer: React.FC<{ startTime?: number }> = ({ startTime }) => {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        if (!startTime) return;
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, 30 - elapsed);
            setTimeLeft(remaining);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <span className="text-red-500 animate-pulse font-mono">
            PANIC MODE! Ends in {timeLeft}s!
        </span>
    );
};


// --- MAIN APP ---

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [screen, setScreen] = useState<Screen>('landing');
    const [duelHeaderStyle, setDuelHeaderStyle] = useState<DuelHeaderStyle>('classic');
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('player_name') || 'Player');

    // Persist player name
    useEffect(() => {
        localStorage.setItem('player_name', playerName);
    }, [playerName]);

    const [room, setRoom] = useState<Room | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isRestarting, setIsRestarting] = useState(false);
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [showLeaveLobbyConfirm, setShowLeaveLobbyConfirm] = useState(false);
    const [playerId, setPlayerId] = useState<string>('player-human');
    const [duelCountdownComplete, setDuelCountdownComplete] = useState(false);

    const { isMuted, toggleMute, speak, isTTSSupported } = useTTS();
    const { playWin, playPop, playClick } = useSound();

    const showToast = (message: string, type: 'info' | 'error' = 'info') => {
        setToast({ id: Date.now(), message, type });
    };

    const resetToLanding = useCallback(() => {
        setRoom(null);
        setScreen('landing');
        setDuelCountdownComplete(false);
        window.history.pushState({}, '', '/');
        playClick();
    }, [playClick]);

    const handleRoomUpdate = useCallback((newRoom: Room) => {
        // Check if we are still in the room
        const amIInTheRoom = newRoom.players.some(p => p.id === playerId);
        if (!amIInTheRoom) {
            resetToLanding();
            return;
        }

        setRoom(newRoom);
        if (newRoom.id !== 'singleplayer' && window.location.pathname !== `/room/${newRoom.id}`) {
            window.history.pushState({}, '', `/room/${newRoom.id}`);
        }

        if (newRoom.gameState === GameState.Lobby) {
            setScreen('lobby');
            setDuelCountdownComplete(false);
        } else if (newRoom.gameState === GameState.Playing || newRoom.gameState === GameState.Panic) {
            if (newRoom.gameMode === 'DUEL') {
                const player = newRoom.players.find(p => p.id === playerId);
                const opponent = newRoom.players.find(p => p.id !== playerId);

                // If PVP mode, check if both players have secret codes and countdown is done
                if (newRoom.settings.duelModeType === 'PVP') {
                    if (player?.secretCode && opponent?.secretCode && duelCountdownComplete) {
                        setScreen('game');
                    } else {
                        setScreen('duel-setup');
                    }
                } else {
                    setScreen('game');
                }
            } else {
                setScreen('game');
            }
        }
    }, [playerId, duelCountdownComplete]);

    // Effect to handle screen transition when duel countdown completes
    useEffect(() => {
        if (room?.gameMode === 'DUEL' && room.settings.duelModeType === 'PVP' && duelCountdownComplete) {
            const player = room.players.find(p => p.id === playerId);
            const opponent = room.players.find(p => p.id !== playerId);
            if (player?.secretCode && opponent?.secretCode) {
                setScreen('game');
            }
        }
    }, [duelCountdownComplete, room, playerId]);

    // Watch countdown for audio feedback side effect
    useEffect(() => {
        if (countdown && countdown > 0) {
            playPop();
        }
    }, [countdown, playPop]);

    const handleGameStart = useCallback((startingRoom: Room) => {
        setRoom(startingRoom);
        setCountdown(3);

        // Use window.setInterval explicitly to avoid Node/Browser type ambiguity in some envs
        const timerId = window.setInterval(() => {
            setCountdown(current => {
                if (current === null) return null;
                return current - 1;
            });
        }, 1000);

        setTimeout(() => {
            window.clearInterval(timerId);
            setCountdown(null);
            handleRoomUpdate(startingRoom);
        }, 3000);
    }, [handleRoomUpdate]);

    useEffect(() => {
        socketService.connect(
            handleRoomUpdate,
            handleGameStart,
            (finalRoom) => {
                setRoom(finalRoom);
                const winner = finalRoom.players.find(p => p.guesses.some(g => g.hits === finalRoom.settings.codeLength));
                if (winner?.id === playerId) {
                    playWin();
                }
                const winMessage = winner?.id === playerId ? "Congratulations! You cracked the code!" : `${winner?.name} cracked the code!`;
                speak(winMessage);
            },
            (data) => {
                showToast(`${data.name} left the game`, 'info');
            },
            (errorMessage) => {
                showToast(errorMessage, 'error');
                resetToLanding();
            }
        );

        const path = window.location.pathname;
        const match = path.match(/\/room\/(\w+)/);
        if (match) {
            const roomId = match[1];
            socketService.joinRoom(roomId, playerName);
        }

        // Update playerId when socket connects (or if we are in single player, keep default)
        const interval = setInterval(() => {
            const socketId = socketService.getSocketId();
            if (socketId && socketId !== playerId) {
                setPlayerId(socketId);
            }
        }, 1000);
        return () => clearInterval(interval);

    }, [handleRoomUpdate, resetToLanding, speak, handleGameStart, playWin, playerId, playerName]); // Added playerId and playerName to dependencies

    const handleCreateRoom = useCallback((gameMode: GameMode) => {
        if (gameMode === 'SINGLE') {
            const newRoom: Room = {
                id: 'singleplayer',
                players: [{ id: 'player-human', name: 'You', isHost: true, isReady: true, guesses: [], score: 0 }],
                gameMode: 'SINGLE',
                gameState: GameState.Playing,
                secretCode: generateSecretCode(4, false),
                settings: { codeLength: 4, allowRepeats: false },
            };
            setRoom(newRoom);
            setScreen('game');
            setIsRestarting(true);
            setTimeout(() => setIsRestarting(false), 300);
        } else {
            socketService.createRoom(gameMode, playerName);
        }
    }, [playerName]);

    const handleJoinRoom = (roomId: string) => {
        if (roomId) {
            socketService.joinRoom(roomId, playerName);
        }
    };

    const handleSubmitGuess = (guessCode: string) => {
        if (!room) return;
        if (room.gameMode === 'SINGLE') {
            const { hits, pseudoHits } = calculateFeedback(guessCode, room.secretCode);
            const feedbackMessage = generateFeedbackMessage(hits, pseudoHits, room.settings.codeLength);
            const newGuess = { id: room.players[0].guesses.length + 1, code: guessCode, hits, pseudoHits, feedbackMessage, playerId: playerId, playerName: 'You' };

            const updatedPlayer = { ...room.players[0], guesses: [...room.players[0].guesses, newGuess] };
            const newGameState = hits === room.settings.codeLength ? GameState.Won : GameState.Playing;

            if (newGameState === GameState.Won) {
                const now = Date.now();
                const startTime = room.startTime || now;
                const timeTakenSeconds = Math.floor((now - startTime) / 1000);
                const scoreBreakdown = calculateScore(
                    updatedPlayer.guesses.length,
                    timeTakenSeconds,
                    false,
                    undefined,
                    room.settings.codeLength
                );
                updatedPlayer.score = scoreBreakdown.total;
                updatedPlayer.scoreBreakdown = scoreBreakdown;

                speak("Congratulations! You cracked the code!");
            }

            setRoom({ ...room, players: [updatedPlayer], gameState: newGameState });
            speak(feedbackMessage);
            playWin(); // Trigger visuals handled in ResultModal
        } else {
            socketService.submitGuess(room.id, playerId, guessCode);
        }
    };

    // SINGLE PLAYER SETTINGS HELPERS
    const updateSinglePlayerCodeLength = (len: number) => {
        setRoom(prev => {
            if (!prev) return null;
            const newCode = generateSecretCode(len, prev.settings.allowRepeats);
            return {
                ...prev,
                secretCode: newCode,
                settings: { ...prev.settings, codeLength: len },
                players: [{ ...prev.players[0], guesses: [] }] // Reset guesses
            };
        });
    };

    const updateSinglePlayerRepeats = (allow: boolean) => {
        setRoom(prev => {
            if (!prev) return null;
            const newCode = generateSecretCode(prev.settings.codeLength, allow);
            return {
                ...prev,
                secretCode: newCode,
                settings: { ...prev.settings, allowRepeats: allow },
                players: [{ ...prev.players[0], guesses: [] }] // Reset guesses
            };
        });
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const hasSeenOnboarding = localStorage.getItem('onboarding_seen');
        if (savedTheme) setTheme(savedTheme);
        else if (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches) setTheme('dark');
        if (!hasSeenOnboarding) setShowOnboarding(true);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleOnboardingClose = () => {
        setShowOnboarding(false);
        localStorage.setItem('onboarding_seen', 'true');
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const renderSinglePlayerGame = () => {
        if (!room) return null;
        const yourGuesses = room.players[0].guesses.slice().sort((a, b) => b.id - a.id);

        return (
            <div className={`w-full h-full flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 p-2 lg:p-6 overflow-y-auto lg:overflow-hidden scroll-smooth ${isRestarting ? 'animate-popIn' : ''}`}>

                {/* --- Main Board (Left/Center) --- */}
                <div className="flex-shrink-0 lg:flex-1 lg:col-span-7 flex flex-col gap-4 min-h-min lg:h-full lg:justify-center">
                    <Card className="p-4 sm:p-8 lg:p-12 flex flex-col relative shadow-2xl transition-all duration-300 bg-white dark:bg-dark-card border border-light-subtle-border dark:border-dark-subtle-border">
                        {/* Game Header inside Board */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-secondary-accent dark:text-primary-accent opacity-90 tracking-tight">SINGLE PLAYER</h2>
                                <p className="text-sm text-light-text/60 dark:text-dark-text/60 font-bold uppercase tracking-widest">Break the Cipher</p>
                            </div>
                            <GameTimer key={room.secretCode} isPlaying={room.gameState !== GameState.Won} />
                        </div>

                        <div className="w-full flex justify-center">
                            <GameBoard
                                codeLength={room.settings.codeLength}
                                onSubmitGuess={handleSubmitGuess}
                                onInvalidGuess={(msg) => showToast(msg, 'error')}
                                isGameWon={room.gameState === GameState.Won}
                                allowRepeats={room.settings.allowRepeats}
                            />
                        </div>
                    </Card>

                    {/* --- Mobile: Settings & Controls --- */}
                    <div className="lg:hidden animate-fadeIn mb-4">
                        <Card className="p-5 bg-white dark:bg-dark-card shadow-lg border border-light-subtle-border dark:border-dark-subtle-border">
                            <div className="flex items-center justify-between mb-4 border-b border-light-subtle-border dark:border-dark-subtle-border pb-2">
                                <h3 className="font-black text-secondary-accent dark:text-primary-accent uppercase text-xs tracking-widest">Game Controls</h3>
                            </div>
                            <SettingsPanel
                                codeLength={room.settings.codeLength}
                                setCodeLength={updateSinglePlayerCodeLength}
                                allowRepeats={room.settings.allowRepeats}
                                setAllowRepeats={updateSinglePlayerRepeats}
                                onCtaClick={() => setShowRestartConfirm(true)}
                                ctaText="New Game"
                                isGameInProgress={false}
                                isHost={true}
                            />
                        </Card>
                    </div>
                </div>

                {/* --- Sidebar (Right - Desktop Only) --- */}
                <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 h-full min-h-0">
                    {/* <div className="w-full h-25 bg-gray-900 p-2 rounded-xl"> */}
                    <SettingsPanel
                        codeLength={room.settings.codeLength}
                        setCodeLength={updateSinglePlayerCodeLength}
                        allowRepeats={room.settings.allowRepeats}
                        setAllowRepeats={updateSinglePlayerRepeats}
                        onCtaClick={() => setShowRestartConfirm(true)}
                        ctaText="Restart Game"
                        isGameInProgress={false}
                        isHost={true}
                    />
                    {/* </div> */}




                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h2 className="text-sm font-black text-light-text dark:text-dark-text uppercase tracking-widest">Guess History</h2>
                            <span className="text-xs font-bold text-light-text/50 dark:text-dark-text/50 bg-light-subtle-border/20 px-2 py-1 rounded">{yourGuesses.length}</span>
                        </div>
                        <Card className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-dark-card shadow-lg border border-light-subtle-border dark:border-dark-subtle-border">
                            <div className="p-4 flex-1 overflow-y-auto space-y-3">
                                {yourGuesses.length > 0 ? (
                                    yourGuesses.map((guess, index) => (
                                        <GuessRow key={`${guess.playerId}-${guess.id}-${index}`} guess={guess} showPlayerName={false} />
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <ClipboardIcon className="w-12 h-12 mb-2 opacity-50" />
                                        <p className="font-medium text-sm">Start guessing to see history</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Mobile View History (at bottom) */}
                <div className="lg:hidden pb-24">
                    <h3 className="font-black mb-3 text-secondary-accent dark:text-primary-accent uppercase text-xs tracking-widest px-1">Recent Guesses</h3>
                    <div className="space-y-3">
                        {yourGuesses.length > 0 ? yourGuesses.slice(0, 10).map((guess, index) => (
                            <GuessRow key={`mob-${index}`} guess={guess} />
                        )) : <div className="text-center p-8 opacity-50 text-sm border-2 border-dashed border-light-subtle-border dark:border-dark-subtle-border rounded-xl">No guesses yet</div>}
                    </div>
                </div>
            </div>
        )
    }

    const renderContent = () => {
        if (countdown !== null) {
            return (
                <div className="text-center animate-popIn m-auto">
                    <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-4 uppercase tracking-widest">Get Ready</h2>
                    <p className="text-[10rem] leading-none font-black text-secondary-accent dark:text-primary-accent animate-bounce drop-shadow-2xl">{countdown}</p>
                </div>
            )
        }

        if (!room) {
            return <LandingScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
        }

        switch (screen) {
            case 'lobby':
                return <LobbyScreen
                    room={room}
                    playerId={playerId}
                    onStartGame={() => socketService.startGame(room.id)}
                    onSetReady={(isReady) => socketService.setReady(room.id, playerId, isReady)}
                    showToast={showToast}
                    onLeave={() => setShowLeaveLobbyConfirm(true)}
                />;
            case 'duel-setup':
                return <DuelSetupScreen
                    room={room}
                    playerId={playerId}
                    onSetCode={(code) => socketService.setDuelCode(room.id, playerId, code)}
                    onCountdownComplete={() => setDuelCountdownComplete(true)}
                />;
            case 'game':
                return room.gameMode === 'SINGLE' ? renderSinglePlayerGame() : (
                    <GameScreen
                        room={room}
                        playerId={playerId}
                        onSubmitGuess={handleSubmitGuess}
                        onInvalidGuess={(msg) => showToast(msg, 'error')}
                        onQuit={() => setShowQuitConfirm(true)}
                        duelHeaderStyle={duelHeaderStyle}
                        onToggleDuelHeaderStyle={() => {
                            const styles: DuelHeaderStyle[] = ['classic', 'neon', 'retro', 'minimal', 'glass'];
                            const currentIndex = styles.indexOf(duelHeaderStyle);
                            const nextIndex = (currentIndex + 1) % styles.length;
                            setDuelHeaderStyle(styles[nextIndex]);
                        }}
                    />
                );
            case 'landing':
            default:
                return <LandingScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
        }
    }

    return (
        <div className="h-screen w-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex flex-col overflow-hidden transition-colors duration-500 font-sans selection:bg-secondary-accent selection:text-white">
            {showOnboarding && <OnboardingModal onClose={handleOnboardingClose} />}
            <ConfirmationModal
                isOpen={showRestartConfirm}
                title="Restart Game?"
                message="Are you sure you want to restart? Your current progress will be lost."
                onConfirm={() => {
                    handleCreateRoom('SINGLE');
                    setShowRestartConfirm(false);
                }}
                onCancel={() => setShowRestartConfirm(false)}
                confirmText="Restart"
            />
            {/* Custom Quit Modal for Multiplayer */}
            <QuitGameModal
                isOpen={showQuitConfirm}
                onClose={() => setShowQuitConfirm(false)}
                onBackToLobby={() => {
                    if (room) socketService.resetGame(room.id);
                    setShowQuitConfirm(false);
                }}
                onLeaveRoom={() => {
                    if (room) socketService.leaveRoom(room.id);
                    setShowQuitConfirm(false);
                    resetToLanding();
                }}
            />
            <ConfirmationModal
                isOpen={showLeaveLobbyConfirm}
                title="Leave Lobby?"
                message="Are you sure you want to leave the lobby?"
                onConfirm={() => {
                    if (room) socketService.leaveRoom(room.id);
                    setShowLeaveLobbyConfirm(false);
                    resetToLanding();
                }}
                onCancel={() => setShowLeaveLobbyConfirm(false)}
                confirmText="Leave"
            />

            <ResultModal room={room} playerId={playerId} onPlayAgain={room?.gameMode === 'SINGLE' ? () => handleCreateRoom('SINGLE') : () => room && socketService.resetGame(room.id)} />
            {/* Toast Notification */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />

            <header className="w-full flex-shrink-0 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center border-b border-light-subtle-border dark:border-dark-subtle-border bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl z-20 shadow-sm dark:shadow-none sticky top-0">
                <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={() => {
                        if (room) {
                            if (room.gameState === GameState.Lobby) {
                                setShowLeaveLobbyConfirm(true);
                            } else {
                                setShowQuitConfirm(true);
                            }
                        } else {
                            resetToLanding();
                        }
                    }}
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110 transition-transform">
                        <Logo className="w-full h-full" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-secondary-accent dark:text-primary-accent tracking-tighter hidden xs:block group-hover:text-purple-500 transition-colors">
                        CRACK THE CODE
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setShowOnboarding(true)} className="p-2 rounded-full hover:bg-secondary-accent/10 transition-colors">
                        <InfoIcon className="w-5 h-5" />
                    </Button>
                    {isTTSSupported && (
                        <Button variant="ghost" onClick={toggleMute} className="p-2 rounded-full hover:bg-secondary-accent/10 transition-colors">
                            {isMuted ? <SpeakerOffIcon className="w-5 h-5" /> : <SpeakerOnIcon className="w-5 h-5" />}
                        </Button>
                    )}
                    <NameInput value={playerName} onChange={setPlayerName} />
                    <Button variant="ghost" onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary-accent/10 transition-colors">
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </Button>
                </div>
            </header>

            <main className="flex-1 w-full h-full min-h-0 overflow-hidden relative flex flex-col">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
