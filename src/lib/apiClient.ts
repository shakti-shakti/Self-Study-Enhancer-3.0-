
// src/lib/apiClient.ts
// Placeholder API client to simulate backend interactions for the current session.
// In a real application, these functions would make HTTP requests to your Supabase backend.

// --- DEMO STATE (Managed in memory by these placeholder functions for the current session) ---
let demoUserCoins = 500; // Initial demo coins
const demoUnlockedContentIds = new Set<string>();
const demoOwnedAvatarIds = new Set<string>(); // For store purchases
const demoOwnedThemeIds = new Set<string>(); // For store purchases
let demoUserXP = 0;
const demoUnlockedAchievements = new Set<string>();

interface DemoSpinHistoryEntry {
  rewardName: string; // e.g., "+25 Focus Coins", "Rare Avatar!", "Ocean Blue Theme"
  rewardType: string; // 'coins', 'cosmetic', 'token', 'none'
  rewardValue?: number | string; // e.g., 25 for coins, 1 for token, item_id for cosmetic
  timestamp: string;
}
let demoSpinHistory: DemoSpinHistoryEntry[] = [];

// --- API Functions ---

/**
 * Fetches the user's current Focus Coin balance (DEMO - in-memory).
 */
export async function fetchUserFocusCoins(): Promise<number> {
  console.log('[apiClient] fetchUserFocusCoins called (demo)');
  await new Promise(resolve => setTimeout(resolve, 50));
  return demoUserCoins;
}

/**
 * Updates the user's Focus Coin balance (DEMO - in-memory).
 */
export async function updateUserFocusCoins(newAmount: number): Promise<{ success: boolean; newCoinBalance: number }> {
  console.log(`[apiClient] updateUserFocusCoins called with newAmount ${newAmount} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  demoUserCoins = newAmount;
  return { success: true, newCoinBalance: demoUserCoins };
}

/**
 * Attempts to deduct coins and unlock a piece of content (story chapter or puzzle) (DEMO - in-memory).
 */
export async function unlockContentWithCoins(
  contentId: string,
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] unlockContentWithCoins called for ${contentId} with cost ${cost} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 100));

  if (demoUserCoins >= cost) {
    demoUserCoins -= cost;
    demoUnlockedContentIds.add(contentId);
    return { success: true, newCoinBalance: demoUserCoins, message: `Successfully unlocked! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}

/**
 * Attempts to unlock a piece of content using a password (DEMO - checks hardcoded password).
 */
export async function unlockContentWithPassword(
  contentId: string,
  passwordAttempt: string
): Promise<{ success: boolean; message?: string }> {
  console.log(`[apiClient] unlockContentWithPassword called for ${contentId} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 100));

  const DEMO_PASSWORD = 'NEETPREP2025'; // Centralized demo password

  if (passwordAttempt === DEMO_PASSWORD) {
    demoUnlockedContentIds.add(contentId);
    return { success: true, message: 'Password correct! Content unlocked.' };
  } else {
    return { success: false, message: 'Incorrect password.' };
  }
}

/**
 * Fetches IDs of content (stories/puzzles) already unlocked by the user (DEMO - in-memory).
 */
export async function fetchUnlockedContentIds(): Promise<string[]> {
  console.log('[apiClient] fetchUnlockedContentIds called (demo)');
  await new Promise(resolve => setTimeout(resolve, 50));
  return Array.from(demoUnlockedContentIds);
}

/**
 * Attempts to purchase a store item (e.g., an avatar or theme) (DEMO - in-memory).
 */
export async function purchaseStoreItem(
  itemId: string,
  itemType: 'avatar' | 'theme' | 'booster', // Added itemType
  cost: number
): Promise<{ success: boolean; newCoinBalance?: number; message?: string }> {
  console.log(`[apiClient] purchaseStoreItem called for ${itemId} (type: ${itemType}) with cost ${cost} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 100));

  if (demoUserCoins >= cost) {
    demoUserCoins -= cost;
    if (itemType === 'avatar') {
      demoOwnedAvatarIds.add(itemId);
    } else if (itemType === 'theme') {
      demoOwnedThemeIds.add(itemId);
    }
    // Add other item types like 'booster' if needed
    return { success: true, newCoinBalance: demoUserCoins, message: `Successfully purchased! ${cost} coins deducted.` };
  } else {
    return { success: false, message: 'Not enough Focus Coins.' };
  }
}

/**
 * Fetches IDs of store items (e.g., avatars, themes) owned by the user (DEMO - in-memory).
 */
export async function fetchOwnedItemIds(itemType: 'avatar' | 'theme'): Promise<string[]> {
  console.log(`[apiClient] fetchOwnedItemIds called for ${itemType} (demo)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  if (itemType === 'avatar') {
    return Array.from(demoOwnedAvatarIds);
  } else if (itemType === 'theme') {
    return Array.from(demoOwnedThemeIds);
  }
  return [];
}

/**
 * Fetches the user's current XP (DEMO - in-memory).
 */
export async function fetchUserXP(): Promise<number> {
    console.log('[apiClient] fetchUserXP called (demo)');
    await new Promise(resolve => setTimeout(resolve, 50));
    return demoUserXP;
}

/**
 * Adds XP to the user's total (DEMO - in-memory).
 */
export async function addUserXP(amount: number): Promise<{ success: boolean; newXP: number }> {
    console.log(`[apiClient] addUserXP called with amount ${amount} (demo)`);
    await new Promise(resolve => setTimeout(resolve, 50));
    demoUserXP += amount;
    return { success: true, newXP: demoUserXP };
}

/**
 * Fetches IDs of achievements unlocked by the user (DEMO - in-memory).
 */
export async function fetchUnlockedAchievements(): Promise<string[]> {
    console.log('[apiClient] fetchUnlockedAchievements called (demo)');
    await new Promise(resolve => setTimeout(resolve, 50));
    return Array.from(demoUnlockedAchievements);
}

/**
 * Unlocks an achievement for the user (DEMO - in-memory).
 */
export async function unlockAchievement(achievementId: string): Promise<{ success: boolean }> {
    console.log(`[apiClient] unlockAchievement called for ${achievementId} (demo)`);
    await new Promise(resolve => setTimeout(resolve, 50));
    demoUnlockedAchievements.add(achievementId);
    return { success: true };
}

/**
 * Adds a spin result to the history (DEMO - in-memory).
 */
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
    // Keep history to a reasonable size for demo
    if (demoSpinHistory.length > 20) {
        demoSpinHistory.pop();
    }
}

/**
 * Fetches the spin history (DEMO - in-memory).
 */
export async function fetchSpinHistory(): Promise<DemoSpinHistoryEntry[]> {
    console.log('[apiClient] fetchSpinHistory called (demo)');
    await new Promise(resolve => setTimeout(resolve, 50));
    return [...demoSpinHistory]; // Return a copy
}


// --- Helper to reset demo state for testing (call from browser console if needed) ---
export function resetDemoApiClientState() {
  demoUserCoins = 500;
  demoUnlockedContentIds.clear();
  demoOwnedAvatarIds.clear();
  demoOwnedThemeIds.clear();
  demoUserXP = 0;
  demoUnlockedAchievements.clear();
  demoSpinHistory = [];
  console.log('[apiClient] Demo state has been reset.');
}

// Call resetDemoApiClientState() in browser console if you need to clear session demo data
// window.resetDemoState = resetDemoApiClientState; // Optional: make it easily callable
