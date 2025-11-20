import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing meal photo with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um nutricionista especializado. Analise a foto da refeição e forneça informações nutricionais estimadas. Seja preciso e realista nas estimativas.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta foto de refeição e forneça as informações nutricionais em formato JSON. Retorne APENAS o objeto JSON, sem texto adicional. Use este formato exato: {"meal_name": "nome da refeição", "calories": número_inteiro, "carbs": número_inteiro_em_gramas, "protein": número_inteiro_em_gramas, "fat": número_inteiro_em_gramas}'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No analysis returned from AI');
    }

    console.log('AI Response:', content);

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const mealData = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!mealData.meal_name || !mealData.calories) {
      throw new Error('Missing required nutritional information');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          meal_name: mealData.meal_name,
          calories: parseInt(mealData.calories),
          carbs: parseInt(mealData.carbs || 0),
          protein: parseInt(mealData.protein || 0),
          fat: parseInt(mealData.fat || 0),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-meal-photo function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});