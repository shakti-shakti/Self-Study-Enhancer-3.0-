// supabase/functions/fetch_puzzle_for_level/index.ts

import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, puzzle_id, level } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        },
      }
    );

    // Fetch base puzzle definition
    const { data: puzzleData, error: puzzleError } = await supabaseClient
      .from('puzzles')
      .select('base_definition, max_level')
      .eq('id', puzzle_id)
      .single();

    if (puzzleError || !puzzleData) {
      console.error('Error fetching puzzle definition:', puzzleError?.message || 'Puzzle not found');
      return new Response(JSON.stringify({ error: 'Error fetching puzzle definition' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { base_definition, max_level } = puzzleData;

    if (level > max_level) {
        return new Response(JSON.stringify({ error: `Level ${level} exceeds max level ${max_level} for this puzzle.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }


    // Call Gemini API to generate puzzle content for the level
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: `Generate puzzle content for puzzle "${puzzle_id}" at level ${level}. The base definition is: ${JSON.stringify(base_definition)}. Make the difficulty appropriate for level ${level} (out of ${max_level}). Provide the output in JSON format containing the puzzle parameters needed for the frontend. Include the correct solution in the JSON.`
                        }
                    ]
                }
            ]
        }),
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
    const generatedContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

     if (!generatedContent) {
         console.error('Gemini API returned no content:', JSON.stringify(geminiData, null, 2));
          return new Response(JSON.stringify({ error: 'AI failed to generate puzzle content' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
         });
     }

     // Attempt to parse the JSON output from Gemini
     let puzzleContent;
     try {
         puzzleContent = JSON.parse(generatedContent.replace(/
```
json\n?|\n?
```
/g, '').trim()); // Clean up markdown code block
     } catch (parseError) {
         console.error('Error parsing Gemini JSON output:', parseError, 'Raw output:', generatedContent);
          return new Response(JSON.stringify({ error: 'AI generated invalid JSON', rawOutput: generatedContent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
         });
     }


    // Return the generated puzzle content
    return new Response(JSON.stringify(puzzleContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in fetch_puzzle_for_level function:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});