import * as Tone from 'tone';
import { TOTAL_STEPS, SUSTAIN_TOKEN, STEPS_PER_BAR } from '../constants';
import { Melody, Progression, BeatGrid } from '../types';

class AudioService {
  private synth: Tone.Sampler | null = null;
  private chordSynth: Tone.Sampler | null = null;
  private drumSampler: Tone.Sampler | null = null;
  private sequence: Tone.Sequence | null = null;
  private melody: Melody = new Array(TOTAL_STEPS).fill(null);
  private progression: Progression | null = null;
  private beatGrid: BeatGrid | null = null;
  private isInitialized = false;
  private isChordEnabled = true;
  private isBeatsEnabled = true;
  private onStepCallback: ((step: number) => void) | null = null;
  private reverb: Tone.JCReverb | null = null;
  private limiter: Tone.Limiter | null = null;
  private recorder: Tone.Recorder | null = null;
  private currentStepIndex: number = 0;

  async init() {
    // If already initialized but sequence was destroyed (e.g. by Playground cleanup),
    // force a full re-initialization
    if (this.isInitialized) {
      await Tone.start();
      if (Tone.context.state !== 'running') await Tone.context.resume();
      return;
    }

    await Tone.start();
    if (Tone.context.state !== 'running') {
      await Tone.context.resume();
    }

    // Master Bus Effects
    this.limiter = new Tone.Limiter(-1).toDestination();
    this.recorder = new Tone.Recorder();
    this.limiter.connect(this.recorder);

    // JCReverb is synchronous
    this.reverb = new Tone.JCReverb({
      roomSize: 0.5,
      wet: 0.15
    }).connect(this.limiter);

    // Initial Melody Synth - Piano Sampler
    this.synth = new Tone.Sampler({
      urls: {
        "A3": "A3.mp3",
        "A4": "A4.mp3",
        "A5": "A5.mp3",
        "C4": "C4.mp3",
        "C5": "C5.mp3"
      },
      baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
      volume: 0,
      onload: () => console.log("[AudioService] Piano sampler loaded"),
      onerror: (e) => console.error("[AudioService] Piano sampler error:", e)
    }).connect(this.reverb);

    const filter = new Tone.Filter(800, "lowpass").connect(this.reverb);

    this.chordSynth = new Tone.Sampler({
      urls: {
        "A3": "A3.mp3",
        "A4": "A4.mp3",
        "A5": "A5.mp3",
        "C4": "C4.mp3",
        "C5": "C5.mp3"
      },
      baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
      volume: -10,
      onload: () => console.log("[AudioService] Chord sampler loaded"),
      onerror: (e) => console.error("[AudioService] Chord sampler error:", e)
    }).connect(filter);

    this.drumSampler = new Tone.Sampler({
      urls: {
        "C1": "kick.mp3",
        "D1": "snare.mp3",
        "E1": "hh.mp3",
        "F1": "agogoHigh.mp3"
      },
      baseUrl: "/samples/505/",
      volume: -2,
      onload: () => console.log("[AudioService] Drum sampler loaded"),
      onerror: (e) => console.error("[AudioService] Drum sampler error:", e)
    }).connect(this.limiter);

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

      if (this.isBeatsEnabled && this.drumSampler && this.beatGrid) {
        const beatStep = stepIndex % 16;
        if (this.beatGrid[0][beatStep]) this.drumSampler.triggerAttackRelease("C1", "8n", time);
        if (this.beatGrid[1][beatStep]) this.drumSampler.triggerAttackRelease("D1", "8n", time);
        if (this.beatGrid[2][beatStep]) this.drumSampler.triggerAttackRelease("E1", "8n", time);
        if (this.beatGrid[3][beatStep]) this.drumSampler.triggerAttackRelease("F1", "8n", time);
      }
    }, steps, "8n");

    this.sequence.start(0);

    // Wait for samples with a timeout so we don't hang forever
    try {
      await Promise.race([
        Tone.loaded(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sample loading timeout')), 10000))
      ]);
      console.log("[AudioService] All samples loaded successfully");
    } catch (e) {
      console.warn("[AudioService] Sample loading issue (continuing anyway):", e);
    }

    this.isInitialized = true;
    console.log("[AudioService] Initialized successfully");
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

  updateBeats(grid: BeatGrid) {
    this.beatGrid = grid;
  }

  setBeatsEnabled(enabled: boolean) {
    this.isBeatsEnabled = enabled;
  }

  setStepCallback(cb: (step: number) => void) {
    this.onStepCallback = cb;
  }

  async play() {
    if (!this.isInitialized) await this.init();
    if (Tone.context.state !== 'running') await Tone.context.resume();
    Tone.Transport.start();
  }

  async recordTrack(): Promise<string | null> {
    if (!this.isInitialized) await this.init();
    if (!this.recorder) return null;
    
    // Stop and reset to 0
    this.stop();
    if (Tone.context.state !== 'running') await Tone.context.resume();

    // Start Recording
    this.recorder.start();
    Tone.Transport.start();

    // Calculate time. TOTAL_STEPS = 32. 8n steps = 16 quarter notes. 
    // Wait for the track to finish + 1 second tail
    const bpm = Tone.Transport.bpm.value;
    const durationSeconds = (16 * 60) / bpm;
    
    return new Promise(resolve => {
        setTimeout(async () => {
            this.stop();
            const recording = await this.recorder!.stop();
            const url = URL.createObjectURL(recording);
            resolve(url);
        }, durationSeconds * 1000 + 1000); // Wait until end of loop + tail
    });
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
    if (this.drumSampler) this.drumSampler.dispose();
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

  private static DRUM_NOTES = ['C1', 'D1', 'E1', 'F1'];

  async previewDrum(rowIndex: number) {
    if (!this.isInitialized) await this.init();
    if (!this.drumSampler) return;
    await Tone.start();
    if (Tone.context.state !== 'running') await Tone.context.resume();
    const note = AudioService.DRUM_NOTES[rowIndex];
    if (note) this.drumSampler.triggerAttackRelease(note, '8n');
  }
}

export const audioService = new AudioService();