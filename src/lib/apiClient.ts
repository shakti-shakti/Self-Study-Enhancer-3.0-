
// src/lib/apiClient.ts
// Placeholder API client to simulate backend interactions.
// In a real application, these functions would make HTTP requests to your Supabase backend (Edge Functions or PostgREST).

// --- DEMO STATE (Managed in memory by these placeholder functions for the current session) ---
let demoUserCoins = 500; // Initial demo coins
const demoUnlockedContentIds = new Set<string>();
const demoOwnedAvatarIds = new Set<string>();
let demoUserXP = 0;
const demoUnlockedAchievements = new Set<string>();
let demoSpinHistory: Array<{ rewardName: string; rewardType: string; timestamp: string }> = [];


// --- API Functions ---

/**
 * Fetches the user's current Focus Coin balance (DEMO).
 */
export async function fetchUserFocusCoins(): Promise<number> {
  console.log('[apiClient] fetchUserFocusCoins called (demo)');
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
  return demoUserCoins;
}

/**
 * Updates the user's Focus Coin balance (DEMO).
 */
export async function updateUserFocusCoins(newAmount: number): Promise<{ success: boolean; newCoinBalance: number }> {
  console.log(`[apiClient] updateUserFocusCoins called with newAmount ${newAmount} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 100));
  demoUserCoins = newAmount;
  return { success: true, newCoinBalance: demoUserCoins };
}


/**
 * Attempts to deduct coins and unlock a piece of content (story chapter or puzzle) (DEMO).
 */
export async function unlockContentWithCoins(
  contentId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] unlockContentWithCoins called for ${contentId} with cost ${cost} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 200));

  if (demoUserCoins >= cost) {
    demoUserCoins -= cost;
    demoUnlockedContentIds.add(contentId);
    return { success: true, newCoinBalance: demoUserCoins, message: `Successfully unlocked! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}

/**
 * Attempts to unlock a piece of content using a password (DEMO).
 */
export async function unlockContentWithPassword(
  contentId: string,
  passwordAttempt: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[apiClient] unlockContentWithPassword called for ${contentId} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 200));

  const DEMO_PASSWORD = 'NEETPREP2025';

  if (passwordAttempt === DEMO_PASSWORD) {
    demoUnlockedContentIds.add(contentId);
    return { success: true, message: 'Password correct! Content unlocked.' };
  } else {
    return { success: false, message: 'Incorrect password.' };
  }
}

/**
 * Fetches IDs of content (stories/puzzles) already unlocked by the user (DEMO).
 */
export async function fetchUnlockedContentIds(): Promise<string[]> {
  console.log('[apiClient] fetchUnlockedContentIds called (demo)');
  await new Promise(resolve => setTimeout(resolve, 100));
  return Array.from(demoUnlockedContentIds);
}


/**
 * Attempts to purchase a store item (e.g., an avatar) (DEMO).
 */
export async function purchaseStoreItem(
  itemId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] purchaseStoreItem called for ${itemId} with cost ${cost} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 200));

  if (demoUserCoins >= cost) {
    demoUserCoins -= cost;
    demoOwnedAvatarIds.add(itemId);
    return { success: true, newCoinBalance: demoUserCoins, message: `Successfully purchased! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}

/**
 * Fetches IDs of store items (e.g., avatars) owned by the user (DEMO).
 */
export async function fetchOwnedItemIds(itemType: 'avatar' | 'theme'): Promise<string[]> {
  console.log(`[apiClient] fetchOwnedItemIds called for ${itemType} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 100));
  if (itemType === 'avatar') { // Extend for themes if needed
    return Array.from(demoOwnedAvatarIds);
  }
  return [];
}

/**
 * Fetches the user's current XP (DEMO).
 */
export async function fetchUserXP(): Promise<number> {
    console.log('[apiClient] fetchUserXP called (demo)');
    await new Promise(resolve => setTimeout(resolve, 100));
    return demoUserXP;
}

/**
 * Adds XP to the user's total (DEMO).
 */
export async function addUserXP(amount: number): Promise<{ success: boolean; newXP: number }> {
    console.log(`[apiClient] addUserXP called with amount ${amount} (demo)`);
    await new Promise(resolve => setTimeout(resolve, 100));
    demoUserXP += amount;
    return { success: true, newXP: demoUserXP };
}

/**
 * Fetches IDs of achievements unlocked by the user (DEMO).
 */
export async function fetchUnlockedAchievements(): Promise<string[]> {
    console.log('[apiClient] fetchUnlockedAchievements called (demo)');
    await new Promise(resolve => setTimeout(resolve, 100));
    return Array.from(demoUnlockedAchievements);
}

/**
 * Unlocks an achievement for the user (DEMO).
 */
export async function unlockAchievement(achievementId: string): Promise<{ success: boolean }> {
    console.log(`[apiClient] unlockAchievement called for ${achievementId} (demo)`);
    await new Promise(resolve => setTimeout(resolve, 100));
    demoUnlockedAchievements.add(achievementId);
    return { success: true };
}

/**
 * Adds a spin result to the history (DEMO).
 */
export async function addSpinToHistory(rewardName: string, rewardType: string): Promise<void> {
    console.log(`[apiClient] addSpinToHistory called for ${rewardName} (demo)`);
    await new Promise(resolve => setTimeout(resolve, 50));
    demoSpinHistory.unshift({ rewardName, rewardType, timestamp: new Date().toISOString() });
    // Keep history to a reasonable size for demo
    if (demoSpinHistory.length > 20) {
        demoSpinHistory.pop();
    }
}

/**
 * Fetches the spin history (DEMO).
 */
export async function fetchSpinHistory(): Promise<Array<{ rewardName: string; rewardType: string; timestamp: string }>> {
    console.log('[apiClient] fetchSpinHistory called (demo)');
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...demoSpinHistory]; // Return a copy
}


// --- Helper to reset demo state for testing (call from browser console if needed) ---
export function resetDemoApiClientState() {
  demoUserCoins = 500;
  demoUnlockedContentIds.clear();
  demoOwnedAvatarIds.clear();
  demoUserXP = 0;
  demoUnlockedAchievements.clear();
  demoSpinHistory = [];
  console.log('[apiClient] Demo state has been reset.');
}

// Call resetDemoApiClientState() in browser console if you need to clear session demo data

// Example of what a real API call might look like using Supabase client (for your reference)
/*
import { createClient } from '@/lib/supabase/client'; // Assuming you have this

export async function fetchRealUserFocusCoins(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles') // Assuming 'profiles' table with 'focus_coins' column
    .select('focus_coins')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching real user coins:', error);
    throw error; // Or handle error appropriately
  }
  return data?.focus_coins || 0;
}
*/
