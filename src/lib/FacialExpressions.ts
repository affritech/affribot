/**
 * FILE: src/lib/FacialExpressions.ts
 * 
 * Facial expression system using ARKit morph targets
 */

export interface FacialExpression {
  id: string;
  name: string;
  emoji: string;
  description: string;
  morphTargets: {
    [key: string]: number; // morph target name -> value (0-1)
  };
  duration?: number; // How long to hold the expression (seconds)
  category: 'emotion' | 'reaction' | 'neutral';
}

// ============================================
// FACIAL EXPRESSIONS LIBRARY
// ============================================
export const FACIAL_EXPRESSIONS: FacialExpression[] = [
  // EMOTIONS
  {
    id: 'happy',
    name: 'Happy',
    emoji: '😊',
    description: 'Smiling and happy',
    category: 'emotion',
    morphTargets: {
      mouthSmileLeft: 0.8,
      mouthSmileRight: 0.8,
      mouthClose: 0.3,
      cheekSquintLeft: 0.4,
      cheekSquintRight: 0.4,
      eyeSquintLeft: 0.3,
      eyeSquintRight: 0.3,
    },
    duration: 3
  },
  {
    id: 'sad',
    name: 'Sad',
    emoji: '😢',
    description: 'Sad and downcast',
    category: 'emotion',
    morphTargets: {
      mouthFrownLeft: 0.7,
      mouthFrownRight: 0.7,
      mouthLowerDownLeft: 0.5,
      mouthLowerDownRight: 0.5,
      browInnerUp: 0.6,
      browDownLeft: 0.4,
      browDownRight: 0.4,
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2,
    },
    duration: 3
  },
  {
    id: 'angry',
    name: 'Angry',
    emoji: '😠',
    description: 'Angry and upset',
    category: 'emotion',
    morphTargets: {
      browDownLeft: 0.9,
      browDownRight: 0.9,
      eyeSquintLeft: 0.6,
      eyeSquintRight: 0.6,
      mouthPressLeft: 0.7,
      mouthPressRight: 0.7,
      mouthStretchLeft: 0.3,
      mouthStretchRight: 0.3,
      noseSneerLeft: 0.4,
      noseSneerRight: 0.4,
    },
    duration: 3
  },
  {
    id: 'surprised',
    name: 'Surprised',
    emoji: '😲',
    description: 'Shocked and surprised',
    category: 'reaction',
    morphTargets: {
      eyeWideLeft: 0.9,
      eyeWideRight: 0.9,
      browInnerUp: 0.8,
      browOuterUpLeft: 0.8,
      browOuterUpRight: 0.8,
      jawOpen: 0.5,
      mouthOpen: 0.4,
    },
    duration: 2
  },
  {
    id: 'disgusted',
    name: 'Disgusted',
    emoji: '🤢',
    description: 'Disgusted reaction',
    category: 'reaction',
    morphTargets: {
      noseSneerLeft: 0.8,
      noseSneerRight: 0.8,
      mouthUpperUpLeft: 0.6,
      mouthUpperUpRight: 0.6,
      eyeSquintLeft: 0.4,
      eyeSquintRight: 0.4,
      mouthFrownLeft: 0.5,
      mouthFrownRight: 0.5,
    },
    duration: 2
  },
  {
    id: 'scared',
    name: 'Scared',
    emoji: '😨',
    description: 'Frightened expression',
    category: 'emotion',
    morphTargets: {
      eyeWideLeft: 0.9,
      eyeWideRight: 0.9,
      browInnerUp: 0.7,
      mouthOpen: 0.3,
      jawOpen: 0.2,
      mouthStretchLeft: 0.3,
      mouthStretchRight: 0.3,
    },
    duration: 3
  },

  // REACTIONS
  {
    id: 'thinking',
    name: 'Thinking',
    emoji: '🤔',
    description: 'Pondering something',
    category: 'reaction',
    morphTargets: {
      browInnerUp: 0.3,
      eyeLookUpLeft: 0.4,
      eyeLookUpRight: 0.4,
      mouthPucker: 0.3,
      mouthLeft: 0.2,
    },
    duration: 3
  },
  {
    id: 'confused',
    name: 'Confused',
    emoji: '😕',
    description: 'Confused or puzzled',
    category: 'reaction',
    morphTargets: {
      browInnerUp: 0.5,
      browDownLeft: 0.3,
      browDownRight: 0.3,
      mouthFrownLeft: 0.4,
      mouthFrownRight: 0.4,
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2,
    },
    duration: 3
  },
  {
    id: 'smirk',
    name: 'Smirk',
    emoji: '😏',
    description: 'Smug or sarcastic smile',
    category: 'reaction',
    morphTargets: {
      mouthSmileLeft: 0.7,
      mouthSmileRight: 0.3,
      mouthLeft: 0.2,
      eyeSquintLeft: 0.3,
      browDownRight: 0.2,
    },
    duration: 2
  },
  {
    id: 'wink',
    name: 'Wink',
    emoji: '😉',
    description: 'Friendly wink',
    category: 'reaction',
    morphTargets: {
      eyeBlinkLeft: 1.0,
      mouthSmileLeft: 0.5,
      mouthSmileRight: 0.5,
      cheekSquintLeft: 0.6,
    },
    duration: 1
  },

  // NEUTRAL
  {
    id: 'neutral',
    name: 'Neutral',
    emoji: '😐',
    description: 'Neutral expression',
    category: 'neutral',
    morphTargets: {
      // Reset all to neutral
    },
    duration: 2
  },
  {
    id: 'focused',
    name: 'Focused',
    emoji: '🧐',
    description: 'Concentrated and focused',
    category: 'neutral',
    morphTargets: {
      browDownLeft: 0.3,
      browDownRight: 0.3,
      eyeSquintLeft: 0.2,
      eyeSquintRight: 0.2,
      mouthClose: 0.4,
    },
    duration: 3
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getExpression(id: string): FacialExpression | undefined {
  return FACIAL_EXPRESSIONS.find(expr => expr.id === id);
}

export function getExpressionsByCategory(category: FacialExpression['category']): FacialExpression[] {
  return FACIAL_EXPRESSIONS.filter(expr => expr.category === category);
}

export function getExpressionNames(): string[] {
  return FACIAL_EXPRESSIONS.map(expr => expr.name);
}

export function getExpressionDescriptions(): string {
  return FACIAL_EXPRESSIONS
    .map(expr => `- "${expr.name}" ${expr.emoji} (${expr.category}) - ${expr.description}`)
    .join('\n');
}

/**
 * Apply a facial expression to a mesh with morph targets
 */
export function applyExpression(
  mesh: any,
  expression: FacialExpression,
  duration: number = 0.3
): void {
  if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
    console.warn('⚠️ Mesh does not support morph targets');
    return;
  }

  const morphDict = mesh.morphTargetDictionary;
  const influences = mesh.morphTargetInfluences;

  // First, reset all morph targets to 0
  for (let i = 0; i < influences.length; i++) {
    influences[i] = 0;
  }

  // Then apply the expression morph targets
  Object.entries(expression.morphTargets).forEach(([morphName, targetValue]) => {
    const morphIndex = morphDict[morphName];
    if (morphIndex !== undefined) {
      influences[morphIndex] = targetValue;
    } else {
      console.warn(`⚠️ Morph target "${morphName}" not found in model`);
    }
  });

  console.log(`😊 Applied expression: ${expression.name} ${expression.emoji}`);
}

/**
 * Smoothly transition between expressions
 */
export function transitionExpression(
  mesh: any,
  fromExpression: FacialExpression,
  toExpression: FacialExpression,
  progress: number // 0 to 1
): void {
  if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
    return;
  }

  const morphDict = mesh.morphTargetDictionary;
  const influences = mesh.morphTargetInfluences;

  // Get all unique morph target names from both expressions
  const allMorphs = new Set([
    ...Object.keys(fromExpression.morphTargets),
    ...Object.keys(toExpression.morphTargets)
  ]);

  allMorphs.forEach(morphName => {
    const fromValue = fromExpression.morphTargets[morphName] || 0;
    const toValue = toExpression.morphTargets[morphName] || 0;
    const morphIndex = morphDict[morphName];

    if (morphIndex !== undefined) {
      // Linear interpolation
      influences[morphIndex] = fromValue + (toValue - fromValue) * progress;
    }
  });
}

/**
 * Reset all morph targets to neutral
 */
export function resetExpression(mesh: any): void {
  if (!mesh || !mesh.morphTargetInfluences) return;
  
  for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
    mesh.morphTargetInfluences[i] = 0;
  }
}

export default FACIAL_EXPRESSIONS;