import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    prompt += `\n\nCRIE UM PLANO DE TREINO com exatamente ${quizData.trainingDays} treinos diferentes (um para cada dia da semana).

Para CADA treino, forneça 5-7 exercícios no seguinte formato JSON:

{
  "workouts": [
    {
      "day": "Treino A - [Nome descritivo]",
      "description": "Breve descrição do foco deste treino",
      "exercises": [
        {
          "name": "Nome do exercício",
          "sets": "3-4",
          "reps": "10-12",
          "rest": "60s",
          "tip": "Dica específica de execução (2-3 frases)",
          "why": "Por que este exercício é importante para o objetivo deste usuário (2 frases)",
          "variations": ["variação 1", "variação 2"]
        }
      ]
    }
  ]
}

REQUISITOS CRÍTICOS:
1. Responda APENAS com o JSON válido, sem texto adicional antes ou depois
2. Personalize CADA exercício considerando o nível, limitações e análise corporal
3. Se há dores/lesões, adapte os exercícios ou ofereça alternativas seguras
4. Considere o equipamento disponível
5. Os treinos devem ser progressivos e complementares entre si
6. Use a análise corporal para priorizar grupos musculares específicos`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
