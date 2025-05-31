'use server';

/**
 * @fileOverview An AI study assistant for explaining concepts, answering questions, and providing personalized study tips.
 *
 * - studyAssistant - A function that handles the study assistance process.
 * - StudyAssistantInput - The input type for the studyAssistant function.
 * - StudyAssistantOutput - The return type for the studyAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudyAssistantInputSchema = z.object({
  query: z.string().describe('The student\'s question or the concept they need help with.'),
  context: z.string().optional().describe('Additional context or information related to the query, such as current chapter or subject being studied.'),
  studyTipsPreferences: z.string().optional().describe('Preferences for study tips, e.g., learning style (visual, auditory), specific subjects they struggle with, or types of tips (mnemonics, practice strategies).'),
});
export type StudyAssistantInput = z.infer<typeof StudyAssistantInputSchema>;

const StudyAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI assistant\'s answer to the question or explanation of the concept. This should be comprehensive yet easy to understand for a NEET aspirant.'),
  studyTips: z.array(z.string()).optional().describe('Personalized study tips to help the student learn more effectively. These should be actionable and relevant to the query or context. Provide 2-3 concise tips if appropriate.'),
});
export type StudyAssistantOutput = z.infer<typeof StudyAssistantOutputSchema>;

export async function studyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  return studyAssistantFlow(input);
}

const studyAssistantPrompt = ai.definePrompt({
  name: 'studyAssistantPrompt',
  input: {schema: StudyAssistantInputSchema},
  output: {schema: StudyAssistantOutputSchema},
  prompt: `You are an expert AI study assistant for NEET (medical entrance exam) aspirants. Your goal is to explain concepts clearly, answer questions accurately, and provide personalized, actionable study tips.

Student's Query: "{{{query}}}"

{{#if context}}
Provided Context: "{{{context}}}"
{{/if}}

{{#if studyTipsPreferences}}
Student's Study Tip Preferences: "{{{studyTipsPreferences}}}"
{{/if}}

1.  **Answer/Explanation:** Provide a clear, concise, and accurate answer to the student's query. If it's a concept, explain it thoroughly with examples relevant to the NEET syllabus (Physics, Chemistry, Biology - Botany & Zoology).
2.  **Study Tips (Optional):** If appropriate, generate 2-3 personalized and actionable study tips. These tips should be based on the query, context, and any stated preferences. For example, if the query is about a tough physics concept, suggest a problem-solving strategy or a visual aid. If preferences mention "visual learner", suggest diagram-based learning.

Ensure the tone is encouraging and supportive.
`,
});

const studyAssistantFlow = ai.defineFlow(
  {
    name: 'studyAssistantFlow',
    inputSchema: StudyAssistantInputSchema,
    outputSchema: StudyAssistantOutputSchema,
  },
  async input => {
    const {output} = await studyAssistantPrompt(input);
    return output!;
  }
);
