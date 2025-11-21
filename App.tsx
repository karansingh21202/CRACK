
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
import { MoonIcon, SunIcon, SpeakerOnIcon, SpeakerOffIcon, InfoIcon, CheckCircleIcon, ClipboardIcon } from './components/Icon';
import { Toast, ToastMessage } from './components/Toast';
import { GameTimer } from './components/GameTimer';
import { useTTS } from './hooks/useTTS';
import { useSound } from './hooks/useSound';
import { generateSecretCode, calculateFeedback, generateFeedbackMessage } from './utils/feedback';
import type { Theme, Screen, Room, Player, GameMode } from './types';
import { GameState } from './types';
import { socketService } from './services/socketService';

// --- CONSTANTS ---
const PLAYER_ID = 'player-human';

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
    const { playPop } = useSound();

    const handleJoinClick = () => {
        if (joinRoomId.trim()) {
            onJoinRoom(joinRoomId.trim().toUpperCase());
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
                        <Button onClick={() => onCreateRoom('DUEL')} className="w-full py-4 text-base font-bold rounded-2xl hover:scale-[1.02] transition-transform">
                            VS DUEL
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
                                />
                                <Button onClick={handleJoinClick} className="px-6 py-3 text-lg font-bold rounded-xl">
                                    GO
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
};


const LobbyScreen: React.FC<{ room: Room; onStartGame: () => void; onSetReady: (isReady: boolean) => void; showToast: (msg: string) => void; }> = ({ room, onStartGame, onSetReady, showToast }) => {
    const player = room.players.find(p => p.id === PLAYER_ID)!;
    const isHost = player.isHost;

    const canStart = room.gameMode === 'DUEL'
        ? room.players.length === 2 && room.players.every(p => p.isReady)
        : (room.players.length > 1 && room.players.every(p => p.isReady));

    const copyLink = () => {
        const url = `${window.location.origin}/room/${room.id}`;
        navigator.clipboard.writeText(url);
        showToast("Room link copied to clipboard!");
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl animate-fadeIn my-auto">
                <Card className="p-4 sm:p-6 shadow-2xl border-t-4 border-t-secondary-accent">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 border-b border-light-subtle-border dark:border-dark-subtle-border pb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-5xl font-black text-secondary-accent dark:text-primary-accent tracking-tight">{room.id}</h2>
                                <Button variant="ghost" onClick={copyLink} className="p-2 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg">
                                    <ClipboardIcon className="w-5 h-5 opacity-60" />
                                </Button>
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-light-text/50 dark:text-dark-text/50 mt-1">Room Code</p>
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest px-4 py-2 rounded-lg bg-secondary-accent/10 text-secondary-accent dark:bg-primary-accent/10 dark:text-primary-accent mt-4 md:mt-0">
                            {room.gameMode === 'DUEL' ? '⚔️ 1v1 Duel' : '🎉 Free For All'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-light-text dark:text-dark-text flex items-center gap-2">
                                Players <span className="bg-light-bg dark:bg-dark-bg px-2 py-0.5 rounded text-sm opacity-60">{room.players.length}/{room.gameMode === 'DUEL' ? 2 : 8}</span>
                            </h3>
                            <div className="space-y-3">
                                {room.players.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-light-bg dark:bg-dark-bg rounded-xl border border-transparent hover:border-light-subtle-border dark:hover:border-dark-subtle-border transition-colors">
                                        <div className="flex items-center gap-3">
                                            <PlayerAvatar player={p} />
                                            <span className="font-bold text-lg text-light-text dark:text-dark-text">{p.name} {p.isHost ? '👑' : ''}</span>
                                        </div>
                                        <span className={`text-xs font-black uppercase tracking-wide px-3 py-1.5 rounded-md ${p.isReady ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-light-card dark:bg-dark-card text-light-text/50 dark:text-dark-text/50'}`}>
                                            {p.isReady ? 'READY' : 'WAITING'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col justify-between">
                            <div className="bg-light-bg/50 dark:bg-dark-bg/30 p-6 rounded-2xl mb-4 border border-light-subtle-border dark:border-dark-subtle-border">
                                <h4 className="font-bold mb-6 text-xs uppercase text-light-text/60 dark:text-dark-text/60 tracking-widest">Match Rules</h4>
                                <SettingsPanel
                                    codeLength={room.settings.codeLength}
                                    setCodeLength={(len) => socketService.updateSettings(room.id, { ...room.settings, codeLength: len })}
                                    allowRepeats={room.settings.allowRepeats}
                                    setAllowRepeats={(allow) => socketService.updateSettings(room.id, { ...room.settings, allowRepeats: allow })}
                                    onCtaClick={onStartGame}
                                    ctaText={canStart ? (room.gameMode === 'DUEL' ? 'Start Duel' : 'Start Game') : 'Waiting for players...'}
                                    isGameInProgress={false}
                                    isHost={isHost}
                                    ctaDisabled={!canStart}
                                />
                            </div>
                            {!isHost && (
                                <Button onClick={() => onSetReady(!player.isReady)} className={`w-full py-4 text-lg rounded-xl shadow-lg transition-transform active:scale-95 ${player.isReady ? 'bg-red-500 hover:bg-red-600 border-red-500' : ''}`}>
                                    {player.isReady ? 'Cancel Ready' : 'Ready Up!'}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const DuelSetupScreen: React.FC<{ room: Room; onSetCode: (code: string) => void; }> = ({ room, onSetCode }) => {
    const player = room.players.find(p => p.id === PLAYER_ID)!;
    const opponent = room.players.find(p => p.id !== PLAYER_ID);
    const { playPop } = useSound();

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
                            {opponent?.secretCode ? "Opponent is ready. Starting..." : "Waiting for opponent..."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6">
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


const GameScreen: React.FC<{ room: Room; onSubmitGuess: (guess: string) => void; onInvalidGuess: (message: string) => void; }> = ({ room, onSubmitGuess, onInvalidGuess }) => {
    const player = room.players.find(p => p.id === PLAYER_ID)!;
    const isGameOver = room.gameState === GameState.Won;

    const allGuessesSorted = useMemo(() =>
        room.players.flatMap(p => p.guesses).sort((a, b) => b.id - a.id)
        , [room.players]);

    const opponent = room.gameMode === 'DUEL' ? room.players.find(p => p.id === player.opponentId) : null;
    const yourGuesses = player.guesses.slice().sort((a, b) => b.id - a.id);
    const maxGuesses = Math.max(10, player.guesses.length, opponent?.guesses.length ?? 0);

    return (
        <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 p-2 lg:p-6 animate-fadeIn overflow-hidden">

            {room.gameMode === 'DUEL' && opponent && (
                <div className="lg:col-span-12 flex-shrink-0">
                    <Card className="p-4 shadow-lg border-l-4 border-l-secondary-accent">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex-1 w-full">
                                <ProgressBar value={player.guesses.length} max={maxGuesses} label="You" />
                            </div>
                            <div className="text-2xl font-black text-secondary-accent dark:text-primary-accent italic">VS</div>
                            <div className="flex-1 w-full">
                                <ProgressBar value={opponent.guesses.length} max={maxGuesses} label={opponent.name} />
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- History --- */}
            <div className="hidden lg:flex lg:col-span-3 flex-col h-full min-h-0">
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
            <div className="flex-1 lg:col-span-6 flex flex-col h-full min-h-0 order-first lg:order-none">
                <Card className="flex-1 p-4 lg:p-8 flex flex-col relative shadow-2xl bg-white dark:bg-dark-card border border-light-subtle-border dark:border-dark-subtle-border overflow-y-auto">
                    {/* Timer & Header */}
                    <div className="flex justify-between items-center mb-8 lg:mb-12">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black text-secondary-accent dark:text-primary-accent tracking-widest uppercase">
                                {room.gameMode === 'DUEL' ? `TARGET: ${opponent?.name}` : "CODE BREAKER"}
                            </h2>
                            <div className="h-1 w-8 bg-secondary-accent/30 dark:bg-primary-accent/30 rounded-full mt-1"></div>
                        </div>
                        <GameTimer isPlaying={!isGameOver} />
                    </div>

                    <div className="my-auto w-full flex flex-col items-center">
                        <GameBoard
                            codeLength={room.settings.codeLength}
                            onSubmitGuess={onSubmitGuess}
                            onInvalidGuess={onInvalidGuess}
                            isGameWon={isGameOver}
                            allowRepeats={room.settings.allowRepeats}
                        />
                    </div>
                </Card>
            </div>

            {/* --- Live Feed --- */}
            <div className="hidden lg:flex lg:col-span-3 flex-col h-full min-h-0">
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
                            allGuessesSorted.length > 0 ? allGuessesSorted.map((guess, index) => (
                                <GuessRow key={`feed-${guess.playerId}-${guess.id}-${index}`} guess={guess} showPlayerName={true} />
                            )) : <div className="h-full flex items-center justify-center opacity-40 font-medium">No activity yet...</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* --- Mobile History (Compact) --- */}
            <div className="lg:hidden flex flex-col gap-3 mt-1 pb-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-black text-secondary-accent dark:text-primary-accent uppercase text-xs tracking-wider">History ({yourGuesses.length})</h3>
                </div>
                {yourGuesses.length > 0 ? yourGuesses.slice(0, 5).map((guess, index) => (
                    <GuessRow key={`mob-${index}`} guess={guess} />
                )) : (
                    <Card className="p-4 text-center text-light-text/50 dark:text-dark-text/50 border-dashed text-sm">
                        <p>Enter your first code above</p>
                    </Card>
                )}
            </div>
        </div>
    );
};


// --- MAIN APP ---

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [screen, setScreen] = useState<Screen>('landing');

    const [room, setRoom] = useState<Room | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isRestarting, setIsRestarting] = useState(false);
    const [showRestartConfirm, setShowRestartConfirm] = useState(false);

    const { isMuted, toggleMute, speak, isTTSSupported } = useTTS();
    const { playWin, playPop, playClick } = useSound();

    const showToast = (message: string, type: 'info' | 'error' = 'info') => {
        setToast({ id: Date.now(), message, type });
    };

    const resetToLanding = useCallback(() => {
        setRoom(null);
        setScreen('landing');
        window.history.pushState({}, '', '/');
        playClick();
    }, [playClick]);

    const handleRoomUpdate = useCallback((newRoom: Room) => {
        setRoom(newRoom);
        if (newRoom.id !== 'singleplayer' && window.location.pathname !== `/room/${newRoom.id}`) {
            window.history.pushState({}, '', `/room/${newRoom.id}`);
        }

        if (newRoom.gameState === GameState.Lobby) {
            setScreen('lobby');
        } else if (newRoom.gameState === GameState.Playing) {
            if (newRoom.gameMode === 'DUEL') {
                const player = newRoom.players.find(p => p.id === PLAYER_ID)!;
                if (!player.secretCode) {
                    setScreen('duel-setup');
                } else {
                    setScreen('game');
                }
            } else {
                setScreen('game');
            }
        }
    }, []);

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
                if (winner?.id === PLAYER_ID) {
                    playWin();
                }
                const winMessage = winner?.id === PLAYER_ID ? "Congratulations! You cracked the code!" : `${winner?.name} cracked the code!`;
                speak(winMessage);
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
            socketService.joinRoom(roomId);
        }

    }, [handleRoomUpdate, resetToLanding, speak, handleGameStart, playWin]);

    const handleCreateRoom = useCallback((gameMode: GameMode) => {
        if (gameMode === 'SINGLE') {
            const newRoom: Room = {
                id: 'singleplayer',
                players: [{ id: PLAYER_ID, name: 'You', isHost: true, isReady: true, guesses: [] }],
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
            socketService.createRoom(gameMode);
        }
    }, []);

    const handleJoinRoom = (roomId: string) => {
        if (roomId) {
            socketService.joinRoom(roomId);
        }
    };

    const handleSubmitGuess = (guessCode: string) => {
        if (!room) return;
        if (room.gameMode === 'SINGLE') {
            const { hits, pseudoHits } = calculateFeedback(guessCode, room.secretCode);
            const feedbackMessage = generateFeedbackMessage(hits, pseudoHits, room.settings.codeLength);
            const newGuess = { id: room.players[0].guesses.length + 1, code: guessCode, hits, pseudoHits, feedbackMessage, playerId: PLAYER_ID, playerName: 'You' };

            const updatedPlayer = { ...room.players[0], guesses: [...room.players[0].guesses, newGuess] };
            const newGameState = hits === room.settings.codeLength ? GameState.Won : GameState.Playing;

            setRoom({ ...room, players: [updatedPlayer], gameState: newGameState });
            speak(feedbackMessage);
            if (newGameState === GameState.Won) {
                speak("Congratulations! You cracked the code!");
                playWin(); // Trigger visuals handled in ResultModal
            }
        } else {
            socketService.submitGuess(room.id, PLAYER_ID, guessCode);
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
                <div className="flex-shrink-0 lg:flex-1 lg:col-span-8 flex flex-col gap-4 min-h-min lg:h-full lg:justify-center">
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
                <div className="hidden lg:flex lg:col-span-4 flex-col gap-6 h-full min-h-0">
                    <Card className="p-6 bg-white dark:bg-dark-card shadow-lg border border-light-subtle-border dark:border-dark-subtle-border">
                        <h3 className="font-black mb-4 text-lg text-light-text dark:text-dark-text uppercase tracking-widest">Settings</h3>
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
                    </Card>

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
                    onStartGame={() => socketService.startGame(room.id)}
                    onSetReady={(isReady) => socketService.setReady(room.id, PLAYER_ID, isReady)}
                    showToast={showToast}
                />;
            case 'duel-setup':
                return <DuelSetupScreen
                    room={room}
                    onSetCode={(code) => socketService.setDuelCode(room.id, PLAYER_ID, code)}
                />;
            case 'game':
                return room.gameMode === 'SINGLE' ? renderSinglePlayerGame() : (
                    <GameScreen
                        room={room}
                        onSubmitGuess={handleSubmitGuess}
                        onInvalidGuess={(msg) => showToast(msg, 'error')}
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
            <ResultModal room={room} playerId={PLAYER_ID} onPlayAgain={room?.gameMode === 'SINGLE' ? () => handleCreateRoom('SINGLE') : resetToLanding} />
            <Toast toast={toast} onDismiss={() => setToast(null)} />

            <header className="w-full flex-shrink-0 px-4 py-3 lg:px-8 lg:py-4 flex justify-between items-center border-b border-light-subtle-border dark:border-dark-subtle-border bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl z-20 shadow-sm dark:shadow-none sticky top-0">
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity group" onClick={resetToLanding}>
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
