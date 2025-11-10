/**
 * FILE: src/lib/functions.ts
 * 
 * All custom function declarations and handlers - WITH FACIAL EXPRESSIONS
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { getAnimationNames, getAnimationDescriptions } from "./animations";
import { getExpressionNames, getExpressionDescriptions } from "./FacialExpressions";

// ============================================
// ANIMATION CONTROL (Body Animations)
// ============================================

export const playAnimationDeclaration: FunctionDeclaration = {
  name: "play_animation",
  description: `Play a BODY ANIMATION on Aifra's avatar (walking, gestures, dancing, etc.).

Available body animations:
${getAnimationDescriptions()}

Use animations to enhance physical presence. Match animations to context and emotions.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      animation: {
        type: Type.STRING,
        description: "Body animation to play",
        enum: getAnimationNames(),
      },
      duration: {
        type: Type.NUMBER,
        description: "Seconds to play (optional). If not specified, animation plays naturally.",
      },
    },
    required: ["animation"],
  },
};

// ============================================
// FACIAL EXPRESSION CONTROL (Morph Targets)
// ============================================

export const setExpressionDeclaration: FunctionDeclaration = {
  name: "set_expression",
  description: `Set a FACIAL EXPRESSION on Aifra's face using morph targets (emotions like happy, sad, angry, surprised, etc.).

Available facial expressions:
${getExpressionDescriptions()}

Use expressions to show emotions, reactions, and emotional states. Expressions affect only the face, not body movement.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      expression: {
        type: Type.STRING,
        description: "Facial expression to display",
        enum: getExpressionNames(),
      },
      duration: {
        type: Type.NUMBER,
        description: "How long to hold the expression in seconds (optional, defaults to natural duration)",
      },
    },
    required: ["expression"],
  },
};

// ============================================
// OTHER FUNCTIONS (from before)
// ============================================

export const weatherDeclaration: FunctionDeclaration = {
  name: "get_weather",
  description: "Get current weather information for a location.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "City name or location",
      },
      units: {
        type: Type.STRING,
        description: "Temperature units",
        enum: ["celsius", "fahrenheit"],
      },
    },
    required: ["location"],
  },
};

export const calculateDeclaration: FunctionDeclaration = {
  name: "calculate",
  description: "Perform mathematical calculations.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      expression: {
        type: Type.STRING,
        description: "Mathematical expression to evaluate",
      },
    },
    required: ["expression"],
  },
};

export const notificationDeclaration: FunctionDeclaration = {
  name: "send_notification",
  description: "Send a browser notification to the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Notification title",
      },
      message: {
        type: Type.STRING,
        description: "Notification message body",
      },
    },
    required: ["title", "message"],
  },
};

// ============================================
// FUNCTION HANDLERS
// ============================================

export const handlePlayAnimation = (args: any) => {
  const { animation, duration } = args;
  
  console.log("🎬 handlePlayAnimation called with:", { animation, duration });
  
  window.dispatchEvent(new CustomEvent('avatarAnimation', { 
    detail: { animation, duration } 
  }));
  
  console.log("✅ Animation event dispatched:", animation);
  
  return {
    success: true,
    animation,
    duration: duration || 'continuous',
    message: `Playing ${animation} animation${duration ? ` for ${duration} seconds` : ''}`,
  };
};

export const handleSetExpression = (args: any) => {
  const { expression, duration } = args;
  
  console.log("😊 handleSetExpression called with:", { expression, duration });
  
  window.dispatchEvent(new CustomEvent('avatarExpression', { 
    detail: { expression, duration } 
  }));
  
  console.log("✅ Expression event dispatched:", expression);
  
  return {
    success: true,
    expression,
    duration: duration || 'default',
    message: `Setting facial expression to ${expression}${duration ? ` for ${duration} seconds` : ''}`,
  };
};

export const handleGetWeather = async (args: any) => {
  const { location, units = "celsius" } = args;
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const temp = units === "celsius" ? 22 : 72;
  return {
    success: true,
    location,
    temperature: temp,
    units,
    condition: "Partly Cloudy",
    humidity: 65,
    windSpeed: 15,
  };
};

export const handleCalculate = (args: any) => {
  const { expression } = args;
  
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    return {
      success: true,
      expression,
      result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      expression,
    };
  }
};

export const handleSendNotification = (args: any) => {
  const { title, message } = args;
  
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body: message });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body: message });
        }
      });
    }
  }
  
  return {
    success: true,
    title,
    message,
  };
};

// ============================================
// FUNCTION ROUTER
// ============================================

export const handleFunctionCall = async (functionName: any, args: any) => {
  console.log("📞 Function called:", functionName, "with args:", args);
  
  switch (functionName) {
    case "play_animation":
      return handlePlayAnimation(args);
    
    case "set_expression":
      return handleSetExpression(args);
    
    case "get_weather":
      return await handleGetWeather(args);
    
    case "calculate":
      return handleCalculate(args);
    
    case "send_notification":
      return handleSendNotification(args);
    
    default:
      console.warn("❌ Unknown function:", functionName);
      return null;
  }
};

// ============================================
// EXPORT ALL DECLARATIONS
// ============================================

export const allFunctionDeclarations = [
  playAnimationDeclaration,      // Body animations
  setExpressionDeclaration,      // Facial expressions
  weatherDeclaration,
  calculateDeclaration,
  notificationDeclaration,
];