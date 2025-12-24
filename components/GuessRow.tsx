import React from 'react';
import { Guess } from '../types';
import { CheckCircleIcon, DotIcon } from './Icon';

interface GuessRowProps {
    guess: Guess;
    showPlayerName?: boolean;
}

const FeedbackChip: React.FC<{ icon: React.ReactNode; count: number; delay?: string }> = ({ icon, count, delay }) => (
    <div
        className="flex items-center gap-1.5 px-2 py-0.5 lg:px-3 lg:py-1 bg-secondary-accent/10 dark:bg-primary-accent/10 border border-secondary-accent/30 dark:border-primary-accent/30 rounded-full text-secondary-accent dark:text-primary-accent opacity-0 animate-popIn"
        style={{ animationDelay: delay || '0ms' }}
    >
        {icon}
        <span className="font-mono text-xs lg:text-sm font-medium">{count}</span>
    </div>
);

export const GuessRow: React.FC<GuessRowProps> = ({ guess, showPlayerName = false }) => {
    return (
        <div className="flex items-center justify-between p-2 lg:p-3 bg-light-card/50 dark:bg-dark-card/50 rounded-lg animate-fadeIn border border-transparent hover:border-light-subtle-border dark:hover:border-dark-subtle-border transition-colors shadow-sm">
            <div className="flex items-center gap-2 lg:gap-3">
                <div className="flex flex-col text-left">
                    <span className="text-xs lg:text-sm font-semibold text-light-text/60 dark:text-dark-text/60 w-6 lg:w-8">#{guess.id}</span>
                    {showPlayerName && <span className="text-[10px] lg:text-xs font-bold text-secondary-accent dark:text-primary-accent">{guess.playerName}</span>}
                </div>
                <div className="flex gap-1 lg:gap-1.5">
                    {guess.code.split('').map((digit, i) => (
                        <div key={i} className="w-5 h-5 lg:w-10 lg:h-10 flex items-center justify-center font-mono text-xs sm:text-sm lg:text-2xl bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text rounded-md shadow-sm border border-light-subtle-border/50 dark:border-dark-subtle-border/50">
                            {digit}
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-right">
                <div className="flex items-center gap-2">
                    {guess.hits > 0 && (
                        <FeedbackChip
                            icon={<CheckCircleIcon className="w-4 h-4 lg:w-5 lg:h-5" />}
                            count={guess.hits}
                            delay="150ms"
                        />
                    )}
                    {guess.pseudoHits > 0 && (
                        <FeedbackChip
                            icon={<DotIcon className="w-4 h-4 lg:w-5 lg:h-5 opacity-70" />}
                            count={guess.pseudoHits}
                            delay={guess.hits > 0 ? "300ms" : "150ms"}
                        />
                    )}
                </div>
                <p
                    className="text-xs lg:text-sm text-light-text/80 dark:text-dark-text/80 opacity-0 animate-fadeIn"
                    style={{ animationDelay: '400ms' }}
                >
                    {guess.feedbackMessage}
                </p>
            </div>
        </div>
    );
};