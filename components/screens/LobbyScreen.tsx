import React from 'react';
import { Room } from '@/types';
import { Card } from '../Card';
import { Button } from '../Button';
import {
    CopyIcon, TargetIcon, PartyIcon, DoorExitIcon, CrownIcon,
    TrophyIcon, CheckCircleIcon, ZapIcon
} from '../Icon';
import { SettingsPanel } from '../SettingsPanel';
import { socketService } from '../../services/socketService';

interface LobbyScreenProps {
    room: Room;
    playerId: string;
    onStartGame: () => void;
    onSetReady: (isReady: boolean) => void;
    showToast: (msg: string) => void;
    onLeave: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ room, playerId, onStartGame, onSetReady, showToast, onLeave }) => {
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
        <div className="w-full h-full flex items-center justify-center p-4 pb-safe overflow-y-auto bg-gray-50 dark:bg-[#09090b] relative transition-colors duration-500">
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
                <Card className="p-4 sm:p-6 md:p-8 shadow-2xl bg-white dark:bg-[#13111a]/90 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl transition-colors duration-300">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 md:mb-10 border-b border-gray-100 dark:border-white/5 pb-6 md:pb-8">
                        <div>
                            <div className="flex items-center gap-2 md:gap-3 group">
                                <h2
                                    className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-indigo-600 dark:from-white dark:to-white/50 tracking-tighter cursor-pointer hover:scale-105 transition-all duration-300 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                    onClick={copyCode}
                                    title="Click to copy code"
                                >
                                    {room.id}
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={copyCode}
                                    className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 border border-purple-200/50 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30 dark:hover:shadow-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                                    title="Copy room code"
                                >
                                    <CopyIcon className="w-4 h-4 md:w-5 md:h-5" />
                                </Button>
                            </div>
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/30 mt-2 md:mt-3 ml-1">Room Code</p>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-0">
                            <span className="px-3 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm">
                                {room.gameMode === 'DUEL' ? <><TargetIcon className="w-3 h-3 md:w-4 md:h-4" /> 1v1 Duel</> : <><PartyIcon className="w-3 h-3 md:w-4 md:h-4" /> Party FFA</>}
                            </span>
                            <Button
                                variant="ghost"
                                onClick={onLeave}
                                className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20 border border-red-200/50 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 dark:hover:shadow-red-500/50 transition-all duration-300 backdrop-blur-sm"
                                title="Leave Room"
                            >
                                <DoorExitIcon className="w-4 h-4 md:w-5 md:h-5" />
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
