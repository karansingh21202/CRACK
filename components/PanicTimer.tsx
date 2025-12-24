import React, { useState, useEffect } from 'react';

interface PanicTimerProps {
    startTime?: number;
}

export const PanicTimer: React.FC<PanicTimerProps> = ({ startTime }) => {
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
