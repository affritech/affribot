import { useState } from 'react';

interface MenuProps {
  onAvatarChange: (avatarUrl: string) => void;
  currentAvatar?: string;
}

// Add your Ready Player Me avatars here
// Each should have its own GLB file in public/models/
const AVATARS = [
  {
    id: '1',
    name: 'Aifra',
    url: 'https://files.catbox.moe/yvr97o.glb',
    thumb: '👩',
    description: 'Original look'
  },
  // Add more avatars from Ready Player Me:
  // {
  //   id: '2',
  //   name: 'Casual Outfit',
  //   url: 'models/your-avatar-id.glb',
  //   thumb: '👔',
  //   description: 'Casual wear'
  // },
];

export default function AvatarMenu({ onAvatarChange, currentAvatar }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #1f94ff 0%, #0d6efd 100%)',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(31, 148, 255, 0.4)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(31, 148, 255, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 148, 255, 0.4)';
        }}
      >
        {isOpen ? '✕' : '👗'}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '20px',
          width: '340px',
          maxHeight: '500px',
          background: 'linear-gradient(135deg, #1c1f21 0%, #2a2f31 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid #404547'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #404547',
            background: 'rgba(31, 148, 255, 0.1)'
          }}>
            <h3 style={{
              margin: 0,
              fontFamily: '"Space Mono", monospace',
              fontSize: '16px',
              fontWeight: '500',
              color: '#e1e2e3'
            }}>
              🎭 Avatar Appearance
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              fontFamily: '"Space Mono", monospace',
              fontSize: '11px',
              color: '#888d8f'
            }}>
              Choose outfit & accessories
            </p>
          </div>

          <div style={{
            padding: '16px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    onAvatarChange(avatar.url);
                    // Dispatch event for Experience component
                    window.dispatchEvent(new CustomEvent('changeAvatar', {
                      detail: { avatarUrl: avatar.url }
                    }));
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '12px',
                    border: currentAvatar === avatar.url 
                      ? '2px solid #1f94ff' 
                      : '1px solid #404547',
                    borderRadius: '12px',
                    background: currentAvatar === avatar.url
                      ? 'linear-gradient(135deg, rgba(31, 148, 255, 0.2) 0%, rgba(13, 110, 253, 0.2) 100%)'
                      : '#232729',
                    color: '#e1e2e3',
                    cursor: 'pointer',
                    fontFamily: '"Space Mono", monospace',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    if (currentAvatar !== avatar.url) {
                      e.currentTarget.style.background = '#2a2f31';
                      e.currentTarget.style.borderColor = '#707577';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (currentAvatar !== avatar.url) {
                      e.currentTarget.style.background = '#232729';
                      e.currentTarget.style.borderColor = '#404547';
                    }
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1f94ff 0%, #0d6efd 100%)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px'
                  }}>
                    {avatar.thumb}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600',
                      color: currentAvatar === avatar.url ? '#1f94ff' : '#e1e2e3'
                    }}>
                      {avatar.name}
                    </div>
                    <div style={{ 
                      fontSize: '11px',
                      color: '#888d8f',
                      marginTop: '2px'
                    }}>
                      {avatar.description}
                    </div>
                  </div>
                  {currentAvatar === avatar.url && (
                    <span style={{ fontSize: '16px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => window.open('https://demo.readyplayer.me', '_blank')}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px dashed #404547',
                  borderRadius: '12px',
                  background: 'transparent',
                  color: '#1f94ff',
                  cursor: 'pointer',
                  fontFamily: '"Space Mono", monospace',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#1f94ff';
                  e.currentTarget.style.background = 'rgba(31, 148, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#404547';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>➕</span>
                <span>Create New Avatar</span>
              </button>

              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#232729',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#888d8f',
                fontFamily: '"Space Mono", monospace',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: '#1f94ff' }}>💡 How to add avatars:</strong><br />
                1. Create avatar at ReadyPlayer.me<br />
                2. Download GLB with morphTargets=ARKit<br />
                3. Save to <code style={{
                  background: '#1c1f21',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: '#1f94ff'
                }}>public/models/</code><br />
                4. Add entry to AVATARS array
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}