import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isModelLoaded: boolean;
}

export default function LoadingScreen({ isModelLoaded }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

   useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95; // Stop at 95% until model loads
        }
        return prev + 5;
      });
    }, 100);
    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  // Jump to 100% when model loads
  useEffect(() => {
    if (isModelLoaded) {
      setProgress(100);
    }
  }, [isModelLoaded]);

  // Don't unmount until model is loaded
  if (isModelLoaded && progress === 100) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        animation: isModelLoaded && progress === 100 ? 'fadeOut 0.8s ease-out forwards' : 'none',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes fadeOut {
          to { 
            opacity: 0; 
            pointer-events: none; 
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes reverseSpin {
          to { transform: rotate(-360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes slideIn {
          from { 
            transform: translateY(30px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes particles {
          0% { 
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% { 
            transform: translateY(-100vh) translateX(var(--tx)) scale(1);
            opacity: 0;
          }
        }
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(185, 28, 28, 0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(185, 28, 28, 0.6)); }
        }
      `}</style>

      {/* Animated Background Particles with brand colors */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '4px',
            height: '4px',
            background: i % 3 === 0 ? '#b91c1c' : i % 3 === 1 ? '#15803d' : '#ca8a04',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            bottom: '-10px',
            animation: `particles ${4 + Math.random() * 3}s ease-in ${Math.random() * 2}s infinite`,
            '--tx': `${(Math.random() - 0.5) * 200}px`,
            boxShadow: '0 0 8px currentColor'
          } as React.CSSProperties}
        />
      ))}

      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        {/* Outer Orbit Ring */}
        <div style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'spin 15s linear infinite'
        }}>
          <div style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: '#b91c1c',
            borderRadius: '50%',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 15px #b91c1c'
          }} />
          <div style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: '#15803d',
            borderRadius: '50%',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 15px #15803d'
          }} />
          <div style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: '#ca8a04',
            borderRadius: '50%',
            top: '50%',
            right: '0',
            transform: 'translateY(-50%)',
            boxShadow: '0 0 15px #ca8a04'
          }} />
        </div>

        {/* Logo Container */}
        <div style={{
          position: 'relative',
          animation: 'float 3s ease-in-out infinite'
        }}>
          {/* Background Glow */}
          <div style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle, rgba(185, 28, 28, 0.15) 0%, transparent 70%)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 2s ease-in-out infinite',
            borderRadius: '50%',
            filter: 'blur(30px)'
          }} />

          {/* Spinning Rings with brand colors */}
          <div style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            border: '3px solid transparent',
            borderTopColor: '#b91c1c',
            borderRightColor: '#b91c1c',
            borderRadius: '50%',
            animation: 'spin 3s linear infinite',
            opacity: 0.6
          }} />

          <div style={{
            position: 'absolute',
            width: '160px',
            height: '160px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            border: '3px solid transparent',
            borderBottomColor: '#15803d',
            borderLeftColor: '#15803d',
            borderRadius: '50%',
            animation: 'reverseSpin 2.5s linear infinite',
            opacity: 0.6
          }} />

          <div style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            border: '2px solid transparent',
            borderTopColor: '#ca8a04',
            borderRadius: '50%',
            animation: 'spin 2s linear infinite',
            opacity: 0.5
          }} />

          {/* Afrimerge Logo */}
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            border: '4px solid #f5f5f5',
            overflow: 'hidden'
          }}>
            <img 
              src="https://files.catbox.moe/6so5nn.jpg"
              alt="Afrimerge Logo"
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                objectFit: 'contain',
                animation: 'logoGlow 3s ease-in-out infinite'
              }}
            />

            {/* Inner Pulse */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(185, 28, 28, 0.1) 0%, transparent 70%)',
              animation: 'pulse 2s ease-in-out infinite',
              pointerEvents: 'none'
            }} />
          </div>
        </div>
        
        {/* Company Name */}
        <h1 style={{
          color: '#1f2937',
          fontFamily: '"Inter", -apple-system, sans-serif',
          fontSize: 'clamp(2rem, 5vw, 2.75rem)',
          fontWeight: '700',
          marginTop: '3rem',
          marginBottom: '0.25rem',
          textAlign: 'center',
          padding: '0 1rem',
          animation: 'slideIn 0.8s ease-out 0.3s backwards',
          letterSpacing: '-0.02em'
        }}>
          Afrimerge
        </h1>

        <h2 style={{
          color: '#4b5563',
          fontFamily: '"Inter", -apple-system, sans-serif',
          fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
          fontWeight: '400',
          marginBottom: '0.75rem',
          textAlign: 'center',
          padding: '0 1rem',
          animation: 'slideIn 0.8s ease-out 0.4s backwards',
          letterSpacing: '0.02em'
        }}>
          Technologies
        </h2>
        
        {/* Tagline */}
        <p style={{
          color: '#6b7280',
          fontFamily: '"Inter", -apple-system, sans-serif',
          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          animation: 'slideIn 0.8s ease-out 0.5s backwards',
          marginBottom: '3rem',
          textAlign: 'center',
          padding: '0 1rem',
          letterSpacing: '0.05em',
          fontWeight: '500'
        }}>
          Powering Innovation Across Africa
        </p>

        {/* Modern Progress Bar */}
        <div style={{
          width: '360px',
          maxWidth: '85vw',
          animation: 'slideIn 0.8s ease-out 0.7s backwards'
        }}>
          <div style={{
            height: '8px',
            background: '#e5e7eb',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #b91c1c 0%, #15803d 50%, #ca8a04 100%)',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 10px rgba(185, 28, 28, 0.5)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
                animation: 'shimmer 2s infinite'
              }} />
            </div>
          </div>

          {/* Progress Text */}
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              color: '#b91c1c',
              fontFamily: '"Space Mono", monospace',
              fontSize: '0.875rem',
              fontWeight: '600',
              letterSpacing: '0.05em'
            }}>
              {progress}%
            </div>
            <div style={{
              color: '#6b7280',
              fontFamily: '"Inter", -apple-system, sans-serif',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              {progress < 25 ? 'Initializing...' : 
               progress < 50 ? 'Loading modules...' : 
               progress < 75 ? 'Processing data...' : 
               progress < 95 ? 'Almost ready...' :
               'Finalizing...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}