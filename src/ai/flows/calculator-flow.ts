'use server';
/**
 * @fileOverview Performs calculations or answers math queries using an AI model.
 *
 * - calculateExpression - Calculates the expression or answers the math query.
 * - CalculatorInput - Input schema for the calculator flow.
 * - CalculatorOutput - Output schema for the calculator flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const CalculatorInputSchema = z.object({
  expression: z.string().describe('The mathematical expression to calculate, an equation to solve, or a math-related question (e.g., "25 * 4 + 100/2", "solve 2x + 5 = 15 for x", "What is the integral of x^2?").'),
});
export type CalculatorInput = z.infer<typeof CalculatorInputSchema>;

export const CalculatorOutputSchema = z.object({
  result: z.string().describe('The numerical result of the calculation, the solution to the equation, or the answer to the math query.'),
  explanation: z.string().optional().describe('A step-by-step explanation or clarification if the input was complex or a query rather than a simple calculation.'),
});
export type CalculatorOutput = z.infer<typeof CalculatorOutputSchema>;

export async function calculateExpression(input: CalculatorInput): Promise<CalculatorOutput> {
  return calculatorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculatorPrompt',
  input: {schema: CalculatorInputSchema},
  output: {schema: CalculatorOutputSchema},
  prompt: `You are an advanced AI calculator and math solver.
Evaluate the given mathematical expression, solve the equation, or answer the math-related question.

Input: "{{{expression}}}"

Provide the direct result in the 'result' field.
If the input is more than a simple arithmetic calculation (e.g., an equation, a calculus problem, or a conceptual math question), provide a concise explanation or step-by-step solution in the 'explanation' field. For simple arithmetic, an explanation is not necessary.
If the expression is invalid or unsolvable with standard mathematics, indicate that in the result.

Examples:
Input: "2 * (10 + 5)" -> Output: { "result": "30" }
Input: "solve 2x + 5 = 15 for x" -> Output: { "result": "x = 5", "explanation": "1. Subtract 5 from both sides: 2x = 10. 2. Divide by 2: x = 5." }
Input: "What is the derivative of x^2?" -> Output: { "result": "2x", "explanation": "Using the power rule, d/dx(x^n) = nx^(n-1). Here n=2, so the derivative is 2x^(2-1) = 2x." }
Input: "sqrt(16) + 5!" -> Output: { "result": "124", "explanation": "sqrt(16) = 4. 5! = 5*4*3*2*1 = 120. 4 + 120 = 124." }
`,
});

const calculatorFlow = ai.defineFlow(
  {
    name: 'calculatorFlow',
    inputSchema: CalculatorInputSchema,
    outputSchema: CalculatorOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      return {
        result: `Sorry, I could not process the expression: "${input.expression}". Please check the format or try a different query.`,
      };
    }
    return output;
  }
);
