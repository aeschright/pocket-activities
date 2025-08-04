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
import type { GetWeatherInput, GetWeatherOutput } from '@/lib/types';

const GetWeatherInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});

const WeatherDataSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  conditions: z.string().describe('A brief description of the current weather conditions (e.g., "Sunny", "Cloudy").'),
  forecast: z.string().describe('A short forecast for the next hour.'),
});

const getWeatherTool = ai.defineTool(
  {
    name: 'getWeatherTool',
    description: 'Get the current weather and next hour forecast for a given location.',
    inputSchema: GetWeatherInputSchema,
    outputSchema: WeatherDataSchema,
  },
  async (input) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current_weather=true&hourly=temperature_2m,weathercode`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }
      const data = await response.json();
      const weatherCode = data.current_weather.weathercode;
      const conditions = weatherCodeToString(weatherCode);
      const temperature = Math.round(data.current_weather.temperature);
      
      return {
        temperature: temperature,
        conditions: conditions,
        forecast: `The weather will be ${conditions.toLowerCase()} for the next hour.`,
      };
    } catch (error) {
      console.error("Error fetching from weather API:", error);
      throw new Error("Could not retrieve weather information from the external API.");
    }
  }
);

// WMO Weather interpretation codes
function weatherCodeToString(code: number): string {
  const codes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    49: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return codes[code] || 'Unknown';
}


const getWeatherFlow = ai.defineFlow(
    {
        name: 'getWeatherFlow',
        inputSchema: GetWeatherInputSchema,
        outputSchema: WeatherDataSchema,
    },
    async (input) => {
        // Directly call the tool to avoid ambiguity with the LLM.
        return await getWeatherTool(input);
    }
);

export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput> {
    const result = await getWeatherFlow(input);
    if (!result) {
        throw new Error('Could not get weather data.');
    }
    return result;
}
