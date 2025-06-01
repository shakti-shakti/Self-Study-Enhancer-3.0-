// src/app/dashboard/games/flappy-brain/page.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bird, PlayCircle, RotateCcw, ChevronUp, Trophy } from 'lucide-react';
import * as apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

// Game constants
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 480;
const BIRD_X = 50;
const BIRD_SIZE = 20; // Diameter of the bird
const GRAVITY = 0.4;
const LIFT = -7;
const PIPE_WIDTH = 50;
const INITIAL_PIPE_GAP = 120;
const MIN_PIPE_GAP = 90; 
const PIPE_SPACING = 180; // Horizontal spacing between pipe pairs
const INITIAL_PIPE_SPEED = 2;
const MAX_PIPE_SPEED = 4.5; 
const SPEED_INCREASE_INTERVAL = 3; // Score interval to increase speed
const GAP_VARIATION_SCORE_THRESHOLD = 5; // Score after which pipe gap starts varying

const BG_COLOR = 'hsl(var(--background))'; 
const BIRD_COLOR = 'hsl(var(--primary))'; 
const PIPE_COLOR = 'hsl(var(--accent))'; 
const TEXT_COLOR = 'hsl(var(--foreground))'; 

export default function FlappyBrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const { toast } = useToast();

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

  const updateHighScoreAndReward = useCallback(async (currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('flappyBrainHighScore', currentScore.toString());
      }
      toast({
        title: "New High Score!",
        description: `You scored ${currentScore} in Flappy Brain! +25 XP & +10 Focus Coins (Conceptual)!`,
        className: "bg-primary/20 text-primary-foreground"
      });
      await apiClient.addUserXP(25);
      const currentCoins = await apiClient.fetchUserFocusCoins();
      await apiClient.updateUserFocusCoins(currentCoins + 10);
    }
  }, [highScore, toast]);

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
    if (gameState !== 'playing') return;
    birdVelocity.current = LIFT;
  }, [gameState]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use CSS variables for colors
    const rootStyle = getComputedStyle(document.documentElement);
    const bgColor = rootStyle.getPropertyValue('--background').trim(); // Assuming HSL, convert if needed or use directly if ctx supports it
    const birdColor = rootStyle.getPropertyValue('--primary').trim();
    const pipeColor = rootStyle.getPropertyValue('--accent').trim();
    const textColor = rootStyle.getPropertyValue('--foreground').trim();


    ctx.fillStyle = `hsl(${bgColor})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = `hsl(${pipeColor})`;
    pipes.current.forEach(pipe => {
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y); // Top pipe
      ctx.fillRect(pipe.x, pipe.y + pipe.gap, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.y + pipe.gap)); // Bottom pipe
    });
    
    ctx.beginPath();
    ctx.arc(BIRD_X, birdY.current, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle =  `hsl(${birdColor})`;
    ctx.fill();
    ctx.closePath();
    
    ctx.fillStyle = `hsl(${textColor})`;
    ctx.font = `20px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${highScore}`, CANVAS_WIDTH - 10, 30);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFFFFF'; 
      ctx.textAlign = 'center';
      ctx.font = `36px Arial`;
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.font = `24px Arial`;
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      if (score === highScore && score > 0) {
        ctx.fillStyle = `hsl(${birdColor})`;
        ctx.font = `20px Arial`;
        ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }
      ctx.fillStyle = '#DDDDDD'; 
      ctx.font = `16px Arial`;
      ctx.fillText('Click Flap or Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    } else if (gameState === 'idle') {
      ctx.fillStyle = `hsl(${textColor})`;
      ctx.textAlign = 'center';
      ctx.font = `24px Arial`;
      ctx.fillText('Click Flap or Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, [gameState, score, highScore]);

  useEffect(() => {
    const gameLoop = () => {
      if (gameState !== 'playing') {
        if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
        gameLoopId.current = null;
        draw(); 
        return;
      }

      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      if (frameCount.current % Math.floor(PIPE_SPACING / pipeSpeed.current) === 0) {
        // Ensure pipe gap and y position are reasonable
        const pipeY = Math.random() * (CANVAS_HEIGHT - currentPipeGap.current - 150) + 75; // 75px buffer from top/bottom
        pipes.current.push({ x: CANVAS_WIDTH, y: pipeY, gap: currentPipeGap.current, passed: false });
      }

      let newScore = score;
      pipes.current.forEach(pipe => {
        pipe.x -= pipeSpeed.current;
        if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X - BIRD_SIZE / 2) { // Check if bird's center passed pipe's right edge
          pipe.passed = true;
          newScore++;
        }
      });
      if (newScore !== score) setScore(newScore);
      pipes.current = pipes.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

      // Increase speed
      if (newScore > 0 && newScore % SPEED_INCREASE_INTERVAL === 0 && newScore !== score ) { 
        pipeSpeed.current = Math.min(MAX_PIPE_SPEED, INITIAL_PIPE_SPEED + (newScore / SPEED_INCREASE_INTERVAL) * 0.25);
      }
      // Vary pipe gap
      if (newScore >= GAP_VARIATION_SCORE_THRESHOLD) {
        // Make gap slightly smaller as score increases, but not too small
        currentPipeGap.current = Math.max(MIN_PIPE_GAP, INITIAL_PIPE_GAP - (newScore - GAP_VARIATION_SCORE_THRESHOLD) * 2);
      } else {
        currentPipeGap.current = INITIAL_PIPE_GAP;
      }

      // Collision detection
      const birdTop = birdY.current - BIRD_SIZE / 2;
      const birdBottom = birdY.current + BIRD_SIZE / 2;
      if (birdBottom > CANVAS_HEIGHT || birdTop < 0) { // Hit ground or ceiling
        updateHighScoreAndReward(newScore);
        setGameState('gameOver');
      }
      for (const pipe of pipes.current) {
        const birdLeft = BIRD_X - BIRD_SIZE / 2;
        const birdRight = BIRD_X + BIRD_SIZE / 2;
        const pipeTopY = pipe.y;
        const pipeBottomY = pipe.y + pipe.gap;

        // Check collision with pipes
        if (birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH) { // Bird is horizontally within pipe
          if (birdTop < pipeTopY || birdBottom > pipeBottomY) { // Bird hits top or bottom pipe
            updateHighScoreAndReward(newScore);
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
      draw(); 
    }
    
    return () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
      }
    };
  }, [gameState, score, highScore, draw, updateHighScoreAndReward]);

  const handleInteraction = useCallback(() => {
    if (gameState === 'playing') {
      birdJump();
    } else if (gameState === 'idle' || gameState === 'gameOver') { 
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
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleInteraction, { passive: false });
    }
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleInteraction);
      }
    };
  }, [handleInteraction]);

  useEffect(() => {
    if (gameState === 'idle') {
      draw(); // Initial draw
    }
  }, [gameState, draw]);


  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Bird className="mr-3 h-10 w-10 text-primary" /> Flappy Brain
        </h1>
        <p className="text-lg text-muted-foreground">
          Navigate the brainy bird! Click/Tap canvas, press Space, or use Flap button. Difficulty increases.
        </p>
      </header>
      <Card className="interactive-card shadow-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleInteraction} 
          className="cursor-pointer border-2 border-primary rounded-md bg-muted/30 game-canvas" 
        />
      </Card>
       <div className="flex flex-col items-center space-y-2">
          <Button onClick={birdJump} disabled={gameState !== 'playing'} className="glow-button w-40 py-4 text-xl">
            <ChevronUp className="mr-2 h-6 w-6" /> Flap
          </Button>
          <Button onClick={startGame} disabled={gameState === 'playing'} className="glow-button w-40 py-3 text-lg">
            <PlayCircle className="mr-2" /> {gameState === 'gameOver' ? 'Play Again' : (gameState === 'idle' ? 'Start Game' : 'Restart')}
          </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Pipe speed and gap size will change as you score higher! High Score: {highScore}
      </p>
    </div>
  );
}
