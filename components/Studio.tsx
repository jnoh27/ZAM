import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Circle, Square, Triangle, Zap, Plus, RotateCcw, Download, Disc } from 'lucide-react';
import { audioService } from '../services/audio';
import { CHORDS_C_MAJOR, TOTAL_STEPS, DEFAULT_PROGRESSION } from '../constants';
import { Chord, Progression, Melody, BeatGrid, NoteMode } from '../types';
import { PianoRoll } from './PianoRoll';

interface StudioProps { }

const ROWS_CONFIG = [
  { id: 'kick', color: '#EA4335', icon: <Circle size={32} fill="currentColor" strokeWidth={0} /> },
  { id: 'snare', color: '#FBBC04', icon: <Square size={28} fill="currentColor" strokeWidth={0} /> },
  { id: 'hihat', color: '#34A853', icon: <Triangle size={32} fill="currentColor" strokeWidth={0} /> },
  { id: 'clap', color: '#4285F4', icon: <Zap size={32} fill="currentColor" strokeWidth={0} /> },
];

const COLORS = ['#EA4335', '#FBBC04', '#34A853', '#4285F4', '#FF7043', '#AB47BC', '#00ACC1'];

export const Studio: React.FC<StudioProps> = () => {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playbackStep, setPlaybackStep] = useState(-1);
  const [noteMode, setNoteMode] = useState<NoteMode>('chord');

  // Tracks State
  const [beatGrid, setBeatGrid] = useState<BeatGrid>(
    Array(4).fill(null).map(() => Array(16).fill(false))
  );
  const [progression, setProgression] = useState<(Chord | null)[]>([null, null, null, null]);
  const [melody, setMelody] = useState<Melody>(Array(TOTAL_STEPS).fill(null));

  // Chords UI state
  const [activeChordSlot, setActiveChordSlot] = useState<number | null>(null);

  // Initialize and Sync Audio Service
  useEffect(() => {
    audioService.setStepCallback((step) => setPlaybackStep(step));
  }, []);

  useEffect(() => { audioService.updateBeats(beatGrid); }, [beatGrid]);
  useEffect(() => { 
    // Fill nulls with default or silence if needed, though audioService handles null chords gracefully
    audioService.updateProgression(progression as Progression); 
  }, [progression]);
  useEffect(() => { audioService.updateMelody(melody); }, [melody]);

  const handlePlayPause = async () => {
    await audioService.init();
    if (isPlaying) { audioService.pause(); setIsPlaying(false); }
    else { audioService.play(); setIsPlaying(true); }
  };

  const handleStop = () => {
    audioService.stop();
    setIsPlaying(false);
    setPlaybackStep(-1);
  };

  const toggleBeat = async (row: number, col: number) => {
    const newGrid = [...beatGrid];
    newGrid[row] = [...newGrid[row]];
    newGrid[row][col] = !newGrid[row][col];
    setBeatGrid(newGrid);

    // Preview the drum sound when placing a beat
    if (newGrid[row][col]) {
      audioService.previewDrum(row);
    }
  };

  const currentBar = Math.floor(playbackStep / 8);

  const renderRhythmArea = () => (
    <div className="flex flex-col flex-1 p-4 md:p-8 justify-center gap-4 animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-[#111] mb-2">1. 리듬 만들기</h2>
        <p className="text-[#666]">16비트 드럼 머신으로 신나는 비트를 찍어보세요.</p>
      </div>

      <div className="flex flex-col gap-4 overflow-x-auto pb-4 max-w-5xl mx-auto w-full">
        {ROWS_CONFIG.map((row, rowIndex) => (
          <div key={row.id} className="flex items-center gap-4 w-full min-w-[600px]">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: row.color }}>
              {row.icon}
            </div>
            <div className="flex-1 flex gap-1.5 h-14">
              {beatGrid[rowIndex].map((active, colIndex) => {
                const isPulse = (playbackStep % 16) === colIndex;
                const isBigBeat = colIndex % 4 === 0;

                return (
                  <button
                    key={colIndex}
                    onClick={() => toggleBeat(rowIndex, colIndex)}
                    className={`
                      flex-1 rounded-lg transition-all duration-100 border-b-[3px]
                      ${active ? '' : 'bg-white border-[#E0E0E0] hover:bg-[#F1F3F4]'}
                      ${isPulse && isPlaying ? 'ring-2 ring-inset ring-indigo-400' : ''}
                      ${isBigBeat && !active ? 'bg-[#EEEEEE]' : ''}
                    `}
                    style={{ backgroundColor: active ? row.color : undefined, borderColor: active ? 'rgba(0,0,0,0.15)' : undefined }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleChordSelect = (chord: Chord) => {
    if (activeChordSlot === null) return;
    const newProg = [...progression];
    newProg[activeChordSlot] = chord;
    setProgression(newProg);
    setActiveChordSlot(null);
  };

  const renderChordArea = () => (
    <div className="flex flex-col flex-1 overflow-hidden animate-slide-up">
      {/* Top: title + cards */}
      <div className={`flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-300 ${activeChordSlot !== null ? 'flex-[0_0_auto]' : 'flex-1'}`}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-[#111] mb-2">2. 화음 만들기</h2>
          <p className="text-[#666]">비트와 어울리는 4개의 화음을 골라주세요.</p>
        </div>

        <div className="w-full max-w-4xl mx-auto grid grid-cols-4 gap-4 md:gap-8">
          {progression.map((chord, index) => {
            const isActive = currentBar === index && isPlaying;
            const isSelected = activeChordSlot === index;

            return (
              <button
                key={index}
                onClick={() => setActiveChordSlot(index)}
                className={`
                  aspect-[3/4] rounded-3xl flex flex-col items-center justify-center gap-2 transition-all duration-200 border-b-8
                  ${chord ? 'bg-white' : 'bg-[#E8EAED] border-[#DADCE0] text-[#BDC1C6]'}
                  ${isSelected ? 'ring-4 ring-indigo-400 scale-105 z-10' : ''}
                  ${isActive ? 'brightness-95 translate-y-2 border-b-0' : ''}
                `}
                style={chord ? { borderColor: isActive ? 'transparent' : '#DADCE0' } : {}}
              >
                {chord ? (
                  <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl"
                      style={{ backgroundColor: COLORS[CHORDS_C_MAJOR.findIndex(c => c.id === chord.id) % COLORS.length] }}>
                      {chord.roman}
                    </div>
                    <span className="text-2xl font-black text-[#202124]">{chord.name}</span>
                    <span className="text-sm font-bold text-[#5F6368]">{chord.mood}</span>
                  </>
                ) : (
                  <Plus size={48} strokeWidth={4} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Chord Palette - slides up from bottom */}
      <div className={`
        bg-[#F8F9FA] border-t border-gray-200 transition-all duration-300 overflow-hidden
        ${activeChordSlot !== null ? 'max-h-[300px] p-6 md:p-8' : 'max-h-0 p-0'}
      `}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-[#202124]">화음을 골라주세요</h2>
            <button onClick={() => setActiveChordSlot(null)} className="px-6 py-2 bg-[#E8EAED] rounded-full font-bold text-[#5F6368]">닫기</button>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
            {CHORDS_C_MAJOR.map((chord, idx) => (
              <button key={chord.id} onClick={() => handleChordSelect(chord)}
                className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                <span className="text-white font-black text-xl">{chord.name.split(' ')[0]}</span>
                <span className="text-white/80 font-bold text-xs">{chord.mood}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMelodyArea = () => (
    <div className="flex flex-col flex-1 p-4 md:p-8 animate-slide-up h-full overflow-hidden w-full">
      <div className="flex justify-between items-center mb-6 shrink-0 w-full">
        <div>
          <h2 className="text-3xl font-black text-[#111] mb-2">3. 멜로디 만들기</h2>
          <p className="text-[#666]">피아노 롤에 노트를 그려 나만의 선율을 완성하세요.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white shadow-sm border border-gray-200 rounded-full p-1.5 gap-1">
             <button 
               onClick={() => setNoteMode('chord')}
               className={`px-5 py-2.5 rounded-full font-black text-sm transition-all duration-200 ${noteMode === 'chord' ? 'bg-[#4285F4] text-white shadow-sm' : 'text-[#5F6368] hover:bg-gray-100'}`}
             >
               쉬운 음
             </button>
             <button 
               onClick={() => setNoteMode('scale')}
               className={`px-5 py-2.5 rounded-full font-black text-sm transition-all duration-200 ${noteMode === 'scale' ? 'bg-[#4285F4] text-white shadow-sm' : 'text-[#5F6368] hover:bg-gray-100'}`}
             >
               보통 음
             </button>
             <button 
               onClick={() => setNoteMode('chromatic')}
               className={`px-5 py-2.5 rounded-full font-black text-sm transition-all duration-200 ${noteMode === 'chromatic' ? 'bg-[#4285F4] text-white shadow-sm' : 'text-[#5F6368] hover:bg-gray-100'}`}
             >
               모든 음
             </button>
          </div>
          <button 
            onClick={() => setMelody(Array(TOTAL_STEPS).fill(null))} 
            className="w-12 h-12 flex items-center justify-center bg-[#E8EAED] rounded-full text-[#EA4335] shadow-sm hover:bg-[#DADCE0] transition-all active:scale-90"
          >
            <RotateCcw size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border-b-4 border-[#DADCE0] overflow-hidden flex flex-col flex-1 min-h-0 relative z-10 w-full max-w-none mx-auto">
        <PianoRoll
          progression={progression.map(c => c || CHORDS_C_MAJOR[0]) as Progression}
          melody={melody}
          currentStep={playbackStep}
          onSetMelody={setMelody}
          noteMode={noteMode}
        />
      </div>
    </div>
  );

  const renderMixerArea = () => (
    <div className="flex flex-col flex-1 p-8 justify-center items-center animate-slide-up relative overflow-hidden bg-transparent">
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {isPlaying && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-100 via-transparent to-transparent animate-pulse" />}
      </div>

      <div className="text-center mb-16 relative z-10">
        <h2 className="text-5xl font-extrabold text-[#111111] mb-4 tracking-tight drop-shadow-sm">트랙 완성!</h2>
        <p className="text-[#666666] text-lg font-medium">지금까지 만든 모든 트랙 요소들이 합쳐졌어요.</p>
      </div>

      {/* Download Section */}
      <div className="relative z-10 flex flex-col items-center gap-6 mt-4">
        <button
          onClick={async () => {
            if (isRecording) return;
            setIsRecording(true);
            const url = await audioService.recordTrack();
            setIsRecording(false);
            if (url) {
                const a = document.createElement("a");
                a.href = url;
                a.download = "my-zam-track.webm";
                a.click();
            }
          }}
          disabled={isRecording}
          className={`
            w-64 h-64 rounded-[40px] flex flex-col justify-center items-center gap-4 font-extrabold text-[22px] text-white transition-all duration-300
            ${isRecording ? 'bg-rose-500 scale-95 shadow-none animate-pulse cursor-wait' : 'bg-[#9D71E8] hover:bg-[#aa84ec] shadow-[0_15px_40px_-5px_rgba(157,113,232,0.5),0_10px_0_rgba(126,87,194,1)] hover:translate-y-[2px] hover:shadow-[0_15px_40px_-5px_rgba(157,113,232,0.5),0_8px_0_rgba(126,87,194,1)] active:translate-y-[10px] active:shadow-none'}
          `}
        >
          {isRecording ? (
            <>
              <Disc size={64} className="animate-spin mb-2" /> 
              레코딩 중...
            </>
          ) : (
            <>
              <Download size={64} strokeWidth={2.5} className="mb-2" /> 
              트랙 다운로드
            </>
          )}
        </button>
        {isRecording && <p className="text-rose-500 font-bold bg-rose-50 border border-rose-100 px-6 py-3 rounded-full animate-bounce mt-4 shadow-sm">오디오가 백그라운드에서 녹음되고 있습니다... (약 8초 소요)</p>}
      </div>
    </div>
  );

  return (
    <div className="w-full flex-1 flex flex-col bg-white">
      
      {/* Studio Header / Progress */}
      <header className="px-6 py-4 border-b flex items-center justify-center shrink-0 z-50 transition-colors bg-white border-gray-100">
        {/* Progress Pills */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setWizardStep(step as any)}
              className={`
                h-2 w-12 md:w-16 rounded-full transition-all duration-300
                ${wizardStep === step ? 'bg-[#9D71E8] scale-y-150' : 'bg-gray-200 hover:bg-gray-300'}
              `}
            />
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {wizardStep === 1 && renderRhythmArea()}
        {wizardStep === 2 && renderChordArea()}
        {wizardStep === 3 && renderMelodyArea()}
        {wizardStep === 4 && renderMixerArea()}
      </div>

      {/* Universal Control Bar */}
      <div className="p-4 md:p-6 border-t shrink-0 flex items-center justify-between z-40 bg-white border-gray-100 relative">
        
        {/* Prev Step */}
        <button
          onClick={() => setWizardStep(Math.max(1, wizardStep - 1) as any)}
          disabled={wizardStep === 1}
          className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${wizardStep === 1 ? 'opacity-0 pointer-events-none' : 'text-[#5F6368] bg-[#E8EAED] shadow-[0_4px_0_rgba(189,193,198,1)] hover:translate-y-[1px] hover:shadow-[0_3px_0_rgba(189,193,198,1)] active:translate-y-[4px] active:shadow-none'}`}
        >
          <ArrowLeft size={20} />
          이전
        </button>

        {/* Play Button */}
        <button
          onClick={handlePlayPause}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center text-white transition-all active:scale-90 absolute left-1/2 -translate-x-1/2 -top-10
            ${isPlaying ? 'bg-[#EA4335]' : 'bg-[#4285F4]'}
          `}
        >
          {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
        </button>

        {/* Next Step */}
        <button
          onClick={() => {
            if (wizardStep < 4) setWizardStep((wizardStep + 1) as any);
            else { handleStop(); /* maybe stop or export? */ }
          }}
          className={`px-10 py-3 rounded-full font-bold text-white transition-all
            ${wizardStep === 4 
              ? 'bg-emerald-500 shadow-[0_4px_0_rgba(16,185,129,1)] hover:translate-y-[1px] hover:shadow-[0_3px_0_rgba(16,185,129,1)] active:translate-y-[4px] active:shadow-none' 
              : 'bg-[#9D71E8] shadow-[0_4px_0_rgba(126,87,194,1)] hover:translate-y-[1px] hover:shadow-[0_3px_0_rgba(126,87,194,1)] active:translate-y-[4px] active:shadow-none'}`}
        >
          {wizardStep === 4 ? '처음으로' : '다음'}
        </button>
      </div>

    </div>
  );
};
