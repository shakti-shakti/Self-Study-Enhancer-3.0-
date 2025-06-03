
-- Attempt to drop an existing foreign key constraint if it's misconfigured.
-- This command might fail if the constraint doesn't exist or has a different name, which is fine.
ALTER TABLE public.leaderboard_entries
DROP CONSTRAINT IF EXISTS leaderboard_entries_user_id_fkey;

-- Add the correct foreign key constraint.
-- This ensures that leaderboard_entries.user_id references profiles.id.
ALTER TABLE public.leaderboard_entries
ADD CONSTRAINT leaderboard_entries_user_id_fkey FOREIGN KEY (user_id)
REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Add RLS policy for selfie-attendances bucket to allow authenticated users to delete their own files.
-- This assumes file paths are like: {user_id}/{file_name}
-- You might need to adjust if your file path structure is different.
-- Policy for DELETING objects
CREATE POLICY "Authenticated users can delete their own selfies"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'selfie-attendances' AND
  auth.uid() = (storage.foldername(name))[1] -- Check ownership based on the first folder in the path
);

-- If you don't have a delete policy for user-uploads or doubt-resolver-images, you might need similar:
-- For user-uploads
CREATE POLICY "Authenticated users can delete their own user-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  auth.uid() = (storage.foldername(name))[1]
);

-- For doubt-resolver-images
CREATE POLICY "Authenticated users can delete their own doubt-resolver-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'doubt-resolver-images' AND
  auth.uid() = (storage.foldername(name))[1]
);
