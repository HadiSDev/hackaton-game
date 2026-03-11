import { useGameStore } from '../store';

export default function Menu() {
  const start = useGameStore((s) => s.start);
  const highScore = useGameStore((s) => s.highScore);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        color: 'white',
      }}
    >
      <h1
        style={{
          fontSize: '72px',
          margin: 0,
          background: 'linear-gradient(to right, #ff6b35, #f7c948)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: 'none',
        }}
      >
        SKY HOPPER
      </h1>
      <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', margin: '10px 0 40px' }}>
        Jump across the sky. Don't fall.
      </p>
      <button
        onClick={start}
        style={{
          padding: '16px 48px',
          fontSize: '24px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #ff6b35, #f7c948)',
          color: '#0f0f23',
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        START
      </button>
      <div style={{ marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
        SPACE to jump | WASD or Arrows to move
      </div>
      {highScore > 0 && (
        <div style={{ marginTop: '20px', fontSize: '16px', color: '#f7c948' }}>
          Best: {highScore}
        </div>
      )}
    </div>
  );
}
