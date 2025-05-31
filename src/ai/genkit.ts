import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {defineSchema, z} from 'genkit';

// Ensure environment variables are loaded
if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn(
    'GOOGLE_GENAI_API_KEY is not set. Please ensure it is available in your environment.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  logLevel: 'debug', // Or 'info' for less verbose logging
  enableTracingAndMetrics: true,
});
