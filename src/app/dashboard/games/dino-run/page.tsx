// src/app/dashboard/games/dino-run/page.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bird, PlayCircle, RotateCcw } from 'lucide-react'; // Bird icon can represent the "dino"

// Game constants
const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 200; // Shorter canvas for typical dino run
const DINO_X = 50;
const DINO_WIDTH = 20;
const DINO_HEIGHT = 30; // Taller than wide
const GROUND_Y = CANVAS_HEIGHT - DINO_HEIGHT - 10; // 10px buffer from bottom
const GRAVITY = 0.6;
const JUMP_STRENGTH = -10;
const OBSTACLE_WIDTH = 20;
const MIN_OBSTACLE_HEIGHT = 20;
const MAX_OBSTACLE_HEIGHT = 40;
const OBSTACLE_SPACING_MIN = 150; // Min distance between obstacles
const OBSTACLE_SPACING_MAX = 300; // Max distance
const INITIAL_GAME_SPEED = 3;
const MAX_GAME_SPEED = 7;
const SPEED_INCREMENT_INTERVAL = 5; // Score interval to increase speed

// Simplified, hardcoded colors
const BG_COLOR = '#F0F8FF'; 
const DINO_COLOR = '#607D8B'; // Slate Gray
const OBSTACLE_COLOR = '#795548'; // Brown for "cacti"
const GROUND_COLOR = '#A1887F'; // Lighter Brown for ground line
const TEXT_COLOR = '#000000';

export default function DinoRunPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game state refs
  const dinoY = useRef(GROUND_Y);
  const dinoVelocity = useRef(0);
  const obstacles = useRef<{ x: number; y: number; width: number; height: number; passed: boolean }[]>([]);
  const gameSpeed = useRef(INITIAL_GAME_SPEED);
  const nextObstacleDistance = useRef(0); // Tracks when to spawn next obstacle

  const gameLoopId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHighScore = localStorage.getItem('dinoRunHighScore');
      if (storedHighScore) {
        setHighScore(parseInt(storedHighScore, 10));
      }
    }
  }, []);

  const updateHighScore = useCallback((currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dinoRunHighScore', currentScore.toString());
      }
    }
  }, [highScore]);

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
    if (dinoY.current === GROUND_Y) { // Only jump if on the ground
      dinoVelocity.current = JUMP_STRENGTH;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ground line
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, GROUND_Y + DINO_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - (GROUND_Y + DINO_HEIGHT));


    // Obstacles
    ctx.fillStyle = OBSTACLE_COLOR;
    obstacles.current.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Dino (simple rectangle)
    ctx.fillStyle = DINO_COLOR;
    ctx.fillRect(DINO_X, dinoY.current, DINO_WIDTH, DINO_HEIGHT);
    
    // Score
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
      ctx.fillText('Click or Space to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else if (gameState === 'idle') {
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'center';
      ctx.font = `20px Arial`;
      ctx.fillText('Click or Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
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

      // Dino physics
      dinoVelocity.current += GRAVITY;
      dinoY.current += dinoVelocity.current;

      if (dinoY.current > GROUND_Y) {
        dinoY.current = GROUND_Y;
        dinoVelocity.current = 0;
      }
      
      // Obstacle generation
      if (obstacles.current.length === 0 || obstacles.current[obstacles.current.length - 1].x < CANVAS_WIDTH - nextObstacleDistance.current) {
         const obstacleHeight = Math.random() * (MAX_OBSTACLE_HEIGHT - MIN_OBSTACLE_HEIGHT) + MIN_OBSTACLE_HEIGHT;
         obstacles.current.push({ 
            x: CANVAS_WIDTH, 
            y: GROUND_Y + DINO_HEIGHT - obstacleHeight, // Obstacles on the ground
            width: OBSTACLE_WIDTH, 
            height: obstacleHeight, 
            passed: false 
        });
        nextObstacleDistance.current = Math.random() * (OBSTACLE_SPACING_MAX - OBSTACLE_SPACING_MIN) + OBSTACLE_SPACING_MIN;
      }

      // Move obstacles and check for score
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

      // Difficulty adjustment
      if (newScore > 0 && newScore % SPEED_INCREMENT_INTERVAL === 0 && newScore !== score ) { 
        gameSpeed.current = Math.min(MAX_GAME_SPEED, INITIAL_GAME_SPEED + (newScore / SPEED_INCREMENT_INTERVAL) * 0.2);
      }
      
      // Collision detection
      const dinoRight = DINO_X + DINO_WIDTH;
      const dinoBottom = dinoY.current + DINO_HEIGHT;

      for (const obstacle of obstacles.current) {
        const obsRight = obstacle.x + obstacle.width;
        const obsBottom = obstacle.y + obstacle.height; // This is actually obstacle.y for ground obstacles
        
        if ( DINO_X < obsRight && dinoRight > obstacle.x &&
             dinoY.current < obsBottom && dinoBottom > obstacle.y ) {
          updateHighScore(newScore);
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
  }, [gameState, score, highScore, draw, updateHighScore]);

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
    return () => window.removeEventListener('keydown', handleKeyPress);
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
          Jump over the obstacles! Click or tap spacebar to jump.
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
              <PlayCircle className="mr-2" /> {gameState === 'gameOver' ? 'Play Again' : (gameState === 'idle' ? 'Start Game' : 'Restart')}
            </Button>
        </div>
      <p className="text-sm text-muted-foreground">
        High Score: {highScore}
      </p>
    </div>
  );
}
