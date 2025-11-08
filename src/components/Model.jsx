import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { 
  LipSyncEngine, 
  VISEME_MAPPINGS, 
  applyExpression,
  lerpExpression
} from "../lib/LipSyncSystem";

import { useLiveAPIContext } from "../contexts/LiveAPIContext";
import { getAnimationUrl, getAnimationInfo, isValidAnimation } from "../lib/animations";

export function Avatar(props) {
  const { avatarUrl, onModelLoaded, ...restProps } = props;
  const group = useRef();
  
  const modelUrl = avatarUrl || "https://files.catbox.moe/xbub9j.glb";
  const { nodes, materials } = useGLTF(modelUrl);

  const headRef = useRef();
  const lipSyncEngine = useRef(new LipSyncEngine());
  const [currentViseme, setCurrentViseme] = useState('neutral');
  const previousExpression = useRef(VISEME_MAPPINGS.neutral);
  const [lipSyncEnabled, setLipSyncEnabled] = useState(true);
  
  // Track which animation URL to load
  const [currentAnimationUrl, setCurrentAnimationUrl] = useState("https://files.catbox.moe/0y2445.fbx");
  const [currentAnimationName, setCurrentAnimationName] = useState("Idle");
  const [nextAnimationUrl, setNextAnimationUrl] = useState(null);
  const animationTimeoutRef = useRef(null);
  const currentActionRef = useRef(null);
  
  const { audioStreamer } = useLiveAPIContext();

  // Load current animation
  const { animations: currentAnimations } = useFBX(currentAnimationUrl);
  
  // Preload next animation
  const { animations: nextAnimations } = useFBX(nextAnimationUrl || currentAnimationUrl);

  // Prepare current animation - FIXED: Check for Hips bone
  const animationList = currentAnimations && currentAnimations.length > 0 && nodes.Hips
    ? currentAnimations.map((clip) => {
        const newClip = clip.clone();
        newClip.name = currentAnimationName;
        return newClip;
      })
    : [];

  const { actions, mixer } = useAnimations(animationList, group);

  // ✅ Call onModelLoaded when model is ready - resets on avatarUrl change
  const hasCalledOnLoad = useRef(false);
  const lastAvatarUrl = useRef(avatarUrl);
  
  useEffect(() => {
    // Reset flag when avatar URL actually changes
    if (lastAvatarUrl.current !== avatarUrl) {
      console.log("🔄 Avatar URL changed, resetting load flag");
      hasCalledOnLoad.current = false;
      lastAvatarUrl.current = avatarUrl;
    }
  }, [avatarUrl]);
  
  useEffect(() => {
    if (nodes && materials && currentAnimations && nodes.Hips && onModelLoaded && !hasCalledOnLoad.current) {
      hasCalledOnLoad.current = true;
      console.log("✅ Model fully loaded and ready");
      // Small delay to ensure everything is rendered
      const timer = setTimeout(() => {
        onModelLoaded();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [nodes, materials, currentAnimations, avatarUrl, onModelLoaded]);

  // Play animation and keep reference
  useEffect(() => {
    if (!actions || !actions[currentAnimationName]) {
      return;
    }

    console.log(`✅ Playing: ${currentAnimationName}`);
    
    const action = actions[currentAnimationName];
    
    // Configure loop settings BEFORE playing
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.reset();
    
    // If there's a current action, crossfade to new one
    if (currentActionRef.current && currentActionRef.current !== action) {
      currentActionRef.current.crossFadeTo(action, 0.3, true);
    }
    
    action.setEffectiveWeight(1);
    action.play();
    
    // Store reference to current action
    currentActionRef.current = action;

    // Cleanup function
    return () => {
      // Don't stop the action immediately on cleanup
      // Let the crossfade handle transitions
    };
  }, [actions, currentAnimationName]);

  // Listen for animation changes from AI
  useEffect(() => {
    const handleAnimationChange = (event) => {
      const { animation: animName, duration } = event.detail;
      
      if (!isValidAnimation(animName)) {
        console.warn(`Unknown animation: ${animName}`);
        return;
      }

      // Clear any pending timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      console.log(`🎬 Switching to: ${animName}${duration ? ` for ${duration}s` : ''}`);
      
      // Get the animation URL and info
      const animUrl = getAnimationUrl(animName);
      const animInfo = getAnimationInfo(animName);
      
      // Preload next animation first
      setNextAnimationUrl(animUrl);
      
      // Wait a frame for preload to start, then switch
      requestAnimationFrame(() => {
        setCurrentAnimationUrl(animUrl);
        setCurrentAnimationName(animName);
      });
      
      // ALWAYS return to Idle after duration or animation completes
      if (duration) {
        animationTimeoutRef.current = setTimeout(() => {
          console.log(`⏰ Returning to Idle after ${duration}s`);
          setNextAnimationUrl("https://files.catbox.moe/0y2445.fbx");
          requestAnimationFrame(() => {
            setCurrentAnimationUrl("https://files.catbox.moe/0y2445.fbx");
            setCurrentAnimationName("Idle");
          });
        }, duration * 1000);
      } else if (!animInfo?.loop && currentAnimations?.[0]) {
        // For non-looping animations, return to Idle
        const clip = currentAnimations[0];
        const returnTime = Math.max(clip.duration * 1000, 3000);
        animationTimeoutRef.current = setTimeout(() => {
          console.log(`⏰ Animation complete, returning to Idle`);
          setNextAnimationUrl("https://files.catbox.moe/0y2445.fbx");
          requestAnimationFrame(() => {
            setCurrentAnimationUrl("https://files.catbox.moe/0y2445.fbx");
            setCurrentAnimationName("Idle");
          });
        }, returnTime);
      }
    };

    window.addEventListener('avatarAnimation', handleAnimationChange);
    return () => {
      window.removeEventListener('avatarAnimation', handleAnimationChange);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [currentAnimations]);

  // Integrate with audio streamer for lip sync
  useEffect(() => {
    if (!audioStreamer || !lipSyncEnabled) return;

    if (audioStreamer && lipSyncEngine.current) {
      audioStreamer.enableLipSync(lipSyncEngine.current);
      console.log("✅ Lip sync connected to audio stream");

      return () => {
        if (audioStreamer) {
          audioStreamer.disableLipSync();
        }
        lipSyncEngine.current.stop();
      };
    }
  }, [audioStreamer, lipSyncEnabled]);

  // Store base morph influences from animation
  const baseMorphInfluences = useRef(null);

  // Animation loop
  useFrame((state, delta) => {
    if (!group.current) return;

    // Capture base morph influences from animation BEFORE applying lip sync
    if (headRef.current && headRef.current.morphTargetInfluences) {
      if (!baseMorphInfluences.current) {
        baseMorphInfluences.current = new Float32Array(headRef.current.morphTargetInfluences.length);
      }
      // Store current animation-driven morph values
      baseMorphInfluences.current.set(headRef.current.morphTargetInfluences);
    }

    // Apply lip sync ADDITIVELY on top of animation morphs
    if (lipSyncEnabled && headRef.current && headRef.current.morphTargetInfluences) {
      const newViseme = lipSyncEngine.current.getCurrentViseme();
      
      if (newViseme !== currentViseme) {
        setCurrentViseme(newViseme);
      }

      const targetExpression = lipSyncEngine.current.getCurrentMorphTargets();
      
      const smoothedExpression = lerpExpression(
        previousExpression.current,
        targetExpression,
        Math.min(delta * 15, 1)
      );

      // Apply lip sync morphs additively on top of base animation morphs
      const morphDict = nodes.Wolf3D_Avatar?.morphTargetDictionary || nodes.Wolf3D_Head?.morphTargetDictionary;
      if (morphDict) {
        Object.keys(smoothedExpression).forEach((key) => {
          const morphIndex = morphDict[key];
          if (morphIndex !== undefined && baseMorphInfluences.current) {
            // Add lip sync influence to base animation influence
            headRef.current.morphTargetInfluences[morphIndex] = 
              Math.min(1.0, baseMorphInfluences.current[morphIndex] + smoothedExpression[key]);
          }
        });
      }

      previousExpression.current = smoothedExpression;
    }
  });

  return (
    <group {...restProps} ref={group} dispose={null}>
      <group>
        {nodes.Hips && <primitive object={nodes.Hips} />}
        
        {/* Fallback for models without Wolf3D_Avatar - look for any mesh with morphTargets */}
        {nodes.Wolf3D_Avatar ? (
          <skinnedMesh
            ref={headRef}
            name="Wolf3D_Avatar"
            geometry={nodes.Wolf3D_Avatar.geometry}
            material={materials.Wolf3D_Avatar}
            skeleton={nodes.Wolf3D_Avatar.skeleton}
            morphTargetDictionary={nodes.Wolf3D_Avatar.morphTargetDictionary}
            morphTargetInfluences={nodes.Wolf3D_Avatar.morphTargetInfluences}
          />
        ) : nodes.Wolf3D_Head ? (
          <skinnedMesh
            ref={headRef}
            name="Wolf3D_Head"
            geometry={nodes.Wolf3D_Head.geometry}
            material={materials.Wolf3D_Head}
            skeleton={nodes.Wolf3D_Head.skeleton}
            morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
            morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
          />
        ) : null}
      </group>
    </group>
  );
}

useGLTF.preload("https://models.readyplayer.me/690e977337697c47c8baa5a7.glb?morphTargets=ARKit,Oculus+Visemes");
// useGLTF.preload("https://files.catbox.moe/yvr97o.glb");