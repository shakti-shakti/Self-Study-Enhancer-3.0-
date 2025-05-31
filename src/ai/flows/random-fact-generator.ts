'use server';
/**
 * @fileOverview Generates a random syllabus-related fact for class 11/12 students.
 *
 * - generateSyllabusFact - A function that returns a random fact.
 * - GenerateSyllabusFactInput - The input type for the generateSyllabusFact function.
 * - GenerateSyllabusFactOutput - The return type for the generateSyllabusFact function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateSyllabusFactInputSchema = z.object({
  class_level: z.string().describe('The class level, e.g., "11", "12", or "11/12" for general NEET syllabus.'),
  subject: z.enum(['Physics', 'Chemistry', 'Botany', 'Zoology', 'General Science']).optional().describe('Optional subject to narrow down the fact.'),
});
export type GenerateSyllabusFactInput = z.infer<typeof GenerateSyllabusFactInputSchema>;

export const GenerateSyllabusFactOutputSchema = z.object({
  fact: z.string().describe('A random, engaging, syllabus-related fact.'),
  source_hint: z.string().optional().describe('A hint to the source or topic of the fact (e.g., NCERT Class 11, Chapter 5).'),
});
export type GenerateSyllabusFactOutput = z.infer<typeof GenerateSyllabusFactOutputSchema>;

export async function generateSyllabusFact(input: GenerateSyllabusFactInput): Promise<GenerateSyllabusFactOutput> {
  return generateSyllabusFactFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSyllabusFactPrompt',
  input: {schema: GenerateSyllabusFactInputSchema},
  output: {schema: GenerateSyllabusFactOutputSchema},
  prompt: `You are an expert in the NEET syllabus for Class 11 and 12 (Physics, Chemistry, Botany, Zoology).
Generate a single, interesting, and concise random fact that is relevant to the NEET (India) syllabus for {{class_level}}.
{{#if subject}}The fact should ideally be related to {{subject}}.{{/if}}
The fact should be engaging and help keep learning fresh.
Also provide a brief hint about its source or topic if possible.

Example Output:
{
  "fact": "Mitochondria are often called the 'powerhouses of the cell' because they generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.",
  "source_hint": "NCERT Class 11 Biology, Chapter 8"
}

Generate a new, different fact.
`,
});

const generateSyllabusFactFlow = ai.defineFlow(
  {
    name: 'generateSyllabusFactFlow',
    inputSchema: GenerateSyllabusFactInputSchema,
    outputSchema: GenerateSyllabusFactOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      // Fallback fact if AI fails
      return {
        fact: "Did you know? Regular revision is key to cracking competitive exams like NEET! Keep up the great work!",
        source_hint: "General Study Tip"
      };
    }
    return output;
  }
);
