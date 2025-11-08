/**
 * FILE: src/lib/animations.ts
 * 
 * Central animation library with real FBX URLs
 */

export interface AnimationInfo {
  name: string;
  url: string;
  description: string;
  emoji: string;
  duration?: number; // Optional: specific duration in seconds
  loop?: boolean;    // Should the animation loop?
  isTalkingAnimation?: boolean; // NEW: Marks animations that sync with audio
}

/**
 * Animation Library - All Real URLs
 */
export const ANIMATIONS: Record<string, AnimationInfo> = {
  Idle: {
    name: "Idle",
    url: "animations/Idle.fbx",
    description: "Natural standing pose",
    emoji: "🧍",
    loop: true,
  },
  
  Yelling: {
    name: "Yelling",
    url: "https://files.catbox.moe/nzr49d.fbx",
    description: "Shouting or calling out loudly",
    emoji: "📢",
    loop: true,
    isTalkingAnimation: true, // NEW: This syncs with audio
  },
  
  Standing: {
    name: "Standing",
    url: "https://files.catbox.moe/c5h4l8.fbx",
    description: "Calm standing position",
    emoji: "🧍",
    loop: true,
  },
  
  Talking: {
    name: "Talking",
    url: "https://files.catbox.moe/b55eha.fbx",
    description: "Conversational gestures style 1",
    emoji: "💬",
    loop: true,
    isTalkingAnimation: true, // NEW: This syncs with audio
  },
  
  Talking3: {
    name: "Talking3",
    url: "https://files.catbox.moe/kx5fnn.fbx",
    description: "Conversational gestures style 3",
    emoji: "💭",
    loop: true,
    isTalkingAnimation: true, // NEW: This syncs with audio
  },
  
  Meeting: {
    name: "Meeting",
    url: "https://files.catbox.moe/0y2445.fbx",
    description: "Professional meeting posture",
    emoji: "👔",
    loop: true,
  },
  
  Backflip1: {
    name: "Backflip1",
    url: "https://files.catbox.moe/j0nair.fbx",
    description: "Acrobatic backflip",
    emoji: "🤸",
    duration: 2,
    loop: false,
  },
  
  Backflip2: {
    name: "Backflip2",
    url: "https://files.catbox.moe/j0nair.fbx",
    description: "Another backflip variation",
    emoji: "🤸",
    duration: 2,
    loop: false,
  },
  
  Jumping: {
    name: "Jumping",
    url: "https://files.catbox.moe/r7vhjj.fbx",
    description: "Excited jump",
    emoji: "🦘",
    duration: 2,
    loop: false,
  },
  
  HipHopDance: {
    name: "HipHopDance",
    url: "https://files.catbox.moe/nyd0yx.fbx",
    description: "Urban hip hop dance moves",
    emoji: "🎤",
    loop: true,
  },
  
  JazzDance: {
    name: "JazzDance",
    url: "https://files.catbox.moe/hukryu.fbx",
    description: "Smooth jazz dance routine",
    emoji: "🎺",
    loop: true,
  },
  
  SalsaDance: {
    name: "SalsaDance",
    url: "https://files.catbox.moe/pu9e67.fbx",
    description: "Latin salsa dance moves",
    emoji: "💃",
    loop: true,
  },
  
  DwarfIdle: {
    name: "DwarfIdle",
    url: "https://files.catbox.moe/sb9wzp.fbx",
    description: "Quirky dwarf-style idle stance",
    emoji: "🧙",
    loop: true,
  },
};

/**
 * Get animation names for AI function declarations
 */
export function getAnimationNames(): string[] {
  return Object.keys(ANIMATIONS);
}

/**
 * Get animation URL by name
 */
export function getAnimationUrl(name: string): string {
  return ANIMATIONS[name]?.url || ANIMATIONS.Idle.url;
}

/**
 * Get animation info
 */
export function getAnimationInfo(name: string): AnimationInfo | undefined {
  return ANIMATIONS[name];
}

/**
 * Validate if animation exists
 */
export function isValidAnimation(name: string): boolean {
  return name in ANIMATIONS;
}

/**
 * NEW: Check if animation is a talking animation
 */
export function isTalkingAnimation(name: string): boolean {
  return ANIMATIONS[name]?.isTalkingAnimation === true;
}

/**
 * Get formatted animation list for AI
 */
export function getAnimationDescriptions(): string {
  return Object.values(ANIMATIONS)
    .map(anim => `- "${anim.name}" ${anim.emoji} - ${anim.description}`)
    .join('\n');
}