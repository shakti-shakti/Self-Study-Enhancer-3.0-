
// src/app/dashboard/study-store/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sparkles, Palette, Music, Zap, UserCircle2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const storeItems = [
  { id: 'theme_ocean', name: 'Ocean Blue Theme', type: 'Theme', price: 100, icon: <Palette className="h-8 w-8 text-blue-400" />, image: 'https://placehold.co/300x200/E0F7FA/00796B.png?text=Ocean+Theme', dataAiHint: 'ocean waves' },
  { id: 'music_focus', name: 'Focus Beats Pack', type: 'Music', price: 50, icon: <Music className="h-8 w-8 text-purple-400" />, image: 'https://placehold.co/300x200/EDE7F6/5E35B1.png?text=Focus+Music', dataAiHint: 'headphones music' },
  { id: 'booster_ai_token', name: 'AI Help Token', type: 'Booster', price: 200, icon: <Zap className="h-8 w-8 text-green-400" />, image: 'https://placehold.co/300x200/E8F5E9/388E3C.png?text=AI+Token', dataAiHint: 'brain gears' },
  
  // More Avatar Items
  { id: 'avatar_wizard_hat', name: 'Wizard Hat', type: 'Avatar Accessory', price: 75, icon: <Sparkles className="h-8 w-8 text-yellow-400" />, image: 'https://placehold.co/300x200/FFF9C4/FBC02D.png?text=Wizard+Hat', dataAiHint: 'wizard hat icon' },
  { id: 'avatar_robo_classic', name: 'Classic Robot', type: 'Avatar', price: 150, icon: <UserCircle2 className="h-8 w-8 text-gray-400" />, image: 'https://robohash.org/classic.png?set=set1&size=300x200', dataAiHint: 'robot classic' },
  { id: 'avatar_space_explorer', name: 'Space Explorer', type: 'Avatar', price: 175, icon: <UserCircle2 className="h-8 w-8 text-indigo-400" />, image: 'https://api.dicebear.com/8.x/lorelei/svg?seed=SpaceExplorer&size=150', dataAiHint: 'space astronaut' },
  { id: 'theme_forest', name: 'Forest Green Theme', type: 'Theme', price: 100, icon: <Palette className="h-8 w-8 text-green-500" />, image: 'https://placehold.co/300x200/C8E6C9/2E7D32.png?text=Forest+Theme', dataAiHint: 'forest path' },
  { id: 'avatar_pixel_hero', name: 'Pixel Hero', type: 'Avatar', price: 120, icon: <UserCircle2 className="h-8 w-8 text-orange-400" />, image: 'https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=Hero&size=150', dataAiHint: 'pixel character hero' },
  { id: 'avatar_monster_buddy', name: 'Monster Buddy', type: 'Avatar', price: 160, icon: <UserCircle2 className="h-8 w-8 text-teal-400" />, image: 'https://robohash.org/monsterbuddy.png?set=set2&size=300x200', dataAiHint: 'cute monster' },
  { id: 'avatar_kitten_codey', name: 'Codey the Kitten', type: 'Avatar', price: 180, icon: <UserCircle2 className="h-8 w-8 text-pink-400" />, image: 'https://robohash.org/codeykitten.png?set=set4&size=300x200', dataAiHint: 'coding cat' },
  { id: 'avatar_bot_circuit', name: 'Circuit Bot', type: 'Avatar', price: 155, icon: <UserCircle2 className="h-8 w-8 text-cyan-400" />, image: 'https://api.dicebear.com/8.x/bottts/svg?seed=Circuit&size=150&colors=blue', dataAiHint: 'circuit robot' },
  { id: 'avatar_adventurer_sage', name: 'Sage Adventurer', type: 'Avatar', price: 170, icon: <UserCircle2 className="h-8 w-8 text-lime-400" />, image: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Sage&size=150&skinColor=variant03', dataAiHint: 'wise adventurer' },
  { id: 'avatar_big_smile_sunny', name: 'Sunny Smiler', type: 'Avatar', price: 130, icon: <UserCircle2 className="h-8 w-8 text-yellow-500" />, image: 'https://api.dicebear.com/8.x/big-smile/svg?seed=Sunny&size=150&hairColor=FFC107', dataAiHint: 'happy smiley' },
  { id: 'avatar_rings_cosmic', name: 'Cosmic Rings', type: 'Avatar', price: 190, icon: <UserCircle2 className="h-8 w-8 text-purple-500" />, image: 'https://api.dicebear.com/8.x/rings/svg?seed=Cosmic&size=150&backgroundColor=transparent', dataAiHint: 'abstract rings' },
  { id: 'avatar_initials_pro', name: 'Pro Initials', type: 'Avatar', price: 90, icon: <UserCircle2 className="h-8 w-8 text-gray-600" />, image: 'https://api.dicebear.com/8.x/initials/svg?seed=PRO&size=150&fontWeight=bold&backgroundColor=primary', dataAiHint: 'professional initials' },
  { id: 'avatar_openpeep_artist', name: 'Artist Peep', type: 'Avatar', price: 140, icon: <UserCircle2 className="h-8 w-8 text-red-400" />, image: 'https://api.dicebear.com/8.x/open-peeps/svg?seed=Artist&size=150&accessories=variant02', dataAiHint: 'artist character' },
];

export default function StudyStorePage() {
  const userFocusCoins = 500; // Placeholder for actual user coins
  const { toast } = useToast();

  const handlePurchase = (itemName: string, price: number) => {
    // Conceptual: In a real app, check if user has enough coins, deduct coins, add item to inventory
    toast({
      title: 'Purchase Attempted (Conceptual)',
      description: `You tried to buy ${itemName} for ${price} Focus Coins. This feature is not yet fully implemented.`,
      className: 'bg-primary/10 border-primary text-primary-foreground',
    });
  };

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <ShoppingCart className="mr-4 h-10 w-10" /> Study Store
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Spend your hard-earned Focus Coins on cool themes, avatar items, and study boosters!
        </p>
        <p className="text-xl font-semibold text-accent mt-2">Your Focus Coins: {userFocusCoins} 🪙</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {storeItems.map(item => (
          <Card key={item.id} className="interactive-card shadow-lg overflow-hidden flex flex-col">
            <CardHeader className="p-0">
              <div className="relative h-40 w-full">
                <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint || 'store item'} />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-center flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center text-primary mb-2">{item.icon}</div>
                <CardTitle className="text-xl font-semibold glow-text-primary">{item.name}</CardTitle>
                <CardDescription className="text-sm">{item.type}</CardDescription>
                <p className="text-lg font-bold text-accent mt-1">{item.price} 🪙</p>
              </div>
              <Button className="w-full glow-button mt-3" onClick={() => handlePurchase(item.name, item.price)}>
                Unlock Item
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-12 max-w-2xl mx-auto interactive-card p-6 shadow-xl shadow-secondary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-headline glow-text-secondary flex items-center">
            <Sparkles className="mr-2" /> How Focus Coins Work 🪙
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-muted-foreground">
          <p><strong>Earning Focus Coins:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Excel in quizzes: Higher scores can yield more coins!</li>
            <li>Complete daily and weekly challenges from the "Challenges" page.</li>
            <li>Maintain study streaks (future feature).</li>
            <li>Spin the Rewards Wheel daily for a chance to win coins.</li>
            <li>Engage actively with AI features like the AI Study Assistant and Smart Notes Generator (future reward integration).</li>
            <li>Participate in Study Rooms and contribute positively (future reward integration).</li>
          </ul>
          <p className="mt-3"><strong>Spending Focus Coins:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Unlock exclusive app themes to personalize your study environment.</li>
            <li>Get unique avatars and avatar accessories to customize your profile.</li>
            <li>Purchase study boosters like extra AI help tokens or quiz hints (future feature).</li>
            <li>Unlock special game modes or items in the Games Arcade (future feature).</li>
          </ul>
          <p className="mt-4 text-xs">
            <AlertTriangle className="inline h-4 w-4 mr-1 text-yellow-500" />
            Focus Coin system (earning and spending) is currently conceptual. The features listed describe potential ways the system could work once fully implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
