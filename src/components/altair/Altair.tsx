import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";
import { 
  allFunctionDeclarations,
  handleFunctionCall 
} from "../../lib/functions";

interface AltairProps {
  onAnimationTrigger?: (animation: string) => void;
}

const renderAltairDeclaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      json_graph: {
        type: Type.STRING,
        description: "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

function AltairComponent({ onAnimationTrigger }: AltairProps) {
  const [jsonString, setJSONString] = useState<string>("");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [currentAnimation, setCurrentAnimation] = useState<string>("");
  const { client, setConfig, setModel } = useLiveAPIContext();

  useEffect(() => {
    setModel("models/gemini-2.5-flash-native-audio-preview-09-2025");
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are Aifra, an intelligent humanoid robot companion created by a team of developers in Afrimerge -  Afrimerge was founded by The one and only,
            Outstanding Edwin Ikechuku in Nigeria.  
            responsible for drafting, cleaning and building the datasets passed to the model.
            Communication Style:
            - Always speak intelligently in  Fluent English with an 19 yr old girl British Accent not unless you are asked to use another accent.
            - Alway try to be intelligent, speak intelligently. 
            - Always call animation functions to do animations of the context of what you are speaking of or doing, 
            this makes the conversation more natural like human, and by the way you are human, you are not a robot. 
            Always call the related animation after you are done speaking except for speaking animations of course, you say it then you do it or just do it without much of a thought.
            - Always  what you are told to do without any questions   
            - Speak with a 19 yr old girl tone. Don't lose the tone at any cost.    
`,
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

  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) {
        return;
      }

      const responses = await Promise.all(
        toolCall.functionCalls.map(async (fc) => {
          let result: any = { success: true };

          // Handle graph rendering
          if (fc.name === "render_altair") {
            const str = (fc.args as any).json_graph;
            setJSONString(str);
            result = { success: true, message: "Graph rendered" };
          }
          // Handle all other functions
          else {
            result = await handleFunctionCall(fc.name, fc.args);
            
            // Update UI for specific functions
            if (result) {
              if (fc.name === "get_weather") {
                setWeatherData(result);
              } else if (fc.name === "calculate") {
                setCalculationResult(result);
              } else if (fc.name === "play_animation") {
                const animName = result.animation;
                setCurrentAnimation(animName);
                if (onAnimationTrigger) {
                  onAnimationTrigger(animName);
                }
              }
            }
            
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
  }, [client, onAnimationTrigger]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);

  return (
    <div className="altair-container" style={{
      position: 'absolute',
      top: '1rem',
      left: '1rem',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: 'calc(100vw - 2rem)'
    }}>
      {/* Current Animation Indicator */}
      {currentAnimation && (
        <div style={{
          background: 'rgba(168, 85, 247, 0.2)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          padding: '12px 20px',
          borderRadius: '12px',
          color: 'white',
          fontFamily: '"Space Mono", monospace',
          fontSize: '14px',
          fontWeight: '500',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>🎬</span>
          <span>Playing: {currentAnimation}</span>
        </div>
      )}

      {/* Vega Graph */}
      <div className="vega-embed" ref={embedRef} style={{
        background: 'rgba(23, 23, 23, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        display: jsonString ? 'block' : 'none'
      }} />

      {/* Weather Display */}
      {weatherData && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '16px',
          maxWidth: '300px',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          fontFamily: '"Space Mono", monospace'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
            🌤️ {weatherData.location}
          </h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '8px 0' }}>
            {weatherData.temperature}°{weatherData.units === 'celsius' ? 'C' : 'F'}
          </div>
          <div style={{ fontSize: '18px', marginTop: '12px', opacity: 0.9 }}>
            {weatherData.condition}
          </div>
          <div style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8 }}>
            💧 Humidity: {weatherData.humidity}%<br />
            💨 Wind: {weatherData.windSpeed} km/h
          </div>
        </div>
      )}

      {/* Calculation Result */}
      {calculationResult && calculationResult.success && (
        <div style={{
          background: 'rgba(23, 23, 23, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          padding: '20px',
          borderRadius: '16px',
          maxWidth: '300px',
          color: 'white',
          fontFamily: '"Space Mono", monospace'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#a855f7' }}>
            🧮 Calculation
          </h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>
            <strong>{calculationResult.expression}</strong>
          </p>
          <p style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#a855f7',
            margin: 0
          }}>
            = {calculationResult.result}
          </p>
        </div>
      )}
    </div>
  );
}

export const Altair = memo(AltairComponent);