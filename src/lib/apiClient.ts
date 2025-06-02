
// src/lib/apiClient.ts
// Placeholder API client to simulate backend interactions for the current session.
// In a real application, these functions would make HTTP requests to your Supabase backend.
import { createClient } from './supabase/client'; // Import Supabase client
import type { GeneratedPuzzleLevelContent, PuzzleSubmissionResponse } from './database.types';


// --- DEMO STATE (Used as a fallback IF NOT LOGGED IN or DB operations fail critically) ---
let demoUserCoins = 0; // Initialized to 0
const demoUnlockedContentIds = new Set<string>();
let demoOwnedItemIds = new Set<string>(); // Generic for store items
let demoUserXP = 0; // Initialized to 0
const demoUnlockedAchievementIds = new Set<string>();

interface DemoSpinHistoryEntry {
  rewardName: string;
  rewardType: string;
  rewardValue?: number | string;
  timestamp: string;
}
let demoSpinHistory: DemoSpinHistoryEntry[] = [];

// --- API Functions ---

export async function fetchUserFocusCoins(): Promise<number> {
  console.log('[apiClient] fetchUserFocusCoins called');
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('focus_coins')
      .eq('id', user.id)
      .single();
    if (error) {
      console.error("[apiClient] Error fetching coins from DB:", error);
      return 0;
    }
    return profile?.focus_coins || 0;
  }
  return demoUserCoins;
}

export async function updateUserFocusCoins(newAmount: number): Promise<{ success: boolean; newCoinBalance: number }> {
  console.log(`[apiClient] updateUserFocusCoins called with newAmount ${newAmount}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const actualNewAmount = Math.max(0, newAmount);

  if (user) {
    const { error } = await supabase
      .from('profiles')
      .update({ focus_coins: actualNewAmount, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      console.error("[apiClient] Error updating coins in DB:", error);
      demoUserCoins = actualNewAmount; // Fallback to update demo state on error
      return { success: false, newCoinBalance: demoUserCoins };
    }
    return { success: true, newCoinBalance: actualNewAmount };
  }
  demoUserCoins = actualNewAmount;
  return { success: true, newCoinBalance: demoUserCoins };
}

export async function fetchUserXP(): Promise<number> {
    console.log('[apiClient] fetchUserXP called');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('xp')
            .eq('id', user.id)
            .single();
        if (error) {
            console.error("[apiClient] Error fetching XP from DB:", error);
            return 0;
        }
        return profile?.xp || 0;
    }
    return demoUserXP;
}

export async function addUserXP(amount: number): Promise<{ success: boolean; newXP: number }> {
    console.log(`[apiClient] addUserXP called with amount ${amount}`);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const currentXP = await fetchUserXP();
        const newTotalXP = currentXP + amount;

        const { error } = await supabase
            .from('profiles')
            .update({ xp: newTotalXP, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (error) {
            console.error("[apiClient] Error updating XP in DB:", error);
            demoUserXP = newTotalXP; // Fallback
            return { success: false, newXP: currentXP };
        }

        if (newTotalXP >= 100 && !demoUnlockedAchievementIds.has('ach_xp_100')) {
            console.log('[apiClient] Unlocking ach_xp_100 due to XP threshold');
            await unlockAchievement('ach_xp_100');
        }
        return { success: true, newXP: newTotalXP };
    }
    demoUserXP += amount;
    return { success: true, newXP: demoUserXP };
}


export async function unlockContentWithCoins(
  contentId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] unlockContentWithCoins called for ${contentId} with cost ${cost}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "User not authenticated." };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('focus_coins, owned_content_ids')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("[apiClient] Error fetching profile for unlock:", profileError);
    return { success: false, message: "Failed to fetch user profile." };
  }

  const currentCoins = profile?.focus_coins || 0;
  const currentOwnedIds = new Set(profile?.owned_content_ids as string[] || []);


  if (currentOwnedIds.has(contentId)) {
    return { success: true, newCoinBalance: currentCoins, message: "Content already unlocked." };
  }

  if (currentCoins >= cost) {
    const newCoinBalance = currentCoins - cost;
    const newOwnedIds = Array.from(currentOwnedIds.add(contentId));

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ focus_coins: newCoinBalance, owned_content_ids: newOwnedIds, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error("[apiClient] Error updating profile for unlock:", updateError);
      return { success: false, message: "Failed to update profile after deducting coins." };
    }
    return { success: true, newCoinBalance: newCoinBalance, message: `Successfully unlocked! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}


export async function unlockContentWithPassword(
  contentId: string,
  passwordAttempt: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[apiClient] unlockContentWithPassword called for ${contentId}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "User not authenticated." };

  const DEMO_PASSWORD = 'NEETPREP2025';
  if (passwordAttempt === DEMO_PASSWORD) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('owned_content_ids')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error("[apiClient] Error fetching profile for password unlock:", profileError);
        return { success: false, message: "Failed to fetch user profile." };
    }
    const currentOwnedIds = new Set(profile?.owned_content_ids as string[] || []);
    const newOwnedIds = Array.from(currentOwnedIds.add(contentId));

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ owned_content_ids: newOwnedIds, updated_at: new Date().toISOString() })
        .eq('id', user.id);

    if (updateError) {
        console.error("[apiClient] Error updating profile for password unlock:", updateError);
        return { success: false, message: "Failed to save unlock status." };
    }
    return { success: true, message: 'Password correct! Content unlocked.' };
  } else {
    return { success: false, message: 'Incorrect password.' };
  }
}


export async function fetchUnlockedContentIds(): Promise<string[]> {
  console.log('[apiClient] fetchUnlockedContentIds called');
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('owned_content_ids')
        .eq('id', user.id)
        .single();
    if (error) {
        console.error("[apiClient] Error fetching unlocked content IDs from DB:", error);
        return [];
    }
    return profile?.owned_content_ids as string[] || [];
  }
  return Array.from(demoUnlockedContentIds);
}


export async function purchaseStoreItem(
  itemId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] purchaseStoreItem called for ${itemId} with cost ${cost}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "User not authenticated for purchase." };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('focus_coins, owned_store_items')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("[apiClient] Error fetching profile for purchase:", profileError);
    return { success: false, message: "Failed to fetch user profile for purchase." };
  }

  const currentCoins = profile?.focus_coins || 0;
  const currentOwnedItems = new Set(profile?.owned_store_items as string[] || []);

  if (currentOwnedItems.has(itemId)) {
      return { success: true, newCoinBalance: currentCoins, message: "Item already owned." };
  }
  if (currentCoins >= cost) {
    const newCoinBalance = currentCoins - cost;
    const newOwnedItems = Array.from(currentOwnedItems.add(itemId));

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ focus_coins: newCoinBalance, owned_store_items: newOwnedItems, updated_at: new Date().toISOString() })
        .eq('id', user.id);

    if (updateError) {
        console.error("[apiClient] Error updating profile after purchase:", updateError);
        return { success: false, message: "Failed to update profile after purchase." };
    }
    return { success: true, newCoinBalance: newCoinBalance, message: `Successfully purchased! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}


export async function fetchOwnedItemIds(): Promise<string[]> {
  console.log(`[apiClient] fetchOwnedItemIds called`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('owned_store_items')
        .eq('id', user.id)
        .single();
    if (error) {
        console.error("[apiClient] Error fetching owned item IDs from DB:", error);
        return [];
    }
    return profile?.owned_store_items as string[] || [];
  }
  return Array.from(demoOwnedItemIds);
}


export async function fetchUnlockedAchievements(): Promise<string[]> {
    console.log('[apiClient] fetchUnlockedAchievements called');
     const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('unlocked_achievement_ids')
            .eq('id', user.id)
            .single();
        if (error) {
            console.error("[apiClient] Error fetching unlocked achievements from DB:", error);
            return [];
        }
        return profile?.unlocked_achievement_ids as string[] || [];
    }
    return Array.from(demoUnlockedAchievementIds);
}


export async function unlockAchievement(achievementId: string): Promise<{ success: boolean }> {
    console.log(`[apiClient] unlockAchievement called for ${achievementId}`);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('unlocked_achievement_ids')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
             console.error("[apiClient] Error fetching profile for unlocking achievement:", profileError);
            return { success: false };
        }
        const currentUnlockedAchievements = new Set(profile?.unlocked_achievement_ids as string[] || []);
        if (currentUnlockedAchievements.has(achievementId)) {
            console.log(`[apiClient] Achievement ${achievementId} already unlocked.`);
            return { success: true };
        }

        currentUnlockedAchievements.add(achievementId);
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ unlocked_achievement_ids: Array.from(currentUnlockedAchievements), updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (updateError) {
            console.error("[apiClient] Error updating achievements in DB:", updateError);
            return { success: false };
        }
        return { success: true };
    }
    demoUnlockedAchievementIds.add(achievementId);
    return { success: true };
}


export async function addSpinToHistory(
  rewardName: string,
  rewardType: string,
  rewardValue?: number | string
): Promise<void> {
    console.log(`[apiClient] addSpinToHistory called for ${rewardName}, type ${rewardType}, value ${rewardValue} (demo)`);
    await new Promise(resolve => setTimeout(resolve, 50));
    const newEntry: DemoSpinHistoryEntry = {
      rewardName,
      rewardType,
      rewardValue,
      timestamp: new Date().toISOString(),
    };
    demoSpinHistory.unshift(newEntry);
    if (demoSpinHistory.length > 20) {
        demoSpinHistory.pop();
    }
}


export async function fetchSpinHistory(): Promise<DemoSpinHistoryEntry[]> {
    console.log('[apiClient] fetchSpinHistory called (demo)');
    await new Promise(resolve => setTimeout(resolve, 50));
    return [...demoSpinHistory];
}

// Functions for Dynamic Puzzles
export async function fetchPuzzleForLevel(puzzleId: string, level: number): Promise<GeneratedPuzzleLevelContent> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.functions.invoke('fetch_puzzle_for_level', {
        body: { user_id: user.id, puzzle_id: puzzleId, level },
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error.details || data.error.message || 'Failed to fetch puzzle level content from function.');
    return data as GeneratedPuzzleLevelContent;
}

export async function submitPuzzleSolution(
    puzzleId: string,
    level: number,
    solution: any
): Promise<PuzzleSubmissionResponse> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase.functions.invoke('submit_puzzle_solution', {
        body: { user_id: user.id, puzzle_id: puzzleId, level, solution },
    });
    if (error) throw error;
    if (data.error) throw new Error(data.error.details || data.error.message || 'Failed to submit puzzle solution via function.');
    return data as PuzzleSubmissionResponse;
}


export function resetDemoApiClientState() {
  demoUserCoins = 0;
  demoUnlockedContentIds.clear();
  demoOwnedItemIds.clear();
  demoUserXP = 0;
  demoUnlockedAchievementIds.clear();
  demoSpinHistory = [];
  console.log('[apiClient] Demo state has been reset to initial values (0 coins, 0 XP).');
}

if (typeof window !== 'undefined') {
  (window as any).resetDemoState = resetDemoApiClientState;
}
