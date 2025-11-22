import { supabase } from "@/integrations/supabase/client";

export interface ProgressionSuggestion {
  type: "weight" | "reps" | "sets";
  currentValue: string;
  suggestedValue: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface ExercisePerformance {
  exerciseName: string;
  completedSessions: number;
  averageWeight: number;
  averageReps: number;
  lastWeight: string;
  lastReps: string;
  consistencyScore: number; // 0-100
}

/**
 * Analisa o histórico de performance de um exercício específico
 * e retorna dados agregados para análise de progressão
 */
export async function analyzeExercisePerformance(
  exerciseName: string,
  weeks: number = 2
): Promise<ExercisePerformance | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Buscar logs dos últimos X semanas
  const weeksAgo = new Date();
  weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));

  const { data: logs, error } = await supabase
    .from("exercise_logs")
    .select(`
      sets,
      created_at,
      workout_sessions!inner (
        user_id,
        completed_at,
        status
      )
    `)
    .eq("exercise_name", exerciseName)
    .eq("workout_sessions.user_id", user.id)
    .eq("workout_sessions.status", "completed")
    .gte("workout_sessions.completed_at", weeksAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error || !logs || logs.length === 0) return null;

  // Agregar dados de todas as sessões
  let totalWeight = 0;
  let totalReps = 0;
  let totalCompletedSets = 0;
  let sessionsWithAllSetsCompleted = 0;
  
  const lastSession = logs[0];
  const lastSets = lastSession.sets as Array<{ weight: string; reps: string; completed: boolean }>;
  const lastCompletedSet = lastSets.reverse().find(s => s.completed);

  logs.forEach(log => {
    const sets = log.sets as Array<{ weight: string; reps: string; completed: boolean }>;
    let allSetsCompleted = true;
    
    sets.forEach(set => {
      if (set.completed) {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        totalWeight += weight;
        totalReps += reps;
        totalCompletedSets++;
      } else {
        allSetsCompleted = false;
      }
    });
    
    if (allSetsCompleted && sets.length > 0) {
      sessionsWithAllSetsCompleted++;
    }
  });

  const averageWeight = totalCompletedSets > 0 ? totalWeight / totalCompletedSets : 0;
  const averageReps = totalCompletedSets > 0 ? totalReps / totalCompletedSets : 0;
  const consistencyScore = logs.length > 0 
    ? Math.round((sessionsWithAllSetsCompleted / logs.length) * 100) 
    : 0;

  return {
    exerciseName,
    completedSessions: logs.length,
    averageWeight,
    averageReps,
    lastWeight: lastCompletedSet?.weight || "0",
    lastReps: lastCompletedSet?.reps || "0",
    consistencyScore,
  };
}

/**
 * Algoritmo científico de progressão baseado em:
 * - Sobrecarga progressiva
 * - Princípio APRE (Autoregulatory Progressive Resistance Exercise)
 * - Periodização linear
 */
export async function calculateProgressionSuggestion(
  exerciseName: string,
  currentSets: string,
  currentReps: string,
  currentWeight: string,
  exerciseType: "compound" | "isolation" = "compound"
): Promise<ProgressionSuggestion | null> {
  const performance = await analyzeExercisePerformance(exerciseName, 2);
  
  if (!performance || performance.completedSessions < 2) {
    return {
      type: "weight",
      currentValue: currentWeight || "0kg",
      suggestedValue: currentWeight || "0kg",
      reason: "Continue com o peso atual. Dados insuficientes para sugerir progressão.",
      confidence: "low"
    };
  }

  const { consistencyScore, averageReps, lastWeight, lastReps, completedSessions } = performance;
  
  const weight = parseFloat(lastWeight) || 0;
  const reps = parseInt(lastReps) || 0;
  const targetRepsLow = parseInt(currentReps.split("-")[0]) || 8;
  const targetRepsHigh = parseInt(currentReps.split("-")[1]) || 12;

  // REGRA 1: Consistência Alta (>80%) + Reps no topo da faixa = AUMENTAR PESO
  if (consistencyScore >= 80 && completedSessions >= 3) {
    if (reps >= targetRepsHigh) {
      // Aumento de peso baseado no tipo de exercício
      const increment = exerciseType === "compound" ? 2.5 : 1.25; // kg
      const newWeight = weight + increment;
      
      return {
        type: "weight",
        currentValue: `${weight}kg`,
        suggestedValue: `${newWeight}kg`,
        reason: `🎯 Excelente! Você tem completado ${reps}+ reps consistentemente. Hora de aumentar ${increment}kg para continuar progredindo.`,
        confidence: "high"
      };
    }
  }

  // REGRA 2: Consistência Média (60-80%) + Reps médias = AUMENTAR REPS
  if (consistencyScore >= 60 && consistencyScore < 80) {
    if (reps < targetRepsHigh) {
      return {
        type: "reps",
        currentValue: currentReps,
        suggestedValue: `${targetRepsLow}-${targetRepsHigh + 2}`,
        reason: `💪 Tente adicionar 1-2 reps por série. Quando alcançar ${targetRepsHigh + 2} reps consistentemente, aumentaremos o peso.`,
        confidence: "medium"
      };
    }
  }

  // REGRA 3: Consistência Baixa (<60%) = MANTER
  if (consistencyScore < 60) {
    return {
      type: "weight",
      currentValue: `${weight}kg`,
      suggestedValue: `${weight}kg`,
      reason: `⚡ Foque na execução perfeita. Complete todas as séries com boa forma antes de progredir.`,
      confidence: "low"
    };
  }

  // REGRA 4: Muito forte - reps muito acima da faixa = SALTO DE PESO
  if (reps > targetRepsHigh + 4 && consistencyScore >= 70) {
    const largeIncrement = exerciseType === "compound" ? 5 : 2.5; // kg
    const newWeight = weight + largeIncrement;
    
    return {
      type: "weight",
      currentValue: `${weight}kg`,
      suggestedValue: `${newWeight}kg`,
      reason: `🔥 Você está muito forte! Aumente ${largeIncrement}kg para manter o estímulo ideal de hipertrofia.`,
      confidence: "high"
    };
  }

  // REGRA 5: Progressão de Volume (adicionar série)
  const currentSetsNum = parseInt(currentSets.split("-")[0]) || 3;
  if (consistencyScore >= 75 && currentSetsNum < 5 && completedSessions >= 4) {
    return {
      type: "sets",
      currentValue: currentSets,
      suggestedValue: `${currentSetsNum + 1}`,
      reason: `📈 Adicione mais uma série para aumentar o volume total de treino. Isso aumentará o estímulo de crescimento.`,
      confidence: "medium"
    };
  }

  // DEFAULT: Manter peso atual
  return {
    type: "weight",
    currentValue: `${weight}kg`,
    suggestedValue: `${weight}kg`,
    reason: `✅ Continue com o peso atual e foque em manter a forma perfeita em todas as séries.`,
    confidence: "medium"
  };
}

/**
 * Detecta platô (estagnação) no progresso
 */
export async function detectPlateau(
  exerciseName: string,
  weeks: number = 4
): Promise<boolean> {
  const performance = await analyzeExercisePerformance(exerciseName, weeks);
  
  if (!performance || performance.completedSessions < 4) {
    return false;
  }

  // Buscar progressão de peso nas últimas semanas
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const weeksAgo = new Date();
  weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select(`
      sets,
      created_at,
      workout_sessions!inner (
        user_id,
        completed_at,
        status
      )
    `)
    .eq("exercise_name", exerciseName)
    .eq("workout_sessions.user_id", user.id)
    .eq("workout_sessions.status", "completed")
    .gte("workout_sessions.completed_at", weeksAgo.toISOString())
    .order("created_at", { ascending: true })
    .limit(6);

  if (!logs || logs.length < 4) return false;

  // Analisar se o peso médio está estagnado
  const weights = logs.map(log => {
    const sets = log.sets as Array<{ weight: string; reps: string; completed: boolean }>;
    const completedSets = sets.filter(s => s.completed);
    const totalWeight = completedSets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
    return completedSets.length > 0 ? totalWeight / completedSets.length : 0;
  });

  // Se os últimos 4 treinos têm peso similar (variação < 5%), há platô
  const recentWeights = weights.slice(-4);
  const avgWeight = recentWeights.reduce((a, b) => a + b, 0) / recentWeights.length;
  const maxVariation = Math.max(...recentWeights.map(w => Math.abs(w - avgWeight)));
  
  return maxVariation < (avgWeight * 0.05); // Menos de 5% de variação = platô
}

/**
 * Estratégias para superar platô baseadas em ciência
 */
export async function getPlateauBreakStrategy(
  exerciseName: string
): Promise<string[]> {
  const hasPlateaued = await detectPlateau(exerciseName, 4);
  
  if (!hasPlateaued) {
    return [];
  }

  return [
    "🔄 DELOAD: Reduza 20% do peso por 1 semana para recuperação neuromuscular",
    "📊 VARIAÇÃO: Troque por uma variação do exercício (ex: inclinação diferente)",
    "⏱️ TUT: Aumente o tempo sob tensão (3-1-3 segundos por rep)",
    "💥 DROP SETS: Adicione uma série descendente no último set",
    "🎯 PAUSA: Adicione pause reps (pausa de 2s no ponto mais difícil)",
    "📈 ONDULAÇÃO: Alterne entre semanas de alto volume e alta intensidade"
  ];
}
