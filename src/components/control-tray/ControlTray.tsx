import cn from "classnames";
import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio-recorder";
import AudioPulse from "../audio-pulse/AudioPulse";
import "./control-tray.scss";
//import SettingsDialog from "../settings-dialog/SettingsDialog";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  enableEditingSettings?: boolean;
  onLanguageChange?: (languageCode: string, languageName: string) => void;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <button className="action-button" onClick={stop} title="Stop stream">
        <span className="material-symbols-outlined">{onIcon}</span>
      </button>
    ) : (
      <button className="action-button" onClick={start} title="Start stream">
        <span className="material-symbols-outlined">{offIcon}</span>
      </button>
    )
);

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  
];

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
  enableEditingSettings,
  onLanguageChange,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const { client, connected, connect, disconnect, volume } = useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageMenu]);

  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  const handleLanguageSelect = (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      setSelectedLanguage(languageCode);
      setShowLanguageMenu(false);
      
      console.log('Selected language:', languageCode, language.name);
      
      // Call the callback to notify parent component
      if (onLanguageChange) {
        onLanguageChange(languageCode, language.name);
      }
    }
  };

  // Debug: log when menu state changes
  useEffect(() => {
    console.log('showLanguageMenu changed to:', showLanguageMenu);
  }, [showLanguageMenu]);

  return (
    <>
      <section className="control-tray">
        <canvas style={{ display: "none" }} ref={renderCanvasRef} />
        <nav className={cn("actions-nav", { disabled: !connected })}>
          <button
            className={cn("action-button mic-button")}
            onClick={() => setMuted(!muted)}
            title={muted ? "Unmute" : "Mute"}
          >
            {!muted ? (
              <span className="material-symbols-outlined filled">mic</span>
            ) : (
              <span className="material-symbols-outlined filled">mic_off</span>
            )}
          </button>

          {/*<div className="action-button no-action outlined">
            <AudioPulse volume={volume} active={connected} hover={false} />
          </div>*/}

          {supportsVideo && (
            <>
             {/* <MediaStreamButton
                isStreaming={screenCapture.isStreaming}
                start={changeStreams(screenCapture)}
                stop={changeStreams()}
                onIcon="cancel_presentation"
                offIcon="present_to_all"
              /> */}
              <MediaStreamButton
                isStreaming={webcam.isStreaming}
                start={changeStreams(webcam)}
                stop={changeStreams()}
                onIcon="videocam_off"
                offIcon="videocam"
              />
            </>
          )}

          {children}
        </nav>

        {/* Language Selector - OUTSIDE nav so it's always clickable */}
        <div style={{ position: 'relative', pointerEvents: 'auto' }} ref={languageMenuRef}>
          <button
            className="action-button"
            style={{ pointerEvents: 'auto' }}
            onClick={() => {
              console.log('Language button clicked, current state:', showLanguageMenu);
              setShowLanguageMenu(!showLanguageMenu);
            }}
            title="Select Language"
          >
            <span className="material-symbols-outlined">language</span>
          </button>
          
          {showLanguageMenu && (
            <div style={{
              position: 'fixed',
              bottom: '200px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              maxHeight: '300px',
              overflowY: 'auto',
              minWidth: '200px',
              zIndex: 9999,
            }}>
              <div style={{ 
                padding: '12px 16px', 
                fontWeight: '600', 
                borderBottom: '1px solid #444',
                color: '#fff',
                fontSize: '14px',
              }}>
                Select Language
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  style={{
                    display: 'block',
                    position: 'relative',
                    left: '10px',
                    bottom: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: selectedLanguage === lang.code ? '#333' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: selectedLanguage === lang.code ? '600' : '400',
                    color: selectedLanguage === lang.code ? '#fff' : '#ccc',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = selectedLanguage === lang.code ? '#333' : '#2a2a2a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = selectedLanguage === lang.code ? '#333' : 'transparent';
                  }}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={cn("connection-container", { connected })}>
          <div className="connection-button-container">
            <button
              ref={connectButtonRef}
              className={cn("action-button connect-toggle", { connected })}
              onClick={connected ? disconnect : connect}
              title={connected ? "Disconnect" : "Connect"}
            >
              <span className="material-symbols-outlined filled">
                {connected ? "pause" : "play_arrow"}
              </span>
            </button>
          </div>
          <span className="text-indicator">Live...</span>
        </div>
        
        {/*enableEditingSettings && <SettingsDialog />*/}
      </section>
    </>
  );
}

export default memo(ControlTray);