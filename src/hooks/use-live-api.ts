import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenAILiveClient } from "../lib/genai-live-client";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { LiveConnectConfig } from "@google/genai";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  audioStreamer: AudioStreamer | null;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const shouldPlayRef = useRef(true);

  const [model, setModel] = useState<string>("models/gemini-2.0-flash-exp");
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);

  // Initialize audio streamer
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            console.log("✅ Audio worklet initialized");
          });
      });
    }

    return () => {
      stopAllAudio();
    };
  }, []);

  // Stop all audio immediately
  const stopAllAudio = useCallback(() => {
    console.log("🛑 Stopping all audio sources:", activeSourcesRef.current.length);
    
    // Stop and disconnect all active sources
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source may already be stopped
      }
    });
    
    activeSourcesRef.current = [];
    shouldPlayRef.current = false;
    audioStreamerRef.current?.stop();
  }, []);

  useEffect(() => {
    const onOpen = () => {
      console.log("🔗 Connection opened");
      setConnected(true);
      shouldPlayRef.current = true;
    };

    const onClose = () => {
      console.log("🔌 Connection closed");
      setConnected(false);
      stopAllAudio();
    };

    const onError = (error: ErrorEvent) => {
      console.error("❌ Connection error:", error);
    };

    const stopAudioStreamer = () => {
      console.log("🛑 Interruption detected - stopping ALL audio immediately");
      stopAllAudio();
      // Allow new audio after brief delay
      setTimeout(() => {
        shouldPlayRef.current = true;
        console.log("✅ Ready for new audio");
      }, 50);
    };

    const onAudio = (data: ArrayBuffer) => {
      if (!shouldPlayRef.current) {
        console.log("🚫 Skipping audio - interrupted");
        return;
      }

      const chunk = new Uint8Array(data);
      
      // Track this audio source
      if (audioStreamerRef.current) {
        const streamer = audioStreamerRef.current;
        
        // If AudioStreamer exposes sources, track them
        // Otherwise, we need to modify AudioStreamer (see below)
        streamer.addPCM16(chunk);
      }
    };

    const onTurnComplete = () => {
      console.log("✅ Turn complete");
    };

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("turncomplete", onTurnComplete);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .off("turncomplete", onTurnComplete)
        .disconnect();
      
      stopAllAudio();
    };
  }, [client, stopAllAudio]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
    
    stopAllAudio();
    shouldPlayRef.current = true;
    
    client.disconnect();
    await client.connect(model, config);
  }, [client, config, model, stopAllAudio]);

  const disconnect = useCallback(async () => {
    stopAllAudio();
    client.disconnect();
    setConnected(false);
  }, [client, stopAllAudio]);

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    connect,
    disconnect,
    volume,
    audioStreamer: audioStreamerRef.current,
  };
}