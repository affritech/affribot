// ============================================================================
// LIP SYNC SYSTEM - ARKit 52 Blend Shapes (FIXED FOR INTERRUPTIONS)
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
// LIP SYNC ENGINE (FIXED FOR INTERRUPTIONS)
// ============================================================================

export class LipSyncEngine {
  private visemeQueue: VisemeFrame[] = [];
  private currentViseme: string = 'neutral';
  private audioContext: AudioContext | null = null;
  private baseTime: number = 0;
  private isPlaying: boolean = false;
  private useRhubarb: boolean = true;

  constructor(useRhubarb: boolean = true) {
    this.useRhubarb = useRhubarb;
    console.log(`🎤 LipSyncEngine initialized (Rhubarb: ${useRhubarb ? 'ON' : 'OFF'})`);
  }

  // ============================================================================
  // NEW: Set audio context for timing sync
  // ============================================================================

  setAudioContext(context: AudioContext): void {
    this.audioContext = context;
    console.log("🔗 Audio context linked to LipSyncEngine");
  }

  // ============================================================================
  // FIXED: Direct viseme queue setting (synced with audio time)
  // ============================================================================

  /**
   * Set viseme queue directly (from Rhubarb or external source)
   * Now uses scheduled audio time instead of Date.now()
   */
  setVisemeQueue(queue: VisemeFrame[], audioStartTime: number): void {
    this.visemeQueue = queue;
    this.baseTime = audioStartTime;
    
    if (!this.isPlaying && queue.length > 0) {
      this.startPlayback();
    }
    console.log(`📊 Viseme queue set: ${queue.length} frames at audio time ${audioStartTime.toFixed(3)}s`);
  }

  /**
   * Add visemes to queue with audio time synchronization
   */
  addVisemes(visemes: VisemeFrame[], audioStartTime: number): void {
    // Convert relative times to absolute audio context times
    const syncedVisemes = visemes.map(v => ({
      viseme: v.viseme,
      startTime: audioStartTime + v.startTime / 1000, // Convert ms to seconds
      endTime: audioStartTime + v.endTime / 1000
    }));
    
    this.visemeQueue.push(...syncedVisemes);
    
    // Sort by start time to handle overlapping additions
    this.visemeQueue.sort((a, b) => a.startTime - b.startTime);
    
    if (!this.isPlaying && this.visemeQueue.length > 0) {
      this.startPlayback();
    }
    
    console.log(`➕ Added ${visemes.length} visemes at audio time ${audioStartTime.toFixed(3)}s`);
  }

  // ============================================================================
  // FIXED: Use AudioContext time instead of Date.now()
  // ============================================================================

  private startPlayback(): void {
    this.isPlaying = true;
    if (this.audioContext && this.visemeQueue.length > 0) {
      this.baseTime = this.visemeQueue[0].startTime;
    }
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
        console.log(`🗣️ Viseme: ${frame.viseme} at audio time ${currentTime.toFixed(3)}s`);
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
    console.log("⏹️ Lip sync stopped");
  }

  // ============================================================================
  // NEW: Clear future visemes (for interruptions)
  // ============================================================================

  clearFutureVisemes(): void {
    if (!this.audioContext) return;
    
    const currentTime = this.audioContext.currentTime;
    // Keep only visemes that are currently playing or already passed
    this.visemeQueue = this.visemeQueue.filter(v => v.endTime <= currentTime + 0.1);
    console.log("🗑️ Cleared future visemes due to interruption");
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

  getAudioContext(): AudioContext | null {
    return this.audioContext;
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