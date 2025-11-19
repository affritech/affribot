import { useRef, useState, useEffect } from "react";
import "./App.scss";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
import LoadingScreen from "./components/LoadingScreen";
import SceneSelector from "./lib/SceneSelector";
import { getAvatar, getScene } from "./lib/SceneManeger";
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
  const [currentAvatarId, setCurrentAvatarId] = useState<string>("aifra");
  const [currentSceneId, setCurrentSceneId] = useState<string>("office");
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([-3, 1, 8]);
  const [showCameraControls, setShowCameraControls] = useState(true);
  
  // Language state management
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedLanguageName, setSelectedLanguageName] = useState('English');
  
  // Network quality indicator
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [echoWarning, setEchoWarning] = useState(false);

  const handleAvatarChange = (avatarId: string) => {
    console.log("🔄 Changing avatar to:", avatarId);
    const avatar = getAvatar(avatarId);
    if (avatar) {
      setIsModelLoaded(false);
      setAvatarUrl(avatar.url);
      setCurrentAvatarId(avatarId);
    }
  };

  const handleSceneChange = (sceneId: string) => {
    console.log("🏠 Changing scene to:", sceneId);
    const scene = getScene(sceneId);
    if (scene) {
      setCurrentSceneId(sceneId);
      setCameraPosition(scene.cameraDefault.position);
      window.dispatchEvent(new CustomEvent('cameraChange', { 
        detail: { 
          position: scene.cameraDefault.position,
          target: scene.cameraDefault.target 
        } 
      }));
    }
  };

  const handleCameraPreset = (preset: keyof typeof cameraPresets) => {
    const newPosition = cameraPresets[preset].position as [number, number, number];
    setCameraPosition(newPosition);
    
    window.dispatchEvent(new CustomEvent('cameraChange', { 
      detail: { position: newPosition } 
    }));
  };

  // Handle language change from ControlTray
  const handleLanguageChange = (code: string, name: string) => {
    console.log('🌐 App received language change:', code, name);
    setSelectedLanguage(code);
    setSelectedLanguageName(name);
  };

  // Monitor network connection quality
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkQuality = () => {
        const effectiveType = connection?.effectiveType;
        
        if (effectiveType === '4g') {
          setNetworkQuality('good');
        } else if (effectiveType === '3g') {
          setNetworkQuality('fair');
        } else {
          setNetworkQuality('poor');
        }
        
        console.log(`📡 Network: ${effectiveType || 'unknown'}`);
      };
      
      updateNetworkQuality();
      connection?.addEventListener('change', updateNetworkQuality);
      
      return () => {
        connection?.removeEventListener('change', updateNetworkQuality);
      };
    }
  }, []);

  // Listen for echo cancellation warnings
  useEffect(() => {
    const handleEchoWarning = (event: any) => {
      if (event.detail?.type === 'echo-cancellation-disabled') {
        setEchoWarning(true);
        
        // Auto-hide warning after 10 seconds
        setTimeout(() => setEchoWarning(false), 10000);
      }
    };
    
    window.addEventListener('audio-warning', handleEchoWarning as EventListener);
    return () => {
      window.removeEventListener('audio-warning', handleEchoWarning as EventListener);
    };
  }, []);

  useEffect(() => {
    console.log("📊 isModelLoaded changed to: ", isModelLoaded);
  }, [isModelLoaded]);

  return (
    <div className="App">
      <LiveAPIProvider options={apiOptions}>
        <div className="streaming-console">
          {!isModelLoaded && <LoadingScreen isModelLoaded={isModelLoaded} />}
          
          {/* Network Quality Indicator */}
          {isModelLoaded && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                background: networkQuality === 'good' ? 'rgba(34, 197, 94, 0.2)' :
                           networkQuality === 'fair' ? 'rgba(234, 179, 8, 0.2)' :
                           'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${networkQuality === 'good' ? '#22c55e' :
                         networkQuality === 'fair' ? '#eab308' :
                         '#ef4444'}`,
                padding: '8px 12px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '16px' }}>
                  {networkQuality === 'good' ? '🟢' :
                   networkQuality === 'fair' ? '🟡' : '🔴'}
                </span>
                Network: {networkQuality.toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Echo Cancellation Warning */}
          {echoWarning && (
            <div style={{
              position: 'absolute',
              top: '60px',
              right: '10px',
              zIndex: 999,
              background: 'rgba(239, 68, 68, 0.95)',
              border: '2px solid #ef4444',
              padding: '12px 16px',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px',
              maxWidth: '300px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                Echo Warning
              </div>
              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                Echo cancellation is not working. Please use headphones to prevent audio feedback.
              </div>
            </div>
          )}
          
          {/* Scene & Avatar Menu */}
          <SceneSelector
            currentScene={currentSceneId}
            currentAvatar={currentAvatarId}
            onSceneChange={handleSceneChange}
            onAvatarChange={handleAvatarChange}
          />
          
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
              <Altair
                selectedLanguage={selectedLanguage}
                selectedLanguageName={selectedLanguageName}
              />
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
              onLanguageChange={handleLanguageChange}
            />
          </main>

        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;