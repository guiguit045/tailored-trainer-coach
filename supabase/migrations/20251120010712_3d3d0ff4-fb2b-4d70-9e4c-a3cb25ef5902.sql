-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for tracking consumed meals
CREATE TABLE public.consumed_meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_name TEXT,
  calories INTEGER NOT NULL,
  carbs INTEGER,
  protein INTEGER,
  fat INTEGER,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consumed_meals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own consumed meals"
ON public.consumed_meals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumed meals"
ON public.consumed_meals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consumed meals"
ON public.consumed_meals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consumed meals"
ON public.consumed_meals
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_consumed_meals_updated_at
BEFORE UPDATE ON public.consumed_meals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();