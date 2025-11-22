-- Add target_weight column to quiz_responses table
ALTER TABLE public.quiz_responses 
ADD COLUMN target_weight numeric;