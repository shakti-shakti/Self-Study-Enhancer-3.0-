
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {defineSchema, z} from 'genkit';

// Ensure environment variables are loaded
if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn(
    'GOOGLE_GENAI_API_KEY is not set. Please ensure it is available in your environment.'
  );
} else if (process.env.GOOGLE_GENAI_API_KEY.includes('/') || process.env.GOOGLE_GENAI_API_KEY.includes('./')) {
  console.warn(
    'Warning: GOOGLE_GENAI_API_KEY appears to contain path characters (e.g., \'/\' or \'./\'). API keys are typically long strings without path separators. Please verify your key.'
  );
} else if (process.env.GOOGLE_GENAI_API_KEY.length < 30) { // Arbitrary short length check
   console.warn(
    'Warning: GOOGLE_GENAI_API_KEY seems unusually short. Please verify your key.'
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
