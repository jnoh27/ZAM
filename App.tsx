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
import { HelpModal } from './components/HelpModal';
import { UnitView } from './components/UnitView';
import { Music, Mic2, Piano, PenTool, Smile, Speaker, GitGraph, GraduationCap, LayoutGrid, Activity, Mic, Layers, Waves, RotateCw } from 'lucide-react';
import zamPlayground from './src/assets/zam_playground.png';
import zamLearning from './src/assets/zam_learning.png';

type View = 'dashboard' | 'tool-melody' | 'tool-beat' | 'tool-chord' | 'game-kandinsky' | 'game-oscillators' | 'game-strings' | 'game-arpeggios' | 'game-voicespinner' | 'game-chords' | 'game-harmonics' | 'game-soundwaves';
type Tab = 'playground' | 'learning';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('playground');
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [activeLesson, setActiveLesson] = useState<string | null>(null);
    const [activeUnit, setActiveUnit] = useState<number | null>(null);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

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

    // Active Unit View
    if (activeUnit) {
        return (
            <div className="fixed inset-0 w-full h-[100dvh] bg-[#F8F9FA] overflow-y-auto z-40 animate-slide-up overscroll-contain">
                <UnitView
                    unitId={activeUnit}
                    onBack={() => setActiveUnit(null)}
                    onSelectLesson={setActiveLesson}
                    completedLessons={completedLessons}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F4F6] flex flex-col items-center overflow-hidden font-sans">

            {/* Top Navigation Bar */}
            <div className="w-full bg-white border-b shadow-sm sticky top-0 z-40">
                <div className="w-full px-8 relative flex justify-center items-center h-16">

                    <div className="flex justify-center items-center gap-8">
                        <button
                            onClick={() => setActiveTab('playground')}
                            className={`px-4 py-5 text-[15px] font-bold border-b-[3px] transition-colors ${activeTab === 'playground' ? 'border-[#9D71E8] text-[#9D71E8]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            놀이터
                        </button>
                        <button
                            onClick={() => setActiveTab('learning')}
                            className={`px-4 py-5 text-[15px] font-bold border-b-[3px] transition-colors ${activeTab === 'learning' ? 'border-[#9D71E8] text-[#9D71E8]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            학교
                        </button>
                    </div>
                    
                    <div className="absolute right-8 flex items-center gap-4">
                        <button
                            onClick={() => setIsHelpOpen(true)}
                            className="w-8 h-8 rounded-full bg-[#EADDFF] flex items-center justify-center text-[#9D71E8] font-bold cursor-pointer hover:bg-[#D1C4E9] transition-colors shadow-sm"
                        >
                            ?
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 w-full overflow-y-auto pb-32 scroll-smooth">
                {activeTab === 'playground' ? (
                    <div className="w-full max-w-4xl mx-auto px-4">

                        {/* Header & Mascot Area */}
                        <header className="flex flex-row items-end justify-center gap-8 mt-12 mb-12">
                            <img src={zamPlayground} alt="ZAM Mascot" className="w-40 h-auto object-contain drop-shadow-sm -mb-4" />
                            <div className="flex flex-col items-center text-center pb-4">
                                <h1 className="text-4xl font-extrabold text-[#111111] tracking-tight mb-3">실험실</h1>
                                <p className="text-[#333333] font-medium text-[17px]">가볍게 즐기며 음악을 탐구하고 만들어 보세요.</p>
                            </div>
                        </header>

                        {/* Playground Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-16">
                            <DashboardButton
                                title="멜로디 메이커"
                                subtitle="멜로디와 화음 작곡"
                                circleColor="#AECBFA"
                                iconColor="#1967D2"
                                icon={<Piano size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('tool-melody')}
                            />
                            <DashboardButton
                                title="리듬 메이커"
                                subtitle="드럼 비트 제작"
                                circleColor="#F4B4C8"
                                iconColor="#D81B60"
                                icon={<Mic2 size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('tool-beat')}
                            />
                            <DashboardButton
                                title="코드 메이커"
                                subtitle="화음 조합 학습"
                                circleColor="#FDE293"
                                iconColor="#E27200"
                                icon={<Smile size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('tool-chord')}
                            />
                            <DashboardButton
                                title="칸딘스키"
                                subtitle="그림으로 연주하기"
                                circleColor="#A8E6CF"
                                iconColor="#0F9D58"
                                icon={<PenTool size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-kandinsky')}
                            />
                            <DashboardButton
                                title="화음 연주"
                                subtitle="즐거운 화음 실험"
                                circleColor="#FFD6A5"
                                iconColor="#E27200"
                                icon={<LayoutGrid size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-chords')}
                            />
                            <DashboardButton
                                title="악기 탐험"
                                subtitle="다양한 악기 소리"
                                circleColor="#D7BDE2"
                                iconColor="#8E44AD"
                                icon={<Music size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-oscillators')}
                            />
                            <DashboardButton
                                title="하프 스트링"
                                subtitle="하프 소리 연주"
                                circleColor="#FAD7A1"
                                iconColor="#E67E22"
                                icon={<GitGraph size={32} strokeWidth={2.5} className="rotate-90" />}
                                onClick={() => setCurrentView('game-strings')}
                            />
                            <DashboardButton
                                title="아르페지오"
                                subtitle="리드미컬한 화음"
                                circleColor="#C5CAE9"
                                iconColor="#3F51B5"
                                icon={<RotateCw size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-arpeggios')}
                            />
                            <DashboardButton
                                title="보이스 스피너"
                                subtitle="목소리 변형하기"
                                circleColor="#A2D9CE"
                                iconColor="#117A65"
                                icon={<Mic size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-voicespinner')}
                            />
                            <DashboardButton
                                title="하모닉스"
                                subtitle="배음 원리 탐구"
                                circleColor="#FFC8DD"
                                iconColor="#D81B60"
                                icon={<Layers size={32} strokeWidth={2.5} />}
                                onClick={() => setCurrentView('game-harmonics')}
                            />
                            <DashboardButton
                                title="사운드 웨이브"
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
                    <div className="w-full max-w-4xl mx-auto px-4 mt-12 animate-slide-up delay-100">
                        <header className="flex flex-row items-end justify-center gap-8 mb-12">
                            <div className="flex flex-col items-center text-center pb-4">
                                <h1 className="text-4xl font-extrabold text-[#111111] tracking-tight mb-3">배우기</h1>
                                <p className="text-[#333333] font-medium text-[17px]">차근차근 음악의 기초를 배워봐요.</p>
                            </div>
                            <img src={zamLearning} alt="Learning Mascot" className="w-40 h-auto object-contain drop-shadow-sm -mb-4" />
                        </header>
                        <LearningRoadmap
                            onSelectUnit={setActiveUnit}
                        />
                    </div>
                )}
            </div>

            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
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