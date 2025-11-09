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
  const previousExpression = useRef({ head: {}, teeth: {}, eyes: {} });
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

  // Store which morph targets are lip sync targets (to exclude from animation)
  const lipSyncMorphIndices = useRef(new Set());
  const hasInitializedMorphs = useRef(false);

  // Initialize lip sync morph indices once
  useEffect(() => {
    if (!headRef.current || hasInitializedMorphs.current) return;
    
    const morphDict = headRef.current.morphTargetDictionary;
    if (!morphDict) {
      console.warn("⚠️ No morph targets found on model");
      return;
    }

    console.log("📋 Available morph targets:", Object.keys(morphDict));
    console.log("📋 Total morph count:", Object.keys(morphDict).length);

    // Identify which morph indices are used for lip sync
    const lipSyncKeys = Object.keys(VISEME_MAPPINGS.neutral.head || {});
    console.log("🔍 Looking for these lip sync keys:", lipSyncKeys);
    
    const foundKeys = [];
    const missingKeys = [];
    
    lipSyncKeys.forEach(key => {
      if (morphDict[key] !== undefined) {
        lipSyncMorphIndices.current.add(morphDict[key]);
        foundKeys.push(key);
      } else {
        missingKeys.push(key);
      }
    });

    console.log(`✅ Found ${lipSyncMorphIndices.current.size} lip sync morph targets:`, foundKeys);
    if (missingKeys.length > 0) {
      console.warn("⚠️ Missing lip sync morph targets:", missingKeys);
    }
    
    hasInitializedMorphs.current = true;
  }, [nodes]);

  // Prepare current animation
  const animationList = currentAnimations && currentAnimations.length > 0 && nodes.Hips
    ? currentAnimations.map((clip) => {
        const newClip = clip.clone();
        newClip.name = currentAnimationName;
        
        // CRITICAL: Remove mouth morph target tracks from animation
        // so they don't conflict with lip sync
        newClip.tracks = newClip.tracks.filter(track => {
          // Check if this track controls a morph target
          if (track.name.includes('morphTargetInfluences')) {
            // Extract the morph index from the track name
            const match = track.name.match(/\[(\d+)\]/);
            if (match) {
              const morphIndex = parseInt(match[1]);
              // Keep the track only if it's NOT a lip sync morph
              return !lipSyncMorphIndices.current.has(morphIndex);
            }
          }
          return true; // Keep all non-morph tracks
        });
        
        return newClip;
      })
    : [];

  const { actions, mixer } = useAnimations(animationList, group);

  // Call onModelLoaded when model is ready
  const hasCalledOnLoad = useRef(false);
  const lastAvatarUrl = useRef(avatarUrl);
  
  useEffect(() => {
    if (lastAvatarUrl.current !== avatarUrl) {
      console.log("🔄 Avatar URL changed, resetting load flag");
      hasCalledOnLoad.current = false;
      hasInitializedMorphs.current = false;
      lipSyncMorphIndices.current.clear();
      lastAvatarUrl.current = avatarUrl;
    }
  }, [avatarUrl]);
  
  useEffect(() => {
    if (nodes && materials && currentAnimations && nodes.Hips && onModelLoaded && !hasCalledOnLoad.current) {
      hasCalledOnLoad.current = true;
      console.log("✅ Model fully loaded and ready");
      const timer = setTimeout(() => {
        onModelLoaded();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [nodes, materials, currentAnimations, avatarUrl, onModelLoaded]);

  // Play animation
  useEffect(() => {
    if (!actions || !actions[currentAnimationName]) {
      return;
    }

    console.log(`✅ Playing: ${currentAnimationName}`);
    
    const action = actions[currentAnimationName];
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = false;
    action.reset();
    
    if (currentActionRef.current && currentActionRef.current !== action) {
      currentActionRef.current.crossFadeTo(action, 0.3, true);
    }
    
    action.setEffectiveWeight(1);
    action.play();
    currentActionRef.current = action;

    return () => {
      // Cleanup handled by crossfade
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

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      console.log(`🎬 Switching to: ${animName}${duration ? ` for ${duration}s` : ''}`);
      
      const animUrl = getAnimationUrl(animName);
      const animInfo = getAnimationInfo(animName);
      
      setNextAnimationUrl(animUrl);
      
      requestAnimationFrame(() => {
        setCurrentAnimationUrl(animUrl);
        setCurrentAnimationName(animName);
      });
      
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

  // Animation loop - SIMPLIFIED
  useFrame((state, delta) => {
    if (!lipSyncEnabled || !headRef.current || !headRef.current.morphTargetInfluences) return;

    const newViseme = lipSyncEngine.current.getCurrentViseme();
    
    if (newViseme !== currentViseme) {
      setCurrentViseme(newViseme);
      console.log("🗣️ Current viseme:", newViseme);
    }

    // Get the Expression object (has head, teeth, eyes properties)
    const targetExpression = lipSyncEngine.current.getCurrentMorphTargets();
    
    // Extract just the head morphs
    const targetHeadMorphs = targetExpression.head || {};
    
    // Debug: Log when we have non-zero targets
    const hasActiveTargets = Object.values(targetHeadMorphs).some(v => v > 0.01);
    if (hasActiveTargets && Math.random() < 0.1) { // Log 10% of frames to avoid spam
      console.log("📊 Target head morphs:", targetHeadMorphs);
    }
    
    // Smooth the transition between visemes (using just head morphs)
    const prevHeadMorphs = previousExpression.current.head || {};
    const smoothedHeadMorphs = {};
    
    const allKeys = new Set([...Object.keys(prevHeadMorphs), ...Object.keys(targetHeadMorphs)]);
    allKeys.forEach(key => {
      const fromVal = prevHeadMorphs[key] || 0;
      const toVal = targetHeadMorphs[key] || 0;
      smoothedHeadMorphs[key] = fromVal + (toVal - fromVal) * Math.min(delta * 20, 1);
    });

    // Apply lip sync morphs directly (animation no longer controls these)
    const morphDict = headRef.current.morphTargetDictionary;
    if (morphDict) {
      let appliedCount = 0;
      let debugInfo = [];
      
      Object.keys(smoothedHeadMorphs).forEach((key) => {
        const morphIndex = morphDict[key];
        if (morphIndex !== undefined) {
          const value = smoothedHeadMorphs[key];
          if (value > 0.01) {
            appliedCount++;
            debugInfo.push(`${key}=${value.toFixed(2)}`);
          }
          headRef.current.morphTargetInfluences[morphIndex] = value;
        }
      });
      
      if (appliedCount > 0 && Math.random() < 0.1) {
        console.log(`✅ Applied ${appliedCount} morphs:`, debugInfo.join(', '));
      }
    }

    previousExpression.current = targetExpression;
  });

  return (
    <group {...restProps} ref={group} dispose={null}>
      <group>
        {nodes.Hips && <primitive object={nodes.Hips} />}
        
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