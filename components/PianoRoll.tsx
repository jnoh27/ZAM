import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Progression, Melody, NoteMode } from '../types';
import { PITCH_ROWS, STEPS_PER_BAR, TOTAL_STEPS, SUSTAIN_TOKEN, SCALE_NOTES } from '../constants';
import { audioService } from '../services/audio';

interface PianoRollProps {
  progression: Progression;
  melody: Melody;
  currentStep: number;
  onSetMelody: (melody: Melody) => void;
  noteMode: NoteMode;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  progression,
  melody,
  currentStep,
  onSetMelody,
  noteMode
}) => {
  // State for drag interactions
  const [dragState, setDragState] = useState<{
    isActive: boolean;
    startStep: number;
    pitch: string;
    mode: 'create' | 'resize';
    hasMoved: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Store grid metrics to avoid querying DOM during drag
  const dragMetrics = useRef<{ startX: number; stepWidth: number } | null>(null);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (dragState) {
        setDragState(null);
        dragMetrics.current = null;
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    window.addEventListener('touchcancel', handleGlobalPointerUp);
    
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
      window.removeEventListener('touchcancel', handleGlobalPointerUp);
    };
  }, [dragState]);

  const resolvedMelody = useMemo(() => {
    const result: (string | null)[] = new Array(TOTAL_STEPS).fill(null);
    let lastPitch: string | null = null;

    for (let i = 0; i < TOTAL_STEPS; i++) {
      const token = melody[i];
      if (token === SUSTAIN_TOKEN) {
        result[i] = lastPitch;
      } else if (token) {
        lastPitch = token;
        result[i] = token;
      } else {
        lastPitch = null;
        result[i] = null;
      }
    }
    return result;
  }, [melody]);

  const isNoteAllowed = (pitch: string, stepIndex: number): boolean => {
    if (noteMode === 'chromatic') return true;

    const noteName = pitch.replace(/[0-9]/g, '');

    if (noteMode === 'scale') {
        return SCALE_NOTES.includes(noteName);
    }
    
    // Chord mode
    const barIndex = Math.floor(stepIndex / STEPS_PER_BAR);
    const chord = progression[barIndex];
    if (!chord) return false;
    return chord.notes.includes(noteName);
  };

  const handleGridPointerDown = (e: React.PointerEvent) => {
    // Only capture mouse immediately. For touch, we rely on touch-action: pan-y.
    // If we capture touch immediately, we block the browser's scroll ability.
    if (e.pointerType === 'mouse' && containerRef.current) {
        containerRef.current.setPointerCapture(e.pointerId);
        e.preventDefault();
    }
    
    // Important: Do NOT preventDefault for touch events here, 
    // or scrolling won't work.

    const target = e.target as HTMLElement;
    const cell = target.closest('[data-step]') as HTMLElement;
    
    if (!cell) return;
    if (!containerRef.current) return;

    const firstCell = containerRef.current.querySelector('[data-step="0"]');
    if (firstCell) {
        const rect = firstCell.getBoundingClientRect();
        dragMetrics.current = {
            startX: rect.left,
            stepWidth: rect.width
        };
    } else {
        dragMetrics.current = null;
    }

    const step = parseInt(cell.dataset.step || '0', 10);
    const pitch = cell.dataset.pitch || '';

    const allowed = isNoteAllowed(pitch, step);
    if (!allowed) return;

    const existingPitch = resolvedMelody[step];
    let mode: 'create' | 'resize' = 'create';
    let startStep = step;

    if (existingPitch === pitch) {
        mode = 'resize';
        let ptr = step;
        while (ptr > 0 && melody[ptr] === SUSTAIN_TOKEN) {
            ptr--;
        }
        startStep = ptr;
    } else {
        const newMelody = [...melody];
        newMelody[step] = pitch;
        onSetMelody(newMelody);
        audioService.previewNote(pitch);
    }

    setDragState({
        isActive: true,
        startStep,
        pitch,
        mode,
        hasMoved: false
    });
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (!dragState || !dragState.isActive) return;
    
    // If we are dragging, we prevent default to stop page scroll interference
    // IF the browser hasn't already claimed the gesture (which pan-y allows it to do for vertical)
    if (e.cancelable) e.preventDefault(); 

    let step = -1;

    if (dragMetrics.current) {
        const relativeX = e.clientX - dragMetrics.current.startX;
        step = Math.floor(relativeX / dragMetrics.current.stepWidth);
        step = Math.max(0, Math.min(TOTAL_STEPS - 1, step));
    } else {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const cell = target?.closest('[data-step]') as HTMLElement;
        if (cell) {
             step = parseInt(cell.dataset.step || '0', 10);
        }
    }

    if (step === -1) return;

    setDragState(prev => prev ? { ...prev, hasMoved: true } : null);

    const { startStep, pitch } = dragState;
    if (step < startStep) return; 

    const newMelody = [...melody];
    newMelody[startStep] = pitch;
    
    for (let i = startStep + 1; i <= step; i++) {
        if (isNoteAllowed(pitch, i)) {
             newMelody[i] = SUSTAIN_TOKEN;
        } else {
            break;
        }
    }

    for (let i = step + 1; i < TOTAL_STEPS; i++) {
        if (newMelody[i] === SUSTAIN_TOKEN) {
             newMelody[i] = null;
        } else {
            break;
        }
    }

    onSetMelody(newMelody);
  };

  const handleGridPointerUp = (e: React.PointerEvent) => {
    if (dragState) {
        if (dragState.mode === 'resize' && !dragState.hasMoved) {
            const newMelody = [...melody];
            newMelody[dragState.startStep] = null;
            
            for (let i = dragState.startStep + 1; i < TOTAL_STEPS; i++) {
                if (newMelody[i] === SUSTAIN_TOKEN) {
                    newMelody[i] = null;
                } else {
                    break;
                }
            }
            onSetMelody(newMelody);
        }
    }
    setDragState(null);
    dragMetrics.current = null;
    
    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex flex-col relative no-select select-none">
      
      {/* Top Bar Indicators (Bar Numbers) */}
      <div className="flex h-8 mb-1 sticky top-0 bg-white z-20 shadow-sm border-b border-slate-100">
        <div className="w-12 flex-shrink-0 bg-white border-r border-slate-100"></div>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const isBarStart = i % STEPS_PER_BAR === 0;
          return (
            <div 
              key={`indicator-${i}`} 
              className="flex-1 flex items-end justify-center pb-1 bg-white"
            >
              {isBarStart && (
                <div className="text-sm font-black text-slate-400">
                    {Math.floor(i / STEPS_PER_BAR) + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div 
        ref={containerRef}
        className="relative rounded-xl select-none cursor-crosshair bg-white"
        style={{ touchAction: 'pan-y' }} // Crucial: Allows vertical scrolling on touch
        onPointerDown={handleGridPointerDown}
        onPointerMove={handleGridPointerMove}
        onPointerUp={handleGridPointerUp}
        onPointerLeave={handleGridPointerUp}
      >
        {PITCH_ROWS.map((pitch, rowIndex) => {
          const isSharp = pitch.includes('#');
          
          return (
            <div key={pitch} className="flex h-10 w-full group"> {/* Reduced to h-10 (40px) */}
              {/* Row Label (Pitch Name) */}
              <div 
                className={`
                  w-12 flex-shrink-0 flex items-center justify-end pr-2 text-xs font-bold pointer-events-none select-none bg-white border-r border-slate-50
                  ${isSharp ? 'text-slate-300' : 'text-slate-500'}
                `}
              >
                {pitch.replace(/\d/, '')}
              </div>

              {/* Grid Cells */}
              <div className="flex-1 flex relative">
                
                {Array.from({ length: TOTAL_STEPS }).map((_, stepIndex) => {
                  const allowed = isNoteAllowed(pitch, stepIndex);
                  const isBarStart = stepIndex % STEPS_PER_BAR === 0;
                  
                  const rawToken = melody[stepIndex];
                  const resolvedPitch = resolvedMelody[stepIndex];
                  const isActive = resolvedPitch === pitch;
                  
                  const isHead = isActive && rawToken === pitch;
                  const isTail = isActive && rawToken === SUSTAIN_TOKEN;
                  const isPlayingStep = stepIndex === currentStep;
                  
                  const barIndex = Math.floor(stepIndex / STEPS_PER_BAR);
                  const chord = progression[barIndex];
                  const colorBase = chord.color.split(' ')[0].replace('bg-', '').replace('-50', '');

                  let bgClass = 'bg-slate-50'; 
                  if (allowed) {
                      bgClass = `bg-${colorBase}-50/30`;
                  } 

                  const borderClass = isBarStart ? 'border-l-2 border-slate-300' : 'border-l border-slate-100/50';

                  let noteClass = 'hidden';
                  let noteRounded = 'rounded-md';
                  
                  const isDragTarget = dragState?.pitch === pitch && dragState?.isActive;
                  
                  if (isActive) {
                      noteClass = `bg-${colorBase}-500 shadow-sm`;
                      if (isDragTarget) {
                          noteClass = `bg-${colorBase}-600 shadow-md ring-2 ring-${colorBase}-300 ring-offset-1 z-20`;
                      }

                      if (isHead) noteRounded = 'rounded-l-md';
                      if (isTail) noteRounded = 'rounded-r-md';
                      
                      const nextIsSustain = (stepIndex + 1 < TOTAL_STEPS) && melody[stepIndex + 1] === SUSTAIN_TOKEN;
                      const prevIsSustain = (stepIndex - 1 >= 0) && melody[stepIndex] === SUSTAIN_TOKEN && resolvedMelody[stepIndex-1] === pitch;

                      if (nextIsSustain) noteRounded = isHead ? 'rounded-l-lg rounded-r-none' : 'rounded-none';
                      if (prevIsSustain && !nextIsSustain) noteRounded = 'rounded-r-lg rounded-l-none';
                      if (prevIsSustain && nextIsSustain) noteRounded = 'rounded-none';
                  }

                  const cursorClass = allowed ? 'cursor-pointer' : 'cursor-not-allowed';
                  
                  return (
                    <div
                      key={`${pitch}-${stepIndex}`}
                      data-step={stepIndex}
                      data-pitch={pitch}
                      className={`
                        flex-1 relative ${cursorClass} ${borderClass} ${bgClass}
                        ${isPlayingStep ? '!brightness-95' : ''}
                        transition-colors duration-100
                        border-b border-slate-50/50
                        ${allowed && !isActive ? 'hover:bg-slate-200/50' : ''}
                      `}
                    >
                        {allowed && !isActive && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className={`
                                    w-1.5 h-1.5 rounded-full
                                    bg-${colorBase}-300
                                `}></div>
                            </div>
                        )}

                        {isActive && (
                            <div className={`
                                absolute inset-y-1 inset-x-0 mx-[1px] ${noteClass} ${noteRounded}
                                animate-pop-in z-10
                            `}>
                                {isTail && isDragTarget && (
                                     <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/30 rounded-full"></div>
                                )}
                            </div>
                        )}
                        
                        {isPlayingStep && !isActive && allowed && (
                             <div className={`absolute inset-0 bg-slate-900/5`}></div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};