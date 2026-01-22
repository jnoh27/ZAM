import React, { useState } from 'react';
import { MonoMelody } from './components/MonoMelody';
import { BeatSequencer } from './components/BeatSequencer';
import { ChordPlayer } from './components/ChordPlayer';
import { Kandinsky } from './components/Kandinsky';
import { Oscillators } from './components/Oscillators';
import { Strings } from './components/Strings';
import { Arpeggios } from './components/Arpeggios';
import { VoiceSpinner } from './components/VoiceSpinner';
import { LearningRoadmap } from './components/LearningRoadmap';
import { LessonPlayer } from './components/LessonPlayer';
import { Music, Mic2, Piano, PenTool, Smile, Speaker, GitGraph, GraduationCap, LayoutGrid, Activity, Mic } from 'lucide-react';

type View = 'dashboard' | 'tool-melody' | 'tool-beat' | 'tool-chord' | 'game-kandinsky' | 'game-oscillators' | 'game-strings' | 'game-arpeggios' | 'game-voicespinner';
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
      switch(currentView) {
          case 'tool-melody': return <MonoMelody onBack={() => setCurrentView('dashboard')} />;
          case 'tool-beat': return <BeatSequencer onBack={() => setCurrentView('dashboard')} />;
          case 'tool-chord': return <ChordPlayer onBack={() => setCurrentView('dashboard')} />;
          case 'game-kandinsky': return <Kandinsky onBack={() => setCurrentView('dashboard')} />;
          case 'game-oscillators': return <Oscillators onBack={() => setCurrentView('dashboard')} />;
          case 'game-strings': return <Strings onBack={() => setCurrentView('dashboard')} />;
          case 'game-arpeggios': return <Arpeggios onBack={() => setCurrentView('dashboard')} />;
          case 'game-voicespinner': return <VoiceSpinner onBack={() => setCurrentView('dashboard')} />;
          default: return null;
      }
  };

  // Full Screen Tool View with Transition
  if (currentView !== 'dashboard') {
    return (
      <div className="fixed inset-0 w-full h-[100dvh] bg-white overflow-y-auto z-50 animate-slide-up overscroll-contain">
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center overflow-hidden">
      
      {/* Scrollable Main Content */}
      <div className="flex-1 w-full overflow-y-auto pb-32 scroll-smooth">
          
          <header className="text-center mt-8 mb-8 px-4 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-colors duration-500 ${activeTab === 'playground' ? 'bg-[#4285F4]' : 'bg-[#58CC02]'}`}>
                {activeTab === 'playground' ? <Music size={28} strokeWidth={3} /> : <GraduationCap size={28} strokeWidth={3} />}
              </div>
              <h1 className="text-3xl font-black text-[#202124] tracking-tight">
                  {activeTab === 'playground' ? 'Zam (잼)' : 'Zam 스쿨'}
              </h1>
            </div>
            <p className="text-lg text-[#5F6368] font-bold">
                {activeTab === 'playground' ? '재미있는 소리 세상!' : '차근차근 배워봐요!'}
            </p>
          </header>

          <div className="w-full max-w-4xl mx-auto px-4">
            {activeTab === 'playground' ? (
                /* Playground Grid with Staggered Animation */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up delay-100">
                  <DashboardButton 
                      title="멜로디 그리기" 
                      color="#FF7043" darkColor="#D84315" 
                      icon={<Piano size={48} strokeWidth={3} />} 
                      onClick={() => setCurrentView('tool-melody')} 
                  />
                  <DashboardButton 
                      title="리듬 만들기" 
                      color="#4285F4" darkColor="#1967D2" 
                      icon={<Mic2 size={48} strokeWidth={3} />} 
                      onClick={() => setCurrentView('tool-beat')} 
                  />
                  <DashboardButton 
                      title="화음 만들기" 
                      color="#34A853" darkColor="#1E8E3E" 
                      icon={<Smile size={48} strokeWidth={3} />} 
                      onClick={() => setCurrentView('tool-chord')} 
                  />
                  <DashboardButton 
                      title="칸딘스키" 
                      color="#F4B400" darkColor="#F29900" 
                      icon={<PenTool size={48} strokeWidth={3} />} 
                      onClick={() => setCurrentView('game-kandinsky')} 
                  />
                  <DashboardButton 
                      title="악기 탐험" 
                      color="#AA00FF" darkColor="#7200CA" 
                      icon={<Speaker size={48} strokeWidth={3} />} 
                      onClick={() => setCurrentView('game-oscillators')} 
                  />
                  <DashboardButton 
                      title="스트링" 
                      color="#00BCD4" darkColor="#0097A7" 
                      icon={<GitGraph size={48} strokeWidth={3} className="rotate-90" />} 
                      onClick={() => setCurrentView('game-strings')} 
                  />
                  <DashboardButton 
                      title="아르페지오" 
                      color="#EA4335" darkColor="#B71C1C" 
                      icon={<Activity size={48} strokeWidth={3} />} 
                      onClick={() => setCurrentView('game-arpeggios')} 
                  />
                   <DashboardButton 
                      title="보이스 스피너" 
                      color="#3F51B5" darkColor="#283593" 
                      icon={<Mic size={48} strokeWidth={3} />} 
                      onClick={() => setCurrentView('game-voicespinner')} 
                  />
                </div>
            ) : (
                /* Learning Roadmap with Animation */
                <div className="animate-slide-up delay-100">
                    <LearningRoadmap 
                        onSelectLesson={setActiveLesson}
                        completedLessons={completedLessons}
                    />
                </div>
            )}
          </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="w-full bg-white border-t border-slate-200 fixed bottom-0 left-0 z-40 pb-safe">
          <div className="max-w-md mx-auto flex justify-around p-2">
              <button 
                onClick={() => setActiveTab('playground')}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-300 active:scale-90 ${activeTab === 'playground' ? 'text-[#4285F4] bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                  <LayoutGrid size={28} strokeWidth={activeTab === 'playground' ? 3 : 2} />
                  <span className="text-xs font-bold">놀이터</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('learning')}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-300 active:scale-90 ${activeTab === 'learning' ? 'text-[#58CC02] bg-green-50' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                  <GraduationCap size={28} strokeWidth={activeTab === 'learning' ? 3 : 2} />
                  <span className="text-xs font-bold">학교</span>
              </button>
          </div>
      </div>
    </div>
  );
}

const DashboardButton: React.FC<{title: string, color: string, darkColor: string, icon: React.ReactNode, onClick: () => void}> = ({ title, color, darkColor, icon, onClick }) => (
    <button 
        onClick={onClick}
        className="aspect-[4/3] rounded-[32px] p-6 flex flex-col items-center justify-center gap-4 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-300 group border-b-8 relative overflow-hidden"
        style={{ backgroundColor: color, borderColor: darkColor }}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            {icon}
        </div>
        <span className="text-2xl font-black text-white relative z-10">{title}</span>
    </button>
);

export default App;