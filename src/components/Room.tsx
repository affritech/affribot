// components/Room.tsx
import { useGLTF } from "@react-three/drei";
import { useEffect, Suspense } from "react";
import { Html } from "@react-three/drei";

interface RoomProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

function RoomModel({ 
  url, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  scale = 1 
}: RoomProps) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    console.log("✅ Room loaded successfully:", url);
    console.log("Scene object:", scene);
    
    // Enable shadows on all meshes in the room
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, url]);

  return (
    <primitive 
      object={scene} 
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

// Loading fallback
function RoomLoader() {
  return (
    <Html center>
      <div style={{
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px 40px',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏠</div>
        <div>Loading Room...</div>
        <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
          (Large file - may take a moment)
        </div>
      </div>
    </Html>
  );
}

export function Room(props: RoomProps) {
  return (
    <Suspense fallback={<RoomLoader />}>
      <RoomModel {...props} />
    </Suspense>
  );
}

// Preload the room model
export function preloadRoom(url: string) {
  useGLTF.preload(url);
}