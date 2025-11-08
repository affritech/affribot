import { useState } from 'react';

interface CustomizerProps {
  onAvatarChange: (avatarUrl: string) => void;
  currentAvatar: string;
}

const AVATARS = [
  {
    id: '1',
    name: 'Default Male',
    url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934f4.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934f4.png'
  },
  {
    id: '2',
    name: 'Business Female',
    url: 'https://models.readyplayer.me/64c0a0fcbb1e1c6ff46b8a5a.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/64c0a0fcbb1e1c6ff46b8a5a.png'
  },
  {
    id: '3',
    name: 'Super Soldier',
    url: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.png'
  },
   {
    id: '3',
    name: 'Casual Male',
    url: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.png'
  },
   {
    id: '3',
    name: 'Casual Male',
    url: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.png'
  },
   {
    id: '3',
    name: 'Casual Male',
    url: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.png'
  },
   {
    id: '3',
    name: 'Casual Male',
    url: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.png'
  }, {
    id: '3',
    name: 'Casual Male',
    url: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.png'
  } ,{
    id: '3',
    name: 'Casual Male',
    url: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.png'
  } ,{
    id: '3',
    name: 'Casual Male',
    url: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.glb?morphTargets=ARKit&textureAtlas=none',
    thumb: 'https://models.readyplayer.me/65c0b0fcbb1e1c6ff46b8a6b.png'
  }
];

export default function AvatarCustomizer({ onAvatarChange, currentAvatar }: CustomizerProps) {
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
        {isOpen ? '✕' : '👤'}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '20px',
          width: '320px',
          maxHeight: '500px',
          background: 'linear-gradient(135deg, #1c1f21 0%, #2a2f31 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid #404547'
        }}>
          <div style={{
            padding: '20px'
          }}>
            <h3 style={{
              color: '#e1e2e3',
              fontFamily: '"Space Mono", monospace',
              fontSize: '18px',
              marginTop: 0,
              marginBottom: '16px'
            }}>
              Choose Avatar
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    onAvatarChange(avatar.url);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '12px',
                    border: currentAvatar === avatar.url ? '2px solid #1f94ff' : '1px solid #404547',
                    borderRadius: '12px',
                    background: currentAvatar === avatar.url 
                      ? 'linear-gradient(135deg, rgba(31, 148, 255, 0.2) 0%, rgba(13, 110, 253, 0.2) 100%)'
                      : '#232729',
                    color: currentAvatar === avatar.url ? '#1f94ff' : '#e1e2e3',
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
                    background: `url(${avatar.thumb}) center/cover`,
                    flexShrink: 0
                  }} />
                  <span>{avatar.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}