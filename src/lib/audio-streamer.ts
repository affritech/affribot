import {
  createWorketFromSrc,
  registeredWorklets,
} from "./audioworklet-registry";

// ============================================
// IMPORT LIP SYNC SYSTEMS
// ============================================
import { LipSyncEngine } from "./LipSyncSystem";
import { getRhubarbProcessor } from "./RhubarbLipSync";

export class AudioStreamer {
  private sampleRate: number = 24000;
  private bufferSize: number = 7680;
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private isStreamComplete: boolean = false;
  private checkInterval: number | null = null;
  private scheduledTime: number = 0;
  private initialBufferTime: number = 0.1;
  public gainNode: GainNode;
  public source: AudioBufferSourceNode;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;

  private globalPlaybackTime: number = 0; // ✅ persistent timeline for Rhubarb sync

  public onComplete = () => {};

  // ============================================
  // LIP SYNC PROPERTIES
  // ============================================
  public lipSyncEngine: LipSyncEngine | null = null;
  private lipSyncEnabled: boolean = false;
  private useRhubarb: boolean = true;

  // Accumulate audio for Rhubarb batch processing
  private audioBuffer: Float32Array[] = [];
  private audioBufferDuration: number = 0;
  private readonly RHUBARB_BATCH_SIZE: number = 1.0; // Process 1s chunks

  constructor(public context: AudioContext) {
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
  }

  // ============================================
  // ENABLE/DISABLE LIP SYNC
  // ============================================
  
  enableLipSync(engine: LipSyncEngine): void {
    this.lipSyncEngine = engine;
    this.lipSyncEngine.setAudioContext(this.context);
    this.lipSyncEnabled = true;
    console.log("✅ Lip sync enabled with Rhubarb");
  }

  disableLipSync(): void {
    this.lipSyncEnabled = false;
    console.log("❌ Lip sync disabled");
  }

  async addWorklet<T extends (d: any) => void>(
    workletName: string,
    workletSrc: string,
    handler: T
  ): Promise<this> {
    let workletsRecord = registeredWorklets.get(this.context);
    if (workletsRecord && workletsRecord[workletName]) {
      workletsRecord[workletName].handlers.push(handler);
      return Promise.resolve(this);
    }

    if (!workletsRecord) {
      registeredWorklets.set(this.context, {});
      workletsRecord = registeredWorklets.get(this.context)!;
    }

    workletsRecord[workletName] = { handlers: [handler] };

    const src = createWorketFromSrc(workletName, workletSrc);
    await this.context.audioWorklet.addModule(src);
    const worklet = new AudioWorkletNode(this.context, workletName);
    workletsRecord[workletName].node = worklet;
    return this;
  }

  // ============================================
  // PCM16 → Float32 conversion
  // ============================================
  private _processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);
    for (let i = 0; i < chunk.length / 2; i++) {
      try {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768;
      } catch (e) {
        console.error(e);
      }
    }
    return float32Array;
  }

  // ============================================
  // ADD PCM16 AUDIO STREAM
  // ============================================
  addPCM16(chunk: Uint8Array) {
    this.isStreamComplete = false;
    let processingBuffer = this._processPCM16Chunk(chunk);

    // RHUBARB LIP SYNC
    if (this.lipSyncEnabled && this.lipSyncEngine && this.useRhubarb) {
      this.audioBuffer.push(new Float32Array(processingBuffer));
      this.audioBufferDuration += processingBuffer.length / this.sampleRate;

      if (this.audioBufferDuration >= this.RHUBARB_BATCH_SIZE) {
        this.processAccumulatedAudio();
      }
    }

    // AUDIO QUEUE PLAYBACK
    while (processingBuffer.length >= this.bufferSize) {
      const buffer = processingBuffer.slice(0, this.bufferSize);
      this.audioQueue.push(buffer);
      processingBuffer = processingBuffer.slice(this.bufferSize);
    }
    if (processingBuffer.length > 0) this.audioQueue.push(processingBuffer);

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.scheduleNextBuffer();
    }
  }

  // ============================================
  // RHUBARB PROCESSING (batch every 1s)
  // ============================================
  private async processAccumulatedAudio(): Promise<void> {
    if (this.audioBuffer.length === 0) return;

    const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    const combinedAudio = new Float32Array(totalLength);
    let offset = 0;
    for (const buffer of this.audioBuffer) {
      combinedAudio.set(buffer, offset);
      offset += buffer.length;
    }

    this.audioBuffer = [];
    this.audioBufferDuration = 0;

    try {
      const rhubarbProcessor = getRhubarbProcessor();
      const visemeFrames = await rhubarbProcessor.processAudio(combinedAudio, this.sampleRate);

      if (visemeFrames.length > 0) {
        // ✅ Use persistent playback offset for perfect sync
        const audioStartOffset = this.globalPlaybackTime * 1000;
        this.lipSyncEngine?.addVisemes(visemeFrames, audioStartOffset);
        console.log(`🎤 Added ${visemeFrames.length} Rhubarb visemes (offset=${audioStartOffset.toFixed(0)}ms)`);
      }
    } catch (error) {
      console.error("❌ Rhubarb processing error:", error);
    }
  }

  // ============================================
  // CREATE AUDIO BUFFER
  // ============================================
  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    const audioBuffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  // ============================================
  // SCHEDULE AUDIO BUFFERS (fixed version)
  // ============================================
  private scheduleNextBuffer() {
    const SCHEDULE_AHEAD_TIME = 0.2;

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      source.start(startTime);

      // ✅ Maintain persistent playback timeline
      this.globalPlaybackTime += audioBuffer.duration;
      this.scheduledTime = startTime + audioBuffer.duration;

      source.onended = () => this.scheduleNextBuffer();
    }

    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false;
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      } else {
        if (!this.checkInterval) {
          this.checkInterval = window.setInterval(() => {
            if (this.audioQueue.length > 0) {
              this.scheduleNextBuffer();
            }
          }, 100) as unknown as number;
        }
      }
    } else {
      const nextCheckTime =
        (this.scheduledTime - this.context.currentTime) * 1000;
      setTimeout(
        () => this.scheduleNextBuffer(),
        Math.max(0, nextCheckTime - 50)
      );
    }
  }

  // ============================================
  // STOP STREAM
  // ============================================
  stop() {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;
    this.globalPlaybackTime = 0; // ✅ reset timeline

    this.audioBuffer = [];
    this.audioBufferDuration = 0;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.lipSyncEnabled && this.lipSyncEngine) {
      this.lipSyncEngine.clearFutureVisemes();
      this.lipSyncEngine.stop();
    }

    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + 0.1
    );

    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }, 200);
  }

  // ============================================
  // RESUME STREAM
  // ============================================
  async resume() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  // ============================================
  // MARK STREAM COMPLETE
  // ============================================
  complete() {
    this.isStreamComplete = true;
    if (this.audioBuffer.length > 0) this.processAccumulatedAudio();
    this.onComplete();
  }
}


