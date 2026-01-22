import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Play, Pause, RotateCcw, Plus } from 'lucide-react';
import { CHORDS_C_MAJOR } from '../constants';
import { Chord } from '../types';

interface ChordPlayerProps {
  onBack: () => void;
}

export const ChordPlayer: React.FC<ChordPlayerProps> = ({ onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progression, setProgression] = useState<(Chord | null)[]>([null, null, null, null]);
  
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const loopRef = useRef<Tone.Sequence | null>(null);

  // Sound Setup
  useEffect(() => {
    // Clear transport to prevent conflicts
    Tone.Transport.cancel();

    // Improved Synth: Warm Electric Piano with Tremolo
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatcustom", partials: [0.5, 1, 0, 0.5], spread: 20, count: 2 },
      envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 1 },
      volume: -4
    }).toDestination();
    synth.maxPolyphony = 12;
    
    const tremolo = new Tone.Tremolo(4, 0.2).toDestination().start();
    const reverb = new Tone.Reverb(1.5).toDestination();
    synth.connect(tremolo);
    synth.connect(reverb);
    
    synthRef.current = synth;

    return () => {
        synth.dispose();
        tremolo.dispose();
        reverb.dispose();
        Tone.Transport.stop();
        Tone.Transport.cancel();
        if (loopRef.current) loopRef.current.dispose();
    };
  }, []);

  // Loop Logic
  useEffect(() => {
    if (loopRef.current) loopRef.current.dispose();

    const sequence = new Tone.Sequence((time, index) => {
        Tone.Draw.schedule(() => {
            setCurrentStep(index);
        }, time);

        const chord = progression[index];
        if (chord && synthRef.current) {
            // Voice Leading: Keep notes close to center
            const notes = chord.notes.map(n => n + '4');
            synthRef.current.triggerAttackRelease(notes, '2n', time);
        }
    }, [0, 1, 2, 3], "1m");

    loopRef.current = sequence;
    if (isPlaying) {
        Tone.Transport.start();
        sequence.start(0);
    }

    return () => { if (loopRef.current) loopRef.current.dispose(); }
  }, [progression, isPlaying]);

  const handlePlayPause = async () => {
      await Tone.start();
      if (isPlaying) {
          Tone.Transport.stop();
          setIsPlaying(false);
          setCurrentStep(-1);
      } else {
          Tone.Transport.start();
          loopRef.current?.start(0);
          setIsPlaying(true);
      }
  };

  const handleChordSelect = (chord: Chord) => {
      if (activeSlot === null) return;
      const newProg = [...progression];
      newProg[activeSlot] = chord;
      setProgression(newProg);
      setActiveSlot(null);
      
      // Preview
      if (synthRef.current && !isPlaying) {
          const notes = chord.notes.map(n => n + '4');
          synthRef.current.triggerAttackRelease(notes, '4n');
      }
  };

  const COLORS = ['#EA4335', '#FBBC04', '#34A853', '#4285F4', '#FF7043', '#AB47BC', '#00ACC1'];

  return (
    <div className="w-full h-full flex flex-col bg-[#F8F9FA]">
      <header className="bg-white p-4 border-b-2 flex items-center justify-between">
        <button onClick={() => { Tone.Transport.stop(); onBack(); }} className="p-3 bg-[#E8EAED] rounded-full">
          <ArrowLeft size={32} strokeWidth={3} className="text-[#5F6368]" />
        </button>
        <h1 className="text-3xl font-black text-[#202124]">화음 만들기</h1>
        <button 
            onClick={() => setProgression([null, null, null, null])} 
            className="p-3 bg-[#E8EAED] rounded-full text-[#5F6368]"
        >
            <RotateCcw size={32} strokeWidth={3} />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
          
          {/* Timeline Slots */}
          <div className="w-full max-w-4xl grid grid-cols-4 gap-4">
              {progression.map((chord, index) => {
                  const isActive = currentStep === index;
                  const isSelected = activeSlot === index;
                  
                  return (
                      <button
                        key={index}
                        onClick={() => setActiveSlot(index)}
                        className={`
                            aspect-[3/4] rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-200 border-b-8
                            ${chord 
                                ? 'bg-white shadow-xl' 
                                : 'bg-[#E8EAED] border-[#DADCE0] text-[#BDC1C6]'
                            }
                            ${isSelected ? 'ring-4 ring-black scale-105 z-10' : ''}
                            ${isActive ? 'brightness-95 translate-y-2 border-b-0' : ''}
                        `}
                        style={chord ? { 
                            backgroundColor: chord.color.split(' ')[0].replace('bg-', '') === 'rose' ? '#ffe4e6' : 'white', 
                            borderColor: isActive ? 'transparent' : '#DADCE0'
                        } : {}}
                      >
                          {chord ? (
                              <>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md`}
                                     style={{ backgroundColor: COLORS[CHORDS_C_MAJOR.findIndex(c => c.id === chord.id) % COLORS.length] }}
                                >
                                    {chord.roman}
                                </div>
                                <span className="text-2xl font-black text-[#202124]">{chord.name}</span>
                                <span className="text-sm font-bold text-[#5F6368]">{chord.mood}</span>
                              </>
                          ) : (
                              <Plus size={48} strokeWidth={4} />
                          )}
                      </button>
                  );
              })}
          </div>

          {/* Controls */}
          <button
            onClick={handlePlayPause}
            className={`
                w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90
                ${isPlaying ? 'bg-[#EA4335]' : 'bg-[#34A853]'}
            `}
          >
            {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
          </button>

          {/* Chord Palette (Bottom Sheet style) */}
          <div className={`
              fixed bottom-0 left-0 w-full bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 z-50 p-8
              ${activeSlot !== null ? 'translate-y-0' : 'translate-y-full'}
          `}>
              <div className="max-w-4xl mx-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-black text-[#202124]">화음을 골라주세요</h2>
                      <button onClick={() => setActiveSlot(null)} className="px-6 py-2 bg-[#E8EAED] rounded-full font-bold text-[#5F6368]">닫기</button>
                  </div>
                  
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
                      {CHORDS_C_MAJOR.map((chord, idx) => (
                          <button
                            key={chord.id}
                            onClick={() => handleChordSelect(chord)}
                            className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          >
                              <span className="text-white font-black text-xl">{chord.name.split(' ')[0]}</span>
                              <span className="text-white/80 font-bold text-xs">{chord.mood}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};