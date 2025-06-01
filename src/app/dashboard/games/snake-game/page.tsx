// src/app/dashboard/games/snake-game/page.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function SnakeGamePage() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <MoveHorizontal className="mr-3 h-10 w-10 text-primary" /> Snake Game
        </h1>
        <p className="text-lg text-muted-foreground">
          Classic Snake! Grow your snake by eating food, but don't hit walls or yourself.
        </p>
      </header>

      <Card className="w-full max-w-md interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center glow-text-accent">Watch This Space!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <MoveHorizontal className="h-24 w-24 mx-auto text-primary opacity-50" />
          <p className="text-muted-foreground">
            The Snake Game is slithering its way here soon!
            This game requires careful handling of movement, collision detection, and the game loop.
          </p>
          <Button asChild variant="outline" className="glow-button">
            <Link href="/dashboard/games">Back to Games Arcade</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
