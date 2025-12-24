import React from 'react';

interface ProgressBarProps {
    value: number;
    max: number;
    label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, label }) => (
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
