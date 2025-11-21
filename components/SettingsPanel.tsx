import React from 'react';
import { useSound } from '../hooks/useSound';

interface SettingsPanelProps {
  codeLength: number;
  setCodeLength: (length: number) => void;
  allowRepeats: boolean;
  setAllowRepeats: (allow: boolean) => void;
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
        className={`flex-1 sm:flex-none px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm font-semibold rounded-lg transition-all border active:scale-95 ${
            isActive 
                ? 'bg-secondary-accent text-white border-secondary-accent shadow-md shadow-secondary-accent/20 dark:bg-primary-accent/20 dark:text-primary-accent dark:border-primary-accent dark:shadow-none' 
                : 'bg-white dark:bg-transparent border-light-subtle-border dark:border-transparent text-light-text dark:text-dark-text hover:bg-gray-50 dark:hover:bg-primary-accent/10 hover:border-secondary-accent/50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {children}
    </button>
)};


export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    codeLength, setCodeLength, allowRepeats, setAllowRepeats, onCtaClick, ctaText, isGameInProgress, isHost, ctaDisabled = false
}) => {
  const controlsDisabled = isGameInProgress || !isHost;
  const { playClick } = useSound();

  const handleCtaClick = () => {
      playClick();
      onCtaClick();
  };
    
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
             <span className="text-sm font-bold text-light-text/70 dark:text-dark-text/70 uppercase tracking-wide">Code Length</span>
             <div className="flex gap-2 w-full sm:w-auto">
                {[3, 4, 5].map(len => (
                    <SettingButton key={len} onClick={() => setCodeLength(len)} isActive={codeLength === len} disabled={controlsDisabled}>
                        {len}
                    </SettingButton>
                ))}
            </div>
        </div>

         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
             <span className="text-sm font-bold text-light-text/70 dark:text-dark-text/70 uppercase tracking-wide">Repeats</span>
             <div className="flex gap-2 w-full sm:w-auto">
                <SettingButton onClick={() => setAllowRepeats(true)} isActive={allowRepeats} disabled={controlsDisabled}>On</SettingButton>
                <SettingButton onClick={() => setAllowRepeats(false)} isActive={!allowRepeats} disabled={controlsDisabled}>Off</SettingButton>
            </div>
        </div>

        {isHost && (
            <div className="mt-2 pt-2 border-t border-light-subtle-border dark:border-dark-subtle-border/30">
                <button
                    onClick={handleCtaClick}
                    disabled={isGameInProgress || ctaDisabled}
                    className="w-full py-3 text-base font-bold rounded-xl bg-secondary-accent dark:bg-primary-accent text-white dark:text-dark-bg hover:opacity-90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                >
                    {ctaText}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};