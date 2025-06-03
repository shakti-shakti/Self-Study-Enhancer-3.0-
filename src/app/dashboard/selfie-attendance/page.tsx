
// src/app/dashboard/selfie-attendance/page.tsx
'use client';

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, CheckCircle, AlertTriangle, Loader2, Timer, Info, Users } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert, ActivityLogWithSelfie } from '@/lib/database.types';
import { format, parseISO } from 'date-fns';
import NextImage from 'next/image'; // For displaying stored images

export default function SelfieAttendancePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isProcessing, startProcessingTransition] = useTransition();
  const [isFetchingHistory, startFetchingHistoryTransition] = useTransition();
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const supabase = createClient(); 
  const [userId, setUserId] = useState<string | null>(null);
  const [selfieHistory, setSelfieHistory] = useState<ActivityLogWithSelfie[]>([]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setUserId(session?.user?.id ?? null);
    });
     const getInitialUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUserId(user?.id || null);
    };
    getInitialUser();
    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchSelfieHistory = useCallback(async () => {
    if (!userId) return;
    startFetchingHistoryTransition(async () => {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('activity_type', 'selfie_attendance_marked')
            .order('created_at', { ascending: false })
            .limit(10); 

        if (error) {
            toast({ variant: 'destructive', title: 'Error Fetching Attendance History', description: error.message });
        } else {
            setSelfieHistory(data as ActivityLogWithSelfie[] || []);
        }
    });
  }, [userId, supabase, toast]);

  useEffect(() => {
    if (userId) {
        fetchSelfieHistory();
    }
  }, [userId, fetchSelfieHistory]);


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

    return () => { 
        if (streamInstance) {
            streamInstance.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null; 
        }
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const captureSelfieAndUpload = async (): Promise<string> => { // Changed return type to throw on error
    if (!videoRef.current || !canvasRef.current || !hasCameraPermission) {
      throw new Error("Camera or canvas not ready.");
    }
    if (!userId) {
        throw new Error("User not authenticated. Cannot upload image.");
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error("Failed to get canvas context.");
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/png');
    
    const blob = dataURItoBlob(dataUri);
    const fileName = `selfie_${userId}_${Date.now()}.png`;
    const filePath = `${userId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('selfie-attendances') 
        .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        console.error("Error uploading selfie to storage:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}. Check bucket RLS policies.`);
    }
    
    const { data: publicUrlData } = supabase.storage.from('selfie-attendances').getPublicUrl(filePath);
    if (!publicUrlData.publicUrl) {
        throw new Error("Failed to get public URL for uploaded selfie.");
    }
    return publicUrlData.publicUrl;
  };

  const handleMarkAttendance = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdown(3);
    startProcessingTransition(() => { 
        countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                    setCountdown(null);
                    
                    captureSelfieAndUpload()
                        .then(async (imageStoragePath) => {
                            if (userId) { // userId should already be checked by captureSelfieAndUpload
                                const attendanceLog: TablesInsert<'activity_logs'> = { 
                                    user_id: userId,
                                    activity_type: 'selfie_attendance_marked',
                                    description: 'Selfie attendance marked.',
                                    details: { 
                                        image_storage_path: imageStoragePath,
                                        captured_at: new Date().toISOString() 
                                    }
                                };
                                const { error: logError } = await supabase.from('activity_logs').insert(attendanceLog);
                                if (logError) throw logError;

                                toast({
                                    title: 'Attendance Marked!',
                                    description: 'Your presence has been noted and image saved.',
                                    className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
                                });
                                fetchSelfieHistory(); 
                            }
                        })
                        .catch(error => {
                            toast({ variant: "destructive", title: "Capture or Upload Failed", description: error.message });
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
      <canvas ref={canvasRef} style={{ display: 'none' }} /> 
      <Card className="max-w-lg mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Camera View</CardTitle>
          <CardDescription>Ensure your face is clearly visible. Smile!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border shadow-inner flex items-center justify-center relative game-canvas">
            {hasCameraPermission === null && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {hasCameraPermission === false && (
              <div className="text-center p-4">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
                <p className="font-semibold text-destructive">Camera Access Required</p>
                <p className="text-sm text-muted-foreground">Please grant camera permission in your browser.</p>
              </div>
            )}
            <video 
                ref={videoRef} 
                className={`w-full h-full object-cover ${hasCameraPermission === true ? 'block' : 'hidden'}`} 
                autoPlay 
                muted 
                playsInline 
            />
             {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-7xl font-bold text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}
          </div>
          { !(hasCameraPermission && hasCameraPermission !== null) && (
            <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Camera Not Ready</AlertTitle>
                      <AlertDescription>
                        Please enable camera permissions in your browser settings to use this app.
                      </AlertDescription>
            </Alert>
           )}
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
      
      <Card className="max-w-3xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-secondary/10 mt-8">
        <CardHeader>
            <CardTitle className="text-2xl font-headline glow-text-secondary flex items-center"><Users className="mr-2"/>Recent Selfie Attendances</CardTitle>
            <CardDescription>Your last few check-ins.</CardDescription>
        </CardHeader>
        <CardContent>
            {isFetchingHistory && selfieHistory.length === 0 && <div className="text-center p-4"><Loader2 className="h-8 w-8 animate-spin text-secondary"/></div>}
            {!isFetchingHistory && selfieHistory.length === 0 && <p className="text-muted-foreground text-center p-4">No selfie attendances recorded yet.</p>}
            {selfieHistory.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selfieHistory.map(log => (
                        <Card key={log.id} className="overflow-hidden bg-card/70 border-border/50 shadow-md">
                            {log.details?.image_storage_path ? (
                                <NextImage 
                                    src={log.details.image_storage_path} 
                                    alt={`Selfie from ${log.details.captured_at ? format(parseISO(log.details.captured_at), "PP") : 'past'}`} 
                                    width={150} 
                                    height={150} 
                                    className="w-full aspect-square object-cover"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150/CCCCCC/777777.png?text=Error';}} // Fallback image
                                />
                            ) : (
                                <div className="w-full aspect-square bg-muted flex items-center justify-center">
                                    <Camera className="h-10 w-10 text-muted-foreground"/>
                                </div>
                            )}
                            <p className="text-xs text-center p-1.5 bg-muted/50 text-muted-foreground">
                                {log.details?.captured_at ? format(parseISO(log.details.captured_at), "MMM d, HH:mm") : format(parseISO(log.created_at), "MMM d, HH:mm")}
                            </p>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>

      <Alert variant="default" className="max-w-lg mx-auto bg-muted/30 border-primary/30">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="font-semibold text-primary">Data Storage & Permissions</AlertTitle>
        <AlertDescription>
            Selfies are uploaded to secure cloud storage, and only the path is stored in the database for display. This ensures privacy and efficient data management. Ensure your Supabase bucket 'selfie-attendances' exists and has correct RLS policies for uploads.
        </AlertDescription>
      </Alert>
    </div>
  );
}
    
