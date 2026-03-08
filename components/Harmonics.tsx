import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft } from 'lucide-react';

interface HarmonicsProps {
    onBack: () => void;
}

const COLORS = ['#EA4335', '#FBBC04', '#34A853', '#4285F4', '#AA00FF', '#FF7043'];

export const Harmonics: React.FC<HarmonicsProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const synthRef = useRef<Tone.PolySynth | null>(null);

    // Fundamental Frequency (C3)
    const baseFreq = Tone.Frequency("C3").toFrequency();

    // State for each harmonic
    const wavesRef = useRef(Array.from({ length: 6 }, (_, i) => ({
        n: i + 1, // Number of cycles (1 to 6)
        freq: baseFreq * (i + 1), // Frequency in Hz
        amp: 0, // Current animation amplitude
        phase: 0, // Animation phase
        lastTriggerTime: 0
    })));

    const prevMouse = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
        const delay = new Tone.FeedbackDelay("8n", 0.1).connect(reverb);

        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1.5 }
        }).connect(delay).connect(reverb);

        synth.volume.value = -10;
        synthRef.current = synth;

        return () => {
            synth.dispose();
            reverb.dispose();
            delay.dispose();
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    useEffect(() => {
        const render = () => {
            if (!canvasRef.current || !containerRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Resize
            const dpr = window.devicePixelRatio || 1;
            const rect = containerRef.current.getBoundingClientRect();
            if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
            }

            const width = rect.width;
            const height = rect.height;

            // Background
            ctx.fillStyle = '#111827';
            ctx.fillRect(0, 0, width, height);

            const numWaves = wavesRef.current.length;
            const spacing = height / (numWaves + 1);

            wavesRef.current.forEach((wave, i) => {
                const yBase = spacing * (i + 1);

                // Physics Step
                if (wave.amp > 0.5) {
                    wave.amp *= 0.95; // Decay
                    wave.phase += 0.2 + (i * 0.1); // Oscillation speed
                } else {
                    wave.amp = 0;
                    wave.phase = 0;
                }

                ctx.beginPath();

                // Glow settings
                if (wave.amp > 5) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = COLORS[i];
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 4 + (wave.amp * 0.05);
                } else {
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = COLORS[i];
                    ctx.strokeStyle = COLORS[i];
                    ctx.lineWidth = 3;
                }

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                const segments = 100;
                for (let j = 0; j <= segments; j++) {
                    const x = (width / segments) * j;

                    // Sine calculation: pinning at both ends means sin(pi * x / width * n)
                    // The oscillation changes the amplitude
                    const positionInCycle = (Math.PI * wave.n * x) / width;
                    const envelope = Math.sin(positionInCycle);

                    // We modulate the amplitude over time
                    const vibration = Math.sin(wave.phase) * wave.amp * envelope;

                    if (j === 0) {
                        ctx.moveTo(x, yBase + vibration);
                    } else {
                        ctx.lineTo(x, yBase + vibration);
                    }
                }

                ctx.stroke();
                ctx.shadowBlur = 0; // Reset
            });

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationRef.current);
    }, []);

    const triggerWave = async (index: number, velocity: number) => {
        const wave = wavesRef.current[index];
        const now = Date.now();

        // Debounce
        if (now - wave.lastTriggerTime < 100) return;
        wave.lastTriggerTime = now;

        await Tone.start();

        // Visual amplitude
        wave.amp = Math.min(80, Math.abs(velocity) * 2 + 40);
        wave.phase = 0;

        // Audio trigger
        if (synthRef.current) {
            synthRef.current.triggerAttackRelease(wave.freq, "4n");
        }
    };

    const checkCollision = (x: number, y: number, px: number, py: number) => {
        if (!containerRef.current) return;
        const height = containerRef.current.offsetHeight;
        const spacing = height / (wavesRef.current.length + 1);

        wavesRef.current.forEach((wave, i) => {
            const waveY = spacing * (i + 1);

            // Check if Y crossed
            if ((py < waveY && y >= waveY) || (py > waveY && y <= waveY)) {
                const velocity = Math.abs(y - py);
                triggerWave(i, velocity);
            }
        });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        e.preventDefault();
        const rect = containerRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (prevMouse.current) {
            checkCollision(x, y, prevMouse.current.x, prevMouse.current.y);
        }
        prevMouse.current = { x, y };
    };

    const handlePointerLeave = () => {
        prevMouse.current = null;
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-900">
            <header className="absolute top-0 left-0 w-full p-4 flex justify-between z-10 pointer-events-none">
                <button onClick={() => { Tone.Transport.stop(); onBack(); }} className="p-3 bg-white/10 backdrop-blur rounded-full pointer-events-auto hover:bg-white/20 transition-colors">
                    <ArrowLeft size={32} strokeWidth={3} className="text-white" />
                </button>
                <h1 className="text-3xl font-black text-white/90 drop-shadow-md">배음 (Harmonics)</h1>
            </header>

            <div
                ref={containerRef}
                className="flex-1 cursor-crosshair touch-none relative"
                style={{ touchAction: 'none' }}
                onPointerMove={handlePointerMove}
                onPointerDown={(e) => {
                    const rect = containerRef.current!.getBoundingClientRect();
                    prevMouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                }}
                onPointerUp={handlePointerLeave}
                onPointerLeave={handlePointerLeave}
            >
                <canvas ref={canvasRef} className="w-full h-full block" />

                <div className="absolute bottom-10 w-full text-center pointer-events-none">
                    <p className="text-white/30 font-bold text-xl">위아래로 스와이프하여 파동을 연주해보세요</p>
                </div>
            </div>
        </div>
    );
};
