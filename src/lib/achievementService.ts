import { supabase } from "@/integrations/supabase/client";
import { getEffectiveDate } from "./dateUtils";
import { subDays, format } from "date-fns";

export type AchievementType = 
  | "water_streak_7"
  | "calorie_streak_7" 
  | "workout_streak_7"
  | "first_workout"
  | "first_meal"
  | "water_goal_first";

export interface Achievement {
  id: string;
  achievement_type: AchievementType;
  unlocked_at: string;
  title: string;
  description: string;
  icon: string;
}

const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, { title: string; description: string; icon: string }> = {
  water_streak_7: {
    title: "Hidratação Perfeita",
    description: "7 dias consecutivos batendo a meta de água",
    icon: "💧"
  },
  calorie_streak_7: {
    title: "Disciplina Alimentar",
    description: "7 dias consecutivos dentro da meta de calorias",
    icon: "🍎"
  },
  workout_streak_7: {
    title: "Guerreiro Fitness",
    description: "7 dias consecutivos de treino",
    icon: "💪"
  },
  first_workout: {
    title: "Primeiro Treino",
    description: "Completou seu primeiro treino",
    icon: "🎯"
  },
  first_meal: {
    title: "Primeira Refeição",
    description: "Registrou sua primeira refeição",
    icon: "🍽️"
  },
  water_goal_first: {
    title: "Primeira Hidratação",
    description: "Bateu a meta de água pela primeira vez",
    icon: "💦"
  }
};

/**
 * Check if user has unlocked a specific achievement
 */
export async function hasAchievement(achievementType: AchievementType): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("achievements")
    .select("id")
    .eq("user_id", user.id)
    .eq("achievement_type", achievementType)
    .single();

  return !!data;
}

/**
 * Unlock an achievement for the user
 */
export async function unlockAchievement(achievementType: AchievementType): Promise<Achievement | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if already unlocked
  const alreadyUnlocked = await hasAchievement(achievementType);
  if (alreadyUnlocked) return null;

  // Insert new achievement
  const { data, error } = await supabase
    .from("achievements")
    .insert({
      user_id: user.id,
      achievement_type: achievementType
    })
    .select()
    .single();

  if (error || !data) return null;

  const definition = ACHIEVEMENT_DEFINITIONS[achievementType];
  return {
    id: data.id,
    achievement_type: achievementType,
    unlocked_at: data.unlocked_at,
    ...definition
  };
}

/**
 * Get all achievements for current user
 */
export async function getUserAchievements(): Promise<Achievement[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false });

  if (!data) return [];

  return data.map(achievement => {
    const type = achievement.achievement_type as AchievementType;
    return {
      id: achievement.id,
      achievement_type: type,
      unlocked_at: achievement.unlocked_at,
      ...ACHIEVEMENT_DEFINITIONS[type]
    };
  });
}

/**
 * Check and unlock water streak achievement (7 days)
 */
export async function checkWaterStreakAchievement(): Promise<Achievement | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if already unlocked
  if (await hasAchievement("water_streak_7")) return null;

  // Get user's water goal
  const { data: goalData } = await supabase
    .from("user_goals")
    .select("daily_water_goal_ml")
    .eq("user_id", user.id)
    .single();

  const waterGoal = goalData?.daily_water_goal_ml || 2000;

  // Check last 7 days
  const today = getEffectiveDate();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(today), i);
    return format(date, 'yyyy-MM-dd');
  });

  // Get water intake for last 7 days
  const { data: waterData } = await supabase
    .from("water_intake")
    .select("intake_date, amount_ml")
    .eq("user_id", user.id)
    .in("intake_date", dates);

  if (!waterData || waterData.length < 7) return null;

  // Check if all 7 days met the goal
  const allDaysMet = dates.every(date => {
    const dayData = waterData.find(w => w.intake_date === date);
    return dayData && dayData.amount_ml >= waterGoal;
  });

  if (allDaysMet) {
    return await unlockAchievement("water_streak_7");
  }

  return null;
}

/**
 * Check and unlock calorie streak achievement (7 days)
 */
export async function checkCalorieStreakAchievement(): Promise<Achievement | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if already unlocked
  if (await hasAchievement("calorie_streak_7")) return null;

  // Get user's calorie goal
  const { data: goalData } = await supabase
    .from("user_goals")
    .select("daily_calorie_goal")
    .eq("user_id", user.id)
    .single();

  const calorieGoal = goalData?.daily_calorie_goal || 2000;
  const tolerance = calorieGoal * 0.1; // 10% tolerance

  // Check last 7 days
  const today = getEffectiveDate();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(today), i);
    return format(date, 'yyyy-MM-dd');
  });

  // Get consumed meals for last 7 days
  const { data: mealData } = await supabase
    .from("consumed_meals")
    .select("meal_date, calories")
    .eq("user_id", user.id)
    .in("meal_date", dates);

  if (!mealData) return null;

  // Calculate daily totals
  const dailyTotals = dates.map(date => {
    const dayMeals = mealData.filter(m => m.meal_date === date);
    return dayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  });

  // Check if all 7 days met the goal (within tolerance)
  const allDaysMet = dailyTotals.every(total => 
    total >= (calorieGoal - tolerance) && total <= (calorieGoal + tolerance)
  );

  if (allDaysMet && dailyTotals.length === 7) {
    return await unlockAchievement("calorie_streak_7");
  }

  return null;
}

/**
 * Check and unlock workout streak achievement (7 days)
 */
export async function checkWorkoutStreakAchievement(currentStreak: number): Promise<Achievement | null> {
  if (currentStreak >= 7) {
    return await unlockAchievement("workout_streak_7");
  }
  return null;
}

/**
 * Get all available achievements with unlock status
 */
export async function getAllAchievementsWithStatus() {
  const unlockedAchievements = await getUserAchievements();
  const unlockedTypes = new Set(unlockedAchievements.map(a => a.achievement_type));

  return Object.entries(ACHIEVEMENT_DEFINITIONS).map(([type, definition]) => ({
    achievement_type: type as AchievementType,
    ...definition,
    unlocked: unlockedTypes.has(type as AchievementType),
    unlocked_at: unlockedAchievements.find(a => a.achievement_type === type)?.unlocked_at
  }));
}
