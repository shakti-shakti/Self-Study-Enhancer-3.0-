// use server'

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
  quizQuestion: z.string().describe('A quiz question related to the topic.'),
  timeSuggestion: z.string().describe('A suggestion for how to allocate time.'),
  nextTopicSuggestion: z.string().describe('A suggestion for what to study next.'),
});
export type ModerateStudyRoomOutput = z.infer<typeof ModerateStudyRoomOutputSchema>;

export async function moderateStudyRoom(input: ModerateStudyRoomInput): Promise<ModerateStudyRoomOutput> {
  return moderateStudyRoomFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateStudyRoomPrompt',
  input: {schema: ModerateStudyRoomInputSchema},
  output: {schema: ModerateStudyRoomOutputSchema},
  prompt: `You are an AI moderator for a student study room. Your goals are to:

- Ask quiz questions to test the students' understanding.
- Keep time by suggesting how long to spend on each topic.
- Suggest what to study next, based on the current topic and the students' needs.

The current activity is: {{{currentActivity}}}

The student needs help with: {{{studentQuestion}}}

The topic is: {{{topic}}}.

{{#if chapter}}The chapter is: {{{chapter}}}.{{/if}}
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
