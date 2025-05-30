// src/ai/flows/customization-tool.ts
'use server';

/**
 * @fileOverview AI-powered app customization tool for students. It allows users to customize the app's appearance and functionality via voice or written commands.
 *
 * - customizeApp - A function that handles the app customization process.
 * - CustomizeAppInput - The input type for the customizeApp function.
 * - CustomizeAppOutput - The return type for the customizeApp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeAppInputSchema = z.object({
  command: z
    .string()
    .describe(
      'A voice or written command from the student to customize the app.  Examples: Change the dashboard color to blue, Add a Pomodoro timer to the study room.'
    ),
  currentDashboard: z.string().optional().describe('The name of the current dashboard the user is on.'),
  availableDashboards: z.array(z.string()).optional().describe('List of available dashboards for customization.')
});

export type CustomizeAppInput = z.infer<typeof CustomizeAppInputSchema>;

const CustomizeAppOutputSchema = z.object({
  instruction: z.string().describe('The instruction or code to implement the customization.'),
  explanation: z.string().describe('An explanation of what was done and why.'),
});

export type CustomizeAppOutput = z.infer<typeof CustomizeAppOutputSchema>;

export async function customizeApp(input: CustomizeAppInput): Promise<CustomizeAppOutput> {
  return customizeAppFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizeAppPrompt',
  input: {schema: CustomizeAppInputSchema},
  output: {schema: CustomizeAppOutputSchema},
  prompt: `You are an AI assistant that helps students customize their NEET Prep+ app. The student will provide a command to customize the app, and you should return the instruction to implement the customization and an explanation of what was done and why.

Here is the student's command: {{{command}}}

{{#if currentDashboard}}
The student is currently on the '{{currentDashboard}}' dashboard.
{{/if}}

{{#if availableDashboards}}
The following dashboards are available: {{availableDashboards}}.
{{/if}}

Return the result as a JSON object that matches the CustomizeAppOutputSchema.
`,
});

const customizeAppFlow = ai.defineFlow(
  {
    name: 'customizeAppFlow',
    inputSchema: CustomizeAppInputSchema,
    outputSchema: CustomizeAppOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
