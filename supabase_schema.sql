
-- Ensure existing tables have necessary columns and defaults if they were missed.
-- PROFILES TABLE (Verify and Add if missing)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS focus_coins INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owned_content_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS owned_store_items TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS unlocked_achievement_ids TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update details for activity_logs if selfie_image_data_uri was used
-- This is more of a note: you'll need to migrate existing data if it's in the wrong format.
-- For new entries, the app code will store image_storage_path.

-- Update doubt_resolution_logs
ALTER TABLE public.doubt_resolution_logs
  DROP COLUMN IF EXISTS question_image_data_uri, -- Assuming it was TEXT or similar
  ADD COLUMN IF NOT EXISTS question_image_storage_path TEXT;

-- SPIN HISTORY TABLE (New)
CREATE TABLE IF NOT EXISTS public.spin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value TEXT, -- Can store coin amount, item ID, etc.
  spun_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for spin_history
ALTER TABLE public.spin_history ENABLE ROW LEVEL SECURITY;

-- Policies for spin_history
DROP POLICY IF EXISTS "Users can manage their own spin history" ON public.spin_history;
CREATE POLICY "Users can manage their own spin history"
  ON public.spin_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the increment_leaderboard_score RPC function exists
-- (This was likely in a previous SQL setup but good to re-confirm its presence is known)
CREATE OR REPLACE FUNCTION public.increment_leaderboard_score(p_user_id uuid, p_score_increment integer, p_period text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important for allowing updates from authenticated users via RLS on profiles
AS $$
BEGIN
  -- Check if user exists in profiles, if not, create them
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    INSERT INTO public.profiles (id, email, focus_coins, xp)
    VALUES (
      p_user_id,
      (SELECT email FROM auth.users WHERE id = p_user_id),
      0, -- Initial coins
      0  -- Initial XP
    );
  END IF;

  INSERT INTO public.leaderboard_entries (user_id, score, period, last_updated)
  VALUES (p_user_id, p_score_increment, p_period::public.leaderboard_period_enum, NOW())
  ON CONFLICT (user_id, period)
  DO UPDATE SET
    score = public.leaderboard_entries.score + p_score_increment,
    last_updated = NOW();

  -- Also update the main profile XP if this is a general score increment that should also be XP
  -- This part might need adjustment based on how "score" relates to "XP"
  -- For now, let's assume p_score_increment also contributes to general XP
  UPDATE public.profiles
  SET xp = COALESCE(xp, 0) + p_score_increment
  WHERE id = p_user_id;
END;
$$;
-- Note on leaderboard_period_enum: Ensure this enum type exists or adjust p_period to TEXT
-- CREATE TYPE public.leaderboard_period_enum AS ENUM ('daily', 'weekly', 'all_time');

-- RLS for puzzles table (if not already set, users should generally only read)
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to puzzles" ON public.puzzles;
CREATE POLICY "Allow public read access to puzzles" ON public.puzzles FOR SELECT USING (true);

-- RLS for user_puzzle_progress (users manage their own)
ALTER TABLE public.user_puzzle_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own puzzle progress" ON public.user_puzzle_progress;
CREATE POLICY "Users can manage their own puzzle progress" ON public.user_puzzle_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS for game_metadata (public read)
ALTER TABLE public.game_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to game metadata" ON public.game_metadata;
CREATE POLICY "Allow public read access to game metadata" ON public.game_metadata FOR SELECT USING (true);

-- RLS for user_game_progress (users manage their own)
ALTER TABLE public.user_game_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own game progress" ON public.user_game_progress;
CREATE POLICY "Users can manage their own game progress" ON public.user_game_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS for game_leaderboard (public read)
ALTER TABLE public.game_leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to game leaderboard" ON public.game_leaderboard;
CREATE POLICY "Allow public read access to game leaderboard" ON public.game_leaderboard FOR SELECT USING (true);


-- Ensure `unlocked_achievement_ids` column exists in `profiles`
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS unlocked_achievement_ids TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Ensure `owned_store_items` column exists in `profiles`
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS owned_store_items TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Ensure `owned_content_ids` column exists in `profiles`
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS owned_content_ids TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Ensure `alarm_tone_url` column exists in `profiles`
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS alarm_tone_url TEXT;

-- Ensure `focus_coins` and `xp` have NOT NULL constraints and correct defaults
ALTER TABLE public.profiles
  ALTER COLUMN focus_coins SET DEFAULT 0,
  ALTER COLUMN focus_coins SET NOT NULL,
  ALTER COLUMN xp SET DEFAULT 0,
  ALTER COLUMN xp SET NOT NULL;
    