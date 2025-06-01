// src/app/dashboard/games/2048-puzzle/page.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react'; // Changed from Hash
import Link from 'next/link';

export default function Puzzle2048Page() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Target className="mr-3 h-10 w-10 text-primary" /> 2048 Puzzle Challenge
        </h1>
        <p className="text-lg text-muted-foreground">
          Slide tiles and combine matching numbers to reach the 2048 tile.
        </p>
      </header>

      <Card className="w-full max-w-md interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center glow-text-accent">Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Target className="h-24 w-24 mx-auto text-primary opacity-50" />
          <p className="text-muted-foreground">
            The 2048 Puzzle game is in development. Get ready to slide those tiles!
            Implementing the grid logic, tile merging, and animations for 2048 is a detailed process.
          </p>
          <Button asChild variant="outline" className="glow-button">
            <Link href="/dashboard/games">Back to Games Arcade</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
