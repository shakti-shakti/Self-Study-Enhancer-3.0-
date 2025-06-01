
// src/lib/apiClient.ts
// Placeholder API client to simulate backend interactions.
// In a real application, these functions would make HTTP requests to your Supabase backend (Edge Functions or PostgREST).

// --- DEMO STATE (Managed in memory by these placeholder functions) ---
let demoUserCoins = 500; // Initial demo coins
const demoUnlockedContentIds = new Set<string>(); // Simulates content unlocked by user
const demoOwnedAvatarIds = new Set<string>(); // Simulates avatars purchased by user

// --- API Functions ---

/**
 * Fetches the user's current Focus Coin balance.
 * TODO: Replace with actual API call to Supabase backend.
 */
export async function fetchUserFocusCoins(): Promise<number> {
  console.log('[apiClient] fetchUserFocusCoins called (demo)');
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return demoUserCoins;
}

/**
 * Attempts to deduct coins and unlock a piece of content (story chapter or puzzle).
 * TODO: Replace with actual API call to Supabase backend.
 * This function should handle coin deduction and record the unlock server-side.
 */
export async function unlockContentWithCoins(
  contentId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] unlockContentWithCoins called for ${contentId} with cost ${cost} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  if (demoUserCoins >= cost) {
    demoUserCoins -= cost;
    demoUnlockedContentIds.add(contentId);
    return { success: true, newCoinBalance: demoUserCoins, message: `Successfully unlocked! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}

/**
 * Attempts to unlock a piece of content using a password.
 * TODO: Replace with actual API call to Supabase backend.
 * This function should securely verify the password server-side.
 */
export async function unlockContentWithPassword(
  contentId: string,
  passwordAttempt: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[apiClient] unlockContentWithPassword called for ${contentId} with password (demo)`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  const DEMO_PASSWORD = 'NEETPREP2025'; // Hardcoded demo password

  if (passwordAttempt === DEMO_PASSWORD) {
    demoUnlockedContentIds.add(contentId);
    return { success: true, message: 'Password correct! Content unlocked.' };
  } else {
    return { success: false, message: 'Incorrect password.' };
  }
}

/**
 * Fetches IDs of content (stories/puzzles) already unlocked by the user.
 * TODO: Replace with actual API call to Supabase backend.
 */
export async function fetchUnlockedContentIds(): Promise<string[]> {
  console.log('[apiClient] fetchUnlockedContentIds called (demo)');
  await new Promise(resolve => setTimeout(resolve, 300));
  return Array.from(demoUnlockedContentIds);
}


/**
 * Attempts to purchase a store item (e.g., an avatar).
 * TODO: Replace with actual API call to Supabase backend.
 * This function should handle coin deduction and record the purchase server-side.
 */
export async function purchaseStoreItem(
  itemId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] purchaseStoreItem called for ${itemId} with cost ${cost} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  if (demoUserCoins >= cost) {
    demoUserCoins -= cost;
    // Assuming itemId is for an avatar for this demo
    demoOwnedAvatarIds.add(itemId);
    return { success: true, newCoinBalance: demoUserCoins, message: `Successfully purchased! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}

/**
 * Fetches IDs of store items (e.g., avatars) owned by the user.
 * TODO: Replace with actual API call to Supabase backend.
 */
export async function fetchOwnedItemIds(itemType: 'avatar' | 'theme'): Promise<string[]> {
  console.log(`[apiClient] fetchOwnedItemIds called for ${itemType} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 300));
  if (itemType === 'avatar') {
    return Array.from(demoOwnedAvatarIds);
  }
  return []; // Placeholder for other item types like themes
}

// --- Helper to reset demo state for testing ---
export function resetDemoApiClientState() {
  demoUserCoins = 500;
  demoUnlockedContentIds.clear();
  demoOwnedAvatarIds.clear();
  console.log('[apiClient] Demo state has been reset.');
}

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

    