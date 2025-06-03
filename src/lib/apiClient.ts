
// src/lib/apiClient.ts
import { createClient } from './supabase/client';
import type { Database, TablesInsert, GeneratedPuzzleLevelContent, PuzzleSubmissionResponse, PuzzleTableRow, UserPuzzleProgressRow } from './database.types'; // Added PuzzleTableRow and UserPuzzleProgressRow

interface DemoSpinHistoryEntry {
  rewardName: string;
  rewardType: string;
  rewardValue?: number | string;
  timestamp: string;
}

// --- API Functions ---

export async function fetchUserFocusCoins(): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('focus_coins')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error("[apiClient] Error fetching coins from DB:", JSON.stringify(error, null, 2));
        return 0; // Fallback on error
      }
      return profile?.focus_coins || 0;
    } catch (e) {
      console.error("[apiClient] Exception fetching coins:", JSON.stringify(e, null, 2));
      return 0; // Fallback
    }
  }
  return 0; // Not logged in
}

export async function updateUserFocusCoins(newAmount: number): Promise<{ success: boolean; newCoinBalance: number, message?: string }> {
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
        return { success: false, newCoinBalance: actualNewAmount, message: `DB update failed: ${error.message}` };
      }
      return { success: true, newCoinBalance: actualNewAmount };
    } catch(e: any) {
      console.error("[apiClient] Exception updating coins:", JSON.stringify(e, null, 2));
      return { success: false, newCoinBalance: actualNewAmount, message: `DB update exception: ${e.message}` };
    }
  }
  return { success: false, newCoinBalance: actualNewAmount, message: "User not authenticated." };
}

export async function fetchUserXP(): Promise<number> {
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
                return 0;
            }
            return profile?.xp || 0;
        } catch (e) {
            console.error("[apiClient] Exception fetching XP:", JSON.stringify(e, null, 2));
            return 0;
        }
    }
    return 0;
}

export async function addUserXP(amount: number): Promise<{ success: boolean; newXP: number, message?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        try {
            const currentXP = await fetchUserXP();
            const newTotalXP = currentXP + amount;

            const { error } = await supabase
                .from('profiles')
                .update({ xp: newTotalXP, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) {
                console.error("[apiClient] Error updating XP in DB:", JSON.stringify(error, null, 2));
                return { success: false, newXP: newTotalXP, message: `DB update failed: ${error.message}` };
            }
            // Check for XP-based achievement
            const { data: profileData } = await supabase.from('profiles').select('unlocked_achievement_ids').eq('id', user.id).single();
            const currentAchievements = new Set(profileData?.unlocked_achievement_ids as string[] || []);
            if (newTotalXP >= 100 && !currentAchievements.has('ach_xp_100')) {
                await unlockAchievement('ach_xp_100');
            }
            return { success: true, newXP: newTotalXP };
        } catch (e: any) {
            console.error("[apiClient] Exception adding XP:", JSON.stringify(e, null, 2));
            return { success: false, newXP: (await fetchUserXP()) + amount, message: `DB update exception: ${e.message}` };
        }
    }
    return { success: false, newXP: amount, message: "User not authenticated." };
}

export async function unlockContentWithCoins(
  contentId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "User not authenticated." };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('focus_coins, owned_content_ids')
      .eq('id', user.id)
      .single();

    if (profileError) { // Any error here is problematic
      console.error("[apiClient] Error fetching profile for unlock:", JSON.stringify(profileError, null, 2));
      return { success: false, message: `Failed to fetch user profile: ${profileError.message}` };
    }

    const currentCoins = profile.focus_coins || 0;
    const currentOwnedIds = new Set(profile.owned_content_ids || []);

    if (currentOwnedIds.has(contentId)) {
      return { success: true, newCoinBalance: currentCoins, message: "Content already unlocked." };
    }
    if (currentCoins < cost) {
      return { success: false, message: 'Not enough Focus Coins.' };
    }

    const newCoinBalance = currentCoins - cost;
    currentOwnedIds.add(contentId);
    const newOwnedIdsArray = Array.from(currentOwnedIds);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ focus_coins: newCoinBalance, owned_content_ids: newOwnedIdsArray, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error("[apiClient] Error updating profile for unlock:", JSON.stringify(updateError, null, 2));
      return { success: false, message: `DB update failed: ${updateError.message}` };
    }
    return { success: true, newCoinBalance: newCoinBalance, message: `Successfully unlocked! ${cost} coins deducted.` };
  } catch(e: any) {
    console.error("[apiClient] Exception unlocking with coins:", JSON.stringify(e, null, 2));
    return { success: false, message: `DB exception: ${e.message}` };
  }
}

export async function unlockContentWithPassword(
  contentId: string,
  passwordAttempt: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const DEMO_PASSWORD = 'NEETPREP2025';
  if (passwordAttempt !== DEMO_PASSWORD) {
    return { success: false, message: 'Incorrect password.' };
  }

  if (!user) {
    return { success: false, message: "User not authenticated." };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('owned_content_ids')
      .eq('id', user.id)
      .single();

    if (profileError) {
        console.error("[apiClient] Error fetching profile for password unlock:", JSON.stringify(profileError, null, 2));
        return { success: false, message: `Failed to fetch user profile: ${profileError.message}` };
    }
    const currentOwnedIds = new Set(profile.owned_content_ids || []);
    currentOwnedIds.add(contentId);
    const newOwnedIdsArray = Array.from(currentOwnedIds);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ owned_content_ids: newOwnedIdsArray, updated_at: new Date().toISOString() })
        .eq('id', user.id);

    if (updateError) {
        console.error("[apiClient] Error updating profile for password unlock:", JSON.stringify(updateError, null, 2));
        return { success: false, message: `DB update failed: ${updateError.message}` };
    }
    return { success: true, message: 'Password correct! Content unlocked.' };
  } catch(e: any) {
    console.error("[apiClient] Exception unlocking with password:", JSON.stringify(e, null, 2));
    return { success: false, message: `DB exception: ${e.message}` };
  }
}

export async function fetchUnlockedContentIds(): Promise<string[]> {
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
            return [];
        }
        return profile?.owned_content_ids || [];
    } catch(e) {
        console.error("[apiClient] Exception fetching unlocked content IDs:", JSON.stringify(e, null, 2));
        return [];
    }
  }
  return [];
}

export async function purchaseStoreItem(
  itemId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "User not authenticated." };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('focus_coins, owned_store_items')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("[apiClient] Error fetching profile for purchase:", JSON.stringify(profileError, null, 2));
      return { success: false, message: `Failed to fetch user profile for purchase: ${profileError.message}` };
    }

    const currentCoins = profile.focus_coins || 0;
    const currentOwnedItems = new Set(profile.owned_store_items || []);

    if (currentOwnedItems.has(itemId)) {
        return { success: true, newCoinBalance: currentCoins, message: "Item already owned." };
    }
    if (currentCoins < cost) {
      return { success: false, message: 'Not enough Focus Coins.' };
    }

    const newCoinBalance = currentCoins - cost;
    currentOwnedItems.add(itemId);
    const newOwnedItemsArray = Array.from(currentOwnedItems);

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ focus_coins: newCoinBalance, owned_store_items: newOwnedItemsArray, updated_at: new Date().toISOString() })
        .eq('id', user.id);

    if (updateError) {
        console.error("[apiClient] Error updating profile after purchase:", JSON.stringify(updateError, null, 2));
        return { success: false, message: `DB update failed: ${updateError.message}` };
    }
    return { success: true, newCoinBalance: newCoinBalance, message: `Successfully purchased! ${cost} coins deducted.` };
  } catch (e: any) {
    console.error("[apiClient] Exception purchasing item:", JSON.stringify(e, null, 2));
    return { success: false, message: `DB exception: ${e.message}` };
  }
}

export async function fetchOwnedItemIds(): Promise<string[]> {
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
            return [];
        }
        return profile?.owned_store_items || [];
    } catch (e) {
        console.error("[apiClient] Exception fetching owned item IDs:", JSON.stringify(e, null, 2));
        return [];
    }
  }
  return [];
}

export async function fetchUnlockedAchievements(): Promise<string[]> {
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
                return [];
            }
            return profile?.unlocked_achievement_ids || [];
        } catch (e) {
            console.error("[apiClient] Exception fetching unlocked achievements:", JSON.stringify(e, null, 2));
            return [];
        }
    }
    return [];
}

export async function unlockAchievement(achievementId: string): Promise<{ success: boolean, message?: string }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('unlocked_achievement_ids')
                .eq('id', user.id)
                .single();

            if (profileError) {
                 console.error("[apiClient] Error fetching profile for unlocking achievement:", JSON.stringify(profileError, null, 2));
                return { success: false, message: `DB error fetching profile: ${profileError.message}` };
            }
            const currentUnlockedAchievements = new Set(profile.unlocked_achievement_ids || []);
            if (currentUnlockedAchievements.has(achievementId)) {
                return { success: true, message: "Already unlocked." };
            }

            currentUnlockedAchievements.add(achievementId);
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ unlocked_achievement_ids: Array.from(currentUnlockedAchievements), updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (updateError) {
                console.error("[apiClient] Error updating achievements in DB:", JSON.stringify(updateError, null, 2));
                return { success: false, message: `DB update failed: ${updateError.message}` };
            }
            return { success: true, message: "Achievement unlocked!" };
        } catch(e: any) {
            console.error("[apiClient] Exception unlocking achievement:", JSON.stringify(e, null, 2));
            return { success: false, message: `DB exception: ${e.message}` };
        }
    }
    return { success: false, message: "User not authenticated." };
}

export async function addSpinToHistory(
  rewardName: string,
  rewardType: string,
  rewardValue?: number | string
): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn("[apiClient] addSpinToHistory: User not logged in. Spin not saved to DB.");
        return;
    }
    try {
        const spinEntry: TablesInsert<'spin_history'> = {
            user_id: user.id,
            reward_name: rewardName,
            reward_type: rewardType,
            reward_value: rewardValue?.toString() // Ensure it's string or handle type appropriately
        };
        const { error } = await supabase.from('spin_history').insert(spinEntry);
        if (error) {
            console.error("[apiClient] Error adding spin to DB history:", JSON.stringify(error, null, 2));
        }
    } catch (e) {
        console.error("[apiClient] Exception adding spin to DB history:", JSON.stringify(e, null, 2));
    }
}

export async function fetchSpinHistory(): Promise<DemoSpinHistoryEntry[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('spin_history')
            .select('reward_name, reward_type, reward_value, spun_at')
            .eq('user_id', user.id)
            .order('spun_at', { ascending: false })
            .limit(20);
        if (error) {
            console.error("[apiClient] Error fetching spin history from DB:", JSON.stringify(error, null, 2));
            return [];
        }
        return (data || []).map(item => ({
            rewardName: item.reward_name,
            rewardType: item.reward_type,
            rewardValue: item.reward_value || undefined, // Supabase might return null
            timestamp: item.spun_at,
        }));
    } catch (e) {
        console.error("[apiClient] Exception fetching spin history from DB:", JSON.stringify(e, null, 2));
        return [];
    }
}


// Functions for Dynamic Puzzles
export async function fetchPuzzleForLevel(puzzleId: string, level: number): Promise<GeneratedPuzzleLevelContent> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated for fetching puzzle level.");
    
    console.log(`[apiClient] Attempting to call Supabase Edge Function 'fetch_puzzle_for_level' for puzzle ${puzzleId}, level ${level}.`);
    
    const { data, error } = await supabase.functions.invoke('fetch_puzzle_for_level', {
        body: { user_id: user.id, puzzle_id: puzzleId, level },
    });

    if (error) {
        console.error("Error invoking fetch_puzzle_for_level function from client:", JSON.stringify(error, null, 2));
        throw new Error(`Network or function invocation error: ${error.message}`);
    }
    if (data.error) { // Error from within the function's logic
        console.error("Error from fetch_puzzle_for_level function's logic:", JSON.stringify(data.error, null, 2));
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

    console.log(`[apiClient] Attempting to call Supabase Edge Function 'submit_puzzle_solution' for puzzle ${puzzleId}, level ${level}.`);

    const { data, error } = await supabase.functions.invoke('submit_puzzle_solution', {
        body: { user_id: user.id, puzzle_id: puzzleId, level, solution },
    });
    if (error) {
        console.error("Error invoking submit_puzzle_solution function from client:", JSON.stringify(error, null, 2));
        throw new Error(`Network or function invocation error: ${error.message}`);
    }
    if (data.error) { // Error from within the function's logic
        console.error("Error from submit_puzzle_solution function's logic:", JSON.stringify(data.error, null, 2));
        throw new Error(data.error.details || data.error.message || 'Failed to submit puzzle solution via function.');
    }
    return data as PuzzleSubmissionResponse;
}


// NO Demo Reset function needed if all are real calls now
// if (typeof window !== 'undefined') {
//  (window as any).resetDemoState = () => console.warn("Demo state reset is deprecated. Using Supabase backend.");
// }

    