-- Add missing INSERT policy for profiles table
-- This allows new users to create their own profile during registration
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);