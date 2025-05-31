
// src/app/dashboard/story-syllabus/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Compass, ScrollText, BookOpen, Zap, Atom, Leaf, PawPrint, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const syllabusRealms = [
  { 
    id: 'physics_realm', 
    name: 'The Realm of Motion & Energy', 
    subject: 'Physics', 
    icon: <Zap className="h-10 w-10 text-yellow-400" />, 
    description: "Unravel the fundamental forces that govern the cosmos. From the smallest particles to the grandest galaxies, master the laws of motion, energy, and light.",
    chapters: [
      { id: 'phy_ch1', name: 'Chapter 1: The Oracle of Kinematics', unlocked: true, quest: 'Chart the Path of Falling Stars' },
      { id: 'phy_ch2', name: 'Chapter 2: The Labyrinth of Forces', unlocked: true, quest: 'Balance the Scales of Newton' },
      { id: 'phy_ch3', name: 'Chapter 3: The Sunstone of Power', unlocked: false, quest: 'Harness the Work-Energy Theorem' },
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
      { id: 'chem_ch1', name: 'Chapter 1: The Scroll of Basic Concepts', unlocked: true, quest: 'Decipher the Mole Molar Mass' },
      { id: 'chem_ch2', name: 'Chapter 2: The Atomic Sanctuary', unlocked: false, quest: 'Visualize the Quantum Orbits' },
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
      { id: 'bio_ch1', name: 'Chapter 1: The Seed of Diversity', unlocked: false, quest: 'Classify the Kingdoms of Life' },
    ],
    imageUrl: 'https://placehold.co/600x300/1B5E20/FFFFFF.png?text=Biology+Realm',
    dataAiHint: 'enchanted forest creatures'
  },
];

export default function StorySyllabusPage() {
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
                  <Card key={chapter.id} className={`p-4 border-2 ${chapter.unlocked ? 'border-primary/50 bg-primary/10 hover:shadow-primary/30' : 'border-muted/30 bg-muted/20 opacity-70'}`}>
                    <CardTitle className="text-lg font-semibold flex items-center">
                        <ScrollText className={`mr-2 h-5 w-5 ${chapter.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                        {chapter.name}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">{chapter.quest}</CardDescription>
                    <Button 
                        size="sm" 
                        className={`w-full mt-3 ${chapter.unlocked ? 'glow-button' : ''}`} 
                        disabled={!chapter.unlocked}
                        onClick={() => alert(`Placeholder: Begin quest for ${chapter.name}`)}
                    >
                      {chapter.unlocked ? 'Begin Quest' : 'Locked'} <ChevronRight className="ml-1 h-4 w-4"/>
                    </Button>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
       <p className="text-center text-muted-foreground mt-8 text-sm">
        Note: This is a placeholder UI. Chapter unlocking, quest interactions, and syllabus progression to be implemented.
      </p>
    </div>
  );
}

