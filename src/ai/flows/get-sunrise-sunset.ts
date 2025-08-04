'use server';

/**
 * @fileOverview A flow to get sunrise and sunset times for a given location.
 *
 * - getSunriseSunset - A function that gets the sunrise and sunset times.
 * - GetSunriseSunsetInput - The input type for the getSunriseSunset function.
 * - GetSunriseSunsetOutput - The return type for the getSunriseSunset function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetSunriseSunsetInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetSunriseSunsetInput = z.infer<typeof GetSunriseSunsetInputSchema>;

const GetSunriseSunsetOutputSchema = z.object({
    sunrise: z.string().describe('The sunrise time in ISO 8601 format.'),
    sunset: z.string().describe('The sunset time in ISO 8601 format.'),
});
export type GetSunriseSunsetOutput = z.infer<typeof GetSunriseSunsetOutputSchema>;


const getSunriseSunsetTool = ai.defineTool(
  {
    name: 'getSunriseSunsetTool',
    description: 'Get the sunrise and sunset times for a given location.',
    inputSchema: GetSunriseSunsetInputSchema,
    outputSchema: GetSunriseSunsetOutputSchema,
  },
  async (input) => {
    // In a real app, you would call a weather/astronomy API here.
    // For this demo, we'll return some mock data.
    const now = new Date();
    const sunrise = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
    const sunset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
    return {
      sunrise: sunrise.toISOString(),
      sunset: sunset.toISOString(),
    };
  }
);


const getSunriseSunsetPrompt = ai.definePrompt({
  name: 'getSunriseSunsetPrompt',
  input: {schema: GetSunriseSunsetInputSchema},
  output: {schema: GetSunriseSunsetOutputSchema},
  tools: [getSunriseSunsetTool],
  prompt: `You are an astronomy assistant. The user has provided a latitude and longitude.
You MUST call the getSunriseSunsetTool with the provided latitude and longitude to get the sunrise and sunset times.
Do not make up data.
Latitude: {{{latitude}}}
Longitude: {{{longitude}}}`,
});


export async function getSunriseSunset(input: GetSunriseSunsetInput): Promise<GetSunriseSunsetOutput> {
    const {output} = await getSunriseSunsetPrompt(input);
    if (!output) {
        throw new Error('Could not get sunrise/sunset data.');
    }
    return output;
}
