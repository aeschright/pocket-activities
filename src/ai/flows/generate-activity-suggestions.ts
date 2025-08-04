
'use server';

/**
 * @fileOverview A flow to generate activity suggestions based on available time, daylight, and weather conditions.
 *
 * - generateActivitySuggestions - A function that generates activity suggestions with weather-based tips.
 * - GenerateActivitySuggestionsInput - The input type for the generateActivitySuggestions function.
 * - GenerateActivitySuggestionsOutput - The return type for the generateActivitySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
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
   coords: z.optional(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).describe('Optional. The user\'s coordinates. Needed for the isDaylight tool.'),
  activityToUpdate: z.optional(z.object({
    name: z.string(),
    duration: z.number(),
  })).describe('Optional. A single activity to re-evaluate and add a weather tip for.'),
});

const SuggestionSchema = z.object({
  activity: z.string().describe('The suggested activity.'),
  duration: z.number().describe('The estimated duration of the activity in minutes.'),
  weatherTipShort: z.optional(z.string()).describe("A brief, helpful weather-related tip for the activity. For example, 'High UV, wear sunscreen.' or 'Chance of rain.' Only provide a tip if it is relevant for an outdoor activity."),
  weatherTipLong: z.optional(z.string()).describe("A helpful, detailed, and conversational weather-related tip for the activity. For example, 'With a high UV index, it's a good idea to wear sunscreen for this one.' or 'There's a chance of rain, so you might want to bring a raincoat.' Only provide a tip if it is relevant for an outdoor activity.")
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
  prompt: `You are an activity suggestion expert.
{{#if activityToUpdate}}
A user wants an updated weather tip for the following activity:
Activity: {{activityToUpdate.name}}
Duration: {{activityToUpdate.duration}} minutes

The activity is an outdoor activity. Use the weather information provided below to generate a 'weatherTipShort' and a 'weatherTipLong'.

Current weather:
- UV Index: {{weather.uvIndex}}
- Chance of Rain (next hour): {{weather.precipitationProbability}}%

- If the UV index is 3 or higher, the tip should be something like "With a high UV index, it's a good idea to wear sunscreen."
- If the precipitation probability is 20% or higher, the tip should be something like "There's a chance of rain, so bringing a raincoat would be wise."
- If both conditions are met, you can choose the most relevant tip or combine them.

Return a JSON object with a single suggestion in the 'suggestions' array containing the original activity and duration, plus the new weather tips.

{{else}}
A user has {{availableTimeMinutes}} minutes free.

Each suggestion must have a duration that is less than or equal to the available time.

If the available time is over 2 hours (120 minutes), all suggestions provided should be for activities that are at least 60 minutes long.

The user has not specified if they need daylight.
{{#if minutesToSunset}}
There are {{minutesToSunset}} minutes until sunset. If this is greater than 0, at least half of the suggestions should require daylight.
{{else if coords}}
Use the isDaylight tool with the provided coordinates (latitude: {{coords.latitude}}, longitude: {{coords.longitude}}) to determine if it is currently daytime. If it is, at least half of the suggestions should require daylight.
{{else}}
Suggest a mix of indoor and outdoor activities.
{{/if}}
You can suggest activities like a day hike (4 hours), gardening (1 hour), or sketching (1-2 hours) as examples of daylight activities.

{{#if weather}}
For any outdoor activities suggested, provide a helpful weather-related tip. Activities that require daylight are considered outdoor activities and MUST have a weather tip.
Provide two versions of the tip: 'weatherTipShort' (a brief summary, e.g., "High UV, wear sunscreen.") and 'weatherTipLong' (a more detailed, conversational version, e.g., "With a high UV index, it's a good idea to wear sunscreen.").
- If the UV index is 3 or higher, the tip should be something like "With a high UV index, it's a good idea to wear sunscreen."
- If the precipitation probability is 20% or higher, the tip should be something like "There's a chance of rain, so bringing a raincoat would be wise."
- If both conditions are met, you can choose the most relevant tip or combine them.
- Do not provide tips for indoor activities.

Current weather:
- UV Index: {{weather.uvIndex}}
- Chance of Rain (next hour): {{weather.precipitationProbability}}%
{{/if}}

Return a JSON object with a 'suggestions' key, which is an array of objects. Each object must have 'activity', 'duration', and optional 'weatherTipShort' and 'weatherTipLong' keys.
Suggest between 3 and 5 activities.
{{/if}}`,
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
