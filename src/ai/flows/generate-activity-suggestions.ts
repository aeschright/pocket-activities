'use server';

/**
 * @fileOverview A flow to generate activity suggestions based on available time and daylight needs.
 *
 * - generateActivitySuggestions - A function that generates activity suggestions.
 * - GenerateActivitySuggestionsInput - The input type for the generateActivitySuggestions function.
 * - GenerateActivitySuggestionsOutput - The return type for the generateActivitySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActivitySuggestionsInputSchema = z.object({
  availableTimeMinutes: z
    .number()
    .describe('The amount of free time available, in minutes.'),
  daylightNeeded: z
    .boolean()
    .describe('Whether the activity should require daylight or not.'),
});
export type GenerateActivitySuggestionsInput = z.infer<
  typeof GenerateActivitySuggestionsInputSchema
>;

const GenerateActivitySuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of activity suggestions.'),
});
export type GenerateActivitySuggestionsOutput = z.infer<
  typeof GenerateActivitySuggestionsOutputSchema
>;

export async function generateActivitySuggestions(
  input: GenerateActivitySuggestionsInput
): Promise<GenerateActivitySuggestionsOutput> {
  return generateActivitySuggestionsFlow(input);
}

const generateActivitySuggestionsPrompt = ai.definePrompt({
  name: 'generateActivitySuggestionsPrompt',
  input: {schema: GenerateActivitySuggestionsInputSchema},
  output: {schema: GenerateActivitySuggestionsOutputSchema},
  prompt: `You are an activity suggestion expert. A user has {{availableTimeMinutes}} minutes free and {{#if daylightNeeded}}needs daylight{{else}}does not need daylight{{/if}}. Suggest some activities they can do.

Return a JSON array of strings. Each string is a suggestion of an activity to do. Suggest between 3 and 5 activities.`,
});

const generateActivitySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateActivitySuggestionsFlow',
    inputSchema: GenerateActivitySuggestionsInputSchema,
    outputSchema: GenerateActivitySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await generateActivitySuggestionsPrompt(input);
    return output!;
  }
);
