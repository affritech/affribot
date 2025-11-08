import {
  ChangeEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import "./settings-dialog.scss";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import VoiceSelector from "./VoiceSelector";
import ResponseModalitySelector from "./ResponseModalitySelector";
import { FunctionDeclaration, LiveConnectConfig, Tool } from "@google/genai";

type FunctionDeclarationsTool = Tool & {
  functionDeclarations: FunctionDeclaration[];
};

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { config, setConfig, connected } = useLiveAPIContext();
  
  // Local state for custom settings
  const [temperature, setTemperature] = useState<number>(1.0);
  const [topP, setTopP] = useState<number>(0.95);
  const [topK, setTopK] = useState<number>(40);
  
  const functionDeclarations: FunctionDeclaration[] = useMemo(() => {
    if (!Array.isArray(config.tools)) {
      return [];
    }
    return (config.tools as Tool[])
      .filter((t: Tool): t is FunctionDeclarationsTool =>
        Array.isArray((t as any).functionDeclarations)
      )
      .map((t) => t.functionDeclarations)
      .filter((fc) => !!fc)
      .flat();
  }, [config]);

  const updateFunctionDescription = useCallback(
    (editedFdName: string, newDescription: string) => {
      const newConfig: LiveConnectConfig = {
        ...config,
        tools:
          config.tools?.map((tool) => {
            const fdTool = tool as FunctionDeclarationsTool;
            if (!Array.isArray(fdTool.functionDeclarations)) {
              return tool;
            }
            return {
              ...tool,
              functionDeclarations: fdTool.functionDeclarations.map((fd) =>
                fd.name === editedFdName
                  ? { ...fd, description: newDescription }
                  : fd
              ),
            };
          }) || [],
      };
      setConfig(newConfig);
    },
    [config, setConfig]
  );

  // Handler for temperature change
  const handleTemperatureChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTemperature(value);
    const newConfig: LiveConnectConfig = {
      ...config,
      generationConfig: {
        ...config.generationConfig,
        temperature: value,
      },
    };
    setConfig(newConfig);
  }, [config, setConfig]);

  // Handler for topP change
  const handleTopPChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTopP(value);
    const newConfig: LiveConnectConfig = {
      ...config,
      generationConfig: {
        ...config.generationConfig,
        topP: value,
      },
    };
    setConfig(newConfig);
  }, [config, setConfig]);

  // Handler for topK change
  const handleTopKChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setTopK(value);
    const newConfig: LiveConnectConfig = {
      ...config,
      generationConfig: {
        ...config.generationConfig,
        topK: value,
      },
    };
    setConfig(newConfig);
  }, [config, setConfig]);

  return (
    <div className="settings-dialog">
      <button
        className="action-button material-symbols-outlined"
        onClick={() => setOpen(!open)}
      >
        settings
      </button>
      <dialog className="dialog" style={{ display: open ? "block" : "none" }}>
        <div className={`dialog-container ${connected ? "disabled" : ""}`}>
          {connected && (
            <div className="connected-indicator">
              <p>
                These settings can only be applied before connecting and will
                override other settings.
              </p>
            </div>
          )}
          
          <div className="mode-selectors">
            <ResponseModalitySelector />
            <VoiceSelector />
          </div>

          <h3>Generation Settings</h3>
          <div className="generation-settings">
            <div className="setting-group">
              <label htmlFor="temperature-slider">
                Temperature: {temperature.toFixed(2)}
              </label>
              <input
                id="temperature-slider"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={handleTemperatureChange}
                className="slider"
              />
              <small>Controls randomness (0 = focused, 2 = creative)</small>
            </div>

            <div className="setting-group">
              <label htmlFor="top-p-slider">
                Top P: {topP.toFixed(2)}
              </label>
              <input
                id="top-p-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={topP}
                onChange={handleTopPChange}
                className="slider"
              />
              <small>Nucleus sampling threshold (0.1 = narrow, 1 = diverse)</small>
            </div>

            <div className="setting-group">
              <label htmlFor="top-k-slider">
                Top K: {topK}
              </label>
              <input
                id="top-k-slider"
                type="range"
                min="1"
                max="100"
                step="1"
                value={topK}
                onChange={handleTopKChange}
                className="slider"
              />
              <small>Limits vocabulary selection (lower = more focused)</small>
            </div>
          </div>

          <h4>Function declarations</h4>
          <div className="function-declarations">
            <div className="fd-rows">
              {functionDeclarations.map((fd, fdKey) => (
                <div className="fd-row" key={`function-${fdKey}`}>
                  <span className="fd-row-name">{fd.name}</span>
                  <span className="fd-row-args">
                    {Object.keys(fd.parameters?.properties || {}).map(
                      (item, k) => (
                        <span key={k}>{item}</span>
                      )
                    )}
                  </span>
                  <input
                    key={`fd-${fd.description}`}
                    className="fd-row-description"
                    type="text"
                    defaultValue={fd.description}
                    onBlur={(e) =>
                      updateFunctionDescription(fd.name!, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}