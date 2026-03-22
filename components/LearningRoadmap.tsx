import React from 'react';
import { Check, Lock, Play, Star, TrendingUp, AudioLines, LayoutGrid, Music2 } from 'lucide-react';

interface LearningRoadmapProps {
    onSelectUnit: (unitId: number) => void;
}

interface Unit {
    id: string;
    title: string;
    description: string;
    color: string;
    icon: React.ReactNode;
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
    3: [
        {
            id: 'harmony-intro',
            title: '소리의 겹침',
            description: '두 소리가 함께 울리는 경험',
            color: '#7C4DFF',
            icon: '🎵',
        },
        {
            id: 'harmony-feeling',
            title: '어울림과 긴장',
            description: '편안한 소리와 긴장되는 소리',
            color: '#AA00FF',
            icon: '🎭',
        },
        {
            id: 'harmony-blocks',
            title: '화음 블록',
            description: '소리를 블록으로 보기',
            color: '#6200EA',
            icon: '▦',
        },
        {
            id: 'harmony-stack',
            title: '소리 쌓기',
            description: '두 음을 직접 쌓아보기',
            color: '#304FFE',
            icon: '▲',
        },
        {
            id: 'harmony-triad',
            title: '세 음 화음',
            description: '세 소리가 만드는 풍성함',
            color: '#00BFA5',
            icon: '♪',
        },
        {
            id: 'harmony-mood',
            title: '밝은 화음, 어두운 화음',
            description: '화음이 가진 감정 느끼기',
            color: '#FF6D00',
            icon: '◐',
        },
        {
            id: 'harmony-progression',
            title: '화음의 움직임',
            description: '화음은 흘러가요',
            color: '#C51162',
            icon: '→',
        },
    ],
    4: [
        {
            id: 'melody-direction',
            title: '소리의 방향',
            description: '소리가 위아래로 움직이는 것을 느껴봐요',
            color: '#FF6D00',
            icon: <TrendingUp size={28} strokeWidth={3} />,
        },
        {
            id: 'melody-pattern',
            title: '세 음 패턴',
            description: '세 개의 음으로 선을 그려봐요',
            color: '#00BFA5',
            icon: <AudioLines size={28} strokeWidth={3} />,
        },
        {
            id: 'melody-rhythm',
            title: '리듬 위의 멜로디',
            description: '리듬 위에 음을 놓아봐요',
            color: '#304FFE',
            icon: <LayoutGrid size={28} strokeWidth={3} />,
        },
        {
            id: 'melody-compose',
            title: '코드 위의 멜로디',
            description: '코드 위에서 멜로디를 만들어봐요',
            color: '#C51162',
            icon: <Music2 size={28} strokeWidth={3} />,
        },
    ]
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