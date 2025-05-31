
'use server';

/**
 * @fileOverview AI flow that generates summarized notes, key formulas, or mnemonics after a test or reading a chapter, specifically for NEET preparation.
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
    .min(100, {message: "Content should be at least 100 characters for effective note generation."})
    .describe(
      'The content (e.g., text from an NCERT chapter, a set of solved quiz questions with answers, or a student own study material) from which to generate smart notes.'
    ),
  contentType: z
    .enum(['test_review', 'chapter_summary', 'concept_clarification'])
    .describe('The type of content provided: "test_review" (for analyzing solved questions/answers), "chapter_summary" (for summarizing a chapter text), "concept_clarification" (for breaking down a specific concept).'),
  subject: z.enum(['Physics', 'Chemistry', 'Biology', 'General']).optional().describe("Optional: Specify the subject to help tailor the notes (e.g., focus on formulas for Physics, pathways for Biology)."),
  noteFormatPreferences: z.array(z.enum(['summary', 'key_formulas', 'mnemonics', 'bullet_points', 'flowchart_points'])).optional().describe("Optional: Preferred formats for the notes. AI will try to incorporate these. E.g. ['key_formulas', 'bullet_points']")
});

export type GenerateSmartNotesInput = z.infer<typeof GenerateSmartNotesInputSchema>;

const GenerateSmartNotesOutputSchema = z.object({
  notes: z.string().describe('The generated smart notes. This could be a combination of summarized text, bullet points, identified key formulas (if applicable), or mnemonic suggestions, tailored for NEET aspirants.'),
  titleSuggestion: z.string().optional().describe("A suggested title for these notes, e.g., 'Key Concepts: Newton's Laws' or 'Chapter 5 Biology Summary'.")
});

export type GenerateSmartNotesOutput = z.infer<typeof GenerateSmartNotesOutputSchema>;

export async function generateSmartNotes(input: GenerateSmartNotesInput): Promise<GenerateSmartNotesOutput> {
  return generateSmartNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSmartNotesPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: GenerateSmartNotesInputSchema},
  output: {schema: GenerateSmartNotesOutputSchema},
  prompt: `You are an expert AI assistant for NEET (medical entrance exam) aspirants. Your task is to generate "smart notes" from the provided content.

You MUST return a JSON object that strictly adheres to the following schema:
{
  "notes": "string (The generated smart notes. This could be a combination of summarized text, bullet points, identified key formulas (if applicable), or mnemonic suggestions, tailored for NEET aspirants.)",
  "titleSuggestion": "string (Optional: A suggested title for these notes, e.g., 'Key Concepts: Newton's Laws' or 'Chapter 5 Biology Summary'.)"
}
DO NOT include any other keys or nested structures. DO NOT attempt to call any tools or functions.

Content Type: "{{contentType}}"
{{#if subject}}Subject: "{{subject}}"{{/if}}

Provided Content:
"""
{{{content}}}
"""

{{#if noteFormatPreferences}}
The student prefers notes in the following formats if applicable: {{#each noteFormatPreferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
{{/if}}

Based on the content type and subject (if provided):
1.  **Summarize**: Extract the most critical information.
2.  **Identify Key Elements**:
    *   If Physics or Chemistry, identify and list key formulas, equations, or important reactions.
    *   If Biology, identify key terms, pathways, classifications, or biological processes.
    *   If content type is 'test_review', focus on the principles tested by the questions and common error points if evident.
3.  **Structure for Clarity**: Organize the notes logically. Use bullet points, concise paragraphs, or numbered lists as appropriate. If "bullet_points" or "flowchart_points" are preferred, try to use them.
4.  **Mnemonics (If applicable and preferred)**: If "mnemonics" is in preferences and the content lends itself to it (e.g., lists, sequences), suggest a simple mnemonic.
5.  **NEET Focus**: Ensure all notes are highly relevant to the NEET syllabus and help in quick recall and understanding of concepts important for the exam.
6.  **Title Suggestion**: Provide a concise, descriptive title for the generated notes.

Generate the notes in the 'notes' field and a title in the 'titleSuggestion' field.
If the content is too short or unclear for meaningful notes, state that in the 'notes' field.
Ensure the output is a valid JSON object matching the specified schema.
`,
});

const generateSmartNotesFlow = ai.defineFlow(
  {
    name: 'generateSmartNotesFlow',
    inputSchema: GenerateSmartNotesInputSchema,
    outputSchema: GenerateSmartNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.notes) {
        return {
            notes: "Could not generate notes from the provided content. Please ensure the content is sufficient and clear.",
            titleSuggestion: "Note Generation Error"
        };
    }
    return output;
  }
);

