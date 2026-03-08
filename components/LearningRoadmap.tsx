import React from 'react';
import { Check, Lock, Play, Star } from 'lucide-react';

interface LearningRoadmapProps {
    onSelectUnit: (unitId: number) => void;
}

interface Unit {
    id: string;
    title: string;
    description: string;
    color: string;
    icon: string;
}

export const UNITS: Record<number, Unit[]> = {
    1: [
        {
            id: 'rhythm-intro',
            title: '리듬의 기초',
            description: '음악의 규칙적인 박동을 느껴봐요',
            color: '#EA4335',
            icon: '🥁',
        },
        {
            id: 'rhythm-beat',
            title: '기본 비트',
            description: '쿵짝쿵짝 기본 비트를 익혀요',
            color: '#FF7043',
            icon: '👋',
        },
        {
            id: 'rhythm-pattern',
            title: '리듬 패턴',
            description: '다양한 리듬 패턴을 만들어요',
            color: '#F4B400',
            icon: '🧩',
        },
        {
            id: 'rhythm-master',
            title: '리듬 마스터',
            description: '나만의 멋진 리듬을 완성해요',
            color: '#34A853',
            icon: '👑',
        }
    ],
    2: [],
    3: [],
    4: []
};

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({ onSelectUnit }) => {
    return (
        <div className="w-full flex flex-col items-center pb-32">
            {/* Banners */}
            <div className="w-full max-w-md flex flex-col gap-4 mb-8">
                <div
                    onClick={() => onSelectUnit(1)}
                    className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors"
                >
                    <div>
                        <h2 className="text-xl font-black text-slate-700">유닛 1</h2>
                        <p className="text-slate-500 font-bold">리듬</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-md">
                        <Star fill="white" size={24} />
                    </div>
                </div>

                <div
                    onClick={() => onSelectUnit(2)}
                    className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors"
                >
                    <div>
                        <h2 className="text-xl font-black text-slate-700">유닛 2</h2>
                        <p className="text-slate-500 font-bold">음높이</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-md">
                        <Star fill="white" size={24} />
                    </div>
                </div>

                <div
                    onClick={() => onSelectUnit(3)}
                    className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors"
                >
                    <div>
                        <h2 className="text-xl font-black text-slate-700">유닛 3</h2>
                        <p className="text-slate-500 font-bold">화음</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-md">
                        <Star fill="white" size={24} />
                    </div>
                </div>

                <div
                    onClick={() => onSelectUnit(4)}
                    className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors"
                >
                    <div>
                        <h2 className="text-xl font-black text-slate-700">유닛 4</h2>
                        <p className="text-slate-500 font-bold">멜로디</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-md">
                        <Star fill="white" size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
};