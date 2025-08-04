'use server';
/**
 * @fileOverview A tool to determine if it is currently daylight at the user's location.
 */
import { ai } from '@/ai/genkit';
import { getSunriseSunsetAction } from '@/app/actions';
import { z } from 'zod';

// This tool now requires latitude and longitude from the LLM.
const IsDaylightInputSchema = z.object({
  latitude: z.number().describe("The user's latitude."),
  longitude: z.number().describe("The user's longitude."),
});

export const isDaylight = ai.defineTool(
  {
    name: 'isDaylight',
    description: 'Checks if it is currently daylight based on the user\'s location by comparing current time to sunrise and sunset times.',
    inputSchema: IsDaylightInputSchema,
    outputSchema: z.boolean(),
  },
  async ({ latitude, longitude }) => {
    const sunriseSunsetData = await getSunriseSunsetAction({ latitude, longitude });

    if ('error' in sunriseSunsetData) {
        console.error('Could not retrieve sunrise/sunset data for isDaylight tool');
        // Default to false if we can't get the data
        return false;
    }

    const now = new Date();
    const sunrise = new Date(sunriseSunsetData.sunrise);
    const sunset = new Date(sunriseSunsetData.sunset);

    return now > sunrise && now < sunset;
  }
);
