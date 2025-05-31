
// src/components/games/PuzzleWrapper.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PuzzleWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export default function PuzzleWrapper({ title, description, children, className }: PuzzleWrapperProps) {
  return (
    <Card className={`w-full mx-auto bg-background/30 border-border/50 shadow-xl p-2 md:p-4 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl md:text-2xl font-headline text-center glow-text-accent">{title}</CardTitle>
        <CardDescription className="text-center text-muted-foreground text-sm md:text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

    