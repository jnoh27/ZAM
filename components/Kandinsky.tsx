import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Play, Pause, RotateCcw, Brush, Eraser } from 'lucide-react';

interface KandinskyProps {
  onBack: () => void;
}

type ShapeType = 'line' | 'circle' | 'triangle' | 'square';

interface Drawing {
  id: number;
  points: { x: number; y: number; pressure?: number }[];
  color: string;
  type: ShapeType;
  minX: number;
  maxX: number;
  pitch: string;
  played: boolean; // Mutable flag for audio engine
  eyeOffset: {x: number, y: number}; 
}

const COLORS = ['#FF8A80', '#FFD180', '#A5D6A7', '#80D8FF', '#B39DDB'];
const SCALES = ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];

export const Kandinsky: React.FC<KandinskyProps> = ({ onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [drawingsState, setDrawingsState] = useState<Drawing[]>([]);
  const drawingsRef = useRef<Drawing[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  const isDrawing = useRef(false);
  const currentPoints = useRef<{ x: number; y: number; pressure?: number }[]>([]);
  const currentColor = useRef(COLORS[0]);
  const playheadPos = useRef(0);
  const lastFrameTime = useRef(0);
  const lastPointTime = useRef(0);

  // Audio Refs
  const harpRef = useRef<Tone.PolySynth | null>(null); 
  const bassRef = useRef<Tone.MembraneSynth | null>(null); 
  const bellRef = useRef<Tone.PolySynth | null>(null); 
  const woodRef = useRef<Tone.MembraneSynth | null>(null); 

  useEffect(() => {
    drawingsRef.current = drawingsState;
  }, [drawingsState]);

  // --- Audio Setup (Refined Sounds) ---
  useEffect(() => {
    const reverb = new Tone.Reverb({ decay: 2, wet: 0.2 }).toDestination();
    const limiter = new Tone.Limiter(-2).toDestination();
    const chorus = new Tone.Chorus(4, 2.5, 0.5).connect(reverb);

    // 1. Lines: Harp / Pluck
    // Clean triangle wave with short decay
    const harp = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.4, sustain: 0.1, release: 1 },
      volume: -5
    }).connect(chorus);
    harp.maxPolyphony = 10;
    harpRef.current = harp;

    // 2. Circle: Deep Warm Bass (808 style)
    const bass = new Tone.MembraneSynth({
        pitchDecay: 0.02,
        octaves: 2,
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 1 },
        volume: -2
    }).connect(limiter);
    bassRef.current = bass;

    // 3. Triangle: FM Bell / Chime (Magical)
    const bell = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 2,
        modulationIndex: 3,
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 2 },
        modulation: { type: "square" },
        modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
        volume: -8
    }).connect(reverb);
    bell.maxPolyphony = 6;
    bellRef.current = bell;

    // 4. Square: Woodblock / Marimba (Percussive)
    const wood = new Tone.MembraneSynth({
        pitchDecay: 0.001,
        octaves: 1,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        volume: -2
    }).connect(reverb);
    woodRef.current = wood;

    return () => {
      harp.dispose();
      bass.dispose();
      bell.dispose();
      wood.dispose();
      reverb.dispose();
      limiter.dispose();
      chorus.dispose();
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // --- Animation Loop ---
  useEffect(() => {
    const render = (time: number) => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvasRef.current.width !== width * dpr || canvasRef.current.height !== height * dpr) {
          canvasRef.current.width = width * dpr;
          canvasRef.current.height = height * dpr;
          ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const delta = time - lastFrameTime.current;
      lastFrameTime.current = time;
      
      if (isPlaying) {
          playheadPos.current += (width * 0.15) * (delta / 1000); // Slightly slower for better pacing
          if (playheadPos.current > width) {
              playheadPos.current = 0;
              drawingsRef.current.forEach(d => { d.played = false; });
          }
      }

      drawingsRef.current.forEach(d => {
        if (isPlaying && !d.played) {
            if (playheadPos.current >= d.minX) {
                triggerSound(d);
                d.played = true; 
            }
        }

        const isPlayingVisual = isPlaying && d.played && (playheadPos.current < d.maxX + 150) && (playheadPos.current > d.minX);
        const bounce = isPlayingVisual ? Math.sin(time * 0.015) * 5 : 0;
        const scale = isPlayingVisual ? 1.1 : 1;

        ctx.save();
        const cx = (d.minX + d.maxX) / 2;
        const cy = d.points.reduce((acc, p) => acc + p.y, 0) / d.points.length;
        
        ctx.translate(cx, cy + bounce);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        if (d.points.length > 1) {
            if (d.type !== 'line') {
                ctx.beginPath();
                ctx.fillStyle = d.color;
                ctx.globalAlpha = 0.2;
                ctx.moveTo(d.points[0].x, d.points[0].y);
                for(let pt of d.points) ctx.lineTo(pt.x, pt.y);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            ctx.beginPath();
            for (let i = 0; i < d.points.length - 1; i++) {
                const p1 = d.points[i];
                const p2 = d.points[i+1];
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            ctx.lineWidth = 10;
            ctx.strokeStyle = d.color;
            ctx.stroke();
        }
        
        if (d.type !== 'line') {
            drawFace(ctx, cx, cy, isPlayingVisual, d.type, d.eyeOffset);
        }

        ctx.restore();
      });

      if (isDrawing.current && currentPoints.current.length > 0) {
          const pts = currentPoints.current;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.strokeStyle = currentColor.current;
          ctx.lineWidth = 10;
          ctx.stroke();
      }

      if (isPlaying) {
          ctx.beginPath();
          ctx.strokeStyle = '#202124';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.3;
          ctx.setLineDash([10, 10]);
          ctx.moveTo(playheadPos.current, 0);
          ctx.lineTo(playheadPos.current, height);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1.0;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);

  const getBounds = (points: {x:number, y:number}[]) => {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      points.forEach(p => {
          if(p.x < minX) minX = p.x;
          if(p.x > maxX) maxX = p.x;
          if(p.y < minY) minY = p.y;
          if(p.y > maxY) maxY = p.y;
      });
      return { minX, maxX, minY, maxY };
  };

  const drawFace = (ctx: CanvasRenderingContext2D, x: number, y: number, singing: boolean, type: ShapeType, offset: {x:number, y:number}) => {
      ctx.fillStyle = '#202124'; 
      ctx.strokeStyle = '#202124';
      ctx.lineCap = 'round';
      const lx = offset.x * 5;
      const ly = offset.y * 5;

      if (type === 'triangle') {
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(x - 15, y - 5, 8, Math.PI, 0); ctx.stroke();
          ctx.beginPath(); ctx.arc(x + 15, y - 5, 8, Math.PI, 0); ctx.stroke();
          ctx.beginPath();
          if (singing) { ctx.arc(x, y + 10, 6, 0, Math.PI * 2); ctx.fill(); } 
          else { ctx.arc(x, y + 8, 4, 0, Math.PI); ctx.fill(); }
      } else if (type === 'square') {
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 28, y - 18, 20, 20);
          ctx.strokeRect(x + 8, y - 18, 20, 20);
          ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y - 8); ctx.stroke();
          ctx.beginPath(); ctx.arc(x - 18 + lx, y - 8 + ly, 3, 0, Math.PI*2); ctx.arc(x + 18 + lx, y - 8 + ly, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath();
          if (singing) { ctx.ellipse(x, y + 15, 8, 4, 0, 0, Math.PI * 2); ctx.stroke(); }
          else { ctx.moveTo(x - 5, y + 18); ctx.lineTo(x + 5, y + 18); ctx.stroke(); }
      } else {
          ctx.beginPath(); ctx.arc(x - 15 + lx, y - 5 + ly, 4, 0, Math.PI * 2); ctx.arc(x + 15 + lx, y - 5 + ly, 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#FFCDD2'; ctx.globalAlpha = 0.6;
          ctx.beginPath(); ctx.arc(x - 25, y + 5, 6, 0, Math.PI * 2); ctx.arc(x + 25, y + 5, 6, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1.0; ctx.fillStyle = '#202124';
          ctx.beginPath(); ctx.lineWidth = 3;
          if (singing) { ctx.arc(x, y + 8, 10, 0, Math.PI * 2); ctx.fill(); }
          else { ctx.arc(x, y + 8, 8, 0, Math.PI, false); ctx.stroke(); }
      }
  };

  const triggerSound = (d: Drawing) => {
      switch (d.type) {
          case 'line': harpRef.current?.triggerAttackRelease(d.pitch, '8n'); break;
          case 'circle': bassRef.current?.triggerAttackRelease(d.pitch.replace(/[0-9]/, '1'), "8n"); break;
          case 'triangle': bellRef.current?.triggerAttackRelease(d.pitch, "16n", undefined, 0.5); break;
          case 'square': woodRef.current?.triggerAttackRelease("G5", "32n"); break;
      }
  };

  const detectShape = (points: {x:number, y:number}[], isClosed: boolean): ShapeType => {
      if (!isClosed || points.length < 5) return 'line';
      let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
      points.forEach(p => {
          minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      });
      const width = maxX - minX;
      const height = maxY - minY;
      const area = width * height; 
      let polyArea = 0;
      for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          polyArea += points[i].x * points[j].y;
          polyArea -= points[j].x * points[i].y;
      }
      polyArea = Math.abs(polyArea) / 2;
      
      const ratio = polyArea / area;
      
      if (ratio < 0.6) return 'triangle';
      if (ratio > 0.85) return 'square';
      return 'circle';
  };

  const handleStart = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isPlaying) return;
    isDrawing.current = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    
    const rect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    lastPointTime.current = performance.now();
    currentPoints.current = [{ x, y, pressure: 0.5 }];
    currentColor.current = COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  const handleMove = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const rect = containerRef.current!.getBoundingClientRect();
    currentPoints.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleEnd = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    isDrawing.current = false;
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);

    const rawPoints = currentPoints.current;
    if (rawPoints.length < 10) {
        currentPoints.current = [];
        return;
    }

    const start = rawPoints[0];
    const end = rawPoints[rawPoints.length - 1];
    const dist = Math.sqrt((end.x - start.x)**2 + (end.y - start.y)**2);
    const isClosed = dist < 50; 

    const type = detectShape(rawPoints, isClosed);
    const bounds = getBounds(rawPoints);
    const avgY = (bounds.minY + bounds.maxY) / 2;
    const pitch = SCALES[Math.floor((1 - (avgY / containerRef.current!.offsetHeight)) * SCALES.length)] || 'C4';

    const newDrawing: Drawing = {
        id: Date.now(),
        points: isClosed ? [...rawPoints, rawPoints[0]] : rawPoints, 
        color: currentColor.current,
        type,
        minX: bounds.minX,
        maxX: bounds.maxX,
        pitch,
        played: false,
        eyeOffset: { x: Math.random()-0.5, y: Math.random()-0.5 }
    };

    setDrawingsState(prev => [...prev, newDrawing]);
    triggerSound(newDrawing);
    currentPoints.current = [];
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <header className="p-4 border-b-2 flex items-center justify-between flex-shrink-0 z-10 bg-white shadow-sm">
        <button onClick={onBack} className="p-3 bg-[#E8EAED] rounded-full hover:bg-[#DADCE0]">
          <ArrowLeft size={32} strokeWidth={3} className="text-[#5F6368]" />
        </button>
        <h1 className="text-3xl font-black text-[#202124]">칸딘스키</h1>
        <button 
            onClick={() => {
                setDrawingsState([]);
                playheadPos.current = 0;
            }} 
            className="p-3 bg-[#E8EAED] rounded-full text-[#5F6368] hover:text-[#EA4335] active:scale-90 transition-transform"
        >
            <Eraser size={32} strokeWidth={3} />
        </button>
      </header>

      <div ref={containerRef} className="flex-1 relative bg-white touch-none cursor-crosshair">
         <canvas
            ref={canvasRef}
            className="block touch-none w-full h-full"
            style={{ touchAction: 'none' }}
            onPointerDown={handleStart}
            onPointerMove={handleMove}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
         />
         {!isPlaying && drawingsState.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
                 <div className="text-center">
                     <Brush size={80} className="mx-auto mb-4 text-[#FF8A80]" />
                     <p className="text-4xl font-black text-[#FF8A80]">그림을 그려보세요</p>
                     <p className="text-xl text-[#BDC1C6] mt-2">동그라미, 세모, 네모를 그려보세요</p>
                 </div>
             </div>
         )}
      </div>

      <div className="p-6 bg-[#F8F9FA] flex justify-center border-t-2 flex-shrink-0 z-10 shadow-inner">
         <button
            onClick={async () => {
                await Tone.start();
                if (Tone.context.state !== 'running') await Tone.context.resume();
                setIsPlaying(!isPlaying);
                if (!isPlaying) {
                     drawingsRef.current.forEach(d => { d.played = false; });
                     playheadPos.current = 0;
                }
            }}
            className={`
                px-12 py-4 rounded-full text-white font-black text-2xl shadow-xl transition-transform active:scale-95 flex items-center gap-3
                ${isPlaying ? 'bg-[#EA4335]' : 'bg-[#34A853]'}
            `}
         >
            {isPlaying ? (
                <><Pause size={32} fill="currentColor" /> 멈춤</>
            ) : (
                <><Play size={32} fill="currentColor" /> 연주하기</>
            )}
         </button>
      </div>
    </div>
  );
};