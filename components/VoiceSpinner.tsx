import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Mic, Square, RotateCcw, Loader2 } from 'lucide-react';

interface VoiceSpinnerProps {
  onBack: () => void;
}

export const VoiceSpinner: React.FC<VoiceSpinnerProps> = ({ onBack }) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'ready'>('idle');
  const [playbackRate, setPlaybackRate] = useState(0); // 0 = stopped, 1 = normal, -1 = reverse
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<Tone.Recorder | null>(null);
  const playerRef = useRef<Tone.Player | null>(null);
  const meterRef = useRef<Tone.Meter | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef(0);

  // Initialize Audio Context & Recorder
  useEffect(() => {
    const initAudio = async () => {
        try {
            // Check mic permissions first
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const meter = new Tone.Meter();
            const recorder = new Tone.Recorder();
            const mic = new Tone.UserMedia();
            
            await mic.open();
            mic.connect(meter);
            mic.connect(recorder);

            meterRef.current = meter;
            recorderRef.current = recorder;
        } catch (e) {
            console.error(e);
            setError("마이크 사용 권한이 필요합니다.");
        }
    };
    initAudio();

    return () => {
        // Cleanup
        if (recorderRef.current) recorderRef.current.dispose();
        if (playerRef.current) playerRef.current.dispose();
        if (meterRef.current) meterRef.current.dispose();
        cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Update Playback Rate
  useEffect(() => {
    if (playerRef.current && status === 'ready') {
        if (Math.abs(playbackRate) < 0.1) {
            if (playerRef.current.state === 'started') playerRef.current.stop();
        } else {
            // Player must be started to hear sound
            if (playerRef.current.state !== 'started') playerRef.current.start(0, 0);
            
            // Tone.Player doesn't support negative playbackRate directly for reverse in some versions nicely without buffer reversal
            // But Tone.js Player `reverse` property is boolean.
            // For true scrub-like behavior, simple playbackRate works if positive.
            // For negative, we usually flip the buffer or use `reverse = true`.
            
            const isReverse = playbackRate < 0;
            playerRef.current.reverse = isReverse;
            playerRef.current.playbackRate = Math.abs(playbackRate);
        }
    }
  }, [playbackRate, status]);

  // Animation Loop
  useEffect(() => {
    const render = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const cx = width / 2;
        const cy = height / 2;

        ctx.clearRect(0, 0, width, height);

        // Rotation Logic based on speed
        rotationRef.current += playbackRate * 0.1;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        if (status === 'recording') {
            // Pulsing Mic Visual
            const level = meterRef.current ? Tone.dbToGain(meterRef.current.getValue() as number) : 0;
            const size = 100 + level * 200;
            
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fillStyle = '#EA4335';
            ctx.globalAlpha = 0.5;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = '#EA4335';
            ctx.globalAlpha = 0.8;
            ctx.fill();

        } else if (status === 'ready') {
            // Spinning Waveform Visual
            ctx.rotate(rotationRef.current);
            
            ctx.beginPath();
            const outerRadius = 120;
            const innerRadius = 60;
            const bars = 40;
            
            for (let i = 0; i < bars; i++) {
                const angle = (i / bars) * Math.PI * 2;
                // Fake waveform look for now since we don't have analysis of the buffer easily available frame-by-frame without Analyzer
                // We'll just make a cool gear shape
                const h = (i % 2 === 0 ? 30 : 10) + Math.random() * 5; 
                
                const x1 = Math.cos(angle) * innerRadius;
                const y1 = Math.sin(angle) * innerRadius;
                const x2 = Math.cos(angle) * (outerRadius + h);
                const y2 = Math.sin(angle) * (outerRadius + h);
                
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.lineWidth = 15;
            ctx.lineCap = 'round';
            ctx.strokeStyle = playbackRate === 0 ? '#BDC1C6' : (playbackRate > 0 ? '#34A853' : '#4285F4');
            ctx.stroke();

            // Center Hub
            ctx.beginPath();
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
            ctx.fillStyle = '#202124';
            ctx.fill();
        }

        ctx.restore();
        animationRef.current = requestAnimationFrame(render);
    };
    
    // Fix canvas size
    if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth * window.devicePixelRatio;
        canvasRef.current.height = canvasRef.current.offsetHeight * window.devicePixelRatio;
    }

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [status, playbackRate]);

  const handleRecordToggle = async () => {
      if (status === 'idle') {
          await Tone.start();
          recorderRef.current?.start();
          setStatus('recording');
      } else if (status === 'recording') {
          setStatus('processing');
          const recording = await recorderRef.current?.stop();
          if (recording) {
              const url = URL.createObjectURL(recording);
              const buffer = new Tone.ToneAudioBuffer(url, () => {
                  const player = new Tone.Player(buffer).toDestination();
                  player.loop = true;
                  playerRef.current = player;
                  setStatus('ready');
                  setPlaybackRate(1); // Auto start
              });
          }
      }
  };

  const handleReset = () => {
      if (playerRef.current) {
          playerRef.current.stop();
          playerRef.current.dispose();
          playerRef.current = null;
      }
      setPlaybackRate(0);
      setStatus('idle');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <header className="p-4 border-b-2 flex items-center justify-between z-10 bg-white">
        <button onClick={() => { if(playerRef.current) playerRef.current.stop(); onBack(); }} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ArrowLeft size={32} strokeWidth={3} />
        </button>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">보이스 스피너</h1>
        <div className="w-12"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 relative overflow-hidden">
          
          {/* Visualization Canvas */}
          <div className="flex-1 w-full max-w-md relative">
              <canvas ref={canvasRef} className="w-full h-full" />
              
              {/* Overlay Messages */}
              {status === 'idle' && !error && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-2xl font-bold text-slate-300">마이크를 눌러 녹음하세요</p>
                  </div>
              )}
              {error && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center px-6">
                      <p className="text-xl font-bold text-red-500">{error}</p>
                  </div>
              )}
          </div>

          {/* Controls */}
          <div className="w-full max-w-md pb-12 z-10">
              {status === 'ready' ? (
                  <div className="flex flex-col gap-6 bg-white p-6 rounded-3xl shadow-xl border-2 border-slate-100">
                      <div className="flex justify-between items-center text-slate-500 font-bold px-2">
                           <span>거꾸로</span>
                           <span>멈춤</span>
                           <span>빠르게</span>
                      </div>
                      <input 
                        type="range" min="-2" max="2" step="0.1" 
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="w-full h-16 rounded-full appearance-none cursor-pointer bg-slate-100 accent-slate-800"
                        style={{
                            background: `linear-gradient(to right, #4285F4 0%, #E8EAED 50%, #34A853 100%)`
                        }}
                      />
                      <button 
                        onClick={handleReset}
                        className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold text-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                      >
                          <RotateCcw /> 다시 녹음하기
                      </button>
                  </div>
              ) : (
                  <button 
                    onClick={handleRecordToggle}
                    disabled={!!error || status === 'processing'}
                    className={`
                        w-24 h-24 mx-auto rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-95
                        ${status === 'recording' ? 'bg-[#EA4335] animate-pulse' : 'bg-[#4285F4]'}
                        ${status === 'processing' ? 'opacity-50 cursor-wait' : ''}
                    `}
                  >
                      {status === 'recording' ? (
                          <Square size={40} fill="currentColor" />
                      ) : status === 'processing' ? (
                          <Loader2 size={40} className="animate-spin" />
                      ) : (
                          <Mic size={40} fill="currentColor" />
                      )}
                  </button>
              )}
          </div>
      </div>
    </div>
  );
};