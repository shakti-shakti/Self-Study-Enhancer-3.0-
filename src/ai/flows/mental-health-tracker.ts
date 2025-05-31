'use server';

/**
 * @fileOverview AI-powered Mental Health and Focus Tracker.
 *
 * - getSuggestions - A function that provides personalized mental health suggestions based on mood and focus level.
 * - MentalHealthInput - The input type for the getSuggestions function.
 * - MentalHealthOutput - The return type for the getSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MentalHealthInputSchema = z.object({
  mood: z
    .string()
    .describe('The student current mood (e.g., happy, sad, anxious, stressed, neutral, calm, energized, focused).'),
  focusLevel: z
    .number()
    .min(1)
    .max(10)
    .describe('The student current focus level on a scale of 1 to 10 (1: Low, 10: High).'),
});
export type MentalHealthInput = z.infer<typeof MentalHealthInputSchema>;

const MentalHealthOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .min(2) // Ensure at least two suggestions
    .max(4) // Maximum of four suggestions
    .describe('A list of 2-4 concise, actionable suggestions for the student mental health and focus based on their input. Suggestions should be diverse and practical.'),
});
export type MentalHealthOutput = z.infer<typeof MentalHealthOutputSchema>;

export async function getSuggestions(input: MentalHealthInput): Promise<MentalHealthOutput> {
  return mentalHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mentalHealthPrompt',
  input: {schema: MentalHealthInputSchema},
  output: {schema: MentalHealthOutputSchema},
  prompt: `You are an AI mental health assistant for students preparing for NEET. Based on the student's current mood and focus level, provide 2-4 personalized, actionable, and concise suggestions to improve their well-being and focus.

Student's Mood: "{{{mood}}}"
Student's Focus Level: {{{focusLevel}}}/10

Consider the mood and focus level in combination. For example:
- If mood is "Stressed" and focus is low: Suggest a quick relaxation technique or a short break.
- If mood is "Energized" and focus is high: Suggest how to leverage this state for productive study.
- If mood is "Neutral" and focus is medium: Suggest a way to boost focus or a mindful activity.

Suggestions should be specific and easy to implement (e.g., "Try the 5-4-3-2-1 grounding technique to reduce anxiety.", "Take a 10-minute walk to refresh your mind.", "Listen to some calming music for 15 minutes.", "Plan a short, focused study session on a single topic.").
Avoid generic advice. Aim for variety in suggestions.
`,
});

const mentalHealthFlow = ai.defineFlow(
  {
    name: 'mentalHealthFlow',
    inputSchema: MentalHealthInputSchema,
    outputSchema: MentalHealthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || output.suggestions.length === 0) {
        // Fallback suggestions if AI fails or returns empty
        return {
            suggestions: [
                "Take a few deep breaths to center yourself.",
                "Consider a short break to stretch or walk around.",
                "Ensure you are hydrated and have had a nutritious snack if needed."
            ]
        };
    }
    return output;
  }
);
