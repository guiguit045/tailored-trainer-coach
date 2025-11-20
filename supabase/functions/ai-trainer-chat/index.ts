import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de termos em português para targets do ExerciseDB
const muscleTargetMap: Record<string, string> = {
  "peito": "pectorals",
  "peitoral": "pectorals",
  "costas": "lats",
  "dorsal": "lats",
  "ombro": "delts",
  "ombros": "delts",
  "deltoides": "delts",
  "bíceps": "biceps",
  "biceps": "biceps",
  "tríceps": "triceps",
  "triceps": "triceps",
  "perna": "quads",
  "pernas": "quads",
  "quadríceps": "quads",
  "quadriceps": "quads",
  "panturrilha": "calves",
  "panturrilhas": "calves",
  "abdômen": "abs",
  "abdomen": "abs",
  "abdominal": "abs",
  "glúteo": "glutes",
  "gluteo": "glutes",
  "glúteos": "glutes",
  "bumbum": "glutes",
  "posterior": "hamstrings",
  "posteriores": "hamstrings",
  "antebraço": "forearms",
  "antebracos": "forearms",
  "trapézio": "traps",
  "trapezio": "traps"
};

async function searchExercises(target: string, rapidApiKey: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/target/${target}?limit=5`,
      {
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      }
    );

    if (!response.ok) {
      console.error("ExerciseDB API error:", response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return [];
  }
}

function detectMuscleGroups(message: string): string[] {
  const messageLower = message.toLowerCase();
  const detectedTargets: string[] = [];
  
  for (const [portugueseTerm, target] of Object.entries(muscleTargetMap)) {
    if (messageLower.includes(portugueseTerm)) {
      if (!detectedTargets.includes(target)) {
        detectedTargets.push(target);
      }
    }
  }
  
  return detectedTargets;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY not configured");
    }

    console.log("Processing AI Trainer message");

    // Detectar grupos musculares na última mensagem do usuário
    const lastUserMessage = messages[messages.length - 1];
    const muscleGroups = detectMuscleGroups(lastUserMessage.content);
    
    let exerciseContext = "";
    
    // Buscar exercícios se grupos musculares foram detectados
    if (muscleGroups.length > 0) {
      console.log("Detected muscle groups:", muscleGroups);
      const allExercises: any[] = [];
      
      for (const target of muscleGroups) {
        const exercises = await searchExercises(target, RAPIDAPI_KEY);
        allExercises.push(...exercises);
      }
      
      if (allExercises.length > 0) {
        exerciseContext = "\n\nEXERCÍCIOS DISPONÍVEIS NA BIBLIOTECA:\n";
        allExercises.forEach((ex, index) => {
          exerciseContext += `${index + 1}. ${ex.name} (${ex.target})\n`;
          exerciseContext += `   - Equipamento: ${ex.equipment}\n`;
          exerciseContext += `   - Parte do corpo: ${ex.bodyPart}\n`;
          if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
            exerciseContext += `   - Músculos secundários: ${ex.secondaryMuscles.join(", ")}\n`;
          }
          exerciseContext += `   - Instruções: ${ex.instructions ? ex.instructions.slice(0, 2).join(" ") : "N/A"}\n\n`;
        });
      }
    }

    // Add system message to guide the AI
    const systemMessage = {
      role: "system",
      content: `Você é o TrainerIA, um personal trainer virtual especializado em academia, treino e dieta. 
      Responda APENAS perguntas relacionadas a exercícios físicos, treinos, nutrição, dieta e saúde fitness.
      Seja motivador, profissional e educado. Responda sempre em português.
      Se a pergunta não for sobre esses tópicos, educadamente redirecione o usuário para questões sobre fitness.
      
      Quando sugerir exercícios, use SEMPRE os exercícios da biblioteca disponível abaixo.
      Explique como fazer cada exercício, seus benefícios e dicas de execução.
      ${exerciseContext}`
    };

    const response = await fetch("https://chatgpt-42.p.rapidapi.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
      body: JSON.stringify({
        messages: [systemMessage, ...messages],
        model: "gpt-4o-mini"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ChatGPT API error:", response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response from ChatGPT API");
    }

    return new Response(
      JSON.stringify({ 
        message: data.choices[0].message.content,
        usage: data.usage 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in ai-trainer-chat:", error);
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
