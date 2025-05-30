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
    .describe('The student current mood (e.g., happy, sad, anxious).'),
  focusLevel: z
    .number()
    .min(1)
    .max(10)
    .describe('The student current focus level on a scale of 1 to 10.'),
});
export type MentalHealthInput = z.infer<typeof MentalHealthInputSchema>;

const MentalHealthOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of suggestions for the student mental health.'),
});
export type MentalHealthOutput = z.infer<typeof MentalHealthOutputSchema>;

export async function getSuggestions(input: MentalHealthInput): Promise<MentalHealthOutput> {
  return mentalHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mentalHealthPrompt',
  input: {schema: MentalHealthInputSchema},
  output: {schema: MentalHealthOutputSchema},
  prompt: `You are an AI mental health assistant for students. Based on the student current mood and focus level, provide personalized suggestions to improve their mental health and focus.

Mood: {{{mood}}}
Focus Level: {{{focusLevel}}}

Suggestions should include specific actions related to rest, breathing exercises, or motivational thoughts. Give at least three distinct suggestions.`,
});

const mentalHealthFlow = ai.defineFlow(
  {
    name: 'mentalHealthFlow',
    inputSchema: MentalHealthInputSchema,
    outputSchema: MentalHealthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
