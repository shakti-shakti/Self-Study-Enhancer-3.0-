// supabase/functions/submit_puzzle_solution/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors-headers.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        },
      }
    );

    const { user_id, puzzle_id, level, solution } = await req.json();

    if (!user_id || !puzzle_id || level === undefined || solution === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id, puzzle_id, level, or solution' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch user's current level for this puzzle
    const { data: userProgress, error: fetchProgressError } = await supabaseClient
      .from('user_puzzle_progress')
      .select('current_level')
      .eq('user_id', user_id)
      .eq('puzzle_id', puzzle_id)
      .single();

    if (fetchProgressError && fetchProgressError.code !== 'PGRST116') {
       console.error('Error fetching user puzzle progress:', fetchProgressError);
        return new Response(
            JSON.stringify({ error: 'Database error fetching progress', details: fetchProgressError.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }

    const currentLevel = userProgress ? userProgress.current_level : 0; // Assume level 0 if no progress entry

    // Check if the submitted level matches the user's current level (or the next expected level)
    // This prevents users from skipping levels or submitting for levels they haven't reached.
    if (level !== currentLevel + 1) {
         // Allow submitting for current level just in case of retries, but don't level up again
         if (level !== currentLevel) {
            console.warn(`User ${user_id} submitting solution for incorrect level. Submitted: ${level}, Expected: ${currentLevel + 1}`);
             return new Response(
                 JSON.stringify({ success: false, message: 'Invalid level submitted.' }),
                 {
                     status: 400,
                     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                 }
             );
         }
    }


    // --- Puzzle Evaluation Logic ---
    // This is where you'd typically fetch the correct answer/criteria from the database
    // based on puzzle_id and level.
    // For demonstration, we'll use AI to evaluate.

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or the appropriate model

    // You would likely fetch the puzzle details for the given level here
    // to provide better context to the AI for evaluation.
    // For now, a simplified prompt:
    const prompt = `Evaluate if the following solution for Puzzle ID "${puzzle_id}" at Level ${level} is correct. The puzzle description/question is needed for accurate evaluation (ideally fetched from DB or passed). User's solution: "${solution}". Respond with "CORRECT" if the solution is clearly right, and "INCORRECT" if it is wrong or incomplete. Provide a brief explanation or hint if incorrect.`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    const evaluationResult = responseText.trim().toUpperCase(); // Standardize the response

    let isCorrect = false;
    let evaluationFeedback = "Could not determine correctness.";

    if (evaluationResult.includes("CORRECT")) {
        isCorrect = true;
        evaluationFeedback = "Your solution is correct!";
    } else {
        // Attempt to extract feedback if AI provided it after "INCORRECT"
        const feedbackMatch = responseText.match(/INCORRECT\s*:\s*(.*)/i);
         if (feedbackMatch && feedbackMatch[1]) {
            evaluationFeedback = feedbackMatch[1].trim();
        } else {
             evaluationFeedback = responseText.trim(); // Use full AI response if not in expected format
         }
        isCorrect = false;
    }

    // --- End Puzzle Evaluation Logic ---

    if (isCorrect) {
      // Fetch max level for the puzzle
       const { data: puzzleData, error: fetchPuzzleError } = await supabaseClient
         .from('puzzles')
         .select('max_level')
         .eq('id', puzzle_id)
         .single();

       if (fetchPuzzleError) {
          console.error('Error fetching puzzle data for max level:', fetchPuzzleError);
          // Proceed with level update, but log the error
       }

       const maxLevel = puzzleData?.max_level || 30; // Default max level if fetch fails


       if (level < maxLevel) { // Only level up if not at max level
            // Update user's level in the database
            const { error: updateProgressError } = await supabaseClient
              .from('user_puzzle_progress')
              .upsert(
                {
                  user_id: user_id,
                  puzzle_id: puzzle_id,
                  current_level: level + 1, // Increment level
                  updated_at: new Date().toISOString(),
                  unlocked_at: userProgress?.current_level === 0 ? new Date().toISOString() : userProgress?.unlocked_at // Keep original unlock time if already started
                },
                { onConflict: 'user_id, puzzle_id' }
              );

            if (updateProgressError) {
              console.error('Error updating user puzzle progress:', updateProgressError);
              return new Response(
                  JSON.stringify({ success: true, message: 'Solution correct, but failed to update level.' }),
                  {
                      status: 500,
                      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  }
              );
            }

            return new Response(
              JSON.stringify({ success: true, correct: true, message: `Correct! You've advanced to level ${level + 1}.` }),
              {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
       } else {
            // User solved the max level
             return new Response(
                JSON.stringify({ success: true, correct: true, message: `Correct! You've completed all ${maxLevel} levels for this puzzle.` }),
                 {
                     status: 200,
                     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                 }
             );
       }

    } else {
      // Solution is incorrect
      return new Response(
        JSON.stringify({ success: true, correct: false, message: `Incorrect. ${evaluationFeedback}` }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Error processing puzzle solution:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});