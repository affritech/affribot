import { useRef, useState, useEffect } from "react";
import "./App.scss";

import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";

import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import AvatarCustomizer from "./components/AvatarCustomizer";
import LoadingScreen from "./components/LoadingScreen";
import cn from "classnames";
import { LiveClientOptions } from "./types";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

// Camera preset angles
const cameraPresets = {
  front: { position: [0, 0, 8], name: "Front" },
  back: { position: [0, 0, -8], name: "Back" },
  left: { position: [-8, 0, 0], name: "Left" },
  right: { position: [8, 0, 0], name: "Right" },
  topFront: { position: [0, 8, 8], name: "Top Front" },
  topBack: { position: [0, 8, -8], name: "Top Back" },
  top: { position: [0, 10, 0], name: "Top Down" },
  angleRight: { position: [6, 3, 6], name: "Angle Right" },
  angleLeft: { position: [-6, 3, 6], name: "Angle Left" },
  lowAngle: { position: [5, 1, 5], name: "Low Angle" },
  highAngle: { position: [3, 8, 3], name: "High Angle" },
  closeUp: { position: [0, 2, 3], name: "Close Up" },
  wideShot: { position: [0, 5, 15], name: "Wide Shot" },
  dramatic: { position: [-8, 6, -8], name: "Dramatic" },
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("https://files.catbox.moe/x4cg70.glb");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([-3, 1, 8]);
  const [showCameraControls, setShowCameraControls] = useState(true);

  const handleAvatarChange = (newUrl: string) => {
    console.log("🔄 Changing avatar, resetting loading state");
    setIsModelLoaded(false);
    setAvatarUrl(newUrl);
  };

  const handleCameraPreset = (preset: keyof typeof cameraPresets) => {
    const newPosition = cameraPresets[preset].position as [number, number, number];
    setCameraPosition(newPosition);
    
    window.dispatchEvent(new CustomEvent('cameraChange', { 
      detail: { position: newPosition } 
    }));
  };

  useEffect(() => {
    console.log("📊 isModelLoaded changed to: ", isModelLoaded);
  }, [isModelLoaded]);

  return (
    <div className="App">
      <LiveAPIProvider options={apiOptions}>
        <div className="streaming-console">
          {!isModelLoaded && <LoadingScreen isModelLoaded={isModelLoaded} />}
          
          {/* Camera Controls Panel */}
          {isModelLoaded && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '15px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto',
              width: '200px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                cursor: 'pointer'
              }} onClick={() => setShowCameraControls(!showCameraControls)}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                  📷 Camera Angles
                </h3>
                <span style={{ fontSize: '12px' }}>
                  {showCameraControls ? '▼' : '▶'}
                </span>
              </div>
              
              {showCameraControls && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  {Object.entries(cameraPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handleCameraPreset(key as keyof typeof cameraPresets)}
                      style={{
                        padding: '8px 4px',
                        fontSize: '11px',
                        backgroundColor: '#4285f4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#357ae8'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4285f4'}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <main>
            <div className="main-app-area">
              <Canvas shadows camera={{ position: cameraPosition, fov: 40 }}>
                <color attach="background" args={["#ececec"]} />
                <Experience 
                  avatarUrl={avatarUrl} 
                  onModelLoaded={() => setIsModelLoaded(true)}
                />
              </Canvas>
              <Altair/>
              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>

            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              enableEditingSettings={true}
            />
          </main>

        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;