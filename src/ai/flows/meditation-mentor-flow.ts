
// src/ai/flows/meditation-mentor-flow.ts
'use server';
/**
 * @fileOverview An AI meditation mentor that provides guided meditation scripts.
 *
 * - generateMeditation - Generates a meditation script based on stress level and duration.
 * - GenerateMeditationInput - Input schema for the meditation mentor.
 * - GenerateMeditationOutput - Output schema for the meditation mentor.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMeditationInputSchema = z.object({
  stressLevel: z.number().min(1).max(10).describe('The student\'s current stress level (1=low, 10=high).'),
  durationPreference: z.enum(['1 minute', '3 minutes', '5 minutes']).describe('Preferred duration for the meditation.'),
  focusArea: z.enum(['calm', 'focus', 'motivation', 'exam_prep', 'general_wellbeing']).optional().describe('Optional area to focus the meditation on.'),
});
export type GenerateMeditationInput = z.infer<typeof GenerateMeditationInputSchema>;

const GenerateMeditationOutputSchema = z.object({
  title: z.string().describe('A suitable title for the guided meditation.'),
  script: z.string().describe('The guided meditation script, formatted with paragraphs or line breaks for easy reading/narration. Should include pauses or cues.'),
});
export type GenerateMeditationOutput = z.infer<typeof GenerateMeditationOutputSchema>;

export async function generateMeditation(input: GenerateMeditationInput): Promise<GenerateMeditationOutput> {
  return meditationMentorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'meditationMentorPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateMeditationInputSchema},
  output: {schema: GenerateMeditationOutputSchema},
  prompt: `You are an AI Meditation Mentor for students.
A student needs a guided meditation.
Current Stress Level: {{stressLevel}}/10.
Preferred Duration: {{durationPreference}}.
{{#if focusArea}}Focus Area: {{focusArea}}.{{else}}Focus Area: General well-being and stress reduction.{{/if}}

Generate a guided meditation script that is approximately {{durationPreference}} long.
The script should be calming, encouraging, and suitable for a student preparing for exams.
If stress is high, focus on relaxation and grounding techniques.
If focus or motivation is requested, tailor the script accordingly.
Structure the script with clear instructions (e.g., "Breathe in...", "Now, imagine...", "Feel the tension leaving your body...").
Include cues for pauses or slow speech where appropriate (e.g., by using ellipses ... or new paragraphs).
Provide a short, fitting title for this meditation session.
Output a JSON object with 'title' and 'script'.
`,
});

const meditationMentorFlow = ai.defineFlow(
  {
    name: 'meditationMentorFlow',
    inputSchema: GenerateMeditationInputSchema,
    outputSchema: GenerateMeditationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return {
        title: 'Default Calming Meditation',
        script: 'Take a deep breath in... and slowly exhale. Feel your body relax. Let go of any tension you are holding. Focus on your breath, in and out. You are calm, you are centered. Continue breathing deeply for a few moments.'
      };
    }
    return output;
  }
);
