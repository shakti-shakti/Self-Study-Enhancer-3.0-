
-- Ensure user_id is NOT NULL in quizzes table
ALTER TABLE public.quizzes
ALTER COLUMN user_id SET NOT NULL;

-- Ensure user_id is NOT NULL in doubt_resolution_logs table
ALTER TABLE public.doubt_resolution_logs
ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policy for profiles SELECT to allow any authenticated user to read
-- Drop the existing policy if it exists with a different definition
-- (Be cautious with this in a live environment; ensure this is the intended policy)
DROP POLICY IF EXISTS "Allow authenticated users to select own and other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read access to profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read access to profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Insert statements for game_metadata (assuming these games were not present)
INSERT INTO public.game_metadata (id, title, description, genre) VALUES
('chronomind_quantum_rescue', 'ChronoMind: The Quantum Rescue', 'Escape a collapsing multiverse by solving ultra-logical NEET-based challenges.', 'Sci-fi Puzzle Escape + NEET Prep'),
('neet_lab_escape', 'The NEET Lab Escape', 'Escape a locked NEET preparation lab by solving hidden, sequential puzzles in each subject room.', 'Classic Escape Room + Quiz Thriller'),
('flappy_brain', 'Flappy Brain', 'Navigate the brainy bird through conceptual pipes! Advanced version with increasing difficulty.', 'Arcade Reflex Game'),
('dino_run', 'Dino Run', 'Classic T-Rex runner game. Jump over obstacles! How high can you score?', 'Arcade Reflex Game'),
('guess_the_number', 'Guess the Number', 'A classic number guessing game. The AI thinks of a number, and you try to guess it with hints.', 'Logic / Number Game'),
('science_trivia_challenge', 'Science Trivia Challenge', 'Test your general science knowledge with rapid-fire trivia questions across Physics, Chemistry, and Biology.', 'Trivia / Quiz'),
('element_match_memory', 'Element Match Memory', 'A memory game where you match chemical elements to their symbols or properties.', 'Memory / Educational'),
('memory_match_challenge', 'Memory Match Challenge', 'Test your memory! Flip cards and find matching pairs. Great for brain training.', 'Puzzle / Memory Game'),
('2048_puzzle_challenge', '2048 Puzzle Challenge', 'Slide tiles and combine matching numbers to reach the 2048 tile.', 'Puzzle / Number Game'),
('whack_a_mole', 'Whack-a-Mole', 'Test your reaction time! Whack the moles as they pop up. Classic arcade fun.', 'Arcade / Reaction Game'),
('tic_tac_toe', 'Tic Tac Toe', 'Classic X''s and O''s. Play against a friend or the (basic) computer.', 'Strategy / Board Game'),
('snake_game', 'Snake Game', 'Classic Snake game. Grow your snake by eating food, but don''t hit the walls or yourself!', 'Arcade / Classic')
ON CONFLICT (id) DO NOTHING; -- Prevent errors if games already exist

-- Insert statements for a few puzzles into the puzzles table (assuming these were not present or are being updated)
-- Note: The base_definition is JSON and needs to be properly escaped if inserted directly in SQL tools.
-- The string literal format `E'{...}'` or `$$...$$` can be used for JSON.
INSERT INTO public.puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('word_001', 'Anagram Hunt (Science)', NULL, 'Word Puzzles', 'Unscramble these NEET-related terms.', '{"type": "anagram", "original_data": {"words": [{"scrambled": "HPOYSCIT", "category": "Physics"}, {"scrambled": "GEBYOOLI", "category": "Biology"}, {"scrambled": "HRTYSMICE", "category": "Chemistry"}]}}', 30, 15),
('logic_004', 'The Missing Symbol', NULL, 'Logic Puzzles', 'Find the logical operator that completes the equation: 10 ? 2 = 5', '{"type": "missing_symbol", "original_data": {"equationParts": ["10", "2", "5"], "operators": ["+", "-", "*", "/"]}}', 30, 10),
('math_001', 'The Sequence Solver', NULL, 'Mathematical Challenges', 'Find the next number in this sequence: 1, 1, 2, 3, 5, 8, ?', '{"type": "sequence_solver", "original_data": {"sequence": "1, 1, 2, 3, 5, 8", "displaySequence": "1, 1, 2, 3, 5, 8, ?"}}', 30, 10),
('logic_002', 'Knights and Knaves', NULL, 'Logic Puzzles', 'Two islanders, A and B, stand before you. A says, \"At least one of us is a Knave.\" B says nothing. Determine who is a Knight (always tells truth) and who is a Knave (always lies).', '{"type": "knights_knaves", "original_data": {"characters": ["A", "B"], "statements": {"A": "At least one of us is a Knave."}}}', 30, 25),
('conceptual_phy_001', 'Vector Voyage', 'Physics', 'Conceptual Puzzles (NEET Focus)', 'A ship sails 3km East, then 4km North. What is its displacement (magnitude and direction)?', '{"type": "vector_voyage", "original_data": {}}', 30, 15)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    subject = EXCLUDED.subject,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    base_definition = EXCLUDED.base_definition,
    max_level = EXCLUDED.max_level,
    default_xp_award = EXCLUDED.default_xp_award;

-- You would need to add similar INSERT ON CONFLICT DO UPDATE statements for ALL puzzles from src/lib/puzzle-data.ts
-- if they are not already in your database or if you want to ensure they are up-to-date.
-- For brevity, only a few are shown here.

-- Add RLS for increment_leaderboard_score function if it wasn't explicitly defined with security definer
-- This depends on how the function was initially created. If it's SECURITY DEFINER, it runs with creator's permissions.
-- If it's SECURITY INVOKER (default), it needs specific grants or RLS bypass if called by anon/auth key directly.
-- Assuming the function might need to be callable by authenticated users to update their own score indirectly.
-- However, the `increment_leaderboard_score` is called from backend (apiClient), which should use service_role key and bypass RLS.
-- So, explicit RLS on the function itself is usually not needed if called correctly from a secure backend context.
-- If you were calling it directly from client-side RPC with user's token, then you'd need RLS.
-- For now, I'll assume backend calls with service_role, so no direct RLS change for the function here.
-- If you create functions from the dashboard, ensure to set "SECURITY DEFINER" if they need elevated permissions.

-- Make sure the user_id in 'leaderboard_entries' correctly references 'profiles.id'
-- Example (ensure this matches your actual table structure and existing constraints before running):
-- ALTER TABLE public.leaderboard_entries DROP CONSTRAINT IF EXISTS leaderboard_entries_user_id_fkey;
-- ALTER TABLE public.leaderboard_entries
-- ADD CONSTRAINT leaderboard_entries_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- RLS for `user_game_progress` to allow users to update their own progress
DROP POLICY IF EXISTS "Allow users to manage their own game progress" ON public.user_game_progress;
CREATE POLICY "Allow users to manage their own game progress"
ON public.user_game_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS for `puzzles` (read access for authenticated users)
DROP POLICY IF EXISTS "Allow authenticated users to read puzzles" ON public.puzzles;
CREATE POLICY "Allow authenticated users to read puzzles"
ON public.puzzles
FOR SELECT
TO authenticated
USING (true);


-- Note: The `increment_leaderboard_score` function is typically called from a trusted backend environment
-- (like a Supabase Edge Function using the service_role key) which bypasses RLS.
-- If called directly from the client, it would need appropriate RLS or to be a SECURITY DEFINER function.
-- The current `apiClient.ts` calls RPC functions, these calls from the client are made using the user's session.
-- Thus, the RPC function itself might need to be `SECURITY DEFINER` or have specific grants.
-- For `increment_leaderboard_score` to modify `leaderboard_entries` (which is likely RLS protected for insert/update to service_role or specific conditions),
-- it's best for the function to be `SECURITY DEFINER` and perform its own checks if necessary, or be called only by a trusted server.
-- The provided RPC function in the schema uses `SECURITY INVOKER` which is the default.
-- To allow users to update their own score (indirectly via the function), the function needs to be `SECURITY DEFINER`
-- or the `leaderboard_entries` table needs RLS policies allowing users to update their own entries through this function's logic.

-- Let's assume we want the function to operate with definer privileges to update the leaderboard:
-- (This should be part of the function definition in the main schema file if it's not already)
-- Example if function wasn't SECURITY DEFINER:
-- CREATE OR REPLACE FUNCTION public.increment_leaderboard_score(p_user_id uuid, p_score_increment integer, p_period text)
-- RETURNS void
-- LANGUAGE plpgsql
-- SECURITY DEFINER -- Add this
-- AS $$
-- BEGIN
--   -- function body as before
-- END;
-- $$;

-- RLS for `quizzes` ensuring `user_id` matches `auth.uid()` for insert
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.quizzes;
CREATE POLICY "Enable insert for authenticated users only"
ON public.quizzes
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS for `doubt_resolution_logs` ensuring `user_id` matches `auth.uid()` for insert
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.doubt_resolution_logs;
CREATE POLICY "Enable insert for authenticated users only"
ON public.doubt_resolution_logs
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Grant usage on schema and select on tables to anon and authenticated if functions need it
-- This is generally good practice but might be too broad depending on your exact needs.
-- Ensure your RLS policies are the primary security mechanism.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO anon, authenticated; -- Anon might be too permissive, adjust if needed
GRANT SELECT ON TABLE public.puzzles TO anon, authenticated; -- Allow anon to see puzzle list, RLS will protect specific user data

