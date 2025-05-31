// src/ai/flows/smart-doubt-resolver.ts
'use server';

/**
 * @fileOverview An AI agent that resolves student doubts by explaining the question (from an image) step-by-step or finding a matching solution from NCERT or previous NEET years.
 *
 * - resolveDoubt - A function that handles the doubt resolution process.
 * - ResolveDoubtInput - The input type for the resolveDoubt function.
 * - ResolveDoubtOutput - The return type for the resolveDoubt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResolveDoubtInputSchema = z.object({
  questionImage: z
    .string()
    .describe(
      "A photo of a tough question or handwritten doubt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  subjectContext: z.string().optional().describe("Optional: The subject of the question (e.g., Physics, Chemistry, Biology) if known by the student, to help focus the explanation."),
});
export type ResolveDoubtInput = z.infer<typeof ResolveDoubtInputSchema>;

const ResolveDoubtOutputSchema = z.object({
  questionText: z.string().optional().describe("The AI's interpretation of the question text from the image. This helps confirm if the AI understood the image correctly."),
  explanation: z
    .string()
    .describe('A step-by-step explanation of the question and how to arrive at the solution. If it is a factual question, provide the answer and reasoning. If it is a problem, break down the solution steps. Reference NCERT concepts or previous year question patterns if relevant and identifiable.'),
  sourceReference: z.string().optional().describe("If the AI can identify a similar problem or concept from NCERT or previous NEET papers, it can mention it here (e.g., 'Similar to NCERT Class 12 Physics, Chapter 3, Example 3.2' or 'Concept tested in NEET 2019').")
});
export type ResolveDoubtOutput = z.infer<typeof ResolveDoubtOutputSchema>;

export async function resolveDoubt(input: ResolveDoubtInput): Promise<ResolveDoubtOutput> {
  return resolveDoubtFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resolveDoubtPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: ResolveDoubtInputSchema},
  output: {schema: ResolveDoubtOutputSchema},
  prompt: `You are an expert NEET (Indian medical entrance exam) tutor. A student has uploaded an image of a question they are struggling with. Your task is to:
1.  Interpret the question from the image. Include this interpretation in the 'questionText' output field. If the image is unclear, state that.
2.  Provide a clear, step-by-step explanation to solve the problem or answer the question in the 'explanation' field.
3.  If possible, reference relevant NCERT concepts or similar problems from previous NEET papers in the 'sourceReference' field.
{{#if subjectContext}}The student has indicated the subject might be: {{subjectContext}}. Use this to guide your explanation if relevant.{{/if}}

Student's Question Image: {{media url=questionImage}}

Focus on making the explanation easy to understand for a NEET aspirant. Break down complex steps.
If the image contains multiple questions, focus on the most prominent one or the first one.
If the image quality is too poor to understand the question, state that in the 'explanation' and set 'questionText' to "Image unclear".
`,
});

const resolveDoubtFlow = ai.defineFlow(
  {
    name: 'resolveDoubtFlow',
    inputSchema: ResolveDoubtInputSchema,
    outputSchema: ResolveDoubtOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        return {
            questionText: "Could not interpret the image.",
            explanation: "Sorry, I was unable to process the question from the image. Please ensure the image is clear and try again."
        };
    }
    return output;
  }
);
