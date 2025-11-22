import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para filtrar exercícios por equipamento
function filterByEquipment(exercises: any[], equipmentType: string): any[] {
  const equipmentMap: { [key: string]: string[] } = {
    'home': ['body weight', 'dumbbell', 'band', 'resistance band', 'rope', 'medicine ball'],
    'small-gym': ['body weight', 'dumbbell', 'barbell', 'band', 'resistance band', 'rope', 'medicine ball', 'cable', 'kettlebell', 'ez barbell'],
    'full-gym': [] // All equipment allowed
  };

  const allowedEquipment = equipmentMap[equipmentType] || [];
  
  if (equipmentType === 'full-gym') {
    return exercises;
  }
  
  return exercises.filter(ex => allowedEquipment.includes(ex.equipment.toLowerCase()));
}

// Função para buscar exercícios da API do ExerciseDB
async function fetchExercisesByTarget(targets: string[], equipmentType: string): Promise<any[]> {
  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
  if (!RAPIDAPI_KEY) {
    console.warn("RAPIDAPI_KEY not configured, skipping exercise API");
    return [];
  }

  const allExercises: any[] = [];
  
  for (const target of targets) {
    try {
      const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/target/${target}?limit=30`, {
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      });

      if (response.ok) {
        const exercises = await response.json();
        allExercises.push(...exercises);
      }
    } catch (error) {
      console.error(`Error fetching exercises for target ${target}:`, error);
    }
  }

  // Filtrar por equipamento disponível
  return filterByEquipment(allExercises, equipmentType);
}

// Função científica para determinar alvos baseado no objetivo
function getTargetsForGoal(goal: string, experienceLevel: string): string[] {
  const goalLower = goal.toLowerCase();
  
  // Hipertrofia - foco em volume e compostos
  if (goalLower.includes('ganhar massa') || goalLower.includes('hipertrofia') || goalLower === 'gain') {
    return experienceLevel === 'beginner' 
      ? ['pectorals', 'lats', 'quads', 'glutes', 'delts'] // Iniciantes: compostos principais
      : ['pectorals', 'lats', 'quads', 'glutes', 'delts', 'biceps', 'triceps', 'hamstrings', 'calves']; // Avançados: mais isolamentos
  } 
  
  // Emagrecimento - foco em grandes grupos musculares e cardio
  else if (goalLower.includes('perder peso') || goalLower.includes('emagre') || goalLower === 'lose') {
    return ['cardiovascular system', 'glutes', 'quads', 'hamstrings', 'abs', 'calves', 'adductors'];
  } 
  
  // Definição - equilíbrio entre hipertrofia e metabolismo
  else if (goalLower.includes('definição') || goalLower.includes('tonificar')) {
    return ['abs', 'pectorals', 'delts', 'lats', 'triceps', 'biceps', 'quads', 'glutes', 'hamstrings'];
  } 
  
  // Saúde/Condicionamento - foco funcional e mobilidade
  else if (goalLower.includes('saúde') || goalLower.includes('health')) {
    return ['cardiovascular system', 'abs', 'spine', 'glutes', 'quads', 'upper back'];
  }
  
  // Resistência - cardio + força
  else if (goalLower.includes('resistência') || goalLower.includes('resistance') || goalLower.includes('conditioning')) {
    return ['cardiovascular system', 'quads', 'hamstrings', 'calves', 'abs', 'glutes'];
  }
  
  // Default: Full body balanceado
  return ['pectorals', 'lats', 'quads', 'glutes', 'delts', 'abs'];
}

// Função para calcular frequência ótima baseada em ciência
function getOptimalFrequency(goal: string, experienceLevel: string, trainingDays: number): string {
  if (goal === 'lose' || goal === 'conditioning') {
    return trainingDays >= 5 ? '2x/semana por grupo' : '1-2x/semana por grupo';
  }
  
  if (goal === 'gain') {
    if (experienceLevel === 'beginner') return '2x/semana por grupo';
    return trainingDays >= 5 ? '2-3x/semana por grupo' : '2x/semana por grupo';
  }
  
  return '2x/semana por grupo';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizData, bodyAnalysis } = await req.json();
    
    console.log("Generating personalized workout plan...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Determinar nível de experiência
    const experienceLevel = quizData.hasTrainedBefore === 'no' ? 'beginner' : 
                           (quizData.experienceTime && parseInt(quizData.experienceTime) < 6) ? 'beginner' : 'advanced';
    
    // Buscar exercícios da API baseado em objetivo, experiência e equipamento
    const targets = getTargetsForGoal(quizData.mainGoal, experienceLevel);
    console.log("Fetching exercises for targets:", targets);
    console.log("Equipment type:", quizData.equipmentAvailable);
    
    const exercisesFromAPI = await fetchExercisesByTarget(targets, quizData.equipmentAvailable);
    console.log(`Fetched ${exercisesFromAPI.length} exercises from API (filtered by equipment)`);
    
    // Calcular frequência ótima
    const optimalFrequency = getOptimalFrequency(quizData.mainGoal, experienceLevel, parseInt(quizData.trainingDays));

    // Construir contexto de exercícios
    let exerciseContext = "";
    if (exercisesFromAPI.length > 0) {
      exerciseContext = `\n\n📚 BASE DE DADOS DE EXERCÍCIOS CIENTÍFICOS (${exercisesFromAPI.length} exercícios filtrados):

EQUIPAMENTOS DISPONÍVEIS: ${quizData.equipmentAvailable}
${quizData.equipmentAvailable === 'home' ? '🏠 TREINO EM CASA - Use APENAS exercícios com peso corporal, halteres ou elásticos!' : ''}
${quizData.equipmentAvailable === 'small-gym' ? '🏋️ ACADEMIA PEQUENA - Priorize halteres, barras e cabos!' : ''}
${quizData.equipmentAvailable === 'full-gym' ? '💪 ACADEMIA COMPLETA - Todos os equipamentos disponíveis!' : ''}

FREQUÊNCIA MUSCULAR ÓTIMA: ${optimalFrequency}

PRINCÍPIOS CIENTÍFICOS A SEGUIR:
1. PERIODIZAÇÃO: Varie intensidade e volume ao longo da semana
2. SOBRECARGA PROGRESSIVA: Aumente peso/reps gradualmente
3. TEMPO SOB TENSÃO: 40-70s por série para hipertrofia, 20-40s para força
4. RECUPERAÇÃO: 48-72h entre mesmos grupos musculares
5. ORDEM: Exercícios compostos ANTES dos isolamentos
6. AMPLITUDE: Movimentos completos (ROM total) sempre que possível

EXERCÍCIOS DISPONÍVEIS (TODOS JÁ FILTRADOS POR EQUIPAMENTO):
${JSON.stringify(exercisesFromAPI.slice(0, 120), null, 2)}`;
    }

    // Construir prompt científico
    let prompt = `Você é um Personal Trainer CIENTÍFICO especializado. Crie um plano de treino BASEADO EM EVIDÊNCIAS usando os princípios:
- Sobrecarga progressiva
- Especificidade
- Periodização
- Recuperação adequada
- Volume e intensidade ótimos

👤 PERFIL DO ALUNO:
━━━━━━━━━━━━━━━━━━━━
📊 Dados Físicos:
• Idade: ${quizData.age} anos
• Altura: ${quizData.height}m
• Peso atual: ${quizData.currentWeight}kg
• Peso desejado: ${quizData.desiredWeight}kg
• IMC: ${(parseFloat(quizData.currentWeight) / Math.pow(parseFloat(quizData.height), 2)).toFixed(1)}

🎯 Objetivo: ${quizData.mainGoal}
⚡ Nível: ${experienceLevel === 'beginner' ? 'INICIANTE - Foco em aprendizado motor e compostos' : 'AVANÇADO - Pode incluir isolamentos e técnicas avançadas'}
📅 Frequência: ${quizData.trainingDays} dias/semana
⏱️ Tempo/treino: ${quizData.trainingTime}
🏋️ Local: ${quizData.equipmentAvailable}
💪 Intensidade: ${quizData.desiredIntensity}
🔄 Divisão: ${quizData.workoutSplit}
⌛ Duração: ${quizData.workoutLength}

⚠️ RESTRIÇÕES IMPORTANTES:
${quizData.hasLimitations === 'yes' ? '• TEM LIMITAÇÕES DE MOBILIDADE - Adaptar exercícios!' : '• Sem limitações de mobilidade'}
${quizData.hasPain === 'yes' ? `• ATENÇÃO: ${quizData.painDetails} - EVITAR movimentos que agravam!` : '• Sem dores ou lesões reportadas'}
${quizData.highBloodPressure === 'yes' ? '• HIPERTENSÃO - Evitar Valsalva excessiva!' : ''}
${quizData.diabetes === 'yes' ? '• DIABETES - Monitorar glicemia!' : ''}`;

    if (bodyAnalysis) {
      prompt += `\n\n📸 ANÁLISE CORPORAL POR IA:
━━━━━━━━━━━━━━━━━━━━
${bodyAnalysis}

⚠️ AÇÃO: Priorize os grupos musculares identificados que precisam de desenvolvimento e considere a composição corporal para ajustar volume/intensidade.`;
    }

    // Adicionar contexto dos exercícios
    prompt += exerciseContext;

    prompt += `\n\n🎯 INSTRUÇÕES DE CRIAÇÃO DO PLANO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ESTRUTURA: Crie ${quizData.trainingDays} treinos diferentes e complementares.

⚠️ IMPORTANTE: Cada treino DEVE conter EXATAMENTE entre 6 a 8 exercícios!
• MÍNIMO: 6 exercícios por treino
• MÁXIMO: 8 exercícios por treino
• Distribua entre compostos (3-4) e isolamentos (2-4)
• Varie os grupos musculares dentro do treino

⚙️ PARÂMETROS CIENTÍFICOS POR OBJETIVO:

${quizData.mainGoal === 'lose' ? `
🔥 EMAGRECIMENTO:
• Séries: 3-4 por exercício
• Reps: 12-15 (maior gasto calórico)
• Descanso: 45-60s (manter frequência cardíaca elevada)
• Ordem: Compostos → Isolamentos → Cardio metabólico
• Volume: ALTO (circuitos e superséries quando possível)
• Foco: Grandes grupos musculares + HIIT
` : ''}

${quizData.mainGoal === 'gain' ? `
💪 HIPERTROFIA:
• Séries: 3-5 por exercício
• Reps: 8-12 (zona de hipertrofia)
• Descanso: 60-90s (recuperação completa)
• Ordem: Compostos pesados → Isolamentos
• Volume: MODERADO-ALTO (10-20 séries/grupo muscular/semana)
• Foco: Tempo sob tensão + sobrecarga progressiva
` : ''}

${quizData.mainGoal === 'health' || quizData.mainGoal === 'conditioning' ? `
🏃 SAÚDE/CONDICIONAMENTO:
• Séries: 2-4 por exercício
• Reps: 10-15 (força-resistência)
• Descanso: 60s
• Ordem: Funcional → Mobilidade → Cardio
• Volume: MODERADO (equilíbrio)
• Foco: Movimentos naturais + estabilidade
` : ''}

${quizData.mainGoal === 'resistance' ? `
⚡ RESISTÊNCIA:
• Séries: 3-4 por exercício
• Reps: 15-20 (alta resistência muscular)
• Descanso: 30-45s (curto)
• Ordem: Circuitos funcionais
• Volume: ALTO (resistência cardiovascular)
• Foco: Capacidade aeróbica + força
` : ''}

🏠 ADAPTAÇÕES POR LOCAL:
${quizData.equipmentAvailable === 'home' ? `
• CASA: Foco em peso corporal, variações unilaterais, tempo sob tensão
• Use superséries para compensar falta de peso
• Explore amplitudes máximas e contrações isométricas
` : ''}
${quizData.equipmentAvailable === 'small-gym' ? `
• ACADEMIA PEQUENA: Priorize halteres e barras livres
• Explore exercícios compostos e variações
` : ''}
${quizData.equipmentAvailable === 'full-gym' ? `
• ACADEMIA COMPLETA: Use máquinas para isolamentos seguros
• Combine exercícios livres e máquinas
` : ''}

📝 FORMATO DE RESPOSTA (JSON):

{
  "workouts": [
    {
      "day": "Treino A - [Nome científico do foco]",
      "description": "Explicação do objetivo fisiológico deste treino (1-2 frases)",
      "exercises": [
        {
          "name": "Nome TRADUZIDO do exercício (português)",
          "sets": "X-Y",
          "reps": "X-Y",
          "rest": "Xs",
          "tip": "Dica biomecânica ESPECÍFICA para execução perfeita e segura (2-3 frases EM PORTUGUÊS)",
          "why": "Justificativa científica: por que ESTE exercício para ESTE objetivo e ESTE usuário (2 frases)",
          "variations": ["variação 1 PT-BR", "variação 2 PT-BR"],
          "gifUrl": "URL_DA_BASE_DE_DADOS"
        }
      ]
    }
  ]
}

⚠️ REGRAS OBRIGATÓRIAS:
━━━━━━━━━━━━━━━━━━━━
✅ USE APENAS exercícios da base de dados fornecida
✅ RESPEITE o equipamento disponível (JÁ FILTRADO)
✅ TRADUZA tudo para português brasileiro
✅ Exercícios COMPOSTOS primeiro, isolamentos depois
✅ Respeite limitações e dores reportadas
✅ Progressão lógica entre os dias
✅ Inclua SEMPRE o campo "gifUrl" com URL da base
✅ Responda APENAS com JSON válido (sem markdown, sem texto extra)

❌ NUNCA:
• Inventar exercícios fora da base de dados
• Sugerir equipamentos não disponíveis
• Ignorar lesões ou limitações
• Usar exercícios contraindicados para o objetivo`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let workoutPlanText = data.choices[0].message.content;

    console.log("Raw AI response:", workoutPlanText);

    // Clean up the response to extract JSON
    workoutPlanText = workoutPlanText.trim();
    
    // Remove markdown code blocks if present
    if (workoutPlanText.startsWith("```json")) {
      workoutPlanText = workoutPlanText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (workoutPlanText.startsWith("```")) {
      workoutPlanText = workoutPlanText.replace(/```\n?/g, "");
    }

    // Try to find JSON in the response
    const jsonMatch = workoutPlanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      workoutPlanText = jsonMatch[0];
    }

    let workoutPlan;
    try {
      workoutPlan = JSON.parse(workoutPlanText);
    } catch (parseError) {
      console.error("Failed to parse workout plan:", parseError);
      console.error("Attempted to parse:", workoutPlanText);
      throw new Error("Failed to parse AI response as JSON");
    }

    console.log("Workout plan generated successfully");

    return new Response(
      JSON.stringify({ workoutPlan }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in generate-personalized-workout:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
