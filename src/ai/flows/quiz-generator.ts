'use server';
/**
 * @fileOverview Generates quiz questions based on topic, difficulty, and number of questions for NEET aspirants.
 *
 * - generateQuiz - A function that generates a quiz.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 * - QuizQuestionSchema - The Zod schema for a single quiz question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const QuizQuestionSchema = z.object({
  questionText: z.string().describe('The text of the quiz question, clearly formulated.'),
  options: z.array(z.string()).length(4).describe('An array of exactly 4 possible answer options (A, B, C, D).'),
  correctOptionIndex: z.number().int().min(0).max(3).describe('The 0-based index of the correct option in the options array.'),
  explanationPrompt: z.string().optional().describe('A prompt that can be used to generate a detailed explanation for this question. This should include the question, all options, clearly indicate the correct answer, and ask for an explanation suitable for a NEET aspirant, covering why the correct answer is right and why others are wrong.')
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The specific topic for the quiz (e.g., "Cell Biology - Mitochondria", "Physics - Laws of Motion", "Organic Chemistry - Alcohols"). Be as specific as possible for better quality.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the quiz (easy, medium, hard).'),
  numQuestions: z.number().int().min(1).max(10).describe('The number of questions to generate for the quiz (between 1 and 10).'),
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
  prompt: `You are an expert NEET (Indian medical entrance exam) question setter. Generate a quiz with {{numQuestions}} multiple-choice questions on the topic "{{topic}}" with "{{difficulty}}" difficulty.
Each question must adhere to the NEET pattern:
- Clear and unambiguous question text.
- Exactly 4 plausible options (A, B, C, D).
- One single correct answer.
- Specify the 0-based index of the correct option.
- For each question, also provide an "explanationPrompt" string. This prompt should contain:
    1. The full question text.
    2. All four options, clearly labeled (e.g., A) Option1, B) Option2, ...).
    3. A clear indication of the correct answer (e.g., "Correct Answer: B) Option2").
    4. A directive like: "Explain why this is the correct answer and why the other options are incorrect, suitable for a NEET aspirant. Cover relevant concepts."

Example for one question's explanationPrompt:
"Question: What is the primary function of mitochondria in a eukaryotic cell?
Options:
A) Protein synthesis
B) ATP production
C) Lipid storage
D) DNA replication
Correct Answer: B) ATP production
Explain why ATP production is the primary function of mitochondria and briefly describe why the other options are incorrect in this context for a NEET aspirant."

Provide the output in the specified JSON format strictly adhering to the schema. Ensure all fields are populated correctly for each question.
The questions should be relevant to the NEET syllabus.
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
    if (!output || output.questions.length === 0) {
      // Fallback if AI returns nothing or empty questions
      const fallbackQuestion: QuizQuestion = {
        questionText: `No questions could be generated for "${input.topic}" at "${input.difficulty}" level. Please try a broader topic or different settings. What is the capital of France?`,
        options: ["Berlin", "Madrid", "Paris", "Rome"],
        correctOptionIndex: 2,
        explanationPrompt: `Question: What is the capital of France? Options: A) Berlin, B) Madrid, C) Paris, D) Rome. Correct Answer: C) Paris. Explain this. This is a fallback question as the AI failed to generate topic-specific questions.`
      };
      return { questions: Array(input.numQuestions).fill(fallbackQuestion).map((q,i)=> ({...q, questionText: `${q.questionText} (Fallback ${i+1})`})) };
    }
    // Ensure explanationPrompt is robustly added if model misses it
    const questionsWithGuaranteedExplanation = output.questions.map(q => ({
      ...q,
      explanationPrompt: q.explanationPrompt || `Question: ${q.questionText}\nOptions:\n${q.options.map((opt, i) => `${String.fromCharCode(65+i)}) ${opt}`).join('\n')}\nCorrect Answer: ${q.options[q.correctOptionIndex]}\nExplain why this is the correct answer and why the other options are incorrect for a NEET aspirant, covering relevant concepts.`,
    }));

    return { questions: questionsWithGuaranteedExplanation };
  }
);
