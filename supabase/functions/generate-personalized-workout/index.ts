import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to fetch exercises from ExerciseDB API
async function fetchExercisesByTarget(targets: string[]): Promise<any[]> {
  const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
  if (!RAPIDAPI_KEY) {
    console.warn("RAPIDAPI_KEY not configured, skipping exercise API");
    return [];
  }

  const allExercises: any[] = [];
  
  for (const target of targets) {
    try {
      const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/target/${target}?limit=20`, {
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

  return allExercises;
}

// Function to determine targets based on goal
function getTargetsForGoal(goal: string): string[] {
  const goalLower = goal.toLowerCase();
  
  if (goalLower.includes('ganhar massa') || goalLower.includes('hipertrofia') || goalLower === 'gain') {
    return ['pectorals', 'lats', 'quads', 'glutes', 'delts', 'biceps', 'triceps', 'hamstrings'];
  } else if (goalLower.includes('perder peso') || goalLower.includes('emagre') || goalLower === 'lose') {
    return ['cardiovascular system', 'abs', 'glutes', 'quads', 'hamstrings', 'calves'];
  } else if (goalLower.includes('definição') || goalLower.includes('tonificar')) {
    return ['abs', 'pectorals', 'delts', 'biceps', 'triceps', 'quads', 'glutes'];
  } else {
    return ['pectorals', 'lats', 'quads', 'glutes', 'delts', 'abs'];
  }
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

    // Fetch exercises from ExerciseDB based on user's goal
    const targets = getTargetsForGoal(quizData.mainGoal);
    console.log("Fetching exercises for targets:", targets);
    const exercisesFromAPI = await fetchExercisesByTarget(targets);
    console.log(`Fetched ${exercisesFromAPI.length} exercises from API`);

    // Build exercise list for AI
    let exerciseContext = "";
    if (exercisesFromAPI.length > 0) {
      exerciseContext = `\n\nBASE DE DADOS DE EXERCÍCIOS DISPONÍVEIS (mais de ${exercisesFromAPI.length} opções):
Use APENAS exercícios desta lista real para criar o plano. Cada exercício tem:
- name: nome original em inglês (TRADUZA para português)
- bodyPart: parte do corpo
- target: músculo alvo
- equipment: equipamento necessário
- instructions: instruções passo a passo (TRADUZA para português)
- gifUrl: URL da demonstração

IMPORTANTE: 
1. Escolha exercícios que correspondam ao equipamento disponível do usuário
2. TRADUZA todos os nomes de exercícios e instruções para português brasileiro
3. Use os exercícios mais adequados para o objetivo e nível do usuário

LISTA DE EXERCÍCIOS:
${JSON.stringify(exercisesFromAPI.slice(0, 100), null, 2)}`;
    }

    // Build the prompt with all user data
    let prompt = `Crie um plano de treino EXTREMAMENTE personalizado e detalhado baseado nas informações abaixo.

INFORMAÇÕES DO USUÁRIO:
- Idade: ${quizData.age} anos
- Altura: ${quizData.height}m
- Peso atual: ${quizData.currentWeight}kg
- Peso desejado: ${quizData.desiredWeight}kg
- Objetivo principal: ${quizData.mainGoal}
- Dias de treino por semana: ${quizData.trainingDays}
- Tempo disponível por treino: ${quizData.trainingTime}
- Nível: ${quizData.hasTrainedBefore === 'yes' ? 'Tem experiência (' + quizData.experienceTime + ')' : 'Iniciante'}
- Limitações: ${quizData.hasLimitations}
- Dores/Lesões: ${quizData.hasPain === 'yes' ? quizData.painDetails : 'Nenhuma'}
- Equipamentos disponíveis: ${quizData.equipmentAvailable}
- Intensidade desejada: ${quizData.desiredIntensity}
- Tipo de treino preferido: ${quizData.workoutSplit}
- Duração preferida: ${quizData.workoutLength}`;

    if (bodyAnalysis) {
      prompt += `\n\nANÁLISE CORPORAL POR IA (BASEADA EM FOTOS):
${bodyAnalysis}

IMPORTANTE: Use esta análise visual para personalizar ainda mais o treino, focando nos grupos musculares identificados que precisam de mais atenção e considerando a composição corporal observada.`;
    }

    // Add exercise database context
    prompt += exerciseContext;

    prompt += `\n\nCRIE UM PLANO DE TREINO com exatamente ${quizData.trainingDays} treinos diferentes (um para cada dia da semana).

Para CADA treino, forneça 5-7 exercícios no seguinte formato JSON:

{
  "workouts": [
    {
      "day": "Treino A - [Nome descritivo]",
      "description": "Breve descrição do foco deste treino",
      "exercises": [
        {
          "name": "Nome do exercício EM PORTUGUÊS (traduzido da base de dados)",
          "sets": "3-4",
          "reps": "10-12",
          "rest": "60s",
          "tip": "Dica específica de execução TRADUZIDA EM PORTUGUÊS (2-3 frases)",
          "why": "Por que este exercício é importante para o objetivo deste usuário (2 frases)",
          "variations": ["variação 1 traduzida", "variação 2 traduzida"],
          "gifUrl": "URL da demonstração do exercício (da base de dados)"
        }
      ]
    }
  ]
}

REQUISITOS CRÍTICOS:
1. USE APENAS exercícios da base de dados fornecida acima
2. TRADUZA todos os nomes de exercícios e instruções para português brasileiro
3. Responda APENAS com o JSON válido, sem texto adicional antes ou depois
4. Personalize CADA exercício considerando o nível, limitações e análise corporal
5. Se há dores/lesões, adapte os exercícios ou ofereça alternativas seguras
6. Considere o equipamento disponível do usuário ao escolher exercícios
7. Os treinos devem ser progressivos e complementares entre si
8. Use a análise corporal para priorizar grupos musculares específicos
9. Inclua o campo "gifUrl" em cada exercício com a URL da demonstração da base de dados`;

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
