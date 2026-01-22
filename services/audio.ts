import * as Tone from 'tone';
import { TOTAL_STEPS, SUSTAIN_TOKEN, STEPS_PER_BAR } from '../constants';
import { Melody, Progression } from '../types';

class AudioService {
  private synth: Tone.PolySynth | null = null;
  private chordSynth: Tone.PolySynth | null = null;
  private sequence: Tone.Sequence | null = null;
  private melody: Melody = new Array(TOTAL_STEPS).fill(null);
  private progression: Progression | null = null;
  private isInitialized = false;
  private isChordEnabled = true;
  private onStepCallback: ((step: number) => void) | null = null;
  private reverb: Tone.JCReverb | null = null;
  private limiter: Tone.Limiter | null = null;
  private currentStepIndex: number = 0;

  async init() {
    if (this.isInitialized) return;
    
    await Tone.start();
    if (Tone.context.state !== 'running') {
        await Tone.context.resume();
    }

    // Master Bus Effects
    this.limiter = new Tone.Limiter(-1).toDestination();
    
    // JCReverb is synchronous
    this.reverb = new Tone.JCReverb({
      roomSize: 0.5,
      wet: 0.15
    }).connect(this.limiter);

    // Initial Melody Synth - Default FMSynth "Keys" sound
    this.synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2,
      modulationIndex: 3,
      oscillator: { type: "sine" },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 1.2 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.2 },
      volume: -1 
    }).connect(this.reverb);
    
    this.synth.maxPolyphony = 16;

    // Chord/Backing Synth - "Warm Pad"
    // Adjusted: Faster attack to ensure audibility, higher polyphony
    const filter = new Tone.Filter(800, "lowpass").connect(this.reverb);
    
    this.chordSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "fatsawtooth",
        count: 3,
        spread: 20
      },
      envelope: {
        attack: 0.1, // Faster attack (was 1.2)
        decay: 1.0,
        sustain: 0.6,
        release: 2.0,
      },
      volume: -20 // Slightly louder
    }).connect(filter);
    
    this.chordSynth.maxPolyphony = 12; // Increased to prevent voice stealing

    Tone.Transport.bpm.value = 100;

    const steps = Array.from({ length: TOTAL_STEPS }, (_, i) => i);

    this.sequence = new Tone.Sequence((time, stepIndex) => {
      this.currentStepIndex = stepIndex;

      if (this.onStepCallback) {
        Tone.Draw.schedule(() => {
          this.onStepCallback?.(stepIndex);
        }, time);
      }

      const note = this.melody[stepIndex];
      if (note && note !== SUSTAIN_TOKEN && this.synth) {
        let durationSteps = 1;
        for (let i = stepIndex + 1; i < this.melody.length; i++) {
          if (this.melody[i] === SUSTAIN_TOKEN) {
            durationSteps++;
          } else {
            break;
          }
        }
        const duration = Tone.Time("8n").toSeconds() * durationSteps;
        this.synth.triggerAttackRelease(note, duration, time);
      }

      if (this.isChordEnabled && this.chordSynth && this.progression) {
        if (stepIndex % STEPS_PER_BAR === 0) {
            const barIndex = Math.floor(stepIndex / STEPS_PER_BAR);
            this.triggerChord(barIndex, time);
        }
      }
    }, steps, "8n");

    this.sequence.start(0);
    this.isInitialized = true;
  }

  private triggerChord(barIndex: number, time?: number) {
      if (!this.chordSynth || !this.progression) return;
      
      const chord = this.progression[barIndex];
      if (chord) {
          const root = chord.root + "3";
          const others = chord.notes
              .filter(n => n !== chord.root)
              .map(n => n + "4");
          
          // Use '1m' (1 measure) duration for the chord
          this.chordSynth.triggerAttackRelease([root, ...others], "1m", time);
      }
  }

  updateMelody(melody: Melody) {
    this.melody = [...melody];
  }

  updateProgression(progression: Progression) {
    this.progression = progression;
  }

  setChordEnabled(enabled: boolean) {
    this.isChordEnabled = enabled;
    
    // Instant feedback: If playing and we just enabled chords, trigger current bar immediately
    if (enabled && this.isInitialized && Tone.Transport.state === 'started') {
        const barIndex = Math.floor(this.currentStepIndex / STEPS_PER_BAR);
        // Trigger immediately (no time arg = 'now')
        this.triggerChord(barIndex);
    } else if (!enabled && this.chordSynth) {
        this.chordSynth.releaseAll();
    }
  }

  setStepCallback(cb: (step: number) => void) {
    this.onStepCallback = cb;
  }

  async play() {
    if (!this.isInitialized) await this.init();
    if (Tone.context.state !== 'running') await Tone.context.resume();
    Tone.Transport.start();
  }

  pause() {
    Tone.Transport.pause();
    this.releaseAll();
  }

  stop() {
    Tone.Transport.stop();
    this.currentStepIndex = 0;
    this.releaseAll();
  }

  cleanup() {
    this.stop();
    if (this.sequence) this.sequence.dispose();
    if (this.synth) this.synth.dispose();
    if (this.chordSynth) this.chordSynth.dispose();
    if (this.reverb) this.reverb.dispose();
    if (this.limiter) this.limiter.dispose();
    this.isInitialized = false;
  }

  releaseAll() {
    if (this.chordSynth) this.chordSynth.releaseAll();
    if (this.synth) this.synth.releaseAll();
  }
  
  setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  previewNote(note: string) {
    if (!this.synth) return;
    this.synth.triggerAttackRelease(note, "8n");
  }
}

export const audioService = new AudioService();