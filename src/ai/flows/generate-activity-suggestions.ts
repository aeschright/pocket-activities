'use server';

/**
 * @fileOverview A flow to generate activity suggestions based on available time, daylight, and weather conditions.
 *
 * - generateActivitySuggestions - A function that generates activity suggestions with weather-based tips.
 * - GenerateActivitySuggestionsInput - The input type for the generateActivitySuggestions function.
 * - GenerateActivitySuggestionsOutput - The return type for the generateActivitySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateActivitySuggestionsInput, GenerateActivitySuggestionsOutput } from '@/lib/types';
import { isDaylight } from '@/ai/tools/is-daylight';


const GenerateActivitySuggestionsInputSchema = z.object({
  availableTimeMinutes: z
    .number()
    .describe('The amount of free time available, in minutes.'),
  daylightNeeded: z
    .boolean()
    .describe('Whether the activity should require daylight or not.'),
  minutesToSunset: z.optional(z.number()).describe('Optional. The number of minutes until sunset. If not provided, the model should infer whether it is daytime or not using tools.'),
  weather: z.optional(z.object({
      uvIndex: z.number().describe('The current UV index.'),
      precipitationProbability: z.number().describe('The probability of precipitation in the next hour, as a percentage.'),
  })).describe('Optional. Current weather conditions to help generate tips.'),
});

const SuggestionSchema = z.object({
  activity: z.string().describe('The suggested activity.'),
  duration: z.number().describe('The estimated duration of the activity in minutes.'),
  weatherTip: z.optional(z.string()).describe("A helpful weather-related tip for the activity. For example, 'Wear sunscreen' if UV index is high, or 'Bring a raincoat' if rain is likely. Only provide a tip if it is relevant for an outdoor activity.")
});

const GenerateActivitySuggestionsOutputSchema = z.object({
  suggestions: z
    .array(SuggestionSchema)
    .describe('A list of activity suggestions.'),
});


export async function generateActivitySuggestions(
  input: GenerateActivitySuggestionsInput
): Promise<GenerateActivitySuggestionsOutput> {
  return generateActivitySuggestionsFlow(input);
}

const generateActivitySuggestionsPrompt = ai.definePrompt({
  name: 'generateActivitySuggestionsPrompt',
  input: {schema: GenerateActivitySuggestionsInputSchema},
  output: {schema: GenerateActivitySuggestionsOutputSchema},
  tools: [isDaylight],
  prompt: `You are an activity suggestion expert. A user has {{availableTimeMinutes}} minutes free.

Each suggestion must have a duration that is less than or equal to the available time.

{{#if daylightNeeded}}
All suggestions must require daylight.
{{else}}
The user has not specified if they need daylight. 
{{#if minutesToSunset}}
There are {{minutesToSunset}} minutes until sunset. If this is greater than 0, at least half of the suggestions should require daylight.
{{else}}
Use the isDaylight tool to determine if it is currently daytime. If it is, at least half of the suggestions should require daylight.
{{/if}}
You can suggest activities like a day hike (4 hours), gardening (1 hour), or sketching (1-2 hours) as examples of daylight activities.
{{/if}}

{{#if weather}}
For any outdoor activities suggested, provide a helpful weather-related tip. Activities that require daylight are considered outdoor activities and MUST have a weather tip.
- If the UV index is 3 or higher, the tip should be to "Wear sunscreen."
- If the precipitation probability is 20% or higher, the tip should be to "Bring a raincoat."
- If both conditions are met, you can choose the most relevant tip.
- Do not provide tips for indoor activities.

Current weather:
- UV Index: {{weather.uvIndex}}
- Chance of Rain (next hour): {{weather.precipitationProbability}}%
{{/if}}

Return a JSON object with a 'suggestions' key, which is an array of objects. Each object must have 'activity', 'duration', and an optional 'weatherTip' key.
Suggest between 3 and 5 activities.`,
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
