-- Add foreign key constraint with CASCADE DELETE to water_intake table
ALTER TABLE water_intake
DROP CONSTRAINT IF EXISTS water_intake_user_id_fkey;

ALTER TABLE water_intake
ADD CONSTRAINT water_intake_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add foreign key constraint with CASCADE DELETE to body_weight_logs table
ALTER TABLE body_weight_logs
DROP CONSTRAINT IF EXISTS body_weight_logs_user_id_fkey;

ALTER TABLE body_weight_logs
ADD CONSTRAINT body_weight_logs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add foreign key constraint with CASCADE DELETE to consumed_meals table
ALTER TABLE consumed_meals
DROP CONSTRAINT IF EXISTS consumed_meals_user_id_fkey;

ALTER TABLE consumed_meals
ADD CONSTRAINT consumed_meals_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Add foreign key constraint with CASCADE DELETE to user_goals table
ALTER TABLE user_goals
DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey;

ALTER TABLE user_goals
ADD CONSTRAINT user_goals_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;