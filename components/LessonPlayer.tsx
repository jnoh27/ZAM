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
    bpm?: number;
};

// --- LESSON DATA ---
const LESSONS: Record<string, LessonStep[]> = {
    'rhythm-intro': [
        { type: 'listen', title: '박자란 무엇일까?', description: '음악이 앞으로 나아가게 하는 일정한 맥박이에요', demoType: 'concept' },
        { type: 'listen', title: '박자를 느껴봐요', description: '깜빡이는 빛과 소리에 맞춰 고개를 끄덕여보세요', demoType: 'pulse', bpm: 120 },
        { type: 'listen', title: '이번엔 좀 더 빠르게!', description: '방금 전보다 심장이 빨리 뛰는 것 같죠?', demoType: 'pulse', bpm: 160 },
        { type: 'listen', title: '이번엔 좀 더 느리게~', description: '천천히 여유롭게 걸어가는 느낌이에요', demoType: 'pulse', bpm: 90 },
        { type: 'listen', title: '다시 경쾌하게!', description: '조깅을 하는 속도예요', demoType: 'pulse', bpm: 140 },
        { type: 'listen', title: '마지막으로 차분하게', description: '편안하게 숨을 쉬는 속도예요', demoType: 'pulse', bpm: 100 },
        { type: 'tap', title: '첫 번째 도전!', description: '카운트다운 후 나오는 소리에 맞춰 버튼을 눌러보세요', target: 4 },
        { type: 'tap', title: '두 번째 도전!', description: '속도가 무작위로 바뀝니다. 잘 듣고 따라오세요', target: 4 },
        { type: 'tap', title: '마지막 도전!', description: '이제 박자의 고수! 완벽하게 맞춰볼까요?', target: 4 }
    ],
    'rhythm-beat': [],
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

        switch (lessonId) {
            case 'rhythm-intro':
            case 'rhythm-beat':
            case 'rhythm-pattern':
            case 'rhythm-master':
                return <RhythmGame step={currentStep} onComplete={handleStepComplete} membrane={membraneRef.current} />;
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

const RhythmGame: React.FC<{ step: LessonStep, onComplete: () => void, membrane: any }> = ({ step, onComplete, membrane }) => {
    const [taps, setTaps] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Reset state on new step
    useEffect(() => {
        setTaps(0);
        setIsPlaying(false);
        setActiveIndex(-1);
    }, [step]);

    const playConcept = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        await Tone.start();

        const isPulseDemo = step.demoType === 'pulse';
        const totalBeats = isPulseDemo ? 4 : 1; // For concept, just one pulse

        // Calculate interval based on BPM if provided, defaulting to 100 BPM (600ms)
        const bpm = step.bpm || 100;
        const intervalMs = (60 / bpm) * 1000;

        let count = 0;
        const intervalId = setInterval(() => {
            if (count >= totalBeats) {
                clearInterval(intervalId);
                setActiveIndex(-1);
                setTimeout(() => {
                    setIsPlaying(false);
                    onComplete();
                }, 1000);
                return;
            }
            setActiveIndex(count);
            membrane?.triggerAttackRelease("C2", "8n");
            count++;
        }, intervalMs);
    };

    if (step.type === 'listen') {
        const isConcept = step.demoType === 'concept';
        const isPulse = step.demoType === 'pulse';

        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Visualizer Area */}
                <div className="h-32 flex items-center justify-center w-full animate-slide-up delay-200">
                    {isPulse && (
                        <div className="flex gap-4">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`
                                        w-16 h-16 rounded-full transition-all duration-300 shadow-md flex items-center justify-center
                                        ${activeIndex === i ? 'bg-[#58CC02] scale-125 shadow-[#58CC02]/50 shadow-lg' : 'bg-slate-200'}
                                    `}
                                />
                            ))}
                        </div>
                    )}

                    {isConcept && (
                        <div className={`
                            w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
                            ${activeIndex !== -1 ? 'bg-rose-400 scale-125 shadow-rose-400/50 shadow-2xl' : 'bg-slate-100'}
                        `}>
                            <Heart size={48} className={`text-white transition-all duration-300 ${activeIndex !== -1 ? 'scale-110' : 'scale-100 text-rose-300'}`} fill="currentColor" />
                        </div>
                    )}
                </div>

                <button
                    onClick={playConcept}
                    disabled={isPlaying}
                    className={`
                        w-64 py-4 rounded-2xl text-white font-black text-xl shadow-[0_6px_0_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-2
                        ${isPlaying ? 'bg-slate-300 shadow-none translate-y-[6px]' : 'bg-[#4285F4] hover:brightness-110 active:translate-y-[6px] active:shadow-none'}
                    `}
                >
                    <Volume2 size={28} />
                    {isPlaying ? '듣는 중...' : '들어보기'}
                </button>
            </div>
        );
    }

    // Tap step
    const [countdown, setCountdown] = useState<number | null>(null);
    const [targetBpm, setTargetBpm] = useState(120);
    const [metronomeIndex, setMetronomeIndex] = useState(-1);
    const metronomeEventRef = useRef<number | null>(null);
    const beatCountRef = useRef(0);

    useEffect(() => {
        if (step.type === 'tap') {
            // Pick random BPM strictly between 50 and 200 in increments of 10
            const randomBpm = Math.floor(Math.random() * 16) * 10 + 50;
            setTargetBpm(randomBpm);
            setMetronomeIndex(-1);

            // Start countdown
            setCountdown(3);
            let count = 3;
            const timer = setInterval(() => {
                count--;
                if (count > 0) {
                    setCountdown(count);
                } else {
                    clearInterval(timer);
                    setCountdown(null);

                    // Start metronome
                    Tone.start().then(() => {
                        Tone.Transport.bpm.value = randomBpm;
                        beatCountRef.current = 0;

                        // Clear any existing transport events
                        if (metronomeEventRef.current !== null) {
                            Tone.Transport.clear(metronomeEventRef.current);
                        }

                        metronomeEventRef.current = Tone.Transport.scheduleRepeat((time) => {
                            // Update React state safely
                            Tone.Draw.schedule(() => {
                                setMetronomeIndex(beatCountRef.current % step.target);
                                beatCountRef.current++;
                            }, time);
                            membrane?.triggerAttackRelease("C2", "8n", time);
                        }, "4n");

                        Tone.Transport.start();
                    });
                }
            }, 1000); // 1 second per countdown number

            return () => {
                clearInterval(timer);
                if (metronomeEventRef.current !== null) {
                    Tone.Transport.clear(metronomeEventRef.current);
                }
                Tone.Transport.stop();
            };
        }
    }, [step, membrane]);

    if (step.type === 'tap') {
        const isCountingDown = countdown !== null;

        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <div className="flex flex-col items-center animate-slide-up delay-100">
                    <p className="text-xl text-slate-500 font-medium mb-1">{step.description}</p>
                    {!isCountingDown && (
                        <div className="bg-slate-100 px-4 py-1 rounded-full border-2 border-slate-200">
                            <span className="font-black text-slate-600">현재 속도: <span className="text-blue-500">{targetBpm}</span> BPM</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 h-24 items-center justify-center w-full animate-slide-up delay-200">
                    {[...Array(step.target)].map((_, i) => {
                        const isTapped = i < taps;
                        const isMetronome = i === metronomeIndex;

                        let circleClass = 'bg-slate-200';
                        if (isTapped) {
                            circleClass = isMetronome ? 'bg-[#58CC02] ring-4 ring-rose-400 scale-125 shadow-lg' : 'bg-[#58CC02] scale-110 shadow-lg';
                        } else if (isMetronome) {
                            circleClass = 'bg-rose-400 scale-110 shadow-lg shadow-rose-400/50';
                        }

                        return (
                            <div
                                key={i}
                                className={`w-16 h-16 rounded-full transition-all duration-100 shadow-md ${circleClass}`}
                            />
                        );
                    })}
                </div>

                <div className="animate-pop-in mt-4">
                    <button
                        disabled={isCountingDown}
                        onClick={async () => {
                            if (isCountingDown) return;
                            await Tone.start();

                            // User tap feedback
                            const newTaps = taps + 1;
                            if (newTaps <= step.target) {
                                setTaps(newTaps);

                                // Visual feedback circle expands
                                setActiveIndex(0);
                                setTimeout(() => setActiveIndex(-1), 150);

                                if (newTaps === step.target) {
                                    // Stop metronome on win
                                    if (metronomeEventRef.current !== null) {
                                        Tone.Transport.clear(metronomeEventRef.current);
                                    }
                                    Tone.Transport.stop();
                                    setTimeout(onComplete, 600);
                                }
                            }
                        }}
                        className={`
                            w-48 h-48 rounded-full overflow-hidden relative transition-all flex items-center justify-center
                            ${isCountingDown
                                ? 'bg-slate-300 shadow-[0_12px_0_#94A3B8] cursor-not-allowed text-white'
                                : 'bg-[#EA4335] shadow-[0_12px_0_#B71C1C] cursor-pointer hover:brightness-110 active:shadow-[0_2px_0_#B71C1C] active:translate-y-[10px]'}
                        `}
                    >
                        {/* Ripple effect on tap */}
                        {!isCountingDown && (
                            <div className={`
                                absolute inset-0 bg-white/30 rounded-full scale-0 transition-transform duration-300 origin-center
                                ${activeIndex !== -1 ? 'scale-150 opacity-0' : 'opacity-100'}
                            `} />
                        )}
                        <span className={`font-black relative z-10 ${isCountingDown ? 'text-6xl animate-pulse' : 'text-4xl text-white'}`}>
                            {isCountingDown ? countdown : '쿵!'}
                        </span>
                    </button>
                </div>
            </div>
        );
    }
};

const PitchGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any }> = ({ step, onComplete, synth }) => {
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
                    onClick={() => { playHigh(); if (step.target === 'high') onComplete(); }}
                    className="aspect-square bg-white border-4 border-sky-100 rounded-3xl hover:border-sky-300 active:scale-95 transition-all flex items-center justify-center text-6xl shadow-sm hover:shadow-md"
                >
                    🐦
                </button>
                <button
                    onClick={() => { playLow(); if (step.target === 'low') onComplete(); }}
                    className="aspect-square bg-white border-4 border-indigo-100 rounded-3xl hover:border-indigo-300 active:scale-95 transition-all flex items-center justify-center text-6xl shadow-sm hover:shadow-md"
                >
                    🐘
                </button>
            </div>
        </div>
    );
};

const MelodyGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any }> = ({ step, onComplete, synth }) => {
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

const HarmonyGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any }> = ({ step, onComplete, synth }) => {
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

const ChordGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any }> = ({ step, onComplete, synth }) => {

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
                        if (step.demoType === 'major') playMajor(); else playMinor();
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
                    onClick={() => { playMajor(); if (step.target === 'major') onComplete(); }}
                    className="h-48 bg-amber-50 border-4 border-amber-200 rounded-3xl hover:bg-amber-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                    <Sun size={64} className="text-amber-500 group-hover:rotate-12 transition-transform" />
                    <span className="font-bold text-amber-700">밝은 느낌</span>
                </button>
                <button
                    onClick={() => { playMinor(); if (step.target === 'minor') onComplete(); }}
                    className="h-48 bg-slate-50 border-4 border-slate-200 rounded-3xl hover:bg-slate-100 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                    <Cloud size={64} className="text-slate-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-600">슬픈 느낌</span>
                </button>
            </div>
        </div>
    );
};