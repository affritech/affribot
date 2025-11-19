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
  
  // CRITICAL: Track all active audio sources for instant stopping
  private activeSources: AudioBufferSourceNode[] = [];
  private currentResponseId: number = 0;
  
  // CRITICAL: Adaptive buffering for poor connections
  private initialBufferTime: number = 0.3;
  private minBufferTime: number = 0.2;
  private maxBufferTime: number = 0.6;
  private adaptiveBufferEnabled: boolean = true;
  
  // Network monitoring
  private lastPlaybackTime: number = 0;
  private underrunCount: number = 0;
  private consecutiveGoodPlayback: number = 0;
  private networkMonitorInterval: number | null = null;
  
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
  
  private pendingCompletion: boolean = false;
  
  // FIX: Track if worklets are already connected to destination
  private workletsConnected: boolean = false;

  constructor(public context: AudioContext) {
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
    
    this.monitorNetworkQuality();
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

  private monitorNetworkQuality(): void {
    if (this.networkMonitorInterval !== null) {
      clearInterval(this.networkMonitorInterval);
    }
    
    this.networkMonitorInterval = window.setInterval(() => {
      if (!this.adaptiveBufferEnabled) return;
      
      const now = this.context.currentTime;
      const timeSinceLastPlay = now - this.lastPlaybackTime;
      
      if (this.isPlaying && timeSinceLastPlay > 0.5) {
        this.underrunCount++;
        this.consecutiveGoodPlayback = 0;
        
        if (this.underrunCount > 2) {
          this.initialBufferTime = Math.min(
            this.initialBufferTime + 0.1,
            this.maxBufferTime
          );
          console.log(`📡 Poor connection detected. Buffer increased to ${this.initialBufferTime.toFixed(2)}s`);
          this.underrunCount = 0;
        }
      } else if (this.isPlaying) {
        this.consecutiveGoodPlayback++;
        
        if (this.consecutiveGoodPlayback > 10) {
          this.initialBufferTime = Math.max(
            this.initialBufferTime - 0.05,
            this.minBufferTime
          );
          console.log(`📡 Good connection. Buffer decreased to ${this.initialBufferTime.toFixed(2)}s`);
          this.consecutiveGoodPlayback = 0;
        }
      }
    }, 1000) as unknown as number;
  }

  startNewResponse(): void {
    console.log("🔄 Starting new response - resetting state");
    
    // Increment response ID to invalidate any in-flight audio
    this.currentResponseId++;
    
    this.hasStarted = false;
    this.audioStartTime = 0;
    this.totalProcessedDuration = 0;
    
    this.audioBuffer = [];
    this.audioBufferDuration = 0;
    this.audioBufferStartTime = 0;
    this.processingInProgress = false;
    this.pendingCompletion = false;
    
    this.processedChunks.clear();
    
    this.audioQueue = [];
    this.isPlaying = false;
    this.isStreamComplete = false;
    
    if (this.lipSyncEngine) {
      this.lipSyncEngine.reset();
    }
  }

  addPCM16(chunk: Uint8Array) {
    // Deduplicate chunks
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

    // Lip sync processing
    if (this.lipSyncEnabled && this.lipSyncEngine && this.useRhubarb) {
      if (this.audioBuffer.length === 0) {
        this.audioBufferStartTime = this.hasStarted 
          ? this.scheduledTime 
          : this.context.currentTime + this.initialBufferTime;
      }

      this.audioBuffer.push(new Float32Array(processingBuffer));
      this.audioBufferDuration += processingBuffer.length / this.sampleRate;

      if (this.audioBufferDuration >= this.RHUBARB_BATCH_SIZE && !this.processingInProgress) {
        this.processAccumulatedAudio();
      }
    }

    // Split into chunks
    while (processingBuffer.length >= this.bufferSize) {
      const buffer = processingBuffer.slice(0, this.bufferSize);
      this.audioQueue.push(buffer);
      processingBuffer = processingBuffer.slice(this.bufferSize);
    }

    if (processingBuffer.length > 0) {
      this.audioQueue.push(processingBuffer);
    }

    // Start playing if not already
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
        this.processAccumulatedAudio();
      } else if (this.pendingCompletion && this.audioBuffer.length > 0) {
        await this.processAccumulatedAudio();
        this.onComplete();
      } else if (this.pendingCompletion) {
        this.onComplete();
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
    const SCHEDULE_AHEAD_TIME = this.initialBufferTime + 0.1;
    const responseId = this.currentResponseId;

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      // Check if we've been interrupted
      if (responseId !== this.currentResponseId) {
        console.log("🚫 Response interrupted, stopping schedule");
        return;
      }

      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      const source = this.context.createBufferSource();

      // 🔥 CRITICAL: Track this source for interruption
      this.activeSources.push(source);

      if (this.lastScheduledSource) {
        try {
          this.lastScheduledSource.onended = null;
        } catch (e) {
          // Source may already be stopped
        }
      }
      this.lastScheduledSource = source;

      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      // Connect worklets for volume metering
      const worklets = registeredWorklets.get(this.context);
      if (worklets && !this.workletsConnected) {
        Object.entries(worklets).forEach(([workletName, graph]) => {
          const { node, handlers } = graph;
          if (node) {
            node.connect(this.context.destination);
            
            node.port.onmessage = function (ev: MessageEvent) {
              handlers.forEach((handler) => {
                handler.call(node.port, ev);
              });
            };
          }
        });
        this.workletsConnected = true;
      }
      
      if (worklets) {
        Object.values(worklets).forEach((graph) => {
          if (graph.node) {
            source.connect(graph.node);
          }
        });
      }

      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      source.start(startTime);
      
      this.lastPlaybackTime = startTime;

      // 🔥 CRITICAL: Remove from active sources when naturally finished
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
        
        // Handle queue end
        if (this.audioQueue.length === 0) {
          if (this.endOfQueueAudioSource === source) {
            this.endOfQueueAudioSource = null;
            this.onComplete();
          }
        }
      };

      if (this.audioQueue.length === 0) {
        this.endOfQueueAudioSource = source;
      }

      if (!this.hasStarted) {
        this.audioStartTime = startTime;
        this.hasStarted = true;
        
        if (this.lipSyncEngine) {
          this.lipSyncEngine.setAudioStartTime(this.context);
          console.log(`⏰ Audio started at ${startTime.toFixed(3)}s`);
        }
      }

      this.scheduledTime = startTime + audioBuffer.duration;
    }

    if (this.audioQueue.length > 0) {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      
      const nextCheckTime = (this.scheduledTime - this.context.currentTime) * 1000;
      setTimeout(
        () => this.scheduleNextBuffer(),
        Math.max(0, nextCheckTime - 50)
      );
    } else {
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
    }
  }

  stop() {
    console.log("🛑 STOP called - killing", this.activeSources.length, "active sources");
    
    // 🔥 CRITICAL: Stop ALL scheduled audio sources immediately
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source may already be stopped/disconnected
      }
    });
    this.activeSources = [];
    
    // Clear all state
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;
    
    this.hasStarted = false;
    this.audioStartTime = 0;
    this.totalProcessedDuration = 0;
    this.processedChunks.clear();
    this.pendingCompletion = false;

    this.audioBuffer = [];
    this.audioBufferDuration = 0;
    this.processingInProgress = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.networkMonitorInterval !== null) {
      clearInterval(this.networkMonitorInterval);
      this.networkMonitorInterval = null;
      // Restart network monitoring
      this.monitorNetworkQuality();
    }

    if (this.lipSyncEnabled && this.lipSyncEngine) {
      this.lipSyncEngine.stop();
    }

    // Immediate silence (no fade for interruption)
    this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);

    // Recreate gain node for clean slate
    setTimeout(() => {
      try {
        this.gainNode.disconnect();
      } catch (e) {
        // Already disconnected
      }
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
    }, 50);
  }

  async resume() {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  async complete() {
    this.isStreamComplete = true;
    this.pendingCompletion = true;
    
    if (this.audioBuffer.length > 0 && !this.processingInProgress) {
      await this.processAccumulatedAudio();
    } else if (!this.processingInProgress && this.audioBuffer.length === 0) {
      this.onComplete();
    }
  }
}