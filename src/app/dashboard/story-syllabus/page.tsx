
// src/app/dashboard/story-syllabus/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Map, Compass, ScrollText, BookOpen, Zap, Atom, Leaf, PawPrint, ChevronRight, Lock, Coins, KeyRound, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import * as apiClient from '@/lib/apiClient'; 

interface Chapter {
  id: string;
  name: string;
  level_hint?: string;
  quest: string;
  locked: boolean; 
  unlock_cost_coins?: number | null;
  is_password_unlockable?: boolean | null; 
  story_summary?: string;
}

interface SyllabusRealm {
  id: string;
  name: string;
  subject: string;
  icon: React.ReactNode;
  description: string;
  chapters: Chapter[];
  imageUrl: string;
  dataAiHint?: string;
}

// Initial static data for realms and chapters (can be moved to DB eventually)
const initialSyllabusRealms: SyllabusRealm[] = [
  {
    id: 'physics_realm',
    name: 'The Realm of Motion & Energy',
    subject: 'Physics',
    icon: <Zap className="h-10 w-10 text-yellow-400" />,
    description: "Unravel the fundamental forces that govern the cosmos. From the smallest particles to the grandest galaxies, master the laws of motion, energy, and light.",
    chapters: [
      { id: 'phy_ch1', name: 'The Oracle of Kinematics', level_hint: "Foundational", quest: 'Chart the Path of Falling Stars', locked: false, story_summary: "Ancient scrolls speak of a celestial event where stars fall. Your quest is to predict their trajectory using the laws of kinematics before they impact the Chronos Temple." },
      { id: 'phy_ch2', name: 'The Labyrinth of Forces', level_hint: "Foundational", quest: 'Balance the Scales of Newton', locked: false, story_summary: "A mystical labyrinth shifts its walls based on unbalanced forces. Master Newton's Laws to navigate its treacherous paths and find the Amulet of Equilibrium." },
      { id: 'phy_ch3', name: 'The Sunstone of Power', level_hint: "Intermediate", quest: 'Harness the Work-Energy Theorem', locked: true, unlock_cost_coins: 100, story_summary: "The legendary Sunstone can power the entire realm, but its energy is chaotic. Apply the Work-Energy Theorem to channel its power safely." },
      { id: 'phy_ch4', name: 'Graviton\'s Peak', level_hint: "Advanced", quest: 'Ascend to the Summit of Gravity', locked: true, unlock_cost_coins: 150, is_password_unlockable: true, story_summary: "Only by understanding the nuances of gravitational fields can one hope to reach the summit of Graviton's Peak, where the Sage of Universal Laws resides." },
      { id: 'phy_ch5', name: 'Thermal Tides', level_hint: "Intermediate", quest: 'Navigate the Currents of Thermodynamics', locked: true, unlock_cost_coins: 120, story_summary: "The Thermal Tides are rising, threatening to plunge the land into an ice age or scorch it with fire. Master thermodynamic principles to restore balance." },
      { id: 'phy_ch6', name: 'Electromagnetism Enigma', level_hint: "Advanced", quest: 'Solve the riddles of charged fields', locked: true, unlock_cost_coins: 180, is_password_unlockable: true, story_summary: "Ancient machines powered by electromagnetism are malfunctioning. Decipher their circuits and fields to prevent a realm-wide blackout." },
      { id: 'phy_ch7', name: 'Optics Obscura', level_hint: "Intermediate", quest: 'Manipulate light to reveal hidden paths', locked: true, unlock_cost_coins: 130, story_summary: "A chamber of illusions hides the path forward. Use your knowledge of mirrors and lenses to see through the deception." },
    ],
    imageUrl: 'https://placehold.co/600x300/1A237E/FFFFFF.png?text=Physics+Realm',
    dataAiHint: 'fantasy landscape energy'
  },
  {
    id: 'chemistry_realm',
    name: 'The Alchemist\'s Code',
    subject: 'Chemistry',
    icon: <Atom className="h-10 w-10 text-blue-400" />,
    description: "Delve into the secrets of matter. Transmute elements, understand reactions, and become a master of the molecular world.",
    chapters: [
      { id: 'chem_ch1', name: 'The Scroll of Basic Concepts', level_hint: "Foundational", quest: 'Decipher the Mole & Molar Mass', locked: false, story_summary: "An ancient scroll, written in the language of moles and molar masses, holds the key to understanding the basic building blocks of the Alchemist's world." },
      { id: 'chem_ch2', name: 'The Atomic Sanctuary', level_hint: "Intermediate", quest: 'Visualize the Quantum Orbits', locked: true, unlock_cost_coins: 120, story_summary: "Within the Atomic Sanctuary, spirits of electrons dance in quantum orbitals. Map their paths to unlock the sanctuary's secrets." },
      { id: 'chem_ch3', name: 'Bonding Bay', level_hint: "Intermediate", quest: 'Forge the Covalent Chains', locked: true, unlock_cost_coins: 120, is_password_unlockable: true, story_summary: "The islands of Bonding Bay are connected by weak bridges. Forge strong covalent chains to create stable pathways between them." },
      { id: 'chem_ch4', name: 'Equilibrium Estuary', level_hint: "Advanced", quest: "Restore Balance to the Reaction Reeds", locked: true, unlock_cost_coins: 180, story_summary: "The Reaction Reeds in Equilibrium Estuary are wildly fluctuating, causing chaotic magical surges. Apply Le Chatelier's Principle to stabilize them." },
      { id: 'chem_ch5', name: 'Organic Synthesis Chambers', level_hint: "Advanced", quest: 'Craft complex molecules', locked: true, unlock_cost_coins: 200, is_password_unlockable: true, story_summary: "The Elixir of Life requires a multi-step organic synthesis. Navigate the reaction chambers and choose the correct reagents." },
    ],
    imageUrl: 'https://placehold.co/600x300/004D40/FFFFFF.png?text=Chemistry+Realm',
    dataAiHint: 'mystical laboratory potions'
  },
  {
    id: 'biology_realm',
    name: 'The Living Labyrinth',
    subject: 'Biology',
    icon: <Leaf className="h-10 w-10 text-green-400" />,
    description: "Explore the intricate tapestry of life. From the cellular level to vast ecosystems, understand the wonders of the biological domain.",
    chapters: [
      { id: 'bio_ch1', name: 'The Seed of Diversity', level_hint: "Foundational", quest: 'Classify the Kingdoms of Life', locked: false, story_summary: "The Seed of Diversity is fracturing, and life forms are mixing chaotically. Restore order by correctly classifying them into their respective kingdoms." },
      { id: 'bio_ch2', name: 'Cellular Citadel', level_hint: "Intermediate", quest: 'Defend the Organelles', locked: true, unlock_cost_coins: 100, is_password_unlockable: true, story_summary: "The Cellular Citadel is under attack by rogue phages! Understand the function of each organelle to mount a successful defense." },
      { id: 'bio_ch3', name: 'The Genetic Spires', level_hint: "Advanced", quest: 'Unravel the Double Helix', locked: true, unlock_cost_coins: 200, story_summary: "Atop the Genetic Spires, the code of life is encoded. Master DNA replication and protein synthesis to decipher its mysteries." },
      { id: 'bio_ch4', name: 'The Ecosystem Enigma', level_hint: "Intermediate", quest: 'Trace the Energy Flow', locked: true, unlock_cost_coins: 130, story_summary: "A blight is causing the ecosystem to collapse. Trace the flow of energy through its trophic levels to find the source of the imbalance." },
      { id: 'bio_ch5', name: 'Human Physiology Peaks', level_hint: "Advanced", quest: 'Navigate the systems of the human body', locked: true, unlock_cost_coins: 190, is_password_unlockable: true, story_summary: "Ascend the treacherous peaks representing human organ systems, solving challenges related to digestion, respiration, circulation, and neural control." },
    ],
    imageUrl: 'https://placehold.co/600x300/1B5E20/FFFFFF.png?text=Biology+Realm',
    dataAiHint: 'enchanted forest creatures'
  },
];

export default function StorySyllabusPage() {
  const { toast } = useToast();
  const [syllabusData, setSyllabusData] = useState<SyllabusRealm[]>(initialSyllabusRealms);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [isProcessingUnlock, setIsProcessingUnlock] = useState(false);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const loadUnlockStatus = async () => {
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
    };
    loadUnlockStatus();
  }, []);

  const refreshUnlockStatus = async () => {
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
  };

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
                        {realm.icon}
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
    
