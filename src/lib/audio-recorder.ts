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
        // CRITICAL: Enhanced audio constraints for echo cancellation
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,        // MUST BE TRUE
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.sampleRate,
          channelCount: 1,
        };

        // Add experimental constraints for browsers that support them
        const experimentalConstraints: any = {
          ...audioConstraints,
          // Google-specific echo cancellation (Chrome)
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          // Advanced echo cancellation
          echoCancellationType: 'system', // Use system-level AEC
        };

        // Try experimental constraints first, fall back to standard
        let constraints: MediaStreamConstraints;
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({
            audio: experimentalConstraints,
          });
          console.log("✅ Using experimental audio constraints");
        } catch (e) {
          console.log("⚠️ Experimental constraints not supported, using standard");
          this.stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
          });
        }

        // CRITICAL: Verify echo cancellation is active
        const audioTrack = this.stream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();
        console.log("✅ Audio Track Settings:", {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount,
        });

        // CRITICAL WARNING: If echo cancellation is NOT active
        if (!settings.echoCancellation) {
          console.error("❌ CRITICAL: Echo cancellation NOT active!");
          console.error("❌ Audio feedback WILL occur on speaker mode!");
          console.error("❌ Solution: Use headphones or external echo cancellation");
          
          // Optional: Show UI warning to user
          this.emit('warning', {
            type: 'echo-cancellation-disabled',
            message: 'Echo cancellation is not working. Please use headphones to avoid feedback.'
          });
        } else {
          console.log("✅ Echo cancellation is ACTIVE");
        }

        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        const workletName = "audio-recorder-worklet";
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName
        );

        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          // worklet processes recording floats and messages converted buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emit("data", arrayBufferString);
          }
        };
        this.source.connect(this.recordingWorklet);

        // vu meter worklet
        const vuWorkletName = "vu-meter";
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket)
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit("volume", ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
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
    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.recording = false;
    };
    if (this.starting) {
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}