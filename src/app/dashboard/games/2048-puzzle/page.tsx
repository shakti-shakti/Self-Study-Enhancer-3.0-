// src/app/dashboard/games/2048-puzzle/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Grid, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const GRID_SIZE = 4;

type Tile = number; // 0 represents an empty cell
type Board = Tile[][];

const initialBoard = (): Board => {
  const board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  addRandomTile(board);
  addRandomTile(board);
  return board;
};

const addRandomTile = (board: Board): void => {
  const emptyTiles: { r: number, c: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) {
        emptyTiles.push({ r, c });
      }
    }
  }
  if (emptyTiles.length > 0) {
    const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
};

const moveTiles = (board: Board, direction: 'left' | 'right' | 'up' | 'down'): { newBoard: Board, moved: boolean, scoreAdded: number } => {
  let newBoard = JSON.parse(JSON.stringify(board)) as Board; // Deep copy
  let moved = false;
  let scoreAdded = 0;

  const rotateBoard = (b: Board): Board => { // Rotate 90 deg clockwise
    const rotated = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        rotated[c][GRID_SIZE - 1 - r] = b[r][c];
      }
    }
    return rotated;
  };

  const slideRowLeft = (row: Tile[]): { newRow: Tile[], rowMoved: boolean, rowScore: number } => {
    let newRow = row.filter(tile => tile !== 0);
    let rowMoved = false;
    let rowScore = 0;

    // Merge tiles
    for (let i = 0; i < newRow.length - 1; i++) {
      if (newRow[i] === newRow[i + 1]) {
        newRow[i] *= 2;
        rowScore += newRow[i];
        newRow.splice(i + 1, 1);
        rowMoved = true;
      }
    }
    // Pad with zeros
    while (newRow.length < GRID_SIZE) {
      newRow.push(0);
    }
    // Check if actual movement occurred beyond merging
    if (!rowMoved) {
        for(let i = 0; i < GRID_SIZE; i++) {
            if (row[i] !== newRow[i]) {
                rowMoved = true;
                break;
            }
        }
    }
    return { newRow, rowMoved, rowScore };
  };

  let rotations = 0;
  if (direction === 'up') rotations = 1;
  else if (direction === 'right') rotations = 2;
  else if (direction === 'down') rotations = 3;

  for (let i = 0; i < rotations; i++) newBoard = rotateBoard(newBoard);

  for (let r = 0; r < GRID_SIZE; r++) {
    const { newRow, rowMoved, rowScore } = slideRowLeft(newBoard[r]);
    newBoard[r] = newRow;
    if (rowMoved) moved = true;
    scoreAdded += rowScore;
  }

  for (let i = 0; i < rotations; i++) newBoard = rotateBoard(rotateBoard(rotateBoard(newBoard))); // Rotate back

  return { newBoard, moved, scoreAdded };
};

const canMove = (board: Board): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) return true; // Empty cell exists
      if (r < GRID_SIZE - 1 && board[r][c] === board[r + 1][c]) return true; // Can merge vertically
      if (c < GRID_SIZE - 1 && board[r][c] === board[r][c + 1]) return true; // Can merge horizontally
    }
  }
  return false;
};

const tileColors: Record<number, string> = {
  0: 'bg-muted/30',
  2: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  4: 'bg-orange-100 text-orange-800 border-orange-300',
  8: 'bg-red-200 text-red-900 border-red-400',
  16: 'bg-pink-200 text-pink-900 border-pink-400',
  32: 'bg-purple-200 text-purple-900 border-purple-400',
  64: 'bg-indigo-200 text-indigo-900 border-indigo-400',
  128: 'bg-blue-200 text-blue-900 border-blue-400',
  256: 'bg-teal-200 text-teal-900 border-teal-400',
  512: 'bg-green-200 text-green-900 border-green-400',
  1024: 'bg-lime-300 text-lime-900 border-lime-500 font-bold',
  2048: 'bg-yellow-400 text-white border-yellow-600 font-bold shadow-lg shadow-yellow-500/50',
};


export default function Puzzle2048Page() {
  const [board, setBoard] = useState<Board>(initialBoard());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
     if (typeof window !== 'undefined') {
      const storedHighScore = localStorage.getItem('2048HighScore');
      if (storedHighScore) setHighScore(parseInt(storedHighScore, 10));
    }
  }, []);

  const updateHighScore = useCallback((currentScore: number) => {
    if (currentScore > highScore) {
      setHighScore(currentScore);
      if (typeof window !== 'undefined') {
        localStorage.setItem('2048HighScore', currentScore.toString());
      }
    }
  }, [highScore]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameOver) return;
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    switch (event.key) {
      case 'ArrowLeft': direction = 'left'; break;
      case 'ArrowRight': direction = 'right'; break;
      case 'ArrowUp': direction = 'up'; break;
      case 'ArrowDown': direction = 'down'; break;
      default: return;
    }
    event.preventDefault();

    const { newBoard, moved, scoreAdded } = moveTiles(board, direction);
    if (moved) {
      addRandomTile(newBoard);
      setBoard(newBoard);
      const newTotalScore = score + scoreAdded;
      setScore(newTotalScore);
      updateHighScore(newTotalScore);

      if (newBoard.flat().includes(2048) && !won) {
        setWon(true);
      }
      if (!canMove(newBoard)) {
        setGameOver(true);
      }
    }
  }, [board, score, gameOver, won, updateHighScore]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const restartGame = () => {
    setBoard(initialBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Grid className="mr-3 h-10 w-10 text-primary" /> 2048 Puzzle
        </h1>
        <p className="text-lg text-muted-foreground">
          Use arrow keys to move tiles. Combine tiles to reach 2048!
        </p>
      </header>

      <Card className="w-full max-w-md interactive-card shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-headline glow-text-accent">Score: {score}</CardTitle>
            <CardDescription>High Score: {highScore}</CardDescription>
          </div>
          <Button onClick={restartGame} variant="outline" className="glow-button">
            <RotateCcw /> Restart
          </Button>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 bg-muted/40 rounded-lg">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 aspect-square">
            {board.flat().map((tileValue, index) => (
              <div
                key={index}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center border-2",
                  "text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-100",
                  tileColors[tileValue] || 'bg-gray-300 text-gray-700 border-gray-400'
                )}
              >
                {tileValue > 0 ? tileValue : ''}
              </div>
            ))}
          </div>
        </CardContent>
         {(gameOver || won) && (
          <CardFooter className="flex flex-col items-center pt-4">
            {won && !gameOver && <p className="text-2xl font-bold text-green-500 mb-2 flex items-center"><Trophy className="mr-2"/>You Reached 2048! Keep Going?</p>}
            {gameOver && !won && <p className="text-2xl font-bold text-red-500 mb-2">Game Over!</p>}
            {gameOver && won && <p className="text-2xl font-bold text-yellow-500 mb-2">Game Over! But you reached 2048!</p>}
            <Button onClick={restartGame} className="glow-button text-lg mt-2">
                <RotateCcw className="mr-2"/> Play Again
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

