'use server';

/**
 * @fileOverview A flow to generate a weather tip for tomorrow for a given activity.
 *
 * - getTomorrowWeatherTip - A function that fetches tomorrow's weather and generates a tip.
 * - GetTomorrowWeatherTipInput - The input type for the function.
 * - GetTomorrowWeatherTipOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { getWeatherAction } from '@/app/actions';
import { z } from 'zod';

const GetTomorrowWeatherTipInputSchema = z.object({
  activityName: z.string().describe('The name of the activity.'),
  coords: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});
export type GetTomorrowWeatherTipInput = z.infer<typeof GetTomorrowWeatherTipInputSchema>;

const GetTomorrowWeatherTipOutputSchema = z.object({
    weatherTipLong: z.string().describe("A helpful, detailed, and conversational weather-related tip for the activity for tomorrow. For example, 'Tomorrow's forecast looks great for a walk, but the UV index will be high, so sunscreen is a good idea.'"),
});
export type GetTomorrowWeatherTipOutput = z.infer<typeof GetTomorrowWeatherTipOutputSchema>;

export async function getTomorrowWeatherTip(
  input: GetTomorrowWeatherTipInput
): Promise<GetTomorrowWeatherTipOutput> {
  return getTomorrowWeatherTipFlow(input);
}

const getTomorrowWeatherTipPrompt = ai.definePrompt({
  name: 'getTomorrowWeatherTipPrompt',
  input: {
    schema: z.object({
      activityName: z.string(),
      forecast: z.object({
        conditions: z.string(),
        uvIndex: z.number(),
        precipitationProbability: z.number(),
      }),
    }),
  },
  output: { schema: GetTomorrowWeatherTipOutputSchema },
  prompt: `You are an activity suggestion expert. A user wants to do an outdoor activity tomorrow.

Activity: {{activityName}}

Tomorrows forecast:
- Conditions: {{forecast.conditions}}
- Max UV Index: {{forecast.uvIndex}}
- Max Chance of Rain: {{forecast.precipitationProbability}}%

Generate a single, conversational 'weatherTipLong' for this activity based on tomorrow's forecast.

- The tip should start by acknowledging the forecast is for tomorrow.
- If the UV index is 3 or higher, the tip should mention wearing sunscreen.
- If the precipitation probability is 20% or higher, the tip should mention the possibility of rain.
- If the weather is clear, be encouraging.
- Frame the tip positively if possible. For example, instead of "don't forget an umbrella," try "you might want to bring an umbrella just in case."
`,
});

const getTomorrowWeatherTipFlow = ai.defineFlow(
  {
    name: 'getTomorrowWeatherTipFlow',
    inputSchema: GetTomorrowWeatherTipInputSchema,
    outputSchema: GetTomorrowWeatherTipOutputSchema,
  },
  async ({ activityName, coords }) => {
    // We pass forecastDays=2 to get today and tomorrow's weather.
    const weatherResult = await getWeatherAction({ ...coords, forecastDays: 2 });

    if ('error' in weatherResult || !weatherResult.tomorrow) {
      // If we can't get tomorrow's weather, return a generic tip.
      return {
        weatherTipLong: `The weather for tomorrow is currently unavailable, but it should still be a great time for a ${activityName}!`,
      };
    }

    const { output } = await getTomorrowWeatherTipPrompt({
        activityName,
        forecast: weatherResult.tomorrow,
    });
    return output!;
  }
);
