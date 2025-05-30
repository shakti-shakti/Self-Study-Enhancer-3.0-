// src/ai/flows/smart-doubt-resolver.ts
'use server';

/**
 * @fileOverview An AI agent that resolves student doubts by explaining the question step-by-step or finding a matching solution.
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
      "A photo of a tough question, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ResolveDoubtInput = z.infer<typeof ResolveDoubtInputSchema>;

const ResolveDoubtOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A step-by-step explanation of the question, or a matching solution.'),
});
export type ResolveDoubtOutput = z.infer<typeof ResolveDoubtOutputSchema>;

export async function resolveDoubt(input: ResolveDoubtInput): Promise<ResolveDoubtOutput> {
  return resolveDoubtFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resolveDoubtPrompt',
  input: {schema: ResolveDoubtInputSchema},
  output: {schema: ResolveDoubtOutputSchema},
  prompt: `You are an expert tutor, skilled at explaining difficult concepts.

  A student has provided a photo of a question they are struggling with.  Your job is to either explain the question step by step, or fetch a matching solution from NCERT or previous years.

  Photo: {{media url=questionImage}}
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
    return output!;
  }
);
