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
const GRAVITY = 0.4; // Adjusted for smoother fall
const LIFT = -7; // Adjusted for snappier jump
const PIPE_WIDTH = 50;
const PIPE_GAP = 120; // Increased gap
const PIPE_SPACING = 200; // Space between pipe pairs
const PIPE_SPEED = 2;

export default function FlappyBrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);

  // Game variables (using refs to persist across renders without causing re-renders for every change)
  const birdY = useRef(CANVAS_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const pipes = useRef<{ x: number; y: number; passed: boolean }[]>([]);
  const frameCount = useRef(0); // Used for pipe generation timing

  const resetGame = () => {
    birdY.current = CANVAS_HEIGHT / 2;
    birdVelocity.current = 0;
    pipes.current = [];
    frameCount.current = 0;
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
      birdVelocity.current = LIFT; // Jump on first tap to start
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
      
      // Background
      ctx.fillStyle = 'hsl(var(--primary)/0.1)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);


      if (gameState === 'playing') {
        // Bird physics
        birdVelocity.current += GRAVITY;
        birdY.current += birdVelocity.current;

        // Pipe logic
        frameCount.current++;
        if (frameCount.current % Math.floor(PIPE_SPACING / PIPE_SPEED) === 0) {
          const pipeY = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 150) + 75; // Ensure gap is not too close to top/bottom
          pipes.current.push({ x: CANVAS_WIDTH, y: pipeY, passed: false });
        }

        pipes.current.forEach(pipe => {
          pipe.x -= PIPE_SPEED;
          // Scoring
          if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
            pipe.passed = true;
            setScore(s => s + 1);
          }
        });

        // Remove off-screen pipes
        pipes.current = pipes.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

        // Collision detection
        // Ground collision
        if (birdY.current + BIRD_SIZE / 2 > CANVAS_HEIGHT || birdY.current - BIRD_SIZE / 2 < 0) {
          setGameState('gameOver');
        }
        // Pipe collision
        for (const pipe of pipes.current) {
          const birdTop = birdY.current - BIRD_SIZE / 2;
          const birdBottom = birdY.current + BIRD_SIZE / 2;
          const birdLeft = BIRD_X - BIRD_SIZE / 2;
          const birdRight = BIRD_X + BIRD_SIZE / 2;

          const pipeTopY = pipe.y;
          const pipeBottomY = pipe.y + PIPE_GAP;

          if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) {
            if (birdTop < pipeTopY || birdBottom > pipeBottomY) {
              setGameState('gameOver');
              break;
            }
          }
        }
      }

      // Draw pipes
      ctx.fillStyle = 'hsl(var(--accent))';
      pipes.current.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y); // Top pipe
        ctx.fillRect(pipe.x, pipe.y + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.y + PIPE_GAP)); // Bottom pipe
      });
      
      // Draw bird (simple circle for now)
      ctx.beginPath();
      ctx.arc(BIRD_X, birdY.current, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.fill();
      ctx.closePath();
      
      // Draw score
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = '24px var(--font-headline)';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 10, 30);

      if (gameState === 'gameOver') {
        ctx.fillStyle = 'hsl(var(--destructive-foreground))';
        ctx.textAlign = 'center';
        ctx.font = '36px var(--font-headline)';
        ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.font = '20px var(--font-headline)';
        ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.font = '16px var(--font-body)';
        ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      } else if (gameState === 'idle') {
        ctx.fillStyle = 'hsl(var(--foreground))';
        ctx.textAlign = 'center';
        ctx.font = '24px var(--font-headline)';
        ctx.fillText('Click to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }

      if (gameState !== 'gameOver') {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    if (gameState === 'playing' || gameState === 'idle') {
      animationFrameId = requestAnimationFrame(gameLoop);
    } else if (gameState === 'gameOver') {
       // Redraw one last time to show game over screen
       gameLoop();
    }


    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, score]); // Rerun effect when gameState changes

  const handleCanvasClick = () => {
    if (gameState === 'playing') {
      birdJump();
    } else if (gameState === 'gameOver' || gameState === 'idle') {
      startGame();
      birdJump(); // Jump on first tap to start
    }
  };
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scrolling
        handleCanvasClick();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]); // Re-attach if gameState changes to ensure correct handler context

  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Bird className="mr-3 h-10 w-10 text-primary" /> Flappy Brain
        </h1>
        <p className="text-lg text-muted-foreground">
          Navigate the brainy bird through the obstacles! Click or tap spacebar to flap.
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
        This is a very basic prototype. More features and polish can be added!
      </p>
    </div>
  );
}
