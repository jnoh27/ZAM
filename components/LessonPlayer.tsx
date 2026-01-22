import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Check, Volume2, ArrowRight, Star, Heart, Cloud, Sun, Music } from 'lucide-react';

interface LessonPlayerProps {
  lessonId: string;
  onComplete: () => void;
  onExit: () => void;
}

type LessonStep = {
    type: 'listen' | 'tap' | 'choose' | 'play';
    title: string;
    description?: string;
    target?: any;
    options?: any[];
    demoType?: string;
};

// --- LESSON DATA ---
const LESSONS: Record<string, LessonStep[]> = {
    'rhythm': [
        { type: 'listen', title: '심장 소리를 들어보세요', description: '규칙적인 박자를 느껴봐요', demoType: '4-beat' },
        { type: 'tap', title: '박자에 맞춰 4번 눌러보세요', target: 4 },
        { type: 'tap', title: '이번엔 빠르게 8번!', target: 8 }
    ],
    'pitch': [
        { type: 'listen', title: '높은 소리와 낮은 소리', description: '새소리와 코끼리 소리를 비교해봐요' },
        { type: 'choose', title: '높은 소리(새)는 어디있나요?', target: 'high', options: ['high', 'low'] },
        { type: 'choose', title: '낮은 소리(코끼리)는 어디있나요?', target: 'low', options: ['high', 'low'] }
    ],
    'melody': [
        { type: 'play', title: '첫 번째 음 "도"', target: 'C4', description: '빨간색 버튼을 눌러보세요' },
        { type: 'play', title: '계단을 올라가요 "도-레-미"', target: ['C4', 'D4', 'E4'] },
        { type: 'play', title: '솔까지 올라가볼까요?', target: ['C4', 'D4', 'E4', 'F4', 'G4'] }
    ],
    'harmony': [
        { type: 'listen', title: '혼자 부르는 노래 (솔로)', description: '한 친구의 목소리를 들어보세요.', demoType: 'mono' },
        { type: 'play', title: '화음 만들기', description: '친구들을 모두 눌러서 멋진 합창을 만들어보세요!', target: 3 }
    ],
    'chords': [
        { type: 'listen', title: '밝은 느낌 (장조)', description: '해가 쨍쨍한 느낌이에요', demoType: 'major' },
        { type: 'listen', title: '슬픈 느낌 (단조)', description: '구름이 낀 느낌이에요', demoType: 'minor' },
        { type: 'choose', title: '어느 쪽이 "밝은" 느낌인가요?', target: 'major', options: ['major', 'minor'] }
    ]
};

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ lessonId, onComplete, onExit }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Audio Refs
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const membraneRef = useRef<Tone.MembraneSynth | null>(null);

  const steps = LESSONS[lessonId] || [];
  const currentStep = steps[stepIndex];
  const progress = ((stepIndex) / steps.length) * 100;

  useEffect(() => {
    const synth = new Tone.PolySynth(Tone.Synth, {
        envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 1 },
        volume: -4
    }).toDestination();
    
    const membrane = new Tone.MembraneSynth().toDestination();
    
    synthRef.current = synth;
    membraneRef.current = membrane;
    
    return () => {
        synth.dispose();
        membrane.dispose();
    };
  }, []);

  const handleStepComplete = () => {
      setFeedback('success');
      
      // Success Sound
      if (synthRef.current) {
           const now = Tone.now();
           synthRef.current.triggerAttackRelease(["C5", "E5", "G5", "C6"], "16n", now);
      }

      // Wait then Advance
      setTimeout(() => {
          setFeedback('idle');
          if (stepIndex < steps.length - 1) {
              setStepIndex(prev => prev + 1);
          } else {
              onComplete();
          }
      }, 1500);
  };

  const renderCurrentStep = () => {
      if (!currentStep) return <div>Lesson Completed!</div>;

      switch(lessonId) {
          case 'rhythm': return <RhythmGame step={currentStep} onComplete={handleStepComplete} membrane={membraneRef.current} />;
          case 'pitch': return <PitchGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} />;
          case 'melody': return <MelodyGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} />;
          case 'harmony': return <HarmonyGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} />;
          case 'chords': return <ChordGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} />;
          default: return <div>Unknown Lesson</div>;
      }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 flex items-center gap-4 border-b border-slate-100 bg-white">
            <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95">
                <ArrowLeft size={28} className="text-slate-400" />
            </button>
            <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-[#58CC02] transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto w-full max-w-2xl mx-auto">
            <div key={stepIndex} className="w-full animate-slide-in-right">
                {renderCurrentStep()}
            </div>
        </div>

        {/* Success Overlay */}
        {feedback === 'success' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
                 <div className="bg-[#58CC02] text-white px-12 py-8 rounded-[32px] shadow-2xl animate-pop-in flex flex-col items-center gap-4">
                     <Check size={80} strokeWidth={4} className="animate-bounce" />
                     <span className="text-4xl font-black">참 잘했어요!</span>
                 </div>
            </div>
        )}
    </div>
  );
};

// --- GAME COMPONENTS ---

const RhythmGame: React.FC<{step: LessonStep, onComplete: () => void, membrane: any}> = ({step, onComplete, membrane}) => {
    const [taps, setTaps] = useState(0);

    // Reset taps on new step
    useEffect(() => { setTaps(0); }, [step]);

    const playDemo = async () => {
        await Tone.start();
        if(!membrane) return;
        const now = Tone.now();
        // Play 4 beats
        for(let i=0; i<4; i++) {
            membrane.triggerAttackRelease("C2", "8n", now + i*0.5);
        }
    };

    if (step.type === 'listen') {
        return (
            <div className="text-center flex flex-col items-center gap-8">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>
                <button 
                    onClick={() => { playDemo(); setTimeout(onComplete, 2500); }}
                    className="w-32 h-32 bg-[#4285F4] rounded-full text-white shadow-xl active:scale-95 transition-all flex items-center justify-center hover:scale-105 animate-pop-in delay-200"
                >
                    <Volume2 size={48} />
                </button>
            </div>
        );
    }

    return (
        <div className="text-center flex flex-col items-center gap-8">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <div className="flex gap-2 h-8">
                {[...Array(step.target)].map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full transition-all duration-300 ${i < taps ? 'bg-[#58CC02] scale-125' : 'bg-slate-200'}`} />
                ))}
            </div>
            <button 
                onClick={async () => {
                    await Tone.start();
                    membrane?.triggerAttackRelease("C2", "8n");
                    const newTaps = taps + 1;
                    setTaps(newTaps);
                    if (newTaps >= step.target) {
                        setTimeout(onComplete, 300);
                    }
                }}
                className="w-48 h-48 bg-[#EA4335] rounded-full shadow-[0_8px_0_#B71C1C] active:shadow-none active:translate-y-[8px] transition-all flex items-center justify-center animate-pop-in hover:brightness-110"
            >
                <span className="text-4xl font-black text-white">쿵!</span>
            </button>
        </div>
    );
};

const PitchGame: React.FC<{step: LessonStep, onComplete: () => void, synth: any}> = ({step, onComplete, synth}) => {
    const playLow = async () => { await Tone.start(); synth?.triggerAttackRelease("C3", "2n"); };
    const playHigh = async () => { await Tone.start(); synth?.triggerAttackRelease("C6", "2n"); };

    if (step.type === 'listen') {
        return (
            <div className="flex flex-col gap-8 items-center text-center">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <div className="flex gap-6 animate-slide-up delay-100">
                    <button onClick={playHigh} className="p-6 bg-sky-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-sky-200 hover:scale-105 transition-all">
                        <span className="text-6xl animate-float">🐦</span>
                        <span className="font-bold text-sky-700">높은 소리</span>
                    </button>
                    <button onClick={playLow} className="p-6 bg-indigo-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-indigo-200 hover:scale-105 transition-all">
                        <span className="text-6xl">🐘</span>
                        <span className="font-bold text-indigo-700">낮은 소리</span>
                    </button>
                </div>
                <button onClick={onComplete} className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-lg mt-4 hover:scale-105 active:scale-95 transition-transform animate-pop-in delay-200">
                    다음으로
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 items-center text-center">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <button onClick={async () => { await Tone.start(); step.target === 'high' ? playHigh() : playLow(); }} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 active:scale-95 transition-all">
                <Volume2 size={40} className="text-slate-600" />
            </button>
            
            <div className="grid grid-cols-2 gap-6 w-full max-w-md animate-slide-up delay-100">
                <button 
                    onClick={() => { playHigh(); if(step.target === 'high') onComplete(); }}
                    className="aspect-square bg-white border-4 border-sky-100 rounded-3xl hover:border-sky-300 active:scale-95 transition-all flex items-center justify-center text-6xl shadow-sm hover:shadow-md"
                >
                    🐦
                </button>
                <button 
                    onClick={() => { playLow(); if(step.target === 'low') onComplete(); }}
                    className="aspect-square bg-white border-4 border-indigo-100 rounded-3xl hover:border-indigo-300 active:scale-95 transition-all flex items-center justify-center text-6xl shadow-sm hover:shadow-md"
                >
                    🐘
                </button>
            </div>
        </div>
    );
};

const MelodyGame: React.FC<{step: LessonStep, onComplete: () => void, synth: any}> = ({step, onComplete, synth}) => {
    const [playedNotes, setPlayedNotes] = useState<string[]>([]);
    const targetNotes = Array.isArray(step.target) ? step.target : [step.target];

    useEffect(() => { setPlayedNotes([]); }, [step]);

    const handleNoteClick = async (note: string) => {
        await Tone.start();
        synth?.triggerAttackRelease(note, "8n");
        
        // If it's the next correct note
        const nextIndex = playedNotes.length;
        if (targetNotes[nextIndex] === note) {
            const nextPlayed = [...playedNotes, note];
            setPlayedNotes(nextPlayed);
            if (nextPlayed.length === targetNotes.length) {
                setTimeout(onComplete, 500);
            }
        }
    };

    const notes = [
        { note: 'C4', color: 'bg-[#EA4335]', label: '도' },
        { note: 'D4', color: 'bg-[#FBBC04]', label: '레' },
        { note: 'E4', color: 'bg-[#34A853]', label: '미' },
        { note: 'F4', color: 'bg-[#4285F4]', label: '파' },
        { note: 'G4', color: 'bg-[#AA00FF]', label: '솔' },
    ];

    return (
        <div className="flex flex-col items-center gap-8 w-full">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>
            
            {/* Progress Visualization */}
            <div className="flex gap-2 mb-4 animate-fade-in delay-200">
                {targetNotes.map((n: string, i: number) => (
                    <div key={i} className={`w-4 h-4 rounded-full transition-colors duration-300 ${i < playedNotes.length ? 'bg-slate-800 scale-125' : 'bg-slate-200'}`} />
                ))}
            </div>

            <div className="flex gap-2 animate-slide-up delay-200">
                {notes.map((key, i) => {
                    const isNext = targetNotes[playedNotes.length] === key.note;
                    return (
                        <button
                            key={i}
                            onClick={() => handleNoteClick(key.note)}
                            className={`
                                w-14 h-40 md:w-20 md:h-56 rounded-b-xl flex items-end justify-center pb-4 text-white font-bold text-xl shadow-md transition-all active:scale-95 duration-200
                                ${key.color}
                                ${isNext ? 'ring-4 ring-black/20 translate-y-2 animate-pulse' : 'hover:-translate-y-1'}
                            `}
                        >
                            {key.label}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const HarmonyGame: React.FC<{step: LessonStep, onComplete: () => void, synth: any}> = ({step, onComplete, synth}) => {
    const [activeVoices, setActiveVoices] = useState<number[]>([]);

    const playMono = async () => { await Tone.start(); synth?.triggerAttackRelease(["C4"], "1n"); };

    const VOICES = [
        { note: "C4", color: "bg-rose-400", label: "도", emoji: "🐸" },
        { note: "E4", color: "bg-emerald-400", label: "미", emoji: "🦊" },
        { note: "G4", color: "bg-sky-400", label: "솔", emoji: "🐳" },
    ];

    const toggleVoice = async (index: number) => {
        await Tone.start();
        
        // Always play the note when clicked
        synth?.triggerAttackRelease(VOICES[index].note, "2n");

        if (!activeVoices.includes(index)) {
             const newActive = [...activeVoices, index];
             setActiveVoices(newActive);
             
             // Check completion
             if (newActive.length === 3) {
                 setTimeout(() => {
                     // Play full chord as reward
                     synth?.triggerAttackRelease(["C4", "E4", "G4", "C5"], "1n");
                     onComplete();
                 }, 600);
             }
        }
    };

    if (step.type === 'listen') {
         return (
             <div className="text-center flex flex-col items-center gap-8">
                 <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                 <p className="text-xl text-slate-500 animate-slide-up delay-100">{step.description}</p>
                 <button 
                     onClick={() => { 
                         playMono();
                         setTimeout(onComplete, 2500); 
                     }}
                     className="w-32 h-32 bg-[#4285F4] rounded-full text-white shadow-xl active:scale-95 flex items-center justify-center animate-pop-in delay-200 hover:scale-105 transition-transform"
                 >
                     <span className="text-6xl">👤</span>
                 </button>
                 <p className="text-slate-400 font-bold">눌러서 들어보세요</p>
             </div>
         );
    }

    return (
        <div className="text-center flex flex-col items-center gap-8">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-xl text-slate-500 animate-slide-up delay-100">{step.description}</p>
            
            <div className="flex justify-center gap-4 w-full max-w-md animate-slide-up delay-200">
                 {VOICES.map((voice, idx) => {
                     const isActive = activeVoices.includes(idx);
                     return (
                        <button 
                            key={idx}
                            onClick={() => toggleVoice(idx)}
                            className={`
                                w-24 h-40 rounded-full flex flex-col items-center justify-end pb-4 transition-all duration-300
                                ${isActive ? `${voice.color} -translate-y-4 shadow-xl scale-110` : 'bg-slate-200 hover:bg-slate-300'}
                            `}
                        >
                            <span className={`text-5xl mb-2 transition-transform duration-300 ${isActive ? 'scale-125 animate-bounce' : 'grayscale opacity-50'}`}>
                                {voice.emoji}
                            </span>
                            <span className={`font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>{voice.label}</span>
                        </button>
                     );
                 })}
            </div>
            <div className="h-8 flex gap-2">
                {[0, 1, 2].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-colors ${activeVoices.length > i ? 'bg-[#58CC02]' : 'bg-slate-200'}`} />
                ))}
            </div>
        </div>
    );
};

const ChordGame: React.FC<{step: LessonStep, onComplete: () => void, synth: any}> = ({step, onComplete, synth}) => {
    
    const playMajor = async () => { await Tone.start(); synth?.triggerAttackRelease(["C4", "E4", "G4"], "1n"); };
    const playMinor = async () => { await Tone.start(); synth?.triggerAttackRelease(["C4", "Eb4", "G4"], "1n"); };

    if (step.type === 'listen') {
        return (
            <div className="text-center flex flex-col items-center gap-8">
                 <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                 <p className="text-xl text-slate-500 animate-slide-up delay-100">{step.description}</p>
                 <div className="w-40 h-40 flex items-center justify-center animate-pop-in delay-200">
                    {step.demoType === 'major' ? <Sun size={120} className="text-amber-400 animate-spin-slow" /> : <Cloud size={120} className="text-slate-400 animate-float" />}
                 </div>
                 <button 
                     onClick={() => { 
                         if(step.demoType === 'major') playMajor(); else playMinor();
                         setTimeout(onComplete, 2000); 
                     }}
                     className="px-10 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-lg hover:scale-105 active:scale-95 transition-transform animate-slide-up delay-300"
                 >
                     들어보기
                 </button>
            </div>
        );
    }

    return (
        <div className="text-center flex flex-col items-center gap-8">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <button onClick={async () => { await Tone.start(); playMajor(); setTimeout(playMinor, 1000); }} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 active:scale-95 transition-transform animate-pop-in">
                <Volume2 size={32} />
            </button>
            <div className="grid grid-cols-2 gap-6 w-full max-w-md animate-slide-up delay-100">
                 <button 
                    onClick={() => { playMajor(); if(step.target==='major') onComplete(); }}
                    className="h-48 bg-amber-50 border-4 border-amber-200 rounded-3xl hover:bg-amber-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group"
                 >
                     <Sun size={64} className="text-amber-500 group-hover:rotate-12 transition-transform" />
                     <span className="font-bold text-amber-700">밝은 느낌</span>
                 </button>
                 <button 
                    onClick={() => { playMinor(); if(step.target==='minor') onComplete(); }}
                    className="h-48 bg-slate-50 border-4 border-slate-200 rounded-3xl hover:bg-slate-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group"
                 >
                     <Cloud size={64} className="text-slate-400 group-hover:scale-110 transition-transform" />
                     <span className="font-bold text-slate-600">슬픈 느낌</span>
                 </button>
            </div>
        </div>
    );
};