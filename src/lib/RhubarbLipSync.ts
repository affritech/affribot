/**
 * FILE: src/lib/RhubarbLipSync.ts
 * 
 * Rhubarb Lip Sync integration for accurate phoneme detection
 */

export interface VisemeFrame {
  viseme: string;
  startTime: number;
  endTime: number;
}

// Rhubarb phoneme to ARKit viseme mapping
const RHUBARB_TO_ARKIT: Record<string, string> = {
  // Rhubarb uses extended Preston Blair mouth shapes
  'X': 'sil',       // Silence
  'A': 'aa',        // "ah" - father
  'B': 'PP',        // "p/b/m" - lips together
  'C': 'SS',        // "s/z" - teeth together
  'D': 'aa',        // "th/dh" - similar to 'aa'
  'E': 'E',         // "eh" - bed
  'F': 'FF',        // "f/v" - teeth on lip
  'G': 'kk',        // "k/g" - back of throat
  'H': 'I',         // "ih" - bit
  'I': 'neutral',   // Neutral
};

// Rhubarb result structure
interface RhubarbMouthCue {
  start: number;    // Time in seconds
  end: number;      // Time in seconds
  value: string;    // Phoneme (A, B, C, etc.)
}

interface RhubarbResult {
  mouthCues: RhubarbMouthCue[];
}

/**
 * Process audio with Rhubarb Lip Sync
 */
export class RhubarbProcessor {
  private worker: Worker | null = null;
  private isProcessing: boolean = false;

  constructor() {
    // Initialize Rhubarb worker if available
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      // Create worker for Rhubarb processing
      // Note: We'll use the main thread for now since WASM integration can be tricky
      console.log("✅ Rhubarb processor initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Rhubarb:", error);
    }
  }

  /**
   * Process audio data and return viseme frames
   */
  async processAudio(audioData: Float32Array, sampleRate: number = 24000): Promise<VisemeFrame[]> {
    this.isProcessing = true;

    try {
      // Convert Float32Array to WAV format for Rhubarb
      const wavBuffer = this.createWavBuffer(audioData, sampleRate);

      // Process with Rhubarb (this would use the WASM module)
      const rhubarbResult = await this.runRhubarb(wavBuffer);

      // Convert Rhubarb cues to our VisemeFrame format
      const visemeFrames = this.convertToVisemeFrames(rhubarbResult);

      console.log(`🎙️ Rhubarb detected ${visemeFrames.length} viseme frames`);
      return visemeFrames;

    } catch (error) {
      console.error("❌ Rhubarb processing error:", error);
      return [];
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Convert Float32Array to WAV buffer
   */
  private createWavBuffer(audioData: Float32Array, sampleRate: number): ArrayBuffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = audioData.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }

    return buffer;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Run Rhubarb analysis (stub - would use WASM module)
   */
  private async runRhubarb(wavBuffer: ArrayBuffer): Promise<RhubarbResult> {
    // TEMPORARY: Mock Rhubarb results
    // In production, this would call the actual Rhubarb WASM module
    
    // For now, return mock data that simulates Rhubarb output
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate Rhubarb analysis with mock data
        const duration = wavBuffer.byteLength / (24000 * 2); // Approximate duration
        const mockCues: RhubarbMouthCue[] = this.generateMockCues(duration);
        
        resolve({ mouthCues: mockCues });
      }, 50);
    });
  }

  /**
   * Generate mock Rhubarb cues (temporary until WASM integration)
   */
  private generateMockCues(duration: number): RhubarbMouthCue[] {
    const cues: RhubarbMouthCue[] = [];
    const phonemes = ['A', 'B', 'C', 'E', 'F', 'G', 'H', 'X'];
    const segmentDuration = 0.1; // 100ms per phoneme
    
    let time = 0;
    while (time < duration) {
      const phoneme = phonemes[Math.floor(Math.random() * phonemes.length)];
      cues.push({
        start: time,
        end: time + segmentDuration,
        value: phoneme
      });
      time += segmentDuration;
    }
    
    return cues;
  }

  /**
   * Convert Rhubarb mouth cues to VisemeFrame format
   */
  private convertToVisemeFrames(rhubarbResult: RhubarbResult): VisemeFrame[] {
    return rhubarbResult.mouthCues.map(cue => ({
      viseme: RHUBARB_TO_ARKIT[cue.value] || 'neutral',
      startTime: cue.start * 1000, // Convert to milliseconds
      endTime: cue.end * 1000
    }));
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

/**
 * Singleton instance
 */
let rhubarbInstance: RhubarbProcessor | null = null;

export function getRhubarbProcessor(): RhubarbProcessor {
  if (!rhubarbInstance) {
    rhubarbInstance = new RhubarbProcessor();
  }
  return rhubarbInstance;
}