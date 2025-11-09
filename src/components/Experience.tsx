import {
  ContactShadows,
  Environment,
  OrbitControls,
  Sky,
  useGLTF,
} from "@react-three/drei";
import { Avatar } from "./Model";
import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";

interface ExperienceProps {
  avatarUrl?: string;
  onModelLoaded?: () => void;
}

const RoomModel = () => {
  const { scene } = useGLTF("https://files.catbox.moe/yq7iu3.glb");
  return <primitive object={scene} />;
};

export const Experience = ({ avatarUrl, onModelLoaded }: ExperienceProps) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    const handleZoom = (event: any) => {
      if (controlsRef.current) {
        const direction = camera.position.clone().normalize();
        camera.position.addScaledVector(direction, event.detail.zoom);
        controlsRef.current.update();
      }
    };

    window.addEventListener('avatarZoom', handleZoom);
    return () => window.removeEventListener('avatarZoom', handleZoom);
  }, [camera]);

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
      />
      <Sky />
      <Environment preset="sunset" />
      
      <group position-y={-1}>
        <ContactShadows
          opacity={0.42}
          scale={10}
          blur={1}
          far={10}
          resolution={256}
          color="#000000"
        />
        
        {/* Room Model */}
        <RoomModel />
        
        {/* Avatar */}
        <Avatar 
          animation="Idle" 
          avatarUrl={avatarUrl}
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[-1.5, 0, 1.3]}
          onModelLoaded={onModelLoaded}
        />
        
        <mesh scale={5} rotation-x={-Math.PI * 0.5} position-y={-0.001}>
          <planeGeometry />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
    </>
  );
};