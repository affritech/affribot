// ============================================================================
// LIP SYNC SYSTEM - ARKit 52 Blend Shapes (WITH ADJUSTED MAPPINGS)
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
// VISEME MAPPINGS - ADJUSTED FOR MORE NATURAL MOVEMENT
// ============================================================================

export const VISEME_MAPPINGS: Record<string, Expression> = {
  neutral: {
    head: { mouthClose: 0.03 },
    teeth: {},
    eyes: {}
  },
  aa: {
    head: {
      jawOpen: 0.3,
      mouthOpen: 0.2,
      mouthFunnel: 0.03
    },
    teeth: {},
    eyes: {}
  },
  E: {
    head: {
      jawOpen: 0.12,
      mouthStretchLeft: 0.15,
      mouthStretchRight: 0.15,
      mouthOpen: 0.06
    },
    teeth: {},
    eyes: {}
  },
  I: {
    head: {
      jawOpen: 0.08,
      mouthStretchLeft: 0.2,
      mouthStretchRight: 0.2,
      mouthOpen: 0.04
    },
    teeth: {},
    eyes: {}
  },
  O: {
    head: {
      jawOpen: 0.18,
      mouthFunnel: 0.25,
      mouthPucker: 0.12
    },
    teeth: {},
    eyes: {}
  },
  U: {
    head: {
      jawOpen: 0.08,
      mouthFunnel: 0.3,
      mouthPucker: 0.25
    },
    teeth: {},
    eyes: {}
  },
  PP: {
    head: {
      mouthClose: 0.5,
      mouthPressLeft: 0.2,
      mouthPressRight: 0.2,
      jawOpen: 0.01
    },
    teeth: {},
    eyes: {}
  },
  FF: {
    head: {
      jawOpen: 0.1,
      mouthRollLower: 0.15
    },
    teeth: {},
    eyes: {}
  },
  TH: {
    head: {
      jawOpen: 0.15,
      mouthOpen: 0.1,
      tongueOut: 0.2
    },
    teeth: {},
    eyes: {}
  },
  DD: {
    head: {
      jawOpen: 0.12,
      mouthOpen: 0.06
    },
    teeth: {},
    eyes: {}
  },
  kk: {
    head: {
      jawOpen: 0.18,
      mouthOpen: 0.12
    },
    teeth: {},
    eyes: {}
  },
  CH: {
    head: {
      jawOpen: 0.12,
      mouthFunnel: 0.18,
      mouthPucker: 0.15
    },
    teeth: {},
    eyes: {}
  },
  SS: {
    head: {
      jawOpen: 0.05,
      mouthStretchLeft: 0.15,
      mouthStretchRight: 0.15,
      mouthClose: 0.08
    },
    teeth: {},
    eyes: {}
  },
  nn: {
    head: {
      jawOpen: 0.06,
      mouthClose: 0.25
    },
    teeth: {},
    eyes: {}
  },
  RR: {
    head: {
      jawOpen: 0.14,
      mouthFunnel: 0.12,
      mouthOpen: 0.1
    },
    teeth: {},
    eyes: {}
  },
  sil: {
    head: {
      mouthClose: 0.08,
      jawOpen: 0.01
    },
    teeth: {},
    eyes: {}
  }
};

// ============================================================================
// GLOBAL INTENSITY ADJUSTMENT (OPTIONAL)
// Uncomment to scale all viseme values globally
// ============================================================================

// const GLOBAL_INTENSITY = 0.7; // 0.5 = very subtle, 1.0 = as defined, 1.5 = exaggerated
// Object.keys(VISEME_MAPPINGS).forEach(viseme => {
//   Object.keys(VISEME_MAPPINGS[viseme].head).forEach(key => {
//     VISEME_MAPPINGS[viseme].head[key] *= GLOBAL_INTENSITY;
//   });
// });

// ============================================================================
// LIP SYNC ENGINE (WITH DEBUGGING AND SMOOTHING)
// ============================================================================

export class LipSyncEngine {
  private visemeQueue: VisemeFrame[] = [];
  private currentViseme: string = 'neutral';
  private previousViseme: string = 'neutral';
  private audioContext: AudioContext | null = null;
  private audioStartTime: number = 0;
  private isPlaying: boolean = false;
  private isAudioStreaming: boolean = false;
  private useRhubarb: boolean = true;
  private transitionProgress: number = 1.0;
  private readonly TRANSITION_DURATION: number = 50;
  private lastLogTime: number = 0;

  constructor(useRhubarb: boolean = true) {
    this.useRhubarb = useRhubarb;
    console.log(`🎤 LipSyncEngine initialized (Rhubarb: ${useRhubarb ? 'ON' : 'OFF'})`);
  }

  setAudioStartTime(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    this.audioStartTime = audioContext.currentTime;
    this.isPlaying = true;
    this.isAudioStreaming = true;
    console.log(`⏰ Lip sync synced to audio context at ${this.audioStartTime.toFixed(3)}s`);
  }

  setVisemeQueue(queue: VisemeFrame[]): void {
    this.visemeQueue = queue;
    if (!this.isPlaying && queue.length > 0) {
      this.isPlaying = true;
    }
    console.log(`📊 Viseme queue set: ${queue.length} frames`);
  }

  addVisemes(visemes: VisemeFrame[], timeOffset: number = 0): void {
    const offsetVisemes = visemes.map(v => ({
      ...v,
      startTime: v.startTime + timeOffset,
      endTime: v.endTime + timeOffset
    }));
    
    this.visemeQueue.push(...offsetVisemes);
    this.visemeQueue.sort((a, b) => a.startTime - b.startTime);
    
    if (!this.isPlaying && this.visemeQueue.length > 0) {
      this.isPlaying = true;
    }

    console.log(`➕ Added ${visemes.length} visemes with offset ${timeOffset.toFixed(0)}ms (total queue: ${this.visemeQueue.length})`);
  }

  getCurrentViseme(): string {
    if (!this.isPlaying || !this.audioContext) {
      return 'neutral';
    }

    const elapsedSeconds = this.audioContext.currentTime - this.audioStartTime;
    const elapsed = elapsedSeconds * 1000;

    // Periodic debug logging (every 2 seconds)
    const now = Date.now();
    if (now - this.lastLogTime > 2000) {
      console.log(`🔍 LipSync - Elapsed: ${elapsed.toFixed(0)}ms, Queue: ${this.visemeQueue.length}, Current: ${this.currentViseme}`);
      if (this.visemeQueue.length > 0) {
        const next = this.visemeQueue[0];
        console.log(`   Next: ${next.viseme} at ${next.startTime.toFixed(0)}-${next.endTime.toFixed(0)}ms`);
      }
      this.lastLogTime = now;
    }

    const frame = this.visemeQueue.find(v => 
      v.startTime <= elapsed && v.endTime > elapsed
    );

    if (frame && frame.viseme !== this.currentViseme) {
      this.previousViseme = this.currentViseme;
      this.currentViseme = frame.viseme;
      this.transitionProgress = 0;
      console.log(`🗣️ Viseme: ${frame.viseme} at ${elapsed.toFixed(0)}ms`);
    }

    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + (16 / this.TRANSITION_DURATION));
    }

    // Clean old frames (keep 500ms buffer)
    const CLEANUP_THRESHOLD = 500;
    const beforeCleanup = this.visemeQueue.length;
    this.visemeQueue = this.visemeQueue.filter(v => v.endTime > (elapsed - CLEANUP_THRESHOLD));
    
    if (beforeCleanup !== this.visemeQueue.length) {
      console.log(`🧹 Cleaned ${beforeCleanup - this.visemeQueue.length} old visemes`);
    }

    // Handle gaps between visemes
    if (!frame && this.visemeQueue.length > 0) {
      const nextFrame = this.visemeQueue[0];
      if (nextFrame.startTime > elapsed) {
        const gap = nextFrame.startTime - elapsed;
        if (gap > 100) {
          console.log(`⏸️ Gap until next viseme: ${gap.toFixed(0)}ms`);
        }
        if (this.currentViseme !== 'neutral') {
          this.previousViseme = this.currentViseme;
          this.currentViseme = 'neutral';
          this.transitionProgress = 0;
        }
      }
    }

    if (this.visemeQueue.length === 0 && !frame) {
      if (this.isPlaying && !this.isAudioStreaming) {
        console.warn("⚠️ Viseme queue exhausted and audio stopped!");
        this.isPlaying = false;
        this.currentViseme = 'neutral';
      }
      return 'neutral';
    }

    return this.currentViseme;
  }

  getCurrentMorphTargets(): Expression {
    const currentExpression = VISEME_MAPPINGS[this.currentViseme] || VISEME_MAPPINGS.neutral;
    
    if (this.transitionProgress < 1.0) {
      const previousExpression = VISEME_MAPPINGS[this.previousViseme] || VISEME_MAPPINGS.neutral;
      return lerpExpression(previousExpression, currentExpression, this.transitionProgress);
    }
    
    return currentExpression;
  }

  reset(): void {
    console.log("🔄 LipSyncEngine reset");
    this.visemeQueue = [];
    this.currentViseme = 'neutral';
    this.previousViseme = 'neutral';
    this.isPlaying = false;
    this.isAudioStreaming = false;
    this.audioStartTime = 0;
    this.audioContext = null;
    this.transitionProgress = 1.0;
    this.lastLogTime = 0;
  }

  stop(): void {
    this.isPlaying = false;
    this.isAudioStreaming = false;
    this.currentViseme = 'neutral';
    console.log("⏹️ Lip sync stopped");
  }

  getQueueLength(): number {
    return this.visemeQueue.length;
  }

  isActive(): boolean {
    return this.isPlaying;
  }

  getDebugInfo(): object {
    if (!this.audioContext) {
      return { status: 'not started' };
    }

    const elapsed = (this.audioContext.currentTime - this.audioStartTime) * 1000;
    return {
      isPlaying: this.isPlaying,
      isAudioStreaming: this.isAudioStreaming,
      currentViseme: this.currentViseme,
      queueLength: this.visemeQueue.length,
      elapsedTime: `${elapsed.toFixed(0)}ms`,
      audioContextTime: `${this.audioContext.currentTime.toFixed(3)}s`,
      startTime: `${this.audioStartTime.toFixed(3)}s`,
      transitionProgress: this.transitionProgress.toFixed(2)
    };
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
        const currentValue = headRef.morphTargetInfluences[index] || 0;
        const smoothValue = currentValue + (value - currentValue) * 0.3;
        headRef.morphTargetInfluences[index] = smoothValue;
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

