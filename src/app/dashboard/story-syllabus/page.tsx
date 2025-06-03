
// src/app/dashboard/story-syllabus/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Map, Compass, ScrollText, BookOpen, Zap, Atom, Leaf, PawPrint, ChevronRight, Lock, Coins, KeyRound, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import * as apiClient from '@/lib/apiClient'; 
import { initialSyllabusRealms, type SyllabusRealm, type Chapter } from '@/lib/story-data'; // Import from new location

export default function StorySyllabusPage() {
  const { toast } = useToast();
  const [syllabusData, setSyllabusData] = useState<SyllabusRealm[]>(initialSyllabusRealms);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isProcessingUnlock, setIsProcessingUnlock] = useState(false);
  const router = useRouter();

  const getIconForSubject = (subject: string): React.ReactNode => {
    if (subject === 'Physics') return <Zap className="h-10 w-10 text-yellow-400" />;
    if (subject === 'Chemistry') return <Atom className="h-10 w-10 text-blue-400" />;
    if (subject === 'Biology') return <Leaf className="h-10 w-10 text-green-400" />;
    return <BookOpen className="h-10 w-10 text-gray-400" />;
  };

  const refreshUnlockStatus = useCallback(async () => {
    setIsLoading(true);
    const unlockedIds = await apiClient.fetchUnlockedContentIds();
    
    setSyllabusData(prevData => 
      prevData.map(realm => ({
        ...realm,
        chapters: realm.chapters.map(chapter => ({
          ...chapter,
          locked: chapter.unlock_cost_coins || chapter.is_password_unlockable ? !unlockedIds.includes(chapter.id) : false,
        }))
      }))
    );
    setIsLoading(false);
  }, []);


  useEffect(() => {
    refreshUnlockStatus();
  }, [refreshUnlockStatus]);

  const handleUnlockWithCoins = async (realmName: string, chapter: Chapter) => {
    if (!chapter.unlock_cost_coins) return;
    setIsProcessingUnlock(true);
    const result = await apiClient.unlockContentWithCoins(chapter.id, chapter.unlock_cost_coins);
    if (result.success) {
      toast({ title: "Unlock Successful!", description: `${chapter.name} in ${realmName} unlocked. ${result.message}`, className: 'bg-primary/10 border-primary text-primary-foreground' });
      await refreshUnlockStatus(); 
    } else {
      toast({ variant: 'destructive', title: 'Unlock Failed', description: result.message || "Could not unlock with coins." });
    }
    setIsProcessingUnlock(false);
  };

  const handleUnlockWithPassword = async (realmName: string, chapter: Chapter) => {
    setIsProcessingUnlock(true);
    const result = await apiClient.unlockContentWithPassword(chapter.id, passwordInput);
    if (result.success) {
      toast({ title: "Unlock Successful!", description: `${chapter.name} in ${realmName} unlocked. ${result.message}`, className: 'bg-accent/10 border-accent text-accent-foreground' });
      await refreshUnlockStatus(); 
    } else {
      toast({ variant: 'destructive', title: 'Unlock Failed', description: result.message || "Incorrect password." });
    }
    setPasswordInput(''); 
    setIsProcessingUnlock(false);
  };

  const beginQuest = (chapterId: string) => {
    router.push(`/dashboard/story-syllabus/play/${chapterId}`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Map className="mr-4 h-10 w-10" /> Syllabus Story Mode
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Embark on an epic quest through your NEET syllabus! Each subject is a realm, each chapter a new adventure.
        </p>
      </header>

      <div className="space-y-8">
        {syllabusData.map(realm => (
          <Card key={realm.id} className="interactive-card shadow-xl overflow-hidden">
            <div className="relative h-48 md:h-64 w-full">
                <Image src={realm.imageUrl} alt={realm.name} layout="fill" objectFit="cover" data-ai-hint={realm.dataAiHint || 'realm image'}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-6">
                    <div className="flex items-center mb-2">
                        {getIconForSubject(realm.subject)}
                        <h2 className="text-3xl md:text-4xl font-headline font-bold text-white glow-text-primary ml-3">{realm.name}</h2>
                    </div>
                    <p className="text-base text-primary-foreground/80 max-w-2xl">{realm.description}</p>
                </div>
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3 text-accent glow-text-accent">Chapters / Quests:</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {realm.chapters.map(chapter => (
                  <Card key={chapter.id} className={`p-4 border-2 flex flex-col justify-between ${chapter.locked ? 'border-muted/30 bg-muted/20 opacity-80' : 'border-primary/50 bg-primary/10 hover:shadow-primary/30'}`}>
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center">
                          <ScrollText className={`mr-2 h-5 w-5 ${chapter.locked ? 'text-muted-foreground' : 'text-primary'}`} />
                          {chapter.name}
                      </CardTitle>
                      {chapter.level_hint && <p className="text-xs text-muted-foreground mt-1">Difficulty: {chapter.level_hint}</p>}
                      <CardDescription className="text-sm mt-1 min-h-[3em]">{chapter.quest}</CardDescription>
                    </div>
                    <div className="mt-3 space-y-2">
                      {chapter.locked ? (
                        <>
                          {chapter.unlock_cost_coins && (
                            <Button
                                size="sm"
                                className="w-full glow-button"
                                variant="outline"
                                onClick={() => handleUnlockWithCoins(realm.name, chapter)}
                                disabled={isProcessingUnlock}
                            >
                              {isProcessingUnlock ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <Coins className="mr-1 h-4 w-4"/>} Unlock with {chapter.unlock_cost_coins} Coins
                            </Button>
                          )}
                          {chapter.is_password_unlockable && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="w-full glow-button" variant="outline" disabled={isProcessingUnlock}>
                                  <KeyRound className="mr-1 h-4 w-4"/> Unlock with Password
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Unlock {chapter.name}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Enter the password to unlock this chapter. (Demo password: NEETPREP2025)
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Input 
                                  type="password" 
                                  placeholder="Enter password" 
                                  value={passwordInput} 
                                  onChange={(e) => setPasswordInput(e.target.value)} 
                                  className="input-glow"
                                />
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setPasswordInput('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUnlockWithPassword(realm.name, chapter)} disabled={isProcessingUnlock || !passwordInput}>
                                    {isProcessingUnlock ? <Loader2 className="h-4 w-4 animate-spin"/> : "Unlock"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                           {!chapter.unlock_cost_coins && !chapter.is_password_unlockable && (
                             <Button size="sm" className="w-full" disabled>
                                <Lock className="mr-1 h-4 w-4"/> Locked (Story Progression)
                            </Button>
                           )}
                        </>
                      ) : (
                        <Button
                            size="sm"
                            className="w-full glow-button"
                            onClick={() => beginQuest(chapter.id)}
                        >
                          Begin Quest <ChevronRight className="ml-1 h-4 w-4"/>
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
       <p className="text-center text-muted-foreground mt-8 text-sm">
        Note: Coin and password unlock features are simulated on the client-side for demo purposes. Full backend integration is required.
      </p>
    </div>
  );
}
