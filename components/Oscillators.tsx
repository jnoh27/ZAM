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
  const [frequency, setFrequency] = useState(440);
  const [isPressing, setIsPressing] = useState(false);
  const [touchY, setTouchY] = useState(0.5); // 0 to 1
  
  // Use a generic Monophonic type or specific synth types that support frequency ramping
  const synthRef = useRef<Tone.Synth | Tone.FMSynth | Tone.AMSynth | null>(null);
  const vibratoRef = useRef<Tone.Vibrato | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<{x: number, y: number, size: number, speedX: number, speedY: number, alpha: number, color: string}[]>([]);

  const currentInst = INSTRUMENTS[instIndex];

  // --- Audio Setup ---
  useEffect(() => {
    // 1. Cleanup previous synth explicitly to avoid "Object disposed" errors
    synthRef.current = null;
    
    if (vibratoRef.current) {
        vibratoRef.current.dispose();
        vibratoRef.current = null;
    }

    let synth: Tone.Synth | Tone.FMSynth | Tone.AMSynth;
    
    // Global FX chain
    const limiter = new Tone.Limiter(-1).toDestination();
    
    // Use JCReverb for synchronous initialization (safer than Tone.Reverb which is async)
    const reverb = new Tone.JCReverb({ roomSize: 0.4, wet: 0.2 }).connect(limiter);
    
    try {
        switch (currentInst.id) {
            case 'violin':
                // Violin: Sawtooth FM with Vibrato
                synth = new Tone.FMSynth({
                    harmonicity: 3.01,
                    modulationIndex: 14,
                    oscillator: { type: "sawtooth" },
                    envelope: { attack: 0.1, decay: 0.5, sustain: 0.8, release: 1.5 },
                    modulation: { type: "square" },
                    modulationEnvelope: { attack: 0.2, decay: 0.2, sustain: 0.8, release: 0.2 },
                    volume: -10
                });
                
                const vibrato = new Tone.Vibrato({
                    frequency: 6,
                    depth: 0.1,
                    type: "sine"
                }).connect(reverb);
                
                synth.connect(vibrato);
                vibratoRef.current = vibrato;
                break;

            case 'trumpet':
                 // Trumpet: AMSynth
                 synth = new Tone.AMSynth({
                    harmonicity: 2.5,
                    oscillator: { type: "sawtooth" },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 1.0, release: 0.5 },
                    modulation: { type: "square" },
                    modulationEnvelope: { attack: 0.05, decay: 0.01, sustain: 1, release: 0.5 },
                    volume: -8
                }).connect(reverb);
                break;

            case 'bells':
                 // Bells: FMSynth
                 synth = new Tone.FMSynth({
                    harmonicity: 3.5,
                    modulationIndex: 40,
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.01, decay: 1.5, sustain: 0.2, release: 3 },
                    modulation: { type: "sine" },
                    modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 },
                    volume: -8
                }).connect(reverb);
                break;

            case 'piano':
            default:
                // Piano: Fatsine (Standardized config)
                synth = new Tone.Synth({
                    oscillator: {
                        type: "fatsine", 
                        count: 3,
                        spread: 30
                    },
                    envelope: {
                        attack: 0.02,
                        decay: 0.3,
                        sustain: 0.5,
                        release: 1
                    },
                    volume: -6
                }).connect(reverb);
                break;
        }

        synthRef.current = synth;
    } catch (e) {
        console.error("Synth initialization error:", e);
    }

    return () => {
        // Safe cleanup
        if (synthRef.current) {
            synthRef.current.dispose();
            synthRef.current = null;
        }
        reverb.dispose();
        limiter.dispose();
        if (vibratoRef.current) {
            vibratoRef.current.dispose();
            vibratoRef.current = null;
        }
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

      updatePitch(e.clientY);
      
      if (synthRef.current && !synthRef.current.disposed) {
          synthRef.current.triggerAttack(frequency);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      e.preventDefault();
      if (!isPressing) return;
      updatePitch(e.clientY);
      
      if (synthRef.current && !synthRef.current.disposed) {
          // Smooth pitch sliding
          synthRef.current.frequency.rampTo(frequency, 0.05);
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      e.preventDefault();
      setIsPressing(false);
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      if (synthRef.current && !synthRef.current.disposed) {
          synthRef.current.triggerRelease();
      }
  };

  const updatePitch = (clientY: number) => {
      const height = window.innerHeight;
      const t = Math.max(0, Math.min(1, clientY / height)); 
      setTouchY(t);
      // Map to a reasonable pitch range (C3 to C6 approx)
      const minFreq = 130;
      const maxFreq = 1050;
      const percentage = 1 - t;
      // Exponential mapping for pitch naturalness
      const freq = minFreq * Math.pow(maxFreq / minFreq, percentage);
      setFrequency(freq);
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
    <div 
        ref={containerRef}
        className="w-full h-full flex flex-col relative overflow-hidden select-none touch-none transition-colors duration-500"
        style={{ backgroundColor: currentInst.bgColor, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Header - Ensure z-index is higher and buttons stop propagation */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between z-20 pointer-events-none">
        <button 
            onClick={(e) => { e.stopPropagation(); onBack(); }} 
            onPointerDown={(e) => e.stopPropagation()}
            className="p-3 bg-white/80 backdrop-blur rounded-full pointer-events-auto shadow-sm hover:scale-105 transition-transform"
        >
          <ArrowLeft size={32} strokeWidth={3} className="text-[#5F6368]" />
        </button>
        <div className="flex flex-col items-end">
            <div className="bg-white/90 px-8 py-3 rounded-full font-black text-3xl text-[#202124] backdrop-blur shadow-lg mb-2 flex items-center gap-2">
                <Music size={24} fill={currentInst.color} strokeWidth={0} />
                {currentInst.name}
            </div>
            <div className="bg-white/60 px-4 py-1.5 rounded-full font-bold text-[#5F6368] backdrop-blur text-sm tabular-nums shadow-sm">
                {Math.round(frequency)} Hz
            </div>
        </div>
      </header>

      {/* Instrument Display */}
      <div className="flex-1 flex items-center justify-center w-full relative z-0 pointer-events-none">
         <div 
            style={{ 
                transform: `scale(${scale}) rotate(${isPressing ? -tiltAngle : 0}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
            }}
            className="relative filter drop-shadow-2xl"
         >
             <InstrumentCharacter type={currentInst.id} color={currentInst.color} darkColor={currentInst.darkColor} isPlaying={isPressing} />
         </div>
         
         {/* Vertical Pitch Guide */}
         {isPressing && (
             <div className="absolute right-8 top-1/4 bottom-1/4 w-1.5 rounded-full bg-black/5 pointer-events-none">
                 <div 
                    className="absolute w-8 h-8 rounded-full shadow-lg border-4 border-white -left-[13px] transition-all duration-75 ease-out"
                    style={{ 
                        top: `${touchY * 100}%`,
                        backgroundColor: currentInst.color
                    }}
                 />
             </div>
         )}
      </div>
      
      {/* Navigation - High Z-index and stopPropagation */}
      <div className="h-32 w-full relative pointer-events-none flex items-center justify-center gap-12 z-20 flex-shrink-0 pb-8">
          <button 
             onClick={(e) => { e.stopPropagation(); nextInst(-1); }}
             className="pointer-events-auto p-5 bg-white rounded-full shadow-xl text-[#5F6368] active:scale-90 transition-transform hover:bg-slate-50 border border-slate-100"
             onPointerDown={(e) => e.stopPropagation()} 
          >
              <ChevronLeft size={40} strokeWidth={4} />
          </button>
          
          <div className="flex gap-4 pointer-events-auto bg-white/50 p-2 rounded-full backdrop-blur-sm" onPointerDown={(e) => e.stopPropagation()}>
              {INSTRUMENTS.map((inst, i) => (
                  <button 
                    key={inst.id} 
                    onClick={(e) => {e.stopPropagation(); setInstIndex(i);}}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`
                        w-6 h-6 rounded-full transition-all duration-300 ring-2 ring-white shadow-sm
                        ${i === instIndex ? 'scale-125 opacity-100' : 'opacity-40 scale-100 hover:opacity-60'}
                    `} 
                    style={{ backgroundColor: inst.color }}
                  />
              ))}
          </div>

          <button 
             onClick={(e) => { e.stopPropagation(); nextInst(1); }}
             className="pointer-events-auto p-5 bg-white rounded-full shadow-xl text-[#5F6368] active:scale-90 transition-transform hover:bg-slate-50 border border-slate-100"
             onPointerDown={(e) => e.stopPropagation()}
          >
              <ChevronRight size={40} strokeWidth={4} />
          </button>
      </div>

      {!isPressing && (
         <div className="absolute top-3/4 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-2xl font-black text-[#5F6368] opacity-30 animate-bounce">
            위아래로 눌러보세요
         </div>
      )}
    </div>
  );
};

// --- Instrument Characters ---
const InstrumentCharacter: React.FC<{ type: InstrumentType; color: string; darkColor: string; isPlaying: boolean }> = ({ type, color, darkColor, isPlaying }) => {
    // ... (Same SVGs as before)
    const Eyes = ({ cx = 0, cy = 0 }) => (
        <g transform={`translate(${cx}, ${cy})`}>
            <circle cx="-20" cy="0" r="8" fill="white" />
            <circle cx="-20" cy="0" r="3" fill="#202124" />
            <circle cx="20" cy="0" r="8" fill="white" />
            <circle cx="20" cy="0" r="3" fill="#202124" />
            {isPlaying && (
                <>
                    <circle cx="-30" cy="10" r="5" fill="#FF8A80" opacity="0.6" />
                    <circle cx="30" cy="10" r="5" fill="#FF8A80" opacity="0.6" />
                </>
            )}
        </g>
    );

    const Mouth = ({ cx = 0, cy = 0 }) => (
         <g transform={`translate(${cx}, ${cy})`}>
             {isPlaying ? (
                 <circle cx="0" cy="5" r="8" fill="#202124" />
             ) : (
                 <path d="M -8 5 Q 0 12 8 5" stroke="#202124" strokeWidth="3" fill="none" strokeLinecap="round" />
             )}
         </g>
    );

    switch(type) {
        case 'piano':
            return (
                <svg width="340" height="340" viewBox="0 0 340 340" overflow="visible">
                    <path d="M 20 120 L 260 120 C 300 120 320 140 320 180 C 320 200 280 280 260 280 L 20 280 Z" fill="#212121" stroke="#000" strokeWidth="4"/>
                    <rect x="40" y="280" width="20" height="40" fill="#212121" />
                    <rect x="240" y="280" width="20" height="40" fill="#212121" />
                    <path d="M 20 120 L 260 120 L 300 40 L 20 40 Z" fill="#424242" stroke="#000" strokeWidth="2" opacity="0.9" />
                    <line x1="240" y1="120" x2="280" y2="50" stroke="#FFD700" strokeWidth="4" />
                    <rect x="20" y="200" width="100" height="40" fill="#FFF" stroke="#000" strokeWidth="2" rx="4" />
                    <line x1="34" y1="200" x2="34" y2="240" stroke="#E0E0E0" strokeWidth="1" />
                    <line x1="48" y1="200" x2="48" y2="240" stroke="#E0E0E0" strokeWidth="1" />
                    <line x1="62" y1="200" x2="62" y2="240" stroke="#E0E0E0" strokeWidth="1" />
                    <line x1="76" y1="200" x2="76" y2="240" stroke="#E0E0E0" strokeWidth="1" />
                    <line x1="90" y1="200" x2="90" y2="240" stroke="#E0E0E0" strokeWidth="1" />
                    <rect x="28" y="200" width="8" height="25" fill="#000" />
                    <rect x="44" y="200" width="8" height="25" fill="#000" />
                    <rect x="70" y="200" width="8" height="25" fill="#000" />
                    <rect x="86" y="200" width="8" height="25" fill="#000" />
                    <Eyes cx={180} cy={200} />
                    <Mouth cx={180} cy={220} />
                </svg>
            );

        case 'violin':
            return (
                <svg width="300" height="300" viewBox="0 0 300 300" overflow="visible">
                    <path d="M 150 40 C 190 40, 210 80, 200 110 C 195 125, 205 135, 220 140 C 235 145, 235 220, 150 250 C 65 220, 65 145, 80 140 C 95 135, 105 125, 100 110 C 90 80, 110 40, 150 40 Z" fill={color} stroke={darkColor} strokeWidth="3" />
                    <rect x="142" y="10" width="16" height="120" fill="#212121" rx="2" />
                    <circle cx="150" cy="10" r="12" fill="#5D4037" />
                    <circle cx="150" cy="10" r="6" fill="#3E2723" />
                    <path d="M 140 250 L 160 250 L 155 210 L 145 210 Z" fill="#212121" />
                    <rect x="135" y="170" width="30" height="4" fill="#EDB977" />
                    <path d="M 125 140 Q 115 160 125 180" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <path d="M 175 140 Q 185 160 175 180" stroke="#3E2723" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <line x1="146" y1="10" x2="146" y2="210" stroke="#DDD" strokeWidth="1" />
                    <line x1="149" y1="10" x2="149" y2="210" stroke="#DDD" strokeWidth="1" />
                    <line x1="151" y1="10" x2="151" y2="210" stroke="#DDD" strokeWidth="1" />
                    <line x1="154" y1="10" x2="154" y2="210" stroke="#DDD" strokeWidth="1" />
                    <path d="M 120 240 Q 100 240 100 220 Q 100 200 120 210" fill="#212121" opacity="0.9" />
                    <Eyes cx={150} cy={100} />
                    <Mouth cx={150} cy={125} />
                    {isPlaying && (
                        <g className="animate-pulse">
                            <line x1="60" y1="170" x2="240" y2="170" stroke="#5D4037" strokeWidth="6" strokeLinecap="round" />
                            <line x1="60" y1="174" x2="240" y2="174" stroke="#FFF8E1" strokeWidth="2" strokeLinecap="round" />
                        </g>
                    )}
                </svg>
            );

        case 'trumpet':
            return (
                <svg width="300" height="300" viewBox="0 0 300 300" overflow="visible">
                     <g transform={isPlaying ? "scale(1.05)" : "scale(1)"} style={{transition: 'transform 0.1s'}}>
                        <path d="M 220 150 L 260 110 C 270 100 270 200 260 190 L 220 150" fill="#FFC107" />
                        <path d="M 40 140 H 220 V 160 H 100 V 180 H 200 V 160" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" />
                        <rect x="100" y="100" width="65" height="40" fill={color} stroke={darkColor} strokeWidth="2" rx="4" />
                        <rect x="110" y="80" width="10" height="20" fill="#ECEFF1" stroke="#90A4AE" />
                        <rect x="127" y={isPlaying ? "85" : "80"} width="10" height="20" fill="#ECEFF1" stroke="#90A4AE" />
                        <rect x="144" y="80" width="10" height="20" fill="#ECEFF1" stroke="#90A4AE" />
                        <circle cx="115" cy="80" r="6" fill="#FFF" stroke="#90A4AE" />
                        <circle cx="132" cy={isPlaying ? "85" : "80"} r="6" fill="#FFF" stroke="#90A4AE" />
                        <circle cx="149" cy="80" r="6" fill="#FFF" stroke="#90A4AE" />
                        <Eyes cx={180} cy={150} />
                     </g>
                </svg>
            );

        case 'bells':
            return (
                <svg width="300" height="300" viewBox="0 0 300 300" overflow="visible">
                    <g transform={`rotate(${isPlaying ? 15 : 0} 150 50)`} style={{transition: 'transform 0.1s'}}>
                        <rect x="140" y="20" width="20" height="60" rx="5" fill="#4E342E" />
                        <path d="M 150 60 C 110 60, 90 200, 50 220 L 250 220 C 210 200, 190 60, 150 60 Z" fill={color} stroke={darkColor} strokeWidth="4"/>
                        <path d="M 130 80 Q 110 120 110 180" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.3" fill="none" />
                        <circle cx="150" cy="220" r="20" fill="#311B92" />
                        <Eyes cx={150} cy={140} />
                        <Mouth cx={150} cy={170} />
                    </g>
                    {isPlaying && (
                         <g stroke={darkColor} strokeWidth="4" strokeLinecap="round">
                             <path d="M 260 180 L 290 160" />
                             <path d="M 270 210 L 300 200" />
                             <path d="M 40 180 L 10 160" />
                             <path d="M 30 210 L 0 200" />
                         </g>
                    )}
                </svg>
            );

        default:
            return null;
    }
}