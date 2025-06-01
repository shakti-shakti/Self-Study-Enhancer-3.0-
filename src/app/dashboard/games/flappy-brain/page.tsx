
// src/app/dashboard/games/flappy-brain/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bird, PlayCircle, RotateCcw } from 'lucide-react';

// Game constants
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const BIRD_X = 50;
const BIRD_SIZE = 20;
const GRAVITY = 0.4;
const LIFT = -7;
const PIPE_WIDTH = 50;
const INITIAL_PIPE_GAP = 120;
const MIN_PIPE_GAP = 90; 
const PIPE_SPACING = 180; 
const INITIAL_PIPE_SPEED = 2;
const MAX_PIPE_SPEED = 4.5; 
const SPEED_INCREASE_INTERVAL = 3; 
const GAP_VARIATION_SCORE_THRESHOLD = 5;

// Simplified, hardcoded colors for stability
const BG_COLOR = '#F0F8FF'; // AliceBlue
const BIRD_COLOR = '#FFD700'; // Gold
const PIPE_COLOR = '#228B22'; // ForestGreen
const TEXT_COLOR = '#000000'; // Black

export default function FlappyBrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game state refs
  const birdY = useRef(CANVAS_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const pipes = useRef<{ x: number; y: number; gap: number; passed: boolean }[]>([]);
  const frameCount = useRef(0);
  const pipeSpeed = useRef(INITIAL_PIPE_SPEED);
  const currentPipeGap = useRef(INITIAL_PIPE_GAP);
  const gameLoopId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHighScore = localStorage.getItem('flappyBrainHighScore');
      if (storedHighScore) {
        setHighScore(parseInt(storedHighScore, 10));
      }
    }
  }, []);

  const updateHighScore = (currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('flappyBrainHighScore', currentScore.toString());
      }
    }
  };

  const resetGameValues = useCallback(() => {
    birdY.current = CANVAS_HEIGHT / 2;
    birdVelocity.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    pipeSpeed.current = INITIAL_PIPE_SPEED;
    currentPipeGap.current = INITIAL_PIPE_GAP;
    setScore(0);
  }, []);

  const startGame = useCallback(() => {
    resetGameValues();
    setGameState('playing');
  }, [resetGameValues]);

  const birdJump = useCallback(() => {
    if (gameState === 'playing' || gameState === 'idle') { // Allow jump to start game from idle
      birdVelocity.current = LIFT;
    }
  }, [gameState]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Pipes
    ctx.fillStyle = PIPE_COLOR;
    pipes.current.forEach(pipe => {
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y);
      ctx.fillRect(pipe.x, pipe.y + pipe.gap, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.y + pipe.gap));
    });

    // Bird
    ctx.beginPath();
    ctx.arc(BIRD_X, birdY.current, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = BIRD_COLOR;
    ctx.fill();
    ctx.closePath();

    // Score
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `20px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${highScore}`, CANVAS_WIDTH - 10, 30);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = `36px Arial`;
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.font = `24px Arial`;
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      if (score === highScore && score > 0) {
        ctx.fillStyle = BIRD_COLOR;
        ctx.font = `20px Arial`;
        ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }
      ctx.fillStyle = '#DDDDDD';
      ctx.font = `16px Arial`;
      ctx.fillText('Click or Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    } else if (gameState === 'idle') {
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'center';
      ctx.font = `24px Arial`;
      ctx.fillText('Click or Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, [gameState, score, highScore]);

  useEffect(() => {
    const gameLoop = () => {
      if (gameState !== 'playing') {
        if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
        gameLoopId.current = null;
        draw(); // Draw final state (idle or game over)
        return;
      }

      // Bird physics
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      // Pipe generation
      if (frameCount.current % Math.floor(PIPE_SPACING / pipeSpeed.current) === 0) {
        const pipeY = Math.random() * (CANVAS_HEIGHT - currentPipeGap.current - 150) + 75;
        pipes.current.push({ x: CANVAS_WIDTH, y: pipeY, gap: currentPipeGap.current, passed: false });
      }

      // Move pipes and check for score
      let newScore = score;
      pipes.current.forEach(pipe => {
        pipe.x -= pipeSpeed.current;
        if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
          pipe.passed = true;
          newScore++;
        }
      });
      if (newScore !== score) setScore(newScore);
      pipes.current = pipes.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

      // Difficulty adjustment
      if (newScore > 0 && newScore % SPEED_INCREASE_INTERVAL === 0 && newScore !== score ) { 
        pipeSpeed.current = Math.min(MAX_PIPE_SPEED, INITIAL_PIPE_SPEED + (newScore / SPEED_INCREASE_INTERVAL) * 0.25);
      }
      if (newScore >= GAP_VARIATION_SCORE_THRESHOLD) {
        currentPipeGap.current = MIN_PIPE_GAP + Math.random() * (INITIAL_PIPE_GAP - MIN_PIPE_GAP);
      } else {
        currentPipeGap.current = INITIAL_PIPE_GAP;
      }

      // Collision detection
      const birdTop = birdY.current - BIRD_SIZE / 2;
      const birdBottom = birdY.current + BIRD_SIZE / 2;
      if (birdBottom > CANVAS_HEIGHT || birdTop < 0) {
        updateHighScore(newScore);
        setGameState('gameOver');
      }
      for (const pipe of pipes.current) {
        const birdLeft = BIRD_X - BIRD_SIZE / 2;
        const birdRight = BIRD_X + BIRD_SIZE / 2;
        const pipeTopY = pipe.y;
        const pipeBottomY = pipe.y + pipe.gap;

        if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
          if (birdTop < pipeTopY || birdBottom > pipeBottomY) {
            updateHighScore(newScore);
            setGameState('gameOver');
            break;
          }
        }
      }
      frameCount.current++;
      draw();
      gameLoopId.current = requestAnimationFrame(gameLoop);
    };

    if (gameState === 'playing') {
      gameLoopId.current = requestAnimationFrame(gameLoop);
    } else {
      // Ensure idle or game over state is drawn when not playing
      draw();
    }
    
    return () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
      }
    };
  }, [gameState, score, highScore, draw]);

  const handleInteraction = useCallback(() => {
    if (gameState === 'playing') {
      birdJump();
    } else { 
      startGame();
    }
  }, [gameState, birdJump, startGame]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleInteraction();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleInteraction]);

  // Initial draw for idle state
  useEffect(() => {
    if (gameState === 'idle') {
      draw();
    }
  }, [gameState, draw]);


  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Bird className="mr-3 h-10 w-10 text-primary" /> Flappy Brain
        </h1>
        <p className="text-lg text-muted-foreground">
          Navigate the brainy bird! Click or tap spacebar to flap. Difficulty increases.
        </p>
      </header>
      <Card className="interactive-card shadow-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleInteraction}
          className="cursor-pointer border-2 border-primary rounded-md"
        />
      </Card>
       <div className="flex space-x-4">
            <Button onClick={startGame} disabled={gameState === 'playing'} className="glow-button">
              <PlayCircle className="mr-2" /> {gameState === 'gameOver' ? 'Play Again' : 'Start Game'}
            </Button>
        </div>
      <p className="text-sm text-muted-foreground">
        Pipe speed and gap size will change as you score higher!
      </p>
    </div>
  );
}
