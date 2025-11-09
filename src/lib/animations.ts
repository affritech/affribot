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
  Talking: {
    name: "Talking",
    url: "https://files.catbox.moe/soybay.fbx",
    description: "Talking while moving the hands",
    emoji: "🧍",
    loop: false,
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