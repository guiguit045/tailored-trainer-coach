-- Add DELETE policy for profiles table
-- This allows users to delete their own profile data, respecting privacy rights
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);