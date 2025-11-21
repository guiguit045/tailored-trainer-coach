/**
 * Nutrition Calculator based on scientific formulas and expert recommendations
 * Uses Mifflin-St Jeor Equation for BMR (Basal Metabolic Rate)
 * and activity multipliers for TDEE (Total Daily Energy Expenditure)
 */

import type { QuizData } from "@/pages/Quiz";

export interface NutritionGoals {
  calories: number;
  waterMl: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * Men: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + 5
 * Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age - 161
 */
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  const baseCalculation = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? baseCalculation + 5 : baseCalculation - 161;
}

/**
 * Activity multipliers based on training frequency
 * Sedentary: 1.2 (little or no exercise)
 * Light: 1.375 (exercise 1-3 days/week)
 * Moderate: 1.55 (exercise 3-5 days/week)
 * Active: 1.725 (exercise 6-7 days/week)
 * Very Active: 1.9 (physical job + exercise)
 */
function getActivityMultiplier(trainingFrequency: number): number {
  if (trainingFrequency <= 1) return 1.2;
  if (trainingFrequency <= 3) return 1.375;
  if (trainingFrequency <= 5) return 1.55;
  if (trainingFrequency <= 6) return 1.725;
  return 1.9;
}

/**
 * Calculate water intake based on body weight and activity level
 * Base: 35ml per kg of body weight (recommended by health organizations)
 * Extra: +500ml per hour of exercise
 * Weight loss: +20% more water to help metabolism
 */
function calculateWaterIntake(weight: number, trainingFrequency: number, goal: string): number {
  // Base water need: 35ml per kg
  let waterMl = weight * 35;
  
  // Add extra for training (estimate 1 hour per training day)
  waterMl += trainingFrequency * 500;
  
  // Weight loss bonus: extra 20% to boost metabolism
  if (goal === "weight-loss") {
    waterMl *= 1.2;
  }
  
  // Round to nearest 250ml
  return Math.round(waterMl / 250) * 250;
}

/**
 * Calculate macronutrient distribution based on goal
 * Weight Loss: Higher protein (40%), moderate carbs (30%), moderate fat (30%)
 * Muscle Gain: High protein (35%), high carbs (45%), moderate fat (20%)
 * Maintenance: Balanced (30% protein, 40% carbs, 30% fat)
 */
function calculateMacros(calories: number, goal: string) {
  let proteinPercent: number;
  let carbsPercent: number;
  let fatPercent: number;
  
  if (goal === "weight-loss") {
    proteinPercent = 0.40;
    carbsPercent = 0.30;
    fatPercent = 0.30;
  } else if (goal === "muscle-gain") {
    proteinPercent = 0.35;
    carbsPercent = 0.45;
    fatPercent = 0.20;
  } else {
    proteinPercent = 0.30;
    carbsPercent = 0.40;
    fatPercent = 0.30;
  }
  
  return {
    protein: Math.round((calories * proteinPercent) / 4), // 4 cal per gram
    carbs: Math.round((calories * carbsPercent) / 4), // 4 cal per gram
    fat: Math.round((calories * fatPercent) / 9), // 9 cal per gram
  };
}

/**
 * Main function to calculate personalized nutrition goals
 * Based on quiz data and scientific formulas
 */
export function calculateNutritionGoals(quizData: QuizData): NutritionGoals {
  // Convert string values to numbers and provide defaults
  const weight = typeof quizData.currentWeight === 'string' ? parseFloat(quizData.currentWeight) || 70 : 70;
  const height = typeof quizData.height === 'string' ? parseFloat(quizData.height) * 100 || 170 : 170; // Convert m to cm
  const age = typeof quizData.age === 'string' ? parseInt(quizData.age) || 25 : 25;
  
  // Map quiz values to expected format
  const gender = "male"; // QuizData doesn't have sex/gender field, default to male
  const trainingDaysStr = quizData.trainingDays || "3-4";
  const trainingFrequency = trainingDaysStr.includes("1-2") ? 2 : 
                           trainingDaysStr.includes("3-4") ? 4 :
                           trainingDaysStr.includes("5-6") ? 5 : 3;
  
  // Map goal to expected format
  let goal = "maintenance";
  if (quizData.mainGoal === "lose") goal = "weight-loss";
  else if (quizData.mainGoal === "gain") goal = "muscle-gain";
  
  // Calculate BMR
  const bmr = calculateBMR(weight, height, age, gender);
  
  // Calculate TDEE (Total Daily Energy Expenditure)
  const activityMultiplier = getActivityMultiplier(trainingFrequency);
  const tdee = bmr * activityMultiplier;
  
  // Adjust calories based on goal
  let targetCalories: number;
  if (goal === "weight-loss") {
    // Deficit: -500 cal/day = ~0.5kg/week loss (safe and sustainable)
    targetCalories = Math.round(tdee - 500);
  } else if (goal === "muscle-gain") {
    // Surplus: +300 cal/day (lean bulk, minimize fat gain)
    targetCalories = Math.round(tdee + 300);
  } else {
    // Maintenance
    targetCalories = Math.round(tdee);
  }
  
  // Ensure minimum safe calories
  const minCalories = gender === "male" ? 1500 : 1200;
  targetCalories = Math.max(targetCalories, minCalories);
  
  // Calculate water intake
  const waterMl = calculateWaterIntake(weight, trainingFrequency, goal);
  
  // Calculate macros
  const macros = calculateMacros(targetCalories, goal);
  
  return {
    calories: targetCalories,
    waterMl,
    ...macros
  };
}
