// ============================================================================
// LIP SYNC SYSTEM - ARKit 52 Blend Shapes (UPDATED WITH RHUBARB)
// ============================================================================

export interface VisemeFrame {
  viseme: string;
  startTime: number;
  endTime: number;
}

export interface MorphTargetValue {
  [key: string]: number;
}

export interface Expression {
  head: MorphTargetValue;
  teeth: MorphTargetValue;
  eyes: MorphTargetValue;
}

// ============================================================================
// VISEME MAPPINGS - REALISTIC NATURAL SPEECH
// ============================================================================

export const VISEME_MAPPINGS: Record<string, Expression> = {
  // Neutral/Silent
  neutral: {
    head: {
      mouthClose: 0.1
    },
    teeth: {},
    eyes: {}
  },

  // Vowels - More natural ranges
  aa: { // "ah" as in "father"
    head: {
      jawOpen: 0.5,
      mouthOpen: 0.3,
      mouthFunnel: 0.1
    },
    teeth: {},
    eyes: {}
  },

  E: { // "eh" as in "bed"
    head: {
      jawOpen: 0.3,
      mouthStretchLeft: 0.2,
      mouthStretchRight: 0.2,
      mouthOpen: 0.15
    },
    teeth: {},
    eyes: {}
  },

  I: { // "ih" as in "bit"
    head: {
      jawOpen: 0.2,
      mouthStretchLeft: 0.3,
      mouthStretchRight: 0.3,
      mouthOpen: 0.1
    },
    teeth: {},
    eyes: {}
  },

  O: { // "oh" as in "go"
    head: {
      jawOpen: 0.4,
      mouthFunnel: 0.4,
      mouthPucker: 0.2
    },
    teeth: {},
    eyes: {}
  },

  U: { // "oo" as in "boot"
    head: {
      jawOpen: 0.2,
      mouthFunnel: 0.5,
      mouthPucker: 0.4
    },
    teeth: {},
    eyes: {}
  },

  // Consonants - More subtle
  PP: { // "p", "b", "m" - lips together
    head: {
      mouthClose: 0.8,
      mouthPressLeft: 0.3,
      mouthPressRight: 0.3,
      jawOpen: 0.05
    },
    teeth: {},
    eyes: {}
  },

  FF: { // "f", "v" - teeth on lower lip
    head: {
      jawOpen: 0.15,
      mouthLowerDownLeft: 0.3,
      mouthLowerDownRight: 0.3,
      mouthRollLower: 0.2
    },
    teeth: {},
    eyes: {}
  },

  TH: { // "th" - tongue between teeth
    head: {
      jawOpen: 0.25,
      mouthOpen: 0.15,
      tongueOut: 0.3
    },
    teeth: {},
    eyes: {}
  },

  DD: { // "d", "t", "n" - tongue to teeth
    head: {
      jawOpen: 0.2,
      mouthOpen: 0.1
    },
    teeth: {},
    eyes: {}
  },

  kk: { // "k", "g" - back of throat
    head: {
      jawOpen: 0.3,
      mouthOpen: 0.2
    },
    teeth: {},
    eyes: {}
  },

  CH: { // "ch", "j", "sh" - lips forward
    head: {
      jawOpen: 0.2,
      mouthFunnel: 0.3,
      mouthPucker: 0.25
    },
    teeth: {},
    eyes: {}
  },

  SS: { // "s", "z" - teeth together, lips apart
    head: {
      jawOpen: 0.15,
      mouthStretchLeft: 0.25,
      mouthStretchRight: 0.25,
      mouthClose: 0.2
    },
    teeth: {},
    eyes: {}
  },

  nn: { // "n", "ng" - mouth closed, nasal
    head: {
      jawOpen: 0.15,
      mouthClose: 0.4
    },
    teeth: {},
    eyes: {}
  },

  RR: { // "r" - lips slightly rounded
    head: {
      jawOpen: 0.25,
      mouthFunnel: 0.2,
      mouthOpen: 0.15
    },
    teeth: {},
    eyes: {}
  },

  sil: { // Silence - relaxed
    head: {
      mouthClose: 0.2,
      jawOpen: 0.05
    },
    teeth: {},
    eyes: {}
  }
};

// ============================================================================
// LIP SYNC ENGINE (UPDATED FOR RHUBARB)
// ============================================================================

export class LipSyncEngine {
  private visemeQueue: VisemeFrame[] = [];
  private currentViseme: string = 'neutral';
  private audioContext: AudioContext | null = null;
  private baseTime: number = 0; // AudioContext.currentTime when playback starts
  private isPlaying: boolean = false;
  private useRhubarb: boolean = true; // NEW: Toggle for Rhubarb

  constructor(useRhubarb: boolean = true) {
    this.useRhubarb = useRhubarb;
    console.log(`🎤 LipSyncEngine initialized (Rhubarb: ${useRhubarb ? 'ON' : 'OFF'})`);
  }

  // ============================================================================
  // NEW: Direct viseme queue setting (for Rhubarb)
  // ============================================================================

  /**
   * Set viseme queue directly (from Rhubarb or external source)
   */
  setVisemeQueue(queue: VisemeFrame[]): void {
    this.visemeQueue = queue;
    if (!this.isPlaying && queue.length > 0) {
      this.startPlayback();
    }
    console.log(`📊 Viseme queue set: ${queue.length} frames`);
  }

  /**
   * Add visemes to queue with timing offset
   */
  addVisemes(visemes: VisemeFrame[], timeOffset: number = 0): void {
    const offsetVisemes = visemes.map(v => ({
      ...v,
      startTime: v.startTime + timeOffset,
      endTime: v.endTime + timeOffset
    }));
    
    this.visemeQueue.push(...offsetVisemes);
    
    if (!this.isPlaying && this.visemeQueue.length > 0) {
      this.startPlayback();
    }
  }

  // ============================================================================
  // LEGACY: Process Float32Array audio data (fallback)
  // ============================================================================

  processAudioData(audioData: Float32Array, timestamp: number = Date.now()): void {
    if (this.useRhubarb) {
      // When using Rhubarb, audio is processed externally
      console.warn("⚠️ processAudioData called but Rhubarb mode is enabled");
      return;
    }

    const visemes = this.analyzeAudio(audioData);
    
    if (!this.isPlaying) {
      this.startTime = Date.now();
      this.isPlaying = true;
    }
    
    const elapsedSinceStart = Date.now() - this.startTime;
    const offsetVisemes = visemes.map(v => ({
      ...v,
      startTime: elapsedSinceStart + v.startTime,
      endTime: elapsedSinceStart + v.endTime
    }));

    this.visemeQueue.push(...offsetVisemes);
  }

  // ============================================================================
  // LEGACY AUDIO ANALYSIS (kept for fallback)
  // ============================================================================

  private analyzeAudio(audioData: Float32Array): VisemeFrame[] {
    const frames: VisemeFrame[] = [];
    const sampleRate = 24000;
    const windowSize = Math.floor(sampleRate * 0.05);
    const hopSize = Math.floor(windowSize / 2);

    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const rms = this.calculateRMS(window);

      let viseme = 'neutral';
      if (rms > 0.02) {
        const frequencies = this.getFrequencyFeatures(window);
        viseme = this.frequenciesToViseme(frequencies, rms);
      } else {
        viseme = 'sil';
      }

      const startTime = (i / sampleRate) * 1000;
      const endTime = ((i + windowSize) / sampleRate) * 1000;

      frames.push({ viseme, startTime, endTime });
    }

    return this.smoothVisemes(frames);
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  private getFrequencyFeatures(buffer: Float32Array) {
    const third = Math.floor(buffer.length / 3);
    const low = this.calculateRMS(buffer.slice(0, third));
    const mid = this.calculateRMS(buffer.slice(third, third * 2));
    const high = this.calculateRMS(buffer.slice(third * 2));
    return { low, mid, high };
  }

  private frequenciesToViseme(freq: { low: number, mid: number, high: number }, amplitude: number): string {
    const total = freq.low + freq.mid + freq.high;
    if (total < 0.01) return 'sil';

    const lowRatio = freq.low / total;
    const midRatio = freq.mid / total;
    const highRatio = freq.high / total;

    if (lowRatio > 0.45) {
      return amplitude > 0.1 ? 'aa' : 'O';
    }
    
    if (highRatio > 0.4) {
      return amplitude > 0.08 ? 'SS' : 'I';
    }
    
    if (midRatio > 0.4) {
      if (amplitude > 0.12) return 'E';
      if (amplitude > 0.06) return 'DD';
      return 'nn';
    }

    if (lowRatio > 0.3 && highRatio > 0.3) {
      return 'RR';
    }

    return amplitude > 0.08 ? 'aa' : 'neutral';
  }

  private smoothVisemes(frames: VisemeFrame[]): VisemeFrame[] {
    if (frames.length < 5) return frames;

    const smoothed: VisemeFrame[] = [];
    
    for (let i = 0; i < frames.length; i++) {
      if (i < 2 || i >= frames.length - 2) {
        smoothed.push(frames[i]);
        continue;
      }

      const window = [
        frames[i - 2].viseme,
        frames[i - 1].viseme,
        frames[i].viseme,
        frames[i + 1].viseme,
        frames[i + 2].viseme
      ];

      const counts: Record<string, number> = {};
      window.forEach(v => counts[v] = (counts[v] || 0) + 1);

      if (counts[frames[i].viseme] === 1) {
        const mostCommon = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])[0][0];
        smoothed.push({ ...frames[i], viseme: mostCommon });
      } else {
        smoothed.push(frames[i]);
      }
    }

    return smoothed;
  }

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  private startPlayback(): void {
    this.isPlaying = true;
    this.startTime = Date.now();
    console.log("▶️ Lip sync playback started");
  }

  getCurrentViseme(): string {
    if (!this.isPlaying || !this.audioContext) return 'neutral';

    const currentTime = this.audioContext.currentTime;
    
    // Find the current viseme based on audio context time
    const frame = this.visemeQueue.find(v => 
      v.startTime <= currentTime && v.endTime > currentTime
    );

    if (frame) {
      if (this.currentViseme !== frame.viseme) {
        console.log(`🗣️ Viseme: ${frame.viseme} at ${elapsed}ms`);
      }
      this.currentViseme = frame.viseme;
      return frame.viseme;
    }

    // Clean old frames (already played)
    this.visemeQueue = this.visemeQueue.filter(v => v.endTime > currentTime);

    if (this.visemeQueue.length === 0) {
      this.isPlaying = false;
      return 'neutral';
    }

    return this.currentViseme;
  }

  getCurrentMorphTargets(): Expression {
    const viseme = this.getCurrentViseme();
    return VISEME_MAPPINGS[viseme] || VISEME_MAPPINGS.neutral;
  }

  reset(): void {
    this.visemeQueue = [];
    this.currentViseme = 'neutral';
    this.isPlaying = false;
    this.baseTime = 0;
    console.log("🔄 Lip sync reset");
  }

  stop(): void {
    this.isPlaying = false;
    this.currentViseme = 'neutral';
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getQueueLength(): number {
    return this.visemeQueue.length;
  }

  isActive(): boolean {
    return this.isPlaying;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function lerpExpression(from: Expression, to: Expression, alpha: number): Expression {
  const result: Expression = { head: {}, teeth: {}, eyes: {} };

  const allHeadKeys = new Set([...Object.keys(from.head), ...Object.keys(to.head)]);
  allHeadKeys.forEach(key => {
    const fromVal = from.head[key] || 0;
    const toVal = to.head[key] || 0;
    result.head[key] = fromVal + (toVal - fromVal) * alpha;
  });

  const allTeethKeys = new Set([...Object.keys(from.teeth), ...Object.keys(to.teeth)]);
  allTeethKeys.forEach(key => {
    const fromVal = from.teeth[key] || 0;
    const toVal = to.teeth[key] || 0;
    result.teeth[key] = fromVal + (toVal - fromVal) * alpha;
  });

  const allEyesKeys = new Set([...Object.keys(from.eyes), ...Object.keys(to.eyes)]);
  allEyesKeys.forEach(key => {
    const fromVal = from.eyes[key] || 0;
    const toVal = to.eyes[key] || 0;
    result.eyes[key] = fromVal + (toVal - fromVal) * alpha;
  });

  return result;
}

export function applyExpression(
  expression: Expression,
  headRef: any,
  teethRef: any,
  eyeLeftRef: any,
  eyeRightRef: any,
  headDict: any,
  teethDict: any,
  eyeDict: any
): void {
  if (headRef?.morphTargetInfluences && headDict) {
    Object.entries(expression.head).forEach(([name, value]) => {
      const index = headDict[name];
      if (index !== undefined) {
        headRef.morphTargetInfluences[index] = value;
      }
    });
  }

  if (teethRef?.morphTargetInfluences && teethDict) {
    Object.entries(expression.teeth).forEach(([name, value]) => {
      const index = teethDict[name];
      if (index !== undefined) {
        teethRef.morphTargetInfluences[index] = value;
      }
    });
  }

  if (eyeLeftRef?.morphTargetInfluences && eyeDict) {
    Object.entries(expression.eyes).forEach(([name, value]) => {
      const index = eyeDict[name];
      if (index !== undefined) {
        eyeLeftRef.morphTargetInfluences[index] = value;
        if (eyeRightRef?.morphTargetInfluences) {
          eyeRightRef.morphTargetInfluences[index] = value;
        }
      }
    });
  }
}