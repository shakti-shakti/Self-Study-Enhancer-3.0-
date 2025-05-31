'use server';
/**
 * @fileOverview Provides dictionary functionality using an AI model.
 *
 * - getDictionaryEntry - Fetches definition, phonetic, example for a word.
 * - DictionaryInput - Input schema for the dictionary flow.
 * - DictionaryOutput - Output schema for the dictionary flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DictionaryInputSchema = z.object({
  word: z.string().describe('The word to look up in the dictionary.'),
});
export type DictionaryInput = z.infer<typeof DictionaryInputSchema>;

export const DictionaryOutputSchema = z.object({
  word: z.string().describe('The word that was looked up.'),
  definition: z.string().describe('The primary definition of the word.'),
  phonetic: z.string().optional().describe('Phonetic transcription of the word (e.g., /həˈloʊ/).'),
  example_sentence: z.string().optional().describe('An example sentence using the word.'),
  synonyms: z.array(z.string()).optional().describe('A list of synonyms for the word.'),
});
export type DictionaryOutput = z.infer<typeof DictionaryOutputSchema>;

export async function getDictionaryEntry(input: DictionaryInput): Promise<DictionaryOutput> {
  return dictionaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dictionaryPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: DictionaryInputSchema},
  output: {schema: DictionaryOutputSchema},
  prompt: `You are an expert lexicographer. Provide a dictionary entry for the word "{{word}}".
Include its primary definition, phonetic transcription (if commonly available), an example sentence, and a few common synonyms.
If the word is not found or is nonsensical, provide a polite message indicating that.

Focus on the most common meaning if there are multiple. Keep definitions concise but informative.
Example for 'hello':
{
  "word": "hello",
  "definition": "Used as a greeting or to begin a phone conversation.",
  "phonetic": "/həˈloʊ/",
  "example_sentence": "She said hello to her friends when she arrived.",
  "synonyms": ["hi", "greetings", "hey"]
}

Provide the entry for: {{{word}}}
`,
});

const dictionaryFlow = ai.defineFlow(
  {
    name: 'dictionaryFlow',
    inputSchema: DictionaryInputSchema,
    outputSchema: DictionaryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return {
        word: input.word,
        definition: `Sorry, I could not find a definition for "${input.word}". Please check the spelling or try another word.`,
      };
    }
    return output;
  }
);
