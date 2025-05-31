// src/app/dashboard/games/flappy-brain/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
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
const MIN_PIPE_GAP = 100; // Minimum gap for increased difficulty
const PIPE_SPACING = 200;
const INITIAL_PIPE_SPEED = 2;
const MAX_PIPE_SPEED = 4;
const SPEED_INCREASE_INTERVAL = 5; // Increase speed every 5 points
const GAP_VARIATION_SCORE_THRESHOLD = 10; // Start varying gap after 10 points

export default function FlappyBrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game variables (using refs to persist across renders without causing re-renders for every change)
  const birdY = useRef(CANVAS_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const pipes = useRef<{ x: number; y: number; gap: number; passed: boolean }[]>([]);
  const frameCount = useRef(0);
  const pipeSpeed = useRef(INITIAL_PIPE_SPEED);
  const currentPipeGap = useRef(INITIAL_PIPE_GAP);

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

  const resetGame = () => {
    birdY.current = CANVAS_HEIGHT / 2;
    birdVelocity.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    pipeSpeed.current = INITIAL_PIPE_SPEED;
    currentPipeGap.current = INITIAL_PIPE_GAP;
    setScore(0);
    setGameState('idle');
  };

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  const birdJump = () => {
    if (gameState === 'playing') {
      birdVelocity.current = LIFT;
    } else if (gameState === 'idle') {
      startGame();
      birdVelocity.current = LIFT; 
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const gameLoop = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = 'hsl(var(--primary)/0.1)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (gameState === 'playing') {
        birdVelocity.current += GRAVITY;
        birdY.current += birdVelocity.current;

        // Adjust difficulty based on score
        if (score > 0 && score % SPEED_INCREASE_INTERVAL === 0) {
          pipeSpeed.current = Math.min(MAX_PIPE_SPEED, INITIAL_PIPE_SPEED + (score / SPEED_INCREASE_INTERVAL) * 0.25);
        }
        if (score >= GAP_VARIATION_SCORE_THRESHOLD) {
          // Make gap slightly variable, ensuring it doesn't get too small
          currentPipeGap.current = MIN_PIPE_GAP + Math.random() * (INITIAL_PIPE_GAP - MIN_PIPE_GAP);
        } else {
          currentPipeGap.current = INITIAL_PIPE_GAP;
        }


        frameCount.current++;
        if (frameCount.current % Math.floor(PIPE_SPACING / pipeSpeed.current) === 0) {
          const pipeY = Math.random() * (CANVAS_HEIGHT - currentPipeGap.current - 150) + 75;
          pipes.current.push({ x: CANVAS_WIDTH, y: pipeY, gap: currentPipeGap.current, passed: false });
        }

        pipes.current.forEach(pipe => {
          pipe.x -= pipeSpeed.current;
          if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
            pipe.passed = true;
            setScore(s => s + 1);
          }
        });

        pipes.current = pipes.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

        if (birdY.current + BIRD_SIZE / 2 > CANVAS_HEIGHT || birdY.current - BIRD_SIZE / 2 < 0) {
          updateHighScore(score);
          setGameState('gameOver');
        }
        for (const pipe of pipes.current) {
          const birdTop = birdY.current - BIRD_SIZE / 2;
          const birdBottom = birdY.current + BIRD_SIZE / 2;
          const birdLeft = BIRD_X - BIRD_SIZE / 2;
          const birdRight = BIRD_X + BIRD_SIZE / 2;

          const pipeTopY = pipe.y;
          const pipeBottomY = pipe.y + pipe.gap;

          if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
            if (birdTop < pipeTopY || birdBottom > pipeBottomY) {
              updateHighScore(score);
              setGameState('gameOver');
              break;
            }
          }
        }
      }

      ctx.fillStyle = 'hsl(var(--accent))';
      pipes.current.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y); 
        ctx.fillRect(pipe.x, pipe.y + pipe.gap, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.y + pipe.gap));
      });
      
      ctx.beginPath();
      ctx.arc(BIRD_X, birdY.current, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fill();
      ctx.closePath();
      
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '20px var(--font-headline)';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.textAlign = 'right';
      ctx.fillText(`High: ${highScore}`, CANVAS_WIDTH - 10, 30);


      if (gameState === 'gameOver') {
        ctx.fillStyle = 'hsl(var(--destructive-foreground))';
        ctx.textAlign = 'center';
        ctx.font = '36px var(--font-headline)';
        ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        ctx.font = '24px var(--font-headline)';
        ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        if (score === highScore && score > 0) {
           ctx.fillStyle = 'hsl(var(--primary))';
           ctx.font = '20px var(--font-headline)';
           ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        }
        ctx.fillStyle = 'hsl(var(--muted-foreground))';
        ctx.font = '16px var(--font-body)';
        ctx.fillText('Click or Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
      } else if (gameState === 'idle') {
        ctx.fillStyle = 'hsl(var(--foreground))';
        ctx.textAlign = 'center';
        ctx.font = '24px var(--font-headline)';
        ctx.fillText('Click or Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      if (gameState !== 'gameOver') {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    if (gameState === 'playing' || gameState === 'idle') {
      animationFrameId = requestAnimationFrame(gameLoop);
    } else if (gameState === 'gameOver') {
       gameLoop();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, score, highScore]);

  const handleCanvasClick = () => {
    if (gameState === 'playing') {
      birdJump();
    } else if (gameState === 'gameOver' || gameState === 'idle') {
      startGame();
      birdJump();
    }
  };
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleCanvasClick();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Bird className="mr-3 h-10 w-10 text-primary" /> Flappy Brain
        </h1>
        <p className="text-lg text-muted-foreground">
          Navigate the brainy bird! Click or tap spacebar to flap. Difficulty increases with score.
        </p>
      </header>
      <Card className="interactive-card shadow-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
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
