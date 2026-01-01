import React, { useState, useEffect, useRef } from 'react';

interface PanicTimerProps {
    startTime?: number;
}

export const PanicTimer: React.FC<PanicTimerProps> = ({ startTime }) => {
    const [timeLeft, setTimeLeft] = useState(30);
    // Store the initial startTime to prevent timer jumps on room updates
    const initialStartTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (!startTime) return;

        // Only set the initial start time once
        if (initialStartTimeRef.current === null) {
            initialStartTimeRef.current = startTime;
        }

        const frozenStartTime = initialStartTimeRef.current;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - frozenStartTime) / 1000);
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
