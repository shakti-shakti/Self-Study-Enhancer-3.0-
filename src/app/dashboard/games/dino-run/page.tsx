// src/app/dashboard/games/dino-run/page.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bird, PlayCircle, RotateCcw, ArrowUp, ArrowLeft, ArrowRight, ChevronUp, Trophy } from 'lucide-react'; 
import * as apiClient from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

// Game constants
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 200; 
const DINO_X = 50;
const DINO_WIDTH = 20;
const DINO_HEIGHT = 30; 
const GROUND_Y = CANVAS_HEIGHT - DINO_HEIGHT - 10; 
const GRAVITY = 0.6;
const JUMP_STRENGTH = -10;
const OBSTACLE_WIDTH = 20;
const MIN_OBSTACLE_HEIGHT = 20;
const MAX_OBSTACLE_HEIGHT = 40;
const OBSTACLE_SPACING_MIN = 150; 
const OBSTACLE_SPACING_MAX = 300; 
const INITIAL_GAME_SPEED = 3;
const MAX_GAME_SPEED = 7;
const SPEED_INCREMENT_INTERVAL = 5; 

const BG_COLOR = '#F0F8FF'; 
const DINO_COLOR = '#607D8B'; 
const OBSTACLE_COLOR = '#795548'; 
const GROUND_COLOR = '#A1887F'; 
const TEXT_COLOR = '#000000';

export default function DinoRunPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const { toast } = useToast();

  const dinoY = useRef(GROUND_Y);
  const dinoVelocity = useRef(0);
  const obstacles = useRef<{ x: number; y: number; width: number; height: number; passed: boolean }[]>([]);
  const gameSpeed = useRef(INITIAL_GAME_SPEED);
  const nextObstacleDistance = useRef(0); 

  const gameLoopId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHighScore = localStorage.getItem('dinoRunHighScore');
      if (storedHighScore) {
        setHighScore(parseInt(storedHighScore, 10));
      }
    }
  }, []);

  const updateHighScoreAndReward = useCallback(async (currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dinoRunHighScore', currentScore.toString());
      }
      toast({
        title: "New High Score!",
        description: `You reached ${currentScore} points! +25 XP & +10 Focus Coins (Conceptual)!`,
        className: "bg-primary/20 text-primary-foreground"
      });
      await apiClient.addUserXP(25);
      const currentCoins = await apiClient.fetchUserFocusCoins();
      await apiClient.updateUserFocusCoins(currentCoins + 10);
    }
  }, [highScore, toast]);

  const resetGameValues = useCallback(() => {
    dinoY.current = GROUND_Y;
    dinoVelocity.current = 0;
    obstacles.current = [];
    gameSpeed.current = INITIAL_GAME_SPEED;
    nextObstacleDistance.current = CANVAS_WIDTH + Math.random() * (OBSTACLE_SPACING_MAX - OBSTACLE_SPACING_MIN) + OBSTACLE_SPACING_MIN;
    setScore(0);
  }, []);

  const startGame = useCallback(() => {
    resetGameValues();
    setGameState('playing');
  }, [resetGameValues]);

  const dinoJump = useCallback(() => {
    if (gameState !== 'playing') return; 
    if (dinoY.current === GROUND_Y) { 
      dinoVelocity.current = JUMP_STRENGTH;
    }
  }, [gameState]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, GROUND_Y + DINO_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - (GROUND_Y + DINO_HEIGHT));
    ctx.fillStyle = OBSTACLE_COLOR;
    obstacles.current.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    ctx.fillStyle = DINO_COLOR;
    ctx.fillRect(DINO_X, dinoY.current, DINO_WIDTH, DINO_HEIGHT);
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `16px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`High: ${highScore}`, CANVAS_WIDTH - 10, 20);

    if (gameState === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.font = `28px Arial`;
      ctx.fillText('Game Over!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = `20px Arial`;
      ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      if (score === highScore && score > 0) {
        ctx.fillStyle = DINO_COLOR;
        ctx.font = `16px Arial`;
        ctx.fillText('New High Score!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      }
      ctx.fillStyle = '#DDDDDD';
      ctx.font = `14px Arial`;
      ctx.fillText('Click Jump or Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === 'idle') {
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'center';
      ctx.font = `20px Arial`;
      ctx.fillText('Click Jump or Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
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

      dinoVelocity.current += GRAVITY;
      dinoY.current += dinoVelocity.current;

      if (dinoY.current > GROUND_Y) {
        dinoY.current = GROUND_Y;
        dinoVelocity.current = 0;
      }
      
      if (obstacles.current.length === 0 || obstacles.current[obstacles.current.length - 1].x < CANVAS_WIDTH - nextObstacleDistance.current) {
         const obstacleHeight = Math.random() * (MAX_OBSTACLE_HEIGHT - MIN_OBSTACLE_HEIGHT) + MIN_OBSTACLE_HEIGHT;
         obstacles.current.push({ 
            x: CANVAS_WIDTH, 
            y: GROUND_Y + DINO_HEIGHT - obstacleHeight, 
            width: OBSTACLE_WIDTH, 
            height: obstacleHeight, 
            passed: false 
        });
        nextObstacleDistance.current = Math.random() * (OBSTACLE_SPACING_MAX - OBSTACLE_SPACING_MIN) + OBSTACLE_SPACING_MIN;
      }

      let newScore = score;
      obstacles.current.forEach(obstacle => {
        obstacle.x -= gameSpeed.current;
        if (!obstacle.passed && obstacle.x + obstacle.width < DINO_X) {
          obstacle.passed = true;
          newScore++;
        }
      });
      if (newScore !== score) setScore(newScore);
      obstacles.current = obstacles.current.filter(obstacle => obstacle.x + obstacle.width > 0);

      if (newScore > 0 && newScore % SPEED_INCREMENT_INTERVAL === 0 && newScore !== score ) { 
        gameSpeed.current = Math.min(MAX_GAME_SPEED, INITIAL_GAME_SPEED + (newScore / SPEED_INCREMENT_INTERVAL) * 0.2);
      }
      
      const dinoRight = DINO_X + DINO_WIDTH;
      const dinoBottom = dinoY.current + DINO_HEIGHT;

      for (const obstacle of obstacles.current) {
        const obsRight = obstacle.x + obstacle.width;
        const obsBottom = obstacle.y + obstacle.height; 
        
        if ( DINO_X < obsRight && dinoRight > obstacle.x &&
             dinoY.current < obsBottom && dinoBottom > obstacle.y ) {
          updateHighScoreAndReward(newScore);
          setGameState('gameOver');
          break;
        }
      }
      
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
      dinoJump();
    } else if (gameState === 'idle' || gameState === 'gameOver') { 
      startGame();
    }
  }, [gameState, dinoJump, startGame]);

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
      draw();
    }
  }, [gameState, draw]);

  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Bird className="mr-3 h-10 w-10 text-primary" /> Dino Run
        </h1>
        <p className="text-lg text-muted-foreground">
          Jump over the obstacles! Click/Tap canvas, press Space, or use Jump button.
        </p>
      </header>
      <Card className="interactive-card shadow-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleInteraction}
          className="cursor-pointer border-2 border-primary rounded-md game-canvas"
        />
      </Card>
       <div className="flex flex-col items-center space-y-3">
            <Button onClick={dinoJump} disabled={gameState !== 'playing'} className="glow-button w-48 py-6 text-2xl">
              <ChevronUp className="mr-2 h-8 w-8" /> Jump
            </Button>
            <Button onClick={startGame} disabled={gameState === 'playing'} className="glow-button w-48 py-4 text-xl">
              <PlayCircle className="mr-2 h-6 w-6" /> {gameState === 'gameOver' ? 'Play Again' : (gameState === 'idle' ? 'Start Game' : 'Restart')}
            </Button>
        </div>
      <p className="text-sm text-muted-foreground">
        High Score: {highScore}
      </p>
    </div>
  );
}
