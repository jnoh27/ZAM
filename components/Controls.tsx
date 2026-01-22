import React from 'react';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { NoteMode } from '../types';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onClear: () => void;
  bpm: number;
  setBpm: (val: number) => void;
  noteMode: NoteMode;
  setNoteMode: (mode: NoteMode) => void;
  showChords: boolean;
  setShowChords: (val: boolean) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onStop,
  bpm,
  setBpm,
  noteMode,
  setNoteMode,
  showChords,
  setShowChords,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-center gap-10">
        
        {/* Play/Stop */}
        <div className="flex items-center gap-4">
          <button
            onClick={onPlayPause}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-90 hover:scale-105
              ${isPlaying ? 'bg-[#EA4335]' : 'bg-[#4285F4]'}
            `}
          >
            {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
          </button>
          <button
            onClick={onStop}
            className="w-16 h-16 rounded-full bg-[#E8EAED] text-[#5F6368] flex items-center justify-center shadow-md active:scale-90 hover:bg-[#DADCE0] transition-all"
          >
            <Square size={24} fill="currentColor" />
          </button>
        </div>

        {/* Speed Slider */}
        <div className="flex flex-col gap-2 w-44">
            <div className="flex justify-between text-[#5F6368] font-black text-[10px] uppercase tracking-widest">
                <span>Slow</span>
                <span>Fast</span>
            </div>
            <input
              type="range" min="60" max="180" value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full h-8 bg-[#E8EAED] rounded-full appearance-none cursor-pointer accent-[#4285F4] hover:accent-[#1967D2] transition-all"
            />
        </div>

        {/* Mode Buttons */}
        <div className="flex bg-[#F1F3F4] rounded-full p-1.5 gap-1">
             <button 
               onClick={() => setNoteMode('chord')}
               className={`px-5 py-2.5 rounded-full font-black text-sm transition-all duration-200 ${noteMode === 'chord' ? 'bg-white text-[#4285F4] shadow-sm' : 'text-[#5F6368] hover:bg-white/50'}`}
             >
               쉬운 음
             </button>
             <button 
               onClick={() => setNoteMode('scale')}
               className={`px-5 py-2.5 rounded-full font-black text-sm transition-all duration-200 ${noteMode === 'scale' ? 'bg-white text-[#4285F4] shadow-sm' : 'text-[#5F6368] hover:bg-white/50'}`}
             >
               보통 음
             </button>
             <button 
               onClick={() => setNoteMode('chromatic')}
               className={`px-5 py-2.5 rounded-full font-black text-sm transition-all duration-200 ${noteMode === 'chromatic' ? 'bg-white text-[#4285F4] shadow-sm' : 'text-[#5F6368] hover:bg-white/50'}`}
             >
               모든 음
             </button>
        </div>

        {/* Toggle */}
        <button
          onClick={() => setShowChords(!showChords)}
          className={`
            flex items-center gap-3 px-6 py-3 rounded-full font-black text-sm transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1
            ${showChords ? 'bg-[#FBBC04] text-white border-[#F29900]' : 'bg-[#E8EAED] text-[#5F6368] border-[#DADCE0]'}
          `}
        >
          {showChords ? <Volume2 size={20} strokeWidth={3} /> : <VolumeX size={20} strokeWidth={3} />}
          <span>배경 음악</span>
        </button>

      </div>
    </div>
  );
};