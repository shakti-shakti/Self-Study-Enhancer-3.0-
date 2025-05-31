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
    .describe('The text content of the NCERT chapter to be explored. This should be substantial enough for meaningful analysis.'),
  query: z.string().optional().describe('Optional search query or keywords to focus the AI on specific aspects of the chapter for highlighting.'),
});
export type GetHighlightsInput = z.infer<typeof GetHighlightsInputSchema>;

const GetHighlightsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the chapter (2-3 key paragraphs).'),
  keyDiagrams: z.array(z.string()).optional().describe('A list of descriptions of key diagrams or figures mentioned or implied in the text that are crucial for understanding (e.g., "Diagram of the human heart", "Flowchart of photosynthesis"). Provide 3-5 if relevant.'),
  likelyQuestions: z.array(z.string()).optional().describe('A list of 3-5 potential NEET-style questions (MCQ stems or conceptual questions) that could be derived from the chapter content. If a query is provided, tailor questions to that query.'),
  importantLines: z.array(z.string()).optional().describe('A list of 5-7 direct quotes or paraphrased key sentences/facts from the chapter that are highly important for NEET preparation. If a query is provided, focus on lines relevant to the query.'),
});
export type GetHighlightsOutput = z.infer<typeof GetHighlightsOutputSchema>;

export async function getHighlights(input: GetHighlightsInput): Promise<GetHighlightsOutput> {
  return getHighlightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getHighlightsPrompt',
  input: {schema: GetHighlightsInputSchema},
  output: {schema: GetHighlightsOutputSchema},
  prompt: `You are an expert AI assistant for NEET (medical entrance exam) aspirants. Your task is to analyze the provided NCERT chapter text and extract key information.

Provided Chapter Text:
"""
{{{chapterText}}}
"""

{{#if query}}
The student is particularly interested in aspects related to: "{{{query}}}"
Please focus your analysis and highlights around this query where applicable.
{{/if}}

Analyze the chapter text and provide the following:
1.  **Summary**: A concise summary (2-3 key paragraphs capturing the essence of the chapter).
2.  **Key Diagrams (Optional)**: Identify and list descriptions of 3-5 crucial diagrams or figures that would be in this chapter for understanding (e.g., "Labelled diagram of a neuron," "Graph showing enzyme activity vs. pH"). If no diagrams are explicitly mentioned or obviously implied, this can be omitted or be an empty array.
3.  **Likely Questions (Optional)**: Formulate 3-5 potential NEET-style questions (MCQ stems or conceptual questions, not full MCQs with options) based on the important concepts in the chapter. If a query was provided by the student, try to make these questions relevant to the query.
4.  **Important Lines (Optional)**: Extract or paraphrase 5-7 of the most critical sentences, facts, or definitions from the chapter that a NEET aspirant must remember. If a query was provided, prioritize lines relevant to it.

Be thorough but focused on information most relevant for NEET preparation.
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
