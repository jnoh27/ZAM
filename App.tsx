import React, { useState } from 'react';
import { MonoMelody } from './components/MonoMelody';
import { BeatSequencer } from './components/BeatSequencer';
import { ChordPlayer } from './components/ChordPlayer';
import { Chords } from './components/Chords';
import { Kandinsky } from './components/Kandinsky';
import { Oscillators } from './components/Oscillators';
import { Strings } from './components/Strings';
import { Arpeggios } from './components/Arpeggios';
import { VoiceSpinner } from './components/VoiceSpinner';
import { LearningRoadmap } from './components/LearningRoadmap';
import { LessonPlayer } from './components/LessonPlayer';
import { Harmonics } from './components/Harmonics';
import { Soundwaves } from './components/Soundwaves';
import { Music, Mic2, Piano, PenTool, Smile, Speaker, GitGraph, GraduationCap, LayoutGrid, Activity, Mic, Layers, Waves } from 'lucide-react';

type View = 'dashboard' | 'tool-melody' | 'tool-beat' | 'tool-chord' | 'game-kandinsky' | 'game-oscillators' | 'game-strings' | 'game-arpeggios' | 'game-voicespinner' | 'game-chords' | 'game-harmonics' | 'game-soundwaves';
type Tab = 'playground' | 'learning';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('playground');
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [activeLesson, setActiveLesson] = useState<string | null>(null);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);

    const handleLessonComplete = () => {
        if (activeLesson) {
            setCompletedLessons(prev => [...prev, activeLesson]);
            setActiveLesson(null);
        }
    };

    const renderTool = () => {
        switch (currentView) {
            case 'tool-melody': return <MonoMelody onBack={() => setCurrentView('dashboard')} />;
            case 'tool-beat': return <BeatSequencer onBack={() => setCurrentView('dashboard')} />;
            case 'tool-chord': return <ChordPlayer onBack={() => setCurrentView('dashboard')} />;
            case 'game-kandinsky': return <Kandinsky onBack={() => setCurrentView('dashboard')} />;
            case 'game-oscillators': return <Oscillators onBack={() => setCurrentView('dashboard')} />;
            case 'game-strings': return <Strings onBack={() => setCurrentView('dashboard')} />;
            case 'game-arpeggios': return <Arpeggios onBack={() => setCurrentView('dashboard')} />;
            case 'game-voicespinner': return <VoiceSpinner onBack={() => setCurrentView('dashboard')} />;
            case 'game-chords': return <Chords onBack={() => setCurrentView('dashboard')} />;
            case 'game-harmonics': return <Harmonics onBack={() => setCurrentView('dashboard')} />;
            case 'game-soundwaves': return <Soundwaves onBack={() => setCurrentView('dashboard')} />;
            default: return null;
        }
    };

    // Full Screen Tool View with Transition
    if (currentView !== 'dashboard') {
        return (
            <div className="fixed inset-0 w-full h-[100dvh] bg-[#FDFBF7] overflow-y-auto z-50 animate-slide-up overscroll-contain">
                {renderTool()}
            </div>
        );
    }

    // Active Lesson Overlay
    if (activeLesson) {
        return (
            <LessonPlayer
                lessonId={activeLesson}
                onComplete={handleLessonComplete}
                onExit={() => setActiveLesson(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F4F6] flex flex-col items-center overflow-hidden font-sans">

            {/* Top Navigation Bar */}
            <div className="w-full bg-white border-b shadow-sm sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#9D71E8] flex items-center justify-center text-white">
                            <Music size={16} strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center items-center gap-8">
                        <button
                            onClick={() => setActiveTab('playground')}
                            className={`px-4 py-5 text-[15px] font-bold border-b-[3px] transition-colors ${activeTab === 'playground' ? 'border-[#9D71E8] text-[#9D71E8]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            플레이그라운드
                        </button>
                        <button
                            onClick={() => setActiveTab('learning')}
                            className={`px-4 py-5 text-[15px] font-bold border-b-[3px] transition-colors ${activeTab === 'learning' ? 'border-[#9D71E8] text-[#9D71E8]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            배우기
                        </button>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#9D71E8] font-bold cursor-help">
                        ?
                    </div>
                </div>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 w-full overflow-y-auto pb-32 scroll-smooth">
                {activeTab === 'playground' ? (
                    <div className="w-full max-w-4xl mx-auto px-4">

                        {/* Header & Mascot Area */}
                        <header className="flex flex-row items-end justify-center gap-8 mt-12 mb-12">
                            <img src="/mascot_playground.png" alt="ZAM Mascot" className="w-40 h-auto object-contain drop-shadow-sm -mb-4" />
                            <div className="flex flex-col items-center text-center pb-4">
                                <h1 className="text-4xl font-extrabold text-[#111111] tracking-tight mb-3">실험실</h1>
                                <p className="text-[#333333] font-medium text-[17px]">가볍게 즐기며 음악을 탐구하고 만들어 보세요.</p>
                            </div>
                        </header>

                        {/* Playground Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-16">
                            <DashboardButton
                                title="코드와 멜로디"
                                subtitle="나만의 코드 진행 만들기"
                                circleColor="#AECBFA"
                                iconColor="#1967D2"
                                icon={<Piano size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('tool-melody')}
                            />
                            <DashboardButton
                                title="드럼 비트 머신"
                                subtitle="리듬 만들기"
                                circleColor="#F4B4C8"
                                iconColor="#D81B60"
                                icon={<Mic2 size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('tool-beat')}
                            />
                            <DashboardButton
                                title="코드 메이커"
                                subtitle="화음 쌓기"
                                circleColor="#FDE293"
                                iconColor="#E27200"
                                icon={<Smile size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('tool-chord')}
                            />
                            <DashboardButton
                                title="칸딘스키"
                                subtitle="소리로 그림 그리기"
                                circleColor="#A8E6CF"
                                iconColor="#0F9D58"
                                icon={<PenTool size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-kandinsky')}
                            />
                            <DashboardButton
                                title="피아노 화음"
                                subtitle="CML 화음 실험"
                                circleColor="#FFD6A5"
                                iconColor="#E27200"
                                icon={<Piano size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-chords')}
                            />
                            <DashboardButton
                                title="오실레이터"
                                subtitle="악기 소리 탐험"
                                circleColor="#D7BDE2"
                                iconColor="#8E44AD"
                                icon={<Speaker size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-oscillators')}
                            />
                            <DashboardButton
                                title="스트링"
                                subtitle="기타 줄 튕기기"
                                circleColor="#FAD7A1"
                                iconColor="#E67E22"
                                icon={<GitGraph size={32} strokeWidth={2.5} className="rotate-90" />}
                                onClick={() => setCurrentView('game-strings')}
                            />
                            <DashboardButton
                                title="아르페지오"
                                subtitle="패턴 쌓기"
                                circleColor="#C5CAE9"
                                iconColor="#3F51B5"
                                icon={<Activity size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-arpeggios')}
                            />
                            <DashboardButton
                                title="보이스 스피너"
                                subtitle="피치 조절하기"
                                circleColor="#A2D9CE"
                                iconColor="#117A65"
                                icon={<Mic size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-voicespinner')}
                            />
                            <DashboardButton
                                title="배음 (Harmonics)"
                                subtitle="파동 연주하기"
                                circleColor="#FFC8DD"
                                iconColor="#D81B60"
                                icon={<Layers size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-harmonics')}
                            />
                            <DashboardButton
                                title="사운드웨이브"
                                subtitle="소리 파동 체험"
                                circleColor="#A0C4FF"
                                iconColor="#1967D2"
                                icon={<Waves size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-soundwaves')}
                            />
                        </div>
                    </div>
                ) : (
                    /* Learning Roadmap */
                    <div className="w-full max-w-4xl mx-auto px-4 mt-12">
                        <header className="flex flex-row items-end justify-center gap-8 mb-12">
                            <div className="flex flex-col items-center text-center pb-4">
                                <h1 className="text-4xl font-extrabold text-[#111111] tracking-tight mb-3">배우기</h1>
                                <p className="text-[#333333] font-medium text-[17px]">차근차근 음악의 기초를 배워봐요.</p>
                            </div>
                            <img src="/mascot_learning.png" alt="Learning Mascot" className="w-40 h-auto object-contain drop-shadow-sm -mb-4" />
                        </header>
                        <LearningRoadmap
                            onSelectLesson={setActiveLesson}
                            completedLessons={completedLessons}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

const DashboardButton: React.FC<{ title: string, subtitle: string, circleColor: string, iconColor: string, icon: React.ReactNode, onClick: () => void }> = ({ title, subtitle, circleColor, iconColor, icon, onClick }) => (
    <button
        onClick={onClick}
        className="w-full bg-white rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-transform duration-300 hover:-translate-y-1 active:scale-95 shadow-sm border border-gray-100"
    >
        <div
            className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-1"
            style={{ backgroundColor: circleColor, color: iconColor }}
        >
            {icon}
        </div>
        <div className="text-center">
            <h3 className="text-[17px] font-extrabold text-[#111111] mb-1">{title}</h3>
            <p className="text-[13px] text-[#666666] font-medium">{subtitle}</p>
        </div>
    </button>
);

export default App;