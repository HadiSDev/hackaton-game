import { useGameStore } from '../store';

export default function HUD() {
  const score = useGameStore((s) => s.score);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          fontFamily: 'monospace',
        }}
      >
        {score}
      </div>
      {score === 0 && (
        <div
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.6)',
            marginTop: '10px',
            fontFamily: 'monospace',
          }}
        >
          SPACE to jump | WASD to move
        </div>
      )}
    </div>
  );
}
