'use server';
/**
 * @fileOverview Explains quiz questions using AI, tailored for NEET aspirants.
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
  topic: z.string().describe('The topic or subject of the quiz question (e.g., Physics, Botany - Cell Biology).'),
});
export type ExplainQuizQuestionInput = z.infer<typeof ExplainQuizQuestionInputSchema>;

const ExplainQuizQuestionOutputSchema = z.object({
  explanation: z.string().describe('The AI explanation of the quiz question, correct answer, and why the student answer (if incorrect) was wrong. Tailored for a NEET aspirant, referencing concepts and common pitfalls if applicable.'),
});
export type ExplainQuizQuestionOutput = z.infer<typeof ExplainQuizQuestionOutputSchema>;

export async function explainQuizQuestion(input: ExplainQuizQuestionInput): Promise<ExplainQuizQuestionOutput> {
  return explainQuizQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainQuizQuestionPrompt',
  input: {schema: ExplainQuizQuestionInputSchema},
  output: {schema: ExplainQuizQuestionOutputSchema},
  prompt: `You are an expert AI tutor for NEET (medical entrance exam) aspirants. Your job is to explain quiz questions clearly and thoroughly.

Context:
Question: "{{{question}}}"
Correct Answer: "{{{answer}}}"
Student's Answer: "{{{studentAnswer}}}"
Topic: "{{{topic}}}"

Please provide a detailed explanation covering:
1.  Why the correct answer ("{{{answer}}}") is correct. Explain the underlying concept(s) from the NEET syllabus.
2.  If the student's answer ("{{{studentAnswer}}}") is incorrect, explain why it's wrong. Address any common misconceptions related to it.
3.  If the student's answer is correct, reinforce their understanding.
4.  Keep the language clear, concise, and suitable for a NEET aspirant. Use examples if they help clarify.
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
