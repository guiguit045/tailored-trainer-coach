-- Create water_intake table to track daily water consumption
CREATE TABLE public.water_intake (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intake_date DATE NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own water intake" 
ON public.water_intake 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water intake" 
ON public.water_intake 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water intake" 
ON public.water_intake 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create unique constraint to ensure one record per user per day
CREATE UNIQUE INDEX water_intake_user_date_idx ON public.water_intake(user_id, intake_date);