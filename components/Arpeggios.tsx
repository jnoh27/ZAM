import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

interface ArpeggiosProps {
    onBack: () => void;
}

const CIRCLE_OF_FIFTHS = [
    { note: 'C', major: ['C4', 'E4', 'G4', 'C5'], minor: ['C4', 'Eb4', 'G4', 'C5'] },
    { note: 'G', major: ['G3', 'B3', 'D4', 'G4'], minor: ['G3', 'Bb3', 'D4', 'G4'] },
    { note: 'D', major: ['D3', 'F#3', 'A3', 'D4'], minor: ['D3', 'F3', 'A3', 'D4'] },
    { note: 'A', major: ['A3', 'C#4', 'E4', 'A4'], minor: ['A3', 'C4', 'E4', 'A4'] },
    { note: 'E', major: ['E3', 'G#3', 'B3', 'E4'], minor: ['E3', 'G3', 'B3', 'E4'] },
    { note: 'B', major: ['B3', 'D#4', 'F#4', 'B4'], minor: ['B3', 'D4', 'F#4', 'B4'] },
    { note: 'Gb', major: ['Gb3', 'Bb3', 'Db4', 'Gb4'], minor: ['Gb3', 'A3', 'Db4', 'Gb4'] }, // simplified Gb minor
    { note: 'Db', major: ['Db4', 'F4', 'Ab4', 'Db5'], minor: ['Db4', 'E4', 'Ab4', 'Db5'] }, // simplified Db minor
    { note: 'Ab', major: ['Ab3', 'C4', 'Eb4', 'Ab4'], minor: ['Ab3', 'B3', 'Eb4', 'Ab4'] }, // simplified Ab minor
    { note: 'Eb', major: ['Eb3', 'G3', 'Bb3', 'Eb4'], minor: ['Eb3', 'Gb3', 'Bb3', 'Eb4'] },
    { note: 'Bb', major: ['Bb3', 'D4', 'F4', 'Bb4'], minor: ['Bb3', 'Db4', 'F4', 'Bb4'] },
    { note: 'F', major: ['F3', 'A3', 'C4', 'F4'], minor: ['F3', 'Ab3', 'C4', 'F4'] },
];

const PATTERNS = [
    { id: 'up', name: '올라가기', render: (len: number) => Array.from({ length: len }, (_, i) => i) },
    { id: 'down', name: '내려가기', render: (len: number) => Array.from({ length: len }, (_, i) => len - 1 - i) },
    {
        id: 'updown', name: '왔다갔다', render: (len: number) => {
            const arr = [];
            for (let i = 0; i < len; i++) arr.push(i);
            for (let i = len - 2; i > 0; i--) arr.push(i);
            return arr;
        }
    },
    { id: 'random', name: '무작위', render: (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * len)) },
];

export const Arpeggios: React.FC<ArpeggiosProps> = ({ onBack }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0); // 0-11 for Circle of Fifths
    const [isMinor, setIsMinor] = useState(false);
    const [patternIndex, setPatternIndex] = useState(0);
    const [activeNoteIndex, setActiveNoteIndex] = useState(-1);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const synthRef = useRef<Tone.Sampler | null>(null);
    const sequenceRef = useRef<Tone.Sequence | null>(null);

    const currentChordObj = CIRCLE_OF_FIFTHS[activeIndex];
    const currentNotes = isMinor ? currentChordObj.minor : currentChordObj.major;
    const currentPattern = PATTERNS[patternIndex];

    const notesRef = useRef<string[]>(currentNotes);
    const patternRef = useRef(currentPattern);

    useEffect(() => {
        notesRef.current = currentNotes;
        patternRef.current = currentPattern;
        // Regenerate pattern indexing if needed, but the callback can do it
    }, [currentNotes, currentPattern]);

    // Initialize Audio
    useEffect(() => {
        // Clear transport
        Tone.Transport.cancel();
        Tone.Transport.seconds = 0;

        const reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();

        const synth = new Tone.Sampler({
            urls: {
                "A3": "A3.mp3",
                "A4": "A4.mp3",
                "A5": "A5.mp3",
                "C4": "C4.mp3",
                "C5": "C5.mp3"
            },
            baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
            onload: () => {
                synthRef.current = synth;
                setIsLoaded(true);
            }
        }).connect(reverb);
        synth.volume.value = -5;

        // Persistent Sequence
        const sequence = new Tone.Sequence((time, index) => {
            const currentNotesArr = notesRef.current;
            const patternObj = patternRef.current;
            const fullPattern = patternObj.render(currentNotesArr.length);

            const noteIdx = fullPattern[index % fullPattern.length];
            const note = currentNotesArr[noteIdx];

            if (synthRef.current) {
                synthRef.current.triggerAttackRelease(note, "8n", time);
            }

            Tone.Draw.schedule(() => {
                setActiveNoteIndex(noteIdx);
            }, time);

        }, Array.from({ length: 12 }, (_, i) => i), "8n");

        sequenceRef.current = sequence;

        return () => {
            synth.dispose();
            reverb.dispose();
            sequence.dispose();
            Tone.Transport.stop();
            Tone.Transport.cancel();
        };
    }, []);

    // Playback state control
    useEffect(() => {
        if (isPlaying && sequenceRef.current) {
            Tone.Transport.start();
            sequenceRef.current.start(0);
        } else {
            Tone.Transport.stop();
            sequenceRef.current?.stop();
        }
    }, [isPlaying]);

    const handlePlayToggle = async () => {
        await Tone.start();
        if (Tone.context.state !== 'running') {
            await Tone.context.resume();
        }

        if (isPlaying) {
            setIsPlaying(false);
            setActiveNoteIndex(-1);
        } else {
            setIsPlaying(true);
        }
    };

    const changePattern = (delta: number) => {
        let next = patternIndex + delta;
        if (next >= PATTERNS.length) next = 0;
        if (next < 0) next = PATTERNS.length - 1;
        setPatternIndex(next);
    };

    const handleSegmentClick = async (index: number, minor: boolean) => {
        await Tone.start();
        if (Tone.context.state !== 'running') {
            await Tone.context.resume();
        }

        setActiveIndex(index);
        setIsMinor(minor);

        // Preview chord if not playing
        if (!isPlaying && synthRef.current) {
            const notes = minor ? CIRCLE_OF_FIFTHS[index].minor : CIRCLE_OF_FIFTHS[index].major;
            synthRef.current.releaseAll();
            synthRef.current.triggerAttackRelease(notes, "4n");
        }
    };

    // Render Wheel Segments
    const renderSegments = (isMinorRing: boolean) => {
        return CIRCLE_OF_FIFTHS.map((chord, i) => {
            const angleStep = 360 / 12;
            const startAngle = i * angleStep;
            const endAngle = (i + 1) * angleStep;

            // Adjust angles for SVG arc (starting at top)
            const adjustAngle = (deg: number) => (deg - 90) * (Math.PI / 180);

            const outerRadius = isMinorRing ? 130 : 200;
            const innerRadius = isMinorRing ? 80 : 135;

            const x1 = 200 + outerRadius * Math.cos(adjustAngle(startAngle));
            const y1 = 200 + outerRadius * Math.sin(adjustAngle(startAngle));
            const x2 = 200 + outerRadius * Math.cos(adjustAngle(endAngle));
            const y2 = 200 + outerRadius * Math.sin(adjustAngle(endAngle));

            const x3 = 200 + innerRadius * Math.cos(adjustAngle(endAngle));
            const y3 = 200 + innerRadius * Math.sin(adjustAngle(endAngle));
            const x4 = 200 + innerRadius * Math.cos(adjustAngle(startAngle));
            const y4 = 200 + innerRadius * Math.sin(adjustAngle(startAngle));

            const isSelected = activeIndex === i && isMinor === isMinorRing;

            // HSL color based on index
            const hue = (i * 30);
            const lightness = isMinorRing ? 40 : 55;
            const baseColor = `hsl(${hue}, 80%, ${lightness}%)`;

            const textRadius = innerRadius + (outerRadius - innerRadius) / 2;
            const textAngle = startAngle + angleStep / 2;
            const textX = 200 + textRadius * Math.cos(adjustAngle(textAngle));
            const textY = 200 + textRadius * Math.sin(adjustAngle(textAngle));

            const d = `
                M ${x1} ${y1}
                A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2}
                L ${x3} ${y3}
                A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4}
                Z
            `;

            return (
                <g key={`${chord.note}-${isMinorRing ? 'minor' : 'major'}`} onClick={() => handleSegmentClick(i, isMinorRing)} className="cursor-pointer transition-transform duration-200" style={{ transformOrigin: '200px 200px', transform: isSelected ? 'scale(1.03)' : 'scale(1)' }}>
                    <path
                        d={d}
                        fill={isSelected ? baseColor : `hsl(${hue}, 40%, ${isMinorRing ? 20 : 30}%)`}
                        stroke="#212121"
                        strokeWidth="2"
                        className="transition-colors duration-200 hover:brightness-125"
                    />
                    <text
                        x={textX}
                        y={textY}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={isMinorRing ? "14" : "18"}
                        fontWeight="bold"
                        className="pointer-events-none"
                    >
                        {chord.note}{isMinorRing ? 'm' : ''}
                    </text>
                </g>
            );
        });
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#212121] relative overflow-hidden">
            {!isLoaded && (
                <div className="absolute inset-0 bg-[#212121]/90 flex flex-col items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="w-16 h-16 border-4 border-[#EA4335] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-white text-xl font-bold animate-pulse">악기 로딩 중...</div>
                </div>
            )}
            
            {isLoaded && !hasStarted && (
                <div className="absolute inset-0 bg-[#212121]/90 flex flex-col items-center justify-center z-[90] backdrop-blur-sm">
                    <button 
                        onClick={async () => {
                            await Tone.start();
                            if (Tone.context.state !== 'running') await Tone.context.resume();
                            setHasStarted(true);
                        }}
                        className="px-8 py-4 bg-[#EA4335] hover:bg-rose-600 text-white rounded-full font-black text-2xl shadow-[0_8px_0_rgba(185,28,28,1)] hover:translate-y-[2px] hover:shadow-[0_6px_0_rgba(185,28,28,1)] active:translate-y-[8px] active:shadow-none transition-all"
                    >
                        시작하기
                    </button>
                    <div className="text-white/60 font-bold mt-6">화면을 탭하여 오디오를 활성화하세요</div>
                </div>
            )}

            <header className="p-4 border-b-2 border-white/10 flex items-center justify-between z-10">
                <button onClick={() => { Tone.Transport.stop(); onBack(); }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
                    <ArrowLeft size={32} strokeWidth={3} />
                </button>
                <h1 className="text-3xl font-black text-white tracking-tight">아르페지오</h1>
                <div className="w-12"></div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-8">

                {/* Active Notes Visualization (Harp strings or similar) */}
                <div className="flex justify-center items-end h-32 gap-4 w-full max-w-md">
                    {currentNotes.map((note, idx) => {
                        const isActive = activeNoteIndex === idx && isPlaying;
                        const hue = activeIndex * 30;
                        const color = `hsl(${hue}, 80%, ${isMinor ? 40 : 55}%)`;

                        return (
                            <div key={idx} className="flex flex-col justify-end items-center h-full w-12 gap-2">
                                <div className="text-white/60 font-bold text-sm">{note.replace(/\d/, '')}</div>
                                <div
                                    className="w-full rounded-t-xl transition-all duration-100"
                                    style={{
                                        height: isActive ? '100%' : '60%',
                                        backgroundColor: isActive ? color : 'rgba(255,255,255,0.1)',
                                        boxShadow: isActive ? `0 0 20px ${color}` : 'none'
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>

                {/* Main Chord Wheel */}
                <div className="relative w-[400px] h-[400px]">
                    <svg width="400" height="400" className="drop-shadow-2xl">
                        {/* Outer Ring - Major Chords */}
                        {renderSegments(false)}

                        {/* Inner Ring - Minor Chords */}
                        {renderSegments(true)}
                    </svg>

                    {/* Central Play Button */}
                    <button
                        onClick={handlePlayToggle}
                        className={`
                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-32 h-32 rounded-full flex items-center justify-center z-20 shadow-2xl transition-transform active:scale-95 border-4 border-[#212121]
                    ${isPlaying ? 'bg-white text-[#212121]' : 'bg-[#EA4335] text-white'}
                        `}
                    >
                        {isPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                    </button>
                </div>

                {/* Pattern Selector */}
                <div className="w-full max-w-sm flex items-center justify-between gap-4 mt-4">
                    <button
                        onClick={() => changePattern(-1)}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-colors"
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <div className="flex-1 text-center bg-white/5 py-3 rounded-2xl border border-white/10">
                        <div className="text-xl font-black text-white">
                            {currentPattern.name}
                        </div>
                    </div>

                    <button
                        onClick={() => changePattern(1)}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-colors"
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>
        </div >
    );
};