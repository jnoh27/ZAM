import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft } from 'lucide-react';

interface SoundwavesProps {
    onBack: () => void;
}

const NOTES_LIST = [
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'
];

export const Soundwaves: React.FC<SoundwavesProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const synthRef = useRef<Tone.Synth | null>(null);

    const [activeNote, setActiveNote] = useState<string | null>(null);
    const activeNoteRef = useRef<string | null>(null);

    useEffect(() => {
        const reverb = new Tone.Reverb({ decay: 2, wet: 0.2 }).toDestination();

        const synth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.1, decay: 0.2, sustain: 1, release: 0.5 }
        }).connect(reverb);

        synth.volume.value = -8;
        synthRef.current = synth;

        return () => {
            synth.dispose();
            reverb.dispose();
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    // Canvas animation loop
    useEffect(() => {
        let time = 0;

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

            // Clear Background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            time += 0.016; // Approx 60fps dt

            // Grid definition
            const cols = 40;
            const rows = 20;
            const spacingX = width / cols;
            const spacingY = height / rows;

            // Wave parameters
            const isPlaying = activeNoteRef.current !== null;
            let visualFreq = 0;
            let visualSpeed = 0;

            if (isPlaying && activeNoteRef.current) {
                // Map MIDI note to visual parameters
                const midi = Tone.Frequency(activeNoteRef.current).toMidi();
                // Let C4 (60) be base line
                const semitonesFromC4 = midi - 60;

                // Higher notes -> shorter wavelength (more waves on screen) and faster speed
                visualFreq = 2 + (semitonesFromC4 * 0.3); // Number of wave cycles visible
                visualSpeed = 5 + (semitonesFromC4 * 0.5); // Radians per second
            }

            const amplitude = isPlaying ? spacingX * 0.8 : 0; // Max horizontal displacement

            ctx.fillStyle = '#4285F4';

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const originalX = (c + 0.5) * spacingX;
                    const originalY = (r + 0.5) * spacingY;

                    // Longitudinal wave formula: displacement in x is a sine wave
                    // of x position and time
                    let x = originalX;
                    const y = originalY;

                    if (isPlaying) {
                        // k is wave number
                        const k = (Math.PI * 2 * visualFreq) / width;
                        // omega is angular frequency
                        const omega = visualSpeed;

                        // displacement equation
                        const displacement = amplitude * Math.sin(k * originalX - omega * time);
                        x += displacement;
                    }

                    // Pulse size slightly based on compression
                    let radius = 3;
                    if (isPlaying) {
                        // Derivative of displacement determines compression density
                        // Math.cos(k * x - omega * t)
                        const k = (Math.PI * 2 * visualFreq) / width;
                        const omega = visualSpeed;
                        const compression = Math.cos(k * originalX - omega * time); // -1 to 1

                        // Increase radius where dots are grouped together (compression)
                        radius = 2.5 - (compression * 1.5);
                    }

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationRef.current);
    }, []);

    const handleNoteDown = async (note: string) => {
        await Tone.start();
        setActiveNote(note);
        activeNoteRef.current = note;
        if (synthRef.current) {
            synthRef.current.triggerAttack(note);
        }
    };

    const handleNoteUp = () => {
        setActiveNote(null);
        activeNoteRef.current = null;
        if (synthRef.current) {
            synthRef.current.triggerRelease();
        }
    };

    const renderPianoKeys = () => {
        const naturals = NOTES_LIST.filter(n => !n.includes('#'));
        const keyWidth = 100 / naturals.length;

        let naturalIndex = 0;

        return NOTES_LIST.map((note) => {
            const isBlack = note.includes('#');
            const isActive = activeNote === note;

            if (!isBlack) {
                const leftPos = naturalIndex * keyWidth;
                naturalIndex++;

                return (
                    <div
                        key={note}
                        onPointerDown={(e) => { e.preventDefault(); handleNoteDown(note); }}
                        onPointerUp={(e) => { e.preventDefault(); handleNoteUp(); }}
                        onPointerLeave={(e) => { if (isActive) handleNoteUp(); }}
                        className={`
                            absolute bottom-0 h-full border-r border-[#E0E0E0] cursor-pointer shadow-sm select-none touch-none
                            transition-colors duration-75 flex flex-col justify-end items-center pb-8
                            ${isActive ? 'bg-[#4285F4]' : 'bg-white hover:bg-slate-50'}
                        `}
                        style={{ left: `${leftPos}%`, width: `${keyWidth}%` }}
                    >
                        <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                            {note.replace(/\\d/, '')}
                        </span>
                    </div>
                );
            } else {
                const prevNaturalLeft = (naturalIndex - 1) * keyWidth;
                const blackKeyWidth = keyWidth * 0.6;
                const leftPos = prevNaturalLeft + keyWidth - (blackKeyWidth / 2);

                return (
                    <div
                        key={note}
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleNoteDown(note); }}
                        onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); handleNoteUp(); }}
                        onPointerLeave={(e) => { if (isActive) handleNoteUp(); }}
                        className={`
                            absolute top-0 h-[60%] rounded-b-lg cursor-pointer shadow-md z-10 select-none touch-none
                            transition-colors duration-75
                            ${isActive ? 'bg-[#4285F4]' : 'bg-[#212121] hover:bg-[#333]'}
                        `}
                        style={{ left: `${leftPos}%`, width: `${blackKeyWidth}%` }}
                    />
                );
            }
        });
    };

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <header className="absolute top-0 left-0 w-full p-4 flex justify-between z-20 pointer-events-none">
                <button onClick={() => { Tone.Transport.stop(); onBack(); }} className="p-3 bg-white/80 backdrop-blur rounded-full pointer-events-auto hover:bg-slate-200 transition-colors border shadow-sm">
                    <ArrowLeft size={32} strokeWidth={3} className="text-[#5F6368]" />
                </button>
                <h1 className="text-3xl font-black text-[#202124] drop-shadow-sm">사운드 웨이브</h1>
            </header>

            {/* Visualizer Canvas */}
            <div ref={containerRef} className="flex-1 w-full bg-white relative">
                <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            {/* Piano Keyboard Area */}
            <div className="h-[30vh] w-full relative bg-[#212121] border-t-[12px] border-[#212121] select-none touch-none shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-10">
                {renderPianoKeys()}
            </div>
        </div>
    );
};
