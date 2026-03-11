import { useGameStore } from '../store';

const PIXEL_FONT = "'Press Start 2P', monospace";

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
        fontFamily: PIXEL_FONT,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '20px 28px',
        }}
      >
        {/* Hearts — top left */}
        <div style={{ display: 'flex', gap: '10px', fontSize: '36px' }}>
          {Array.from({ length: maxLives }, (_, i) => (
            <span
              key={i}
              style={{
                color: i < lives ? '#ff6b35' : 'rgba(255,255,255,0.15)',
                textShadow: i < lives
                  ? '0 0 12px rgba(255,107,53,0.7), 0 0 24px rgba(255,107,53,0.3)'
                  : 'none',
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
            fontSize: '20px',
            color: '#f7c948',
            textShadow: '0 0 8px rgba(247,201,72,0.5), 0 2px 4px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '14px' }}>HI</span>
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
            fontSize: '48px',
            color: 'white',
            textShadow: '0 2px 12px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.1)',
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: '#ff6b35',
            textShadow: '0 0 10px rgba(255,107,53,0.4)',
            marginTop: '10px',
            letterSpacing: '3px',
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
            fontSize: '10px',
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '1px',
          }}
        >
          SPACE to jump &nbsp;|&nbsp; WASD to move
        </div>
      )}
    </div>
  );
}
