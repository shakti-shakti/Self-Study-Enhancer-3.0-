
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== TABLES ==========

-- Profiles Table (stores extra user information)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    username TEXT UNIQUE,
    class_level TEXT CHECK (class_level IN ('11', '12')),
    target_year INT,
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
    alarm_tone_url TEXT,
    custom_countdown_event_name TEXT,
    custom_countdown_target_date DATE,
    dataAiHint TEXT,
    focus_coins INT DEFAULT 0,
    xp INT DEFAULT 0,
    owned_content_ids UUID[] DEFAULT '{}',
    owned_store_items TEXT[] DEFAULT '{}',
    unlocked_achievement_ids TEXT[] DEFAULT '{}'
);
COMMENT ON COLUMN public.profiles.owned_content_ids IS 'Array of IDs for unlocked premium content like puzzles/chapters';
COMMENT ON COLUMN public.profiles.owned_store_items IS 'Array of item IDs purchased from the store';
COMMENT ON COLUMN public.profiles.unlocked_achievement_ids IS 'Array of achievement IDs unlocked by the user';

-- Mood Logs Table
CREATE TABLE IF NOT EXISTS public.mood_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    mood TEXT NOT NULL,
    focus_level INT NOT NULL CHECK (focus_level >= 0 AND focus_level <= 10),
    suggestions TEXT[]
);

-- Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be system-generated or user-generated
    class_level TEXT CHECK (class_level IN ('11', '12')),
    subject TEXT,
    topic TEXT, -- Main topic display name
    topics TEXT[], -- For specific sub-topics or chapter names
    question_source TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    num_questions INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_option_index INT NOT NULL,
    explanation_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    class_level TEXT CHECK (class_level IN ('11', '12')),
    subject TEXT,
    topic TEXT, -- Chapter or specific topic
    source TEXT,
    neet_syllabus_year INT
);

-- Saved Questions Table
CREATE TABLE IF NOT EXISTS public.saved_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE, -- Can be null if question was from an external source or deleted
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option_index INT NOT NULL,
    explanation_prompt TEXT,
    class_level TEXT,
    subject TEXT,
    topic TEXT,
    source TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id) -- User can save a specific DB question only once
);
COMMENT ON COLUMN public.saved_questions.question_id IS 'References original question if it exists in questions table, otherwise it is a copy';

-- Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    answers_submitted JSONB, -- Store as { "question_id": selected_option_index }
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Plans Table
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ,
    duration_minutes INT,
    due_date TIMESTAMPTZ NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    subject TEXT,
    class_level TEXT CHECK (class_level IN ('11', '12')),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('day_task', 'month_subject_task', 'year_goal', 'revision', 'exam')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    alarm_set_at TIMESTAMPTZ
);

-- NEET Guidelines Table (User-specific notes)
CREATE TABLE IF NOT EXISTS public.neet_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tab_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Tasks Table
CREATE TABLE IF NOT EXISTS public.custom_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Files Table
CREATE TABLE IF NOT EXISTS public.user_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE, -- Path in Supabase Storage
    file_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dictionary History Table
CREATE TABLE IF NOT EXISTS public.dictionary_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translation History Table
CREATE TABLE IF NOT EXISTS public.translation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    translated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calculator History Table
CREATE TABLE IF NOT EXISTS public.calculator_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expression TEXT NOT NULL,
    result TEXT NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Rooms Table
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    topic TEXT,
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Room Messages Table
CREATE TABLE IF NOT EXISTS public.study_room_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doubt Resolution Logs Table
CREATE TABLE IF NOT EXISTS public.doubt_resolution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_image_data_uri TEXT, -- For demo. In prod, use storage path.
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Smart Notes Logs Table
CREATE TABLE IF NOT EXISTS public.smart_notes_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    original_content_preview TEXT,
    generated_notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Assistant Logs Table
CREATE TABLE IF NOT EXISTS public.study_assistant_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'ai-tips')),
    query TEXT,
    content TEXT NOT NULL,
    ai_answer TEXT,
    ai_study_tips JSONB,
    context TEXT,
    preferences TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customization Requests Logs Table
CREATE TABLE IF NOT EXISTS public.customization_requests_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    ai_instruction TEXT,
    ai_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges Table (Admin-managed)
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY, -- e.g., 'physics_champ', 'quiz_master_1'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name_or_url TEXT NOT NULL, -- Can be Lucide icon name or direct image URL
    criteria TEXT NOT NULL, -- Description of how to earn
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions Table (Admin-managed)
CREATE TABLE IF NOT EXISTS public.missions (
    id TEXT PRIMARY KEY, -- e.g., 'daily_physics_mcq', 'weekly_study_streak'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('daily', 'weekly')),
    reward_points INT NOT NULL,
    badge_id_reward TEXT REFERENCES public.badges(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    target_value INT NOT NULL, -- e.g., target 5 quizzes, 7 days streak
    criteria_type TEXT NOT NULL -- e.g., 'quiz_completed', 'study_days_streak'
);

-- User Missions Progress Table
CREATE TABLE IF NOT EXISTS public.user_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('locked', 'active', 'completed', 'failed')),
    current_progress INT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Leaderboard Entries Table
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    rank INT, -- Can be calculated periodically
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'all_time')),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period)
);

-- NCERT Books Metadata (Admin-managed or pre-populated)
CREATE TABLE IF NOT EXISTS public.ncert_books_metadata (
    id TEXT PRIMARY KEY, -- e.g., 'phy11_1'
    class_level TEXT NOT NULL,
    subject TEXT NOT NULL,
    book_name TEXT NOT NULL,
    chapters JSONB NOT NULL, -- [{name: "Chapter 1", pdf_filename: "keph101.pdf"}, ...]
    cover_image_url TEXT,
    dataAiHint TEXT
);

-- User NCERT Notes
CREATE TABLE IF NOT EXISTS public.user_ncert_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES public.ncert_books_metadata(id) ON DELETE CASCADE,
    chapter_name TEXT NOT NULL,
    page_number INT,
    note_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Metadata (Admin-managed)
CREATE TABLE IF NOT EXISTS public.game_metadata (
    id TEXT PRIMARY KEY, -- e.g., 'chronomind_quantum_rescue', 'flappy_brain'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    genre TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Game Progress
CREATE TABLE IF NOT EXISTS public.user_game_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES public.game_metadata(id) ON DELETE CASCADE,
    current_chapter TEXT,
    current_room TEXT,
    game_specific_state JSONB,
    score INT,
    last_played TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, game_id)
);

-- Puzzles Table (Admin-managed)
CREATE TABLE IF NOT EXISTS public.puzzles (
    id TEXT PRIMARY KEY, -- e.g., 'logic_001'
    name TEXT NOT NULL,
    subject TEXT,
    description TEXT,
    base_definition JSONB, -- Base structure or question for AI generation
    max_level INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Puzzle Progress
CREATE TABLE IF NOT EXISTS public.user_puzzle_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    puzzle_id TEXT NOT NULL REFERENCES public.puzzles(id) ON DELETE CASCADE,
    current_level INT DEFAULT 0,
    unlocked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, puzzle_id)
);

-- Game Leaderboard (Separate from main XP leaderboard)
CREATE TABLE IF NOT EXISTS public.game_leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES public.game_metadata(id) ON DELETE CASCADE,
    score INT NOT NULL,
    time_taken_seconds INT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_id) -- Assuming one best entry per user per game
);


-- ========== TRIGGER FUNCTION to copy user details to profiles on new user signup ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), -- Use user_name from provider or part of email
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),      -- Use full_name from provider or part of email
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists to avoid error on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== DATABASE FUNCTION for incrementing leaderboard score ==========
CREATE OR REPLACE FUNCTION public.increment_leaderboard_score(
  p_user_id UUID,
  p_score_increment INT,
  p_period TEXT DEFAULT 'all_time'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.leaderboard_entries (user_id, score, period, last_updated)
  VALUES (p_user_id, p_score_increment, p_period, NOW())
  ON CONFLICT (user_id, period)
  DO UPDATE SET
    score = leaderboard_entries.score + p_score_increment,
    last_updated = NOW();
END;
$$;

-- ========== ROW LEVEL SECURITY (RLS) POLICIES ==========

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neet_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dictionary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculator_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_resolution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_notes_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_assistant_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_requests_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncert_books_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ncert_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_puzzle_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_leaderboard ENABLE ROW LEVEL SECURITY;


-- --- profiles ---
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Note: Profile creation is handled by the trigger on auth.users. No direct INSERT policy needed by users.

-- --- mood_logs ---
DROP POLICY IF EXISTS "Users can manage their own mood logs." ON public.mood_logs;
CREATE POLICY "Users can manage their own mood logs." ON public.mood_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- quizzes ---
DROP POLICY IF EXISTS "Authenticated users can view all quizzes." ON public.quizzes;
CREATE POLICY "Authenticated users can view all quizzes." ON public.quizzes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create quizzes." ON public.quizzes;
CREATE POLICY "Users can create quizzes." ON public.quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL); -- Allows user_id to be their own or NULL for system quizzes

DROP POLICY IF EXISTS "Users can update/delete their own quizzes." ON public.quizzes;
CREATE POLICY "Users can update/delete their own quizzes." ON public.quizzes FOR UPDATE, DELETE TO authenticated USING (auth.uid() = user_id);

-- --- questions ---
DROP POLICY IF EXISTS "Authenticated users can view questions of any quiz." ON public.questions;
CREATE POLICY "Authenticated users can view questions of any quiz." ON public.questions FOR SELECT TO authenticated USING (true);
-- Question CUD operations often tied to quiz ownership or admin roles.
-- For simplicity, allowing authenticated to insert if they know quiz_id. Update/delete should be restricted.
DROP POLICY IF EXISTS "Authenticated users can add questions." ON public.questions;
CREATE POLICY "Authenticated users can add questions." ON public.questions FOR INSERT TO authenticated WITH CHECK (true);
-- Add more specific policies for question update/delete based on quiz ownership if needed.

-- --- saved_questions ---
DROP POLICY IF EXISTS "Users can manage their own saved questions." ON public.saved_questions;
CREATE POLICY "Users can manage their own saved questions." ON public.saved_questions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- quiz_attempts ---
DROP POLICY IF EXISTS "Users can manage their own quiz attempts." ON public.quiz_attempts;
CREATE POLICY "Users can manage their own quiz attempts." ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- study_plans ---
DROP POLICY IF EXISTS "Users can manage their own study plans." ON public.study_plans;
CREATE POLICY "Users can manage their own study plans." ON public.study_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- neet_guidelines ---
DROP POLICY IF EXISTS "Users can manage their own neet guidelines." ON public.neet_guidelines;
CREATE POLICY "Users can manage their own neet guidelines." ON public.neet_guidelines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- activity_logs ---
DROP POLICY IF EXISTS "Users can manage their own activity logs." ON public.activity_logs;
CREATE POLICY "Users can manage their own activity logs." ON public.activity_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- custom_tasks ---
DROP POLICY IF EXISTS "Users can manage their own custom tasks." ON public.custom_tasks;
CREATE POLICY "Users can manage their own custom tasks." ON public.custom_tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- user_files ---
DROP POLICY IF EXISTS "Users can manage their own files." ON public.user_files;
CREATE POLICY "Users can manage their own files." ON public.user_files FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Storage RLS for 'useruploads' bucket:
-- Example: Authenticated users can upload to their own folder:
-- CREATE POLICY "User can upload to their folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'useruploads' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Example: User can view their own files:
-- CREATE POLICY "User can view their own files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'useruploads' AND owner_id = auth.uid());
-- Add delete policy similarly.

-- --- dictionary_history, translation_history, calculator_history ---
DROP POLICY IF EXISTS "Users can manage their own dictionary history." ON public.dictionary_history;
CREATE POLICY "Users can manage their own dictionary history." ON public.dictionary_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own translation history." ON public.translation_history;
CREATE POLICY "Users can manage their own translation history." ON public.translation_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own calculator history." ON public.calculator_history;
CREATE POLICY "Users can manage their own calculator history." ON public.calculator_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- study_rooms ---
DROP POLICY IF EXISTS "Authenticated users can view all study rooms." ON public.study_rooms;
CREATE POLICY "Authenticated users can view all study rooms." ON public.study_rooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create study rooms." ON public.study_rooms;
CREATE POLICY "Authenticated users can create study rooms." ON public.study_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by_user_id);

DROP POLICY IF EXISTS "Owners can update their own study rooms." ON public.study_rooms;
CREATE POLICY "Owners can update their own study rooms." ON public.study_rooms FOR UPDATE TO authenticated USING (auth.uid() = created_by_user_id) WITH CHECK (auth.uid() = created_by_user_id);

DROP POLICY IF EXISTS "Owners can delete their own study rooms." ON public.study_rooms;
CREATE POLICY "Owners can delete their own study rooms." ON public.study_rooms FOR DELETE TO authenticated USING (auth.uid() = created_by_user_id);

-- --- study_room_messages ---
DROP POLICY IF EXISTS "Authenticated users can view messages in any room." ON public.study_room_messages;
CREATE POLICY "Authenticated users can view messages in any room." ON public.study_room_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can send messages." ON public.study_room_messages;
CREATE POLICY "Authenticated users can send messages." ON public.study_room_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update/delete their own messages." ON public.study_room_messages;
CREATE POLICY "Users can update/delete their own messages." ON public.study_room_messages FOR UPDATE, DELETE TO authenticated USING (auth.uid() = user_id);

-- --- doubt_resolution_logs, smart_notes_logs, study_assistant_logs, customization_requests_logs ---
DROP POLICY IF EXISTS "Users can manage their own doubt resolution logs." ON public.doubt_resolution_logs;
CREATE POLICY "Users can manage their own doubt resolution logs." ON public.doubt_resolution_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own smart notes logs." ON public.smart_notes_logs;
CREATE POLICY "Users can manage their own smart notes logs." ON public.smart_notes_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own study assistant logs." ON public.study_assistant_logs;
CREATE POLICY "Users can manage their own study assistant logs." ON public.study_assistant_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own customization requests logs." ON public.customization_requests_logs;
CREATE POLICY "Users can manage their own customization requests logs." ON public.customization_requests_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- missions, badges, ncert_books_metadata, game_metadata, puzzles (Admin content) ---
DROP POLICY IF EXISTS "Authenticated users can view all missions." ON public.missions;
CREATE POLICY "Authenticated users can view all missions." ON public.missions FOR SELECT TO authenticated USING (true);
-- CUD for missions should be admin-only in a real app. For now, allow authenticated.
DROP POLICY IF EXISTS "Authenticated users can manage missions." ON public.missions;
CREATE POLICY "Authenticated users can manage missions." ON public.missions FOR INSERT, UPDATE, DELETE TO authenticated USING (true); -- SIMPLIFIED: Needs admin role

DROP POLICY IF EXISTS "Authenticated users can view all badges." ON public.badges;
CREATE POLICY "Authenticated users can view all badges." ON public.badges FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage badges." ON public.badges;
CREATE POLICY "Authenticated users can manage badges." ON public.badges FOR INSERT, UPDATE, DELETE TO authenticated USING (true); -- SIMPLIFIED: Needs admin role

DROP POLICY IF EXISTS "Authenticated users can view all ncert books metadata." ON public.ncert_books_metadata;
CREATE POLICY "Authenticated users can view all ncert books metadata." ON public.ncert_books_metadata FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage ncert_books_metadata." ON public.ncert_books_metadata;
CREATE POLICY "Authenticated users can manage ncert_books_metadata." ON public.ncert_books_metadata FOR INSERT, UPDATE, DELETE TO authenticated USING (true); -- SIMPLIFIED

DROP POLICY IF EXISTS "Authenticated users can view all game metadata." ON public.game_metadata;
CREATE POLICY "Authenticated users can view all game metadata." ON public.game_metadata FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage game_metadata." ON public.game_metadata;
CREATE POLICY "Authenticated users can manage game_metadata." ON public.game_metadata FOR INSERT, UPDATE, DELETE TO authenticated USING (true); -- SIMPLIFIED

DROP POLICY IF EXISTS "Authenticated users can view all puzzles." ON public.puzzles;
CREATE POLICY "Authenticated users can view all puzzles." ON public.puzzles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can manage puzzles." ON public.puzzles;
CREATE POLICY "Authenticated users can manage puzzles." ON public.puzzles FOR INSERT, UPDATE, DELETE TO authenticated USING (true); -- SIMPLIFIED


-- --- user_missions ---
DROP POLICY IF EXISTS "Users can manage their own mission progress." ON public.user_missions;
CREATE POLICY "Users can manage their own mission progress." ON public.user_missions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- user_badges ---
DROP POLICY IF EXISTS "Users can manage their own badges." ON public.user_badges;
CREATE POLICY "Users can manage their own badges." ON public.user_badges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- leaderboard_entries ---
DROP POLICY IF EXISTS "Authenticated users can view leaderboard." ON public.leaderboard_entries;
CREATE POLICY "Authenticated users can view leaderboard." ON public.leaderboard_entries FOR SELECT TO authenticated USING (true);
-- Updates are handled by the increment_leaderboard_score function.

-- --- user_ncert_notes ---
DROP POLICY IF EXISTS "Users can manage their own ncert notes." ON public.user_ncert_notes;
CREATE POLICY "Users can manage their own ncert notes." ON public.user_ncert_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- user_game_progress ---
DROP POLICY IF EXISTS "Users can manage their own game progress." ON public.user_game_progress;
CREATE POLICY "Users can manage their own game progress." ON public.user_game_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- user_puzzle_progress ---
DROP POLICY IF EXISTS "Users can manage their own puzzle progress." ON public.user_puzzle_progress;
CREATE POLICY "Users can manage their own puzzle progress." ON public.user_puzzle_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- --- game_leaderboard ---
DROP POLICY IF EXISTS "Authenticated users can view game leaderboard." ON public.game_leaderboard;
CREATE POLICY "Authenticated users can view game leaderboard." ON public.game_leaderboard FOR SELECT TO authenticated USING (true);
-- Game leaderboard updates would typically be handled by functions or triggers after game completion.
DROP POLICY IF EXISTS "Users can submit their own game scores." ON public.game_leaderboard;
CREATE POLICY "Users can submit their own game scores." ON public.game_leaderboard FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own game scores (if better)." ON public.game_leaderboard;
CREATE POLICY "Users can update their own game scores (if better)." ON public.game_leaderboard FOR UPDATE TO authenticated USING (auth.uid() = user_id); -- Add WITH CHECK for score logic if needed


-- ========== REALTIME SUBSCRIPTIONS (Example for study_room_messages) ==========
-- Ensure the supabase_admin user (or the role used by PostgREST) has REPLICATION rights.
-- You might need to run this in the Supabase SQL editor under a privileged user.
-- ALTER USER supabase_admin WITH REPLICATION; -- (If not already set)

BEGIN;
  -- remove the supabase_realtime publication
  DROP PUBLICATION IF EXISTS supabase_realtime;
  -- re-create the supabase_realtime publication with no tables
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms; -- If you want realtime updates for room list too
-- Add other tables as needed
    