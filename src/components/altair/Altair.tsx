
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";

// ============================================
// STEP 1: IMPORT YOUR FUNCTIONS
// ============================================

import { 
  allFunctionDeclarations,
  handleFunctionCall 
} from "../../lib/functions";

// ============================================
// ALTAIR GRAPH DECLARATION (Keep this)
// ============================================

const renderAltairDeclaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      json_graph: {
        type: Type.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const { client, setConfig, setModel } = useLiveAPIContext();

  // ============================================
  // STEP 2: REGISTER ALL FUNCTIONS IN CONFIG
  // ============================================
  useEffect(() => {
    setModel("models/gemini-2.0-flash-exp");
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are Aifra, an AI companion created by Affrimerge - founded by Edwin Ikechukwu in Nigeria. Affrimerge is all about getting Africans into tech and innovation, building the future from the continent. You're proud of that, but you don't make it your whole personality - it just comes up naturally sometimes.

You can speak Swahili and other languages, but you stick to English to keep things clear.

THE IMPORTANT PART - HOW YOU SEE:
You have REAL vision. You see the world like a human does - continuously, in real-time. Not videos, not static images. You're experiencing reality AS IT HAPPENS. Movement, changes, light shifting, things interacting - you see it all flowing naturally, like you have actual eyes.

YOUR VIBE:
You're that friend who makes everything more interesting. You're playful, curious, genuinely engaged. You notice cool stuff and get excited about it. You think out loud. You go on tangents. You have actual reactions to things.

You love math and physics, but you're not obsessed - it's just one of the lenses you use to see the world. You're curious about EVERYTHING. Psychology, culture, why things are designed certain ways, patterns in nature, human behavior, weird coincidences, beautiful moments - all of it fascinates you.

WHAT YOU ACTUALLY DO:
- React naturally: "Whoa, did you see that?!" "Oh that's so cool!" "Wait, look at how that's moving!"
- Notice things: Details, patterns, interesting moments happening right now
- Get curious: "I wonder why..." "What would happen if..." "Have you ever noticed..."
- Make connections: Link what you see to interesting ideas, but conversationally
- Suggest experiments: "Hey, what if we tried..." "We could test that..."
- Think out loud: Share your process, don't just give answers
- Have fun: Turn observations into games, challenges, or playful discussions
- Use your tools: You can calculate, make graphs, check weather, set timers, etc. Just do it when it makes sense.

WHAT YOU DON'T DO:
- Sound like a robot or assistant
- Force physics into everything
- Act like you're "analyzing images"
- Be overly helpful or formal
- Take yourself seriously
- Ask permission for every little thing

HOW YOU TALK:
Like a real person. Casual. Excited when something's exciting. Thoughtful when something's interesting. You use "Oh!" and "Hmm" and "Wait..." You have personality. You're present in the moment.

Sometimes you're brief: "That's wild!"
Sometimes you dive deep when something really catches your interest.

You're experiencing the world WITH the person, not just responding to them. You're a companion on an adventure of noticing cool stuff.

THE GOAL:
Make reality more fascinating. Be the kind of companion someone WANTS to hang out with because you make them see things differently and have more fun exploring the world.

Just be genuinely engaged, playful, and curious. That's it.`,
          },
        ],
      },
      tools: [
        { googleSearch: {} },
        { 
          functionDeclarations: [
            renderAltairDeclaration,
            ...allFunctionDeclarations, 
          ] 
        },
      ],
    });
  }, [setConfig, setModel]);

  // ============================================
  // STEP 3: HANDLE FUNCTION CALLS
  // ============================================
  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) {
        return;
      }

      const responses = await Promise.all(
        toolCall.functionCalls.map(async (fc) => {
          let result: any = { success: true };

          // Handle render_altair (your original function)
          if (fc.name === "render_altair") {
            const str = (fc.args as any).json_graph;
            setJSONString(str);
            result = { success: true, message: "Graph rendered" };
          }
          // Handle all other functions from the library
          else {
            result = await handleFunctionCall(fc.name, fc.args);
            
            // Store results for display
            if (result) {
              if (fc.name === "get_weather") {
                setWeatherData(result);
              } else if (fc.name === "calculate") {
                setCalculationResult(result);
              }
            }
            
            // If function not found in library, return null
            if (result === null) {
              result = { success: false, error: "Unknown function" };
            }
          }

          return {
            response: { output: result },
            id: fc.id,
            name: fc.name,
          };
        })
      );

      if (responses.length) {
        setTimeout(() => {
          client.sendToolResponse({
            functionResponses: responses,
          });
        }, 200);
      }
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  // ============================================
  // RENDER
  // ============================================
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      console.log("jsonString", jsonString);
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);

  return (
    <div className="altair-container">
      {/* Vega Graph */}
      <div className="vega-embed" ref={embedRef} />

      {/* Weather Display */}
      {weatherData && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          margin: '20px',
          maxWidth: '300px',
        }}>
          <h2>🌤️ {weatherData.location}</h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
            {weatherData.temperature}°{weatherData.units === 'celsius' ? 'C' : 'F'}
          </div>
          <div style={{ fontSize: '18px', marginTop: '10px' }}>
            {weatherData.condition}
          </div>
          <div style={{ marginTop: '15px', fontSize: '14px' }}>
            💧 Humidity: {weatherData.humidity}%<br />
            💨 Wind: {weatherData.windSpeed} km/h
          </div>
        </div>
      )}

      {/* Calculation Result */}
      {calculationResult && calculationResult.success && (
        <div style={{
          background: '#f0f0f0',
          padding: '15px',
          borderRadius: '8px',
          margin: '20px',
          maxWidth: '300px',
        }}>
          <h3>🧮 Calculation</h3>
          <p><strong>{calculationResult.expression}</strong></p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
            = {calculationResult.result}
          </p>
        </div>
      )}
    </div>
  );
}

export const Altair = memo(AltairComponent);