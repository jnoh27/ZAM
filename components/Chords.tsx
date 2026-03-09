import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { ArrowLeft } from 'lucide-react';

interface ChordsProps {
    onBack: () => void;
}

const NOTES_LIST = [
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
    'C5'
];

export const Chords: React.FC<ChordsProps> = ({ onBack }) => {
    const [isMinor, setIsMinor] = useState(false);
    const [activeNotes, setActiveNotes] = useState<string[]>([]);
    const synthRef = useRef<Tone.Sampler | null>(null);
    const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => {
        // Clear transport
        Tone.Transport.cancel();

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
            }
        }).connect(reverb);
        synth.volume.value = -3;

        return () => {
            synth.dispose();
            reverb.dispose();
            Tone.Transport.stop();
            Tone.Transport.cancel();
            clearTimeouts();
        };
    }, []);

    const clearTimeouts = () => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
        if (synthRef.current) {
            synthRef.current.releaseAll();
        }
    };

    const playChord = async (rootNote: string) => {
        if (!synthRef.current) return;

        await Tone.start();
        if (Tone.context.state !== 'running') {
            await Tone.context.resume();
        }

        clearTimeouts();

        const rootMidi = Tone.Frequency(rootNote).toMidi();

        // Major: +4, +7
        // Minor: +3, +7
        const thirdOffset = isMinor ? 3 : 4;
        const fifthOffset = 7;

        const chordNotes = [
            rootNote,
            Tone.Frequency(rootMidi + thirdOffset, "midi").toNote(),
            Tone.Frequency(rootMidi + fifthOffset, "midi").toNote()
        ];

        // CML adds the octave up root as well for the arpeggio
        const arpNotes = [...chordNotes, Tone.Frequency(rootMidi + 12, "midi").toNote()];

        setActiveNotes(chordNotes);

        const now = Tone.now();

        // Strum chord quickly
        chordNotes.forEach((note, i) => {
            synthRef.current?.triggerAttackRelease(note, "2n", now + i * 0.05);
        });

        // Arpeggiate
        const delayBetweenNotes = 0.2;
        arpNotes.forEach((note, i) => {
            const time = now + 0.3 + (i * delayBetweenNotes);
            synthRef.current?.triggerAttackRelease(note, "8n", time);

            const t = setTimeout(() => {
                setActiveNotes([note]);
            }, (time - Tone.now()) * 1000);
            timeoutsRef.current.push(t);
        });

        // Clear active notes after arpeggio finishes
        const tEnd = setTimeout(() => {
            setActiveNotes([]);
        }, (0.3 + arpNotes.length * delayBetweenNotes) * 1000);
        timeoutsRef.current.push(tEnd);
    };

    const renderPianoKeys = () => {
        // Find natural notes to determine exact width percentages
        const naturals = NOTES_LIST.filter(n => !n.includes('#'));
        const keyWidth = 100 / naturals.length;

        let naturalIndex = 0;

        return NOTES_LIST.map((note) => {
            const isBlack = note.includes('#');
            const isActive = activeNotes.includes(note);

            if (!isBlack) {
                const leftPos = naturalIndex * keyWidth;
                naturalIndex++;

                return (
                    <div
                        key={note}
                        onPointerDown={(e) => {
                            e.preventDefault();
                            playChord(note);
                        }}
                        className={`
                            absolute bottom-0 h-full border-r border-[#E0E0E0] cursor-pointer shadow-sm
                            transition-colors duration-100 flex flex-col justify-end items-center pb-8
                            ${isActive ? 'bg-[#FFB729]' : 'bg-white hover:bg-slate-50'}
                        `}
                        style={{ left: `${leftPos}%`, width: `${keyWidth}%` }}
                    >
                        <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                            {note.replace(/\d/, '')}
                        </span>
                    </div>
                );
            } else {
                // Black key position is centered over the crack between previous natural and next natural
                const prevNaturalLeft = (naturalIndex - 1) * keyWidth;

                // Usually black keys are slightly thinner
                const blackKeyWidth = keyWidth * 0.6;
                const leftPos = prevNaturalLeft + keyWidth - (blackKeyWidth / 2);

                return (
                    <div
                        key={note}
                        onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            playChord(note);
                        }}
                        className={`
                            absolute top-0 h-[60%] rounded-b-lg cursor-pointer shadow-md z-10
                            transition-colors duration-100
                            ${isActive ? 'bg-[#FFB729]' : 'bg-[#212121] hover:bg-[#333]'}
                        `}
                        style={{ left: `${leftPos}%`, width: `${blackKeyWidth}%` }}
                    />
                );
            }
        });
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#F8F9FA]">
            <header className="p-4 border-b flex items-center justify-between bg-white z-20 shadow-sm relative">
                <button onClick={() => { Tone.Transport.stop(); onBack(); }} className="p-3 bg-[#E8EAED] rounded-full hover:bg-slate-200 transition-colors">
                    <ArrowLeft size={32} strokeWidth={3} className="text-[#5F6368]" />
                </button>
                <h1 className="text-3xl font-black text-[#202124]">화음 연주</h1>
                <div className="w-12"></div>
            </header>

            <div className="flex-1 flex flex-col pt-8 pb-12 items-center flex-shrink-0 relative z-10 bg-gradient-to-b from-white to-[#F8F9FA]">
                {/* Mode Toggle */}
                <div className="flex bg-[#E8EAED] p-2 rounded-full gap-2 mb-10 shadow-inner">
                    <button
                        className={`px-8 py-4 rounded-full font-black text-xl transition-all duration-300 ${!isMinor ? 'bg-white text-[#212121] shadow-md scale-105' : 'text-[#80868B] hover:text-[#212121]'}`}
                        onClick={() => setIsMinor(false)}
                    >
                        장조 (Major)
                    </button>
                    <button
                        className={`px-8 py-4 rounded-full font-black text-xl transition-all duration-300 ${isMinor ? 'bg-white text-[#212121] shadow-md scale-105' : 'text-[#80868B] hover:text-[#212121]'}`}
                        onClick={() => setIsMinor(true)}
                    >
                        단조 (Minor)
                    </button>
                </div>
            </div>

            {/* Piano Keyboard Area */}
            <div className="h-[45vh] w-full relative bg-[#212121] border-t-8 border-[#212121] select-none touch-none">
                {renderPianoKeys()}
            </div>
        </div>
    );
};
