import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface QuizData {
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  goal?: string;
  experienceLevel?: string;
  trainingFrequency?: number;
  workoutDuration?: string;
  preferredTime?: string;
  gymAccess?: boolean;
  availableEquipment?: string[];
  physicalLimitations?: string;
  dietaryRestrictions?: string;
  bodyType?: string;
  targetAreas?: string[];
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    rest: string;
    tips?: string;
  }>;
}

export interface WorkoutPlan {
  id?: string;
  name: string;
  description: string;
  goal: string;
  days: WorkoutDay[];
}

// Save quiz responses to database
export async function saveQuizResponses(data: QuizData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("quiz_responses")
    .upsert({
      user_id: user.id,
      name: data.name,
      age: data.age,
      weight: data.weight,
      height: data.height,
      gender: data.gender,
      goal: data.goal,
      experience_level: data.experienceLevel,
      training_frequency: data.trainingFrequency,
      workout_duration: data.workoutDuration,
      preferred_time: data.preferredTime,
      gym_access: data.gymAccess,
      available_equipment: data.availableEquipment,
      physical_limitations: data.physicalLimitations,
      dietary_restrictions: data.dietaryRestrictions,
      body_type: data.bodyType,
      target_areas: data.targetAreas,
    });

  if (error) throw error;
}

// Get quiz responses from database
export async function getQuizResponses(): Promise<QuizData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("quiz_responses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    name: data.name,
    age: data.age || undefined,
    weight: data.weight || undefined,
    height: data.height || undefined,
    gender: data.gender || undefined,
    goal: data.goal || undefined,
    experienceLevel: data.experience_level || undefined,
    trainingFrequency: data.training_frequency || undefined,
    workoutDuration: data.workout_duration || undefined,
    preferredTime: data.preferred_time || undefined,
    gymAccess: data.gym_access || undefined,
    availableEquipment: data.available_equipment || undefined,
    physicalLimitations: data.physical_limitations || undefined,
    dietaryRestrictions: data.dietary_restrictions || undefined,
    bodyType: data.body_type || undefined,
    targetAreas: data.target_areas || undefined,
  };
}

// Save workout plan to database
export async function saveWorkoutPlan(plan: WorkoutPlan) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Deactivate all existing plans
  await supabase
    .from("workout_plans")
    .update({ is_active: false })
    .eq("user_id", user.id);

  // Insert new plan
  const { data, error } = await supabase
    .from("workout_plans")
    .insert({
      name: plan.name,
      description: plan.description,
      goal: plan.goal,
      days: plan.days as any,
      is_active: true,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get active workout plan from database
export async function getActiveWorkoutPlan(): Promise<WorkoutPlan | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description || "",
    goal: data.goal || "",
    days: (data.days as any) || [],
  };
}

// Start a workout session
export async function startWorkoutSession(planId: string, dayName: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      workout_plan_id: planId,
      day_name: dayName,
      status: "in_progress",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Complete a workout session
export async function completeWorkoutSession(sessionId: string) {
  const { error } = await supabase
    .from("workout_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) throw error;
}

// Save exercise logs
export async function saveExerciseLog(
  sessionId: string,
  exerciseName: string,
  exerciseData: any,
  sets: any[]
) {
  const { error } = await supabase
    .from("exercise_logs")
    .insert({
      workout_session_id: sessionId,
      exercise_name: exerciseName,
      exercise_data: exerciseData,
      sets: sets,
    });

  if (error) throw error;
}

// Get workout history
export async function getWorkoutHistory(limit = 10) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(`
      *,
      exercise_logs (*)
    `)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Calculate current streak
export async function calculateStreak() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { currentStreak: 0, maxStreak: 0 };

  // Get all completed workouts ordered by date
  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error || !sessions || sessions.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  // Get unique dates
  const workoutDates = [...new Set(
    sessions.map(s => new Date(s.completed_at!).toDateString())
  )].map(d => new Date(d));

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if there's a workout today or yesterday to start counting
  const lastWorkoutDate = new Date(workoutDates[0]);
  lastWorkoutDate.setHours(0, 0, 0, 0);

  if (lastWorkoutDate.getTime() === today.getTime() || 
      lastWorkoutDate.getTime() === yesterday.getTime()) {
    
    currentStreak = 1;
    let checkDate = new Date(lastWorkoutDate);

    for (let i = 1; i < workoutDates.length; i++) {
      const prevDate = new Date(workoutDates[i]);
      prevDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(checkDate);
      expectedDate.setDate(expectedDate.getDate() - 1);

      if (prevDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
        checkDate = prevDate;
      } else {
        break;
      }
    }
  }

  // Calculate max streak
  let maxStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < workoutDates.length; i++) {
    const currentDate = new Date(workoutDates[i]);
    currentDate.setHours(0, 0, 0, 0);
    
    const prevDate = new Date(workoutDates[i - 1]);
    prevDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      tempStreak++;
    } else {
      maxStreak = Math.max(maxStreak, tempStreak);
      tempStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak);

  return { currentStreak, maxStreak };
}

// Update user streak in profile
export async function updateUserStreak() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { currentStreak, maxStreak } = await calculateStreak();

  // Get current max_streak from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("max_streak")
    .eq("user_id", user.id)
    .single();

  const currentMaxStreak = profile?.max_streak || 0;
  const isNewRecord = maxStreak > currentMaxStreak;

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({
      current_streak: currentStreak,
      max_streak: Math.max(maxStreak, currentMaxStreak),
      last_workout_date: format(new Date(), 'yyyy-MM-dd'),
    })
    .eq("user_id", user.id);

  if (error) throw error;

  return { currentStreak, maxStreak, isNewRecord };
}

// Get completed workouts in current 7-day cycle
export async function getCurrentCycleCompletedWorkouts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all completed workouts ordered by completion date
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("day_name, completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Find the first workout completion date
  const firstWorkoutDate = new Date(data[0].completed_at!);
  const now = new Date();
  
  // Calculate how many days have passed since the first workout
  const daysPassed = Math.floor((now.getTime() - firstWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate which 7-day cycle we're in
  const currentCycle = Math.floor(daysPassed / 7);
  
  // Calculate the start of the current cycle
  const cycleStartDate = new Date(firstWorkoutDate);
  cycleStartDate.setDate(cycleStartDate.getDate() + (currentCycle * 7));
  
  // Filter workouts that are in the current 7-day cycle
  const cycleWorkouts = data.filter(workout => {
    const workoutDate = new Date(workout.completed_at!);
    const daysSinceCycleStart = Math.floor((workoutDate.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceCycleStart >= 0 && daysSinceCycleStart < 7;
  });

  return cycleWorkouts;
}

// Meal completions functions
export const getMealCompletions = async (date?: Date): Promise<number[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const targetDate = date || new Date();
    const dateString = format(targetDate, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('meal_completions')
      .select('meal_index')
      .eq('user_id', user.id)
      .eq('meal_date', dateString);

    if (error) throw error;
    
    return data?.map(item => item.meal_index) || [];
  } catch (error) {
    console.error("Error getting meal completions:", error);
    return [];
  }
};

export const toggleMealCompletion = async (mealIndex: number): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if already completed
    const { data: existing } = await supabase
      .from('meal_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('meal_date', today)
      .eq('meal_index', mealIndex)
      .single();

    if (existing) {
      // Remove completion
      const { error } = await supabase
        .from('meal_completions')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return false;
    } else {
      // Add completion
      const { error } = await supabase
        .from('meal_completions')
        .insert({
          user_id: user.id,
          meal_date: today,
          meal_index: mealIndex
        });
      
      if (error) throw error;
      return true;
    }
  } catch (error) {
    console.error("Error toggling meal completion:", error);
    throw error;
  }
};

// Get water intake for today
export const getWaterIntake = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const today = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('water_intake')
      .select('amount_ml')
      .eq('user_id', user.id)
      .eq('intake_date', today)
      .maybeSingle();

    if (error) throw error;
    return data?.amount_ml || 0;
  } catch (error) {
    console.error("Error getting water intake:", error);
    return 0;
  }
};

// Add water intake (200ml per glass)
export const addWaterIntake = async (amountMl: number): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const today = format(new Date(), 'yyyy-MM-dd');

    // Check if record exists for today
    const { data: existing } = await supabase
      .from('water_intake')
      .select('*')
      .eq('user_id', user.id)
      .eq('intake_date', today)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const newAmount = existing.amount_ml + amountMl;
      const { error } = await supabase
        .from('water_intake')
        .update({ 
          amount_ml: newAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (error) throw error;
      return newAmount;
    } else {
      // Create new record
      const { error } = await supabase
        .from('water_intake')
        .insert({
          user_id: user.id,
          intake_date: today,
          amount_ml: amountMl
        });
      
      if (error) throw error;
      return amountMl;
    }
  } catch (error) {
    console.error("Error adding water intake:", error);
    throw error;
  }
};
