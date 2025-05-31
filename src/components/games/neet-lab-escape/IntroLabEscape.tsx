
// src/components/games/neet-lab-escape/IntroLabEscape.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, PlayCircle, DoorClosed } from 'lucide-react';

interface IntroLabEscapeProps {
  onStartGame: () => void;
}

export default function IntroLabEscape({ onStartGame }: IntroLabEscapeProps) {
  return (
    <Card className="w-full max-w-2xl text-center bg-slate-800/70 border-primary/50 shadow-2xl shadow-primary/40 p-6 md:p-10 lab-escape-puzzle-card">
      <CardHeader>
        <DoorClosed className="h-20 w-20 mx-auto text-primary mb-6 animate-pulse" />
        <CardTitle className="text-5xl font-headline font-bold text-primary-foreground glow-text-primary">
          The NEET Lab Escape
        </CardTitle>
        <CardDescription className="text-xl text-muted-foreground mt-4">
          You are locked inside a secure NEET Research Lab. Alarms blare.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-2xl italic text-primary-foreground/90">
          Each door is protected by science puzzles from the NEET syllabus. You must solve the chain of rooms to escape before the countdown ends!
        </p>
        <p className="text-lg text-muted-foreground">
          Physics, Chemistry, Botany, Zoology – your knowledge is the key. Can you master time and your subjects to break free?
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={onStartGame} className="w-full text-xl py-6 glow-button bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlayCircle className="mr-2 h-6 w-6" /> Begin Escape Sequence
        </Button>
      </CardFooter>
    </Card>
  );
}
    
