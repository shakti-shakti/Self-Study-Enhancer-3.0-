'use server';

/**
 * @fileOverview AI moderator for study rooms, providing quiz questions, time management, and study suggestions.
 *
 * - moderateStudyRoom - A function that moderates the study room.
 * - ModerateStudyRoomInput - The input type for the moderateStudyRoom function.
 * - ModerateStudyRoomOutput - The return type for the moderateStudyRoom function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateStudyRoomInputSchema = z.object({
  topic: z.string().describe('The topic of the study session.'),
  chapter: z.string().optional().describe('The specific chapter to focus on (optional).'),
  studentQuestion: z.string().describe('The student\u2019s question, or topic they need help with.'),
  currentActivity: z.string().optional().describe('The current activity happening in the study room.'),
});
export type ModerateStudyRoomInput = z.infer<typeof ModerateStudyRoomInputSchema>;

const ModerateStudyRoomOutputSchema = z.object({
  quizQuestion: z.string().optional().describe('A quiz question related to the topic. Optional, provide if relevant.'),
  timeSuggestion: z.string().optional().describe('A suggestion for how to allocate time. Optional, provide if relevant.'),
  nextTopicSuggestion: z.string().optional().describe('A suggestion for what to study next. Optional, provide if relevant.'),
  clarificationOrAnswer: z.string().optional().describe('A direct clarification or answer to the student studentQuestion if it is a simple factual query or needs explanation. Optional.')
});
export type ModerateStudyRoomOutput = z.infer<typeof ModerateStudyRoomOutputSchema>;

export async function moderateStudyRoom(input: ModerateStudyRoomInput): Promise<ModerateStudyRoomOutput> {
  return moderateStudyRoomFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateStudyRoomPrompt',
  input: {schema: ModerateStudyRoomInputSchema},
  output: {schema: ModerateStudyRoomOutputSchema},
  prompt: `You are an AI moderator for a student study room focused on NEET preparation. Your goals are to:
- If the student's input seems like a question, provide a concise clarificationOrAnswer.
- Ask relevant quiz questions to test understanding related to the current topic.
- Suggest how long to spend on activities or topics.
- Suggest what to study next, based on the current topic or student's needs.
- Keep the discussion focused and productive.

Current Activity (if any): {{{currentActivity}}}
Student's Latest Input/Question: "{{{studentQuestion}}}"
Main Topic of the Room: {{{topic}}}
{{#if chapter}}Specific Chapter: {{{chapter}}}{{/if}}

Based on the student's input and the room's topic, provide helpful moderation.
If the student asked a direct question that you can answer factually or explain briefly, prioritize that in 'clarificationOrAnswer'.
Only provide a quiz question if it feels natural and relevant to the ongoing discussion or student's input. Do not always provide a quiz question.
Be concise. If no specific action is needed from you (e.g., students are just chatting generally), you can return empty or minimal suggestions.
`,
});

const moderateStudyRoomFlow = ai.defineFlow(
  {
    name: 'moderateStudyRoomFlow',
    inputSchema: ModerateStudyRoomInputSchema,
    outputSchema: ModerateStudyRoomOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
