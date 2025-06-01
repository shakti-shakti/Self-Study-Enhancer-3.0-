// src/app/dashboard/games/dino-run/page.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';
import Link from 'next/link';

export default function DinoRunPage() {
  return (
    <div className="flex flex-col items-center space-y-6">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-2 flex items-center justify-center">
          <Rocket className="mr-3 h-10 w-10 text-primary" /> Dino Run
        </h1>
        <p className="text-lg text-muted-foreground">
          Classic T-Rex runner game. Jump over obstacles!
        </p>
      </header>

      <Card className="w-full max-w-md interactive-card shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center glow-text-accent">Game Under Construction</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Rocket className="h-24 w-24 mx-auto text-primary opacity-50" />
          <p className="text-muted-foreground">
            The Dino Run game is being built! This pixelated adventure will be ready for you soon.
            A canvas-based implementation for this game is a bit more involved.
          </p>
          <Button asChild variant="outline" className="glow-button">
            <Link href="/dashboard/games">Back to Games Arcade</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
