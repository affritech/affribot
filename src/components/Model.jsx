import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useControls, button, folder } from "leva";

// ============================================
// IMPORT LIP SYNC SYSTEM (NEW)
// ============================================
import { 
  LipSyncEngine, 
  VISEME_MAPPINGS, 
  applyExpression,
  lerpExpression
} from "../lib/LipSyncSystem";

// ============================================
// IMPORT LIVE API CONTEXT (NEW)
// ============================================
import { useLiveAPIContext } from "../contexts/LiveAPIContext";

// Toggle this to enable/disable Leva controls
const ENABLE_LEVA_CONTROLS = true;

export function Avatar(props) {
  const { animation = "Idle", ...restProps } = props;
  const [headFollow, setHeadFollow] = useState(false);
  const [cursorFollow, setCursorFollow] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const group = useRef();
  const { nodes, materials } = useGLTF("models/model.glb");

  // Store refs to morph target meshes
  const headRef = useRef();
  const teethRef = useRef();
  const eyeLeftRef = useRef();
  const eyeRightRef = useRef();

  // ============================================
  // LIP SYNC STATE (NEW)
  // ============================================
  const lipSyncEngine = useRef(new LipSyncEngine());
  const [currentViseme, setCurrentViseme] = useState('neutral');
  const previousExpression = useRef(VISEME_MAPPINGS.neutral);
  const [lipSyncEnabled, setLipSyncEnabled] = useState(true);

  // ============================================
  // CONNECT TO LIVE API (NEW)
  // ============================================
  const { audioStreamer } = useLiveAPIContext();

  const { animations: fbxAnimations } = useFBX("animations/Idle.fbx");

  const animationList = fbxAnimations && fbxAnimations.length > 0 
    ? fbxAnimations.map((clip, i) => {
        clip.name = "Idle";
        return clip;
      })
    : [];

  if (animationList.length > 0) {
    console.log("Available animations:", animationList.map(a => a.name));
  } else {
    console.warn("No animations found in Idle.fbx");
  }

  const { actions } = useAnimations(animationList, group);

  // Log all morph targets once the model is loaded
  useEffect(() => {
    console.log("\n=== MORPH TARGETS DISCOVERY ===");
    
    if (nodes.Wolf3D_Head) {
      console.log("\n📊 Wolf3D_Head Morph Targets:");
      console.log("Dictionary:", nodes.Wolf3D_Head.morphTargetDictionary);
      console.log("Count:", Object.keys(nodes.Wolf3D_Head.morphTargetDictionary || {}).length);
    }
    
    if (nodes.Wolf3D_Teeth) {
      console.log("\n🦷 Wolf3D_Teeth Morph Targets:");
      console.log("Dictionary:", nodes.Wolf3D_Teeth.morphTargetDictionary);
      console.log("Count:", Object.keys(nodes.Wolf3D_Teeth.morphTargetDictionary || {}).length);
    }
    
    console.log("\n=== END MORPH TARGETS ===\n");
  }, [nodes]);

  // ============================================
  // INTEGRATE WITH AUDIO STREAMER (FIXED)
  // ============================================
  useEffect(() => {
    if (!audioStreamer || !lipSyncEnabled) return;

    if (audioStreamer && lipSyncEngine.current) {
      // Enable lip sync on the audio streamer
      audioStreamer.enableLipSync(lipSyncEngine.current);
      console.log("✅ Lip sync connected to audio stream");

      return () => {
        // Cleanup: disable lip sync when component unmounts or changes
        if (audioStreamer) {
          audioStreamer.disableLipSync();
        }
        lipSyncEngine.current.stop();
      };
    }
  }, [audioStreamer, lipSyncEnabled]);

  // Create Leva controls dynamically based on discovered morph targets
  const createMorphControls = () => {
    if (!ENABLE_LEVA_CONTROLS) return {};

    const controls = {};

    // ============================================
    // NEW: LIP SYNC CONTROLS
    // ============================================
    controls["🎤 Lip Sync"] = folder({
      enabled: {
        value: lipSyncEnabled,
        label: "Enable Lip Sync",
        onChange: (v) => setLipSyncEnabled(v)
      },
      currentViseme: {
        value: currentViseme,
        label: "Current Viseme",
        disabled: true
      },
      testViseme: {
        value: 'neutral',
        label: "Test Viseme",
        options: Object.keys(VISEME_MAPPINGS)
      }
    }, { collapsed: false });

    // Head morph targets
    if (nodes.Wolf3D_Head?.morphTargetDictionary) {
      const headTargets = {};
      Object.keys(nodes.Wolf3D_Head.morphTargetDictionary).forEach((key) => {
        headTargets[key] = { value: 0, min: 0, max: 1, step: 0.01 };
      });
      controls["Head"] = folder(headTargets, { collapsed: true });
    }

    // Teeth morph targets
    if (nodes.Wolf3D_Teeth?.morphTargetDictionary) {
      const teethTargets = {};
      Object.keys(nodes.Wolf3D_Teeth.morphTargetDictionary).forEach((key) => {
        teethTargets[key] = { value: 0, min: 0, max: 1, step: 0.01 };
      });
      controls["Teeth"] = folder(teethTargets, { collapsed: true });
    }

    // Eye morph targets
    if (nodes.EyeLeft?.morphTargetDictionary) {
      const eyeTargets = {};
      Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
        eyeTargets[key] = { value: 0, min: 0, max: 1, step: 0.01 };
      });
      controls["Eyes"] = folder(eyeTargets, { collapsed: true });
    }

    // Utility buttons
    controls["Utils"] = folder({
      "Log Current Values": button(() => {
        logCurrentMorphTargets();
      }),
      "Save Expression": button(() => {
        saveCurrentExpression();
      }),
      "Reset All": button(() => {
        resetAllMorphTargets();
      }),
      // ============================================
      // NEW: TEST ALL VISEMES BUTTON
      // ============================================
      "Test All Visemes": button(() => {
        testAllVisemes();
      })
    });

    return controls;
  };

  const morphControls = ENABLE_LEVA_CONTROLS ? useControls(createMorphControls()) : {};

  // Apply Leva controls to morph targets (ONLY when lip sync is disabled)
  useEffect(() => {
    if (!ENABLE_LEVA_CONTROLS || lipSyncEnabled || !morphControls) return;

    // Apply head morph targets
    if (headRef.current?.morphTargetInfluences && nodes.Wolf3D_Head?.morphTargetDictionary) {
      Object.entries(nodes.Wolf3D_Head.morphTargetDictionary).forEach(([name, index]) => {
        if (morphControls[name] !== undefined) {
          headRef.current.morphTargetInfluences[index] = morphControls[name];
        }
      });
    }

    // Apply teeth morph targets
    if (teethRef.current?.morphTargetInfluences && nodes.Wolf3D_Teeth?.morphTargetDictionary) {
      Object.entries(nodes.Wolf3D_Teeth.morphTargetDictionary).forEach(([name, index]) => {
        if (morphControls[name] !== undefined) {
          teethRef.current.morphTargetInfluences[index] = morphControls[name];
        }
      });
    }

    // Apply eye morph targets
    if (eyeLeftRef.current?.morphTargetInfluences && nodes.EyeLeft?.morphTargetDictionary) {
      Object.entries(nodes.EyeLeft.morphTargetDictionary).forEach(([name, index]) => {
        if (morphControls[name] !== undefined) {
          eyeLeftRef.current.morphTargetInfluences[index] = morphControls[name];
          if (eyeRightRef.current?.morphTargetInfluences) {
            eyeRightRef.current.morphTargetInfluences[index] = morphControls[name];
          }
        }
      });
    }
  }, [morphControls, nodes, lipSyncEnabled]);

  // ============================================
  // NEW: APPLY TEST VISEME FROM LEVA
  // ============================================
  useEffect(() => {
    if (!ENABLE_LEVA_CONTROLS || !morphControls.testViseme || lipSyncEnabled) return;

    const expression = VISEME_MAPPINGS[morphControls.testViseme];
    if (expression) {
      applyExpression(
        expression,
        headRef.current,
        teethRef.current,
        eyeLeftRef.current,
        eyeRightRef.current,
        nodes.Wolf3D_Head?.morphTargetDictionary,
        nodes.Wolf3D_Teeth?.morphTargetDictionary,
        nodes.EyeLeft?.morphTargetDictionary
      );
    }
  }, [morphControls.testViseme, nodes, lipSyncEnabled]);

  // Helper functions
  const logCurrentMorphTargets = () => {
    console.log("\n=== CURRENT MORPH TARGET VALUES ===");
    
    if (headRef.current?.morphTargetInfluences && nodes.Wolf3D_Head?.morphTargetDictionary) {
      console.log("\n🎭 Head:");
      Object.entries(nodes.Wolf3D_Head.morphTargetDictionary).forEach(([name, index]) => {
        const value = headRef.current.morphTargetInfluences[index];
        if (value > 0) {
          console.log(`  ${name}: ${value.toFixed(3)}`);
        }
      });
    }
    
    if (teethRef.current?.morphTargetInfluences && nodes.Wolf3D_Teeth?.morphTargetDictionary) {
      console.log("\n🦷 Teeth:");
      Object.entries(nodes.Wolf3D_Teeth.morphTargetDictionary).forEach(([name, index]) => {
        const value = teethRef.current.morphTargetInfluences[index];
        if (value > 0) {
          console.log(`  ${name}: ${value.toFixed(3)}`);
        }
      });
    }
    
    if (eyeLeftRef.current?.morphTargetInfluences && nodes.EyeLeft?.morphTargetDictionary) {
      console.log("\n👁️ Eyes:");
      Object.entries(nodes.EyeLeft.morphTargetDictionary).forEach(([name, index]) => {
        const value = eyeLeftRef.current.morphTargetInfluences[index];
        if (value > 0) {
          console.log(`  ${name}: ${value.toFixed(3)}`);
        }
      });
    }
    
    console.log("\n=== END CURRENT VALUES ===\n");
  };

  const saveCurrentExpression = () => {
    const expression = {
      head: {},
      teeth: {},
      eyes: {}
    };

    if (headRef.current?.morphTargetInfluences && nodes.Wolf3D_Head?.morphTargetDictionary) {
      Object.entries(nodes.Wolf3D_Head.morphTargetDictionary).forEach(([name, index]) => {
        const value = headRef.current.morphTargetInfluences[index];
        if (value > 0) {
          expression.head[name] = parseFloat(value.toFixed(3));
        }
      });
    }

    if (teethRef.current?.morphTargetInfluences && nodes.Wolf3D_Teeth?.morphTargetDictionary) {
      Object.entries(nodes.Wolf3D_Teeth.morphTargetDictionary).forEach(([name, index]) => {
        const value = teethRef.current.morphTargetInfluences[index];
        if (value > 0) {
          expression.teeth[name] = parseFloat(value.toFixed(3));
        }
      });
    }

    if (eyeLeftRef.current?.morphTargetInfluences && nodes.EyeLeft?.morphTargetDictionary) {
      Object.entries(nodes.EyeLeft.morphTargetDictionary).forEach(([name, index]) => {
        const value = eyeLeftRef.current.morphTargetInfluences[index];
        if (value > 0) {
          expression.eyes[name] = parseFloat(value.toFixed(3));
        }
      });
    }

    console.log("\n💾 SAVED EXPRESSION (Copy this JSON):");
    console.log(JSON.stringify(expression, null, 2));
    console.log("\n");
  };

  const resetAllMorphTargets = () => {
    if (headRef.current?.morphTargetInfluences) {
      headRef.current.morphTargetInfluences.fill(0);
    }
    if (teethRef.current?.morphTargetInfluences) {
      teethRef.current.morphTargetInfluences.fill(0);
    }
    if (eyeLeftRef.current?.morphTargetInfluences) {
      eyeLeftRef.current.morphTargetInfluences.fill(0);
    }
    if (eyeRightRef.current?.morphTargetInfluences) {
      eyeRightRef.current.morphTargetInfluences.fill(0);
    }
    lipSyncEngine.current.reset();
  };

  // ============================================
  // NEW: TEST ALL VISEMES FUNCTION
  // ============================================
  const testAllVisemes = async () => {
    console.log("\n🎬 Testing all visemes...\n");
    const visemeKeys = Object.keys(VISEME_MAPPINGS);
    
    for (let i = 0; i < visemeKeys.length; i++) {
      const viseme = visemeKeys[i];
      console.log(`Testing: ${viseme}`);
      
      const expression = VISEME_MAPPINGS[viseme];
      applyExpression(
        expression,
        headRef.current,
        teethRef.current,
        eyeLeftRef.current,
        eyeRightRef.current,
        nodes.Wolf3D_Head?.morphTargetDictionary,
        nodes.Wolf3D_Teeth?.morphTargetDictionary,
        nodes.EyeLeft?.morphTargetDictionary
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    resetAllMorphTargets();
    console.log("✅ Viseme test complete!\n");
  };

  // ============================================
  // MAIN ANIMATION LOOP (MODIFIED)
  // ============================================
  useFrame((state, delta) => {
    if (!group.current) return;

    // ============================================
    // NEW: LIP SYNC ANIMATION
    // ============================================
    if (lipSyncEnabled) {
      const newViseme = lipSyncEngine.current.getCurrentViseme();
      
      if (newViseme !== currentViseme) {
        setCurrentViseme(newViseme);
      }

      const targetExpression = lipSyncEngine.current.getCurrentMorphTargets();
      
      // Smooth interpolation between expressions
      const smoothedExpression = lerpExpression(
        previousExpression.current,
        targetExpression,
        Math.min(delta * 15, 1) // Smooth transition speed
      );

      applyExpression(
        smoothedExpression,
        headRef.current,
        teethRef.current,
        eyeLeftRef.current,
        eyeRightRef.current,
        nodes.Wolf3D_Head?.morphTargetDictionary,
        nodes.Wolf3D_Teeth?.morphTargetDictionary,
        nodes.EyeLeft?.morphTargetDictionary
      );

      previousExpression.current = smoothedExpression;
    }

    // EXISTING: Head follow
    if (headFollow) {
      const head = group.current.getObjectByName("Head");
      if (head) head.lookAt(state.camera.position);
    }

    // EXISTING: Cursor follow
    if (cursorFollow) {
      const spine = group.current.getObjectByName("Spine2");
      if (spine) {
        const target = new THREE.Vector3(state.mouse.x, state.mouse.y, 1);
        spine.lookAt(target);
      }
    }
  });

  // EXISTING: Animation playback
  useEffect(() => {
    if (!actions || !animation) return;

    const action = actions[animation];
    if (action) {
      console.log("Playing animation:", animation);
      action.play();
      return () => {
        action.stop();
      };
    } else {
      console.warn(`Animation "${animation}" not found. Available:`, Object.keys(actions));
    }
  }, [animation, actions]);

  // EXISTING: Wireframe toggle
  useEffect(() => {
    Object.values(materials).forEach((material) => {
      material.wireframe = wireframe;
    });
  }, [wireframe, materials]);

  return (
    <group {...restProps} ref={group} dispose={null}>
      <group>
        <primitive object={nodes.Hips} />
        <skinnedMesh
          geometry={nodes.Wolf3D_Body.geometry}
          material={materials.Wolf3D_Body}
          skeleton={nodes.Wolf3D_Body.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
          material={materials.Wolf3D_Outfit_Bottom}
          skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
          material={materials.Wolf3D_Outfit_Footwear}
          skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Top.geometry}
          material={materials.Wolf3D_Outfit_Top}
          skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
        />
        <skinnedMesh
          geometry={nodes.Wolf3D_Hair.geometry}
          material={materials.Wolf3D_Hair}
          skeleton={nodes.Wolf3D_Hair.skeleton}
        />
        <skinnedMesh
          ref={eyeLeftRef}
          name="EyeLeft"
          geometry={nodes.EyeLeft.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeLeft.skeleton}
          morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
        />
        <skinnedMesh
          ref={eyeRightRef}
          name="EyeRight"
          geometry={nodes.EyeRight.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeRight.skeleton}
          morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
        />
        <skinnedMesh
          ref={headRef}
          name="Wolf3D_Head"
          geometry={nodes.Wolf3D_Head.geometry}
          material={materials.Wolf3D_Skin}
          skeleton={nodes.Wolf3D_Head.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
        />
        <skinnedMesh
          ref={teethRef}
          name="Wolf3D_Teeth"
          geometry={nodes.Wolf3D_Teeth.geometry}
          material={materials.Wolf3D_Teeth}
          skeleton={nodes.Wolf3D_Teeth.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
        />
      </group>
    </group>
  );
}

useGLTF.preload("models/model.glb");