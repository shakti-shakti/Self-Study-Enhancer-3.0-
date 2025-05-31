// src/app/dashboard/selfie-attendance/page.tsx
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
// import { createClient } from '@/lib/supabase/client'; // For future image saving
// import type { TablesInsert } from '@/lib/database.types';

export default function SelfieAttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, startProcessingTransition] = useTransition();
  const { toast } = useToast();
  // const supabase = createClient(); // For future image saving
  // const [userId, setUserId] = useState<string | null>(null); // For future image saving

  // useEffect(() => { // For future image saving
  //   const getUserId = async () => {
  //     const {data: {user}} = await supabase.auth.getUser();
  //     setUserId(user?.id || null);
  //   }
  //   getUserId();
  // }, [supabase]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
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

    return () => { // Cleanup: stop camera stream when component unmounts
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [toast]);

  const handleMarkAttendance = () => {
    startProcessingTransition(() => {
      // Conceptual: In a real app, you'd capture a frame, upload to Supabase Storage,
      // and save a record in a 'attendance_logs' table.
      // For now, just a toast.
      toast({
        title: 'Attendance Marked (Conceptual)!',
        description: 'Your presence has been noted. In a full version, an image might be saved.',
        className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
      });
      // Example of what saving might look like (commented out)
      /*
      if (!userId || !videoRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const filePath = `${userId}/attendance/${new Date().toISOString()}.png`;
          // const { error: uploadError } = await supabase.storage.from('user-uploads').upload(filePath, blob);
          // if (uploadError) toast error
          // else {
          //   // const { error: dbError } = await supabase.from('attendance_logs').insert({user_id: userId, image_path: filePath});
          //   // if (dbError) toast error else toast success
          // }
        }
      }, 'image/png');
      */
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
          <CardDescription>Ensure your face is clearly visible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border shadow-inner flex items-center justify-center">
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
          </div>
          <Button 
            onClick={handleMarkAttendance} 
            className="w-full font-semibold text-lg py-3 glow-button"
            disabled={hasCameraPermission !== true || isProcessing}
          >
            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
            Mark Attendance
          </Button>
        </CardContent>
      </Card>
      <Alert variant="default" className="max-w-lg mx-auto bg-muted/30 border-primary/30">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Feature Note</AlertTitle>
        <AlertDescription>
            This is a conceptual demonstration of selfie attendance. In a full implementation, the captured image would be saved and potentially analyzed for mood. Currently, it only activates the camera and shows a confirmation message.
        </AlertDescription>
      </Alert>
    </div>
  );
}
