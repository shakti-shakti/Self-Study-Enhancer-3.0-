
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

// Fallback colors if CSS variables are not available or problematic
const FALLBACK_BACKGROUND_COLOR = 'hsl(240 17% 94%)'; // Light theme card default
const FALLBACK_PIPE_COLOR = 'hsl(209 50% 50%)'; // Accent color
const FALLBACK_BIRD_COLOR = 'hsl(298 42% 50%)'; // Primary color
const FALLBACK_TEXT_COLOR = 'hsl(275 10% 20%)'; // Foreground color

export default function FlappyBrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

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
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let themedBackgroundColor = FALLBACK_BACKGROUND_COLOR;
    let pipeColor = FALLBACK_PIPE_COLOR;
    let birdColor = FALLBACK_BIRD_COLOR;
    let textColor = FALLBACK_TEXT_COLOR;
    let fontName = 'sans-serif';
    let bodyFontName = 'sans-serif';

    if (typeof window !== 'undefined') {
        try {
            themedBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || themedBackgroundColor;
            pipeColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || pipeColor;
            birdColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || birdColor;
            textColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim() || textColor;
            fontName = getComputedStyle(document.documentElement).getPropertyValue('--font-headline').trim() || fontName;
            bodyFontName = getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim() || bodyFontName;
        } catch (e) {
            console.warn("Could not get themed colors for Flappy Bird canvas, using fallbacks.");
        }
    }
    
    ctx.fillStyle = themedBackgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = pipeColor;
    pipes.current.forEach(pipe => {
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y);
      ctx.fillRect(pipe.x, pipe.y + pipe.gap, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.y + pipe.gap));
    });

    ctx.beginPath();
    ctx.arc(BIRD_X, birdY.current, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = birdColor;
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = textColor;
    ctx.font = `20px ${fontName}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${highScore}`, CANVAS_WIDTH - 10, 30);

    if (gameState === 'gameOver') {
      let destructiveColor = 'hsl(0 70% 60%)'; // Fallback destructive
      if (typeof window !== 'undefined') {
        try {
            destructiveColor = getComputedStyle(document.documentElement).getPropertyValue('--destructive').trim() || destructiveColor;
        } catch(e) { /* use fallback */ }
      }
      ctx.fillStyle = destructiveColor;
      ctx.textAlign = 'center';
      ctx.font = `36px ${fontName}`;
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.fillStyle = textColor;
      ctx.font = `24px ${fontName}`;
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      if (score === highScore && score > 0) {
        ctx.fillStyle = birdColor;
        ctx.font = `20px ${fontName}`;
        ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }
      let mutedFgColor = 'hsl(275 8% 40%)'; // Fallback muted foreground
       if (typeof window !== 'undefined') {
        try {
            mutedFgColor = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim() || mutedFgColor;
        } catch(e) { /* use fallback */ }
      }
      ctx.fillStyle = mutedFgColor;
      ctx.font = `16px ${bodyFontName}`;
      ctx.fillText('Click or Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    } else if (gameState === 'idle') {
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.font = `24px ${fontName}`;
      ctx.fillText('Click or Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, [gameState, score, highScore]);

  useEffect(() => {
    const gameLoop = () => {
      if (gameState !== 'playing') return; // Ensure loop only runs when playing

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
      if (newScore > 0 && newScore % SPEED_INCREASE_INTERVAL === 0 && newScore !== score ) { // only update if score actually changed to avoid repeated calculations
        pipeSpeed.current = Math.min(MAX_PIPE_SPEED, INITIAL_PIPE_SPEED + (newScore / SPEED_INCREASE_INTERVAL) * 0.25);
      }
      if (newScore >= GAP_VARIATION_SCORE_THRESHOLD) {
        currentPipeGap.current = MIN_PIPE_GAP + Math.random() * (INITIAL_PIPE_GAP - MIN_PIPE_GAP);
      } else {
        currentPipeGap.current = INITIAL_PIPE_GAP;
      }

      // Collision detection
      if (birdY.current + BIRD_SIZE / 2 > CANVAS_HEIGHT || birdY.current - BIRD_SIZE / 2 < 0) {
        updateHighScore(newScore);
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
            updateHighScore(newScore);
            setGameState('gameOver');
            break;
          }
        }
      }
      frameCount.current++;
      draw();
      if (gameState === 'playing') { // Re-check because it might have changed to 'gameOver'
        gameLoopId.current = requestAnimationFrame(gameLoop);
      }
    };
    
    if (gameState === 'playing') {
      frameCount.current = 0;
      pipeSpeed.current = INITIAL_PIPE_SPEED;
      currentPipeGap.current = INITIAL_PIPE_GAP;
      gameLoopId.current = requestAnimationFrame(gameLoop);
    } else {
      // If not playing (idle or gameOver), ensure we draw the current state once.
      draw();
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
        gameLoopId.current = null;
      }
    }
    
    return () => {
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
      }
    };
  }, [gameState, score, highScore, draw]); // Draw dependency is important here

  const handleCanvasClick = () => {
    if (gameState === 'playing') {
      birdJump();
    } else { 
      startGame();
      // Small delay to ensure gameState is 'playing' before applying first jump
      requestAnimationFrame(() => birdJump()); 
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
  }, [gameState]); // Re-bind if gameState changes for correct jump/start logic

  // Ensure canvas is drawn when the component mounts or gameState changes to 'idle' or 'gameOver'
  useEffect(() => {
    if (gameState === 'idle' || gameState === 'gameOver') {
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
