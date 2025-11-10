import { useState } from 'react';
import { SCENES, AVATARS, Scene, Avatar } from './SceneManeger';

interface SceneSelectorProps {
  currentScene: string;
  currentAvatar: string;
  onSceneChange: (sceneId: string) => void;
  onAvatarChange: (avatarId: string) => void;
}

export default function SceneSelector({
  currentScene,
  currentAvatar,
  onSceneChange,
  onAvatarChange
}: SceneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenes' | 'avatars'>('scenes');

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          border: 'none',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 2000,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '4px',
          padding: '8px'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
        }}
      >
        {/* Hamburger Icon */}
        <div style={{
          width: '24px',
          height: '2px',
          background: 'white',
          borderRadius: '2px',
          transition: 'all 0.3s',
          transform: isOpen ? 'rotate(45deg) translateY(7px)' : 'none'
        }} />
        <div style={{
          width: '24px',
          height: '2px',
          background: 'white',
          borderRadius: '2px',
          transition: 'all 0.3s',
          opacity: isOpen ? 0 : 1
        }} />
        <div style={{
          width: '24px',
          height: '2px',
          background: 'white',
          borderRadius: '2px',
          transition: 'all 0.3s',
          transform: isOpen ? 'rotate(-45deg) translateY(-7px)' : 'none'
        }} />
      </button>

      {/* Slide-out Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1999,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'opacity 0.3s ease'
      }} onClick={() => setIsOpen(false)}>
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '340px',
            height: '100vh',
            background: 'linear-gradient(135deg, #1a1d1e 0%, #232729 100%)',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '80px 24px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              margin: 0,
              fontFamily: '"Space Mono", monospace',
              fontSize: '24px',
              fontWeight: '600',
              color: '#ffffff',
              marginBottom: '8px'
            }}>
              Settings
            </h2>
            <p style={{
              margin: 0,
              fontFamily: '"Space Mono", monospace',
              fontSize: '12px',
              color: '#888d8f'
            }}>
              Customize your experience
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            padding: '16px 24px 0',
            gap: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setActiveTab('scenes')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'scenes' ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                color: activeTab === 'scenes' ? '#667eea' : '#888d8f',
                fontFamily: '"Space Mono", monospace',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderRadius: '8px 8px 0 0',
                borderBottom: activeTab === 'scenes' ? '2px solid #667eea' : '2px solid transparent'
              }}
            >
              🏠 Scenes
            </button>
            <button
              onClick={() => setActiveTab('avatars')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'avatars' ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                color: activeTab === 'avatars' ? '#667eea' : '#888d8f',
                fontFamily: '"Space Mono", monospace',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderRadius: '8px 8px 0 0',
                borderBottom: activeTab === 'avatars' ? '2px solid #667eea' : '2px solid transparent'
              }}
            >
              👤 Avatars
            </button>
          </div>

          {/* Content */}
          <div style={{
            padding: '24px'
          }}>
            {activeTab === 'scenes' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {SCENES.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      onSceneChange(scene.id);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '0',
                      border: currentScene === scene.id ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      background: currentScene === scene.id 
                        ? 'rgba(102, 126, 234, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (currentScene !== scene.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentScene !== scene.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', padding: '12px' }}>
                      <img 
                        src={scene.thumbnail} 
                        alt={scene.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}
                        loading="lazy"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: '"Space Mono", monospace',
                          fontSize: '15px',
                          fontWeight: '600',
                          color: currentScene === scene.id ? '#667eea' : '#ffffff',
                          marginBottom: '4px'
                        }}>
                          {scene.name}
                        </div>
                        <div style={{
                          fontFamily: '"Space Mono", monospace',
                          fontSize: '11px',
                          color: '#888d8f',
                          lineHeight: '1.4'
                        }}>
                          {scene.description}
                        </div>
                        {currentScene === scene.id && (
                          <div style={{
                            marginTop: '8px',
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: 'rgba(102, 126, 234, 0.3)',
                            borderRadius: '4px',
                            fontSize: '10px',
                            color: '#667eea',
                            fontWeight: '600'
                          }}>
                            ✓ Active
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'avatars' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      onAvatarChange(avatar.id);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '12px',
                      border: currentAvatar === avatar.id ? '2px solid #667eea' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      background: currentAvatar === avatar.id 
                        ? 'rgba(102, 126, 234, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      position: 'fixed',
                      left: '50%',
                      zIndex: '9999',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (currentAvatar !== avatar.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentAvatar !== avatar.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <img 
                      src={avatar.thumbnail} 
                      alt={avatar.name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(255, 255, 255, 0.1)'
                      }}
                      loading="lazy"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: '"Space Mono", monospace',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: currentAvatar === avatar.id ? '#667eea' : '#ffffff',
                        marginBottom: '4px'
                      }}>
                        {avatar.name}
                      </div>
                      <div style={{
                        fontFamily: '"Space Mono", monospace',
                        fontSize: '11px',
                        color: '#888d8f',
                        marginBottom: '6px',
                        lineHeight: '1.3'
                      }}>
                        {avatar.description}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{
                          fontFamily: '"Space Mono", monospace',
                          fontSize: '10px',
                          color: '#667eea',
                          background: 'rgba(102, 126, 234, 0.2)',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}>
                          🗣️ {avatar.accent}
                        </span>
                        {currentAvatar === avatar.id && (
                          <span style={{
                            fontSize: '10px',
                            color: '#667eea',
                            fontWeight: '600'
                          }}>
                            ✓ Active
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}