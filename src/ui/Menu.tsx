import { useGameStore, DIFFICULTY_PRESETS, type DifficultyPreset } from '../store';

const presetOrder: DifficultyPreset[] = ['easy', 'normal', 'hard', 'insane'];

const presetColors: Record<DifficultyPreset, string> = {
  easy: '#4ecdc4',
  normal: '#f7c948',
  hard: '#ff6b35',
  insane: '#ff2244',
};

export default function Menu() {
  const start = useGameStore((s) => s.start);
  const highScore = useGameStore((s) => s.highScore);
  const difficultyPreset = useGameStore((s) => s.difficultyPreset);
  const setDifficultyPreset = useGameStore((s) => s.setDifficultyPreset);
  const config = DIFFICULTY_PRESETS[difficultyPreset];

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
      <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', margin: '10px 0 30px' }}>
        Jump across the sky. Don't fall.
      </p>

      {/* Difficulty selector */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Difficulty
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {presetOrder.map((preset) => {
            const p = DIFFICULTY_PRESETS[preset];
            const isActive = preset === difficultyPreset;
            const color = presetColors[preset];
            return (
              <button
                key={preset}
                onClick={() => setDifficultyPreset(preset)}
                style={{
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  border: `2px solid ${isActive ? color : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: '6px',
                  background: isActive ? `${color}22` : 'transparent',
                  color: isActive ? color : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                  }
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
          {config.description}
        </div>
      </div>

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
