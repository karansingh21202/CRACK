import React from 'react';
import { useSound } from '../hooks/useSound';
import { Card } from './Card';
import { Button } from './Button.tsx';
import { SettingsIcon, ZapIcon } from './Icon';

interface SettingsPanelProps {
    codeLength: number;
    setCodeLength: (length: number) => void;
    allowRepeats: boolean;
    setAllowRepeats: (allow: boolean) => void;
    duelModeType?: 'PVP' | 'CPU';
    setDuelModeType?: (type: 'PVP' | 'CPU') => void;
    onCtaClick: () => void;
    ctaText: string;
    isGameInProgress: boolean;
    isHost: boolean;
    ctaDisabled?: boolean;
}

const SettingButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode; disabled?: boolean }> =
    ({ onClick, isActive, children, disabled }) => {
        const { playClick } = useSound();

        const handleClick = () => {
            playClick();
            onClick();
        };

        return (
            <button
                onClick={handleClick}
                disabled={disabled}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-3 sm:py-2.5 text-sm font-bold rounded-lg transition-all border active:scale-95 ${isActive
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500 dark:shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 dark:bg-transparent dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5 dark:hover:border-white/20'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
                {children}
            </button>
        )
    };


export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    codeLength, setCodeLength, allowRepeats, setAllowRepeats, duelModeType, setDuelModeType, onCtaClick, ctaText, isGameInProgress, isHost, ctaDisabled = false
}) => {
    const controlsDisabled = isGameInProgress || !isHost;
    const { playClick } = useSound();

    return (
        <div className="w-full">
            <Card className="p-6 bg-white dark:bg-[#1a1625] border border-gray-200 dark:border-purple-500/30 shadow-xl dark:shadow-[0_0_30px_rgba(139,92,246,0.15)] animate-fadeIn relative overflow-hidden rounded-2xl">
                {/* Top Shine Effect (Dark Mode) */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 dark:opacity-50"></div>

                <h2 className="text-xs font-bold uppercase tracking-widest mb-6 text-gray-500 dark:text-white/80 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" /> Match Rules
                </h2>

                <div className="space-y-4 mb-8">
                    {/* Game Settings Group */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400/80 mb-2">Game Settings</h3>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-xs font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide">Code Length</span>
                            <div className="flex gap-2 w-full sm:w-auto">
                                {[3, 4, 5, 6].map(len => (
                                    <SettingButton
                                        key={len}
                                        onClick={() => setCodeLength(len)}
                                        isActive={codeLength === len}
                                        disabled={controlsDisabled}
                                    >
                                        {len}
                                    </SettingButton>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-xs font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide">Allow Repeats</span>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <SettingButton onClick={() => setAllowRepeats(true)} isActive={allowRepeats} disabled={controlsDisabled}>On</SettingButton>
                                <SettingButton onClick={() => setAllowRepeats(false)} isActive={!allowRepeats} disabled={controlsDisabled}>Off</SettingButton>
                            </div>
                        </div>

                        {duelModeType && setDuelModeType && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span className="text-xs font-bold text-gray-600 dark:text-white/60 uppercase tracking-wide">Game Type</span>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <SettingButton onClick={() => setDuelModeType('PVP')} isActive={duelModeType === 'PVP'} disabled={controlsDisabled}>PvP (Set Code)</SettingButton>
                                    <SettingButton onClick={() => setDuelModeType('CPU')} isActive={duelModeType === 'CPU'} disabled={controlsDisabled}>CPU (Race)</SettingButton>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {isHost && (
                <div className="mt-4">
                    <Button
                        onClick={() => { playClick(); onCtaClick(); }}
                        className="w-full py-4 text-lg font-bold tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 bg-[#cba6f7] hover:bg-[#dcc4fa] border-2 border-[#a878d9] rounded-xl text-white flex items-center justify-center gap-2"
                        disabled={ctaDisabled}
                    >
                        <ZapIcon className="w-5 h-5" />
                        {ctaText}
                    </Button>
                </div>
            )}
        </div>
    );
};