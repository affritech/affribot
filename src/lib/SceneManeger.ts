/**
 * FILE: src/lib/SceneManager.ts
 * 
 * Central configuration for scenes, avatars, accents, and animations
 */

export interface Avatar {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  accent: string;
  description: string;
}

export interface Scene {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  description: string;
  avatarPosition: [number, number, number];
  cameraDefault: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

export interface Animation {
  id: string;
  name: string;
  url: string;
  emoji: string;
  description: string;
  loop: boolean;
  duration?: number;
  category: 'locomotion' | 'gesture' | 'emotion' | 'idle';
}

// ============================================
// AVATARS LIBRARY
// ============================================
export const AVATARS: Avatar[] = [
  {
    id: 'aifra',
    name: 'Aifra',
    url: 'https://files.catbox.moe/x4cg70.glb',
    thumbnail: 'https://files.catbox.moe/6so5nn.jpg',
    accent: 'American',
    description: 'Default female avatar with American accent'
  },
  {
    id: 'aifra-nigerian',
    name: 'Aifra (Nigerian)',
    url: 'https://files.catbox.moe/yvr97o.glb',
    thumbnail: 'https://files.catbox.moe/6so5nn.jpg',
    accent: 'Nigerian',
    description: 'Female avatar with Nigerian accent'
  },
  // Add more avatars here
];

// ============================================
// SCENES LIBRARY
// ============================================
export const SCENES: Scene[] = [
  {
    id: 'office',
    name: 'Office Room',
    url: 'https://files.catbox.moe/yq7iu3.glb',
    thumbnail: 'https://via.placeholder.com/150/4A90E2/FFFFFF?text=Office',
    description: 'Modern office environment',
    avatarPosition: [-1.5, 0, 1.3],
    cameraDefault: {
      position: [-3, 1, 8],
      target: [-3, 1, 0]
    }
  },
  {
    id: 'park',
    name: 'Park',
    url: 'https://files.catbox.moe/park123.glb', // Replace with actual URL
    thumbnail: 'https://via.placeholder.com/150/50C878/FFFFFF?text=Park',
    description: 'Outdoor park setting',
    avatarPosition: [0, 0, 0],
    cameraDefault: {
      position: [0, 1.5, 5],
      target: [0, 1, 0]
    }
  },
  {
    id: 'studio',
    name: 'Studio',
    url: 'https://files.catbox.moe/studio456.glb', // Replace with actual URL
    thumbnail: 'https://via.placeholder.com/150/FF6347/FFFFFF?text=Studio',
    description: 'Professional studio setup',
    avatarPosition: [0, 0, 0],
    cameraDefault: {
      position: [-2, 1.5, 6],
      target: [-2, 1, 0]
    }
  },
  {
    id: 'empty',
    name: 'Empty Space',
    url: '', // No scene, just avatar
    thumbnail: 'https://via.placeholder.com/150/808080/FFFFFF?text=Empty',
    description: 'No background, focus on avatar',
    avatarPosition: [0, 0, 0],
    cameraDefault: {
      position: [0, 1.5, 5],
      target: [0, 1, 0]
    }
  }
];

// ============================================
// ANIMATIONS LIBRARY (EXPANDED)
// ============================================
export const ANIMATIONS: Animation[] = [
  // IDLE ANIMATIONS
  {
    id: 'idle',
    name: 'Idle',
    url: 'https://files.catbox.moe/0y2445.fbx',
    emoji: '🧍',
    description: 'Standing idle',
    loop: true,
    category: 'idle'
  },
  {
    id: 'talking',
    name: 'Talking',
    url: 'https://files.catbox.moe/460sop.fbx',
    emoji: '💬',
    description: 'Talking with hand gestures',
    loop: true,
    category: 'idle'
  },

  // LOCOMOTION ANIMATIONS
  {
    id: 'walk_forward',
    name: 'Walk Forward',
    url: 'https://files.catbox.moe/walk001.fbx', // Replace with actual URL
    emoji: '🚶',
    description: 'Walking forward',
    loop: true,
    category: 'locomotion'
  },
  {
    id: 'walk_right',
    name: 'Walk Right',
    url: 'https://files.catbox.moe/walk002.fbx', // Replace with actual URL
    emoji: '➡️',
    description: 'Walking to the right',
    loop: true,
    category: 'locomotion'
  },
  {
    id: 'walk_left',
    name: 'Walk Left',
    url: 'https://files.catbox.moe/walk003.fbx', // Replace with actual URL
    emoji: '⬅️',
    description: 'Walking to the left',
    loop: true,
    category: 'locomotion'
  },
  {
    id: 'walk_backward',
    name: 'Walk Backward',
    url: 'https://files.catbox.moe/walk004.fbx', // Replace with actual URL
    emoji: '⬆️',
    description: 'Walking backward',
    loop: true,
    category: 'locomotion'
  },
  {
    id: 'run',
    name: 'Run',
    url: 'https://files.catbox.moe/run001.fbx', // Replace with actual URL
    emoji: '🏃',
    description: 'Running forward',
    loop: true,
    category: 'locomotion'
  },

  // GESTURE ANIMATIONS
  {
    id: 'wave',
    name: 'Wave',
    url: 'https://files.catbox.moe/wave001.fbx', // Replace with actual URL
    emoji: '👋',
    description: 'Waving hello',
    loop: false,
    duration: 2,
    category: 'gesture'
  },
  {
    id: 'pointing',
    name: 'Pointing',
    url: 'https://files.catbox.moe/point001.fbx', // Replace with actual URL
    emoji: '👉',
    description: 'Pointing at something',
    loop: false,
    duration: 2,
    category: 'gesture'
  },
  {
    id: 'thumbs_up',
    name: 'Thumbs Up',
    url: 'https://files.catbox.moe/thumb001.fbx', // Replace with actual URL
    emoji: '👍',
    description: 'Giving thumbs up',
    loop: false,
    duration: 2,
    category: 'gesture'
  },
  {
    id: 'clapping',
    name: 'Clapping',
    url: 'https://files.catbox.moe/clap001.fbx', // Replace with actual URL
    emoji: '👏',
    description: 'Clapping hands',
    loop: false,
    duration: 3,
    category: 'gesture'
  },

  // EMOTION ANIMATIONS
  {
    id: 'dance',
    name: 'Dance',
    url: 'https://files.catbox.moe/dance001.fbx', // Replace with actual URL
    emoji: '💃',
    description: 'Dancing happily',
    loop: true,
    category: 'emotion'
  },
  {
    id: 'celebrate',
    name: 'Celebrate',
    url: 'https://files.catbox.moe/celebrate001.fbx', // Replace with actual URL
    emoji: '🎉',
    description: 'Celebrating victory',
    loop: false,
    duration: 3,
    category: 'emotion'
  },
];

// ============================================
// ACCENT DESCRIPTIONS
// ============================================
export const ACCENT_DESCRIPTIONS: Record<string, string> = {
  'American': 'Speak with a standard American English accent, like a young professional from the US.',
  'British': 'Speak with a British English accent, clear and articulate like a BBC presenter.',
  'Nigerian': 'Speak with a Nigerian English accent, with the characteristic rhythm and intonation.',
  'Australian': 'Speak with an Australian accent, casual and friendly.',
  'Indian': 'Speak with an Indian English accent, clear and expressive.',
  'South African': 'Speak with a South African accent.',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getAvatar(id: string): Avatar | undefined {
  return AVATARS.find(avatar => avatar.id === id);
}

export function getScene(id: string): Scene | undefined {
  return SCENES.find(scene => scene.id === id);
}

export function getAnimation(id: string): Animation | undefined {
  return ANIMATIONS.find(animation => animation.id === id);
}

export function getAnimationsByCategory(category: Animation['category']): Animation[] {
  return ANIMATIONS.filter(anim => anim.category === category);
}

export function getAccentDescription(accent: string): string {
  return ACCENT_DESCRIPTIONS[accent] || ACCENT_DESCRIPTIONS['American'];
}

export function getAnimationNames(): string[] {
  return ANIMATIONS.map(anim => anim.name);
}

export function getAnimationDescriptions(): string {
  return ANIMATIONS
    .map(anim => `- "${anim.name}" ${anim.emoji} (${anim.category}) - ${anim.description}`)
    .join('\n');
}

// ============================================
// DEFAULT EXPORTS
// ============================================

export const DEFAULT_AVATAR = AVATARS[0];
export const DEFAULT_SCENE = SCENES[0];
export const DEFAULT_ANIMATION = ANIMATIONS[0];