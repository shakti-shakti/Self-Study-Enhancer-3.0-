// src/ai/flows/ncert-explorer-highlights.ts
'use server';

/**
 * @fileOverview An AI agent for exploring NCERT chapters with AI highlighting.
 *
 * - getHighlights - A function that extracts highlights from NCERT chapters.
 * - GetHighlightsInput - The input type for the getHighlights function.
 * - GetHighlightsOutput - The return type for the getHighlights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetHighlightsInputSchema = z.object({
  chapterText: z
    .string()
    .describe('The text content of the NCERT chapter to be explored.'),
  query: z.string().optional().describe('Optional search query to filter highlights.'),
});
export type GetHighlightsInput = z.infer<typeof GetHighlightsInputSchema>;

const GetHighlightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the chapter.'),
  keyDiagrams: z.array(z.string()).describe('List of key diagrams in the chapter.'),
  likelyQuestions: z.array(z.string()).describe('List of likely questions from the chapter.'),
  importantLines: z.array(z.string()).describe('List of important lines in the chapter.'),
});
export type GetHighlightsOutput = z.infer<typeof GetHighlightsOutputSchema>;

export async function getHighlights(input: GetHighlightsInput): Promise<GetHighlightsOutput> {
  return getHighlightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getHighlightsPrompt',
  input: {schema: GetHighlightsInputSchema},
  output: {schema: GetHighlightsOutputSchema},
  prompt: `You are an AI assistant designed to help students explore NCERT chapters by highlighting important information.

  Analyze the provided chapter text and identify the following:
  - A summary of the chapter.
  - Key diagrams present in the chapter.
  - Likely questions that could be asked based on the chapter content.
  - Important lines that students should focus on.

  Chapter Text: {{{chapterText}}}

  {{#if query}}
  Filter the highlights based on the following query: {{{query}}}
  {{/if}}

  Output the summary, key diagrams, likely questions, and important lines in the format specified by the output schema.
  `,
});

const getHighlightsFlow = ai.defineFlow(
  {
    name: 'getHighlightsFlow',
    inputSchema: GetHighlightsInputSchema,
    outputSchema: GetHighlightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
