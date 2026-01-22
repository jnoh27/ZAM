import React, { useState, useEffect } from 'react';
import { Chord, Melody, Progression, NoteMode } from '../types';
import { DEFAULT_PROGRESSION, TOTAL_STEPS } from '../constants';
import { audioService } from '../services/audio';
import { Controls } from './Controls';
import { ChordTimeline } from './ChordSelector';
import { PianoRoll } from './PianoRoll';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface MonoMelodyProps {
  onBack: () => void;
}

export const MonoMelody: React.FC<MonoMelodyProps> = ({ onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [currentStep, setCurrentStep] = useState(-1);
  const [noteMode, setNoteMode] = useState<NoteMode>('chord');
  const [showChords, setShowChords] = useState(true);
  const [progression, setProgression] = useState<Progression>(DEFAULT_PROGRESSION);
  const [melody, setMelody] = useState<Melody>(Array(TOTAL_STEPS).fill(null));

  useEffect(() => {
    audioService.setStepCallback((step) => setCurrentStep(step));
    audioService.setChordEnabled(showChords);
    
    return () => {
        audioService.cleanup();
    };
  }, []);

  useEffect(() => { audioService.updateMelody(melody); }, [melody]);
  useEffect(() => { audioService.updateProgression(progression); }, [progression]);
  useEffect(() => { audioService.setBpm(bpm); }, [bpm]);
  useEffect(() => { audioService.setChordEnabled(showChords); }, [showChords]);

  const handlePlayPause = async () => {
    await audioService.init();
    if (isPlaying) { audioService.pause(); setIsPlaying(false); } 
    else { audioService.play(); setIsPlaying(true); }
  };

  const handleStop = () => {
    audioService.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
  };

  const handleClear = () => {
    setMelody(Array(TOTAL_STEPS).fill(null));
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F8F9FA]">
      <header className="sticky top-0 bg-white p-4 border-b-2 flex items-center justify-between shrink-0 z-50 shadow-sm">
        <button onClick={() => { handleStop(); onBack(); }} className="p-3 bg-[#E8EAED] rounded-full transition-transform active:scale-90">
          <ArrowLeft size={32} strokeWidth={3} />
        </button>
        <h1 className="text-3xl font-black text-[#202124]">멜로디 그리기</h1>
        <button onClick={handleClear} className="p-3 bg-[#E8EAED] rounded-full text-[#EA4335] transition-transform active:scale-90">
           <RotateCcw size={32} strokeWidth={3} />
        </button>
      </header>

      <div className="flex-1 p-6 flex flex-col gap-6">
        {/* Controls */}
        <div className="bg-white rounded-3xl p-6 shadow-md border-b-4 border-[#DADCE0] shrink-0 relative z-20">
          <Controls 
             isPlaying={isPlaying}
             onPlayPause={handlePlayPause}
             onStop={handleStop}
             onClear={handleClear}
             bpm={bpm}
             setBpm={setBpm}
             noteMode={noteMode}
             setNoteMode={setNoteMode}
             showChords={showChords}
             setShowChords={setShowChords}
          />
        </div>

        {/* Chord Timeline */}
        <div className="shrink-0 relative z-30">
            <ChordTimeline 
                progression={progression}
                onUpdateProgression={(idx, chord) => {
                    const next = [...progression] as Progression;
                    next[idx] = chord;
                    setProgression(next);
                }}
            />
        </div>

        {/* Piano Grid */}
        <div className="bg-white rounded-3xl shadow-lg border-b-4 border-[#DADCE0] overflow-hidden flex flex-col relative z-10">
            <PianoRoll 
                progression={progression}
                melody={melody}
                currentStep={currentStep}
                onSetMelody={setMelody}
                noteMode={noteMode}
            />
        </div>
      </div>
    </div>
  );
}