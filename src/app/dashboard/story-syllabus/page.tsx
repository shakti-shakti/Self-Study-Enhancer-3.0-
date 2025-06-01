
// src/app/dashboard/story-syllabus/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Compass, ScrollText, BookOpen, Zap, Atom, Leaf, PawPrint, ChevronRight, Lock, Coins, KeyRound } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface Chapter {
  id: string;
  name: string;
  quest: string;
  locked: boolean;
  unlock_cost_coins?: number | null;
  unlock_by_password_possible?: boolean | null; // Conceptual
  story_summary?: string; // Placeholder for actual story content
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

const syllabusRealms: SyllabusRealm[] = [
  { 
    id: 'physics_realm', 
    name: 'The Realm of Motion & Energy', 
    subject: 'Physics', 
    icon: <Zap className="h-10 w-10 text-yellow-400" />, 
    description: "Unravel the fundamental forces that govern the cosmos. From the smallest particles to the grandest galaxies, master the laws of motion, energy, and light.",
    chapters: [
      { id: 'phy_ch1', name: 'The Oracle of Kinematics', quest: 'Chart the Path of Falling Stars', locked: false, story_summary: "Ancient scrolls speak of a celestial event where stars fall. Your quest is to predict their trajectory using the laws of kinematics before they impact the Chronos Temple." },
      { id: 'phy_ch2', name: 'The Labyrinth of Forces', quest: 'Balance the Scales of Newton', locked: false, story_summary: "A mystical labyrinth shifts its walls based on unbalanced forces. Master Newton's Laws to navigate its treacherous paths and find the Amulet of Equilibrium." },
      { id: 'phy_ch3', name: 'The Sunstone of Power', quest: 'Harness the Work-Energy Theorem', locked: true, unlock_cost_coins: 100, story_summary: "The legendary Sunstone can power the entire realm, but its energy is chaotic. Apply the Work-Energy Theorem to channel its power safely." },
      { id: 'phy_ch4', name: 'Graviton\'s Peak', quest: 'Ascend to the Summit of Gravity', locked: true, unlock_cost_coins: 150, unlock_by_password_possible: true, story_summary: "Only by understanding the nuances of gravitational fields can one hope to reach the summit of Graviton's Peak, where the Sage of Universal Laws resides." },
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
      { id: 'chem_ch1', name: 'The Scroll of Basic Concepts', quest: 'Decipher the Mole Molar Mass', locked: false, story_summary: "An ancient scroll, written in the language of moles and molar masses, holds the key to understanding the basic building blocks of the Alchemist's world." },
      { id: 'chem_ch2', name: 'The Atomic Sanctuary', quest: 'Visualize the Quantum Orbits', locked: true, unlock_cost_coins: 120, story_summary: "Within the Atomic Sanctuary, spirits of electrons dance in quantum orbitals. Map their paths to unlock the sanctuary's secrets." },
      { id: 'chem_ch3', name: 'Bonding Bay', quest: 'Forge the Covalent Chains', locked: true, unlock_cost_coins: 120, unlock_by_password_possible: true, story_summary: "The islands of Bonding Bay are connected by weak bridges. Forge strong covalent chains to create stable pathways between them." },
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
      { id: 'bio_ch1', name: 'The Seed of Diversity', quest: 'Classify the Kingdoms of Life', locked: true, unlock_cost_coins: 80, story_summary: "The Seed of Diversity is fracturing, and life forms are mixing chaotically. Restore order by correctly classifying them into their respective kingdoms." },
      { id: 'bio_ch2', name: 'Cellular Citadel', quest: 'Defend the Organelles', locked: true, unlock_cost_coins: 100, unlock_by_password_possible: true, story_summary: "The Cellular Citadel is under attack by rogue phages! Understand the function of each organelle to mount a successful defense." },
      { id: 'bio_ch3', name: 'The Genetic Spires', quest: 'Unravel the Double Helix', locked: true, unlock_cost_coins: 200, story_summary: "Atop the Genetic Spires, the code of life is encoded. Master DNA replication and protein synthesis to decipher its mysteries." },
    ],
    imageUrl: 'https://placehold.co/600x300/1B5E20/FFFFFF.png?text=Biology+Realm',
    dataAiHint: 'enchanted forest creatures'
  },
];

export default function StorySyllabusPage() {
  const { toast } = useToast();

  const handleUnlockWithCoins = (realmName: string, chapterName: string, cost: number) => {
    toast({
      title: "Conceptual Unlock",
      description: `Attempted to unlock "${chapterName}" in ${realmName} with ${cost} coins. (Feature not fully implemented)`,
      className: 'bg-primary/10 border-primary text-primary-foreground'
    });
  };

  const handleUnlockWithPassword = (realmName: string, chapterName: string) => {
     toast({
      title: "Conceptual Unlock",
      description: `Attempted to unlock "${chapterName}" in ${realmName} with a password. (Feature not fully implemented)`,
      className: 'bg-accent/10 border-accent text-accent-foreground'
    });
  };

  const beginQuest = (realmName: string, chapterName: string, storySummary?: string) => {
    alert(`Begin Quest: ${chapterName} in ${realmName}\n\nStory: ${storySummary || "The adventure begins..."}\n\n(Full quest gameplay to be implemented)`);
  };

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
        {syllabusRealms.map(realm => (
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
                                onClick={() => handleUnlockWithCoins(realm.name, chapter.name, chapter.unlock_cost_coins!)}
                            >
                              <Coins className="mr-1 h-4 w-4"/> Unlock with {chapter.unlock_cost_coins} Coins (Demo)
                            </Button>
                          )}
                          {chapter.unlock_by_password_possible && (
                             <Button 
                                size="sm" 
                                className="w-full glow-button" 
                                variant="outline"
                                onClick={() => handleUnlockWithPassword(realm.name, chapter.name)}
                            >
                              <KeyRound className="mr-1 h-4 w-4"/> Unlock with Password (Demo)
                            </Button>
                          )}
                           {!chapter.unlock_cost_coins && !chapter.unlock_by_password_possible && (
                             <Button size="sm" className="w-full" disabled>
                                <Lock className="mr-1 h-4 w-4"/> Locked (Story Progression)
                            </Button>
                           )}
                        </>
                      ) : (
                        <Button 
                            size="sm" 
                            className="w-full glow-button" 
                            onClick={() => beginQuest(realm.name, chapter.name, chapter.story_summary)}
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
        Note: This is a conceptual UI. Story content, quest interactions, coin system, and unlocking logic need full implementation.
      </p>
    </div>
  );
}
