import { audioContext } from "./utils";
import AudioRecordingWorklet from "./worklets/audio-processing";
import VolMeterWorket from "./worklets/vol-meter";

import { createWorketFromSrc } from "./audioworklet-registry";
import EventEmitter from "eventemitter3";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  // Audio processing nodes
  private highpassFilter: BiquadFilterNode | undefined;
  private compressor: DynamicsCompressorNode | undefined;
  private gainNode: GainNode | undefined;
  
  // Voice Activity Detection
  private vadThreshold: number = 0.01;
  private silenceTimeout: number | null = null;
  private isSpeaking: boolean = false;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    this.starting = new Promise(async (resolve, reject) => {
      try {
        // CRITICAL: Maximum echo cancellation and noise reduction
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          sampleRate: { ideal: this.sampleRate },
          channelCount: { ideal: 1 },
          // Advanced constraints
          latency: { ideal: 0 },
        };

        // Try to get the best possible audio input
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });

        // Verify settings
        const audioTrack = this.stream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();
        console.log("🎤 Audio Track Settings:", {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount,
        });

        if (!settings.echoCancellation) {
          console.warn("⚠️ Echo cancellation NOT active - use headphones!");
          this.emit('warning', {
            type: 'echo-cancellation-disabled',
            message: 'Use headphones to avoid audio feedback.'
          });
        }

        // Create audio context
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        // 🔥 CRITICAL: High-pass filter to remove low-frequency noise
        this.highpassFilter = this.audioContext.createBiquadFilter();
        this.highpassFilter.type = "highpass";
        this.highpassFilter.frequency.value = 80; // Remove rumble below 80Hz
        this.highpassFilter.Q.value = 0.7;

        // 🔥 CRITICAL: Compressor for consistent volume and clarity
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -30;
        this.compressor.knee.value = 20;
        this.compressor.ratio.value = 8;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.15;

        // 🔥 CRITICAL: Gain control for optimal recording level
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.2; // Slight boost for clarity

        // Connect audio processing chain
        this.source
          .connect(this.highpassFilter)
          .connect(this.compressor)
          .connect(this.gainNode);

        // Setup recording worklet
        const workletName = "audio-recorder-worklet";
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName
        );

        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emit("data", arrayBufferString);
          }
        };

        // Connect gain node to recording worklet
        this.gainNode.connect(this.recordingWorklet);

        // Setup VU meter worklet
        const vuWorkletName = "vu-meter";
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket)
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          const volume = ev.data.volume;
          this.emit("volume", volume);
          
          // 🔥 CRITICAL: Voice Activity Detection
          // Only send audio when actually speaking
          if (volume > this.vadThreshold) {
            if (!this.isSpeaking) {
              this.isSpeaking = true;
              console.log("🗣️ Speech detected");
              this.emit("speech-start");
            }
            
            // Clear silence timeout
            if (this.silenceTimeout) {
              clearTimeout(this.silenceTimeout);
              this.silenceTimeout = null;
            }
          } else {
            // Start silence timeout
            if (this.isSpeaking && !this.silenceTimeout) {
              this.silenceTimeout = window.setTimeout(() => {
                this.isSpeaking = false;
                console.log("🤐 Speech ended");
                this.emit("speech-end");
                this.silenceTimeout = null;
              }, 500); // 500ms of silence before stopping
            }
          }
        };

        // Connect gain node to VU meter
        this.gainNode.connect(this.vuWorklet);

        this.recording = true;
        console.log("✅ Audio recorder started with noise reduction");
        resolve();
        this.starting = null;
      } catch (error) {
        console.error("❌ Error starting audio recorder:", error);
        reject(error);
        this.starting = null;
      }
    });
  }

  stop() {
    const handleStop = () => {
      // Disconnect all nodes
      this.source?.disconnect();
      this.highpassFilter?.disconnect();
      this.compressor?.disconnect();
      this.gainNode?.disconnect();
      this.recordingWorklet?.disconnect();
      this.vuWorklet?.disconnect();

      // Stop all tracks
      this.stream?.getTracks().forEach((track) => track.stop());

      // Clear timers
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }

      // Reset state
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.highpassFilter = undefined;
      this.compressor = undefined;
      this.gainNode = undefined;
      this.recording = false;
      this.isSpeaking = false;

      console.log("🛑 Audio recorder stopped");
    };

    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }

  // Adjust sensitivity for voice activity detection
  setVADThreshold(threshold: number) {
    this.vadThreshold = threshold;
    console.log(`🎚️ VAD threshold set to ${threshold}`);
  }

  // Adjust input gain
  setInputGain(gain: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = gain;
      console.log(`🎚️ Input gain set to ${gain}`);
    }
  }

  // Get current audio settings
  getSettings() {
    if (!this.stream) return null;
    
    const audioTrack = this.stream.getAudioTracks()[0];
    return audioTrack.getSettings();
  }
}