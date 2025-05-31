// src/ai/flows/daily-challenge-flow.ts
'use server';
/**
 * @fileOverview Generates a daily study challenge for NEET aspirants.
 *
 * - generateDailyChallenge - A function that returns a daily challenge.
 * - GenerateDailyChallengeInput - The input type.
 * - GenerateDailyChallengeOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyChallengeInputSchema = z.object({
  studentFocusArea: z.string().optional().describe('Student\'s current study focus, e.g., "Physics - Thermodynamics", "Biology Revision", "Chemistry - Organic Names" (optional).'),
  difficultyPreference: z.enum(['easy', 'medium', 'hard']).optional().describe('Preferred difficulty for the challenge (optional).'),
});
export type GenerateDailyChallengeInput = z.infer<typeof GenerateDailyChallengeInputSchema>;

const GenerateDailyChallengeOutputSchema = z.object({
  challengeTitle: z.string().describe('A short, engaging title for the challenge (e.g., "Kinematics Quickfire", "Mole Concept Mastery").'),
  challengeDescription: z.string().describe('A concise description of the daily study challenge. Should be specific and actionable (e.g., "Solve 5 MCQs on projectile motion.", "Draw and label the structure of a nephron.", "Write short notes on 3 named reactions in aldehydes.").'),
  subjectHint: z.string().optional().describe('A hint about the subject or topic this challenge relates to (e.g., "Physics", "Botany - Plant Anatomy", "Organic Chemistry").'),
});
export type GenerateDailyChallengeOutput = z.infer<typeof GenerateDailyChallengeOutputSchema>;

export async function generateDailyChallenge(input: GenerateDailyChallengeInput): Promise<GenerateDailyChallengeOutput> {
  return dailyChallengeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyChallengePrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateDailyChallengeInputSchema},
  output: {schema: GenerateDailyChallengeOutputSchema},
  prompt: `You are an AI that generates a single, actionable, and motivating daily study challenge for a NEET aspirant.
The challenge should be specific enough to be completed in a reasonable timeframe (e.g., 30-60 minutes).
It should align with typical NEET syllabus areas (Physics, Chemistry, Botany, Zoology).

{{#if studentFocusArea}}
Consider the student's current focus: "{{studentFocusArea}}". Try to make the challenge relevant to this if possible.
{{/if}}

{{#if difficultyPreference}}
Tailor the challenge to the "{{difficultyPreference}}" difficulty level.
'Easy' could be recalling definitions or solving simple problems.
'Medium' could involve applying concepts or comparing/contrasting.
'Hard' could involve multi-step problems, critical thinking, or deriving relations.
{{else}}
Assume a 'medium' difficulty.
{{/if}}

Provide a short, catchy 'challengeTitle'.
Provide a clear 'challengeDescription' outlining the task.
Provide an optional 'subjectHint' if applicable.

Example:
Input: { studentFocusArea: "Biology - Genetics", difficultyPreference: "medium" }
Output:
{
  "challengeTitle": "Mendel's Cross Check",
  "challengeDescription": "Perform a dihybrid cross for two traits (e.g., seed shape and color) and predict the phenotypic ratios in the F2 generation. List all possible genotypes.",
  "subjectHint": "Biology - Genetics"
}

Another Example (General):
Input: {}
Output:
{
  "challengeTitle": "Formula Flashback",
  "challengeDescription": "Write down 10 important formulas from Physics - Mechanics without looking at your notes. Then verify them.",
  "subjectHint": "Physics - Mechanics"
}

Generate a new, specific, and useful daily challenge.`,
});

const dailyChallengeFlow = ai.defineFlow(
  {
    name: 'dailyChallengeFlow',
    inputSchema: GenerateDailyChallengeInputSchema,
    outputSchema: GenerateDailyChallengeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.challengeDescription) {
      return { // Fallback challenge
        challengeTitle: "Topic Teaser",
        challengeDescription: "Pick one challenging topic from today's study plan and explain it to an imaginary student in 5 bullet points.",
        subjectHint: "General Study Skill"
      };
    }
    return output;
  }
);
