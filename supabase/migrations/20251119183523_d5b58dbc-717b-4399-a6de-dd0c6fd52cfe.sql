-- Create meal_completions table
CREATE TABLE public.meal_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_date DATE NOT NULL,
  meal_index INTEGER NOT NULL CHECK (meal_index >= 0 AND meal_index <= 3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, meal_date, meal_index)
);

-- Enable RLS
ALTER TABLE public.meal_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own meal completions"
ON public.meal_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal completions"
ON public.meal_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal completions"
ON public.meal_completions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_meal_completions_user_date ON public.meal_completions(user_id, meal_date);