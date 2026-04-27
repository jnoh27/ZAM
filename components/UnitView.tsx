import React from 'react';
import { Check, Lock, Star, ArrowLeft } from 'lucide-react';
import { UNITS } from './LearningRoadmap';

interface UnitViewProps {
    unitId: number;
    onBack: () => void;
    onSelectLesson: (lessonId: string) => void;
    completedLessons: string[];
}

export const UnitView: React.FC<UnitViewProps> = ({ unitId, onBack, onSelectLesson, completedLessons }) => {
    const activeLessons = UNITS[unitId] || [];

    // SVG Path Constants
    const ITEM_HEIGHT = 160;
    const START_Y = 80;
    const AMPLITUDE = 40; // How wide the snake is
    const CENTER_X = 200; // SVG Width / 2

    // Generate Path String
    let pathD = `M ${CENTER_X} 0 L ${CENTER_X} ${START_Y}`;

    const nodes = activeLessons.map((unit, index) => {
        const y = START_Y + (index * ITEM_HEIGHT);
        // Sine wave logic for X position
        const yNorm = index * 0.8;
        const xOffset = Math.sin(yNorm) * AMPLITUDE;
        const x = CENTER_X + xOffset;

        // Calculate curve to next point
        if (index < activeLessons.length - 1) {
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

    const getUnitTitle = (id: number) => {
        switch (id) {
            case 1: return "리듬";
            case 2: return "음높이";
            case 3: return "화음";
            case 4: return "멜로디";
            default: return "알 수 없는 유닛";
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center overflow-y-auto">
            {/* Header */}
            <div className="w-full bg-white border-b-2 border-slate-100 p-4 sticky top-0 z-50">
                <div className="w-full flex items-center justify-between lg:px-8">
                    <button
                        onClick={onBack}
                        className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={24} strokeWidth={3} />
                    </button>

                    <div className="flex-1 px-4 text-center">
                        <h2 className="text-xl font-black text-slate-700">유닛 {unitId}</h2>
                        <p className="text-sm font-bold text-slate-400">{getUnitTitle(unitId)}</p>
                    </div>

                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-md">
                        <Star fill="white" size={24} />
                    </div>
                </div>
            </div>

            {/* Roadmap */}
            <div className="w-full flex flex-col items-center pb-32 pt-8">
                {activeLessons.length > 0 ? (
                    <div className="w-full max-w-[400px] relative mt-4" style={{ minHeight: `${(activeLessons.length) * ITEM_HEIGHT + 120}px` }}>
                        {/* SVG Path Background */}
                        <svg
                            className="absolute top-0 left-0 w-full pointer-events-none z-0"
                            style={{ height: `${(activeLessons.length) * ITEM_HEIGHT + 100}px` }}
                            viewBox={`0 0 400 ${(activeLessons.length) * ITEM_HEIGHT + 100}`}
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
                                const isNext = !isCompleted && (index === 0 || completedLessons.includes(activeLessons[index - 1].id));
                                const isLocked = false; // !isCompleted && !isNext; // Temporarily unlocked for testing

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
                                                        : 'border-black/20 text-white'
                                                }
                                                ${!isLocked ? 'active:translate-y-[4px] active:border-b-0 active:shadow-none hover:brightness-110 shadow-lg' : ''}
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
                ) : (
                    <div className="text-center mt-20 p-8">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🚧</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-700 mb-2">시공 중!</h3>
                        <p className="text-slate-500 font-bold">곧 재미있는 레슨이 추가될 예정이에요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
