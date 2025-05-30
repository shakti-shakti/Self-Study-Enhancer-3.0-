'use server';
/**
 * @fileOverview Explains quiz questions using AI.
 *
 * - explainQuizQuestion - A function that explains a quiz question using AI.
 * - ExplainQuizQuestionInput - The input type for the explainQuizQuestion function.
 * - ExplainQuizQuestionOutput - The return type for the explainQuizQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainQuizQuestionInputSchema = z.object({
  question: z.string().describe('The quiz question to explain.'),
  answer: z.string().describe('The correct answer to the question.'),
  studentAnswer: z.string().describe('The student\'s answer to the question.'),
  topic: z.string().describe('The topic of the quiz question.'),
});
export type ExplainQuizQuestionInput = z.infer<typeof ExplainQuizQuestionInputSchema>;

const ExplainQuizQuestionOutputSchema = z.object({
  explanation: z.string().describe('The AI explanation of the quiz question and answer.'),
});
export type ExplainQuizQuestionOutput = z.infer<typeof ExplainQuizQuestionOutputSchema>;

export async function explainQuizQuestion(input: ExplainQuizQuestionInput): Promise<ExplainQuizQuestionOutput> {
  return explainQuizQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainQuizQuestionPrompt',
  input: {schema: ExplainQuizQuestionInputSchema},
  output: {schema: ExplainQuizQuestionOutputSchema},
  prompt: `You are an AI quiz explainer bot. Your job is to explain to students the correct answer to a question, and why their answer was wrong.

  Question: {{{question}}}
  Correct Answer: {{{answer}}}
  Student Answer: {{{studentAnswer}}}
  Topic: {{{topic}}}

  Please provide a detailed explanation.
  `,
});

const explainQuizQuestionFlow = ai.defineFlow(
  {
    name: 'explainQuizQuestionFlow',
    inputSchema: ExplainQuizQuestionInputSchema,
    outputSchema: ExplainQuizQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
