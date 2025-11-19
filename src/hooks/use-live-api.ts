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

  const [model, setModel] = useState<string>("models/gemini-2.0-flash-exp");
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);

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
  }, []);

  useEffect(() => {
    const onOpen = () => {
      console.log("🔗 Connection opened");
      setConnected(true);
    };

    const onClose = () => {
      console.log("🔌 Connection closed");
      setConnected(false);
      audioStreamerRef.current?.stop();
    };

    const onError = (error: ErrorEvent) => {
      console.error("❌ Connection error:", error);
    };

    const stopAudioStreamer = () => {
      console.log("🛑 INTERRUPTION - Stopping audio immediately");
      
      // This is the critical fix - stop() then startNewResponse()
      audioStreamerRef.current?.stop();
      
      // Small delay to ensure stop completes, then reset for next response
      setTimeout(() => {
        audioStreamerRef.current?.startNewResponse();
        console.log("✅ Ready for new response");
      }, 50);
    };

    const onAudio = (data: ArrayBuffer) => {
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));
    };

    const onTurnComplete = () => {
      console.log("✅ Turn complete");
      audioStreamerRef.current?.complete();
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
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
    client.disconnect();
    await client.connect(model, config);
  }, [client, config, model]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [client]);

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