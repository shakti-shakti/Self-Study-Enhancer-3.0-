
-- Ensure Row Level Security is enabled on the tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for quizzes table (names are from previous schema, adjust if different)
DROP POLICY IF EXISTS "Allow authenticated users to CRUD their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Allow authenticated users to read all quizzes" ON public.quizzes;

-- Drop existing policies for leaderboard_entries table (names are from previous schema, adjust if different)
DROP POLICY IF EXISTS "Allow public read access to leaderboard" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Allow authenticated users to increment their own score (via function)" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Allow service_role to manage leaderboard entries" ON public.leaderboard_entries;

-- Create new permissive RLS policy for quizzes table
-- WARNING: This allows ANY public user (including unauthenticated if anon key is used) full access.
CREATE POLICY "Permissive: Allow ALL access to quizzes"
ON public.quizzes
FOR ALL
TO public -- 'public' role includes authenticated and anon if anon key is used
USING (true)
WITH CHECK (true);

-- Create new permissive RLS policy for leaderboard_entries table
-- WARNING: This allows ANY public user full access.
CREATE POLICY "Permissive: Allow ALL access to leaderboard_entries"
ON public.leaderboard_entries
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Storage bucket 'selfie-attendances' RLS policies
-- WARNING: These policies make the 'selfie-attendances' bucket publicly accessible for all operations.
-- Before applying these, it's best to manually remove any existing, more restrictive policies
-- on the 'selfie-attendances' bucket via the Supabase Studio dashboard to avoid conflicts.

-- Policy to allow public inserts into the 'selfie-attendances' bucket
CREATE POLICY "Permissive: Allow public insert to selfie-attendances"
ON storage.objects FOR INSERT
TO public -- Granting to 'public' role
WITH CHECK (bucket_id = 'selfie-attendances');

-- Policy to allow public selects from the 'selfie-attendances' bucket
CREATE POLICY "Permissive: Allow public select from selfie-attendances"
ON storage.objects FOR SELECT
TO public -- Granting to 'public' role
USING (bucket_id = 'selfie-attendances');

-- Policy to allow public updates in the 'selfie-attendances' bucket
CREATE POLICY "Permissive: Allow public update in selfie-attendances"
ON storage.objects FOR UPDATE
TO public -- Granting to 'public' role
USING (bucket_id = 'selfie-attendances');

-- Policy to allow public deletes from the 'selfie-attendances' bucket
CREATE POLICY "Permissive: Allow public delete from selfie-attendances"
ON storage.objects FOR DELETE
TO public -- Granting to 'public' role
USING (bucket_id = 'selfie-attendances');

-- Note: If you have other policies on these tables/bucket, you might need to drop them by their specific names.
-- You can list existing policies in Supabase Studio or using psql.
-- Example to list policies for a table:
-- SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'your_table_name';
-- For storage, policies are managed in the Supabase Studio dashboard under Storage > Policies for the bucket.
