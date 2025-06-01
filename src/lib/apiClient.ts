// src/lib/apiClient.ts
// Placeholder API client to simulate backend interactions for the current session.
// In a real application, these functions would make HTTP requests to your Supabase backend.
import { createClient } from './supabase/client'; // Import Supabase client

// --- DEMO STATE (Managed in memory by these placeholder functions for the current session) ---
// These will be less relevant as we try to use Supabase more directly or through dedicated functions.
let demoUserCoins = 500; 
const demoUnlockedContentIds = new Set<string>();
let demoOwnedItemIds = new Set<string>(); // Generic for store items
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

/**
 * Fetches the user's current Focus Coin balance.
 * In a real app, this would fetch from the 'profiles' table.
 * For now, it simulates or could fetch if a user is logged in.
 */
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
    if (error && error.code !== 'PGRST116') {
      console.error("[apiClient] Error fetching coins from DB:", error);
      return demoUserCoins; // Fallback to demo if DB error
    }
    return profile?.focus_coins || 0;
  }
  return demoUserCoins; // Fallback for non-logged-in or if profile doesn't exist
}

/**
 * Updates the user's Focus Coin balance.
 * In a real app, this would update the 'profiles' table.
 * This function should ideally be called from a place that already has user context.
 */
export async function updateUserFocusCoins(newAmount: number): Promise<{ success: boolean; newCoinBalance: number }> {
  console.log(`[apiClient] updateUserFocusCoins called with newAmount ${newAmount}`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  demoUserCoins = Math.max(0, newAmount); // Update demo state as fallback/local cache

  if (user) {
    const { error } = await supabase
      .from('profiles')
      .update({ focus_coins: demoUserCoins, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      console.error("[apiClient] Error updating coins in DB:", error);
      return { success: false, newCoinBalance: demoUserCoins }; // Reflects demo state on failure
    }
    return { success: true, newCoinBalance: demoUserCoins };
  }
  // If no user, conceptually update demo coins, but real persistence fails
  return { success: false, newCoinBalance: demoUserCoins }; 
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
        if (error && error.code !== 'PGRST116') {
            console.error("[apiClient] Error fetching XP from DB:", error);
            return demoUserXP; 
        }
        return profile?.xp || 0;
    }
    return demoUserXP;
}

export async function addUserXP(amount: number): Promise<{ success: boolean; newXP: number }> {
    console.log(`[apiClient] addUserXP called with amount ${amount}`);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    demoUserXP += amount; // Update demo state as fallback/local cache

    if (user) {
        // It's better to fetch current XP and add, or use an RPC to increment
        const currentXP = await fetchUserXP(); // Fetches potentially from DB
        const newTotalXP = currentXP + amount;

        const { error } = await supabase
            .from('profiles')
            .update({ xp: newTotalXP, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        
        if (error) {
            console.error("[apiClient] Error updating XP in DB:", error);
            return { success: false, newXP: demoUserXP };
        }
        
        // Conceptual XP-based achievement check (example)
        if (newTotalXP >= 100 && !demoUnlockedAchievementIds.has('ach_xp_100')) {
            console.log('[apiClient] Unlocking ach_xp_100 due to XP threshold');
            await unlockAchievement('ach_xp_100');
        }
        return { success: true, newXP: newTotalXP };
    }
    return { success: false, newXP: demoUserXP };
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
    .select('focus_coins, owned_content_ids') // Assuming 'owned_content_ids' is an array of strings
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
    demoUnlockedContentIds.add(contentId); // Keep demo state in sync if needed for immediate UI
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

    if (profileError) {
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
    demoUnlockedContentIds.add(contentId);
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
    if (error && error.code !== 'PGRST116') {
        console.error("[apiClient] Error fetching unlocked content IDs from DB:", error);
        return Array.from(demoUnlockedContentIds);
    }
    return profile?.owned_content_ids as string[] || [];
  }
  return Array.from(demoUnlockedContentIds);
}


export async function purchaseStoreItem(
  itemId: string,
  itemType: 'avatar' | 'theme' | 'booster', // itemType might be used by backend
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] purchaseStoreItem called for ${itemId} (type: ${itemType}) with cost ${cost}`);
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
    demoOwnedItemIds.add(itemId); // Sync demo state
    return { success: true, newCoinBalance: newCoinBalance, message: `Successfully purchased! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}


export async function fetchOwnedItemIds(itemType?: 'avatar' | 'theme' | 'booster'): Promise<string[]> {
  console.log(`[apiClient] fetchOwnedItemIds called (type: ${itemType || 'any'})`);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('owned_store_items')
        .eq('id', user.id)
        .single();
    if (error && error.code !== 'PGRST116') {
        console.error("[apiClient] Error fetching owned item IDs from DB:", error);
        return Array.from(demoOwnedItemIds);
    }
    // Here you could filter by itemType if your 'owned_store_items' stores type information or if item IDs have prefixes
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
            .select('unlocked_achievement_ids') // Assuming this field exists
            .eq('id', user.id)
            .single();
        if (error && error.code !== 'PGRST116') {
            console.error("[apiClient] Error fetching unlocked achievements from DB:", error);
            return Array.from(demoUnlockedAchievementIds);
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
            return { success: true }; // Already unlocked
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
        demoUnlockedAchievementIds.add(achievementId);
        return { success: true };
    }
    demoUnlockedAchievementIds.add(achievementId); // Fallback for demo
    return { success: false }; // No user, conceptually didn't save to DB
}


export async function addSpinToHistory(
  rewardName: string,
  rewardType: string,
  rewardValue?: number | string
): Promise<void> {
    console.log(`[apiClient] addSpinToHistory called for ${rewardName}, type ${rewardType}, value ${rewardValue} (demo)`);
    // This is purely client-side demo. A real implementation would save to a user-specific table.
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
    // This is purely client-side demo. A real implementation would fetch from a user-specific table.
    await new Promise(resolve => setTimeout(resolve, 50));
    return [...demoSpinHistory]; 
}


export function resetDemoApiClientState() {
  demoUserCoins = 500;
  demoUnlockedContentIds.clear();
  demoOwnedItemIds.clear();
  demoUserXP = 0;
  demoUnlockedAchievementIds.clear();
  demoSpinHistory = [];
  console.log('[apiClient] Demo state has been reset.');
}

if (typeof window !== 'undefined') {
  (window as any).resetDemoState = resetDemoApiClientState;
  // Initialize demo state from localStorage if it exists, to provide some cross-session persistence for the demo
  // const storedDemoCoins = localStorage.getItem('demoUserCoins');
  // if (storedDemoCoins) demoUserCoins = parseInt(storedDemoCoins, 10);
  // const storedDemoXP = localStorage.getItem('demoUserXP');
  // if (storedDemoXP) demoUserXP = parseInt(storedDemoXP, 10);
  // // Note: Sets (like unlocked IDs) are harder to persist easily in localStorage this way.
}
// TODO: For coin/XP persistence in the demo, consider saving to localStorage and loading on init.
// However, the request was for REAL persistence, so focusing on DB structure for that.
// The functions above now TRY to use Supabase for logged-in users, falling back to demo values.
