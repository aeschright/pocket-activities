import { z } from 'zod';

export interface Activity {
  id: string;
  name: string;
  duration: number; // in minutes
  daylightNeeded: boolean;
  isCustom?: boolean;
}

export interface WeatherData {
    temperature: number;
    conditions: string;
    forecast: string;
}

export interface SunriseSunsetData {
    sunrise: string;
    sunset: string;
}


// AI Flow Types

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

const SuggestionSchema = z.object({
  activity: z.string().describe('The suggested activity.'),
  duration: z.number().describe('The estimated duration of the activity in minutes.'),
});

const GenerateActivitySuggestionsOutputSchema = z.object({
  suggestions: z
    .array(SuggestionSchema)
    .describe('A list of activity suggestions.'),
});
export type GenerateActivitySuggestionsOutput = z.infer<
  typeof GenerateActivitySuggestionsOutputSchema
>;

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

const GetWeatherInputSchema = z.object({
  latitude: z.number().describe('The latitude of the location.'),
  longitude: z.number().describe('The longitude of the location.'),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const WeatherDataSchema = z.object({
  temperature: z.number().describe('The current temperature in Fahrenheit.'),
  conditions: z.string().describe('A brief description of the current weather conditions (e.g., "Sunny", "Cloudy").'),
  forecast: z.string().describe('A short forecast for the next hour.'),
});
export type GetWeatherOutput = z.infer<typeof WeatherDataSchema>;
