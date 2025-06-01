
// src/app/dashboard/selfie-attendance/page.tsx
'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react'; // Added React
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, CheckCircle, AlertTriangle, Loader2, Timer, Info } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function SelfieAttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, startProcessingTransition] = useTransition();
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let streamInstance: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          streamInstance = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = streamInstance;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({ // This toast is now called after the async operation
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
        }
      } else {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Not Supported', description: 'Your browser does not support camera access.'});
      }
    };
    getCameraPermission();

    return () => { 
        if (streamInstance) {
            streamInstance.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null; // Clean up srcObject
        }
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Toast is now stable due to useCallback in useToast, but to be safe, keeping dependencies minimal for this effect.

  const handleMarkAttendance = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdown(3);
    startProcessingTransition(() => { // This ensures state updates inside are batched
        countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                    setCountdown(null);
                    toast({
                        title: 'Attendance Marked (Conceptual)!',
                        description: 'Your presence has been noted. In a full version, an image might be saved.',
                        className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
                    });
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    });
  };

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Camera className="mr-4 h-10 w-10" /> Selfie Attendance
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Mark your daily attendance with a quick selfie. Stay consistent!
        </p>
      </header>

      <Card className="max-w-lg mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Camera View</CardTitle>
          <CardDescription>Ensure your face is clearly visible. Smile!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border shadow-inner flex items-center justify-center relative">
            {hasCameraPermission === null && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {hasCameraPermission === false && (
              <div className="text-center p-4">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
                <p className="font-semibold text-destructive">Camera Access Required</p>
                <p className="text-sm text-muted-foreground">Please grant camera permission in your browser.</p>
              </div>
            )}
            {hasCameraPermission === true && (
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            )}
             {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-7xl font-bold text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}
          </div>
          <Button 
            onClick={handleMarkAttendance} 
            className="w-full font-semibold text-lg py-3 glow-button"
            disabled={hasCameraPermission !== true || isProcessing || countdown !== null}
          >
            {isProcessing && countdown === null ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
             countdown !== null ? <Timer className="mr-2 h-5 w-5 animate-pulse" /> : 
             <CheckCircle className="mr-2 h-5 w-5" />}
            {countdown !== null ? `Capturing in ${countdown}...` : 'Mark Attendance'}
          </Button>
        </CardContent>
      </Card>
      <Alert variant="default" className="max-w-lg mx-auto bg-muted/30 border-primary/30">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Feature Note</AlertTitle>
        <AlertDescription>
            This is a conceptual demonstration of selfie attendance. In a full implementation, the captured image would be saved and potentially analyzed. Currently, it only activates the camera, shows a countdown, and then a confirmation message.
        </AlertDescription>
      </Alert>
    </div>
  );
}
