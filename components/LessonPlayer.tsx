import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Check, Volume2, ArrowRight, Star, Heart, Cloud, Sun, Music, Circle, Triangle, Square, ChevronUp, ChevronDown, Repeat, Play, Pause } from 'lucide-react';

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
    ],
    'harmony-intro': [
        { type: 'listen', title: '화음이 뭘까?', description: '먼저 하나의 소리를 들어보세요', demoType: 'single-note' },
        { type: 'listen', title: '두 소리를 겹쳐볼까?', description: '이번엔 두 개의 소리가 동시에 나요!', demoType: 'two-notes' },
        { type: 'play', title: '직접 겹쳐봐요!', description: '아래 줄을 하나씩 눌러보세요. 그리고 함께 눌러보세요!', demoType: 'harmony-explore' },
    ],
    'harmony-feeling': [
        { type: 'listen', title: '이 소리는 어떤가요?', description: '편안한 느낌인지, 긴장되는 느낌인지 느껴보세요', demoType: 'consonance-dissonance' },
        { type: 'choose', title: '이 소리는 어떤 느낌이에요?', demoType: 'consonance-dissonance' },
        { type: 'choose', title: '이번엔?', demoType: 'consonance-dissonance' },
        { type: 'choose', title: '이 소리도 들어볼까요?', demoType: 'consonance-dissonance' },
        { type: 'choose', title: '마지막! 이 소리는?', demoType: 'consonance-dissonance' },
    ],
    'harmony-blocks': [
        { type: 'listen', title: '소리를 블록으로 봐요', description: '위로 쌓이면 동시에, 옆으로 이어지면 차례대로!', demoType: 'blocks-intro' },
        { type: 'listen', title: '여러 소리 조합을 들어보세요', description: '블록마다 다른 소리가 나요', demoType: 'blocks-demo' },
        { type: 'choose', title: '어떤 소리가 마음에 드나요?', demoType: 'blocks-pick' },
    ],
    'harmony-stack': [
        { type: 'listen', title: '기본 소리 위에 쌓아볼까요?', description: '먼저 아래 소리를 들어보세요', demoType: 'stack-intro' },
        { type: 'play', title: '어떤 소리를 올려볼까요?', description: '위에 올릴 소리를 골라보세요', demoType: 'stack-pick' },
        { type: 'play', title: '다른 소리도 올려봐요!', description: '이번엔 다른 소리를 골라보세요', demoType: 'stack-pick' },
        { type: 'choose', title: '어떤 조합이 더 안정적이었나요?', demoType: 'stack-feel' },
    ],
    'harmony-triad': [
        { type: 'listen', title: '한 음, 두 음, 세 음', description: '소리를 하나씩 더해볼까요?', demoType: 'triad-build' },
        { type: 'listen', title: '세 소리를 함께 들어보세요', description: '풍성한 소리를 느껴보세요', demoType: 'triad-full' },
        { type: 'choose', title: '어느 게 가장 풍성하게 들렸나요?', demoType: 'triad-compare' },
    ],
    'harmony-mood': [
        { type: 'listen', title: '두 가지 화음을 들어볰요', description: '같은 음인데 느낌이 달라요!', demoType: 'mood-intro' },
        { type: 'choose', title: '이 소리는 어떤 느낌이에요?', demoType: 'mood-feel' },
        { type: 'choose', title: '이번엔?', demoType: 'mood-feel' },
        { type: 'choose', title: '마지막! 이 화음은?', demoType: 'mood-feel' },
    ],
    'harmony-progression': [
        { type: 'listen', title: '화음이 움직여요', description: '화음이 차례대로 바뀌는 걸 들어보세요', demoType: 'prog-listen' },
        { type: 'listen', title: '블록으로 봐요', description: '화음이 어떻게 움직이는지 블록으로 확인해보세요', demoType: 'prog-blocks' },
        { type: 'play', title: '순서를 바꿔볼까요?', description: '블록을 드래그해서 순서를 바꿔보세요', demoType: 'prog-reorder' },
        { type: 'choose', title: '어떤 순서가 좋았나요?', demoType: 'prog-pick' },
    ],
    'melody-direction': [
        { type: 'listen', title: '한 음을 들어봐요', description: '먼저 하나의 소리를 들어보세요', demoType: 'single' },
        { type: 'listen', title: '소리가 올라가요', description: '소리가 위로 움직이는 걸 느껴보세요', demoType: 'ascending' },
        { type: 'listen', title: '소리가 내려가요', description: '소리가 아래로 움직이는 걸 느껴보세요', demoType: 'descending' },
        { type: 'choose', title: '어느 쪽으로 움직였나요?', demoType: 'direction-quiz' },
    ],
    'melody-pattern': [
        { type: 'play', title: '세 음 패턴 만들기', description: '블록을 배열해서 멜로디 선을 그려보세요' }
    ],
    'melody-rhythm': [
        { type: 'play', title: '리듬 위에 음 놓기', description: '4박 그리드 위에 음을 놓아보세요' }
    ],
    'melody-compose': [
        { type: 'play', title: '코드 위의 멜로디', description: '정해진 코드진행 위에서 멜로디를 만들어보세요' }
    ],
};

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ lessonId, onComplete, onExit }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle');
    const [isReady, setIsReady] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Audio Refs
    const synthRef = useRef<Tone.PolySynth | null>(null);
    const membraneRef = useRef<Tone.MembraneSynth | null>(null);

    const steps = LESSONS[lessonId] || [];
    const currentStep = steps[stepIndex];
    const progress = ((stepIndex) / steps.length) * 100;

    useEffect(() => {
        Tone.loaded().then(() => setIsReady(true));

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
            case 'harmony-intro': return <HarmonyIntroGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} />;
            case 'harmony-feeling': return <ConsonanceDissonanceGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} stepIndex={stepIndex} />;
            case 'harmony-blocks': return <HarmonyBlocksGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} stepIndex={stepIndex} />;
            case 'harmony-stack': return <HarmonyStackGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} stepIndex={stepIndex} />;
            case 'harmony-triad': return <TriadGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} stepIndex={stepIndex} />;
            case 'harmony-mood': return <MajorMinorGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} stepIndex={stepIndex} />;
            case 'harmony-progression': return <ChordProgressionGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} stepIndex={stepIndex} />;
            case 'melody-direction': return <MelodyDirectionGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} stepIndex={stepIndex} />;
            case 'melody-pattern': return <MelodyPatternGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} />;
            case 'melody-rhythm': return <MelodyRhythmGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} />;
            case 'melody-compose': return <MelodyOverChordGame step={currentStep} onComplete={handleStepComplete} synth={synthRef.current} />;
            default: return <div>Unknown Lesson</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slide-up">
            {!isReady && (
                <div className="absolute inset-0 bg-[#F8F9FA]/90 flex flex-col items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="w-16 h-16 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-slate-800 text-xl font-bold animate-pulse">레슨 준비 중...</div>
                </div>
            )}

            {isReady && !hasStarted && (
                <div className="absolute inset-0 bg-[#F8F9FA]/90 flex flex-col items-center justify-center z-[90] backdrop-blur-sm">
                    <h2 className="text-4xl font-black text-slate-800 mb-8">{steps[0]?.title || '레슨'}</h2>
                    <button 
                        onClick={async () => {
                            await Tone.start();
                            if (Tone.context.state !== 'running') await Tone.context.resume();
                            setHasStarted(true);
                        }}
                        className="px-12 py-6 bg-[#58CC02] hover:bg-[#46A302] text-white rounded-[2rem] font-black text-3xl shadow-[0_8px_0_rgba(70,163,2,1)] hover:translate-y-[2px] hover:shadow-[0_6px_0_rgba(70,163,2,1)] active:translate-y-[8px] active:shadow-none transition-all"
                    >
                        레슨 시작하기
                    </button>
                    <div className="text-slate-500 font-bold mt-8">소리를 켜고 화면을 탭하세요</div>
                </div>
            )}

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

// =============================================
// MODULE 1: 화음 소개 — 두 소리가 함께 울리는 경험하기
// =============================================
const HarmonyIntroGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any }> = ({ step, onComplete, synth }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeNotes, setActiveNotes] = useState<string[]>([]);
    const [note1Active, setNote1Active] = useState(false);
    const [note2Active, setNote2Active] = useState(false);

    const playNote = async (note: string) => {
        await Tone.start();
        synth?.triggerAttackRelease(note, '1n');
    };

    const playBoth = async () => {
        await Tone.start();
        synth?.triggerAttackRelease(['C4', 'E4'], '1n');
    };

    // Listen step: single-note
    if (step.type === 'listen' && step.demoType === 'single-note') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Single line visual */}
                <div className="w-full max-w-sm h-48 flex flex-col items-center justify-center gap-4 animate-slide-up delay-200">
                    <div className={`w-full h-16 rounded-2xl transition-all duration-500 flex items-center justify-center ${isPlaying ? 'bg-violet-400 shadow-lg shadow-violet-300/50 scale-105' : 'bg-violet-100 border-2 border-violet-200'
                        }`}>
                        <span className={`font-black text-lg transition-colors duration-300 ${isPlaying ? 'text-white' : 'text-violet-400'}`}>도</span>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        if (isPlaying) return;
                        setIsPlaying(true);
                        await Tone.start();
                        synth?.triggerAttackRelease('C4', '1n');
                        setTimeout(() => {
                            setIsPlaying(false);
                            onComplete();
                        }, 2500);
                    }}
                    disabled={isPlaying}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400 shadow-violet-200' : 'bg-violet-500 border-violet-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    {isPlaying ? '♪' : '▶'}
                </button>
            </div>
        );
    }

    // Listen step: two-notes
    if (step.type === 'listen' && step.demoType === 'two-notes') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Two overlapping lines visual */}
                <div className="w-full max-w-sm h-48 flex flex-col items-center justify-center gap-4 animate-slide-up delay-200">
                    <div className={`w-full h-16 rounded-2xl transition-all duration-500 flex items-center justify-center ${isPlaying ? 'bg-violet-400 shadow-lg shadow-violet-300/50 scale-105' : 'bg-violet-100 border-2 border-violet-200'
                        }`}>
                        <span className={`font-black text-lg transition-colors duration-300 ${isPlaying ? 'text-white' : 'text-violet-400'}`}>도</span>
                    </div>
                    <div className={`w-full h-16 rounded-2xl transition-all duration-500 flex items-center justify-center ${isPlaying ? 'bg-fuchsia-400 shadow-lg shadow-fuchsia-300/50 scale-105' : 'bg-fuchsia-100 border-2 border-fuchsia-200'
                        }`}>
                        <span className={`font-black text-lg transition-colors duration-300 ${isPlaying ? 'text-white' : 'text-fuchsia-400'}`}>미</span>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        if (isPlaying) return;
                        setIsPlaying(true);
                        await Tone.start();
                        synth?.triggerAttackRelease(['C4', 'E4'], '1n');
                        setTimeout(() => {
                            setIsPlaying(false);
                            onComplete();
                        }, 2500);
                    }}
                    disabled={isPlaying}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400 shadow-violet-200' : 'bg-violet-500 border-violet-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    {isPlaying ? '♪' : '▶'}
                </button>
            </div>
        );
    }

    // Play step: harmony-explore — interactive two bars
    return (
        <div className="text-center flex flex-col items-center gap-8 w-full">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

            {/* Interactive note bars */}
            <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-slide-up delay-200">
                {/* Note 1: 도 */}
                <button
                    onClick={async () => {
                        setNote1Active(true);
                        await playNote('C4');
                        setTimeout(() => setNote1Active(false), 800);
                    }}
                    className={`w-full h-20 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.97] ${note1Active
                            ? 'bg-violet-400 shadow-lg shadow-violet-300/50 scale-105 text-white'
                            : 'bg-white border-4 border-violet-200 text-violet-500 hover:border-violet-300 hover:bg-violet-50'
                        }`}
                >
                    <span className="font-black text-2xl">도</span>
                    <Volume2 size={24} className={note1Active ? 'animate-pulse' : 'opacity-50'} />
                </button>

                {/* Note 2: 미 */}
                <button
                    onClick={async () => {
                        setNote2Active(true);
                        await playNote('E4');
                        setTimeout(() => setNote2Active(false), 800);
                    }}
                    className={`w-full h-20 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.97] ${note2Active
                            ? 'bg-fuchsia-400 shadow-lg shadow-fuchsia-300/50 scale-105 text-white'
                            : 'bg-white border-4 border-fuchsia-200 text-fuchsia-500 hover:border-fuchsia-300 hover:bg-fuchsia-50'
                        }`}
                >
                    <span className="font-black text-2xl">미</span>
                    <Volume2 size={24} className={note2Active ? 'animate-pulse' : 'opacity-50'} />
                </button>
            </div>

            {/* Play both button */}
            <button
                onClick={async () => {
                    setNote1Active(true);
                    setNote2Active(true);
                    await playBoth();
                    setTimeout(() => {
                        setNote1Active(false);
                        setNote2Active(false);
                    }, 800);
                }}
                className={`
                    w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 transition-all duration-300
                    bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-600 text-white hover:brightness-110 active:scale-95
                `}
            >
                ▶
            </button>
            <p className="text-sm text-slate-400 font-bold -mt-4">함께 들어보기</p>

            {/* Continue button */}
            <button
                onClick={onComplete}
                className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
            >
                다음으로
            </button>
        </div>
    );
};

// =============================================
// MODULE 2: 잘 어울리는 소리 vs 긴장되는 소리 느끼기
// =============================================
const CONSONANT_INTERVALS: [string, string][] = [
    ['C4', 'C5'],   // P8
    ['C4', 'E4'],   // M3
    ['C4', 'G4'],   // P5
    ['C4', 'A4'],   // M6
];

const DISSONANT_INTERVALS: [string, string][] = [
    ['C4', 'D4'],   // M2
    ['C4', 'F4'],   // P4
    ['C4', 'B4'],   // M7
];

const ConsonanceDissonanceGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any, stepIndex: number }> = ({ step, onComplete, synth, stepIndex }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [feedback, setFeedback] = useState<'none' | 'stable' | 'tense'>('none');
    const [hasPlayed, setHasPlayed] = useState(false);

    // Deterministic interval selection based on stepIndex
    const intervalPool = useMemo(() => {
        // Alternate between consonant and dissonant to give variety
        const allIntervals = [
            { notes: CONSONANT_INTERVALS[2], feeling: 'stable' as const },   // P5 — step 0/1
            { notes: DISSONANT_INTERVALS[0], feeling: 'tense' as const },    // M2 — step 1/2
            { notes: CONSONANT_INTERVALS[1], feeling: 'stable' as const },   // M3 — step 2/3
            { notes: DISSONANT_INTERVALS[2], feeling: 'tense' as const },    // M7 — step 3/4
            { notes: CONSONANT_INTERVALS[0], feeling: 'stable' as const },   // P8 — step 4/5
        ];
        return allIntervals[stepIndex % allIntervals.length];
    }, [stepIndex]);

    // Reset state on step change
    useEffect(() => {
        setIsPlaying(false);
        setFeedback('none');
        setHasPlayed(false);
    }, [stepIndex]);

    const playInterval = async () => {
        if (isPlaying) return;
        setIsPlaying(true);
        setHasPlayed(true);
        await Tone.start();
        synth?.triggerAttackRelease(intervalPool.notes, '1n');
        setTimeout(() => setIsPlaying(false), 2000);
    };

    const handleChoice = (choice: 'stable' | 'tense') => {
        // Show color feedback briefly, then advance
        setFeedback(choice);
        setTimeout(() => {
            setFeedback('none');
            onComplete();
        }, 1200);
    };

    // Listen step — just play and advance
    if (step.type === 'listen') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Two bars showing the notes */}
                <div className="w-full max-w-sm h-48 flex flex-col items-center justify-center gap-4 animate-slide-up delay-200">
                    <div className={`w-full h-16 rounded-2xl transition-all duration-500 flex items-center justify-center ${isPlaying ? 'bg-violet-400 shadow-lg shadow-violet-300/50 scale-105' : 'bg-violet-100 border-2 border-violet-200'
                        }`}>
                        <span className={`font-black text-lg transition-colors duration-300 ${isPlaying ? 'text-white' : 'text-violet-400'}`}>♪</span>
                    </div>
                    <div className={`w-full h-16 rounded-2xl transition-all duration-500 flex items-center justify-center ${isPlaying ? 'bg-fuchsia-400 shadow-lg shadow-fuchsia-300/50 scale-105' : 'bg-fuchsia-100 border-2 border-fuchsia-200'
                        }`}>
                        <span className={`font-black text-lg transition-colors duration-300 ${isPlaying ? 'text-white' : 'text-fuchsia-400'}`}>♪</span>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        setIsPlaying(true);
                        await Tone.start();
                        synth?.triggerAttackRelease(intervalPool.notes, '1n');
                        setTimeout(() => {
                            setIsPlaying(false);
                            onComplete();
                        }, 2500);
                    }}
                    disabled={isPlaying}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400 shadow-violet-200' : 'bg-violet-500 border-violet-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    {isPlaying ? '♪' : '▶'}
                </button>
            </div>
        );
    }

    // Choose step — feeling selection
    return (
        <div className="text-center flex flex-col items-center gap-8 w-full relative">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">먼저 소리를 듣고, 느낌을 골라보세요</p>

            {/* Play button */}
            <button
                onClick={playInterval}
                disabled={isPlaying}
                className={`
                    w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-xl border-4 transition-all duration-300 animate-slide-up delay-200
                    ${isPlaying
                        ? 'bg-violet-100 border-violet-200 text-violet-400 shadow-violet-200 scale-110'
                        : 'bg-violet-500 border-violet-600 text-white hover:brightness-110 active:scale-95'}
                `}
            >
                {isPlaying ? '♫' : '▶'}
            </button>
            {!hasPlayed && <p className="text-sm text-violet-400 font-bold animate-pulse -mt-4">눌러서 소리를 들어보세요</p>}

            {/* Feeling buttons */}
            {hasPlayed && (
                <div className="flex gap-8 items-center justify-center animate-slide-up">
                    {/* 안정 (Comfortable) button */}
                    <button
                        onClick={() => handleChoice('stable')}
                        disabled={feedback !== 'none'}
                        className={`
                            flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 active:scale-95 w-40
                            ${feedback === 'stable'
                                ? 'bg-emerald-100 border-emerald-400 scale-110 shadow-lg shadow-emerald-200'
                                : feedback !== 'none'
                                    ? 'opacity-50 border-slate-200 bg-white'
                                    : 'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'}
                        `}
                    >
                        <img src="/Comfortable.png" alt="편안해요" className="w-20 h-20 object-contain" />
                        <span className={`font-black text-lg ${feedback === 'stable' ? 'text-emerald-600' : 'text-emerald-500'
                            }`}>편안해요</span>
                    </button>

                    {/* 긴장 (Tense) button */}
                    <button
                        onClick={() => handleChoice('tense')}
                        disabled={feedback !== 'none'}
                        className={`
                            flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 active:scale-95 w-40
                            ${feedback === 'tense'
                                ? 'bg-rose-100 border-rose-400 scale-110 shadow-lg shadow-rose-200'
                                : feedback !== 'none'
                                    ? 'opacity-50 border-slate-200 bg-white'
                                    : 'bg-white border-rose-200 hover:border-rose-400 hover:bg-rose-50'}
                        `}
                    >
                        <img src="/Tense.png" alt="긴장돼요" className="w-20 h-20 object-contain" />
                        <span className={`font-black text-lg ${feedback === 'tense' ? 'text-rose-600' : 'text-rose-500'
                            }`}>긴장돼요</span>
                    </button>
                </div>
            )}

            {/* Gentle feedback overlay */}
            {feedback !== 'none' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl transition-all duration-500 animate-fade-in pointer-events-none">
                    <div className={`px-8 py-4 rounded-2xl shadow-lg animate-pop-in ${feedback === 'stable' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                        <span className="text-2xl font-black">
                            {feedback === 'stable' ? '좋아요! 👂' : '좋아요! 👂'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// MODULE 3: 화음 블록으로 보기
// =============================================
const CHORD_BLOCKS = [
    { label: '조합 A', notes: ['C4', 'E4'], colors: ['#7C4DFF', '#B388FF'] },
    { label: '조합 B', notes: ['C4', 'E4', 'G4'], colors: ['#7C4DFF', '#B388FF', '#EA80FC'] },
    { label: '조합 C', notes: ['C4', 'F4'], colors: ['#7C4DFF', '#FF8A65'] },
    { label: '조합 D', notes: ['C4', 'G4'], colors: ['#7C4DFF', '#4FC3F7'] },
];

const HarmonyBlocksGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any, stepIndex: number }> = ({ step, onComplete, synth, stepIndex }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
    const [playedBlocks, setPlayedBlocks] = useState<Set<number>>(new Set());
    const [feedback, setFeedback] = useState(false);

    useEffect(() => {
        setIsPlaying(false);
        setSelectedBlock(null);
        setPlayedBlocks(new Set());
        setFeedback(false);
    }, [stepIndex]);

    const playBlock = async (blockIndex: number) => {
        if (isPlaying) return;
        setIsPlaying(true);
        setSelectedBlock(blockIndex);
        await Tone.start();
        synth?.triggerAttackRelease(CHORD_BLOCKS[blockIndex].notes, '1n');
        setPlayedBlocks(prev => new Set(prev).add(blockIndex));
        setTimeout(() => setIsPlaying(false), 1500);
    };

    // Listen step: blocks-intro — explain vertical=simultaneous, horizontal=sequential
    if (step.demoType === 'blocks-intro') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                <div className="flex gap-12 items-start justify-center w-full max-w-lg animate-slide-up delay-200">
                    {/* Vertical stack = simultaneous */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex flex-col gap-1">
                            <div className="w-32 h-10 rounded-lg bg-violet-400 shadow-md" />
                            <div className="w-32 h-10 rounded-lg bg-fuchsia-400 shadow-md" />
                        </div>
                        <span className="font-bold text-slate-600 text-sm">동시에 나는 소리</span>
                        <button
                            onClick={async () => {
                                await Tone.start();
                                synth?.triggerAttackRelease(['C4', 'E4'], '1n');
                            }}
                            className="w-14 h-14 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-violet-600"
                        >
                            <Volume2 size={24} />
                        </button>
                    </div>

                    {/* Horizontal row = sequential */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-16 h-10 rounded-lg bg-violet-400 shadow-md" />
                            <div className="w-16 h-10 rounded-lg bg-fuchsia-400 shadow-md" />
                        </div>
                        <span className="font-bold text-slate-600 text-sm">차례대로 나는 소리</span>
                        <button
                            onClick={async () => {
                                await Tone.start();
                                synth?.triggerAttackRelease('C4', '4n');
                                setTimeout(() => synth?.triggerAttackRelease('E4', '4n'), 600);
                            }}
                            className="w-14 h-14 rounded-full bg-fuchsia-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-fuchsia-600"
                        >
                            <Volume2 size={24} />
                        </button>
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    다음으로
                </button>
            </div>
        );
    }

    // Listen step: blocks-demo — show 4 chord blocks in a piano-roll grid
    if (step.demoType === 'blocks-demo') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Piano-roll style grid */}
                <div className="w-full max-w-md animate-slide-up delay-200">
                    {/* Note rows (like piano roll) */}
                    <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-4 shadow-inner">
                        {/* Row labels on the left, grid columns for each block */}
                        <div className="grid grid-cols-[40px_1fr] gap-2">
                            {/* Row: High note */}
                            <div className="flex items-center justify-center h-12">
                                <span className="text-xs font-bold text-slate-400">높</span>
                            </div>
                            <div className="flex gap-3 h-12">
                                {CHORD_BLOCKS.map((block, idx) => (
                                    <div
                                        key={`high-${idx}`}
                                        className={`flex-1 rounded-lg transition-all duration-300 ${block.notes.length >= 3
                                                ? `shadow-md ${selectedBlock === idx ? 'scale-105' : ''}`
                                                : 'bg-slate-100 border border-slate-200'
                                            }`}
                                        style={{ backgroundColor: block.notes.length >= 3 ? block.colors[2] : undefined }}
                                    />
                                ))}
                            </div>

                            {/* Row: Mid note */}
                            <div className="flex items-center justify-center h-12">
                                <span className="text-xs font-bold text-slate-400">중</span>
                            </div>
                            <div className="flex gap-3 h-12">
                                {CHORD_BLOCKS.map((block, idx) => (
                                    <div
                                        key={`mid-${idx}`}
                                        className={`flex-1 rounded-lg shadow-md transition-all duration-300 ${selectedBlock === idx ? 'scale-105' : ''}`}
                                        style={{ backgroundColor: block.colors[1] }}
                                    />
                                ))}
                            </div>

                            {/* Row: Low note (root) */}
                            <div className="flex items-center justify-center h-12">
                                <span className="text-xs font-bold text-slate-400">낮</span>
                            </div>
                            <div className="flex gap-3 h-12">
                                {CHORD_BLOCKS.map((block, idx) => (
                                    <div
                                        key={`low-${idx}`}
                                        className={`flex-1 rounded-lg shadow-md transition-all duration-300 ${selectedBlock === idx ? 'scale-105' : ''}`}
                                        style={{ backgroundColor: block.colors[0] }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Block play buttons */}
                    <div className="flex gap-3 mt-4">
                        {CHORD_BLOCKS.map((block, idx) => (
                            <button
                                key={idx}
                                onClick={() => playBlock(idx)}
                                className={`
                                    flex-1 py-4 rounded-xl border-4 font-black text-sm transition-all active:scale-95
                                    ${selectedBlock === idx && isPlaying
                                        ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-lg'
                                        : playedBlocks.has(idx)
                                            ? 'border-violet-200 bg-violet-50 text-violet-500'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'}
                                `}
                            >
                                <Volume2 size={18} className="mx-auto mb-1" />
                                {block.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    다음으로
                </button>
            </div>
        );
    }

    // Choose step: blocks-pick — pick your favorite
    return (
        <div className="text-center flex flex-col items-center gap-8 w-full relative">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">다시 들어보고 마음에 드는 소리를 골라보세요</p>

            {/* Selectable chord blocks as cards */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md animate-slide-up delay-200">
                {CHORD_BLOCKS.map((block, idx) => (
                    <button
                        key={idx}
                        onClick={async () => {
                            await playBlock(idx);
                            if (!feedback) {
                                setSelectedBlock(idx);
                            }
                        }}
                        className={`
                            p-5 rounded-2xl border-4 flex flex-col items-center gap-3 transition-all active:scale-95
                            ${selectedBlock === idx
                                ? 'border-violet-500 bg-violet-50 shadow-lg scale-105'
                                : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'}
                        `}
                    >
                        {/* Mini block visualization */}
                        <div className="flex flex-col gap-1 items-center">
                            {block.colors.map((color, ci) => (
                                <div
                                    key={ci}
                                    className="w-20 h-6 rounded-md shadow-sm"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Volume2 size={16} className="text-slate-400" />
                            <span className="font-bold text-slate-600">{block.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Confirm selection */}
            {selectedBlock !== null && !feedback && (
                <button
                    onClick={() => {
                        setFeedback(true);
                        setTimeout(onComplete, 1200);
                    }}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    이 소리가 좋아요!
                </button>
            )}

            {/* Gentle feedback */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl animate-fade-in pointer-events-none">
                    <div className="px-8 py-4 rounded-2xl shadow-lg bg-violet-500 text-white animate-pop-in">
                        <span className="text-2xl font-black">좋은 선택!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// MODULE 4: 두 음 직접 쌓아보기
// =============================================
const STACK_NOTES = [
    { note: 'D4', label: '레', color: '#FBBC04' },
    { note: 'E4', label: '미', color: '#34A853' },
    { note: 'F4', label: '파', color: '#4285F4' },
    { note: 'G4', label: '솔', color: '#AA00FF' },
    { note: 'A4', label: '라', color: '#EA4335' },
];

const HarmonyStackGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any, stepIndex: number }> = ({ step, onComplete, synth, stepIndex }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedNote, setSelectedNote] = useState<number | null>(null);
    const [triedNotes, setTriedNotes] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<'none' | 'stable' | 'tense'>('none');

    useEffect(() => {
        setIsPlaying(false);
        setSelectedNote(null);
        setTriedNotes([]);
        setFeedback('none');
    }, [stepIndex]);

    const playBase = async () => {
        await Tone.start();
        synth?.triggerAttackRelease('C4', '2n');
    };

    const playStack = async (noteIndex: number) => {
        if (isPlaying) return;
        setIsPlaying(true);
        setSelectedNote(noteIndex);
        if (!triedNotes.includes(noteIndex)) {
            setTriedNotes(prev => [...prev, noteIndex]);
        }
        await Tone.start();
        synth?.triggerAttackRelease(['C4', STACK_NOTES[noteIndex].note], '1n');
        setTimeout(() => setIsPlaying(false), 1500);
    };

    // Listen step: stack-intro — play base note
    if (step.demoType === 'stack-intro') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                <div className="w-full max-w-sm animate-slide-up delay-200">
                    <p className="text-sm font-bold text-slate-400 mb-3">이 소리 위에 다른 소리를 쌓아볼 거예요</p>
                    {/* Base note bar */}
                    <div className={`w-full h-20 rounded-2xl transition-all duration-500 flex items-center justify-center gap-3 ${isPlaying ? 'bg-violet-400 shadow-lg shadow-violet-300/50 scale-105 text-white' : 'bg-violet-100 border-4 border-violet-200 text-violet-500'
                        }`}>
                        <span className="font-black text-2xl">도</span>
                        <img src="/Music_note.png" alt="" className="w-8 h-8 object-contain" />
                    </div>
                </div>

                <button
                    onClick={async () => {
                        if (isPlaying) return;
                        setIsPlaying(true);
                        await playBase();
                        setTimeout(() => {
                            setIsPlaying(false);
                            onComplete();
                        }, 2000);
                    }}
                    disabled={isPlaying}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400 shadow-violet-200' : 'bg-violet-500 border-violet-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    <Volume2 size={32} />
                </button>
            </div>
        );
    }

    // Play step: stack-pick — pick a note to stack
    if (step.demoType === 'stack-pick') {
        return (
            <div className="text-center flex flex-col items-center gap-6 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                <div className="w-full max-w-sm flex flex-col items-center gap-3 animate-slide-up delay-200">
                    {/* Selected note bar (top) */}
                    <div className={`w-full h-16 rounded-2xl transition-all duration-500 flex items-center justify-center ${selectedNote !== null
                            ? 'shadow-lg scale-105 text-white'
                            : 'bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400'
                        }`}
                        style={{
                            backgroundColor: selectedNote !== null ? STACK_NOTES[selectedNote].color : undefined
                        }}
                    >
                        <span className="font-black text-xl">
                            {selectedNote !== null ? STACK_NOTES[selectedNote].label : '여기에 쌓아보세요'}
                        </span>
                    </div>

                    {/* Base note bar (bottom, always visible) */}
                    <div className="w-full h-16 rounded-2xl bg-violet-400 shadow-md flex items-center justify-center text-white">
                        <span className="font-black text-xl">도</span>
                    </div>
                </div>

                {/* Note picker row */}
                <div className="flex gap-3 w-full max-w-sm animate-slide-up delay-300">
                    {STACK_NOTES.map((n, idx) => (
                        <button
                            key={idx}
                            onClick={() => playStack(idx)}
                            className={`
                                flex-1 py-4 rounded-xl border-4 font-black text-sm transition-all active:scale-90
                                ${selectedNote === idx && isPlaying
                                    ? 'scale-110 shadow-lg border-slate-800 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:scale-105'}
                            `}
                            style={{
                                backgroundColor: selectedNote === idx && isPlaying ? n.color : undefined,
                                borderColor: triedNotes.includes(idx) ? n.color : undefined
                            }}
                        >
                            {n.label}
                        </button>
                    ))}
                </div>

                {/* Continue button */}
                {triedNotes.length >= 1 && (
                    <button
                        onClick={onComplete}
                        className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                    >
                        다음으로
                    </button>
                )}
            </div>
        );
    }

    // Choose step: stack-feel — which combination felt more stable?
    return (
        <div className="text-center flex flex-col items-center gap-8 w-full relative">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>

            <img src="/Thnking.png" alt="" className="w-24 h-24 object-contain animate-slide-up delay-100" />

            <p className="text-lg text-slate-500 font-medium animate-slide-up delay-100">두 가지 조합을 다시 들어보세요</p>

            {/* Two combo replay buttons */}
            <div className="flex gap-6 w-full max-w-sm animate-slide-up delay-200">
                <button
                    onClick={async () => {
                        await Tone.start();
                        synth?.triggerAttackRelease(['C4', 'E4'], '1n');
                    }}
                    className="flex-1 py-6 rounded-2xl border-4 border-emerald-200 bg-white hover:bg-emerald-50 active:scale-95 transition-all flex flex-col items-center gap-2"
                >
                    <div className="flex flex-col gap-1">
                        <div className="w-16 h-5 rounded bg-emerald-400" />
                        <div className="w-16 h-5 rounded bg-violet-400" />
                    </div>
                    <span className="font-bold text-slate-600 text-sm">도 + 미</span>
                    <Volume2 size={18} className="text-slate-400" />
                </button>

                <button
                    onClick={async () => {
                        await Tone.start();
                        synth?.triggerAttackRelease(['C4', 'D4'], '1n');
                    }}
                    className="flex-1 py-6 rounded-2xl border-4 border-amber-200 bg-white hover:bg-amber-50 active:scale-95 transition-all flex flex-col items-center gap-2"
                >
                    <div className="flex flex-col gap-1">
                        <div className="w-16 h-5 rounded bg-amber-400" />
                        <div className="w-16 h-5 rounded bg-violet-400" />
                    </div>
                    <span className="font-bold text-slate-600 text-sm">도 + 레</span>
                    <Volume2 size={18} className="text-slate-400" />
                </button>
            </div>

            {/* Feeling buttons */}
            <div className="flex gap-8 items-center justify-center animate-slide-up delay-300">
                <button
                    onClick={() => {
                        setFeedback('stable');
                        setTimeout(onComplete, 1200);
                    }}
                    disabled={feedback !== 'none'}
                    className={`
                        flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 active:scale-95 w-40
                        ${feedback === 'stable'
                            ? 'bg-emerald-100 border-emerald-400 scale-110 shadow-lg shadow-emerald-200'
                            : feedback !== 'none'
                                ? 'opacity-50 border-slate-200 bg-white'
                                : 'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'}
                    `}
                >
                    <img src="/Comfortable.png" alt="안정적" className="w-16 h-16 object-contain" />
                    <span className={`font-black text-lg ${feedback === 'stable' ? 'text-emerald-600' : 'text-emerald-500'
                        }`}>도 + 미</span>
                </button>

                <button
                    onClick={() => {
                        setFeedback('tense');
                        setTimeout(onComplete, 1200);
                    }}
                    disabled={feedback !== 'none'}
                    className={`
                        flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 active:scale-95 w-40
                        ${feedback === 'tense'
                            ? 'bg-amber-100 border-amber-400 scale-110 shadow-lg shadow-amber-200'
                            : feedback !== 'none'
                                ? 'opacity-50 border-slate-200 bg-white'
                                : 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50'}
                    `}
                >
                    <img src="/Thnking.png" alt="긴장" className="w-16 h-16 object-contain" />
                    <span className={`font-black text-lg ${feedback === 'tense' ? 'text-amber-600' : 'text-amber-500'
                        }`}>도 + 레</span>
                </button>
            </div>

            {/* Gentle feedback */}
            {feedback !== 'none' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl animate-fade-in pointer-events-none">
                    <div className="px-8 py-4 rounded-2xl shadow-lg bg-violet-500 text-white animate-pop-in">
                        <span className="text-2xl font-black">좋은 귀를 가졌어요!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// MODULE 5: 세 음 화음 체험하기 (Triad)
// =============================================
const TriadGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any, stepIndex: number }> = ({ step, onComplete, synth, stepIndex }) => {
    const [phase, setPhase] = useState<0 | 1 | 2>(0); // 0=1note, 1=2notes, 2=3notes
    const [isPlaying, setIsPlaying] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);
    const [feedback, setFeedback] = useState(false);

    useEffect(() => {
        setPhase(0);
        setIsPlaying(false);
        setSelected(null);
        setFeedback(false);
    }, [stepIndex]);

    const noteGroups = [
        { notes: ['C4'], label: '한 음', colors: ['#7C4DFF'] },
        { notes: ['C4', 'E4'], label: '두 음', colors: ['#7C4DFF', '#B388FF'] },
        { notes: ['C4', 'E4', 'G4'], label: '세 음', colors: ['#7C4DFF', '#B388FF', '#EA80FC'] },
    ];

    const playGroup = async (groupIndex: number) => {
        if (isPlaying) return;
        setIsPlaying(true);
        await Tone.start();
        synth?.triggerAttackRelease(noteGroups[groupIndex].notes, '1n');
        setTimeout(() => setIsPlaying(false), 1500);
    };

    // Listen: triad-build — play 1, 2, 3 notes progressively
    if (step.demoType === 'triad-build') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Progressive note bars */}
                <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-slide-up delay-200">
                    {noteGroups.map((group, gi) => (
                        <div key={gi} className={`w-full transition-all duration-500 ${gi <= phase ? 'opacity-100 scale-100' : 'opacity-30 scale-95'
                            }`}>
                            <div className="flex flex-col gap-1 mb-2">
                                {group.colors.map((color, ci) => (
                                    <div
                                        key={ci}
                                        className={`w-full h-12 rounded-xl shadow-md transition-all duration-500 ${gi === phase && isPlaying ? 'scale-105 shadow-lg' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-500 text-sm">{group.label}</span>
                                <button
                                    onClick={async () => {
                                        await playGroup(gi);
                                        if (gi === phase && phase < 2) {
                                            setTimeout(() => setPhase(prev => Math.min(prev + 1, 2) as 0 | 1 | 2), 1600);
                                        }
                                    }}
                                    disabled={gi > phase || isPlaying}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${gi <= phase
                                            ? 'bg-violet-500 text-white shadow-md active:scale-95'
                                            : 'bg-slate-200 text-slate-400'
                                        }`}
                                >
                                    <Volume2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {phase === 2 && (
                    <button
                        onClick={onComplete}
                        className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                    >
                        다음으로
                    </button>
                )}
            </div>
        );
    }

    // Listen: triad-full — listen to full triad
    if (step.demoType === 'triad-full') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                <div className="w-full max-w-sm animate-slide-up delay-200">
                    <div className="flex flex-col gap-1">
                        {noteGroups[2].colors.map((color, ci) => (
                            <div
                                key={ci}
                                className={`w-full h-16 rounded-xl shadow-md transition-all duration-500 ${isPlaying ? 'scale-105 shadow-lg' : ''
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <button
                    onClick={async () => {
                        await playGroup(2);
                        setTimeout(onComplete, 2000);
                    }}
                    disabled={isPlaying}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400' : 'bg-violet-500 border-violet-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    <Volume2 size={32} />
                </button>
            </div>
        );
    }

    // Choose: triad-compare — which sounds fullest?
    return (
        <div className="text-center flex flex-col items-center gap-8 w-full relative">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>

            <div className="flex gap-4 w-full max-w-md animate-slide-up delay-200">
                {noteGroups.map((group, gi) => (
                    <button
                        key={gi}
                        onClick={async () => {
                            await playGroup(gi);
                            if (!feedback) setSelected(gi);
                        }}
                        className={`
                            flex-1 p-4 rounded-2xl border-4 flex flex-col items-center gap-3 transition-all active:scale-95
                            ${selected === gi
                                ? 'border-violet-500 bg-violet-50 shadow-lg scale-105'
                                : 'border-slate-200 bg-white hover:border-violet-300'}
                        `}
                    >
                        <div className="flex flex-col gap-1 w-full">
                            {group.colors.map((color, ci) => (
                                <div key={ci} className="w-full h-6 rounded-md shadow-sm" style={{ backgroundColor: color }} />
                            ))}
                        </div>
                        <div className="flex items-center gap-1">
                            <Volume2 size={14} className="text-slate-400" />
                            <span className="font-bold text-slate-600 text-xs">{group.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            {selected !== null && !feedback && (
                <button
                    onClick={() => {
                        setFeedback(true);
                        setTimeout(onComplete, 1200);
                    }}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    이 소리가 좋아요!
                </button>
            )}

            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl animate-fade-in pointer-events-none">
                    <div className="px-8 py-4 rounded-2xl shadow-lg bg-violet-500 text-white animate-pop-in">
                        <span className="text-2xl font-black">좋은 귀를 가졌어요!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// MODULE 6: 밝은 화음 vs 어두운 화음
// =============================================
const MOOD_INTERVALS = [
    { notes: ['C4', 'E4', 'G4'], mood: 'bright' as const, blockColors: ['#7C4DFF', '#B388FF', '#EA80FC'] },
    { notes: ['C4', 'Eb4', 'G4'], mood: 'dark' as const, blockColors: ['#5C6BC0', '#7986CB', '#9FA8DA'] },
    { notes: ['F4', 'A4', 'C5'], mood: 'bright' as const, blockColors: ['#FF7043', '#FF8A65', '#FFAB91'] },
    { notes: ['D4', 'F4', 'A4'], mood: 'dark' as const, blockColors: ['#26A69A', '#4DB6AC', '#80CBC4'] },
    { notes: ['G4', 'B4', 'D5'], mood: 'bright' as const, blockColors: ['#AB47BC', '#CE93D8', '#E1BEE7'] },
    { notes: ['A4', 'C5', 'E5'], mood: 'dark' as const, blockColors: ['#42A5F5', '#64B5F6', '#90CAF9'] },
];

const MajorMinorGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any, stepIndex: number }> = ({ step, onComplete, synth, stepIndex }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [selected, setSelected] = useState<'bright' | 'dark' | null>(null);
    const [feedback, setFeedback] = useState(false);
    const [introPhase, setIntroPhase] = useState<0 | 1>(0);

    const currentInterval = useMemo(() => {
        // For choose steps, cycle through intervals based on stepIndex
        return MOOD_INTERVALS[(stepIndex - 1) % MOOD_INTERVALS.length];
    }, [stepIndex]);

    useEffect(() => {
        setIsPlaying(false);
        setSelected(null);
        setFeedback(false);
        setIntroPhase(0);
    }, [stepIndex]);

    const playChord = async (notes: string[]) => {
        if (isPlaying) return;
        setIsPlaying(true);
        await Tone.start();
        synth?.triggerAttackRelease(notes, '1n');
        setTimeout(() => setIsPlaying(false), 1500);
    };

    // Listen: mood-intro — play major then minor side by side
    if (step.demoType === 'mood-intro') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                <div className="flex gap-8 w-full max-w-md animate-slide-up delay-200">
                    {/* Bright chord */}
                    <div className="flex-1 flex flex-col items-center gap-3">
                        <div className={`w-full rounded-2xl p-4 border-4 transition-all duration-500 ${introPhase === 0 && isPlaying ? 'border-amber-400 bg-amber-50 shadow-lg shadow-amber-200/50 scale-105' : 'border-slate-200 bg-white'
                            }`}>
                            <div className="flex flex-col gap-1">
                                {MOOD_INTERVALS[0].blockColors.map((c, i) => (
                                    <div key={i} className="w-full h-8 rounded-lg shadow-sm" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                setIntroPhase(0);
                                await playChord(MOOD_INTERVALS[0].notes);
                            }}
                            className="w-14 h-14 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-amber-500"
                        >
                            <Volume2 size={22} />
                        </button>
                        <img src="/Comfortable.png" alt="밝음" className="w-12 h-12 object-contain" />
                    </div>

                    {/* Dark chord */}
                    <div className="flex-1 flex flex-col items-center gap-3">
                        <div className={`w-full rounded-2xl p-4 border-4 transition-all duration-500 ${introPhase === 1 && isPlaying ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-200/50 scale-105' : 'border-slate-200 bg-white'
                            }`}>
                            <div className="flex flex-col gap-1">
                                {MOOD_INTERVALS[1].blockColors.map((c, i) => (
                                    <div key={i} className="w-full h-8 rounded-lg shadow-sm" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                setIntroPhase(1);
                                await playChord(MOOD_INTERVALS[1].notes);
                            }}
                            className="w-14 h-14 rounded-full bg-indigo-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-indigo-500"
                        >
                            <Volume2 size={22} />
                        </button>
                        <img src="/Sad.png" alt="어두움" className="w-12 h-12 object-contain" />
                    </div>
                </div>

                {/* Note difference hint */}
                <div className="bg-slate-50 rounded-xl px-6 py-3 border border-slate-200 animate-slide-up delay-300">
                    <p className="text-sm text-slate-500 font-medium">똑같은 음인데 한 음만 달라요!</p>
                </div>

                <button
                    onClick={onComplete}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    다음으로
                </button>
            </div>
        );
    }

    // Choose: mood-feel — bright or dark?
    return (
        <div className="text-center flex flex-col items-center gap-8 w-full relative">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>

            {/* Block visualization of current chord */}
            <div className={`w-full max-w-xs rounded-2xl p-5 border-4 transition-all duration-500 animate-slide-up delay-100 ${isPlaying ? 'border-violet-400 bg-violet-50 shadow-lg scale-105' : 'border-slate-200 bg-white'
                }`}>
                <div className="flex flex-col gap-1">
                    {currentInterval.blockColors.map((c, i) => (
                        <div key={i} className="w-full h-10 rounded-lg shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                </div>
            </div>

            {/* Play button */}
            <button
                onClick={() => playChord(currentInterval.notes)}
                disabled={isPlaying}
                className={`
                    w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                    ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400' : 'bg-violet-500 border-violet-600 text-white active:scale-95'}
                `}
            >
                <Volume2 size={24} />
            </button>

            {/* Feeling buttons */}
            <div className="flex gap-8 items-center justify-center animate-slide-up delay-200">
                <button
                    onClick={() => {
                        if (feedback) return;
                        setSelected('bright');
                        setFeedback(true);
                        setTimeout(onComplete, 1200);
                    }}
                    disabled={feedback}
                    className={`
                        flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 active:scale-95 w-36
                        ${selected === 'bright'
                            ? 'bg-amber-100 border-amber-400 scale-110 shadow-lg shadow-amber-200'
                            : feedback
                                ? 'opacity-50 border-slate-200 bg-white'
                                : 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50'}
                    `}
                >
                    <img src="/Comfortable.png" alt="밝음" className="w-16 h-16 object-contain" />
                    <span className={`font-black text-lg ${selected === 'bright' ? 'text-amber-600' : 'text-amber-500'
                        }`}>밝아요</span>
                </button>

                <button
                    onClick={() => {
                        if (feedback) return;
                        setSelected('dark');
                        setFeedback(true);
                        setTimeout(onComplete, 1200);
                    }}
                    disabled={feedback}
                    className={`
                        flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 active:scale-95 w-36
                        ${selected === 'dark'
                            ? 'bg-indigo-100 border-indigo-400 scale-110 shadow-lg shadow-indigo-200'
                            : feedback
                                ? 'opacity-50 border-slate-200 bg-white'
                                : 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'}
                    `}
                >
                    <img src="/Sad.png" alt="어두움" className="w-16 h-16 object-contain" />
                    <span className={`font-black text-lg ${selected === 'dark' ? 'text-indigo-600' : 'text-indigo-500'
                        }`}>어두워요</span>
                </button>
            </div>

            {/* Gentle feedback */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl animate-fade-in pointer-events-none">
                    <div className="px-8 py-4 rounded-2xl shadow-lg bg-violet-500 text-white animate-pop-in">
                        <span className="text-2xl font-black">좋은 귀를 가졌어요!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// MODULE 7: 간단한 코드 진행 들어보기
// =============================================
const PROG_CHORDS = [
    { label: 'A', notes: ['C4', 'E4', 'G4'], colors: ['#7C4DFF', '#B388FF', '#EA80FC'] },
    { label: 'B', notes: ['F4', 'A4', 'C5'], colors: ['#FF7043', '#FF8A65', '#FFAB91'] },
    { label: 'C', notes: ['G4', 'B4', 'D5'], colors: ['#26A69A', '#4DB6AC', '#80CBC4'] },
];

const ChordProgressionGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any, stepIndex: number }> = ({ step, onComplete, synth, stepIndex }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeChord, setActiveChord] = useState<number | null>(null);
    const [order, setOrder] = useState([0, 1, 2]);
    const [dragFrom, setDragFrom] = useState<number | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<number[] | null>(null);
    const [feedback, setFeedback] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        setIsPlaying(false);
        setActiveChord(null);
        setOrder([0, 1, 2]);
        setDragFrom(null);
        setSelectedOrder(null);
        setFeedback(false);
        timeoutRef.current.forEach(t => clearTimeout(t));
    }, [stepIndex]);

    const playProgression = async (chordOrder: number[]) => {
        if (isPlaying) return;
        setIsPlaying(true);
        await Tone.start();

        timeoutRef.current.forEach(t => clearTimeout(t));
        timeoutRef.current = [];

        for (let i = 0; i < chordOrder.length; i++) {
            const t = setTimeout(() => {
                setActiveChord(chordOrder[i]);
                synth?.triggerAttackRelease(PROG_CHORDS[chordOrder[i]].notes, '2n');
            }, i * 1200);
            timeoutRef.current.push(t);
        }

        const endT = setTimeout(() => {
            setActiveChord(null);
            setIsPlaying(false);
        }, chordOrder.length * 1200 + 500);
        timeoutRef.current.push(endT);
    };

    const swapItems = (fromIdx: number, toIdx: number) => {
        const newOrder = [...order];
        const temp = newOrder[fromIdx];
        newOrder[fromIdx] = newOrder[toIdx];
        newOrder[toIdx] = temp;
        setOrder(newOrder);
    };

    // Listen: prog-listen — play the default progression
    if (step.demoType === 'prog-listen') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Horizontal chord blocks */}
                <div className="flex gap-4 w-full max-w-md animate-slide-up delay-200">
                    {[0, 1, 2].map((ci) => (
                        <div
                            key={ci}
                            className={`flex-1 rounded-2xl p-4 border-4 transition-all duration-300 ${activeChord === ci ? 'border-violet-500 bg-violet-50 scale-110 shadow-lg' : 'border-slate-200 bg-white'
                                }`}
                        >
                            <div className="flex flex-col gap-1">
                                {PROG_CHORDS[ci].colors.map((c, i) => (
                                    <div key={i} className="w-full h-6 rounded-md shadow-sm" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <span className="font-bold text-slate-500 text-sm mt-2 block">화음 {PROG_CHORDS[ci].label}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => playProgression([0, 1, 2])}
                    disabled={isPlaying}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400' : 'bg-violet-500 border-violet-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    <Volume2 size={28} />
                </button>

                <button
                    onClick={onComplete}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    다음으로
                </button>
            </div>
        );
    }

    // Listen: prog-blocks — show progression as blocks with animation
    if (step.demoType === 'prog-blocks') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Block timeline grid */}
                <div className="w-full max-w-md animate-slide-up delay-200">
                    <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-4 shadow-inner">
                        <div className="flex items-end gap-2">
                            {/* Timeline arrow */}
                            <div className="flex items-center gap-0 w-full">
                                {[0, 1, 2].map((ci) => (
                                    <div key={ci} className="flex-1 flex flex-col items-center">
                                        <div className={`w-full p-3 rounded-xl border-3 transition-all duration-300 ${activeChord === ci ? 'border-violet-500 bg-violet-50 shadow-lg scale-105' : 'border-slate-200 bg-white'
                                            }`}>
                                            <div className="flex flex-col gap-1">
                                                {PROG_CHORDS[ci].colors.map((c, i) => (
                                                    <div key={i} className="w-full h-6 rounded shadow-sm" style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 mt-1">{ci + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-center mt-3">
                            <ArrowRight size={20} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 ml-1">시간 순서</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => playProgression([0, 1, 2])}
                    disabled={isPlaying}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                        ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400' : 'bg-violet-500 border-violet-600 text-white active:scale-95'}
                    `}
                >
                    <Volume2 size={24} />
                </button>

                <button
                    onClick={onComplete}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    다음으로
                </button>
            </div>
        );
    }

    // Play: prog-reorder — drag to reorder blocks
    if (step.demoType === 'prog-reorder') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Reorderable blocks */}
                <div className="flex gap-3 w-full max-w-md animate-slide-up delay-200">
                    {order.map((chordIdx, posIdx) => (
                        <button
                            key={posIdx}
                            onClick={() => {
                                if (dragFrom === null) {
                                    setDragFrom(posIdx);
                                } else {
                                    swapItems(dragFrom, posIdx);
                                    setDragFrom(null);
                                }
                            }}
                            className={`
                                flex-1 p-4 rounded-2xl border-4 transition-all duration-300 active:scale-95 flex flex-col items-center gap-2
                                ${dragFrom === posIdx
                                    ? 'border-violet-500 bg-violet-50 scale-110 shadow-lg'
                                    : dragFrom !== null
                                        ? 'border-amber-300 bg-amber-50 hover:border-amber-500'
                                        : activeChord === chordIdx
                                            ? 'border-violet-500 bg-violet-50 scale-105 shadow-lg'
                                            : 'border-slate-200 bg-white hover:border-violet-300'}
                            `}
                        >
                            <div className="flex flex-col gap-1 w-full">
                                {PROG_CHORDS[chordIdx].colors.map((c, i) => (
                                    <div key={i} className="w-full h-6 rounded-md shadow-sm" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                            <span className="font-bold text-slate-500 text-sm">화음 {PROG_CHORDS[chordIdx].label}</span>
                        </button>
                    ))}
                </div>

                {dragFrom !== null && (
                    <p className="text-sm font-bold text-amber-500 animate-pulse">바꿀 자리를 눌러주세요</p>
                )}

                {/* Play reordered progression */}
                <button
                    onClick={() => playProgression(order)}
                    disabled={isPlaying}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                        ${isPlaying ? 'bg-violet-100 border-violet-200 text-violet-400' : 'bg-violet-500 border-violet-600 text-white active:scale-95'}
                    `}
                >
                    <Volume2 size={24} />
                </button>

                <button
                    onClick={onComplete}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    다음으로
                </button>
            </div>
        );
    }

    // Choose: prog-pick — which order did you like?
    return (
        <div className="text-center flex flex-col items-center gap-8 w-full relative">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>

            <img src="/Thnking.png" alt="" className="w-20 h-20 object-contain animate-slide-up delay-100" />

            {/* Two progression options */}
            <div className="flex flex-col gap-4 w-full max-w-md animate-slide-up delay-200">
                {[
                    { order: [0, 1, 2], label: 'A → B → C' },
                    { order: [0, 2, 1], label: 'A → C → B' },
                ].map((option, oi) => (
                    <button
                        key={oi}
                        onClick={async () => {
                            await playProgression(option.order);
                            if (!feedback) setSelectedOrder(option.order);
                        }}
                        className={`
                            w-full p-4 rounded-2xl border-4 flex items-center gap-4 transition-all active:scale-95
                            ${selectedOrder === option.order
                                ? 'border-violet-500 bg-violet-50 shadow-lg'
                                : 'border-slate-200 bg-white hover:border-violet-300'}
                        `}
                    >
                        <div className="flex gap-2 flex-1">
                            {option.order.map((ci, i) => (
                                <div key={i} className="flex-1 flex flex-col gap-1">
                                    {PROG_CHORDS[ci].colors.map((c, j) => (
                                        <div key={j} className="w-full h-4 rounded shadow-sm" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Volume2 size={16} className="text-slate-400" />
                            <span className="font-bold text-slate-500 text-sm">{option.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            {selectedOrder && !feedback && (
                <button
                    onClick={() => {
                        setFeedback(true);
                        setTimeout(onComplete, 1200);
                    }}
                    className="px-12 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all animate-pop-in"
                >
                    이 순서가 좋아요!
                </button>
            )}

            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl animate-fade-in pointer-events-none">
                    <div className="px-8 py-4 rounded-2xl shadow-lg bg-violet-500 text-white animate-pop-in">
                        <span className="text-2xl font-black">멋진 귀를 가졌어요!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// MELODY MODULE 1: 소리가 움직이는 경험하기
// =============================================
const DIRECTION_SEQUENCES = [
    { notes: ['C4', 'E4'] as const, direction: 'up' as const },
    { notes: ['G4', 'D4'] as const, direction: 'down' as const },
    { notes: ['D4', 'A4'] as const, direction: 'up' as const },
    { notes: ['A4', 'E4'] as const, direction: 'down' as const },
    { notes: ['E4', 'G4'] as const, direction: 'up' as const },
    { notes: ['F4', 'C4'] as const, direction: 'down' as const },
];

const MelodyDirectionGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any, stepIndex: number }> = ({ step, onComplete, synth, stepIndex }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeNote, setActiveNote] = useState<number>(-1); // 0=first, 1=second
    const [selected, setSelected] = useState<'up' | 'down' | null>(null);
    const [feedback, setFeedback] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);

    const currentSeq = useMemo(() => {
        return DIRECTION_SEQUENCES[stepIndex % DIRECTION_SEQUENCES.length];
    }, [stepIndex]);

    useEffect(() => {
        setIsPlaying(false);
        setActiveNote(-1);
        setSelected(null);
        setFeedback(false);
        setHasPlayed(false);
    }, [stepIndex]);

    const playSequence = async (notes: readonly string[]) => {
        if (isPlaying) return;
        setIsPlaying(true);
        setHasPlayed(true);
        await Tone.start();

        // Play first note
        setActiveNote(0);
        synth?.triggerAttackRelease(notes[0], '4n');

        // Play second note after delay
        setTimeout(() => {
            setActiveNote(1);
            synth?.triggerAttackRelease(notes[1], '4n');
        }, 700);

        // Reset
        setTimeout(() => {
            setActiveNote(-1);
            setIsPlaying(false);
        }, 1500);
    };

    // Pitch to visual Y position (higher note = higher position)
    const noteToY = (note: string): number => {
        const noteMap: Record<string, number> = { 'C4': 80, 'D4': 65, 'E4': 50, 'F4': 40, 'G4': 30, 'A4': 15, 'B4': 5 };
        return noteMap[note] || 50;
    };

    // Listen: single note
    if (step.demoType === 'single') {
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Single dot visual */}
                <div className="w-full max-w-xs h-48 relative bg-slate-50 rounded-3xl border-2 border-slate-200 overflow-hidden animate-slide-up delay-200">
                    <div className={`absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full transition-all duration-500 flex items-center justify-center ${isPlaying ? 'bg-orange-400 shadow-lg shadow-orange-300/50 scale-125' : 'bg-orange-100 border-2 border-orange-200'
                        }`} style={{ top: '40%' }}>
                        <Volume2 size={24} className={isPlaying ? 'text-white' : 'text-orange-300'} />
                    </div>
                </div>

                <button
                    onClick={async () => {
                        if (isPlaying) return;
                        setIsPlaying(true);
                        await Tone.start();
                        synth?.triggerAttackRelease('E4', '2n');
                        setTimeout(() => {
                            setIsPlaying(false);
                            onComplete();
                        }, 2500);
                    }}
                    disabled={isPlaying}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-orange-100 border-orange-200 text-orange-400 shadow-orange-200' : 'bg-orange-500 border-orange-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    <Volume2 size={32} />
                </button>
            </div>
        );
    }

    // Listen: ascending
    if (step.demoType === 'ascending') {
        const ascNotes = ['C4', 'E4'];
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Two dots with arrow showing upward movement */}
                <div className="w-full max-w-xs h-56 relative bg-slate-50 rounded-3xl border-2 border-slate-200 overflow-hidden animate-slide-up delay-200">
                    {/* Low note dot */}
                    <div className={`absolute left-[30%] -translate-x-1/2 w-14 h-14 rounded-full transition-all duration-500 flex items-center justify-center ${activeNote === 0 ? 'bg-orange-400 shadow-lg shadow-orange-300/50 scale-125' : 'bg-orange-100 border-2 border-orange-200'
                        }`} style={{ top: `${noteToY(ascNotes[0])}%` }}>
                        <span className={`font-black text-sm ${activeNote === 0 ? 'text-white' : 'text-orange-300'}`}>Low</span>
                    </div>

                    {/* Arrow */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <ChevronUp size={40} className="text-emerald-400 animate-bounce" />
                    </div>

                    {/* High note dot */}
                    <div className={`absolute left-[70%] -translate-x-1/2 w-14 h-14 rounded-full transition-all duration-500 flex items-center justify-center ${activeNote === 1 ? 'bg-emerald-400 shadow-lg shadow-emerald-300/50 scale-125' : 'bg-emerald-100 border-2 border-emerald-200'
                        }`} style={{ top: `${noteToY(ascNotes[1])}%` }}>
                        <span className={`font-black text-sm ${activeNote === 1 ? 'text-white' : 'text-emerald-300'}`}>High</span>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        await playSequence(ascNotes);
                        setTimeout(onComplete, 2000);
                    }}
                    disabled={isPlaying}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-orange-100 border-orange-200 text-orange-400' : 'bg-orange-500 border-orange-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    <Volume2 size={32} />
                </button>
            </div>
        );
    }

    // Listen: descending
    if (step.demoType === 'descending') {
        const descNotes = ['G4', 'D4'];
        return (
            <div className="text-center flex flex-col items-center gap-8 w-full">
                <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
                <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

                {/* Two dots with arrow showing downward movement */}
                <div className="w-full max-w-xs h-56 relative bg-slate-50 rounded-3xl border-2 border-slate-200 overflow-hidden animate-slide-up delay-200">
                    {/* High note dot (start) */}
                    <div className={`absolute left-[30%] -translate-x-1/2 w-14 h-14 rounded-full transition-all duration-500 flex items-center justify-center ${activeNote === 0 ? 'bg-emerald-400 shadow-lg shadow-emerald-300/50 scale-125' : 'bg-emerald-100 border-2 border-emerald-200'
                        }`} style={{ top: `${noteToY(descNotes[0])}%` }}>
                        <span className={`font-black text-sm ${activeNote === 0 ? 'text-white' : 'text-emerald-300'}`}>High</span>
                    </div>

                    {/* Arrow */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <ChevronDown size={40} className="text-orange-400 animate-bounce" />
                    </div>

                    {/* Low note dot (end) */}
                    <div className={`absolute left-[70%] -translate-x-1/2 w-14 h-14 rounded-full transition-all duration-500 flex items-center justify-center ${activeNote === 1 ? 'bg-orange-400 shadow-lg shadow-orange-300/50 scale-125' : 'bg-orange-100 border-2 border-orange-200'
                        }`} style={{ top: `${noteToY(descNotes[1])}%` }}>
                        <span className={`font-black text-sm ${activeNote === 1 ? 'text-white' : 'text-orange-300'}`}>Low</span>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        await playSequence(descNotes);
                        setTimeout(onComplete, 2000);
                    }}
                    disabled={isPlaying}
                    className={`
                        w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300
                        ${isPlaying ? 'bg-orange-100 border-orange-200 text-orange-400' : 'bg-orange-500 border-orange-600 text-white hover:brightness-110 active:scale-95'}
                    `}
                >
                    <Volume2 size={32} />
                </button>
            </div>
        );
    }

    // Choose: direction-quiz
    return (
        <div className="text-center flex flex-col items-center gap-8 w-full relative">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-xl text-slate-500 font-medium animate-slide-up delay-100">소리를 듣고 방향을 골라보세요</p>

            {/* Play button */}
            <button
                onClick={() => playSequence(currentSeq.notes)}
                disabled={isPlaying}
                className={`
                    w-28 h-28 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-300 animate-slide-up delay-200
                    ${isPlaying
                        ? 'bg-orange-100 border-orange-200 text-orange-400 shadow-orange-200 scale-110'
                        : 'bg-orange-500 border-orange-600 text-white hover:brightness-110 active:scale-95'}
                `}
            >
                <Volume2 size={36} />
            </button>
            {!hasPlayed && <p className="text-sm text-orange-400 font-bold animate-pulse -mt-4">눌러서 소리를 들어보세요</p>}

            {/* Direction buttons */}
            {hasPlayed && (
                <div className="flex gap-8 items-center justify-center animate-slide-up">
                    <button
                        onClick={() => {
                            if (feedback) return;
                            setSelected('up');
                            setFeedback(true);
                            setTimeout(onComplete, 1200);
                        }}
                        disabled={feedback}
                        className={`
                            flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 active:scale-95 w-40
                            ${selected === 'up'
                                ? 'bg-emerald-100 border-emerald-400 scale-110 shadow-lg shadow-emerald-200'
                                : feedback
                                    ? 'opacity-50 border-slate-200 bg-white'
                                    : 'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'}
                        `}
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                            <ChevronUp size={40} className="text-emerald-500" />
                        </div>
                        <span className={`font-black text-lg ${selected === 'up' ? 'text-emerald-600' : 'text-emerald-500'
                            }`}>위로</span>
                    </button>

                    <button
                        onClick={() => {
                            if (feedback) return;
                            setSelected('down');
                            setFeedback(true);
                            setTimeout(onComplete, 1200);
                        }}
                        disabled={feedback}
                        className={`
                            flex flex-col items-center gap-3 p-6 rounded-3xl border-4 transition-all duration-300 active:scale-95 w-40
                            ${selected === 'down'
                                ? 'bg-orange-100 border-orange-400 scale-110 shadow-lg shadow-orange-200'
                                : feedback
                                    ? 'opacity-50 border-slate-200 bg-white'
                                    : 'bg-white border-orange-200 hover:border-orange-400 hover:bg-orange-50'}
                        `}
                    >
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                            <ChevronDown size={40} className="text-orange-500" />
                        </div>
                        <span className={`font-black text-lg ${selected === 'down' ? 'text-orange-600' : 'text-orange-500'
                            }`}>아래로</span>
                    </button>
                </div>
            )}

            {/* Gentle feedback */}
            {feedback && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl animate-fade-in pointer-events-none">
                    <div className="px-8 py-4 rounded-2xl shadow-lg bg-orange-500 text-white animate-pop-in">
                        <span className="text-2xl font-black">좋아요!</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// MELODY MODULE 2: 세 음 패턴 만들기
// =============================================
const MELODY_NOTES = [
    { note: 'C4', label: '낮', color: '#EA4335', y: 2 },     // Low
    { note: 'E4', label: '중', color: '#FBBC04', y: 1 },     // Mid
    { note: 'G4', label: '높', color: '#34A853', y: 0 },     // High
];

const PRESET_PATTERNS = [
    { name: '올라가기', pattern: [0, 1, 2], desc: '낮 → 중 → 높' },
    { name: '내려가기', pattern: [2, 1, 0], desc: '높 → 중 → 낮' },
    { name: '산 모양', pattern: [1, 2, 1], desc: '중 → 높 → 중' },
];

const MelodyPatternGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any }> = ({ step, onComplete, synth }) => {
    const [pattern, setPattern] = useState<number[]>([0, 1, 2]); // indices into MELODY_NOTES
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [activeStep, setActiveStep] = useState(-1);
    const loopRef = useRef<NodeJS.Timeout | null>(null);
    const isLoopingRef = useRef(false);

    useEffect(() => {
        return () => {
            if (loopRef.current) clearTimeout(loopRef.current);
        };
    }, []);

    const playPattern = async (loop: boolean = false) => {
        if (isPlaying && !loop) return;
        await Tone.start();

        const playOnce = (onDone: () => void) => {
            setIsPlaying(true);
            let i = 0;
            const interval = setInterval(() => {
                if (i >= pattern.length) {
                    clearInterval(interval);
                    setActiveStep(-1);
                    onDone();
                    return;
                }
                setActiveStep(i);
                synth?.triggerAttackRelease(MELODY_NOTES[pattern[i]].note, '4n');
                i++;
            }, 500);
        };

        if (loop) {
            isLoopingRef.current = true;
            setIsLooping(true);
            const playLoop = () => {
                playOnce(() => {
                    if (isLoopingRef.current) {
                        loopRef.current = setTimeout(playLoop, 300);
                    } else {
                        setIsPlaying(false);
                    }
                });
            };
            playLoop();
        } else {
            playOnce(() => setIsPlaying(false));
        }
    };

    const stopLoop = () => {
        isLoopingRef.current = false;
        setIsLooping(false);
        if (loopRef.current) clearTimeout(loopRef.current);
    };

    const setSlot = (slotIndex: number, noteIndex: number) => {
        stopLoop();
        const newPattern = [...pattern];
        newPattern[slotIndex] = noteIndex;
        setPattern(newPattern);
        // Preview the note
        Tone.start().then(() => {
            synth?.triggerAttackRelease(MELODY_NOTES[noteIndex].note, '8n');
        });
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-[900px] mx-auto px-4 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-lg text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

            {/* Preset buttons */}
            <div className="flex gap-3 animate-slide-up delay-200">
                {PRESET_PATTERNS.map((preset, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            stopLoop();
                            setPattern(preset.pattern);
                        }}
                        className={`
                            px-5 py-3 rounded-xl border-3 font-bold text-sm transition-all active:scale-95
                            ${JSON.stringify(pattern) === JSON.stringify(preset.pattern)
                                ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-md border-4'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 border-4'}
                        `}
                    >
                        <span className="block font-black">{preset.name}</span>
                        <span className="text-xs opacity-70">{preset.desc}</span>
                    </button>
                ))}
            </div>

            {/* Visual: 3-row x 3-col grid representing the melody line */}
            <div className="w-full max-w-md bg-slate-50 rounded-3xl border-2 border-slate-200 p-6 shadow-inner animate-slide-up delay-300">
                <div className="grid grid-cols-[40px_1fr_1fr_1fr] gap-2">
                    {MELODY_NOTES.map((note, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            {/* Row label */}
                            <div className="flex items-center justify-center h-16">
                                <span className="text-sm font-black" style={{ color: note.color }}>{note.label}</span>
                            </div>
                            {/* 3 slots */}
                            {[0, 1, 2].map((colIndex) => {
                                const isSelected = pattern[colIndex] === rowIndex;
                                const isActive = activeStep === colIndex && isSelected;
                                return (
                                    <button
                                        key={colIndex}
                                        onClick={() => setSlot(colIndex, rowIndex)}
                                        className={`
                                            h-16 rounded-xl transition-all duration-150 border-4 relative
                                            ${isSelected
                                                ? `shadow-md ${isActive ? 'scale-110 shadow-lg' : ''}`
                                                : 'bg-white border-slate-200 hover:bg-slate-100'}
                                        `}
                                        style={{
                                            backgroundColor: isSelected ? note.color : undefined,
                                            borderColor: isSelected ? note.color : undefined,
                                        }}
                                    >
                                        {isActive && <div className="absolute inset-0 bg-white/40 rounded-lg animate-ping" />}
                                    </button>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>

                {/* Melody line visualization */}
                <div className="mt-4 flex items-center justify-center gap-1 h-8">
                    {pattern.map((noteIdx, i) => (
                        <React.Fragment key={i}>
                            <div
                                className={`w-5 h-5 rounded-full transition-all duration-300 ${activeStep === i ? 'scale-150 shadow-lg' : ''}`}
                                style={{ backgroundColor: MELODY_NOTES[noteIdx].color }}
                            />
                            {i < pattern.length - 1 && (
                                <div className="w-8 h-[3px] bg-slate-300 rounded-full" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center animate-slide-up delay-400">
                {/* Play once */}
                <button
                    onClick={() => {
                        stopLoop();
                        playPattern(false);
                    }}
                    disabled={isPlaying && !isLooping}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                        ${isPlaying && !isLooping ? 'bg-teal-100 border-teal-200 text-teal-400' : 'bg-teal-500 border-teal-600 text-white active:scale-95 hover:brightness-110'}
                    `}
                >
                    <Play size={28} fill="currentColor" />
                </button>

                {/* Loop toggle */}
                <button
                    onClick={() => {
                        if (isLooping) {
                            stopLoop();
                        } else {
                            playPattern(true);
                        }
                    }}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                        ${isLooping
                            ? 'bg-amber-400 border-amber-500 text-white shadow-amber-200 animate-pulse'
                            : 'bg-white border-slate-300 text-slate-500 active:scale-95 hover:border-amber-400'}
                    `}
                >
                    <Repeat size={24} />
                </button>

                {/* Complete button */}
                <button
                    onClick={() => {
                        stopLoop();
                        onComplete();
                    }}
                    className="px-10 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-lg shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all"
                >
                    다음 레슨
                </button>
            </div>
        </div>
    );
};

// =============================================
// MELODY MODULE 3: 리듬 + 멜로디 연결하기
// =============================================
const RHYTHM_MELODY_NOTES = [
    { note: 'G4', label: '솔', color: '#AA00FF' },
    { note: 'E4', label: '미', color: '#34A853' },
    { note: 'C4', label: '도', color: '#EA4335' },
];

const MelodyRhythmGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any }> = ({ step, onComplete, synth }) => {
    // Grid: 3 rows (notes) x 4 cols (beats)
    const [grid, setGrid] = useState<boolean[][]>(
        Array(3).fill(null).map(() => Array(4).fill(false))
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [activeBeat, setActiveBeat] = useState(-1);
    const gridRef = useRef(grid);
    const loopRef = useRef<NodeJS.Timeout | null>(null);
    const isLoopingRef = useRef(false);

    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    useEffect(() => {
        return () => {
            if (loopRef.current) clearTimeout(loopRef.current);
        };
    }, []);

    const toggleCell = async (row: number, col: number) => {
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = !newGrid[row][col];
        setGrid(newGrid);

        // Preview note
        if (newGrid[row][col]) {
            await Tone.start();
            synth?.triggerAttackRelease(RHYTHM_MELODY_NOTES[row].note, '8n');
        }
    };

    const playGrid = async (loop: boolean = false) => {
        if (isPlaying && !loop) return;
        await Tone.start();

        const playOnce = (onDone: () => void) => {
            setIsPlaying(true);
            let beat = 0;
            const interval = setInterval(() => {
                if (beat >= 4) {
                    clearInterval(interval);
                    setActiveBeat(-1);
                    onDone();
                    return;
                }
                setActiveBeat(beat);
                const currentGrid = gridRef.current;
                for (let row = 0; row < 3; row++) {
                    if (currentGrid[row][beat]) {
                        synth?.triggerAttackRelease(RHYTHM_MELODY_NOTES[row].note, '4n');
                    }
                }
                beat++;
            }, 500);
        };

        if (loop) {
            isLoopingRef.current = true;
            setIsLooping(true);
            const playLoop = () => {
                playOnce(() => {
                    if (isLoopingRef.current) {
                        loopRef.current = setTimeout(playLoop, 300);
                    } else {
                        setIsPlaying(false);
                    }
                });
            };
            playLoop();
        } else {
            playOnce(() => setIsPlaying(false));
        }
    };

    const stopLoop = () => {
        isLoopingRef.current = false;
        setIsLooping(false);
        if (loopRef.current) clearTimeout(loopRef.current);
    };

    const hasNotes = grid.some(row => row.some(cell => cell));

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-[900px] mx-auto px-4 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-lg text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

            {/* Grid */}
            <div className="w-full max-w-lg bg-slate-50 rounded-3xl border-2 border-slate-200 p-6 shadow-inner animate-slide-up delay-200">
                {/* Beat numbers */}
                <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-3 mb-2">
                    <div />
                    {[1, 2, 3, 4].map(beat => (
                        <div key={beat} className={`text-center font-black text-sm transition-all ${activeBeat === beat - 1 ? 'text-blue-500 scale-125' : 'text-slate-400'
                            }`}>
                            {beat}
                        </div>
                    ))}
                </div>

                {/* Note rows */}
                {RHYTHM_MELODY_NOTES.map((note, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-3 mb-3">
                        {/* Note label */}
                        <div className="flex items-center justify-center h-16">
                            <span className="font-black text-sm" style={{ color: note.color }}>{note.label}</span>
                        </div>
                        {/* Beat cells */}
                        {[0, 1, 2, 3].map(colIdx => {
                            const isActive = grid[rowIdx][colIdx];
                            const isCurrent = activeBeat === colIdx;
                            return (
                                <button
                                    key={colIdx}
                                    onClick={() => toggleCell(rowIdx, colIdx)}
                                    className={`
                                        h-16 rounded-xl transition-all duration-100 border-4 relative
                                        ${isActive
                                            ? `shadow-md ${isCurrent ? 'scale-110 shadow-lg' : ''}`
                                            : `bg-white hover:bg-slate-100 ${isCurrent ? 'ring-2 ring-blue-400' : 'border-slate-200'}`}
                                    `}
                                    style={{
                                        backgroundColor: isActive ? note.color : undefined,
                                        borderColor: isActive ? note.color : undefined,
                                    }}
                                >
                                    {isCurrent && isActive && <div className="absolute inset-0 bg-white/40 rounded-lg animate-ping" />}
                                </button>
                            );
                        })}
                    </div>
                ))}

                {/* Beat indicator line */}
                <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-3 mt-1">
                    <div />
                    {[0, 1, 2, 3].map(beat => (
                        <div key={beat} className={`h-2 rounded-full transition-all duration-150 ${activeBeat === beat ? 'bg-blue-500 scale-y-150' : 'bg-slate-200'
                            }`} />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center animate-slide-up delay-300">
                {/* Play once */}
                <button
                    onClick={() => {
                        stopLoop();
                        playGrid(false);
                    }}
                    disabled={(isPlaying && !isLooping) || !hasNotes}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                        ${!hasNotes
                            ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                            : isPlaying && !isLooping
                                ? 'bg-blue-100 border-blue-200 text-blue-400'
                                : 'bg-blue-500 border-blue-600 text-white active:scale-95 hover:brightness-110'}
                    `}
                >
                    <Play size={28} fill="currentColor" />
                </button>

                {/* Loop toggle */}
                <button
                    onClick={() => {
                        if (isLooping) {
                            stopLoop();
                        } else if (hasNotes) {
                            playGrid(true);
                        }
                    }}
                    disabled={!hasNotes}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                        ${!hasNotes
                            ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                            : isLooping
                                ? 'bg-amber-400 border-amber-500 text-white shadow-amber-200 animate-pulse'
                                : 'bg-white border-slate-300 text-slate-500 active:scale-95 hover:border-amber-400'}
                    `}
                >
                    <Repeat size={24} />
                </button>

                {/* Complete button */}
                <button
                    onClick={() => {
                        stopLoop();
                        onComplete();
                    }}
                    className="px-10 py-4 bg-[#58CC02] text-white rounded-2xl font-black text-lg shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none transition-all"
                >
                    다음 레슨
                </button>
            </div>

            <p className="text-slate-400 font-bold text-sm text-center">칸을 눌러 음을 놓고 재생해보세요!</p>
        </div>
    );
};

// =============================================
// MELODY MODULE 4: 코드 위에서 멜로디 만들기
// =============================================
const COMPOSE_CHORDS = [
    { label: 'C', notes: ['C3', 'E3', 'G3'], color: '#7C4DFF' },
    { label: 'F', notes: ['F3', 'A3', 'C4'], color: '#FF7043' },
    { label: 'G', notes: ['G3', 'B3', 'D4'], color: '#26A69A' },
    { label: 'C', notes: ['C3', 'E3', 'G3'], color: '#7C4DFF' },
];

const COMPOSE_SCALE = [
    { note: 'G4', label: '솔', color: '#AA00FF' },
    { note: 'F4', label: '파', color: '#4285F4' },
    { note: 'E4', label: '미', color: '#34A853' },
    { note: 'D4', label: '레', color: '#FBBC04' },
    { note: 'C4', label: '도', color: '#EA4335' },
];

const MelodyOverChordGame: React.FC<{ step: LessonStep, onComplete: () => void, synth: any }> = ({ step, onComplete, synth }) => {
    // Grid: 5 rows (scale notes) x 4 cols (beats/chords)
    const [grid, setGrid] = useState<boolean[][]>(
        Array(5).fill(null).map(() => Array(4).fill(false))
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLooping, setIsLooping] = useState(false);
    const [activeBeat, setActiveBeat] = useState(-1);
    const gridRef = useRef(grid);
    const loopRef = useRef<NodeJS.Timeout | null>(null);
    const isLoopingRef = useRef(false);

    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    useEffect(() => {
        return () => {
            if (loopRef.current) clearTimeout(loopRef.current);
        };
    }, []);

    // Count total notes placed
    const noteCount = grid.reduce((sum, row) => sum + row.filter(Boolean).length, 0);

    // Check if at least one column has a repeated pattern (simple check: any note appears in 2+ columns)
    const hasRepeat = (() => {
        // Check if any two beats have the same active rows
        for (let a = 0; a < 4; a++) {
            for (let b = a + 1; b < 4; b++) {
                const colA = grid.map(row => row[a]);
                const colB = grid.map(row => row[b]);
                if (colA.some(Boolean) && JSON.stringify(colA) === JSON.stringify(colB)) return true;
            }
        }
        return false;
    })();

    const isValid = noteCount >= 3 && noteCount <= 5;

    const toggleCell = async (row: number, col: number) => {
        const newGrid = grid.map(r => [...r]);

        // If turning on, check note limit (max 5)
        if (!newGrid[row][col]) {
            const currentCount = newGrid.reduce((sum, r) => sum + r.filter(Boolean).length, 0);
            if (currentCount >= 5) return; // Don't allow more than 5 notes
        }

        newGrid[row][col] = !newGrid[row][col];
        setGrid(newGrid);

        // Preview note
        if (newGrid[row][col]) {
            await Tone.start();
            synth?.triggerAttackRelease(COMPOSE_SCALE[row].note, '8n');
        }
    };

    const playComposition = async (loop: boolean = false) => {
        if (isPlaying && !loop) return;
        await Tone.start();

        const playOnce = (onDone: () => void) => {
            setIsPlaying(true);
            let beat = 0;
            const interval = setInterval(() => {
                if (beat >= 4) {
                    clearInterval(interval);
                    setActiveBeat(-1);
                    onDone();
                    return;
                }
                setActiveBeat(beat);
                const currentGrid = gridRef.current;

                // Play chord
                synth?.triggerAttackRelease(COMPOSE_CHORDS[beat].notes, '4n');

                // Play melody notes
                for (let row = 0; row < 5; row++) {
                    if (currentGrid[row][beat]) {
                        synth?.triggerAttackRelease(COMPOSE_SCALE[row].note, '4n');
                    }
                }

                beat++;
            }, 700);
        };

        if (loop) {
            isLoopingRef.current = true;
            setIsLooping(true);
            const playLoop = () => {
                playOnce(() => {
                    if (isLoopingRef.current) {
                        loopRef.current = setTimeout(playLoop, 400);
                    } else {
                        setIsPlaying(false);
                    }
                });
            };
            playLoop();
        } else {
            playOnce(() => setIsPlaying(false));
        }
    };

    const stopLoop = () => {
        isLoopingRef.current = false;
        setIsLooping(false);
        if (loopRef.current) clearTimeout(loopRef.current);
    };

    return (
        <div className="flex flex-col items-center gap-5 w-full max-w-[1000px] mx-auto px-4 animate-fade-in">
            <h2 className="text-3xl font-black text-slate-800 animate-slide-up">{step.title}</h2>
            <p className="text-lg text-slate-500 font-medium animate-slide-up delay-100">{step.description}</p>

            {/* Constraints info */}
            <div className="flex gap-3 items-center animate-slide-up delay-150">
                <div className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${noteCount >= 3 && noteCount <= 5 ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                    음: {noteCount}/5
                </div>
                <div className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${hasRepeat ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                    {hasRepeat ? '반복 있음' : '반복 필요'}
                </div>
            </div>

            {/* Grid with chord labels */}
            <div className="w-full max-w-lg bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 shadow-inner animate-slide-up delay-200">
                {/* Chord labels at top */}
                <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-2 mb-3">
                    <div />
                    {COMPOSE_CHORDS.map((chord, idx) => (
                        <div
                            key={idx}
                            className={`text-center py-2 rounded-lg font-black text-sm text-white transition-all ${activeBeat === idx ? 'scale-110 shadow-lg' : ''
                                }`}
                            style={{ backgroundColor: chord.color }}
                        >
                            {chord.label}
                        </div>
                    ))}
                </div>

                {/* Note grid */}
                {COMPOSE_SCALE.map((note, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-2 mb-2">
                        <div className="flex items-center justify-center h-12">
                            <span className="font-black text-xs" style={{ color: note.color }}>{note.label}</span>
                        </div>
                        {[0, 1, 2, 3].map(colIdx => {
                            const isActive = grid[rowIdx][colIdx];
                            const isCurrent = activeBeat === colIdx;
                            return (
                                <button
                                    key={colIdx}
                                    onClick={() => toggleCell(rowIdx, colIdx)}
                                    className={`
                                        h-12 rounded-lg transition-all duration-100 border-3 relative
                                        ${isActive
                                            ? `shadow-md border-transparent ${isCurrent ? 'scale-110 shadow-lg' : ''}`
                                            : `bg-white hover:bg-slate-100 ${isCurrent ? 'ring-2 ring-indigo-400' : 'border-slate-200'}`}
                                    `}
                                    style={{
                                        backgroundColor: isActive ? note.color : undefined,
                                        borderColor: isActive ? note.color : undefined,
                                    }}
                                >
                                    {isCurrent && isActive && <div className="absolute inset-0 bg-white/40 rounded-md animate-ping" />}
                                </button>
                            );
                        })}
                    </div>
                ))}

                {/* Beat indicator */}
                <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-2 mt-2">
                    <div />
                    {[0, 1, 2, 3].map(beat => (
                        <div key={beat} className={`h-2 rounded-full transition-all duration-150 ${activeBeat === beat ? 'bg-indigo-500 scale-y-150' : 'bg-slate-200'
                            }`} />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 items-center animate-slide-up delay-300">
                {/* Play once */}
                <button
                    onClick={() => {
                        stopLoop();
                        playComposition(false);
                    }}
                    disabled={(isPlaying && !isLooping) || noteCount === 0}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                        ${noteCount === 0
                            ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                            : isPlaying && !isLooping
                                ? 'bg-rose-100 border-rose-200 text-rose-400'
                                : 'bg-rose-500 border-rose-600 text-white active:scale-95 hover:brightness-110'}
                    `}
                >
                    <Play size={28} fill="currentColor" />
                </button>

                {/* Loop toggle */}
                <button
                    onClick={() => {
                        if (isLooping) {
                            stopLoop();
                        } else if (noteCount > 0) {
                            playComposition(true);
                        }
                    }}
                    disabled={noteCount === 0}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 transition-all
                        ${noteCount === 0
                            ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                            : isLooping
                                ? 'bg-amber-400 border-amber-500 text-white shadow-amber-200 animate-pulse'
                                : 'bg-white border-slate-300 text-slate-500 active:scale-95 hover:border-amber-400'}
                    `}
                >
                    <Repeat size={24} />
                </button>

                {/* Complete button */}
                <button
                    onClick={() => {
                        stopLoop();
                        onComplete();
                    }}
                    disabled={!isValid}
                    className={`
                        px-10 py-4 rounded-2xl font-black text-lg transition-all
                        ${isValid
                            ? 'bg-[#58CC02] text-white shadow-[0_6px_0_rgba(74,171,2,1)] hover:brightness-110 active:translate-y-[6px] active:shadow-none'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                    `}
                >
                    레슨 완료
                </button>
            </div>

            <p className="text-slate-400 font-bold text-sm text-center">
                {noteCount === 0 ? '칸을 눌러 멜로디를 만들어보세요!' : !isValid ? `음을 ${noteCount < 3 ? '더 놓아주세요' : '줄여주세요'}` : hasRepeat ? '멋진 멜로디! 재생하거나 완료하세요' : '반복 패턴을 만들어보세요 (같은 위치에 놓기)'}
            </p>
        </div>
    );
};