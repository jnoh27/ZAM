import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, ChevronLeft, ChevronRight, Music } from 'lucide-react';

interface OscillatorsProps {
    onBack: () => void;
}

type InstrumentType = 'piano' | 'trumpet' | 'bells' | 'violin';

interface InstrumentConfig {
    id: InstrumentType;
    name: string;
    color: string;
    bgColor: string;
    darkColor: string;
}

const INSTRUMENTS: InstrumentConfig[] = [
    { id: 'piano', name: '피아노', color: '#212121', bgColor: '#F5F5F5', darkColor: '#000000' },
    { id: 'violin', name: '바이올린', color: '#8D6E63', bgColor: '#EFEBE9', darkColor: '#5D4037' },
    { id: 'trumpet', name: '트럼펫', color: '#FFB300', bgColor: '#FFF8E1', darkColor: '#F57F17' },
    { id: 'bells', name: '종소리', color: '#7E57C2', bgColor: '#EDE7F6', darkColor: '#512DA8' },
];

export const Oscillators: React.FC<OscillatorsProps> = ({ onBack }) => {
    const [instIndex, setInstIndex] = useState(0);
    const [currentNote, setCurrentNote] = useState('A4');
    const [isPressing, setIsPressing] = useState(false);
    const [touchY, setTouchY] = useState(0.5); // 0 to 1

    const synthRef = useRef<Tone.Sampler | null>(null);
    const lastNoteRef = useRef<string>('');

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const particlesRef = useRef<{ x: number, y: number, size: number, speedX: number, speedY: number, alpha: number, color: string }[]>([]);

    const currentInst = INSTRUMENTS[instIndex];

    const SCALE = [
        'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
        'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
        'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
        'C6'
    ];

    const INSTRUMENT_SAMPLES: Record<InstrumentType, { baseUrl: string, urls: Record<string, string> }> = {
        piano: {
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
            urls: {
                "A3": "A3.mp3",
                "A4": "A4.mp3",
                "A5": "A5.mp3",
                "C4": "C4.mp3",
                "C5": "C5.mp3"
            }
        },
        violin: {
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
            urls: {
                "A3": "A3.mp3",
                "C4": "C4.mp3",
                "E4": "E4.mp3",
                "A4": "A4.mp3",
                "C5": "C5.mp3"
            }
        },
        trumpet: {
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/trumpet/",
            urls: {
                "A3": "A3.mp3",
                "C4": "C4.mp3",
                "F4": "F4.mp3",
                "A5": "A5.mp3"
            }
        },
        bells: {
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/xylophone/",
            urls: {
                "G4": "G4.mp3",
                "C5": "C5.mp3",
                "G5": "G5.mp3",
                "C6": "C6.mp3"
            }
        }
    };

    // --- Audio Setup ---
    useEffect(() => {
        const limiter = new Tone.Limiter(-1).toDestination();
        const reverb = new Tone.JCReverb({ roomSize: 0.4, wet: 0.2 }).connect(limiter);

        const config = INSTRUMENT_SAMPLES[currentInst.id];

        const sampler = new Tone.Sampler({
            urls: config.urls,
            baseUrl: config.baseUrl
        }).connect(reverb);

        sampler.volume.value = -4;
        synthRef.current = sampler;

        return () => {
            if (synthRef.current === sampler) {
                synthRef.current = null;
            }
            sampler.dispose();
            reverb.dispose();
            limiter.dispose();
            cancelAnimationFrame(animationRef.current);
        };
    }, [instIndex]);

    // --- Particle System ---
    useEffect(() => {
        const render = () => {
            if (!canvasRef.current || !containerRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            const rect = containerRef.current.getBoundingClientRect();
            if (canvasRef.current.width !== rect.width * dpr || canvasRef.current.height !== rect.height * dpr) {
                canvasRef.current.width = rect.width * dpr;
                canvasRef.current.height = rect.height * dpr;
                ctx.scale(dpr, dpr);
            }
            const width = rect.width;
            const height = rect.height;

            ctx.clearRect(0, 0, width, height);

            if (isPressing) {
                const spawnY = touchY * height;
                const spawnX = width / 2;
                // Limit spawn rate
                if (Math.random() > 0.5) {
                    particlesRef.current.push({
                        x: spawnX + (Math.random() - 0.5) * 150,
                        y: spawnY + (Math.random() - 0.5) * 50,
                        size: Math.random() * 8 + 4,
                        speedX: (Math.random() - 0.5) * 6,
                        speedY: (Math.random() * -5) - 2,
                        alpha: 1,
                        color: currentInst.id === 'piano' ? '#424242' : currentInst.color
                    });
                }
            }

            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.x += p.speedX;
                p.y += p.speedY;
                p.alpha -= 0.02;
                p.size *= 0.95;

                if (p.alpha <= 0) {
                    particlesRef.current.splice(i, 1);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.alpha;
                    ctx.fill();
                }
            }

            animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationRef.current);
    }, [isPressing, currentInst, touchY]);


    const handlePointerDown = async (e: React.PointerEvent) => {
        e.preventDefault();
        const target = e.currentTarget as Element;
        target.setPointerCapture(e.pointerId);

        setIsPressing(true);

        try {
            await Tone.start();
            if (Tone.context.state !== 'running') await Tone.context.resume();
        } catch (err) {
            console.warn("Audio context start failed", err);
        }

        const note = updatePitch(e.clientY);

        if (synthRef.current && !synthRef.current.disposed) {
            synthRef.current.triggerAttack(note);
            lastNoteRef.current = note;
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        e.preventDefault();
        if (!isPressing) return;
        const note = updatePitch(e.clientY);

        if (synthRef.current && !synthRef.current.disposed) {
            if (note !== lastNoteRef.current) {
                if (lastNoteRef.current) {
                    synthRef.current.triggerRelease(lastNoteRef.current);
                }
                synthRef.current.triggerAttack(note);
                lastNoteRef.current = note;
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.preventDefault();
        setIsPressing(false);
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        if (synthRef.current && !synthRef.current.disposed && lastNoteRef.current) {
            synthRef.current.triggerRelease(lastNoteRef.current);
        }
    };

    const updatePitch = (clientY: number) => {
        const height = window.innerHeight;
        const t = Math.max(0, Math.min(1, clientY / height));

        const numDegrees = SCALE.length;
        const index = Math.floor((1 - t) * numDegrees);
        const clampedIndex = Math.max(0, Math.min(numDegrees - 1, index));

        setTouchY(t);

        const note = SCALE[clampedIndex];
        setCurrentNote(note);
        return note;
    };

    const nextInst = (dir: 1 | -1) => {
        let next = instIndex + dir;
        if (next < 0) next = INSTRUMENTS.length - 1;
        if (next >= INSTRUMENTS.length) next = 0;
        setInstIndex(next);
    };

    // Smoother tilt
    const tiltAngle = (touchY - 0.5) * 30;
    const scale = isPressing ? 1.05 : 1;

    return (
        <div className="w-full h-full flex flex-col bg-[#F8F9FA] overflow-hidden select-none">
            {/* Unified Header */}
            <header className="p-4 border-b flex items-center justify-between bg-white z-20 shadow-sm relative flex-shrink-0 pointer-events-auto">
                <button
                    onClick={(e) => { e.stopPropagation(); onBack(); }}
                    className="p-3 bg-[#E8EAED] rounded-full hover:bg-slate-200 transition-colors"
                >
                    <ArrowLeft size={32} strokeWidth={3} className="text-[#5F6368]" />
                </button>
                <div className="flex items-center gap-3">
                    <Music size={28} fill={currentInst.color} strokeWidth={0} />
                    <h1 className="text-3xl font-black text-[#202124]">악기 탐험</h1>
                </div>
                <div className="w-12"></div>
            </header>

            {/* Experiment Canvas Area */}
            <div
                ref={containerRef}
                className="flex-1 w-full relative overflow-hidden transition-colors duration-500 touch-none flex flex-col items-center justify-center cursor-ns-resize"
                style={{ backgroundColor: currentInst.bgColor, touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

                {/* Instrument Display */}
                <div className="relative z-0 pointer-events-none flex items-center justify-center w-full">
                    <div
                        style={{
                            transform: `scale(${scale}) rotate(${isPressing ? -tiltAngle : 0}deg)`,
                            transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        }}
                        className="relative filter drop-shadow-2xl"
                    >
                        <InstrumentCharacter type={currentInst.id} color={currentInst.color} darkColor={currentInst.darkColor} isPlaying={isPressing} />
                    </div>
                </div>

                {/* Floating Note Badge */}
                {isPressing && (
                    <div className="absolute top-[10%] left-1/2 -translate-x-1/2 pointer-events-none z-10">
                        <div className="bg-white/90 px-8 py-3 rounded-full font-black text-3xl text-[#202124] backdrop-blur shadow-lg animate-bounce flex items-center justify-center min-w-[120px]">
                            <span style={{ color: currentInst.color }}>{currentNote}</span>
                        </div>
                    </div>
                )}

                {/* Discrete Vertical Pitch Guide */}
                <div className="absolute right-8 top-[15%] bottom-[15%] flex flex-col justify-between items-center pointer-events-none opacity-60">
                    {[...SCALE].reverse().map((note, index) => {
                        const isCurrent = currentNote === note && isPressing;
                        return (
                            <div
                                key={index}
                                className={`w-8 h-1.5 rounded-full transition-all duration-100 ${isCurrent ? 'scale-[2.5] opacity-100 shadow-lg' : 'scale-100 opacity-40 shadow-none'}`}
                                style={{
                                    backgroundColor: isCurrent ? currentInst.color : '#8A94A0'
                                }}
                            />
                        );
                    })}
                </div>

                {!isPressing && (
                    <div className="absolute top-[80%] left-1/2 -translate-x-1/2 pointer-events-none text-xl font-bold text-[#5F6368] opacity-50 bg-white/50 px-6 py-2 rounded-full backdrop-blur-sm shadow-sm whitespace-nowrap animate-pulse">
                        위아래로 드래그 해보세요
                    </div>
                )}
            </div>

            {/* Navigation Drawer matching other UI */}
            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-center gap-12 relative z-20 flex-shrink-0 pointer-events-auto shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <button
                    onClick={(e) => { e.stopPropagation(); nextInst(-1); }}
                    className="p-4 bg-white rounded-full shadow-md text-[#5F6368] active:scale-95 transition-transform hover:bg-slate-50 border border-slate-200"
                >
                    <ChevronLeft size={36} strokeWidth={4} />
                </button>

                <div className="flex gap-6 p-3 bg-slate-50 rounded-full shadow-inner border border-slate-100">
                    {INSTRUMENTS.map((inst, i) => (
                        <button
                            key={inst.id}
                            onClick={(e) => { e.stopPropagation(); setInstIndex(i); }}
                            className={`
                                w-8 h-8 rounded-full transition-all duration-300 ring-4 shadow-sm
                                ${i === instIndex ? 'scale-110 opacity-100 ring-white' : 'opacity-30 scale-100 ring-transparent hover:opacity-60'}
                            `}
                            style={{ backgroundColor: inst.color }}
                        />
                    ))}
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); nextInst(1); }}
                    className="p-4 bg-white rounded-full shadow-md text-[#5F6368] active:scale-95 transition-transform hover:bg-slate-50 border border-slate-200"
                >
                    <ChevronRight size={36} strokeWidth={4} />
                </button>
            </div>
        </div>
    );
};

// --- Instrument Images ---
const InstrumentCharacter: React.FC<{ type: InstrumentType; color: string; darkColor: string; isPlaying: boolean }> = ({ type, isPlaying }) => {
    const images: Record<InstrumentType, string> = {
        piano: '/Piano.png',
        violin: '/Violin.png',
        trumpet: '/Trumpet.png',
        bells: '/Bell.png',
    };

    return (
        <img
            src={images[type]}
            alt={type}
            className={`w-[300px] h-auto object-contain transition-transform duration-100 ${isPlaying ? 'scale-105 drop-shadow-xl' : 'scale-100 drop-shadow-lg'}`}
            draggable={false}
        />
    );
};
