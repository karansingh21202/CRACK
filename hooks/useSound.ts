import { useCallback, useEffect, useRef } from 'react';

export const useSound = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    useEffect(() => {
        // Lazy initialization of AudioContext
        const initAudio = () => {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    audioContextRef.current = new AudioContext();
                    // Create a master gain node to control volume globally if needed
                    gainNodeRef.current = audioContextRef.current.createGain();
                    gainNodeRef.current.connect(audioContextRef.current.destination);
                }
            }
            // Resume context if suspended (browser policy)
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume().catch(e => console.error(e));
            }
        };

        const handleInteraction = () => {
            initAudio();
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            // We generally don't close the context as it might be reused, 
            // but in a real cleanup we might if the component unmounts permanently.
        };
    }, []);

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, startTimeOffset: number = 0, volume: number = 0.1) => {
        if (!audioContextRef.current || !gainNodeRef.current) return;

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTimeOffset);

        // Envelope to avoid clicking
        gain.gain.setValueAtTime(0, ctx.currentTime + startTimeOffset);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startTimeOffset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTimeOffset + duration);

        osc.connect(gain);
        gain.connect(gainNodeRef.current);

        osc.start(ctx.currentTime + startTimeOffset);
        osc.stop(ctx.currentTime + startTimeOffset + duration + 0.1); // Stop slightly after to ensure decay finishes
    }, []);

    const playClick = useCallback(() => {
        // High, short blip
        playTone(800, 'sine', 0.05, 0, 0.05);
    }, [playTone]);

    const playPop = useCallback(() => {
        // "Pop" sound for typing
        playTone(600, 'sine', 0.08, 0, 0.08);
    }, [playTone]);

    const playError = useCallback(() => {
        // Discordant "womp womp"
        playTone(150, 'sawtooth', 0.15, 0, 0.1);
        playTone(100, 'sawtooth', 0.3, 0.1, 0.1);
    }, [playTone]);

    const playSuccess = useCallback(() => {
        // Major chord arpeggio
        playTone(440, 'sine', 0.1, 0, 0.1); // A4
        playTone(554, 'sine', 0.1, 0.08, 0.1); // C#5
        playTone(659, 'sine', 0.2, 0.16, 0.1); // E5
    }, [playTone]);

    const playWin = useCallback(() => {
        // Victory fanfare
        const now = 0;
        const vol = 0.1;
        const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.50]; // C C C E G C
        const times = [0, 0.1, 0.2, 0.3, 0.4, 0.6];
        const lens = [0.1, 0.1, 0.1, 0.1, 0.2, 0.8];

        notes.forEach((freq, i) => {
            playTone(freq, 'triangle', lens[i], times[i], vol);
        });
    }, [playTone]);

    const playHover = useCallback(() => {
        // Very soft, high tick
        playTone(1200, 'sine', 0.03, 0, 0.02);
    }, [playTone]);

    return { playClick, playPop, playError, playSuccess, playWin, playHover };
};