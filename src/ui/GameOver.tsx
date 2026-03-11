import { useGameStore } from '../store';

export default function GameOver() {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const restart = useGameStore((s) => s.restart);
  const isNewHighScore = score >= highScore && score > 0;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #2d1b1b 50%, #1a1a3e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        color: 'white',
      }}
    >
      <h1 style={{ fontSize: '48px', margin: 0, color: '#ff4444' }}>
        GAME OVER
      </h1>
      {isNewHighScore && (
        <div
          style={{
            fontSize: '20px',
            color: '#f7c948',
            margin: '10px 0',
            animation: 'pulse 1s infinite',
          }}
        >
          NEW HIGH SCORE!
        </div>
      )}
      <div style={{ fontSize: '64px', fontWeight: 'bold', margin: '20px 0', color: '#ff6b35' }}>
        {score}
      </div>
      <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '30px' }}>
        Best: {highScore}
      </div>
      <button
        onClick={restart}
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
        TRY AGAIN
      </button>
    </div>
  );
}
