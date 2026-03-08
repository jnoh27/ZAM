import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Check, Volume2, ArrowRight, Star, Heart, Cloud, Sun, Music, Circle, Triangle, Square } from 'lucide-react';

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
    'rhythm-beat': [
        { type: 'play', title: '다양한 리듬 체험', description: '가장 흔하게 쓰이는 8가지 리듬 패턴을 직접 들어보세요.' }
    ],
    'rhythm-pattern': [
        { type: 'play', title: '드럼 머신 스튜디오', description: '킥, 스네어, 하이햇이 조합된 16스텝 시퀀서로 리듬을 파악해보세요.' }
    ],
    'rhythm-master': [
        { type: 'play', title: '나만의 리듬 만들기', description: '빈 그리드 위에 직접 창의적인 리듬을 만들어보세요!' }
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

        switch (lessonId) {
            case 'rhythm-intro':
                return <RhythmGame step={currentStep} onComplete={handleStepComplete} membrane={membraneRef.current} />;
            case 'rhythm-master':
                return <RhythmMasterGame step={currentStep} onComplete={handleStepComplete} />;
            case 'rhythm-beat':
                return <RhythmBeatGame step={currentStep} onComplete={handleStepComplete} />;
            case 'rhythm-pattern':
                return <RhythmMachineGame step={currentStep} onComplete={handleStepComplete} />;
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto w-full h-full max-w-[1600px] mx-auto">
                <div key={stepIndex} className="w-full h-full flex flex-col items-center justify-center animate-slide-in-right">
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

const PATTERNS = [
    { name: '정박', desc: 'EDM, 하우스의 표준. 모든 박자에 킥이 들어감.', kick: [0, 4, 8, 12] },
    { name: '투 비트', desc: '단순하고 경쾌함. 펑크 락이나 트로트의 기초.', kick: [0, 8] },
    { name: '8비트 기본', desc: '팝/락의 정석. "쿵 쿵 팍 쿵" 하는 안정적인 추진력.', kick: [0, 2, 8, 10] },
    { name: '저지 클럽', desc: '"쿵-쿵-쿵쿵쿵". 2박 뒤부터 쪼개지는 3연타가 핵심.', kick: [0, 4, 8, 11, 14] },
    { name: '엇박 강조', desc: '2박 뒷박(앤)을 강조해 펑키하고 쫄깃한 느낌을 줌.', kick: [0, 6, 8] },
    { name: '셔플/스윙', desc: '셋잇단음표 기반. 블루스나 바운스 있는 댄스곡.', kick: [0, 3, 4, 7, 8, 11, 12, 15] },
    { name: '트랩/힙합', desc: '엇박과 정박을 섞어 묵직하고 트렌디한 무게감 형성.', kick: [0, 3, 8, 12] },
    { name: '보사노바', desc: '라틴 리듬의 정수. 세련된 당김음으로 부드러운 분위기.', kick: [0, 6, 8, 14] },
];

const RhythmBeatGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
    const [currentBeat, setCurrentBeat] = useState(-1);

    // Audio Refs
    const kickRef = useRef<Tone.MembraneSynth | null>(null);
    const transportEventRef = useRef<number | null>(null);

    // Dynamic ref to current pattern
    const selectedPatternRef = useRef(PATTERNS[0]);
    useEffect(() => {
        selectedPatternRef.current = PATTERNS[selectedPatternIndex];
    }, [selectedPatternIndex]);

    // Setup Synths
    useEffect(() => {
        kickRef.current = new Tone.MembraneSynth().toDestination();
        return () => {
            kickRef.current?.dispose();
            if (transportEventRef.current !== null) {
                Tone.Transport.clear(transportEventRef.current);
            }
            Tone.Transport.stop();
            Tone.Transport.cancel(0);
        };
    }, []);

    // Toggle Play State
    const togglePlay = async () => {
        if (!isPlaying) {
            await Tone.start();
            Tone.Transport.bpm.value = bpm;

            let stepCount = 0;
            if (transportEventRef.current !== null) {
                Tone.Transport.clear(transportEventRef.current);
            }

            transportEventRef.current = Tone.Transport.scheduleRepeat((time) => {
                const stepIdx = stepCount % 16;
                const pattern = selectedPatternRef.current;

                if (pattern.kick.includes(stepIdx)) {
                    kickRef.current?.triggerAttackRelease("C1", "16n", time);
                }

                Tone.Draw.schedule(() => {
                    setCurrentBeat(stepIdx);
                }, time);

                stepCount++;
            }, "16n");

            Tone.Transport.start();
            setIsPlaying(true);
        } else {
            Tone.Transport.pause();
            setIsPlaying(false);
            setCurrentBeat(-1);
        }
    };

    // Handle BPM Adjustments
    const adjustBpm = (amount: number) => {
        setBpm(prev => {
            const newBpm = Math.max(50, Math.min(250, prev + amount));
            Tone.Transport.bpm.value = newBpm;
            return newBpm;
        });
    };

    const selectedPattern = PATTERNS[selectedPatternIndex];

    return (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24 w-full max-w-[1400px] mx-auto min-h-[700px] px-12 py-12 animate-fade-in">
            {/* Left Side: Controls & Metronome */}
            <div className="flex flex-col items-center justify-between w-[450px] h-[600px] shrink-0 relative pt-4">

                {/* Play Button - Normal Rounded Square */}
                <button
                    onClick={togglePlay}
                    className="group relative z-30 mt-4 active:scale-95 transition-transform flex flex-col items-center"
                >
                    <div className={`w-32 h-32 rounded-3xl flex items-center justify-center text-6xl shadow-xl border-4 transition-all duration-300 ${isPlaying ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-rose-200' : 'bg-blue-50 border-blue-200 text-blue-500 hover:bg-blue-100 shadow-blue-200'
                        }`}>
                        {isPlaying ? '⏸' : '▶'}
                    </div>
                </button>

                {/* Big Circle BPM Controller */}
                <div className="relative flex flex-col items-center justify-center w-[300px] h-[300px] my-auto">
                    {/* Visual Pulse Layer */}
                    <div className={`absolute inset-0 border-[16px] border-blue-400/20 rounded-full scale-[1.3] transition-all duration-500 -z-10 ${isPlaying ? 'opacity-100 animate-ping-slow' : 'opacity-0 scale-100'}`} />

                    {/* Main UI Circle */}
                    <div className="absolute inset-0 rounded-full border-[6px] border-slate-200 bg-white shadow-2xl flex flex-col items-center justify-between z-20 py-8">
                        {/* Adjust Up */}
                        <button onClick={() => adjustBpm(10)} className="w-32 h-16 flex items-center justify-center text-slate-300 hover:text-slate-600 active:scale-90 transition-all">
                            <span className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[25px] border-l-transparent border-r-transparent border-b-current block" />
                        </button>

                        <div className="flex flex-col items-center justify-center -mt-2">
                            <span className="text-slate-400 font-bold tracking-widest text-sm uppercase -mb-3">Tempo</span>
                            <span className="text-[100px] font-black text-slate-800 tabular-nums leading-none tracking-tighter">{bpm}</span>
                        </div>

                        {/* Adjust Down */}
                        <button onClick={() => adjustBpm(-10)} className="w-32 h-16 flex items-center justify-center text-slate-300 hover:text-slate-600 active:scale-90 transition-all">
                            <span className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[25px] border-l-transparent border-r-transparent border-t-current block" />
                        </button>
                    </div>
                </div>

                {/* 4 Lights at the bottom */}
                <div className="flex gap-8 items-center justify-center w-full mt-4 h-20">
                    {[...Array(4)].map((_, i) => {
                        const activeBeatIndex = Math.floor(currentBeat / 4);
                        const isLightOn = currentBeat !== -1 && activeBeatIndex === i;

                        return (
                            <div
                                key={i}
                                className={`
                                    w-10 h-10 rounded-full border-4 transition-all duration-100 ease-in-out
                                    ${isLightOn
                                        ? 'bg-blue-500 border-blue-400 shadow-[0_0_25px_8px_rgba(59,130,246,0.6)] scale-[1.15]'
                                        : 'bg-slate-100 border-slate-300 shadow-inner scale-100'
                                    }
                                `}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Right Side: Rhythm 2x4 Pattern Grid */}
            <div className="flex flex-col flex-1 h-[750px] relative">
                <div className="flex justify-between items-center mb-10 pl-4 w-full border-b-4 border-slate-100 pb-4 h-[80px]">
                    <h3 className="font-black text-4xl text-slate-800 tracking-tight">
                        Rhythm Button
                    </h3>
                    <button onClick={onComplete} className="px-10 py-5 bg-[#58CC02] text-white rounded-2xl font-black text-2xl shadow-[0_8px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[8px] active:shadow-none transition-all mr-2">
                        다음 레슨
                    </button>
                </div>

                {/* 2x4 Grid */}
                <div className="flex-1 grid grid-cols-2 grid-rows-4 gap-6 z-20 h-full relative pl-4 mb-4">
                    {PATTERNS.map((pattern, idx) => {
                        const isSelected = selectedPatternIndex === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedPatternIndex(idx);
                                    if (!isPlaying) togglePlay();
                                }}
                                className={`
                                    flex flex-col justify-center px-8 rounded-3xl border-[6px] transition-all w-full h-full text-left active:scale-[0.97]
                                    ${isSelected
                                        ? 'bg-blue-50 border-blue-500 shadow-xl text-blue-700 z-10 scale-[1.03]'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <span className={`font-black text-3xl truncate`}>{pattern.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Description Space - Pushed down manually */}
                <div className={`
                    ml-4 py-8 px-10 bg-slate-900 rounded-[2rem] shadow-2xl flex items-center gap-8 text-white h-[140px] transition-all duration-500
                    ${isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}
                `}>
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 border-2 border-blue-500/50 text-5xl">
                        💡
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                        <span className="text-blue-400 font-black uppercase tracking-widest text-sm bg-blue-500/10 px-3 py-1 rounded-full w-fit mb-1">
                            현재 패턴 특징
                        </span>
                        <p className="text-2xl font-bold text-slate-100 leading-snug">
                            {selectedPattern.desc}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

const MULTI_PATTERNS = [
    { name: '정박', desc: 'EDM의 핵심. 킥 4번, 엇박 하이햇과 정박 스네어.', kick: [0, 4, 8, 12], snare: [4, 12], hihat: [2, 6, 10, 14] },
    { name: '투 비트', desc: '경쾌한 락/펑크. 빠른 속도로 연주되는 베이직 비트.', kick: [0, 8], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: '8비트 기본', desc: '"쿵-쿵-팍-쿵" 대중음악의 가장 표준적인 리듬.', kick: [0, 2, 8, 10], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: '저지 클럽', desc: '독특한 킥 바운스와 잘게 쪼개지는 하이햇.', kick: [0, 4, 8, 11, 14], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: '엇박 강조', desc: '뒷박을 강조해 펑키하고 쫄깃한 느낌.', kick: [0, 6, 8], snare: [4, 12], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
    { name: '셔플/스윙', desc: '셋잇단음표 느낌의 바운스. 블루스와 재즈 기반.', kick: [0, 8], snare: [4, 12], hihat: [0, 3, 4, 7, 8, 11, 12, 15] },
    { name: '트랩/힙합', desc: '잘게 쪼개지는 16비트 하이햇과 묵직한 808 킥.', kick: [0, 3, 8, 12], snare: [4, 12], hihat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    { name: '보사노바', desc: '라틴 보사노바 크라베 패턴과 부드러운 리듬.', kick: [0, 6, 8, 14], snare: [2, 5, 9, 12, 15], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
];

const RhythmMachineGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
    const [currentBeat, setCurrentBeat] = useState(-1);

    // Audio Refs
    const kickRef = useRef<Tone.MembraneSynth | null>(null);
    const snareRef = useRef<Tone.NoiseSynth | null>(null);
    const hihatRef = useRef<Tone.MetalSynth | null>(null);
    const transportEventRef = useRef<number | null>(null);

    // Dynamic ref to current pattern
    const selectedPatternRef = useRef(MULTI_PATTERNS[0]);
    useEffect(() => {
        selectedPatternRef.current = MULTI_PATTERNS[selectedPatternIndex];
    }, [selectedPatternIndex]);

    // Setup Synths
    useEffect(() => {
        kickRef.current = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } }).toDestination();
        snareRef.current = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination();
        hihatRef.current = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination();
        hihatRef.current.volume.value = -12; // lower hihat volume

        return () => {
            kickRef.current?.dispose();
            snareRef.current?.dispose();
            hihatRef.current?.dispose();
            if (transportEventRef.current !== null) Tone.Transport.clear(transportEventRef.current);
            Tone.Transport.stop();
            Tone.Transport.cancel(0);
        };
    }, []);

    // Toggle Play State
    const togglePlay = async () => {
        if (!isPlaying) {
            await Tone.start();
            Tone.Transport.bpm.value = bpm;

            let stepCount = 0;
            if (transportEventRef.current !== null) Tone.Transport.clear(transportEventRef.current);

            transportEventRef.current = Tone.Transport.scheduleRepeat((time) => {
                const stepIdx = stepCount % 16;
                const pattern = selectedPatternRef.current;

                if (pattern.kick.includes(stepIdx)) kickRef.current?.triggerAttackRelease("C1", "16n", time);
                if (pattern.snare.includes(stepIdx)) snareRef.current?.triggerAttackRelease("16n", time);
                if (pattern.hihat.includes(stepIdx)) hihatRef.current?.triggerAttackRelease("32n", time);

                Tone.Draw.schedule(() => { setCurrentBeat(stepIdx); }, time);
                stepCount++;
            }, "16n");

            Tone.Transport.start();
            setIsPlaying(true);
        } else {
            Tone.Transport.pause();
            setIsPlaying(false);
            setCurrentBeat(-1);
        }
    };

    // Handle BPM Adjustments
    const adjustBpm = (amount: number) => {
        setBpm(prev => {
            const newBpm = Math.max(50, Math.min(250, prev + amount));
            Tone.Transport.bpm.value = newBpm;
            return newBpm;
        });
    };

    const selectedPattern = MULTI_PATTERNS[selectedPatternIndex];

    const renderGridRow = (name: string, data: number[], iconNode: React.ReactNode, rowColor: string) => (
        <div className="flex items-center gap-4 w-full">
            {/* Icon Circle */}
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 relative"
                style={{ backgroundColor: rowColor }}
            >
                <div>{iconNode}</div>
            </div>
            {/* Steps */}
            <div className="flex-1 flex gap-2 h-16">
                {Array.from({ length: 16 }).map((_, i) => {
                    const isActive = data.includes(i);
                    const isCurrentStep = currentBeat === i;
                    const isBigBeat = i % 4 === 0;

                    return (
                        <div
                            key={i}
                            className={`
                                flex-1 rounded-xl transition-all duration-75 relative border-b-4
                                ${isActive
                                    ? 'shadow-md translate-y-[-2px]'
                                    : 'bg-white border-[#DADCE0]'
                                }
                                ${isCurrentStep ? 'ring-2 ring-indigo-400 z-10' : ''}
                                ${isBigBeat && !isActive ? 'bg-[#E8EAED]' : ''}
                            `}
                            style={{
                                backgroundColor: isActive ? rowColor : undefined,
                                borderColor: isActive ? 'rgba(0,0,0,0.1)' : undefined
                            }}
                        >
                            {isCurrentStep && isActive && <div className="absolute inset-0 bg-white/30 rounded-xl animate-ping" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center w-full max-w-[1200px] mx-auto min-h-[700px] px-8 py-8 animate-fade-in relative z-10">
            {/* Top Bar: BPM Controller & Play */}
            <div className="flex items-center justify-between w-full mb-8">
                {/* BPM Tiny Controller */}
                <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 shadow-inner border-2 border-slate-200">
                    <button onClick={() => adjustBpm(-10)} className="text-slate-400 hover:text-slate-700 p-2 active:scale-90">
                        <span className="w-0 h-0 border-t-[8px] border-b-[8px] border-r-[12px] border-t-transparent border-b-transparent border-r-current block" />
                    </button>
                    <div className="w-24 text-center">
                        <span className="text-xs text-slate-400 font-bold block -mb-1">BPM</span>
                        <span className="text-2xl font-black text-slate-800 tabular-nums">{bpm}</span>
                    </div>
                    <button onClick={() => adjustBpm(10)} className="text-slate-400 hover:text-slate-700 p-2 active:scale-90">
                        <span className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[12px] border-t-transparent border-b-transparent border-l-current block" />
                    </button>
                </div>

                {/* Central Play Button */}
                <button
                    onClick={togglePlay}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-rose-200' : 'bg-[#58CC02] border-[#46A302] text-white shadow-[#46A302]/50 hover:brightness-110 active:scale-95'}
                    `}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                {/* Complete Button */}
                <button onClick={onComplete} className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-black text-lg shadow-[0_6px_0_rgba(37,99,235,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all">
                    다음 레슨
                </button>
            </div>

            {/* 3x16 Sequencer Grid */}
            <div className="w-full bg-[#F8F9FA] p-6 rounded-3xl shadow-inner border-2 border-slate-100 mb-12 flex flex-col gap-4">
                {renderGridRow('하이햇', selectedPattern.hihat, <Triangle size={32} fill="currentColor" strokeWidth={0} />, '#34A853')}
                {renderGridRow('스네어', selectedPattern.snare, <Square size={28} fill="currentColor" strokeWidth={0} />, '#FBBC04')}
                {renderGridRow('킥', selectedPattern.kick, <Circle size={32} fill="currentColor" strokeWidth={0} />, '#EA4335')}
            </div>

            {/* Bottom: Pattern Selector */}
            <div className="w-full">
                <div className="flex items-center gap-4 mb-4">
                    <h3 className="font-black text-2xl text-slate-800">리듬 선택</h3>
                    <div className="flex-1 h-1 bg-slate-100 rounded-full" />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                    {MULTI_PATTERNS.map((pattern, idx) => {
                        const isSelected = selectedPatternIndex === idx;
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedPatternIndex(idx);
                                    if (!isPlaying) togglePlay();
                                }}
                                className={`
                                    py-4 px-4 rounded-2xl border-4 transition-all text-center active:scale-95
                                    ${isSelected
                                        ? 'bg-blue-50 border-blue-500 shadow-md text-blue-700 font-black'
                                        : 'bg-white border-slate-200 text-slate-600 font-bold hover:border-slate-300 hover:bg-slate-50'
                                    }
                                `}
                            >
                                {pattern.name}
                            </button>
                        );
                    })}
                </div>

                {/* Selected Pattern Description */}
                <div className="bg-slate-100 rounded-xl p-4 text-center max-w-2xl mx-auto border-2 border-slate-200">
                    <span className="font-bold text-slate-500 mr-2">💡 특징:</span>
                    <span className="font-medium text-slate-700">{selectedPattern.desc}</span>
                </div>
            </div>
        </div>
    );
};

const RhythmMasterGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentBeat, setCurrentBeat] = useState(-1);

    // Grid state for Hi-hat (row 0), Snare (row 1), Kick (row 2)
    const [grid, setGrid] = useState<boolean[][]>(
        Array(3).fill(null).map(() => Array(16).fill(false))
    );

    // Audio Refs
    const gridRef = useRef(grid);
    const kickRef = useRef<Tone.MembraneSynth | null>(null);
    const snareRef = useRef<Tone.NoiseSynth | null>(null);
    const hihatRef = useRef<Tone.MetalSynth | null>(null);
    const transportEventRef = useRef<number | null>(null);

    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    // Setup Synths
    useEffect(() => {
        kickRef.current = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 } }).toDestination();
        snareRef.current = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination();
        hihatRef.current = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination();
        hihatRef.current.volume.value = -12;

        return () => {
            kickRef.current?.dispose();
            snareRef.current?.dispose();
            hihatRef.current?.dispose();
            if (transportEventRef.current !== null) Tone.Transport.clear(transportEventRef.current);
            Tone.Transport.stop();
            Tone.Transport.cancel(0);
        };
    }, []);

    // Toggle Play State
    const togglePlay = async () => {
        if (!isPlaying) {
            await Tone.start();
            Tone.Transport.bpm.value = bpm;

            let stepCount = 0;
            if (transportEventRef.current !== null) Tone.Transport.clear(transportEventRef.current);

            transportEventRef.current = Tone.Transport.scheduleRepeat((time) => {
                const stepIdx = stepCount % 16;
                const currentGrid = gridRef.current;

                if (currentGrid[0][stepIdx]) hihatRef.current?.triggerAttackRelease(250, "32n", time, 0.3);
                if (currentGrid[1][stepIdx]) snareRef.current?.triggerAttackRelease("16n", time);
                if (currentGrid[2][stepIdx]) kickRef.current?.triggerAttackRelease("C1", "16n", time);

                Tone.Draw.schedule(() => { setCurrentBeat(stepIdx); }, time);
                stepCount++;
            }, "16n");

            Tone.Transport.start();
            setIsPlaying(true);
        } else {
            Tone.Transport.pause();
            setIsPlaying(false);
            setCurrentBeat(-1);
        }
    };

    // Toggle single drum hit
    const toggleStep = async (rowIndex: number, colIndex: number) => {
        const newGrid = [...grid];
        newGrid[rowIndex] = [...newGrid[rowIndex]];
        newGrid[rowIndex][colIndex] = !newGrid[rowIndex][colIndex];
        setGrid(newGrid);

        // Previews sound when clicking
        if (newGrid[rowIndex][colIndex] && !isPlaying) {
            await Tone.start();
            if (rowIndex === 0) hihatRef.current?.triggerAttackRelease(250, "32n", undefined, 0.3);
            else if (rowIndex === 1) snareRef.current?.triggerAttackRelease("16n");
            else if (rowIndex === 2) kickRef.current?.triggerAttackRelease("C1", "16n");
        }
    };

    const adjustBpm = (amount: number) => {
        setBpm(prev => {
            const newBpm = Math.max(50, Math.min(250, prev + amount));
            Tone.Transport.bpm.value = newBpm;
            return newBpm;
        });
    };

    const renderGridRow = (rowIndex: number, iconNode: React.ReactNode, rowColor: string) => (
        <div className="flex items-center gap-4 w-full">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg shrink-0 relative"
                style={{ backgroundColor: rowColor }}
            >
                <div>{iconNode}</div>
            </div>
            <div className="flex-1 flex gap-2 h-16">
                {grid[rowIndex].map((isActive, colIndex) => {
                    const isCurrentStep = currentBeat === colIndex;
                    const isBigBeat = colIndex % 4 === 0;

                    return (
                        <button
                            key={colIndex}
                            onClick={() => toggleStep(rowIndex, colIndex)}
                            className={`
                                flex-1 rounded-xl transition-all duration-75 relative border-b-4
                                ${isActive ? 'shadow-md translate-y-[-2px]' : 'bg-white border-[#DADCE0] hover:bg-[#F1F3F4]'}
                                ${isCurrentStep ? 'ring-2 ring-indigo-400 z-10' : ''}
                                ${isBigBeat && !isActive ? 'bg-[#E8EAED]' : ''}
                            `}
                            style={{
                                backgroundColor: isActive ? rowColor : undefined,
                                borderColor: isActive ? 'rgba(0,0,0,0.1)' : undefined
                            }}
                        >
                            {isCurrentStep && isActive && <div className="absolute inset-0 bg-white/30 rounded-xl animate-ping" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center w-full max-w-[1200px] mx-auto min-h-[700px] px-8 py-8 animate-fade-in relative z-10">
            {/* Top Bar: BPM Controller & Play */}
            <div className="flex items-center justify-between w-full mb-8">
                <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 shadow-inner border-2 border-slate-200">
                    <button onClick={() => adjustBpm(-10)} className="text-slate-400 hover:text-slate-700 p-2 active:scale-90">
                        <span className="w-0 h-0 border-t-[8px] border-b-[8px] border-r-[12px] border-t-transparent border-b-transparent border-r-current block" />
                    </button>
                    <div className="w-24 text-center">
                        <span className="text-xs text-slate-400 font-bold block -mb-1">BPM</span>
                        <span className="text-2xl font-black text-slate-800 tabular-nums">{bpm}</span>
                    </div>
                    <button onClick={() => adjustBpm(10)} className="text-slate-400 hover:text-slate-700 p-2 active:scale-90">
                        <span className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[12px] border-t-transparent border-b-transparent border-l-current block" />
                    </button>
                </div>

                <button
                    onClick={togglePlay}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-rose-200' : 'bg-[#58CC02] border-[#46A302] text-white shadow-[#46A302]/50 hover:brightness-110 active:scale-95'}
                    `}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                <button onClick={onComplete} className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-black text-lg shadow-[0_6px_0_rgba(37,99,235,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all">
                    레슨 완료
                </button>
            </div>

            {/* 3x16 Sequencer Grid Editable */}
            <div className="w-full bg-[#F8F9FA] p-6 rounded-3xl shadow-inner border-2 border-slate-100 flex flex-col gap-4">
                {renderGridRow(0, <Triangle size={32} fill="currentColor" strokeWidth={0} />, '#34A853')}
                {renderGridRow(1, <Square size={28} fill="currentColor" strokeWidth={0} />, '#FBBC04')}
                {renderGridRow(2, <Circle size={32} fill="currentColor" strokeWidth={0} />, '#EA4335')}
            </div>

            <p className="mt-8 text-slate-500 font-bold text-center">빈칸을 클릭해서 소리를 넣거나 빼보세요!</p>
        </div>
    );
};

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