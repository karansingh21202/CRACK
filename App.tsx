import React, { useState, useEffect, useCallback } from 'react';
import { ConfirmationModal } from './components/ConfirmationModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { Logo } from './components/Logo';
import { QuitGameModal } from './components/QuitGameModal';
import { MoonIcon, SunIcon, SpeakerOnIcon, SpeakerOffIcon, InfoIcon, DoorExitIcon } from './components/Icon';
import { Toast, ToastMessage } from './components/Toast';
import { useTTS } from './hooks/useTTS';
import { useSound } from './hooks/useSound';
import { generateSecretCode, calculateFeedback, generateFeedbackMessage } from './utils/feedback';
import { calculateScore } from './server/src/utils/scoring';
import type { Theme, Screen, Room, GameMode } from './types';
import { GameState } from './types';
import { socketService } from './services/socketService';
import { DuelHeaderStyle } from './components/DuelHeader';
import { NameInput } from './components/NameInput';

// Screens
import { LandingScreen } from './components/screens/LandingScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { DuelSetupScreen } from './components/screens/DuelSetupScreen';
import { GameScreen } from './components/screens/GameScreen';
import { ResultModal } from './components/ResultModal';

// Components required for Single Player mode (which is still rendered in App.tsx)
import { GameBoard } from './components/GameBoard';
import { GuessRow } from './components/GuessRow';
import { SettingsPanel } from './components/SettingsPanel';
import { GameTimer } from './components/GameTimer';
import { ClipboardIcon } from './components/Icon';

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
