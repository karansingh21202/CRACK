import React, { useEffect, useRef } from 'react';

interface FireworksProps {
    duration?: number; // Duration in ms to keep spawning fireworks. If 0, runs indefinitely.
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    color: string;
    decay: number;
}

export const Fireworks: React.FC<FireworksProps> = ({ duration = 5000 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationId: number;
        let spawning = true;
        let fadeOutMode = false;

        // Handle Resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Colors suited for our theme
        const colors = ['#fbbf24', '#f59e0b', '#d97706', '#a855f7', '#ec4899', '#ffffff'];

        const createExplosion = (x: number, y: number) => {
            const particleCount = 50 + Math.random() * 50;
            const color = colors[Math.floor(Math.random() * colors.length)];

            for (let i = 0; i < particleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;

                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    color: color,
                    decay: Math.random() * 0.015 + 0.015
                });
            }
        };

        const loop = () => {
            // Clear with trail effect (faster fadeout when in fadeout mode)
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = fadeOutMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';

            // Spawn new fireworks randomly (only if spawning)
            if (spawning && Math.random() < 0.06) { // ~3-4 per sec
                createExplosion(
                    Math.random() * canvas.width,
                    Math.random() * (canvas.height * 0.6) // Top 60% of screen
                );
            }

            // Update & Draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05; // Gravity
                p.alpha -= p.decay * (fadeOutMode ? 2 : 1); // Faster decay in fadeout mode

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.alpha;
                    ctx.fill();
                }
            }

            ctx.globalAlpha = 1; // Reset alpha

            // If in fadeout mode and no particles left, clear canvas completely
            if (fadeOutMode && particles.length === 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return; // Stop the animation loop
            }

            animationId = requestAnimationFrame(loop);
        };

        loop();

        // Stop spawning after duration, enter fadeout mode
        let timeoutId: NodeJS.Timeout;
        if (duration > 0) {
            timeoutId = setTimeout(() => {
                spawning = false;
                fadeOutMode = true;
            }, duration);
        }

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
            if (timeoutId) clearTimeout(timeoutId);
            // Clear canvas on unmount
            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
    }, [duration]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
        />
    );
};
