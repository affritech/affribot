import { useRef, useState, useEffect } from "react";
import "./App.scss";

import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";

import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { Altair } from "./components/altair/Altair";
import ControlTray from "./components/control-tray/ControlTray";
//import AvatarCustomizer from "./components/AvatarCustomizer";
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

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("https://files.catbox.moe/x4cg70.glb");
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const handleAvatarChange = (newUrl: string) => {
    console.log("🔄 Changing avatar, resetting loading state");
    setIsModelLoaded(false); // Reset loading when changing avatars
    setAvatarUrl(newUrl);
  };

  // Debug: Log when isModelLoaded changes
  useEffect(() => {
    console.log("📊 isModelLoaded changed to:", isModelLoaded);
  }, [isModelLoaded]);

  return (
    <div className="App">
      <LiveAPIProvider options={apiOptions}>
        <div className="streaming-console">
          {/* Only render LoadingScreen if model is NOT loaded */}
          {!isModelLoaded && <LoadingScreen isModelLoaded={isModelLoaded} />}
          
          <main>
            <div className="main-app-area">
              <Canvas shadows camera={{ position: [0, 2, 5], fov: 20 }}>
                <color attach="background" args={["#ececec"]} />
                <Experience 
                  avatarUrl={avatarUrl} 
                  onModelLoaded={() => setIsModelLoaded(true)}
                />
              </Canvas>
              <Altair />
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