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
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY not configured");
    }

    console.log("Sending message to AI Trainer");

    // Add system message to guide the AI
    const systemMessage = {
      role: "system",
      content: `Você é o TrainerIA, um personal trainer virtual especializado em academia, treino e dieta. 
      Responda APENAS perguntas relacionadas a exercícios físicos, treinos, nutrição, dieta e saúde fitness.
      Seja motivador, profissional e educado. Responda sempre em português.
      Se a pergunta não for sobre esses tópicos, educadamente redirecione o usuário para questões sobre fitness.`
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
