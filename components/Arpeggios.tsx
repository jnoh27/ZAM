import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Music2 } from 'lucide-react';

interface ArpeggiosProps {
  onBack: () => void;
}

const CHORDS = [
    { name: 'C Major', notes: ['C4', 'E4', 'G4', 'C5'], color: '#EA4335' },
    { name: 'F Major', notes: ['F3', 'A3', 'C4', 'F4'], color: '#4285F4' },
    { name: 'G Major', notes: ['G3', 'B3', 'D4', 'G4'], color: '#FBBC04' },
    { name: 'A Minor', notes: ['A3', 'C4', 'E4', 'A4'], color: '#AA00FF' },
    { name: 'D Minor', notes: ['D3', 'F3', 'A3', 'D4'], color: '#34A853' },
];

const PATTERNS = [
    { id: 'up', name: '올라가기', icon: '↗️' },
    { id: 'down', name: '내려가기', icon: '↘️' },
    { id: 'updown', name: '왔다갔다', icon: '↕️' },
    { id: 'random', name: '무작위', icon: '🔀' },
];

export const Arpeggios: React.FC<ArpeggiosProps> = ({ onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [patternIndex, setPatternIndex] = useState(0);
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1);
  
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  const currentChord = CHORDS[currentChordIndex];
  const currentPattern = PATTERNS[patternIndex];

  // Initialize Audio
  useEffect(() => {
    // Clear transport
    Tone.Transport.cancel();

    const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
    
    // Harp-like Pluck Synth
    const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 1 },
        volume: -5
    }).connect(reverb);
    synth.maxPolyphony = 8;
    
    synthRef.current = synth;

    return () => {
        synth.dispose();
        reverb.dispose();
        Tone.Transport.stop();
        Tone.Transport.cancel();
        if (sequenceRef.current) sequenceRef.current.dispose();
    };
  }, []);

  // Sequence Logic
  useEffect(() => {
      if (sequenceRef.current) sequenceRef.current.dispose();

      const sequence = new Tone.Sequence((time, index) => {
          // Determine note based on pattern
          let noteIdx = 0;
          const len = 4; // 4 notes per chord defined above
          
          switch(currentPattern.id) {
              case 'up': noteIdx = index % len; break;
              case 'down': noteIdx = (len - 1) - (index % len); break;
              case 'updown': 
                  const pingPong = index % 6; // 0,1,2,3,2,1
                  if (pingPong < 4) noteIdx = pingPong;
                  else noteIdx = 6 - pingPong;
                  break;
              case 'random': noteIdx = Math.floor(Math.random() * len); break;
          }

          const note = currentChord.notes[noteIdx];
          
          if (synthRef.current) {
              synthRef.current.triggerAttackRelease(note, "8n", time);
          }

          Tone.Draw.schedule(() => {
              setActiveNoteIndex(noteIdx);
          }, time);

      }, Array.from({length: 12}, (_,i)=>i), "8n");

      sequenceRef.current = sequence;

      if (isPlaying) {
          Tone.Transport.start();
          sequence.start(0);
      }

      return () => { if(sequenceRef.current) sequenceRef.current.dispose(); }
  }, [currentChordIndex, patternIndex, isPlaying]);

  const handlePlayToggle = async () => {
      await Tone.start();
      if (isPlaying) {
          Tone.Transport.stop();
          setIsPlaying(false);
          setActiveNoteIndex(-1);
      } else {
          Tone.Transport.start();
          sequenceRef.current?.start(0);
          setIsPlaying(true);
      }
  };

  const changeChord = (delta: number) => {
      let next = currentChordIndex + delta;
      if (next >= CHORDS.length) next = 0;
      if (next < 0) next = CHORDS.length - 1;
      setCurrentChordIndex(next);
  };

  const changePattern = () => {
      setPatternIndex((prev) => (prev + 1) % PATTERNS.length);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#212121]">
      <header className="p-4 border-b-2 border-white/10 flex items-center justify-between z-10">
        <button onClick={() => { Tone.Transport.stop(); onBack(); }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
          <ArrowLeft size={32} strokeWidth={3} />
        </button>
        <h1 className="text-3xl font-black text-white tracking-tight">아르페지오</h1>
        <div className="w-12"></div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
          
          {/* Main Visualizer */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              {/* Central Play Button */}
              <button 
                onClick={handlePlayToggle}
                className={`
                    absolute inset-0 m-auto w-24 h-24 rounded-full flex items-center justify-center z-20 shadow-2xl transition-transform active:scale-95
                    ${isPlaying ? 'bg-white text-[#212121]' : 'bg-[#EA4335] text-white'}
                `}
              >
                  {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
              </button>
              
              {/* Orbiting Notes */}
              {currentChord.notes.map((note, i) => {
                  const angle = (i / currentChord.notes.length) * Math.PI * 2 - Math.PI / 2;
                  const radius = 120; // Distance from center
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const isActive = activeNoteIndex === i && isPlaying;

                  return (
                      <div 
                        key={i}
                        className={`
                            absolute w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-100
                            ${isActive ? 'scale-125 brightness-110 shadow-[0_0_30px_currentColor]' : 'scale-100 opacity-60'}
                        `}
                        style={{ 
                            transform: `translate(${x}px, ${y}px)`,
                            backgroundColor: currentChord.color,
                            color: currentChord.color
                        }}
                      >
                         <div className="w-full h-full rounded-full bg-current opacity-20 absolute animate-pulse"></div>
                         <div className="w-12 h-12 rounded-full bg-current flex items-center justify-center shadow-sm relative z-10 text-[#212121]">
                             {note.replace(/\d/, '')}
                         </div>
                      </div>
                  );
              })}

              {/* Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-visible">
                  <circle cx="50%" cy="50%" r="120" stroke="white" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              </svg>
          </div>

          {/* Controls */}
          <div className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl p-6 flex flex-col gap-6">
              
              {/* Pattern Selector */}
              <div className="flex items-center justify-between bg-black/20 rounded-2xl p-2">
                  <button onClick={changePattern} className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-bold hover:bg-white/5 rounded-xl transition-colors">
                      <span className="text-2xl">{currentPattern.icon}</span>
                      <span>{currentPattern.name}</span>
                  </button>
              </div>

              {/* Chord Selector */}
              <div className="flex items-center justify-between gap-4">
                  <button 
                    onClick={() => changeChord(-1)}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-colors"
                  >
                      <ChevronLeft size={32} />
                  </button>
                  
                  <div className="flex-1 text-center">
                      <div className="text-sm font-bold text-white/50 mb-1">현재 코드</div>
                      <div className="text-3xl font-black text-white" style={{ color: currentChord.color }}>
                          {currentChord.name}
                      </div>
                  </div>

                  <button 
                    onClick={() => changeChord(1)}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-colors"
                  >
                      <ChevronRight size={32} />
                  </button>
              </div>
          </div>

      </div>
    </div>
  );
};