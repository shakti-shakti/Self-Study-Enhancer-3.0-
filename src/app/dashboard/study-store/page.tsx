
// src/app/dashboard/study-store/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sparkles, Palette, Music, Zap } from 'lucide-react';
import Image from 'next/image';

const storeItems = [
  { id: 'theme_ocean', name: 'Ocean Blue Theme', type: 'Theme', price: 100, icon: <Palette className="h-8 w-8 text-blue-400" />, image: 'https://placehold.co/300x200/E0F7FA/00796B.png?text=Ocean+Theme', dataAiHint: 'ocean waves' },
  { id: 'music_focus', name: 'Focus Beats Pack', type: 'Music', price: 50, icon: <Music className="h-8 w-8 text-purple-400" />, image: 'https://placehold.co/300x200/EDE7F6/5E35B1.png?text=Focus+Music', dataAiHint: 'headphones music' },
  { id: 'avatar_wizard', name: 'Wizard Hat Avatar', type: 'Avatar', price: 75, icon: <Sparkles className="h-8 w-8 text-yellow-400" />, image: 'https://placehold.co/300x200/FFF9C4/FBC02D.png?text=Wizard+Hat', dataAiHint: 'wizard hat' },
  { id: 'booster_ai', name: 'AI Help Token', type: 'Booster', price: 200, icon: <Zap className="h-8 w-8 text-green-400" />, image: 'https://placehold.co/300x200/E8F5E9/388E3C.png?text=AI+Token', dataAiHint: 'brain gears' },
];

export default function StudyStorePage() {
  const userFocusCoins = 500; // Placeholder for actual user coins

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
          <Card key={item.id} className="interactive-card shadow-lg overflow-hidden">
            <CardHeader className="p-0">
              <div className="relative h-40 w-full">
                <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint || 'store item'} />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-center">
              <div className="flex items-center justify-center text-primary mb-2">{item.icon}</div>
              <CardTitle className="text-xl font-semibold glow-text-primary">{item.name}</CardTitle>
              <CardDescription className="text-sm">{item.type}</CardDescription>
              <p className="text-lg font-bold text-accent">{item.price} 🪙</p>
              <Button className="w-full glow-button" onClick={() => alert(`Placeholder: Buy ${item.name}`)}>
                Unlock Item
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-muted-foreground mt-8 text-sm">
        Note: This is a placeholder UI. Purchasing functionality and Focus Coin system to be implemented.
      </p>
    </div>
  );
}
