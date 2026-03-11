import { useGameStore } from './store';
import Menu from './ui/Menu';
import GameOver from './ui/GameOver';
import Game from './components/Game';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <>
      {phase === 'menu' && <Menu />}
      {phase === 'playing' && <Game />}
      {phase === 'gameover' && <GameOver />}
    </>
  );
}
