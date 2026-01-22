import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft } from 'lucide-react';

interface StringsProps {
  onBack: () => void;
}

// 6 Strings Pentatonic
const NOTES = ['C2', 'E2', 'G2', 'A2', 'C3', 'E3'];
const COLORS = ['#EA4335', '#FBBC04', '#34A853', '#4285F4', '#AA00FF', '#FF7043'];

export const Strings: React.FC<StringsProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const synthRef = useRef<Tone.PolySynth | null>(null);

  // Physics State for each string
  const stringsRef = useRef(NOTES.map(() => ({
      amp: 0,
      t: 0,
      active: false,
      lastTriggerTime: 0
  })));

  const prevMouse = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    // Pluck Synth sound
    const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' }, // Clean string sound
        envelope: { attack: 0.005, decay: 0.3, sustain: 0.0, release: 1.2 },
        volume: -4
    }).toDestination();
    synth.maxPolyphony = 6;
    
    // Slight Chorus for width
    const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination().start();
    const reverb = new Tone.Reverb(2).toDestination();
    synth.connect(chorus);
    synth.connect(reverb);
    
    synthRef.current = synth;

    return () => {
        synth.dispose();
        chorus.dispose();
        reverb.dispose();
        cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
      const render = () => {
          if (!canvasRef.current || !containerRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Resize Logic
          const dpr = window.devicePixelRatio || 1;
          const rect = containerRef.current.getBoundingClientRect();
          if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
              canvas.width = rect.width * dpr;
              canvas.height = rect.height * dpr;
              ctx.scale(dpr, dpr);
          }

          const width = rect.width;
          const height = rect.height;

          // Dark Background
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, 0, width, height);

          // Draw Strings
          const numStrings = NOTES.length;
          const spacing = width / (numStrings + 1);

          stringsRef.current.forEach((str, i) => {
              const xBase = spacing * (i + 1);
              
              // Physics Step
              if (str.amp > 0.5) {
                  str.amp *= 0.94; // Decay
                  str.t += 0.3 + (i * 0.05); // Faster vibration for higher pitch strings
              } else {
                  str.amp = 0;
                  str.t = 0;
              }

              ctx.beginPath();
              
              // Glow settings
              if (str.amp > 5) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = COLORS[i];
                ctx.strokeStyle = '#FFFFFF'; // White core when hot
                ctx.lineWidth = 4 + (str.amp * 0.05);
              } else {
                ctx.shadowBlur = 5;
                ctx.shadowColor = COLORS[i];
                ctx.strokeStyle = COLORS[i];
                ctx.lineWidth = 3;
              }
              
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              // Draw vibrating line
              ctx.moveTo(xBase, 0);
              
              const segments = 30;
              for (let j = 0; j <= segments; j++) {
                  const y = (height / segments) * j;
                  
                  // Sine wave deformation based on Y position (pinned at top and bottom)
                  const envelope = Math.sin(Math.PI * (y / height));
                  const vibration = Math.sin(str.t) * str.amp * envelope;
                  
                  ctx.lineTo(xBase + vibration, y);
              }
              
              ctx.stroke();
              ctx.shadowBlur = 0; // Reset
          });

          animationRef.current = requestAnimationFrame(render);
      };
      
      animationRef.current = requestAnimationFrame(render);
      return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const triggerString = (index: number, velocity: number) => {
      if (index < 0 || index >= NOTES.length) return;
      
      const str = stringsRef.current[index];
      const now = Date.now();
      
      // Debounce slightly to avoid double triggers on slow crossings
      if (now - str.lastTriggerTime < 100) return;
      str.lastTriggerTime = now;

      // Visual impulse (max amplitude limit)
      str.amp = Math.min(80, Math.abs(velocity) * 2 + 40);
      str.t = 0;

      // Audio trigger
      if (synthRef.current) {
          Tone.start();
          synthRef.current.triggerAttackRelease(NOTES[index], "8n");
      }
  };

  const checkCollision = (x: number, y: number, px: number, py: number) => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const spacing = width / (NOTES.length + 1);

      stringsRef.current.forEach((str, i) => {
          const stringX = spacing * (i + 1);
          
          // Check if line segment (px,py)->(x,y) crosses vertical line x=stringX
          // Simplification: just check X crossing since strings cover full height
          if ((px < stringX && x >= stringX) || (px > stringX && x <= stringX)) {
              const velocity = Math.abs(x - px);
              triggerString(i, velocity);
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
        <button onClick={onBack} className="p-3 bg-white/10 backdrop-blur rounded-full pointer-events-auto hover:bg-white/20 transition-colors">
          <ArrowLeft size={32} strokeWidth={3} className="text-white" />
        </button>
        <h1 className="text-3xl font-black text-white/90 drop-shadow-md">스트링</h1>
      </header>

      <div 
        ref={containerRef} 
        className="flex-1 cursor-grab active:cursor-grabbing touch-none relative"
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
               <p className="text-white/30 font-bold text-xl">줄을 튕겨보세요</p>
          </div>
      </div>
    </div>
  );
};