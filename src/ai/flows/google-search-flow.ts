
'use server';
/**
 * @fileOverview Performs a Google Custom Search using the provided API key and CX.
 *
 * - googleSearchFlow - Fetches search results from Google Custom Search API.
 * - GoogleSearchInput - Input schema for the search flow.
 * - GoogleSearchOutput - Output schema for the search flow.
 * - SearchResultItem - Individual search result item schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

const GoogleSearchInputSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty.').describe('The search term to query Google with.'),
  numResults: z.number().int().min(1).max(10).optional().default(5).describe('Number of search results to return (1-10).'),
});
export type GoogleSearchInput = z.infer<typeof GoogleSearchInputSchema>;

const SearchResultItemSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  link: z.string().url().describe('The URL of the search result.'),
  snippet: z.string().describe('A brief snippet or description of the search result.'),
  displayLink: z.string().optional().describe('The display URL of the search result.'),
});
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

const GoogleSearchOutputSchema = z.object({
  items: z.array(SearchResultItemSchema).describe('A list of search results.'),
  error: z.string().optional().describe('An error message if the search failed.'),
});
export type GoogleSearchOutput = z.infer<typeof GoogleSearchOutputSchema>;

export async function googleSearch(input: GoogleSearchInput): Promise<GoogleSearchOutput> {
  return googleSearchFlow(input);
}

const googleSearchFlow = ai.defineFlow(
  {
    name: 'googleSearchFlow',
    inputSchema: GoogleSearchInputSchema,
    outputSchema: GoogleSearchOutputSchema,
  },
  async (input) => {
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.error("Google Custom Search API Key or CX ID is not configured in environment variables.");
      return { items: [], error: "Search service is not configured." };
    }

    const { query, numResults } = input;
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${numResults}&safe=off`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error structure" }));
        console.error(`Google Search API error: ${response.status}`, errorData);
        return { items: [], error: `API Error: ${errorData.error?.message || response.statusText || "Failed to fetch search results."}` };
      }

      const data = await response.json();

      if (data.error) {
        console.error("Google Search API returned an error object:", data.error);
        return { items: [], error: `API Error: ${data.error.message}` };
      }
      
      const searchItems: SearchResultItem[] = (data.items || []).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        displayLink: item.displayLink,
      }));

      return { items: searchItems };
    } catch (error: any) {
      console.error("Error during Google Custom Search API call:", error);
      return { items: [], error: `Request failed: ${error.message || "Network error or invalid response."}` };
    }
  }
);

