/**
 * FILE: src/lib/functions.ts
 * 
 * All custom function declarations and handlers in one place
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { getAnimationNames, getAnimationDescriptions } from "./animations";

// ============================================
// ANIMATION CONTROL (AI-Driven)
// ============================================

export const playAnimationDeclaration: FunctionDeclaration = {
  name: "play_animation",
  description: `Play an animation on Aifra's avatar to express emotions and actions physically. 

Available animations:
${getAnimationDescriptions()}

Use animations to enhance your presence naturally. Match animations to emotional tone and context.`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      animation: {
        type: Type.STRING,
        description: "Animation to play",
        enum: getAnimationNames(),
      },
      duration: {
        type: Type.NUMBER,
        description: "Seconds to play (optional). If not specified, animation plays until next animation or loops naturally.",
      },
    },
    required: ["animation"],
  },
};

// ============================================
// OTHER FUNCTIONS
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

export const saveNoteDeclaration: FunctionDeclaration = {
  name: "save_note",
  description: "Save a note or memo for later.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Note title",
      },
      content: {
        type: Type.STRING,
        description: "Note content",
      },
    },
    required: ["title", "content"],
  },
};

export const timerDeclaration: FunctionDeclaration = {
  name: "set_timer",
  description: "Set a countdown timer.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      minutes: {
        type: Type.NUMBER,
        description: "Number of minutes",
      },
      message: {
        type: Type.STRING,
        description: "Message when timer completes",
      },
    },
    required: ["minutes", "message"],
  },
};

export const decisionDeclaration: FunctionDeclaration = {
  name: "make_decision",
  description: "Make a random decision from options.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      options: {
        type: Type.STRING,
        description: "Comma-separated options",
      },
    },
    required: ["options"],
  },
};

export const openUrlDeclaration: FunctionDeclaration = {
  name: "open_url",
  description: "Open a URL in a new browser tab.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "URL to open",
      },
    },
    required: ["url"],
  },
};

// ============================================
// FUNCTION HANDLERS
// ============================================

export const handlePlayAnimation = (args: any) => {
  const { animation, duration } = args;
  
  console.log("🎬 handlePlayAnimation called with:", { animation, duration });
  
  // Dispatch event that Avatar component listens for
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

export const handleSaveNote = (args: any) => {
  const { title, content } = args;
  const timestamp = new Date().toISOString();
  
  const notesKey = 'aifra_notes';
  const existingNotes = JSON.parse(sessionStorage.getItem(notesKey) || '[]');
  
  const newNote = {
    id: Date.now(),
    title,
    content,
    timestamp,
  };
  
  existingNotes.push(newNote);
  sessionStorage.setItem(notesKey, JSON.stringify(existingNotes));
  
  return {
    success: true,
    message: `Note "${title}" saved`,
    noteId: newNote.id,
  };
};

export const handleSetTimer = (args: any) => {
  const { minutes, message } = args;
  const milliseconds = minutes * 60 * 1000;
  
  setTimeout(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Timer Complete!", { body: message });
    }
    alert(`⏰ Timer: ${message}`);
  }, milliseconds);
  
  return {
    success: true,
    message: `Timer set for ${minutes} minutes`,
    completionTime: new Date(Date.now() + milliseconds).toLocaleTimeString(),
  };
};

export const handleMakeDecision = (args: any) => {
  const { options } = args;
  const optionsArray = options.split(',').map((o: string) => o.trim());
  const chosen = optionsArray[Math.floor(Math.random() * optionsArray.length)];
  
  return {
    success: true,
    options: optionsArray,
    decision: chosen,
  };
};

export const handleOpenUrl = (args: any) => {
  const { url } = args;
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      success: false,
      error: "URL must start with http:// or https://",
    };
  }
  
  window.open(url, '_blank');
  
  return {
    success: true,
    url,
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
    
    case "get_weather":
      return await handleGetWeather(args);
    
    case "calculate":
      return handleCalculate(args);
    
    case "send_notification":
      return handleSendNotification(args);
    
    case "save_note":
      return handleSaveNote(args);
    
    case "set_timer":
      return handleSetTimer(args);
    
    case "make_decision":
      return handleMakeDecision(args);
    
    case "open_url":
      return handleOpenUrl(args);
    
    default:
      console.warn("❌ Unknown function:", functionName);
      return null;
  }
};

// ============================================
// EXPORT ALL DECLARATIONS
// ============================================

export const allFunctionDeclarations = [
  playAnimationDeclaration,  // AI controls animations!
  weatherDeclaration,
  calculateDeclaration,
  notificationDeclaration,
  saveNoteDeclaration,
  timerDeclaration,
  decisionDeclaration,
  openUrlDeclaration,
];