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
    const { exerciseName } = await req.json();
    
    if (!exerciseName) {
      throw new Error("Exercise name is required");
    }

    const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
    if (!RAPIDAPI_KEY) {
      throw new Error("RAPIDAPI_KEY not configured");
    }

    console.log("Searching for exercise:", exerciseName);

    // Search exercise by name
    const searchResponse = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(exerciseName)}?limit=1`,
      {
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`API error: ${searchResponse.status}`);
    }

    const exercises = await searchResponse.json();
    
    if (!exercises || exercises.length === 0) {
      return new Response(
        JSON.stringify({ error: "Exercise not found" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    const exercise = exercises[0];

    return new Response(
      JSON.stringify(exercise),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in search-exercise:", error);
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
