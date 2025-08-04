'use server';

/**
 * @fileOverview A flow to get the weather forecast.
 *
 * - getWeather - A function that gets the weather for a given location.
 * - GetWeatherInput - The input type for the getWeather function.
 * - GetWeatherOutput - The return type for the getWeather function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWeatherInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const WeatherDataSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  conditions: z.string().describe('A brief description of the current weather conditions (e.g., "Sunny", "Cloudy").'),
  forecast: z.string().describe('A short forecast for the next hour.'),
});
export type GetWeatherOutput = z.infer<typeof WeatherDataSchema>;

const getWeatherTool = ai.defineTool(
  {
    name: 'getWeatherTool',
    description: 'Get the current weather and next hour forecast for a given location.',
    inputSchema: GetWeatherInputSchema,
    outputSchema: WeatherDataSchema,
  },
  async (input) => {
    // In a real app, you would call a weather API here.
    // For this demo, we'll return some mock data.
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Windy'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    return {
      temperature: Math.floor(Math.random() * 15) + 10, // Random temp between 10 and 25 C
      conditions: randomCondition,
      forecast: `The weather will remain ${randomCondition.toLowerCase()} for the next hour.`,
    };
  }
);


const getWeatherPrompt = ai.definePrompt({
  name: 'getWeatherPrompt',
  input: {schema: GetWeatherInputSchema},
  output: {schema: WeatherDataSchema},
  tools: [getWeatherTool],
  prompt: `Use the getWeatherTool to get the weather for latitude {{{latitude}}} and longitude {{{longitude}}}.`,
});


export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput> {
    const {output} = await getWeatherPrompt(input);
    if (!output) {
        throw new Error('Could not get weather data.');
    }
    return output;
}
