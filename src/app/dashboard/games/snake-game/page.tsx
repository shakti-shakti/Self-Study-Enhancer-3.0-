// src/app/dashboard/games/snake-game/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MoveHorizontal, PlayCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRID_SIZE = 20; // 20x20 grid
const INITIAL_SNAKE = [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Moving up initially
const INITIAL_SPEED_MS = 200; // Milliseconds per move
const SPEED_INCREMENT = 10; // Decrease interval by this amount to speed up
const MIN_SPEED_MS = 80;

type Position = { x: number; y: number };
type Direction = Position;

export default function SnakeGamePage() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(getRandomFoodPosition(INITIAL_SNAKE));
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED_MS);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedHighScore = localStorage.getItem('snakeGameHighScore');
      if (storedHighScore) setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  const updateHighScore = useCallback((currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('snakeGameHighScore', currentScore.toString());
      }
    }
  }, [highScore]);

  function getRandomFoodPosition(currentSnake: Position[]): Position {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFoodPosition(INITIAL_SNAKE));
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsPlaying(false);
    setGameSpeed(INITIAL_SPEED_MS);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  }, []);
  
  const startGame = () => {
    resetGame();
    setIsPlaying(true);
  };


  const moveSnake = useCallback(() => {
    if (gameOver || !isPlaying) return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      head.x += direction.x;
      head.y += direction.y;

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        updateHighScore(score);
        setIsPlaying(false);
        return prevSnake;
      }

      // Self collision
      for (let i = 1; i < newSnake.length; i++) {
        if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
          setGameOver(true);
          updateHighScore(score);
          setIsPlaying(false);
          return prevSnake;
        }
      }

      newSnake.unshift(head); // Add new head

      // Food eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 1);
        setFood(getRandomFoodPosition(newSnake));
        // Speed up
        setGameSpeed(prevSpeed => Math.max(MIN_SPEED_MS, prevSpeed - SPEED_INCREMENT));

      } else {
        newSnake.pop(); // Remove tail if no food eaten
      }
      return newSnake;
    });
  }, [direction, food, gameOver, isPlaying, score, updateHighScore]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      gameLoopRef.current = setInterval(moveSnake, gameSpeed);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [moveSnake, isPlaying, gameOver, gameSpeed]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPlaying) return;
      switch (event.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPlaying]);

  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <MoveHorizontal className="mr-3 h-10 w-10 text-primary" /> Snake Game
        </h1>
        <p className="text-lg text-muted-foreground">
          Use arrow keys to control the snake. Eat food to grow!
        </p>
      </header>

      <Card className="w-full max-w-md interactive-card shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-headline glow-text-accent">Score: {score}</CardTitle>
            <CardDescription>High Score: {highScore}</CardDescription>
          </div>
          {!isPlaying && (
             <Button onClick={startGame} className="glow-button">
                <PlayCircle className="mr-2"/> {gameOver ? 'Play Again' : 'Start Game'}
            </Button>
          )}
           {isPlaying && !gameOver && (
            <Button onClick={() => setIsPlaying(false)} variant="outline" className="glow-button">Pause</Button>
           )}
           {isPlaying && gameOver && ( // Should not happen, but as a fallback
             <Button onClick={startGame} variant="outline" className="glow-button">
                <RotateCcw className="mr-2"/> Restart
            </Button>
           )}

        </CardHeader>
        <CardContent className="p-2 sm:p-3 bg-muted/40 rounded-lg">
          <div 
            className="grid relative aspect-square border-2 border-primary"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnakeSegment = snake.some(seg => seg.x === x && seg.y === y);
              const isSnakeHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-square border-[0.5px] border-border/20",
                    isSnakeHead ? "bg-green-600 rounded-sm" : 
                    isSnakeSegment ? "bg-green-400 rounded-sm" : 
                    isFood ? "bg-red-500 rounded-full" : 
                    "bg-card"
                  )}
                />
              );
            })}
             {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                    <p className="text-3xl font-bold text-white mb-2">Game Over!</p>
                    <p className="text-xl text-gray-300 mb-4">Final Score: {score}</p>
                     <Button onClick={startGame} className="glow-button">
                        <RotateCcw className="mr-2"/> Play Again
                    </Button>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

