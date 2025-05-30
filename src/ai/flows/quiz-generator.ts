'use server';
/**
 * @fileOverview Generates quiz questions based on topic, difficulty, and number of questions.
 *
 * - generateQuiz - A function that generates a quiz.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 * - QuizQuestionSchema - The Zod schema for a single quiz question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the quiz question.'),
  options: z.array(z.string()).describe('An array of possible answers (e.g., 4 options).'),
  correctOptionIndex: z.number().int().min(0).describe('The 0-based index of the correct option in the options array.'),
  explanationPrompt: z.string().optional().describe('A prompt that can be used to generate an explanation for this question and its correct answer. This should include the question, all options, and clearly indicate the correct answer.')
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz (e.g., Biology, Physics, Chemistry chapter name or concept).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the quiz.'),
  numQuestions: z.number().int().min(1).max(20).describe('The number of questions to generate for the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of generated quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an expert NEET exam question setter. Generate a quiz with {{numQuestions}} questions on the topic "{{topic}}" with "{{difficulty}}" difficulty.
Each question must have a clear question text, exactly 4 multiple-choice options, and you must specify the 0-based index of the correct option.
For each question, also provide an "explanationPrompt" string. This prompt should contain the full question, all its options, and clearly state which option is correct. This will be used later to generate a detailed explanation if the student requests it.

Example for explanationPrompt:
"Question: What is the powerhouse of the cell?
Options:
A) Nucleus
B) Mitochondrion
C) Ribosome
D) Endoplasmic Reticulum
Correct Answer: B) Mitochondrion
Explain why Mitochondrion is the correct answer and why the other options are incorrect for a NEET aspirant."

Provide the output in the specified JSON format.
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate quiz questions. The AI model did not return valid output.');
    }
    // Ensure explanationPrompt is added if missing, using a generic prompt.
    // This is a fallback, ideally the model includes it based on the main prompt.
    const questionsWithFallbackExplanation = output.questions.map(q => ({
      ...q,
      explanationPrompt: q.explanationPrompt || `Question: ${q.questionText} Options: ${q.options.map((opt, i) => `${String.fromCharCode(65+i)}) ${opt}`).join('; ')}. Correct Answer: ${q.options[q.correctOptionIndex]}. Explain this.`,
    }));

    return { questions: questionsWithFallbackExplanation };
  }
);
