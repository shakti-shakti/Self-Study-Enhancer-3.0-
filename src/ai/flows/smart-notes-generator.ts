'use server';

/**
 * @fileOverview AI flow that generates summarized notes, key formulas, or mnemonics after a test or reading a chapter.
 *
 * - generateSmartNotes - A function that generates smart notes based on the input content.
 * - GenerateSmartNotesInput - The input type for the generateSmartNotes function.
 * - GenerateSmartNotesOutput - The return type for the generateSmartNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSmartNotesInputSchema = z.object({
  content: z
    .string()
    .describe(
      'The content (test answers, chapter text) from which to generate smart notes.'
    ),
  contentType: z
    .enum(['test', 'chapter'])
    .describe('The type of content provided: either test answers or chapter text.'),
});

export type GenerateSmartNotesInput = z.infer<typeof GenerateSmartNotesInputSchema>;

const GenerateSmartNotesOutputSchema = z.object({
  notes: z.string().describe('The generated summarized notes, key formulas, or mnemonics.'),
});

export type GenerateSmartNotesOutput = z.infer<typeof GenerateSmartNotesOutputSchema>;

export async function generateSmartNotes(input: GenerateSmartNotesInput): Promise<GenerateSmartNotesOutput> {
  return generateSmartNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSmartNotesPrompt',
  input: {schema: GenerateSmartNotesInputSchema},
  output: {schema: GenerateSmartNotesOutputSchema},
  prompt: `You are a helpful AI assistant designed to generate smart notes for students.

  Based on the content provided, generate summarized notes, key formulas, or mnemonics to help the student quickly review the important information.

  Content Type: {{{contentType}}}
  Content: {{{content}}}

  Notes:`,
});

const generateSmartNotesFlow = ai.defineFlow(
  {
    name: 'generateSmartNotesFlow',
    inputSchema: GenerateSmartNotesInputSchema,
    outputSchema: GenerateSmartNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
