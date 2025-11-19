import { supabase } from "@/integrations/supabase/client";

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
