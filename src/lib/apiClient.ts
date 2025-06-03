
// src/lib/apiClient.ts
// Placeholder API client to simulate backend interactions for the current session.
// In a real application, these functions would make HTTP requests to your Supabase backend.
import { createClient } from './supabase/client'; // Import Supabase client
import type { GeneratedPuzzleLevelContent, PuzzleSubmissionResponse } from './database.types';


// --- DEMO STATE (Used as a fallback IF NOT LOGGED IN or DB operations fail critically) ---
let demoUserCoins = 0;
const demoUnlockedContentIds = new Set<string>();
let demoOwnedItemIds = new Set<string>();
let demoUserXP = 0;
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
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('focus_coins')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for a new profile
        console.error("[apiClient] Error fetching coins from DB:", JSON.stringify(error, null, 2));
        return demoUserCoins; // Fallback to demo on significant error
      }
      return profile?.focus_coins || 0;
    } catch (e) {
      console.error("[apiClient] Exception fetching coins:", JSON.stringify(e, null, 2));
      return demoUserCoins; // Fallback
    }
  }
  return demoUserCoins;
}

export async function updateUserFocusCoins(newAmount: number): Promise<{ success: boolean; newCoinBalance: number, message?: string }> {
  console.log(`[apiClient] updateUserFocusCoins called with newAmount ${newAmount}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const actualNewAmount = Math.max(0, newAmount);

  if (user) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ focus_coins: actualNewAmount, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) {
        console.error("[apiClient] Error updating coins in DB:", JSON.stringify(error, null, 2));
        demoUserCoins = actualNewAmount;
        return { success: false, newCoinBalance: demoUserCoins, message: "DB update failed. Coins updated in demo mode." };
      }
      return { success: true, newCoinBalance: actualNewAmount };
    } catch(e) {
      console.error("[apiClient] Exception updating coins:", JSON.stringify(e, null, 2));
      demoUserCoins = actualNewAmount;
      return { success: false, newCoinBalance: demoUserCoins, message: "DB update exception. Coins updated in demo mode." };
    }
  }
  demoUserCoins = actualNewAmount;
  return { success: true, newCoinBalance: demoUserCoins, message: "Not logged in. Coins updated in demo mode." };
}

export async function fetchUserXP(): Promise<number> {
    console.log('[apiClient] fetchUserXP called');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('xp')
                .eq('id', user.id)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error("[apiClient] Error fetching XP from DB:", JSON.stringify(error, null, 2));
                return demoUserXP;
            }
            return profile?.xp || 0;
        } catch (e) {
            console.error("[apiClient] Exception fetching XP:", JSON.stringify(e, null, 2));
            return demoUserXP;
        }
    }
    return demoUserXP;
}

export async function addUserXP(amount: number): Promise<{ success: boolean; newXP: number, message?: string }> {
    console.log(`[apiClient] addUserXP called with amount ${amount}`);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        try {
            const currentXP = await fetchUserXP(); // This already handles fallback
            const newTotalXP = currentXP + amount;

            const { error } = await supabase
                .from('profiles')
                .update({ xp: newTotalXP, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) {
                console.error("[apiClient] Error updating XP in DB:", JSON.stringify(error, null, 2));
                demoUserXP = newTotalXP; 
                return { success: false, newXP: demoUserXP, message: "DB update failed. XP updated in demo mode." };
            }

            // Check for XP-based achievement
            const { data: profileData } = await supabase.from('profiles').select('unlocked_achievement_ids').eq('id', user.id).single();
            const currentAchievements = new Set(profileData?.unlocked_achievement_ids as string[] || []);
            if (newTotalXP >= 100 && !currentAchievements.has('ach_xp_100')) {
                console.log('[apiClient] Unlocking ach_xp_100 due to XP threshold');
                await unlockAchievement('ach_xp_100'); // This function handles its own demo state
            }
            return { success: true, newXP: newTotalXP };
        } catch (e) {
            console.error("[apiClient] Exception adding XP:", JSON.stringify(e, null, 2));
            demoUserXP += amount; // Update demo state on exception
            return { success: false, newXP: demoUserXP, message: "DB update exception. XP updated in demo mode." };
        }
    }
    demoUserXP += amount;
    return { success: true, newXP: demoUserXP, message: "Not logged in. XP updated in demo mode." };
}


export async function unlockContentWithCoins(
  contentId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] unlockContentWithCoins called for ${contentId} with cost ${cost}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (demoUserCoins >= cost) {
        demoUserCoins -= cost;
        demoUnlockedContentIds.add(contentId);
        return { success: true, newCoinBalance: demoUserCoins, message: "Unlocked in demo mode (not logged in)." };
    }
    return { success: false, message: "User not authenticated and not enough demo coins." };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('focus_coins, owned_content_ids')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("[apiClient] Error fetching profile for unlock:", JSON.stringify(profileError, null, 2));
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
        console.error("[apiClient] Error updating profile for unlock:", JSON.stringify(updateError, null, 2));
        // Fallback to demo mode success if DB fails but logic is sound
        demoUserCoins = newCoinBalance;
        demoUnlockedContentIds.add(contentId);
        return { success: false, newCoinBalance: demoUserCoins, message: "DB update failed. Unlocked in demo mode." };
      }
      return { success: true, newCoinBalance: newCoinBalance, message: `Successfully unlocked! ${cost} coins deducted.` };
    } else {
      return { success: false, message: 'Not enough Focus Coins.' };
    }
  } catch(e) {
    console.error("[apiClient] Exception unlocking with coins:", JSON.stringify(e, null, 2));
    if (demoUserCoins >= cost) {
        demoUserCoins -= cost;
        demoUnlockedContentIds.add(contentId);
        return { success: false, newCoinBalance: demoUserCoins, message: "DB exception. Unlocked in demo mode." };
    }
    return { success: false, message: 'DB exception and not enough demo coins.' };
  }
}


export async function unlockContentWithPassword(
  contentId: string,
  passwordAttempt: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[apiClient] unlockContentWithPassword called for ${contentId}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const DEMO_PASSWORD = 'NEETPREP2025'; // This should ideally be fetched or configurable
  if (passwordAttempt !== DEMO_PASSWORD) {
    return { success: false, message: 'Incorrect password.' };
  }

  if (!user) {
    demoUnlockedContentIds.add(contentId);
    return { success: true, message: "Password correct! Unlocked in demo mode (not logged in)." };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('owned_content_ids')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
        console.error("[apiClient] Error fetching profile for password unlock:", JSON.stringify(profileError, null, 2));
        return { success: false, message: "Failed to fetch user profile." };
    }
    const currentOwnedIds = new Set(profile?.owned_content_ids as string[] || []);
    const newOwnedIds = Array.from(currentOwnedIds.add(contentId));

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ owned_content_ids: newOwnedIds, updated_at: new Date().toISOString() })
        .eq('id', user.id);

    if (updateError) {
        console.error("[apiClient] Error updating profile for password unlock:", JSON.stringify(updateError, null, 2));
        demoUnlockedContentIds.add(contentId);
        return { success: false, message: "DB update failed. Unlocked in demo mode." };
    }
    return { success: true, message: 'Password correct! Content unlocked.' };
  } catch(e) {
    console.error("[apiClient] Exception unlocking with password:", JSON.stringify(e, null, 2));
    demoUnlockedContentIds.add(contentId);
    return { success: false, message: "DB exception. Unlocked in demo mode." };
  }
}


export async function fetchUnlockedContentIds(): Promise<string[]> {
  console.log('[apiClient] fetchUnlockedContentIds called');
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('owned_content_ids')
            .eq('id', user.id)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error("[apiClient] Error fetching unlocked content IDs from DB:", JSON.stringify(error, null, 2));
            return Array.from(demoUnlockedContentIds); // Fallback on error
        }
        return profile?.owned_content_ids as string[] || [];
    } catch(e) {
        console.error("[apiClient] Exception fetching unlocked content IDs:", JSON.stringify(e, null, 2));
        return Array.from(demoUnlockedContentIds); // Fallback on exception
    }
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

  if (!user) {
    if (demoUserCoins >= cost) {
        demoUserCoins -= cost;
        demoOwnedItemIds.add(itemId);
        return { success: true, newCoinBalance: demoUserCoins, message: "Purchased in demo mode (not logged in)." };
    }
    return { success: false, message: "User not authenticated and not enough demo coins." };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('focus_coins, owned_store_items')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("[apiClient] Error fetching profile for purchase:", JSON.stringify(profileError, null, 2));
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
          console.error("[apiClient] Error updating profile after purchase:", JSON.stringify(updateError, null, 2));
          demoUserCoins = newCoinBalance; demoOwnedItemIds.add(itemId);
          return { success: false, newCoinBalance: demoUserCoins, message: "DB update failed. Purchased in demo mode." };
      }
      return { success: true, newCoinBalance: newCoinBalance, message: `Successfully purchased! ${cost} coins deducted.` };
    } else {
      return { success: false, message: 'Not enough Focus Coins.' };
    }
  } catch (e) {
    console.error("[apiClient] Exception purchasing item:", JSON.stringify(e, null, 2));
    if (demoUserCoins >= cost) {
        demoUserCoins -= cost; demoOwnedItemIds.add(itemId);
        return { success: false, newCoinBalance: demoUserCoins, message: "DB exception. Purchased in demo mode." };
    }
    return { success: false, message: 'DB exception and not enough demo coins.' };
  }
}


export async function fetchOwnedItemIds(): Promise<string[]> {
  console.log(`[apiClient] fetchOwnedItemIds called`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('owned_store_items')
            .eq('id', user.id)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error("[apiClient] Error fetching owned item IDs from DB:", JSON.stringify(error, null, 2));
            return Array.from(demoOwnedItemIds);
        }
        return profile?.owned_store_items as string[] || [];
    } catch (e) {
        console.error("[apiClient] Exception fetching owned item IDs:", JSON.stringify(e, null, 2));
        return Array.from(demoOwnedItemIds);
    }
  }
  return Array.from(demoOwnedItemIds);
}


export async function fetchUnlockedAchievements(): Promise<string[]> {
    console.log('[apiClient] fetchUnlockedAchievements called');
     const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('unlocked_achievement_ids')
                .eq('id', user.id)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error("[apiClient] Error fetching unlocked achievements from DB:", JSON.stringify(error, null, 2));
                return Array.from(demoUnlockedAchievementIds);
            }
            return profile?.unlocked_achievement_ids as string[] || [];
        } catch (e) {
            console.error("[apiClient] Exception fetching unlocked achievements:", JSON.stringify(e, null, 2));
            return Array.from(demoUnlockedAchievementIds);
        }
    }
    return Array.from(demoUnlockedAchievementIds);
}


export async function unlockAchievement(achievementId: string): Promise<{ success: boolean, message?: string }> {
    console.log(`[apiClient] unlockAchievement called for ${achievementId}`);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('unlocked_achievement_ids')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                 console.error("[apiClient] Error fetching profile for unlocking achievement:", JSON.stringify(profileError, null, 2));
                return { success: false, message: "DB error fetching profile." };
            }
            const currentUnlockedAchievements = new Set(profile?.unlocked_achievement_ids as string[] || []);
            if (currentUnlockedAchievements.has(achievementId)) {
                console.log(`[apiClient] Achievement ${achievementId} already unlocked.`);
                return { success: true, message: "Already unlocked." };
            }

            currentUnlockedAchievements.add(achievementId);
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ unlocked_achievement_ids: Array.from(currentUnlockedAchievements), updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (updateError) {
                console.error("[apiClient] Error updating achievements in DB:", JSON.stringify(updateError, null, 2));
                demoUnlockedAchievementIds.add(achievementId);
                return { success: false, message: "DB update failed. Unlocked in demo mode." };
            }
            return { success: true, message: "Achievement unlocked!" };
        } catch(e) {
            console.error("[apiClient] Exception unlocking achievement:", JSON.stringify(e, null, 2));
            demoUnlockedAchievementIds.add(achievementId);
            return { success: false, message: "DB exception. Unlocked in demo mode." };
        }
    }
    demoUnlockedAchievementIds.add(achievementId);
    return { success: true, message: "Unlocked in demo mode (not logged in)." };
}


export async function addSpinToHistory(
  rewardName: string,
  rewardType: string,
  rewardValue?: number | string
): Promise<void> {
    console.log(`[apiClient] addSpinToHistory called for ${rewardName}, type ${rewardType}, value ${rewardValue} (demo)`);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
    const newEntry: DemoSpinHistoryEntry = {
      rewardName,
      rewardType,
      rewardValue,
      timestamp: new Date().toISOString(),
    };
    demoSpinHistory.unshift(newEntry); // Add to the beginning
    if (demoSpinHistory.length > 20) { // Keep history size limited
        demoSpinHistory.pop();
    }
}


export async function fetchSpinHistory(): Promise<DemoSpinHistoryEntry[]> {
    console.log('[apiClient] fetchSpinHistory called (demo)');
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
    return [...demoSpinHistory];
}

// Functions for Dynamic Puzzles
export async function fetchPuzzleForLevel(puzzleId: string, level: number): Promise<GeneratedPuzzleLevelContent> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated for fetching puzzle level.");

    // For demo, if Supabase functions are not yet deployed or if user wants to test UI without backend
    // This part can be enhanced later. For now, it will try the function.
    console.warn("[apiClient] fetchPuzzleForLevel is attempting to call a Supabase Edge Function. Ensure 'fetch_puzzle_for_level' is deployed and GEMINI_API_KEY is set in its environment variables.");
    
    const { data, error } = await supabase.functions.invoke('fetch_puzzle_for_level', {
        body: { user_id: user.id, puzzle_id: puzzleId, level },
    });

    if (error) {
        console.error("Error invoking fetch_puzzle_for_level function:", JSON.stringify(error, null, 2));
        throw error;
    }
    if (data.error) {
        console.error("Error from fetch_puzzle_for_level function logic:", JSON.stringify(data.error, null, 2));
        throw new Error(data.error.details || data.error.message || 'Failed to fetch puzzle level content from function.');
    }
    return data as GeneratedPuzzleLevelContent;
}

export async function submitPuzzleSolution(
    puzzleId: string,
    level: number,
    solution: any
): Promise<PuzzleSubmissionResponse> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated for submitting puzzle solution.");

    console.warn("[apiClient] submitPuzzleSolution is attempting to call a Supabase Edge Function. Ensure 'submit_puzzle_solution' is deployed and GEMINI_API_KEY is set in its environment variables.");

    const { data, error } = await supabase.functions.invoke('submit_puzzle_solution', {
        body: { user_id: user.id, puzzle_id: puzzleId, level, solution },
    });
    if (error) {
        console.error("Error invoking submit_puzzle_solution function:", JSON.stringify(error, null, 2));
        throw error;
    }
    if (data.error) {
        console.error("Error from submit_puzzle_solution function logic:", JSON.stringify(data.error, null, 2));
        throw new Error(data.error.details || data.error.message || 'Failed to submit puzzle solution via function.');
    }
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
  // Expose the reset function to the window for easy debugging from the console
  (window as any).resetDemoState = resetDemoApiClientState;
  console.log("Type 'resetDemoState()' in the console to reset local demo API client data (coins, XP, unlocks).");
}
