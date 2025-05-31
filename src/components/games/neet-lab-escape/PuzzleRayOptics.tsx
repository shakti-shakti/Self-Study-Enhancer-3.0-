
// src/components/games/neet-lab-escape/PuzzleRayOptics.tsx
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import PuzzleWrapper from '../PuzzleWrapper';

interface PuzzleRayOpticsProps {
  onSolve: () => void;
  onFail: (message: string) => void;
}

// Simplified Ray Optics Puzzle: Place mirrors to hit a target
// This is a conceptual representation. A real implementation would need more complex canvas drawing or SVG.
export default function PuzzleRayOptics({ onSolve, onFail }: PuzzleRayOpticsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // For simplicity, we'll use a conceptual solution rather than complex canvas logic
  const [mirror1Angle, setMirror1Angle] = useState(45); // Angle in degrees
  const [mirror2Angle, setMirror2Angle] = useState(-45);

  const LASER_START = { x: 50, y: 150 };
  const TARGET_POS = { x: 250, y: 50 };
  const MIRROR1_POS = { x: 100, y: 100 };
  const MIRROR2_POS = { x: 200, y: 100 };
  
  // Simple check based on angles for demo purposes
  const CORRECT_MIRROR1_ANGLE = 45; 
  const CORRECT_MIRROR2_ANGLE = -45; 

  const drawPuzzle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = "12px Arial";

    // Laser Source
    ctx.fillStyle = 'hsl(var(--destructive))';
    ctx.beginPath();
    ctx.arc(LASER_START.x, LASER_START.y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillText("Laser", LASER_START.x - 15, LASER_START.y + 15);


    // Target
    ctx.fillStyle = 'hsl(var(--primary))';
    ctx.fillRect(TARGET_POS.x - 10, TARGET_POS.y - 10, 20, 20);
    ctx.fillText("Target", TARGET_POS.x - 15, TARGET_POS.y + 25);

    // Mirrors (simple lines representing them)
    const drawMirror = (pos: {x:number, y:number}, angle: number, label: string) => {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle * Math.PI / 180);
      ctx.strokeStyle = 'hsl(var(--accent))';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.fillText(label, pos.x - 15, pos.y - 25);
    };
    
    drawMirror(MIRROR1_POS, mirror1Angle, `M1 (${mirror1Angle}°)`);
    drawMirror(MIRROR2_POS, mirror2Angle, `M2 (${mirror2Angle}°)`);

    // Simulate laser path (highly simplified)
    // A real one would calculate reflections based on angles.
    ctx.strokeStyle = 'hsl(var(--destructive)/0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(LASER_START.x, LASER_START.y);
    // Simple path based on whether angles are roughly correct
    if (Math.abs(mirror1Angle - CORRECT_MIRROR1_ANGLE) < 10) {
      ctx.lineTo(MIRROR1_POS.x, MIRROR1_POS.y);
      if (Math.abs(mirror2Angle - CORRECT_MIRROR2_ANGLE) < 10) {
         ctx.lineTo(MIRROR2_POS.x, MIRROR2_POS.y);
         ctx.lineTo(TARGET_POS.x, TARGET_POS.y); // Hit target
      } else {
         ctx.lineTo(MIRROR2_POS.x + 50, MIRROR2_POS.y + 50); // Miss
      }
    } else {
      ctx.lineTo(MIRROR1_POS.x + 50, MIRROR1_POS.y - 50); // Miss
    }
    ctx.stroke();
  };

  useEffect(() => {
    drawPuzzle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mirror1Angle, mirror2Angle]);


  const checkSolution = () => {
    if (Math.abs(mirror1Angle - CORRECT_MIRROR1_ANGLE) < 5 && Math.abs(mirror2Angle - CORRECT_MIRROR2_ANGLE) < 5) {
      onSolve();
    } else {
      onFail("Incorrect mirror alignment. Laser trajectory off course.");
    }
  };

  return (
    <PuzzleWrapper title="Ray Optics Alignment" description="Adjust the angles of Mirror 1 and Mirror 2 to guide the laser beam to the target.">
      <div className="p-4 space-y-6">
        <canvas ref={canvasRef} width="300" height="200" className="bg-muted/20 rounded-md border border-border mx-auto block shadow-inner"></canvas>
        
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <label htmlFor="mirror1" className="block text-sm font-medium text-muted-foreground">Mirror 1 Angle: {mirror1Angle}°</label>
            <input type="range" id="mirror1" min="-90" max="90" value={mirror1Angle} onChange={(e) => setMirror1Angle(parseInt(e.target.value))} className="w-full h-2 bg-primary/30 rounded-lg appearance-none cursor-pointer accent-primary"/>
          </div>
          <div>
            <label htmlFor="mirror2" className="block text-sm font-medium text-muted-foreground">Mirror 2 Angle: {mirror2Angle}°</label>
            <input type="range" id="mirror2" min="-90" max="90" value={mirror2Angle} onChange={(e) => setMirror2Angle(parseInt(e.target.value))} className="w-full h-2 bg-accent/30 rounded-lg appearance-none cursor-pointer accent-accent"/>
          </div>
        </div>
        <Button onClick={checkSolution} className="w-full glow-button">
          <Target className="mr-2"/> Test Alignment
        </Button>
      </div>
    </PuzzleWrapper>
  );
}
    
