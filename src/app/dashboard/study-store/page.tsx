
// src/app/dashboard/study-store/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Sparkles, Palette, Music, Zap, UserCircle2, AlertTriangle, Coins, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import * as apiClient from '@/lib/apiClient'; 
import { createClient } from '@/lib/supabase/client';
import type { TablesUpdate } from '@/lib/database.types';

const storeItems = [
  { id: 'theme_ocean', name: 'Ocean Blue Theme', type: 'Theme', price: 100, icon: <Palette className="h-8 w-8 text-blue-400" />, image: 'https://placehold.co/300x200/E0F7FA/00796B.png?text=Ocean+Theme', dataAiHint: 'ocean waves', item_payload: { theme: 'ocean_blue_theme_config' } }, 
  { id: 'music_focus', name: 'Focus Beats Pack', type: 'Music', price: 50, icon: <Music className="h-8 w-8 text-purple-400" />, image: 'https://placehold.co/300x200/EDE7F6/5E35B1.png?text=Focus+Music', dataAiHint: 'headphones music', item_payload: { playlist_id: 'spotify:playlist:focus_beats' } },
  { id: 'booster_ai_token', name: 'AI Help Token', type: 'Booster', price: 200, icon: <Zap className="h-8 w-8 text-green-400" />, image: 'https://placehold.co/300x200/E8F5E9/388E3C.png?text=AI+Token', dataAiHint: 'brain gears', item_payload: { token_type: 'ai_help', count: 1 } },
  
  { id: 'avatar_wizard_hat', name: 'Wizard Hat', type: 'Avatar Accessory', price: 75, icon: <Sparkles className="h-8 w-8 text-yellow-400" />, image: 'https://placehold.co/300x200/FFF9C4/FBC02D.png?text=Wizard+Hat', dataAiHint: 'wizard hat icon', item_payload: { accessory_id: 'wizard_hat_01' } },
  { id: 'avatar_robo_classic', name: 'Classic Robot', type: 'Avatar', price: 150, icon: <UserCircle2 className="h-8 w-8 text-gray-400" />, image: 'https://robohash.org/classic.png?set=set1&size=300x200', dataAiHint: 'robot classic', item_payload: { avatar_url: 'https://robohash.org/classic.png?set=set1&size=150x150' } },
  { id: 'avatar_space_explorer', name: 'Space Explorer', type: 'Avatar', price: 175, icon: <UserCircle2 className="h-8 w-8 text-indigo-400" />, image: 'https://api.dicebear.com/8.x/lorelei/svg?seed=SpaceExplorer&size=150', dataAiHint: 'space astronaut', item_payload: { avatar_url: 'https://api.dicebear.com/8.x/lorelei/svg?seed=SpaceExplorer&size=150' } },
  { id: 'theme_forest', name: 'Forest Green Theme', type: 'Theme', price: 100, icon: <Palette className="h-8 w-8 text-green-500" />, image: 'https://placehold.co/300x200/C8E6C9/2E7D32.png?text=Forest+Theme', dataAiHint: 'forest path', item_payload: { theme: 'forest_green_theme_config' } },
  { id: 'avatar_pixel_hero', name: 'Pixel Hero', type: 'Avatar', price: 120, icon: <UserCircle2 className="h-8 w-8 text-orange-400" />, image: 'https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=Hero&size=150', dataAiHint: 'pixel character hero', item_payload: { avatar_url: 'https://api.dicebear.com/8.x/pixel-art-neutral/svg?seed=Hero&size=150' } },
  { id: 'avatar_monster_buddy', name: 'Monster Buddy', type: 'Avatar', price: 160, icon: <UserCircle2 className="h-8 w-8 text-teal-400" />, image: 'https://robohash.org/monsterbuddy.png?set=set2&size=300x200', dataAiHint: 'cute monster', item_payload: { avatar_url: 'https://robohash.org/monsterbuddy.png?set=set2&size=150x150' } },
  { id: 'avatar_kitten_codey', name: 'Codey the Kitten', type: 'Avatar', price: 180, icon: <UserCircle2 className="h-8 w-8 text-pink-400" />, image: 'https://robohash.org/codeykitten.png?set=set4&size=300x200', dataAiHint: 'coding cat', item_payload: { avatar_url: 'https://robohash.org/codeykitten.png?set=set4&size=150x150' } },
];

export default function StudyStorePage() {
  const { toast } = useToast();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentFocusCoins, setCurrentFocusCoins] = useState(0);
  const [ownedItemIds, setOwnedItemIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState<string | null>(null);

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

  useEffect(() => {
    const loadInitialData = async () => {
      if (!userId) {
        setIsLoading(false); 
        return;
      }
      setIsLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('focus_coins, owned_store_items')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;
        
        setCurrentFocusCoins(profile?.focus_coins || 0);
        setOwnedItemIds(new Set(profile?.owned_store_items as string[] || []));
      } catch (error: any) {
          console.error("Error loading store data:", error);
          toast({variant: 'destructive', title: 'Error loading data', description: error.message});
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) {
        loadInitialData();
    } else {
        setCurrentFocusCoins(0); 
        setOwnedItemIds(new Set());
        setIsLoading(false);
    }
  }, [userId, supabase, toast]);


  const handlePurchase = async (item: typeof storeItems[0]) => {
    if (!userId) {
        toast({variant: "destructive", title: "Not Logged In", description: "You must be logged in to make purchases."});
        return;
    }
    setIsProcessingPurchase(item.id);
    
    try {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('focus_coins, owned_store_items')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;
        if (!profileData) throw new Error("User profile not found.");

        const currentCoins = profileData.focus_coins || 0;
        const currentOwnedItems = new Set(profileData.owned_store_items as string[] || []);

        if (currentOwnedItems.has(item.id)) {
            toast({ title: "Already Owned", description: `You already own ${item.name}.` });
            setIsProcessingPurchase(null);
            return;
        }

        if (currentCoins < item.price) {
            toast({ variant: 'destructive', title: 'Purchase Failed', description: 'Not enough Focus Coins.' });
            setIsProcessingPurchase(null);
            return;
        }

        const newCoinBalance = currentCoins - item.price;
        const newOwnedItems = Array.from(currentOwnedItems.add(item.id));

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ focus_coins: newCoinBalance, owned_store_items: newOwnedItems, updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (updateError) throw updateError;

        setCurrentFocusCoins(newCoinBalance);
        setOwnedItemIds(new Set(newOwnedItems));
        
        toast({
            title: 'Purchase Successful!',
            description: `You've unlocked ${item.name}! ${item.price} coins deducted.`,
            className: 'bg-primary/10 border-primary text-primary-foreground',
        });

    } catch (error: any) {
        console.error("Error purchasing item:", error);
        toast({ variant: 'destructive', title: 'Purchase Failed', description: error.message || `Could not purchase ${item.name}.` });
    } finally {
        setIsProcessingPurchase(null);
    }
  };
  
  const handleApplyAvatar = async (avatarUrl: string) => {
    if (!userId || !avatarUrl) return;
    setIsProcessingPurchase(`apply-${avatarUrl}`);

    try {
        const updateData: TablesUpdate<'profiles'> = { avatar_url: avatarUrl, updated_at: new Date().toISOString() };
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);
        if (profileUpdateError) throw profileUpdateError;
        
        const { error: authUpdateError } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
        if (authUpdateError) {
            console.warn("Error updating auth user metadata for avatar:", authUpdateError.message);
        }

        toast({ title: 'Avatar Applied!', description: 'Your profile picture has been updated. Refresh may be needed to see changes everywhere.', className: 'bg-green-500/10 border-green-400 text-green-300' });
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error Applying Avatar', description: error.message });
    } finally {
        setIsProcessingPurchase(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-10 pb-16 md:pb-0">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <ShoppingCart className="mr-4 h-10 w-10" /> Study Store
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Spend your hard-earned Focus Coins on cool themes, avatar items, and study boosters!
        </p>
        <p className="text-xl font-semibold text-accent mt-2">Your Focus Coins: {currentFocusCoins} 🪙</p>
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
              <div className="space-y-2">
                <Button 
                  className="w-full glow-button mt-3" 
                  onClick={() => handlePurchase(item)}
                  disabled={isProcessingPurchase === item.id || ownedItemIds.has(item.id) || currentFocusCoins < item.price}
                >
                  {isProcessingPurchase === item.id ? <Loader2 className="h-5 w-5 animate-spin"/> : 
                   ownedItemIds.has(item.id) ? 'Owned' : 
                   currentFocusCoins < item.price ? 'Not Enough Coins' : 'Unlock Item'}
                </Button>
                {ownedItemIds.has(item.id) && item.type === 'Avatar' && item.item_payload?.avatar_url && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full glow-button border-green-500 text-green-500 hover:bg-green-500/10"
                        onClick={() => handleApplyAvatar(item.item_payload.avatar_url!)}
                        disabled={isProcessingPurchase === `apply-${item.item_payload.avatar_url}`}
                    >
                         {isProcessingPurchase === `apply-${item.item_payload.avatar_url}` ? <Loader2 className="h-4 w-4 animate-spin mr-1"/> : <CheckCircle className="mr-1 h-4 w-4"/>}
                        Apply Avatar
                    </Button>
                )}
              </div>
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
            <li>Spin the Rewards Wheel daily.</li>
            <li>Win games in the Games Arcade.</li>
            <li>Engage actively with AI features.</li>
          </ul>
          <p className="mt-3"><strong>Spending Focus Coins:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Unlock exclusive app themes.</li>
            <li>Get unique avatars and accessories.</li>
            <li>Purchase study boosters like AI help tokens.</li>
            <li>Unlock premium content in Story Syllabus or Puzzles.</li>
          </ul>
          <p className="mt-4 text-xs">
            <AlertTriangle className="inline h-4 w-4 mr-1 text-yellow-500" />
            Focus Coins and XP are now being tracked in your profile. More ways to earn and spend will be added!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    