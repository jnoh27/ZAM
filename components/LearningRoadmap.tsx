import React from 'react';
import { Check, Lock, Play, Star } from 'lucide-react';

interface LearningRoadmapProps {
  onSelectLesson: (lessonId: string) => void;
  completedLessons: string[];
}

const UNITS = [
    {
        id: 'rhythm',
        title: '리듬 (Rhythm)',
        description: '음악의 심장 소리를 느껴봐요',
        color: '#EA4335',
        icon: '🥁',
    },
    {
        id: 'pitch',
        title: '음높이 (Pitch)',
        description: '높은 소리와 낮은 소리',
        color: '#4285F4',
        icon: '🎹',
    },
    {
        id: 'melody',
        title: '멜로디 (Melody)',
        description: '노래가 걸어가는 길',
        color: '#FBBC04',
        icon: '🎵',
    },
    {
        id: 'harmony',
        title: '화음 (Harmony)',
        description: '친구들과 함께 불러요',
        color: '#34A853',
        icon: '🤝',
    },
    {
        id: 'chords',
        title: '코드 (Chords)',
        description: '음악의 기분을 정해요',
        color: '#AA00FF',
        icon: '🌈',
    }
];

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({ onSelectLesson, completedLessons }) => {
  // SVG Path Constants
  const ITEM_HEIGHT = 160;
  const START_Y = 50;
  const AMPLITUDE = 100; // How wide the snake is
  const CENTER_X = 200; // SVG Width / 2

  // Generate Path String
  let pathD = `M ${CENTER_X} 0 L ${CENTER_X} ${START_Y}`;
  
  const nodes = UNITS.map((unit, index) => {
      const y = START_Y + (index * ITEM_HEIGHT);
      // Sine wave logic for X position
      // index 0 -> Center(ish), index 1 -> Left, index 2 -> Right...
      // sin(0) = 0, sin(PI/2) = 1, sin(PI) = 0...
      // We want snake like: Center -> Right -> Left -> Right...
      const yNorm = index * 0.8; 
      const xOffset = Math.sin(yNorm) * AMPLITUDE;
      const x = CENTER_X + xOffset;
      
      // Calculate curve to next point
      if (index < UNITS.length - 1) {
          const nextY = START_Y + ((index + 1) * ITEM_HEIGHT);
          const nextYNorm = (index + 1) * 0.8;
          const nextXOffset = Math.sin(nextYNorm) * AMPLITUDE;
          const nextX = CENTER_X + nextXOffset;
          
          const cpY1 = y + (ITEM_HEIGHT / 2);
          const cpY2 = nextY - (ITEM_HEIGHT / 2);
          
          pathD += ` M ${x} ${y} C ${x} ${cpY1}, ${nextX} ${cpY2}, ${nextX} ${nextY}`;
      }

      return { ...unit, x, y };
  });

  return (
    <div className="w-full flex flex-col items-center pb-32">
        {/* Banner */}
        <div className="w-full max-w-md bg-white rounded-2xl p-6 mb-8 shadow-sm border-2 border-slate-100 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-black text-slate-700">유닛 1</h2>
                <p className="text-slate-500 font-bold">음악의 기초</p>
            </div>
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-md">
                <Star fill="white" size={24} />
            </div>
        </div>

        <div className="w-full max-w-[400px] relative mt-4">
            {/* SVG Path Background */}
            <svg 
                className="absolute top-0 left-0 w-full pointer-events-none z-0" 
                style={{ height: `${(UNITS.length) * ITEM_HEIGHT + 100}px` }}
                viewBox={`0 0 400 ${(UNITS.length) * ITEM_HEIGHT + 100}`}
            >
                <path 
                    d={pathD.replace(/M/g, 'L').replace('L', 'M')} // Hack to connect all segments
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray="0"
                />
            </svg>

            {/* Nodes */}
            <div className="relative z-10 w-full h-full">
                {nodes.map((unit, index) => {
                    const isCompleted = completedLessons.includes(unit.id);
                    const isNext = !isCompleted && (index === 0 || completedLessons.includes(UNITS[index-1].id));
                    const isLocked = !isCompleted && !isNext;

                    return (
                        <div 
                            key={unit.id} 
                            className="absolute flex flex-col items-center justify-center"
                            style={{ 
                                left: unit.x, 
                                top: unit.y,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {/* Floating Label for Active Lesson */}
                            {isNext && (
                                <div className="absolute -top-14 animate-bounce bg-white px-4 py-2 rounded-xl shadow-lg border-2 border-[#4285F4] z-20 whitespace-nowrap">
                                    <span className="font-black text-[#4285F4] text-sm">시작하기!</span>
                                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-[#4285F4] rotate-45"></div>
                                </div>
                            )}

                            <button
                                onClick={() => !isLocked && onSelectLesson(unit.id)}
                                disabled={isLocked}
                                className={`
                                    w-20 h-20 rounded-full flex items-center justify-center
                                    border-b-[6px] transition-all duration-200 relative
                                    ${isLocked 
                                        ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed' 
                                        : isCompleted 
                                            ? 'bg-[#FFD700] border-[#F57F17] text-white' 
                                            : `bg-[${unit.color}] border-black/20 text-white`
                                    }
                                    ${!isLocked && 'active:translate-y-[4px] active:border-b-0 active:shadow-none hover:brightness-110 shadow-lg'}
                                `}
                                style={{ backgroundColor: !isLocked && !isCompleted ? unit.color : undefined }}
                            >
                                {isCompleted ? (
                                    <Check size={32} strokeWidth={4} />
                                ) : isLocked ? (
                                    <Lock size={24} strokeWidth={3} className="opacity-50" />
                                ) : (
                                    <span className="text-3xl filter drop-shadow-sm">{unit.icon}</span>
                                )}
                                
                                {/* Shine effect */}
                                {!isLocked && (
                                    <div className="absolute top-2 left-3 w-3 h-3 bg-white/30 rounded-full" />
                                )}
                            </button>
                            
                            {/* Title Label */}
                            <div className="mt-2 text-center">
                                <span className={`font-black text-sm ${isLocked ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {unit.title.split('(')[0]}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};