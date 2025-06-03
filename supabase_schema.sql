
-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema "extensions";

-- Profiles Table to store public user data
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,
  username text unique,
  class_level text,
  target_year integer,
  theme text default 'dark',
  alarm_tone_url text,
  custom_countdown_event_name text,
  custom_countdown_target_date date,
  dataAiHint text, -- For avatar image AI hint
  focus_coins integer default 0 not null,
  xp integer default 0 not null,
  owned_content_ids text[] default '{}'::text[], -- For puzzles, story chapters
  owned_store_items text[] default '{}'::text[], -- For store purchases
  unlocked_achievement_ids text[] default '{}'::text[] -- For achievements
);
alter table profiles enable row level security;
create policy "Profiles are viewable by authenticated users." on profiles for select using (auth.role() = 'authenticated');
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Mood Logs Table
create table if not exists mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  mood text not null,
  focus_level integer not null check (focus_level >= 0 and focus_level <= 10),
  suggestions text[]
);
alter table mood_logs enable row level security;
create policy "Users can manage their own mood logs" on mood_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Quizzes Table
create table if not exists quizzes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null, -- Made NOT NULL
  class_level text,
  subject text,
  topic text, -- Main topic display string
  topics text[], -- For finer-grained topic tagging
  question_source text,
  difficulty text not null,
  num_questions integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table quizzes enable row level security;
create policy "Users can manage their own quizzes" on quizzes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Questions Table
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid references quizzes(id) on delete cascade,
  question_text text not null,
  options jsonb not null, -- Store options as an array of strings
  correct_option_index integer not null,
  explanation_prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  class_level text,
  subject text,
  topic text,
  source text,
  neet_syllabus_year integer
);
alter table questions enable row level security;
create policy "Questions are viewable if quiz is accessible"
  on questions for select
  using (
    exists (
      select 1 from quizzes q
      where q.id = quiz_id and (q.user_id = auth.uid() or q.user_id is null) -- Assuming null user_id means public quiz
    )
  );
-- Allow insert/update/delete by quiz owner (consider if questions should be immutable after quiz creation by user)
create policy "Quiz owners can manage questions for their quizzes"
  on questions for all
  using (
    auth.uid() = (select user_id from quizzes where id = quiz_id)
  )
  with check (
    auth.uid() = (select user_id from quizzes where id = quiz_id)
  );


-- Saved Questions Table
create table if not exists saved_questions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    question_id uuid references questions(id) on delete set null, -- Keep saved even if original is deleted
    question_text text not null,
    options jsonb not null,
    correct_option_index integer not null,
    explanation_prompt text,
    class_level text,
    subject text,
    topic text,
    source text,
    saved_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint uq_user_question unique (user_id, question_id) -- User can save a specific question only once
);
alter table saved_questions enable row level security;
create policy "Users can manage their own saved questions" on saved_questions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Quiz Attempts Table
create table if not exists quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  quiz_id uuid references quizzes(id) on delete cascade not null,
  score integer not null,
  total_questions integer not null,
  answers_submitted jsonb, -- Store as {"question_id": "selected_option_index", ...}
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table quiz_attempts enable row level security;
create policy "Users can manage their own quiz attempts" on quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Study Plans Table
create table if not exists study_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone,
  duration_minutes integer,
  due_date timestamp with time zone not null,
  completed boolean default false not null,
  subject text,
  class_level text, -- '11' or '12'
  plan_type text not null, -- 'day_task', 'month_subject_task', 'year_goal', 'revision', 'exam'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  alarm_set_at timestamp with time zone
);
alter table study_plans enable row level security;
create policy "Users can manage their own study plans" on study_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- NEET Guidelines Table
create table if not exists neet_guidelines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tab_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table neet_guidelines enable row level security;
create policy "Users can manage their own guidelines" on neet_guidelines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activity Logs Table
create table if not exists activity_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  activity_type text not null,
  description text not null,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table activity_logs enable row level security;
create policy "Users can manage their own activity logs" on activity_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Custom Tasks (non-academic) Table
create table if not exists custom_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date,
  completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table custom_tasks enable row level security;
create policy "Users can manage their own custom tasks" on custom_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- User Files Table
create table if not exists user_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null,
  file_path text not null unique, -- Path in Supabase Storage
  file_type text not null,
  size_bytes bigint not null,
  description text,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table user_files enable row level security;
create policy "Users can manage their own files" on user_files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Dictionary History Table
create table if not exists dictionary_history (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    word text not null,
    definition text not null,
    searched_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table dictionary_history enable row level security;
create policy "Users can manage their own dictionary history" on dictionary_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Translation History Table
create table if not exists translation_history (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    original_text text not null,
    translated_text text not null,
    source_language text not null,
    target_language text not null,
    translated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table translation_history enable row level security;
create policy "Users can manage their own translation history" on translation_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Calculator History Table
create table if not exists calculator_history (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    expression text not null,
    result text not null,
    calculated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table calculator_history enable row level security;
create policy "Users can manage their own calculator history" on calculator_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Study Rooms Table
create table if not exists study_rooms (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    topic text,
    created_by_user_id uuid references auth.users(id) on delete set null not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table study_rooms enable row level security;
create policy "Study rooms are viewable by all authenticated users" on study_rooms for select using (auth.role() = 'authenticated');
create policy "Users can create study rooms" on study_rooms for insert with check (auth.uid() = created_by_user_id);
create policy "Room creators can update their rooms" on study_rooms for update using (auth.uid() = created_by_user_id);
create policy "Room creators can delete their rooms" on study_rooms for delete using (auth.uid() = created_by_user_id);


-- Study Room Messages Table
create table if not exists study_room_messages (
    id uuid primary key default uuid_generate_v4(),
    room_id uuid references study_rooms(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    message_text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table study_room_messages enable row level security;
create policy "Messages are viewable by authenticated users" on study_room_messages for select using (auth.role() = 'authenticated');
create policy "Users can send messages in rooms" on study_room_messages for insert with check (auth.uid() = user_id);
-- Add policy for message deletion if needed (e.g., sender can delete, or room creator can delete)

-- Doubt Resolution Logs Table
create table if not exists doubt_resolution_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null, -- Made NOT NULL
    question_image_storage_path text, -- Storing path from storage instead of Data URI
    explanation text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table doubt_resolution_logs enable row level security;
create policy "Users can manage their own doubt logs" on doubt_resolution_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Smart Notes Logs Table
create table if not exists smart_notes_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    content_type text not null,
    original_content_preview text, -- Storing only a preview
    generated_notes text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table smart_notes_logs enable row level security;
create policy "Users can manage their own smart notes logs" on smart_notes_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Study Assistant Logs (Chat History) Table
create table if not exists study_assistant_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    session_id uuid not null,
    role text not null check (role in ('user', 'ai', 'ai-tips')),
    query text, -- The user's initial query for an AI turn
    content text not null, -- For user: their message. For AI: answer/tips combined or just answer.
    ai_answer text, -- Specific AI answer part
    ai_study_tips jsonb, -- Array of strings for tips
    context text,
    preferences text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table study_assistant_logs enable row level security;
create policy "Users can manage their own study assistant logs" on study_assistant_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Customization Request Logs Table
create table if not exists customization_requests_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    command text not null,
    ai_instruction text,
    ai_explanation text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table customization_requests_logs enable row level security;
create policy "Users can manage their own customization logs" on customization_requests_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- Badges Table (Admin/Seed Data)
create table if not exists badges (
  id text primary key, -- E.g., "quiz_master_1", "physics_champ"
  name text not null,
  description text not null,
  icon_name_or_url text not null, -- Could be a Lucide icon name or a URL
  criteria text not null, -- Textual description of how to earn
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table badges enable row level security;
create policy "Badges are publicly viewable" on badges for select using (true);
-- Restrict insert/update/delete to admin roles in Supabase dashboard

-- User Badges Table (Junction Table)
create table if not exists user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_id text references badges(id) on delete cascade not null,
  earned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, badge_id)
);
alter table user_badges enable row level security;
create policy "Users can view their own earned badges" on user_badges for select using (auth.uid() = user_id);
-- Insert typically handled by triggers or server-side logic based on achievements

-- Missions Table (Admin/Seed Data)
create table if not exists missions (
  id text primary key, -- E.g., "daily_quiz_5", "weekly_physics_streak"
  title text not null,
  description text not null,
  mission_type text not null check (mission_type in ('daily', 'weekly')), -- 'daily', 'weekly', 'special'
  reward_points integer not null default 10,
  badge_id_reward text references badges(id) on delete set null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  target_value integer not null default 1, -- e.g., complete 5 quizzes, study for 60 minutes
  criteria_type text not null -- e.g., 'quiz_completed', 'study_duration_minutes', 'subject_accuracy_physics'
);
alter table missions enable row level security;
create policy "Missions are publicly viewable" on missions for select using (true);
-- Restrict insert/update/delete to admin roles

-- User Missions Table
create table if not exists user_missions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  mission_id text references missions(id) on delete cascade not null,
  status text not null default 'active' check (status in ('locked', 'active', 'completed', 'failed')),
  current_progress integer not null default 0,
  completed_at timestamp with time zone,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, mission_id)
);
alter table user_missions enable row level security;
create policy "Users can manage their own mission progress" on user_missions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leaderboard Entries Table
create table if not exists leaderboard_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) not null, -- FK to profiles.id
  score integer not null default 0,
  rank integer,
  period text not null check (period in ('daily', 'weekly', 'all_time')), -- 'daily', 'weekly', 'all_time'
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, period)
);
alter table leaderboard_entries enable row level security;
create policy "Leaderboard is publicly viewable" on leaderboard_entries for select using (true);
-- Restrict DML to a secure function or admin roles.

-- NCERT Books Metadata (Admin/Seed Data)
create table if not exists ncert_books_metadata (
  id text primary key, -- E.g., "phy11_1"
  class_level text not null,
  subject text not null,
  book_name text not null,
  chapters jsonb not null, -- Array of {name: "Chapter Name", pdf_filename: "filename.pdf"}
  cover_image_url text,
  dataAiHint text -- For cover image AI hint
);
alter table ncert_books_metadata enable row level security;
create policy "NCERT book metadata is publicly viewable" on ncert_books_metadata for select using (true);
-- Restrict DML to admin roles

-- User NCERT Notes
create table if not exists user_ncert_notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id text references ncert_books_metadata(id) on delete cascade not null,
  chapter_name text not null,
  page_number integer,
  note_content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table user_ncert_notes enable row level security;
create policy "Users can manage their own NCERT notes" on user_ncert_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Game Metadata (Admin/Seed Data)
create table if not exists game_metadata (
  id text primary key, -- e.g., "chronomind_quantum_rescue", "neet_lab_escape"
  title text not null,
  description text not null,
  genre text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table game_metadata enable row level security;
create policy "Game metadata is publicly viewable" on game_metadata for select using (true);

-- User Game Progress
create table if not exists user_game_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  game_id text references game_metadata(id) on delete cascade not null,
  current_chapter text,
  current_room text,
  game_specific_state jsonb,
  score integer,
  last_played timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique(user_id, game_id)
);
alter table user_game_progress enable row level security;
create policy "Users can manage their own game progress" on user_game_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Game Leaderboard (Simplified for now)
create table if not exists game_leaderboard (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    game_id text references game_metadata(id) on delete cascade not null,
    score integer not null,
    time_taken_seconds integer, -- Optional: time to complete
    completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, game_id) -- Assuming one top score per user per game on this board
);
alter table game_leaderboard enable row level security;
create policy "Game leaderboards are publicly viewable" on game_leaderboard for select using (true);
-- DML typically handled by game completion logic / secure function

-- Puzzles Table (Admin-defined)
create table if not exists puzzles (
 id text primary key, -- e.g., "logic_001", "math_phy_002"
 name text not null,
 subject text,
 category text not null,
 description text,
 base_definition jsonb, -- Contains type and original_data for level 1
 max_level integer not null default 1,
 default_xp_award integer not null default 10,
 created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table puzzles enable row level security;
create policy "Puzzles are publicly viewable" on puzzles for select using (true);

-- User Puzzle Progress Table
create table if not exists user_puzzle_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  puzzle_id text references puzzles(id) on delete cascade not null,
  current_level integer not null default 1,
  unlocked_at timestamp with time zone, -- When user first unlocked/accessed this puzzle
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone, -- When all levels of this puzzle are completed
  unique(user_id, puzzle_id)
);
alter table user_puzzle_progress enable row level security;
create policy "Users can manage their own puzzle progress" on user_puzzle_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Spin History Table for Rewards Wheel
create table if not exists spin_history (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    reward_name text not null,
    reward_type text not null,
    reward_value text, -- Storing as text for flexibility (e.g., 'theme_ocean', '10')
    spun_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table spin_history enable row level security;
create policy "Users can view their own spin history" on spin_history for select using (auth.uid() = user_id);
create policy "Users can insert their own spin history" on spin_history for insert with check (auth.uid() = user_id);


-- Function to increment leaderboard score
create or replace function increment_leaderboard_score(
  p_user_id uuid,
  p_score_increment integer,
  p_period text
)
returns void
language plpgsql
security definer -- Important: run with elevated privileges
as $$
begin
  insert into leaderboard_entries (user_id, score, period, last_updated)
  values (p_user_id, p_score_increment, p_period, now())
  on conflict (user_id, period)
  do update set
    score = leaderboard_entries.score + p_score_increment,
    last_updated = now();
end;
$$;

-- Insert game metadata for all games
INSERT INTO game_metadata (id, title, description, genre) VALUES
('chronomind_quantum_rescue', 'ChronoMind: The Quantum Rescue', 'Escape a collapsing multiverse by solving ultra-logical NEET-based challenges.', 'Sci-fi Puzzle Escape + NEET Prep')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('neet_lab_escape', 'The NEET Lab Escape', 'Escape a locked NEET preparation lab by solving hidden, sequential puzzles in each subject room.', 'Classic Escape Room + Quiz Thriller')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('flappy_brain', 'Flappy Brain', 'Navigate the brainy bird through conceptual pipes! Advanced version with increasing difficulty.', 'Arcade Reflex Game')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('dino_run', 'Dino Run', 'Classic T-Rex runner game. Jump over obstacles!', 'Arcade Reflex Game')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('guess_the_number', 'Guess the Number', 'A classic number guessing game. The AI thinks of a number, and you try to guess it with hints.', 'Logic / Number Game')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('science_trivia_challenge', 'Science Trivia Challenge', 'Test your general science knowledge with rapid-fire trivia questions across Physics, Chemistry, and Biology.', 'Trivia / Quiz')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('element_match_memory', 'Element Match Memory', 'A memory game where you match chemical elements to their symbols or properties.', 'Memory / Educational')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('memory_match', 'Memory Match Challenge', 'Test your memory! Flip cards and find matching pairs.', 'Puzzle / Memory Game')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('2048_puzzle', '2048 Puzzle Challenge', 'Slide tiles and combine matching numbers to reach the 2048 tile.', 'Puzzle / Number Game')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('whack_a_mole', 'Whack-a-Mole', 'Test your reaction time! Whack the moles as they pop up.', 'Arcade / Reaction Game')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('tic_tac_toe', 'Tic Tac Toe', 'Classic Xs and Os. Play against a friend or the (basic) computer.', 'Strategy / Board Game')
ON CONFLICT (id) DO NOTHING;

INSERT INTO game_metadata (id, title, description, genre) VALUES
('snake_game', 'Snake Game', 'Classic Snake game. Grow your snake by eating food.', 'Arcade / Classic')
ON CONFLICT (id) DO NOTHING;


-- Seed initial puzzles from puzzle-data.ts (example for a few)
-- Make sure to adapt this if your puzzle-data.ts structure changes
-- This is a manual step. For a large number of puzzles, consider a script.
INSERT INTO puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('word_001', 'Anagram Hunt (Science)', NULL, 'Word Puzzles', 'Unscramble these NEET-related terms.', '{"type": "anagram", "original_data": {"words": [{"scrambled": "HPOYSCIT", "category": "Physics"}, {"scrambled": "GEBYOOLI", "category": "Biology"}, {"scrambled": "HRTYSMICE", "category": "Chemistry"}]}}', 30, 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('logic_004', 'The Missing Symbol', NULL, 'Logic Puzzles', 'Find the logical operator that completes the equation: 10 ? 2 = 5', '{"type": "missing_symbol", "original_data": {"equationParts": ["10", "2", "5"], "operators": ["+", "-", "*", "/"]}}', 30, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('math_001', 'The Sequence Solver', NULL, 'Mathematical Challenges', 'Find the next number in this sequence: 1, 1, 2, 3, 5, 8, ?', '{"type": "sequence_solver", "original_data": {"sequence": "1, 1, 2, 3, 5, 8", "displaySequence": "1, 1, 2, 3, 5, 8, ?"}}', 30, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('logic_002', 'Knights and Knaves', NULL, 'Logic Puzzles', 'Two islanders, A and B, stand before you. A says, "At least one of us is a Knave." B says nothing. Determine who is a Knight (always tells truth) and who is a Knave (always lies).', '{"type": "knights_knaves", "original_data": {"characters": ["A", "B"], "statements": {"A": "At least one of us is a Knave."}}}', 30, 25)
ON CONFLICT (id) DO NOTHING;

INSERT INTO puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('creative_001', 'Alternative Uses', NULL, 'Creative Conundrums', 'List as many alternative uses for a common paperclip as you can in 2 minutes (conceptual time limit).', '{"type": "alternative_uses", "original_data": {"item": "a common paperclip"}}', 30, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('conceptual_phy_001', 'Vector Voyage', 'Physics', 'Conceptual Puzzles (NEET Focus)', 'A ship sails 3km East, then 4km North. What is its displacement (magnitude and direction)?', '{"type": "vector_voyage", "original_data": {}}', 30, 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('word_004', 'Missing Vowels (Chemistry)', 'Chemistry', 'Word Puzzles', 'Fill in the missing vowels for these common chemical compound names.', '{"type": "missing_vowels", "original_data": {"words": [{"gapped": "S_LF_R_C _C_D", "category": "Acid"}, {"gapped": "P_T_SS__M P_RM_NG_N_T_", "category": "Salt"}, {"gapped": "_TH_N_L", "category": "Alcohol"}]}}', 30, 15)
ON CONFLICT (id) DO NOTHING;

INSERT INTO puzzles (id, name, subject, category, description, base_definition, max_level, default_xp_award) VALUES
('visual_001', 'Spot the Difference', NULL, 'Visual Puzzles', 'Placeholder images are shown. Imagine finding differences. How many differences are there if there are 3? (Conceptual)', '{"type": "placeholder_input", "original_data": {"image1": "https://placehold.co/400x300/E0E0E0/666666.png?text=Image+A", "image2": "https://placehold.co/400x300/DCDCDC/555555.png?text=Image+B+(Spot+3+Diff)", "prompt": "Enter the number of differences you find (Hint: it''s 3 for this demo)."}}', 30, 10)
ON CONFLICT (id) DO NOTHING;

-- Add more puzzle inserts here based on your puzzle-data.ts

-- Ensure policies for Storage buckets if not already handled by UI:
-- Example: selfie-attendances bucket
-- ( (bucket_id = 'selfie-attendances') AND ((auth.uid())::text = (storage.foldername(name))[1]) ) -- For user-specific folders

-- Ensure policies for Storage buckets:
-- selfie-attendances: Users can upload to their own folder, read their own.
-- doubt-resolver-images: Users can upload to their own folder, read their own.
-- user-uploads: Users can upload to their own folder, read/delete their own.
-- (alarm-tones will be admin-uploaded for now, or use a simple public bucket if users can choose from a predefined list served from /public)

-- Example RLS for a bucket named 'user-uploads' where files are stored in user_id subfolders:
-- For SELECT: (bucket_id = 'user-uploads' AND auth.uid() = (storage.foldername(name))[1])
-- For INSERT: (bucket_id = 'user-uploads' AND auth.uid() = (storage.foldername(name))[1])
-- For UPDATE: (bucket_id = 'user-uploads' AND auth.uid() = (storage.foldername(name))[1])
-- For DELETE: (bucket_id = 'user-uploads' AND auth.uid() = (storage.foldername(name))[1])


-- Enable HTTP extension if you plan to use webhooks or external API calls from PL/pgSQL
-- create extension if not exists http with schema extensions;


-- After running this schema, you should go to Supabase Studio:
-- 1. Authentication -> Policies: Verify RLS policies are active for each table.
-- 2. Storage: Create the buckets: selfie-attendances, doubt-resolver-images, user-uploads.
--    For each bucket, set up appropriate access policies. For example, for 'selfie-attendances':
--    - Target roles: authenticated
--    - Allowed operations: SELECT, INSERT
--    - USING expression (for SELECT): auth.uid() = (storage.foldername(name))[1]  -- Assuming files are in /<user_id>/filename.png
--    - WITH CHECK expression (for INSERT): auth.uid() = (storage.foldername(name))[1]
-- 3. Database -> Functions: Deploy the Edge Functions (fetch_puzzle_for_level, submit_puzzle_solution).
-- 4. API -> Settings: Ensure your API URL and anon key are correctly in your Next.js app's environment variables.

