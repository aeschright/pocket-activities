'use server';
/**
 * @fileOverview A tool to determine if it is currently daylight at the user's location.
 */
import { ai } from '@/ai/genkit';
import { getSunriseSunsetAction } from '@/app/actions';
import { z } from 'zod';

// This tool doesn't require any input from the LLM, but we need to define an empty schema.
const IsDaylightInputSchema = z.object({});

export const isDaylight = ai.defineTool(
  {
    name: 'isDaylight',
    description: 'Checks if it is currently daylight based on the user\'s location by comparing current time to sunrise and sunset times. This tool requires the user to grant location permissions in their browser.',
    input: { schema: IsDaylightInputSchema },
    output: { schema: z.boolean() },
  },
  async () => {
    // This is a placeholder for the actual implementation that would get the user's location.
    // In a real application, you would need to get the user's latitude and longitude.
    // For this example, we'll use a fixed location (e.g., Google HQ).
    const latitude = 37.422;
    const longitude = -122.084;
    
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
