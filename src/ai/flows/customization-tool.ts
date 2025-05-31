// src/ai/flows/customization-tool.ts
'use server';

/**
 * @fileOverview AI-powered app customization tool for students. It allows users to customize the app's appearance and functionality via voice or written commands. This flow provides conceptual instructions, not direct code execution.
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
      'A voice or written command from the student to customize the app. Examples: "Change the dashboard color to dark blue", "Add a Pomodoro timer widget to the study room dashboard", "Make the font size larger for notes."'
    ),
  currentDashboard: z.string().optional().describe('The name of the current dashboard the user is on (e.g., "Main Dashboard", "Planner", "Quiz Results").'),
  availableDashboards: z.array(z.string()).optional().describe('List of available dashboards for customization (e.g., ["Main Dashboard", "Planner", "Quizzes", "AI Study Assistant"]).')
});

export type CustomizeAppInput = z.infer<typeof CustomizeAppInputSchema>;

const CustomizeAppOutputSchema = z.object({
  instruction: z.string().describe('A conceptual instruction or pseudo-code describing how the customization could be implemented. This should NOT be actual executable code but a high-level step or description of changes. For example, "Identify the CSS variable for primary color and update it to dark blue." or "Suggest adding a new component <PomodoroTimer /> to the Study Room page."'),
  explanation: z.string().describe('An explanation of what the AI understood from the command and what changes it is conceptually suggesting.'),
  feasibility: z.enum(['High', 'Medium', 'Low', 'Not Possible']).describe('An assessment of how feasible the requested change is within a typical web application structure.'),
  clarifyingQuestion: z.string().optional().describe('If the command is ambiguous, ask a question to get more details.')
});

export type CustomizeAppOutput = z.infer<typeof CustomizeAppOutputSchema>;

export async function customizeApp(input: CustomizeAppInput): Promise<CustomizeAppOutput> {
  return customizeAppFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizeAppPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: CustomizeAppInputSchema},
  output: {schema: CustomizeAppOutputSchema},
  prompt: `You are an AI assistant that helps students understand how their NEET Prep+ app could be customized. The student will provide a command, and you should return conceptual instructions on how such a change might be implemented, an explanation, and a feasibility assessment. You DO NOT write or execute code.

Student's Command: "{{{command}}}"

{{#if currentDashboard}}
Student is currently on: '{{currentDashboard}}' dashboard.
{{/if}}

{{#if availableDashboards}}
Available dashboards include: {{#each availableDashboards}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
{{/if}}

Based on the command:
1.  **Explanation**: Briefly explain what you understand the student wants to achieve.
2.  **Instruction**: Provide a high-level, conceptual instruction or pseudo-code. Example: "To change the theme, you would typically modify the CSS variables for --primary-color and --background-color in the global style sheet." or "To add a feature like a Pomodoro timer, a new React component for the timer would be created and then imported and rendered on the target dashboard page."
3.  **Feasibility**: Assess the feasibility (High, Medium, Low, Not Possible) of implementing such a change in a standard web app. "High" for simple UI changes (colors, fonts), "Medium" for adding new small components or modifying existing ones, "Low" for complex new features or backend changes, "Not Possible" for requests outside typical app capabilities.
4.  **Clarifying Question (Optional)**: If the command is too vague, ask a clarifying question.

Example Output for "Change theme to green":
{
  "instruction": "Identify the primary color CSS variable (e.g., --primary) in the app's global stylesheet (globals.css) and update its HSL value to a green shade (e.g., hsl(120, 60%, 45%)). Also update related accent colors if necessary for visual harmony.",
  "explanation": "The student wants to change the main theme color of the app to green. This usually involves modifying the core color definitions used throughout the application.",
  "feasibility": "High"
}

Example Output for "Add a live video call feature to study rooms":
{
  "instruction": "Integrating a live video call feature would involve choosing a WebRTC library or service (like Jitsi, Twilio Video), implementing client-side logic for camera/microphone access and stream handling, and backend signaling for call setup and management. This would be a new set of components and potentially services.",
  "explanation": "The student wants to add real-time video communication to the study rooms. This is a significant feature addition.",
  "feasibility": "Low",
  "clarifyingQuestion": "Are you thinking of one-to-one video calls, or group video calls within the study rooms?"
}

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
