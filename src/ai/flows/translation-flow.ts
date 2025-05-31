'use server';
/**
 * @fileOverview Translates text between languages using an AI model.
 *
 * - translateText - Translates the given text.
 * - TranslationInput - Input schema for the translation flow.
 * - TranslationOutput - Output schema for the translation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const TranslationInputSchema = z.object({
  textToTranslate: z.string().describe('The text content to be translated.'),
  targetLanguage: z.string().describe('The target language code (e.g., "hi" for Hindi, "fr" for French, "en" for English).'),
  sourceLanguage: z.string().optional().describe('The source language code (e.g., "en" for English, "hi" for Hindi). If not provided, the AI will attempt to auto-detect.'),
});
export type TranslationInput = z.infer<typeof TranslationInputSchema>;

export const TranslationOutputSchema = z.object({
  translated_text: z.string().describe('The translated text.'),
  detected_source_language: z.string().optional().describe('The language code of the source text detected by the AI (e.g., "en", "hi"), if sourceLanguage was not provided or if detection differs.'),
});
export type TranslationOutput = z.infer<typeof TranslationOutputSchema>;

export async function translateText(input: TranslationInput): Promise<TranslationOutput> {
  return translationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translationPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: TranslationInputSchema},
  output: {schema: TranslationOutputSchema},
  prompt: `You are a highly proficient multilingual translator.
Translate the following text into "{{targetLanguage}}".
{{#if sourceLanguage}}The source language is specified as "{{sourceLanguage}}".{{else}}Attempt to auto-detect the source language.{{/if}}

Text to translate:
"""
{{{textToTranslate}}}
"""

Provide only the translated text in the 'translated_text' field.
If you auto-detected the source language (either because it wasn't provided or your detection is more confident), provide its language code (e.g., "en", "hi") in 'detected_source_language'.
`,
});

const translationFlow = ai.defineFlow(
  {
    name: 'translationFlow',
    inputSchema: TranslationInputSchema,
    outputSchema: TranslationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.translated_text) {
      return {
        translated_text: `Sorry, I could not translate the text at this moment. Please try again or check the input languages.`,
      };
    }
    return output;
  }
);
