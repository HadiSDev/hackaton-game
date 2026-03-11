import { useGameStore } from '../store';

export default function HUD() {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const lives = useGameStore((s) => s.lives);
  const maxLives = useGameStore((s) => s.maxLives);
  const getStage = useGameStore((s) => s.getStage);

  const stage = getStage();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: 'monospace',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '16px 24px',
        }}
      >
        {/* Hearts — top left */}
        <div style={{ display: 'flex', gap: '6px', fontSize: '28px' }}>
          {Array.from({ length: maxLives }, (_, i) => (
            <span
              key={i}
              style={{
                color: i < lives ? '#ff6b35' : 'rgba(255,255,255,0.2)',
                textShadow: i < lives ? '0 0 8px rgba(255,107,53,0.6)' : 'none',
                transition: 'color 0.3s, text-shadow 0.3s',
              }}
            >
              {i < lives ? '\u2665' : '\u2661'}
            </span>
          ))}
        </div>

        {/* High score — top right */}
        <div
          style={{
            fontSize: '18px',
            color: '#f7c948',
            textShadow: '0 1px 6px rgba(247,201,72,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '20px' }}>{'\u{1F3C6}'}</span>
          {highScore}
        </div>
      </div>

      {/* Center — score + stage */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '-8px',
        }}
      >
        <div
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: '14px',
            color: '#ff6b35',
            textShadow: '0 0 10px rgba(255,107,53,0.3)',
            marginTop: '6px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {stage}
        </div>
      </div>

      {/* Controls hint — bottom center, only at start */}
      {score === 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: 0,
            width: '100%',
            textAlign: 'center',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '1px',
          }}
        >
          SPACE to jump &nbsp;|&nbsp; WASD to move
        </div>
      )}
    </div>
  );
}
