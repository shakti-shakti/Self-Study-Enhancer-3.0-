
// supabase/functions/fetch_puzzle_for_level/index.ts

import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set.');
    return new Response(JSON.stringify({ error: 'AI service not configured (GEMINI_API_KEY missing)' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    const { user_id, puzzle_id, level } = await req.json();

    if (!user_id || !puzzle_id || level === undefined || level <= 1) { // Level 1 is static
        return new Response(JSON.stringify({ error: 'Invalid input: user_id, puzzle_id, or level (must be > 1) missing or invalid.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        },
      }
    );

    const { data: puzzleData, error: puzzleError } = await supabaseClient
      .from('puzzles')
      .select('name, description, subject, category, base_definition, max_level, default_xp_award')
      .eq('id', puzzle_id)
      .single();

    if (puzzleError || !puzzleData) {
      console.error('Error fetching puzzle definition:', puzzleError?.message || 'Puzzle not found');
      return new Response(JSON.stringify({ error: 'Error fetching puzzle definition' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { name, description, subject, category, base_definition, max_level, default_xp_award } = puzzleData;

    if (level > max_level) {
        return new Response(JSON.stringify({ error: `Level ${level} exceeds max level ${max_level} for this puzzle.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // Construct a more detailed prompt for Gemini
    const promptText = `
      You are a puzzle generator for a NEET (medical entrance exam) preparation app.
      The puzzle is: "${name}" (Category: ${category}, Subject: ${subject || 'General'}).
      Description: "${description || 'Solve this puzzle.'}"
      Base definition/type details: ${JSON.stringify(base_definition)}

      Generate a new puzzle variation for LEVEL ${level} (out of ${max_level}).
      The difficulty should increase appropriately for this level.
      If the puzzle involves specific data (like words for anagrams, sequences, equations), provide that new data.
      Output ONLY a JSON object with the following structure:
      {
        "question": "The main question or instruction for this level.",
        "inputType": "text" | "textarea" | "radio" | "checkbox" | "number",
        "options": ["option1", "option2"] | null, // Only for 'radio' or 'checkbox'
        "data": { /* Any specific data needed for this puzzle type, e.g., {"scrambled_word": "XFGHI"}, {"sequence_start": [1,2,3]} */ },
        "solutionCriteriaForAI": "A brief, clear instruction for another AI to evaluate the user's answer for correctness. For example: 'The answer should be X.' or 'The sequence must follow Y pattern.'",
        "hint": "An optional hint for the user.",
        "level_specific_xp_award": ${default_xp_award || 10} 
      }
      Ensure the JSON is valid. Do not include any other text or markdown formatting.
      For example, if base_definition.type is 'anagram', 'data' might be {"scrambled_word": "NEWSCRAMBLE"}.
      If base_definition.type is 'sequence_solver', 'data' might be {"display_sequence": "10, 20, 30, ?"}.
      If base_definition.type is 'missing_symbol', 'data' might be {"equation_parts": ["X", "Y", "Z"], "operators": ["+", "-"]}.
      If base_definition.type is 'knights_knaves', 'data' might be {"characters": ["C", "D"], "statements": {"C":"Statement C"}}.
    `;
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ contents: [ { parts: [ { text: promptText } ] } ] }),
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        console.error('Error calling Gemini API:', geminiResponse.status, errorBody);
         return new Response(JSON.stringify({ error: 'Error generating puzzle content with AI', details: errorBody }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: geminiResponse.status,
        });
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

     if (!generatedText) {
         console.error('Gemini API returned no content:', JSON.stringify(geminiData, null, 2));
          return new Response(JSON.stringify({ error: 'AI failed to generate puzzle content' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
         });
     }

     let puzzleContent;
     try {
         // Gemini often wraps JSON in ```json ... ```
         const cleanedJsonString = generatedText.replace(/^```json\s*|\s*```$/g, '').trim();
         puzzleContent = JSON.parse(cleanedJsonString);
     } catch (parseError) {
         console.error('Error parsing Gemini JSON output:', parseError, 'Raw output:', generatedText);
          return new Response(JSON.stringify({ error: 'AI generated invalid JSON', rawOutput: generatedText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
         });
     }

    return new Response(JSON.stringify(puzzleContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in fetch_puzzle_for_level function:', error.message || error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
    