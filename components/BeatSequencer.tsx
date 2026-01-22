
import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Play, Pause, Trash2, Zap, Circle, Triangle, Square } from 'lucide-react';

interface BeatSequencerProps {
  onBack: () => void;
}

const STEPS = 16;

const ROWS_CONFIG = [
    { id: 'kick', color: '#EA4335', icon: <Circle size={40} fill="currentColor" strokeWidth={0} /> },   // Kick - Circle
    { id: 'snare', color: '#FBBC04', icon: <Square size={36} fill="currentColor" strokeWidth={0} /> },  // Snare - Square
    { id: 'hihat', color: '#34A853', icon: <Triangle size={40} fill="currentColor" strokeWidth={0} /> }, // Hihat - Triangle
    { id: 'clap', color: '#4285F4', icon: <Zap size={40} fill="currentColor" strokeWidth={0} /> },      // Clap - Zap/Hand
];

export const BeatSequencer: React.FC<BeatSequencerProps> = ({ onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(100);
  
  // Grid State
  const [grid, setGrid] = useState<boolean[][]>(
    Array(4).fill(null).map(() => Array(STEPS).fill(false))
  );

  // Refs for audio engine
  const gridRef = useRef(grid);
  const playersRef = useRef<any>(null);
  const loopRef = useRef<Tone.Sequence | null>(null);

  // Sync ref with state
  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    // Clear transport to remove any previous loops from other tools
    Tone.Transport.cancel();

    // Initialize Synth Engine (Improved Sounds)
    
    // Kick: Punchy, deep, fast decay
    const kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 1 },
        volume: 0
    }).toDestination();
    
    // Snare: White noise with tone
    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination();
    snare.volume.value = -6;
    
    // Hihat: Metallic, sharp
    const hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 3.1, 
      modulationIndex: 16, 
      resonance: 3000, 
      octaves: 0.5,
      volume: -12
    }).toDestination();
    
    // Clap: Filtered noise
    const clapFilter = new Tone.Filter(1200, "bandpass").toDestination();
    const clap = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.3, sustain: 0 }
    }).connect(clapFilter);
    clap.volume.value = -8;

    playersRef.current = { kick, snare, hihat, clap };

    // Initialize Sequence
    const sequence = new Tone.Sequence((time, col) => {
        Tone.Draw.schedule(() => {
            setCurrentStep(col);
        }, time);

        const currentGrid = gridRef.current;

        currentGrid.forEach((row, rowIndex) => {
            if (row[col]) {
                const soundType = ROWS_CONFIG[rowIndex].id;
                const synth = playersRef.current[soundType];
                if (synth) {
                    if (soundType === 'kick') synth.triggerAttackRelease("C1", "8n", time);
                    else if (soundType === 'hihat') synth.triggerAttackRelease(250, "32n", time, 0.3);
                    else synth.triggerAttackRelease("8n", time);
                }
            }
        });
    }, Array.from({ length: STEPS }, (_, i) => i), "8n");

    loopRef.current = sequence;
    
    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (loopRef.current) loopRef.current.dispose();
      kick.dispose();
      snare.dispose();
      hihat.dispose();
      clap.dispose();
      clapFilter.dispose();
    };
  }, []);

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying) {
        if (Tone.context.state !== 'running') Tone.context.resume();
        Tone.Transport.start();
        loopRef.current?.start(0);
    } else {
        Tone.Transport.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const toggleStep = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);

    // Instant preview if not playing
    if (newGrid[row][col] && !isPlaying) {
        const soundType = ROWS_CONFIG[row].id;
        const synth = playersRef.current[soundType];
        if (synth) {
            Tone.start().then(() => {
                if (soundType === 'kick') synth.triggerAttackRelease("C1", "8n");
                else if (soundType === 'hihat') synth.triggerAttackRelease(250, "32n", undefined, 0.3);
                else synth.triggerAttackRelease("8n");
            });
        }
    }
  };

  const handlePlayPause = async () => {
    await Tone.start();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F8F9FA]">
      <header className="bg-white p-4 border-b-2 flex items-center justify-between flex-shrink-0">
        <button onClick={() => { setIsPlaying(false); onBack(); }} className="p-3 bg-[#E8EAED] rounded-full text-[#5F6368] hover:bg-[#DADCE0]">
          <ArrowLeft size={32} strokeWidth={3} />
        </button>
        <h1 className="text-3xl font-black text-[#202124]">리듬 만들기</h1>
        <button onClick={() => setGrid(Array(4).fill(null).map(() => Array(STEPS).fill(false)))} className="p-3 bg-[#E8EAED] rounded-full text-[#5F6368]">
           <Trash2 size={32} strokeWidth={3} />
        </button>
      </header>

      {/* Main Grid Area */}
      <div className="flex-1 flex flex-col p-4 md:p-8 gap-4 md:gap-6 overflow-x-auto overflow-y-hidden items-center justify-center">
        {ROWS_CONFIG.map((row, rowIndex) => (
          <div key={row.id} className="flex items-center gap-4 md:gap-8 w-full max-w-7xl">
            {/* Icon Circle */}
            <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0" 
                style={{ backgroundColor: row.color }}
            >
                {row.icon}
            </div>

            {/* Steps */}
            <div className="flex-1 flex gap-1.5 md:gap-3 h-16 md:h-20">
              {grid[rowIndex].map((active, colIndex) => {
                const isPulse = currentStep === colIndex;
                const isBigBeat = colIndex % 4 === 0;
                
                return (
                  <button
                    key={colIndex}
                    onClick={() => toggleStep(rowIndex, colIndex)}
                    className={`
                      flex-1 rounded-xl md:rounded-2xl transition-all duration-75 relative border-b-4 md:border-b-8
                      ${active 
                        ? 'shadow-md md:shadow-lg translate-y-[-2px] md:translate-y-[-4px]' 
                        : 'bg-white border-[#DADCE0] hover:bg-[#F1F3F4]'
                      }
                      ${isPulse ? 'ring-2 md:ring-4 ring-indigo-400 z-10' : ''}
                      ${isBigBeat && !active ? 'bg-[#E8EAED]' : ''}
                    `}
                    style={{ 
                        backgroundColor: active ? row.color : undefined,
                        borderColor: active ? 'rgba(0,0,0,0.1)' : undefined
                    }}
                  >
                    {isPulse && active && <div className="absolute inset-0 bg-white/30 rounded-xl md:rounded-2xl animate-ping" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 md:p-8 border-t-2 flex flex-shrink-0 items-center justify-center gap-8 md:gap-12 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={handlePlayPause}
          className={`
            w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90
            ${isPlaying ? 'bg-[#EA4335]' : 'bg-[#4285F4]'}
          `}
        >
          {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
        </button>

        <div className="flex flex-col gap-2 w-48 md:w-64">
           <div className="flex justify-between text-[#5F6368] font-black text-lg md:text-xl">
             <span>천천히</span>
             <span>빠르게</span>
           </div>
           <input 
             type="range" min="60" max="180" value={bpm} 
             onChange={(e) => setBpm(parseInt(e.target.value))}
             className="w-full h-10 md:h-12 bg-[#E8EAED] rounded-full appearance-none cursor-pointer accent-[#4285F4]"
           />
        </div>
      </div>
    </div>
  );
};
