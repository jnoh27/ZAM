import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface SoundDrawProps {
  onBack: () => void;
}

export const SoundDraw: React.FC<SoundDrawProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<Tone.Synth | null>(null);
  const isDrawing = useRef(false);
  const colorRef = useRef('#4285F4');

  useEffect(() => {
    const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
    }).toDestination();
    const delay = new Tone.FeedbackDelay("8n", 0.4).toDestination();
    synth.connect(delay);
    synthRef.current = synth;
    return () => { synth.dispose(); delay.dispose(); };
  }, []);

  const handleStart = async (e: React.PointerEvent) => {
    e.preventDefault();
    await Tone.start();
    isDrawing.current = true;
    const colors = ['#EA4335', '#FBBC04', '#34A853', '#4285F4'];
    colorRef.current = colors[Math.floor(Math.random() * colors.length)];
    updateSoundAndDraw(e.clientX, e.clientY);
  };

  const handleMove = (e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      updateSoundAndDraw(e.clientX, e.clientY);
  };

  const updateSoundAndDraw = (x: number, y: number) => {
      if (!canvasRef.current || !synthRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const rx = x - rect.left;
      const ry = y - rect.top;

      const freq = 100 + (1 - (ry / rect.height)) * 800;
      synthRef.current.triggerAttack(freq);

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
          ctx.beginPath();
          ctx.arc(rx, ry, 30, 0, Math.PI * 2);
          ctx.fillStyle = colorRef.current;
          ctx.fill();
      }
  };

  const handleEnd = () => {
      isDrawing.current = false;
      synthRef.current?.triggerRelease();
  };

  useEffect(() => {
     if (canvasRef.current) {
         canvasRef.current.width = canvasRef.current.offsetWidth;
         canvasRef.current.height = canvasRef.current.offsetHeight;
     }
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#F8F9FA]">
      <header className="bg-white p-4 border-b-2 flex items-center justify-between">
        <button onClick={onBack} className="p-3 bg-[#E8EAED] rounded-full">
          <ArrowLeft size={32} strokeWidth={3} />
        </button>
        <h1 className="text-3xl font-black text-[#202124]">소리 그리기</h1>
        <button 
            onClick={() => {
                const ctx = canvasRef.current?.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
            }} 
            className="p-3 bg-[#EA4335] rounded-full text-white shadow-lg active:scale-90"
        >
            <RefreshCw size={32} strokeWidth={3} />
        </button>
      </header>

      <div className="flex-1 relative touch-none bg-white">
         <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair touch-none"
            onPointerDown={handleStart}
            onPointerMove={handleMove}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
         />
         <div className="absolute top-10 left-10 pointer-events-none">
             <p className="text-4xl font-black text-[#DADCE0] uppercase opacity-40">소리 놀이터</p>
         </div>
         <div className="absolute bottom-10 w-full text-center pointer-events-none">
             <p className="inline-block px-10 py-4 bg-[#202124]/10 rounded-full text-2xl font-black text-[#202124]/40">손가락으로 그림을 그려보세요!</p>
         </div>
      </div>
    </div>
  );
};