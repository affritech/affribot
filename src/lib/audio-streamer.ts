import {
  createWorketFromSrc,
  registeredWorklets,
} from "./audioworklet-registry";

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
  private initialBufferTime: number = 0.15;
  public gainNode: GainNode;
  public source: AudioBufferSourceNode;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;

  private audioStartTime: number = 0;
  private hasStarted: boolean = false;
  private totalProcessedDuration: number = 0;
  
  private processedChunks: Set<string> = new Set();
  private lastScheduledSource: AudioBufferSourceNode | null = null;

  public onComplete = () => {};

  public lipSyncEngine: LipSyncEngine | null = null;
  private lipSyncEnabled: boolean = false;
  private useRhubarb: boolean = true;

  private audioBuffer: Float32Array[] = [];
  private audioBufferDuration: number = 0;
  private audioBufferStartTime: number = 0;
  private processingInProgress: boolean = false;
  private readonly RHUBARB_BATCH_SIZE: number = 1.0;

  constructor(public context: AudioContext) {
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
  }

  enableLipSync(engine: LipSyncEngine): void {
    this.lipSyncEngine = engine;
    this.lipSyncEngine.setAudioStartTime(this.context);
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

  private hashChunk(chunk: Uint8Array): string {
    let hash = 0;
    for (let i = 0; i < Math.min(chunk.length, 100); i++) {
      hash = ((hash << 5) - hash) + chunk[i];
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  startNewResponse(): void {
    console.log("🔄 Starting new response - resetting lip sync and audio");
    
    this.hasStarted = false;
    this.audioStartTime = 0;
    this.totalProcessedDuration = 0;
    
    this.audioBuffer = [];
    this.audioBufferDuration = 0;
    this.audioBufferStartTime = 0;
    this.processingInProgress = false;
    
    this.processedChunks.clear();
    
    this.audioQueue = [];
    this.isPlaying = false;
    
    if (this.lipSyncEngine) {
      this.lipSyncEngine.reset();
    }
  }

  addPCM16(chunk: Uint8Array) {
    const chunkHash = this.hashChunk(chunk);
    if (this.processedChunks.has(chunkHash)) {
      console.warn("⚠️ Duplicate chunk detected, skipping");
      return;
    }
    this.processedChunks.add(chunkHash);
    
    if (this.processedChunks.size > 100) {
      const arr = Array.from(this.processedChunks);
      this.processedChunks = new Set(arr.slice(-100));
    }

    this.isStreamComplete = false;
    let processingBuffer = this._processPCM16Chunk(chunk);

    if (this.lipSyncEnabled && this.lipSyncEngine && this.useRhubarb) {
      if (this.audioBuffer.length === 0) {
        this.audioBufferStartTime = this.scheduledTime;
      }

      this.audioBuffer.push(new Float32Array(processingBuffer));
      this.audioBufferDuration += processingBuffer.length / this.sampleRate;

      if (this.audioBufferDuration >= this.RHUBARB_BATCH_SIZE && !this.processingInProgress) {
        this.processAccumulatedAudio();
      }
    }

    while (processingBuffer.length >= this.bufferSize) {
      const buffer = processingBuffer.slice(0, this.bufferSize);
      this.audioQueue.push(buffer);
      processingBuffer = processingBuffer.slice(this.bufferSize);
    }

    if (processingBuffer.length > 0) {
      this.audioQueue.push(processingBuffer);
    }

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.scheduleNextBuffer();
    }
  }

  private async processAccumulatedAudio(): Promise<void> {
    if (this.audioBuffer.length === 0 || this.processingInProgress) return;

    this.processingInProgress = true;

    try {
      const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
      const combinedAudio = new Float32Array(totalLength);
      let offset = 0;
      for (const buffer of this.audioBuffer) {
        combinedAudio.set(buffer, offset);
        offset += buffer.length;
      }

      const batchStartTime = this.totalProcessedDuration * 1000;
      this.totalProcessedDuration += combinedAudio.length / this.sampleRate;

      const audioStartTime = this.audioBufferStartTime;
      const chunkDuration = combinedAudio.length / this.sampleRate;

      console.log(`🎯 Processing ${chunkDuration.toFixed(3)}s chunk starting at ${audioStartTime.toFixed(3)}s`);

      this.audioBuffer = [];
      this.audioBufferDuration = 0;

      const rhubarbProcessor = getRhubarbProcessor();
      const visemeFrames = await rhubarbProcessor.processAudio(combinedAudio, this.sampleRate);

      if (visemeFrames.length > 0) {
        this.lipSyncEngine?.addVisemes(visemeFrames, batchStartTime);
        console.log(`🎤 Added ${visemeFrames.length} Rhubarb visemes`);
      }
    } catch (error) {
      console.error("❌ Rhubarb processing error:", error);
    } finally {
      this.processingInProgress = false;
      
      if (this.audioBufferDuration >= this.RHUBARB_BATCH_SIZE) {
        setTimeout(() => this.processAccumulatedAudio(), 10);
      }
    }
  }

  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    const audioBuffer = this.context.createBuffer(
      1,
      audioData.length,
      this.sampleRate
    );
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  private scheduleNextBuffer() {
    const SCHEDULE_AHEAD_TIME = 0.25;

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      const source = this.context.createBufferSource();

      if (this.lastScheduledSource) {
        try {
          this.lastScheduledSource.onended = null;
        } catch (e) {
          // Source may already be stopped
        }
      }
      this.lastScheduledSource = source;

      if (this.audioQueue.length === 0) {
        if (this.endOfQueueAudioSource) {
          this.endOfQueueAudioSource.onended = null;
        }
        this.endOfQueueAudioSource = source;
        source.onended = () => {
          if (
            !this.audioQueue.length &&
            this.endOfQueueAudioSource === source
          ) {
            this.endOfQueueAudioSource = null;
            this.onComplete();
          }
        };
      }

      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const worklets = registeredWorklets.get(this.context);

      if (worklets) {
        Object.entries(worklets).forEach(([workletName, graph]) => {
          const { node, handlers } = graph;
          if (node) {
            source.connect(node);
            node.port.onmessage = function (ev: MessageEvent) {
              handlers.forEach((handler) => {
                handler.call(node.port, ev);
              });
            };
            node.connect(this.context.destination);
          }
        });
      }

      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      source.start(startTime);

      if (!this.hasStarted) {
        this.audioStartTime = startTime;
        this.hasStarted = true;
        
        if (this.lipSyncEngine) {
          this.lipSyncEngine.setAudioStartTime(this.context);
          console.log(`⏰ Audio started at ${startTime.toFixed(3)}s`);
        }
      }

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

  stop() {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;
    
    this.hasStarted = false;
    this.audioStartTime = 0;
    this.totalProcessedDuration = 0;
    this.processedChunks.clear();

    this.audioBuffer = [];
    this.audioBufferDuration = 0;
    this.processingInProgress = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.lipSyncEnabled && this.lipSyncEngine) {
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

  async resume() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  complete() {
    this.isStreamComplete = true;
    
    if (this.audioBuffer.length > 0 && !this.processingInProgress) {
      this.processAccumulatedAudio();
    }
    
    this.onComplete();
  }
}