import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Check, Volume2, ArrowRight, Star, Heart, Cloud, Sun, Music, Circle, Triangle, Square } from 'lucide-react';

interface LessonPlayerProps {
    lessonId: string;
    onComplete: () => void;
    onExit: () => void;
}

type LessonStep = {
    type: 'listen' | 'tap' | 'choose' | 'play' | 'sing';
    title: string;
    description?: string;
    target?: any;
    options?: any[];
    demoType?: string;
    bpm?: number;
};

// --- LESSON DATA ---
const LESSONS: Record<string, LessonStep[]> = {
    'pitch-patterns': [
        { type: 'sing', title: '낮음 → 높음', description: '두 음의 움직임을 따라 불러보세요.', target: [196.00, 261.63] },
        { type: 'sing', title: '높음 → 낮음', description: '반대로 내려오는 움직임이에요.', target: [261.63, 196.00] }
    ],
    'pitch-memory': [
        { type: 'sing', title: '음 기억하기', description: '소리를 잘 듣고, 사라진 뒤에 똑같이 불러보세요.', target: 196.00 },
        { type: 'sing', title: '조금 더 높은 음', description: '이번에도 소리를 잘 기억해야 해요.', target: 261.63 }
    ],
    'pitch-vocal': [
        { type: 'sing', title: '낮은 음 따라 부르기', description: '베이스의 낮은 소리를 따라 해보세요. (아— 하고 소리내면 분석이 쉬워져요)', target: 130.81 }, // C3
        { type: 'sing', title: '중간 음 높이', description: '편안한 목소리로 따라 불러보세요.', target: 196.00 }, // G3
        { type: 'sing', title: '높은 소리 도전!', description: '조금 더 높은 소리까지 정확하게 맞춰볼까요?', target: 261.63 }  // C4
    ],
    'pitch-quiz': [
        { type: 'choose', title: '두 번째 소리가 어땠나요?', description: '첫 번째 소리를 듣고, 두 번째 소리가 더 높은지 낮은지 맞춰보세요.', target: 'higher', options: [220, 440] },
        { type: 'choose', title: '다시 한번 도전!', description: '이번에는 음높이의 차이가 조금 더 작아졌어요.', target: 'lower', options: [440, 330] },
        { type: 'choose', title: '마지막 단계', description: '집중해서 들어보세요. 어느 쪽일까요?', target: 'higher', options: [440, 466.16] }
    ],
    'pitch-match': [
        { type: 'play', title: '같은 음 찾기 (기초)', description: '왼쪽 스피커 버튼을 눌러 소리를 듣고, 똑같은 높이를 찾아보세요.', target: 220 },
        { type: 'play', title: '조금 더 높은 음', description: '이번엔 좀 더 높은 소리에 도전해볼까요?', target: 440 },
        { type: 'play', title: '음높이 마스터!', description: '가장 높은 소리까지 정확하게 맞춰보세요.', target: 660 }
    ],
    'pitch-intro': [
        { type: 'listen', title: '음높이란 무엇일까?', description: '소리의 높고 낮음은 위아래 움직임과 같아요.', demoType: 'pitch-intro' },
        { type: 'play', title: '소리의 높낮이 탐험', description: '슬라이더를 위아래로 움직여서 소리의 움직임을 느껴보세요.' }
    ],
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
            case 'pitch-patterns':
                return <PitchPatternGame step={currentStep} onComplete={handleStepComplete} />;
            case 'pitch-memory':
                return <PitchMemoryGame step={currentStep} onComplete={handleStepComplete} />;
            case 'pitch-vocal':
                return <PitchMatchingGame step={currentStep} onComplete={handleStepComplete} />;
            case 'pitch-quiz':
                return <PitchQuizGame step={currentStep} onComplete={handleStepComplete} />;
            case 'pitch-match':
                return <PitchComparisonGame step={currentStep} onComplete={handleStepComplete} />;
            case 'pitch-intro':
                return <PitchIntroGame step={currentStep} onComplete={handleStepComplete} />;
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

// --- SHARED UTILS ---
const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
        let val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    // Balanced noise gate
    if (rms < 0.02) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++)
        for (let j = 0; j < SIZE - i; j++)
            c[i] = c[i] + buf[j] * buf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    
    // Confidence check: max correlation should be at least 80% (more lenient than 90%)
    if (maxval < c[0] * 0.8) return -1;
    
    let T0 = maxpos;
    return sampleRate / T0;
};

const PitchPatternGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [patternIdx, setPatternIdx] = useState(0);
    const [gameState, setGameState] = useState<'PLAYBACK' | 'SING'>('PLAYBACK');
    const [userFreq, setUserFreq] = useState<number | null>(null);
    const [isMatched, setIsMatched] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);

    const micRef = useRef<Tone.UserMedia | null>(null);
    const analyserRef = useRef<Tone.Analyser | null>(null);
    const synthRef = useRef<Tone.Synth | null>(null);
    const requestRef = useRef<number>(0);

    const pattern = Array.isArray(step.target) ? step.target : [440, 880];
    const minFreq = 82.41;
    const maxFreq = 880;

    const getPos = (f: number) => {
        const logMin = Math.log2(minFreq);
        const logMax = Math.log2(maxFreq);
        const logVal = f > 0 ? Math.log2(f) : logMin;
        return Math.max(0, Math.min(100, ((logVal - logMin) / (logMax - logMin)) * 100));
    };

    useEffect(() => {
        micRef.current = new Tone.UserMedia();
        analyserRef.current = new Tone.Analyser("waveform", 2048);
        synthRef.current = new Tone.Synth().toDestination();

        playPattern();

        return () => {
            micRef.current?.dispose();
            analyserRef.current?.dispose();
            synthRef.current?.dispose();
            cancelAnimationFrame(requestRef.current);
        };
    }, [step]);

    const playPattern = async () => {
        setGameState('PLAYBACK');
        setPatternIdx(0);
        await Tone.start();

        let time = Tone.now();
        pattern.forEach((freq, i) => {
            synthRef.current?.triggerAttackRelease(freq, "4n", time + i * 0.8);
        });

        setTimeout(() => {
            setGameState('SING');
            startMic();
        }, pattern.length * 800 + 500);
    };

    const startMic = async () => {
        try {
            await micRef.current?.open();
            micRef.current?.connect(analyserRef.current!);
            setIsMicOn(true);
            updatePitch();
        } catch (e) { console.error(e); }
    };

    const hasCompletedRef = useRef(false);

    const updatePitch = () => {
        if (!analyserRef.current || hasCompletedRef.current) return;
        const buffer = analyserRef.current.getValue() as Float32Array;
        const pitch = autoCorrelate(buffer, Tone.getContext().sampleRate);

        if (pitch !== -1 && pitch > minFreq && pitch < maxFreq) {
            setUserFreq(pitch);
            const targetFreq = pattern[patternIdx];
            const diff = Math.abs(Math.log2(pitch / targetFreq));
            
            if (diff < 0.05) {
                if (!isMatched) {
                    setIsMatched(true);
                    setTimeout(() => {
                        if (hasCompletedRef.current) return;
                        setIsMatched(false);
                        if (patternIdx < pattern.length - 1) {
                            setPatternIdx(prev => prev + 1);
                        } else {
                            hasCompletedRef.current = true;
                            onComplete();
                        }
                    }, 1000);
                }
            }
        }
        requestRef.current = requestAnimationFrame(updatePitch);
    };

    return (
        <div className="flex flex-col items-center justify-between w-full max-w-[1000px] h-[75vh] mx-auto animate-fade-in px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-800 mb-2">{step.title}</h2>
                <p className="text-xl font-bold text-slate-500">{step.description}</p>
            </div>

            <div className="flex-1 w-full flex items-end justify-center gap-16 lg:gap-32 pb-12">
                <div className="flex flex-col items-center gap-6 h-full justify-end">
                    <div className="flex-1 w-32 bg-slate-50 rounded-[48px] relative border-4 border-white shadow-inner overflow-hidden">
                        <div 
                            className={`absolute bottom-0 left-0 right-0 transition-all duration-200 ease-out border-t-8 border-white
                                ${isMatched ? 'bg-[#58CC02]' : 'bg-rose-400 opacity-60'}`}
                            style={{ height: `${userFreq ? getPos(userFreq) : 0}%` }}
                        />
                    </div>
                    <span className="font-black text-slate-400 uppercase tracking-widest text-sm">나의 목소리</span>
                </div>

                <div className="w-64 h-full flex flex-col items-center justify-center gap-8 pb-32">
                    <div className="flex gap-4">
                        {pattern.map((_, i) => (
                            <div key={i} className={`w-4 h-4 rounded-full ${i < patternIdx ? 'bg-[#58CC02]' : i === patternIdx ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'}`} />
                        ))}
                    </div>
                    <span className="text-2xl font-black text-slate-600">
                        {gameState === 'PLAYBACK' ? '패턴을 들어보세요' : `${patternIdx + 1}번째 소리를 따라해보세요!`}
                    </span>
                    {gameState === 'SING' && (
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white ${isMatched ? 'bg-[#58CC02]' : 'bg-slate-300'}`}>
                            {isMatched ? <Check size={40} strokeWidth={4} /> : <Music size={40} />}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-6 h-full justify-end">
                    <div className="flex-1 w-32 bg-slate-50 rounded-[48px] relative border-4 border-white shadow-inner overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-80 transition-all duration-500 border-t-8 border-white"
                            style={{ height: `${getPos(pattern[patternIdx])}%` }}
                        />
                    </div>
                    <span className="font-black text-blue-400 uppercase tracking-widest text-sm">목표 패턴 ({patternIdx + 1}/{pattern.length})</span>
                </div>
            </div>

            <button onClick={playPattern} disabled={gameState === 'PLAYBACK'} className="px-8 py-3 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all disabled:opacity-30">
                다시 듣기
            </button>
        </div>
    );
};

const PitchMemoryGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [gameState, setGameState] = useState<'LISTEN' | 'WAIT' | 'ACT'>('LISTEN');
    const [countdown, setCountdown] = useState(3);
    const [userFreq, setUserFreq] = useState<number | null>(null);
    const [isMatched, setIsMatched] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);

    const micRef = useRef<Tone.UserMedia | null>(null);
    const analyserRef = useRef<Tone.Analyser | null>(null);
    const refOscRef = useRef<Tone.Oscillator | null>(null);
    const requestRef = useRef<number>(0);

    const targetFreq = step.target || 220;
    const minFreq = 82.41;
    const maxFreq = 880;

    const getPos = (f: number) => {
        const logMin = Math.log2(minFreq);
        const logMax = Math.log2(maxFreq);
        const logVal = f > 0 ? Math.log2(f) : logMin;
        return Math.max(0, Math.min(100, ((logVal - logMin) / (logMax - logMin)) * 100));
    };

    useEffect(() => {
        micRef.current = new Tone.UserMedia();
        analyserRef.current = new Tone.Analyser("waveform", 2048);
        refOscRef.current = new Tone.Oscillator(targetFreq, "sine").toDestination();

        startSequence();

        return () => {
            micRef.current?.dispose();
            analyserRef.current?.dispose();
            refOscRef.current?.dispose();
            cancelAnimationFrame(requestRef.current);
        };
    }, [step]);

    const hasCompletedRef = useRef(false);

    const startSequence = async () => {
        if (hasCompletedRef.current) return;
        setGameState('LISTEN');
        setCountdown(3);
        setIsMatched(false);
        setUserFreq(null);

        await Tone.start();
        refOscRef.current?.start().stop("+2");

        setTimeout(() => {
            if (hasCompletedRef.current) return;
            setGameState('WAIT');
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            setTimeout(() => {
                if (hasCompletedRef.current) return;
                setGameState('ACT');
                startMic();
            }, 3000);
        }, 2500);
    };

    const startMic = async () => {
        try {
            await micRef.current?.open();
            micRef.current?.connect(analyserRef.current!);
            setIsMicOn(true);
            updatePitch();
        } catch (e) {
            console.error(e);
        }
    };

    const updatePitch = () => {
        if (!analyserRef.current || hasCompletedRef.current) return;
        const buffer = analyserRef.current.getValue() as Float32Array;
        const pitch = autoCorrelate(buffer, Tone.getContext().sampleRate);

        if (pitch !== -1 && pitch > minFreq && pitch < maxFreq) {
            setUserFreq(pitch);
            const diff = Math.abs(Math.log2(pitch / targetFreq));
            if (diff < 0.05) {
                setIsMatched(true);
                hasCompletedRef.current = true;
                setTimeout(onComplete, 1500);
            }
        }
        requestRef.current = requestAnimationFrame(updatePitch);
    };

    return (
        <div className="flex flex-col items-center justify-between w-full max-w-[1000px] h-[75vh] mx-auto animate-fade-in px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-800 mb-2">{step.title}</h2>
                <p className="text-xl font-bold text-slate-500">{step.description}</p>
            </div>

            <div className="flex-1 w-full flex items-end justify-center gap-16 lg:gap-32 pb-12">
                <div className="flex flex-col items-center gap-6 h-full justify-end">
                    <div className="flex-1 w-32 bg-slate-50 rounded-[48px] relative border-4 border-white shadow-inner overflow-hidden">
                        <div 
                            className={`absolute bottom-0 left-0 right-0 transition-all duration-200 ease-out border-t-8 border-white
                                ${isMatched ? 'bg-[#58CC02]' : 'bg-rose-400 opacity-60'}`}
                            style={{ height: `${userFreq ? getPos(userFreq) : 0}%` }}
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <Music size={48} className="text-slate-100" strokeWidth={3} />
                        </div>
                    </div>
                    <span className="font-black text-slate-400 uppercase tracking-widest text-sm">나의 목소리</span>
                </div>

                <div className="w-64 h-full flex flex-col items-center justify-center gap-8 pb-32">
                    {gameState === 'LISTEN' && (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white">
                                <Volume2 size={48} strokeWidth={3} />
                            </div>
                            <span className="text-2xl font-black text-blue-500">잘 들어보세요!</span>
                        </div>
                    )}
                    {gameState === 'WAIT' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-8xl font-black text-slate-300 animate-scale-in">{countdown}</div>
                            <span className="text-2xl font-black text-slate-400">잠시만 기다려요...</span>
                        </div>
                    )}
                    {gameState === 'ACT' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white animate-bounce shadow-xl ${isMatched ? 'bg-[#58CC02]' : 'bg-rose-500'}`}>
                                <Star size={48} fill="currentColor" strokeWidth={0} />
                            </div>
                            <span className={`text-2xl font-black ${isMatched ? 'text-[#58CC02]' : 'text-rose-500'}`}>
                                {isMatched ? '대단해요!' : '기억한 음을 불러보세요!'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-6 h-full justify-end">
                    <div className="flex-1 w-32 bg-slate-50 rounded-[48px] relative border-4 border-white shadow-inner overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-1000 border-t-8 border-white"
                            style={{ height: gameState === 'LISTEN' ? `${getPos(targetFreq)}%` : '0%' }}
                        />
                    </div>
                    <span className="font-black text-slate-200 uppercase tracking-widest text-sm">목표 음높이</span>
                </div>
            </div>

            <div className="h-20" />
        </div>
    );
};

const PitchMatchingGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [userFreq, setUserFreq] = useState<number | null>(null);
    const [isMatched, setIsMatched] = useState(false);
    const [guidance, setGuidance] = useState("마이크를 켜고 노래를 불러보세요!");
    const [isMicOn, setIsMicOn] = useState(false);
    const [isPlayingRef, setIsPlayingRef] = useState(false);

    const micRef = useRef<Tone.UserMedia | null>(null);
    const analyserRef = useRef<Tone.Analyser | null>(null);
    const refOscRef = useRef<Tone.Oscillator | null>(null);
    const matchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const requestRef = useRef<number>(0);

    const targetFreq = step.target || 220;
    const minFreq = 82.41;
    const maxFreq = 880;

    const getPos = (f: number) => {
        const logMin = Math.log2(minFreq);
        const logMax = Math.log2(maxFreq);
        const logVal = f > 0 ? Math.log2(f) : logMin;
        return Math.max(0, Math.min(100, ((logVal - logMin) / (logMax - logMin)) * 100));
    };

    const targetPos = getPos(targetFreq);

    useEffect(() => {
        micRef.current = new Tone.UserMedia();
        analyserRef.current = new Tone.Analyser("waveform", 2048);
        refOscRef.current = new Tone.Oscillator(targetFreq, "sine").toDestination();

        return () => {
            micRef.current?.dispose();
            analyserRef.current?.dispose();
            refOscRef.current?.dispose();
            cancelAnimationFrame(requestRef.current);
            if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
        };
    }, [step]);

    const hasCompletedRef = useRef(false);

    const startMic = async () => {
        try {
            await Tone.start();
            await micRef.current?.open();
            micRef.current?.connect(analyserRef.current!);
            
            // Stop reference sound when mic starts, as requested
            if (isPlayingRef) {
                refOscRef.current?.stop();
                setIsPlayingRef(false);
            }
            
            setIsMicOn(true);
            updatePitch();
        } catch (e) {
            console.error("Mic access denied", e);
            setGuidance("마이크 접근 권한이 필요해요.");
        }
    };

    const playRef = () => {
        if (!refOscRef.current || hasCompletedRef.current) return;
        if (isPlayingRef) {
            refOscRef.current.stop();
            setIsPlayingRef(false);
        } else {
            Tone.start();
            refOscRef.current.start();
            setIsPlayingRef(true);
        }
    };

    const updatePitch = () => {
        if (!analyserRef.current || hasCompletedRef.current) return;
        const buffer = analyserRef.current.getValue() as Float32Array;
        const pitch = autoCorrelate(buffer, Tone.getContext().sampleRate);

        if (pitch !== -1 && pitch > minFreq && pitch < maxFreq) {
            setUserFreq(pitch);
            const diff = Math.abs(Math.log2(pitch / targetFreq));
            if (diff < 0.03) {
                setGuidance("완벽해요! 그대로 유지하세요.");
                if (!isMatched) {
                    setIsMatched(true);
                    hasCompletedRef.current = true;
                    // Ensure sound is off upon completion
                    if (isPlayingRef) {
                        refOscRef.current?.stop();
                        setIsPlayingRef(false);
                    }
                    setTimeout(onComplete, 2000);
                }
            } else {
                setIsMatched(false);
                setGuidance(pitch < targetFreq ? "조금 더 높게 불러보세요! ⬆️" : "조금 더 낮게 불러보세요! ⬇️");
            }
        }
        requestRef.current = requestAnimationFrame(updatePitch);
    };

    return (
        <div className="flex flex-col items-center justify-between w-full max-w-[1000px] h-[75vh] mx-auto animate-fade-in px-8">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-slate-800 mb-2">{step.title}</h2>
                <p className="text-xl font-bold text-slate-500">{step.description}</p>
            </div>

            <div className="flex-1 w-full flex items-end justify-center gap-16 lg:gap-32 pb-12">
                {/* User Voice Bar */}
                <div className="flex flex-col items-center gap-6 h-full justify-end">
                    <div className="flex-1 w-32 bg-slate-50 rounded-[48px] relative border-4 border-white shadow-inner overflow-hidden">
                        <div 
                            className={`absolute bottom-0 left-0 right-0 transition-all duration-200 ease-out border-t-8 border-white
                                ${isMatched ? 'bg-[#58CC02]' : 'bg-rose-400 opacity-60'}`}
                            style={{ height: `${userFreq ? getPos(userFreq) : 0}%` }}
                        >
                            {/* Organic bubbles/waves */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-10 bg-inherit rounded-[100%] blur-sm opacity-50" />
                        </div>
                        {/* Mic Icon */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <Music size={48} className="text-slate-100" strokeWidth={3} />
                        </div>
                    </div>
                    <span className="font-black text-slate-400 uppercase tracking-widest text-sm">나의 목소리</span>
                </div>

                {/* Target Objective Bar */}
                <div className="flex flex-col items-center gap-6 h-full justify-end">
                    <div 
                        className="flex-1 w-32 bg-slate-50 rounded-[48px] relative border-4 border-white shadow-inner overflow-hidden cursor-pointer group"
                        onClick={playRef}
                    >
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-80 transition-all duration-500 border-t-8 border-white"
                            style={{ height: `${targetPos}%` }}
                        />
                        {/* Play Icon overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors">
                            <Volume2 size={48} className={`text-white transition-all ${isPlayingRef ? 'scale-125 opacity-100' : 'opacity-20 stroke-[3px]'}`} />
                        </div>
                    </div>
                    <span className="font-black text-blue-400 uppercase tracking-widest text-sm">목표 음높이</span>
                </div>
            </div>

            {/* Real-time Guidance */}
            <div className="h-32 w-full flex flex-col items-center justify-center gap-4">
                <div className={`
                    px-10 py-5 rounded-[28px] shadow-xl text-3xl font-black text-center transition-all duration-300
                    ${isMatched ? 'bg-[#58CC02] text-white scale-110 shadow-green-100' : 'bg-white text-slate-700 border-2 border-slate-100'}
                `}>
                    {guidance}
                </div>
                
                {!isMicOn && (
                    <button 
                        onClick={startMic}
                        className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                        🎙️ 마이크 켜기
                    </button>
                )}
            </div>
        </div>
    );
};

const PitchQuizGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeSound, setActiveSound] = useState<'A' | 'B' | null>(null);
    const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle');

    const synthRef = useRef<Tone.Synth | null>(null);

    useEffect(() => {
        synthRef.current = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 0.5 }
        }).toDestination();

        // Auto-play on mount
        const timer = setTimeout(playSounds, 1000);

        return () => {
            synthRef.current?.dispose();
            clearTimeout(timer);
        };
    }, [step]);

    const playSounds = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        setFeedback('idle');
        await Tone.start();

        const [freqA, freqB] = step.options || [440, 880];

        // Sound A
        setActiveSound('A');
        synthRef.current?.triggerAttackRelease(freqA, "4n");
        
        setTimeout(() => {
            // Sound B
            setActiveSound('B');
            synthRef.current?.triggerAttackRelease(freqB, "4n");

            setTimeout(() => {
                setActiveSound(null);
                setIsPlaying(false);
            }, 800);
        }, 1000);
    };

    const hasCompletedRef = useRef(false);

    const handleChoice = (soundIdx: number) => {
        if (isPlaying || hasCompletedRef.current) return;

        const [freqA, freqB] = step.options || [440, 880];
        const correctIdx = freqA > freqB ? 0 : 1;

        if (soundIdx === correctIdx) {
            setFeedback('success');
            hasCompletedRef.current = true;
            setTimeout(onComplete, 1200);
        } else {
            setFeedback('error');
            synthRef.current?.triggerAttackRelease("G2", "4n");
            setTimeout(() => setFeedback('idle'), 1000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-between w-full max-w-[800px] h-[70vh] mx-auto animate-fade-in px-8">
            <div className="text-center mb-8 relative z-10 w-full">
                <h2 className="text-4xl font-black text-slate-800 mb-2">어떤 소리가 더 높을까요?</h2>
                <p className="text-xl font-bold text-slate-500">{step.description}</p>
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center gap-12 relative">
                
                {/* Clickable Sound Indicators */}
                <div className="flex gap-12 sm:gap-16">
                    <button
                        onClick={() => handleChoice(0)}
                        disabled={isPlaying}
                        className={`
                            w-40 h-48 rounded-[40px] border-b-[12px] flex flex-col items-center justify-center transition-all active:translate-y-2 active:border-b-4
                            ${activeSound === 'A' ? 'bg-blue-500 border-blue-600 scale-105 shadow-2xl text-white' : 
                              feedback === 'error' && (step.options?.[0] || 0) < (step.options?.[1] || 0) ? 'bg-slate-100 border-slate-200 text-slate-300' :
                              'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'}
                        `}
                    >
                        <Volume2 size={48} strokeWidth={3} className="mb-4" />
                        <span className="text-xs font-black uppercase tracking-widest mb-1">Sound</span>
                        <span className="text-5xl font-black">1</span>
                    </button>

                    <button
                        onClick={() => handleChoice(1)}
                        disabled={isPlaying}
                        className={`
                            w-40 h-48 rounded-[40px] border-b-[12px] flex flex-col items-center justify-center transition-all active:translate-y-2 active:border-b-4
                            ${activeSound === 'B' ? 'bg-amber-500 border-amber-600 scale-105 shadow-2xl text-white' : 
                              feedback === 'error' && (step.options?.[1] || 0) < (step.options?.[0] || 0) ? 'bg-slate-100 border-slate-200 text-slate-300' :
                              'bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500'}
                        `}
                    >
                        <Volume2 size={48} strokeWidth={3} className="mb-4" />
                        <span className="text-xs font-black uppercase tracking-widest mb-1">Sound</span>
                        <span className="text-5xl font-black">2</span>
                    </button>
                </div>

                {/* Feedback Prompt */}
                {feedback === 'error' && (
                    <div className="absolute -bottom-12 animate-bounce text-rose-500 font-bold text-xl flex items-center gap-2">
                        <span>😮 틀렸어요! 다시 들어볼까요?</span>
                    </div>
                )}
            </div>

            {/* Replay Instructions */}
            <div className="mt-8 text-center">
                <button 
                    onClick={playSounds}
                    disabled={isPlaying}
                    className="group flex flex-col items-center gap-2"
                >
                    <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center transition-all
                        ${isPlaying ? 'bg-slate-100 text-slate-300' : 'bg-white text-slate-600 border-2 border-slate-100 shadow-sm group-hover:bg-slate-50 group-active:scale-95'}
                    `}>
                        <Volume2 size={28} />
                    </div>
                    <span className="text-sm font-bold text-slate-400">다시 듣기</span>
                </button>
            </div>
        </div>
    );
};

const PitchComparisonGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [value, setValue] = useState(0.5);
    const [isRefPlaying, setIsRefPlaying] = useState(false);
    const [isUserPlaying, setIsUserPlaying] = useState(false);
    const [matchProgress, setMatchProgress] = useState(0); // 0 to 1
    const [isMatched, setIsMatched] = useState(false);

    const refOscRef = useRef<Tone.Oscillator | null>(null);
    const userOscRef = useRef<Tone.Oscillator | null>(null);
    const refVolRef = useRef<Tone.Volume | null>(null);
    const userVolRef = useRef<Tone.Volume | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const matchTimerRef = useRef<NodeJS.Timeout | null>(null);

    const targetFreq = step.target || 440;
    const getFreq = (v: number) => 110 * Math.pow(2, v * 3);
    const userFreq = getFreq(value);

    // Initial setup
    useEffect(() => {
        const refVol = new Tone.Volume(-Infinity).toDestination();
        const refOsc = new Tone.Oscillator(targetFreq, "sine").connect(refVol).start();
        const userVol = new Tone.Volume(-Infinity).toDestination();
        const userOsc = new Tone.Oscillator(userFreq, "triangle").connect(userVol).start();

        refOscRef.current = refOsc;
        refVolRef.current = refVol;
        userOscRef.current = userOsc;
        userVolRef.current = userVol;

        return () => {
            refOsc.dispose();
            refVol.dispose();
            userOsc.dispose();
            userVol.dispose();
            if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
        };
    }, []);

    // Update target if step changes
    useEffect(() => {
        if (refOscRef.current) {
            refOscRef.current.frequency.value = targetFreq;
        }
    }, [targetFreq]);

    const hasCompletedRef = useRef(false);

    // Update proximity and user freq
    useEffect(() => {
        if (userOscRef.current) {
            userOscRef.current.frequency.rampTo(userFreq, 0.05);
        }

        // Proximity logic
        const diff = Math.abs(Math.log2(userFreq / targetFreq));
        const proximity = Math.max(0, 1 - diff * 10); // 0.1 octave diff -> 0 proximity
        setMatchProgress(proximity);

        if (proximity > 0.95) {
            if (!isMatched && !hasCompletedRef.current) {
                setIsMatched(true);
                hasCompletedRef.current = true;
                matchTimerRef.current = setTimeout(() => {
                    onComplete();
                }, 1500);
            }
        } else {
            setIsMatched(false);
            if (matchTimerRef.current && !hasCompletedRef.current) {
                clearTimeout(matchTimerRef.current);
                matchTimerRef.current = null;
            }
        }
    }, [value, targetFreq]);

    const handleRefStart = async () => {
        await Tone.start();
        refVolRef.current?.volume.rampTo(-10, 0.1);
        setIsRefPlaying(true);
    };

    const handleRefEnd = () => {
        refVolRef.current?.volume.rampTo(-Infinity, 0.2);
        setIsRefPlaying(false);
    };

    const handleInteraction = async (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;
        if (!isUserPlaying) {
            await Tone.start();
            userVolRef.current?.volume.rampTo(-10, 0.1);
            setIsUserPlaying(true);
        }
        const rect = containerRef.current.getBoundingClientRect();
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const relativeY = 1 - (clientY - rect.top) / rect.height;
        setValue(Math.max(0, Math.min(1, relativeY)));
    };

    const handleInteractionEnd = () => {
        userVolRef.current?.volume.rampTo(-Infinity, 0.2);
        setIsUserPlaying(false);
    };

    return (
        <div className="flex flex-col items-center justify-between w-full max-w-[1200px] h-[75vh] mx-auto animate-fade-in px-8">
            <div className="text-center mb-12 relative z-10 w-full">
                <h2 className="text-4xl font-black text-slate-800 mb-2">{step.title}</h2>
                <p className="text-xl font-bold text-slate-500">{step.description}</p>
            </div>

            <div className="flex-1 w-full flex items-center justify-center gap-16 lg:gap-32 h-full py-8">
                {/* Left: Reference Guide (Thin Slider) */}
                <div className="h-full flex flex-col items-center gap-4">
                    <div className="flex-1 w-12 bg-slate-100 rounded-full relative border-2 border-slate-200 overflow-hidden">
                        {/* Target Marker */}
                        <div 
                            className="absolute left-0 right-0 h-2 bg-blue-500 rounded-full z-10 transition-all duration-500"
                            style={{ 
                                bottom: `${(Math.log2(targetFreq / 110) / 3) * 100}%`,
                                transform: 'translateY(50%)',
                                boxShadow: isRefPlaying ? '0 0 15px 5px rgba(59,130,246,0.5)' : 'none'
                            }}
                        />
                        {/* Reference Interaction Button (Overlap or separate) */}
                        <button
                            onMouseDown={handleRefStart}
                            onMouseUp={handleRefEnd}
                            onMouseLeave={handleRefEnd}
                            onTouchStart={handleRefStart}
                            onTouchEnd={handleRefEnd}
                            className={`
                                absolute inset-0 w-full flex items-center justify-center transition-colors
                                ${isRefPlaying ? 'bg-blue-500/10' : 'hover:bg-slate-200/50'}
                            `}
                        >
                            <Volume2 size={24} className={isRefPlaying ? 'text-blue-500' : 'text-slate-300'} strokeWidth={3} />
                        </button>
                    </div>
                    <span className="font-black text-slate-400 uppercase tracking-widest text-[10px] text-center leading-tight">
                        기준 가이드
                    </span>
                </div>

                {/* Center: Match Slider */}
                <div className="relative group flex items-center justify-center w-[300px] h-full">
                    {/* Proximity Halo */}
                    <div 
                        className="absolute inset-0 rounded-[64px] transition-all duration-300 pointer-events-none"
                        style={{ 
                            boxShadow: `0 0 ${matchProgress * 100}px ${matchProgress * 40}px rgba(88, 204, 2, ${matchProgress * 0.4})`,
                            border: `${matchProgress * 8}px solid rgba(88, 204, 2, ${matchProgress})`,
                            transform: `scale(${1 + (1 - matchProgress) * 0.1})`
                        }}
                    />

                    {/* Interactive Slider Container */}
                    <div 
                        ref={containerRef}
                        className="w-full h-full bg-slate-50 rounded-[48px] relative overflow-hidden shadow-inner border-4 border-white cursor-pointer"
                        onMouseDown={handleInteraction}
                        onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)}
                        onMouseUp={handleInteractionEnd}
                        onMouseLeave={handleInteractionEnd}
                        onTouchStart={handleInteraction}
                        onTouchMove={handleInteraction}
                        onTouchEnd={handleInteractionEnd}
                    >
                        {/* Perfect Match Success Flash */}
                        {isMatched && (
                            <div className="absolute inset-0 bg-[#58CC02]/10 animate-pulse z-10" />
                        )}

                        {/* Slider Handle (Dart) */}
                        <div 
                            className="absolute left-1/2 -translate-x-1/2 w-20 h-2 bg-slate-800 rounded-full z-20 pointer-events-none transition-none"
                            style={{ bottom: `${value * 100}%` }}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-4 border-slate-800 shadow-lg flex items-center justify-center">
                                <Music size={24} className={isUserPlaying ? 'text-slate-800' : 'text-slate-200'} strokeWidth={3} />
                            </div>
                        </div>

                        {/* Visual Guide Layers (Similar to Intro but cleaner) */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="h-full w-full flex flex-col items-center justify-between py-12 text-slate-300 font-bold uppercase text-xs">
                                <span>High</span>
                                <div className="w-8 h-1 bg-slate-200 rounded-full" />
                                <div className="w-8 h-1 bg-slate-200 rounded-full" />
                                <div className="w-12 h-1 bg-slate-300 rounded-full" />
                                <div className="w-8 h-1 bg-slate-200 rounded-full" />
                                <div className="w-8 h-1 bg-slate-200 rounded-full" />
                                <span>Low</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Feedback Zone */}
                <div className="w-32 flex flex-col items-center gap-6">
                    <div 
                        className={`
                            w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500
                            ${isMatched ? 'bg-[#58CC02] text-white scale-110' : 'bg-slate-100 text-slate-300'}
                        `}
                    >
                        {isMatched ? <Check size={56} strokeWidth={4} className="animate-pop-in" /> : <Star size={56} fill="currentColor" strokeWidth={0} className="opacity-30" />}
                    </div>
                    <div className="flex flex-col items-center gap-1 h-8">
                        {isMatched ? (
                            <span className="font-black text-[#58CC02] animate-bounce shrink-0">그대로 유지하세요!</span>
                        ) : matchProgress > 0.6 ? (
                            <span className="font-bold text-slate-400">거의 다 왔어요!</span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Hint message */}
            <div className="h-20 flex items-center justify-center w-full">
                <div className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-100 text-slate-500 font-bold flex gap-3 items-center">
                    <span className="text-2xl">👂</span>
                    두 소리가 똑같아지면 화면이 반짝거려요!
                </div>
            </div>
        </div>
    );
};

const PitchIntroGame: React.FC<{ step: LessonStep, onComplete: () => void }> = ({ step, onComplete }) => {
    const [value, setValue] = useState(0.5); // 0.0 to 1.0
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDemoPlaying, setIsDemoPlaying] = useState(false);

    const oscRef = useRef<Tone.Oscillator | null>(null);
    const volRef = useRef<Tone.Volume | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial frequency mapping: 110Hz (A2) to 880Hz (A5)
    const getFreq = (v: number) => 110 * Math.pow(2, v * 3);

    useEffect(() => {
        const vol = new Tone.Volume(-Infinity).toDestination();
        const osc = new Tone.Oscillator(getFreq(value), "triangle").connect(vol).start();
        oscRef.current = osc;
        volRef.current = vol;

        return () => {
            osc.dispose();
            vol.dispose();
        };
    }, []);

    // Update frequency on value change
    useEffect(() => {
        if (oscRef.current) {
            oscRef.current.frequency.rampTo(getFreq(value), 0.1);
        }
    }, [value]);

    const handleInteraction = async (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current || isDemoPlaying) return;

        // Start audio on first interaction if not playing
        if (!isPlaying && !isDemoPlaying) {
            await Tone.start();
            volRef.current?.volume.rampTo(-10, 0.2);
            setIsPlaying(true);
        }

        const rect = containerRef.current.getBoundingClientRect();
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const relativeY = 1 - (clientY - rect.top) / rect.height;
        setValue(Math.max(0, Math.min(1, relativeY)));
    };

    const stopAudio = () => {
        volRef.current?.volume.rampTo(-Infinity, 0.2);
        setIsPlaying(false);
    };

    const playDemo = async () => {
        if (isDemoPlaying) return;
        setIsDemoPlaying(true);
        await Tone.start();
        volRef.current?.volume.rampTo(-10, 0.2);

        // Sequence: Low -> High -> Low -> Mid
        const sequence = [0.1, 0.9, 0.2, 0.5];
        let i = 0;
        const interval = setInterval(() => {
            if (i >= sequence.length) {
                clearInterval(interval);
                setIsDemoPlaying(false);
                volRef.current?.volume.rampTo(-Infinity, 0.5);
                setTimeout(onComplete, 1000);
                return;
            }
            setValue(sequence[i]);
            i++;
        }, 1200);
    };

    // Listen mode automatically plays demo
    useEffect(() => {
        if (step.type === 'listen') {
            const timer = setTimeout(playDemo, 1000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // Visual colors based on value
    const getBgColor = () => {
        if (value > 0.7) return 'rgba(239, 68, 68, opacity)'; // Red
        if (value > 0.3) return 'rgba(245, 158, 11, opacity)'; // Yellow
        return 'rgba(16, 185, 129, opacity)'; // Green
    };

    return (
        <div className="flex flex-col items-center justify-between w-full max-w-[1000px] h-[70vh] mx-auto animate-fade-in relative">
            
            {/* Instruction Header */}
            <div className="text-center mb-8 relative z-10">
                <h2 className="text-4xl font-black text-slate-800 mb-2">{step.title}</h2>
                <p className="text-xl font-bold text-slate-500">{step.description}</p>
            </div>

            {/* Vertical Slider Experience */}
            <div 
                ref={containerRef}
                className="flex-1 w-full max-w-[400px] bg-slate-100 rounded-[48px] relative overflow-hidden shadow-inner border-4 border-white cursor-pointer group"
                onMouseDown={handleInteraction}
                onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)}
                onMouseUp={stopAudio}
                onTouchStart={handleInteraction}
                onTouchMove={handleInteraction}
                onTouchEnd={stopAudio}
            >
                {/* Visual Layers (Organic Skeches) */}
                <div className="absolute inset-0 z-0 transition-colors duration-500"
                    style={{ backgroundColor: getBgColor().replace('opacity', '0.05') }}>
                    
                    {/* Red Scribble (Top) */}
                    <div className="absolute top-0 w-full h-1/3 transition-opacity duration-300 pointer-events-none"
                        style={{ opacity: value > 0.6 ? (value - 0.6) * 2.5 : 0 }}>
                        <svg className="w-full h-full text-red-400/30" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,20 Q20,10 40,30 T80,10 T100,40 V100 H0 Z" fill="currentColor" />
                            <path d="M0,40 Q10,60 30,50 T70,70 T100,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
                        </svg>
                    </div>

                    {/* Yellow Scribble (Middle) */}
                    <div className="absolute top-1/3 w-full h-1/3 transition-opacity duration-300 pointer-events-none"
                         style={{ opacity: 1 - Math.abs(value - 0.5) * 2 }}>
                        <svg className="w-full h-full text-amber-400/30" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,50 Q25,30 50,50 T100,50 V100 H0 Z" fill="currentColor" />
                            <circle cx="20" cy="30" r="10" fill="currentColor" />
                            <circle cx="80" cy="40" r="15" fill="currentColor" />
                        </svg>
                    </div>

                    {/* Green Scribble (Bottom) */}
                    <div className="absolute bottom-0 w-full h-1/3 transition-opacity duration-300 pointer-events-none"
                        style={{ opacity: value < 0.4 ? (0.4 - value) * 2.5 : 0 }}>
                        <svg className="w-full h-full text-emerald-400/30" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0,80 Q30,95 60,80 T100,90 V100 H0 Z" fill="currentColor" />
                            <path d="M10,70 L30,90 L50,70 L70,90 L90,70" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                {/* The "Handle" or Indicator Pillar */}
                <div 
                    className="absolute left-1/2 -translate-x-1/2 w-16 bg-white rounded-full shadow-2xl border-4 border-slate-200 z-20 pointer-events-none"
                    style={{ 
                        bottom: `${value * 100}%`,
                        height: '120px',
                        transform: `translate(-50%, 50%) scale(${1 + value * 0.5})`, // Grows as it goes up
                        backgroundColor: getBgColor().replace('opacity', '1')
                    }}
                >
                </div>

                {/* Visual Height Lines */}
                <div className="absolute inset-y-12 left-8 flex flex-col justify-between text-slate-400 font-black text-sm uppercase tracking-tighter pointer-events-none opacity-50">
                    <span>High ☁️</span>
                    <span>Low 🌊</span>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-12 flex flex-col items-center gap-4">
                {step.type === 'play' ? (
                    <button 
                        onClick={onComplete}
                        className="px-12 py-6 bg-[#58CC02] text-white rounded-[24px] font-black text-2xl shadow-[0_8px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[8px] active:shadow-none transition-all"
                    >
                        이해했어요!
                    </button>
                ) : (
                    <div className="flex gap-2 items-center text-slate-400 font-bold">
                        <div className="w-3 h-3 bg-[#4285F4] rounded-full animate-pulse" />
                        달이가 소리를 들려주는 중...
                    </div>
                )}
            </div>

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