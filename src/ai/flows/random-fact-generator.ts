'use server';
/**
 * @fileOverview Generates a random syllabus-related fact for class 11/12 students preparing for NEET.
 *
 * - generateSyllabusFact - A function that returns a random fact.
 * - GenerateSyllabusFactInput - The input type for the generateSyllabusFact function.
 * - GenerateSyllabusFactOutput - The return type for the generateSyllabusFact function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateSyllabusFactInputSchema = z.object({
  class_level: z.string().describe('The class level, e.g., "11", "12", or "11/12" for general NEET syllabus. This helps contextualize the fact.'),
  subject: z.enum(['Physics', 'Chemistry', 'Botany', 'Zoology', 'General Science']).optional().describe('Optional subject to narrow down the fact (Physics, Chemistry, Botany, Zoology). If "General Science", pick from any.'),
});
export type GenerateSyllabusFactInput = z.infer<typeof GenerateSyllabusFactInputSchema>;

export const GenerateSyllabusFactOutputSchema = z.object({
  fact: z.string().describe('A random, engaging, concise, and syllabus-related fact relevant to NEET (India) for the specified class level and subject.'),
  source_hint: z.string().optional().describe('A brief hint to the source, chapter, or specific topic of the fact (e.g., "NCERT Class 11 Biology, Chapter 8: Cell Structure", "Concept from Kinematics").'),
});
export type GenerateSyllabusFactOutput = z.infer<typeof GenerateSyllabusFactOutputSchema>;

export async function generateSyllabusFact(input: GenerateSyllabusFactInput): Promise<GenerateSyllabusFactOutput> {
  return generateSyllabusFactFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSyllabusFactPrompt',
  input: {schema: GenerateSyllabusFactInputSchema},
  output: {schema: GenerateSyllabusFactOutputSchema},
  prompt: `You are an expert in the NEET syllabus for Class 11 and 12 (covering Physics, Chemistry, Botany, and Zoology).
Your task is to generate a single, interesting, concise, and scientifically accurate random fact that is relevant to the NEET (India) syllabus for class {{class_level}}.
{{#if subject}}
The fact should ideally be related to the subject: {{subject}}.
{{else}}
The fact can be from any of the NEET subjects: Physics, Chemistry, Botany, or Zoology.
{{/if}}
The fact should be engaging and help make learning memorable. Avoid overly complex or niche trivia unless it's a common point of confusion or interest for NEET.
Also, provide a brief hint about its source, chapter, or the specific topic it relates to if possible (e.g., "NCERT Class 11, Chapter 5: Laws of Motion", "From the topic of Human Reproduction").

Example Output:
{
  "fact": "Mitochondria are often called the 'powerhouses of the cell' because they generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.",
  "source_hint": "NCERT Class 11 Biology, Chapter 8: Cell The Unit of Life"
}
Another Example:
{
  "fact": "The escape velocity from Earth's surface is approximately 11.2 km/s, regardless of the mass of the object.",
  "source_hint": "Physics Class 11, Chapter 8: Gravitation"
}

Generate a new, different fact that is interesting and educational for a NEET aspirant.
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
    if (!output || !output.fact) {
      // Fallback fact if AI fails or returns an empty fact
      return {
        fact: "Did you know? Consistent revision is one of the most effective strategies for success in competitive exams like NEET. Keep reviewing what you've learned!",
        source_hint: "General Study Tip"
      };
    }
    return output;
  }
);
