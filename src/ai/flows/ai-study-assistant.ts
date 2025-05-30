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
  context: z.string().optional().describe('Additional context or information related to the query.'),
  studyTipsPreferences: z.string().optional().describe('Preferences for study tips, e.g., learning style, subjects.'),
});
export type StudyAssistantInput = z.infer<typeof StudyAssistantInputSchema>;

const StudyAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI assistant\'s answer to the question or explanation of the concept.'),
  studyTips: z.array(z.string()).describe('Personalized study tips to help the student learn.'),
});
export type StudyAssistantOutput = z.infer<typeof StudyAssistantOutputSchema>;

export async function studyAssistant(input: StudyAssistantInput): Promise<StudyAssistantOutput> {
  return studyAssistantFlow(input);
}

const studyAssistantPrompt = ai.definePrompt({
  name: 'studyAssistantPrompt',
  input: {schema: StudyAssistantInputSchema},
  output: {schema: StudyAssistantOutputSchema},
  prompt: `You are an AI study assistant designed to help students understand complex concepts, answer their questions, and provide personalized study tips.

  Student Query: {{{query}}}
  Context: {{{context}}}
  Study Tip Preferences: {{{studyTipsPreferences}}}

  Answer the student's question clearly and concisely. Provide relevant explanations and examples.
  Generate personalized study tips based on the student's query, context, and study tip preferences. Make sure the study tips are tailored to the subject and learning style.

  Format your response as follows:
  Answer: [Your Answer Here]
  Study Tips: 
  - [Study Tip 1]
  - [Study Tip 2]
  - [Study Tip 3]
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

