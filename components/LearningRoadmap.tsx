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
    2: [
        {
            id: 'pitch-intro',
            title: '음높이의 기초',
            description: '소리는 위아래로 움직여요',
            color: '#4285F4',
            icon: '🕊️',
        },
        {
            id: 'pitch-match',
            title: '같은 음 찾기',
            description: '귀를 기울여 똑같은 높이를 찾아요',
            color: '#34A853',
            icon: '🎯',
        },
        {
            id: 'pitch-quiz',
            title: '음 높이 퀴즈',
            description: '어떤 소리가 더 높을까요?',
            color: '#F4B400',
            icon: '❓',
        },
        {
            id: 'pitch-vocal',
            title: '목소리로 맞춰보기',
            description: '마이크로 직접 소리를 내보세요',
            color: '#EA4335',
            icon: '🎙️',
        },
        {
            id: 'pitch-memory',
            title: '음 기억하기',
            description: '소리를 듣고 잠시 뒤에 불러보세요',
            color: '#A142F4',
            icon: '🧠',
        },
        {
            id: 'pitch-patterns',
            title: '음 패턴 따라하기',
            description: '짧은 멜로디의 움직임을 따라가요',
            color: '#FF7043',
            icon: '〰️',
        }
    ],
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