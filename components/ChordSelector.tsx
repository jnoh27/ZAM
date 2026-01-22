import React, { useState, useEffect, useRef } from 'react';
import { Chord, Progression } from '../types';
import { CHORDS_C_MAJOR } from '../constants';
import { ChevronDown, X } from 'lucide-react';

interface ChordTimelineProps {
  progression: Progression;
  onUpdateProgression: (index: number, chord: Chord) => void;
}

export const ChordTimeline: React.FC<ChordTimelineProps> = ({
  progression,
  onUpdateProgression,
}) => {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveSlot(null);
      }
    };
    if (activeSlot !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSlot]);

  const handleSelect = (index: number, chord: Chord) => {
    onUpdateProgression(index, chord);
    setActiveSlot(null);
  };

  const getPartName = (index: number) => {
      const names = ["첫번째 이야기", "두번째 이야기", "세번째 이야기", "네번째 이야기"];
      return names[index];
  }

  return (
    <div className="flex flex-col">
        <div className="grid grid-cols-4 gap-3 md:gap-6">
          {progression.map((chord, index) => (
            <div 
                key={`slot-${index}`} 
                className={`relative group ${activeSlot === index ? 'z-50' : 'z-auto'}`}
            >
                {/* Main Chord Button */}
                <button
                  onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlot(activeSlot === index ? null : index);
                  }}
                  className={`
                    w-full relative h-36 md:h-48 rounded-3xl transition-all duration-300
                    flex flex-col items-center justify-center
                    bg-white shadow-sm ring-4
                    ${chord.color.replace('bg-', 'ring-').split(' ')[2] || 'ring-slate-100'}
                    hover:scale-[1.02] active:scale-95
                  `}
                >
                  <div className={`
                    absolute top-5 left-0 w-full flex justify-center
                  `}>
                    <span className="text-sm font-bold text-slate-400">
                      {getPartName(index)}
                    </span>
                  </div>
                  
                  <div className="text-center z-10 flex flex-col gap-2 items-center">
                     <h3 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                         {chord.name}
                         <ChevronDown size={24} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                     </h3>
                     <span className={`
                        inline-block px-4 py-1.5 rounded-full text-sm font-bold
                        ${chord.color.split(' ')[0]} ${chord.color.split(' ')[1]}
                     `}>
                        {chord.mood}
                     </span>
                  </div>
                </button>

                {/* Popover Selection Menu */}
                {activeSlot === index && (
                    <div 
                        ref={popoverRef}
                        className="absolute top-[110%] left-1/2 -translate-x-1/2 w-[280px] sm:w-[340px] bg-white rounded-3xl shadow-2xl ring-1 ring-slate-200 z-50 p-5 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[60vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-lg font-bold text-slate-700">{getPartName(index)}의 느낌을 골라주세요</span>
                            <button onClick={() => setActiveSlot(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {CHORDS_C_MAJOR.map((c) => {
                                const isSelected = c.id === chord.id;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelect(index, c)}
                                        className={`
                                            p-3 rounded-2xl text-left flex flex-col items-center justify-center transition-all
                                            ${isSelected ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:ring-2 hover:ring-slate-200'}
                                        `}
                                    >
                                        <span className="font-bold text-lg mb-1">{c.name}</span>
                                        <span className={`text-xs font-bold opacity-90 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>{c.mood}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
          ))}
        </div>
    </div>
  );
};