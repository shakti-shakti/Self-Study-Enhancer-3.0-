
// supabase/functions/submit_puzzle_solution/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable is not set.');
    return new Response(JSON.stringify({ error: 'AI service not configured (GEMINI_API_KEY missing)' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch puzzle base definition and level-specific criteria (if stored)
    const { data: puzzleDetails, error: fetchPuzzleError } = await supabaseClient
      .from('puzzles')
      .select('name, description, subject, category, base_definition, max_level, default_xp_award') // Add more fields as needed
      .eq('id', puzzle_id)
      .single();

    if (fetchPuzzleError || !puzzleDetails) {
      console.error('Error fetching puzzle details:', fetchPuzzleError?.message || 'Puzzle not found');
      return new Response(JSON.stringify({ error: 'Error fetching puzzle details' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const { name: puzzleName, description: puzzleDescription, subject, category, base_definition, max_level, default_xp_award } = puzzleDetails;


    // Fetch user's current progress
    const { data: userProgress, error: fetchProgressError } = await supabaseClient
      .from('user_puzzle_progress')
      .select('current_level, unlocked_at')
      .eq('user_id', user_id)
      .eq('puzzle_id', puzzle_id)
      .single();

    if (fetchProgressError && fetchProgressError.code !== 'PGRST116') { // PGRST116 = no rows, new player for this puzzle
       console.error('Error fetching user puzzle progress:', fetchProgressError);
        return new Response(JSON.stringify({ error: 'Database error fetching progress', details: fetchProgressError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    const currentLevelOnRecord = userProgress ? userProgress.current_level : 0;

    if (level !== currentLevelOnRecord + 1 && level !== currentLevelOnRecord ) { // Allow submitting for current level again
        console.warn(`User ${user_id} submitting solution for incorrect level. Submitted: ${level}, Expected: ${currentLevelOnRecord + 1} or ${currentLevelOnRecord}`);
         return new Response(JSON.stringify({ success: false, message: 'Invalid level submitted for evaluation.' }),
             { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
         );
    }
    
    // Placeholder: Fetch actual solution criteria for this level if it was stored (e.g., from AI generation step)
    // For now, we rely on `base_definition.solutionCriteriaForAI` if it exists, or a generic prompt.
    const solutionCriteria = (base_definition as any)?.solutionCriteriaForAI || `The solution should correctly solve the puzzle type: ${(base_definition as any)?.type} for puzzle "${puzzleName}".`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Task: Evaluate a user's solution for a puzzle.
      Puzzle Name: "${puzzleName}"
      Puzzle Type: "${(base_definition as any)?.type}"
      Subject: ${subject || 'General'}
      Category: ${category}
      Current Level: ${level} (out of ${max_level})
      Puzzle Description or Question for this level: "${puzzleDescription || 'Solve this.'}" (Ideally, the dynamic question for *this level* would be passed here if available)
      User's Solution: "${JSON.stringify(solution)}"
      Correctness Criteria: "${solutionCriteria}"

      Is the user's solution correct based on the criteria?
      Respond with ONLY "CORRECT" or "INCORRECT".
      If "INCORRECT", optionally follow with a COLON and a VERY BRIEF, helpful hint (max 15 words).
      Example 1: CORRECT
      Example 2: INCORRECT: The sequence should involve adding the previous two numbers.
      Example 3: INCORRECT: Check the units for your final answer.
    `;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    const evaluationResult = responseText.trim().toUpperCase();

    let isCorrect = false;
    let evaluationFeedback = "AI evaluation unclear. Please try again or contact support.";

    if (evaluationResult.startsWith("CORRECT")) {
        isCorrect = true;
        evaluationFeedback = "Your solution is correct!";
    } else if (evaluationResult.startsWith("INCORRECT")) {
        isCorrect = false;
        evaluationFeedback = responseText.substring("INCORRECT".length).replace(/^[:\s]*/, '').trim() || "That's not quite right. Give it another thought!";
    } else {
        // Fallback if AI response is not as expected
        isCorrect = false; // Assume incorrect if can't parse
        evaluationFeedback = "Could not automatically verify the solution with AI. " + responseText.substring(0, 100);
    }

    let newXP = 0;
    if (isCorrect) {
      newXP = (base_definition as any)?.level_specific_xp_award || default_xp_award || 10;
      // If you have an RLS policy on profiles preventing direct updates from service_role, use an RPC or disable RLS for this specific update.
      // For simplicity, assuming direct update works with service_role key here.
      const { error: xpError } = await supabaseClient.rpc('increment_leaderboard_score', {
        p_user_id: user_id,
        p_score_increment: newXP, // Using xpAward as score increment here
        p_period: 'all_time' // Assuming 'all_time' for puzzle XP
      });
      if (xpError) console.error("Error incrementing XP via RPC for puzzle solve:", xpError);
    }


    if (isCorrect && level === currentLevelOnRecord) { // User re-solved current level (e.g., after page refresh)
         return new Response(JSON.stringify({ success: true, correct: true, message: `Correct again for level ${level}!`, newXP: newXP, newLevel: level, puzzleCompleted: level >= max_level }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }


    if (isCorrect && level > currentLevelOnRecord) { // New level solved
      const newLevelToRecord = level; // Since level is 1-based, and currentLevelOnRecord is 0-based if new
      const isPuzzleCompleted = newLevelToRecord >= max_level;

      const { error: updateProgressError } = await supabaseClient
        .from('user_puzzle_progress')
        .upsert(
          {
            user_id: user_id,
            puzzle_id: puzzle_id,
            current_level: newLevelToRecord,
            last_updated_at: new Date().toISOString(),
            unlocked_at: userProgress?.unlocked_at || new Date().toISOString(),
            completed_at: isPuzzleCompleted ? new Date().toISOString() : null,
          },
          { onConflict: 'user_id, puzzle_id' }
        );

      if (updateProgressError) {
        console.error('Error updating user puzzle progress:', updateProgressError);
        return new Response(JSON.stringify({ success: true, correct: true, message: 'Solution correct, but failed to update level progress.', newXP }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      return new Response(JSON.stringify({ 
          success: true, 
          correct: true, 
          message: isPuzzleCompleted ? `Correct! You've completed all ${max_level} levels of this puzzle!` : `Correct! You've advanced to level ${newLevelToRecord + 1}.`,
          newLevel: isPuzzleCompleted ? newLevelToRecord : newLevelToRecord + 1,
          puzzleCompleted: isPuzzleCompleted,
          newXP
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else { // Incorrect or no level advancement
      return new Response(JSON.stringify({ success: true, correct: false, message: evaluationFeedback, newXP: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing puzzle solution:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
    