// src/ai/flows/daily-motivation-flow.ts
'use server';
/**
 * @fileOverview Generates a daily motivational quote for NEET aspirants.
 *
 * - generateDailyMotivation - A function that returns a motivational quote.
 * - GenerateDailyMotivationInput - The input type.
 * - GenerateDailyMotivationOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyMotivationInputSchema = z.object({
  studentName: z.string().optional().describe('The student\'s name for personalization (optional).'),
  currentFocusArea: z.string().optional().describe('Student\'s current study focus, e.g., "Physics - Thermodynamics", "Biology Revision" (optional).'),
});
export type GenerateDailyMotivationInput = z.infer<typeof GenerateDailyMotivationInputSchema>;

const GenerateDailyMotivationOutputSchema = z.object({
  quote: z.string().describe('A concise, encouraging, and relevant motivational quote for a NEET aspirant.'),
});
export type GenerateDailyMotivationOutput = z.infer<typeof GenerateDailyMotivationOutputSchema>;

export async function generateDailyMotivation(input: GenerateDailyMotivationInput): Promise<GenerateDailyMotivationOutput> {
  return dailyMotivationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyMotivationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateDailyMotivationInputSchema},
  output: {schema: GenerateDailyMotivationOutputSchema},
  prompt: `You are an AI that generates a single, short, and powerful daily motivational quote for a NEET aspirant.
{{#if studentName}}Address the student, {{studentName}}, if possible in a natural way.{{/if}}
{{#if currentFocusArea}}Relate the quote subtly to their current focus: "{{currentFocusArea}}", if possible.{{/if}}
The quote should be highly encouraging, instill confidence, and be relevant to the hard work of exam preparation.
Keep it concise, ideally one sentence. Avoid clichés if possible.

Example:
{{#if studentName}}
"{{studentName}}, every concept mastered today is a step closer to your dream. Keep pushing!"
{{else}}
"Each challenge overcome builds the strength you need for success. You've got this!"
{{/if}}

Generate a new, inspiring quote.`,
});

const dailyMotivationFlow = ai.defineFlow(
  {
    name: 'dailyMotivationFlow',
    inputSchema: GenerateDailyMotivationInputSchema,
    outputSchema: GenerateDailyMotivationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.quote) {
      return {
        quote: "Believe in your preparation and stay focused. Success is built on consistent effort."
      };
    }
    return output;
  }
);

    