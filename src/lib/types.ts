import { z } from 'zod';

export interface Activity {
  id: string;
  name: string;
  duration: number; // in minutes
  daylightNeeded: boolean;
  isCustom?: boolean;
  weatherTip?: string;
}

export interface WeatherData {
    temperature: number;
    conditions: string;
    forecast: string;
    uvIndex: number;
    precipitationProbability?: number;
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
  minutesToSunset: z.optional(z.number()).describe('Optional. The number of minutes until sunset. If not provided, the model should infer whether it is daytime or not using tools.'),
  weather: z.optional(z.object({
      uvIndex: z.number().describe('The current UV index.'),
      precipitationProbability: z.number().describe('The probability of precipitation in the next hour, as a percentage.'),
  })).describe('Optional. Current weather conditions to help generate tips.'),
});
export type GenerateActivitySuggestionsInput = z.infer<
  typeof GenerateActivitySuggestionsInputSchema
>;

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
  uvIndex: z.number().describe('The current UV index.'),
  precipitationProbability: z.optional(z.number()).describe('The probability of precipitation in the next hour, as a percentage.'),
});
export type GetWeatherOutput = z.infer<typeof WeatherDataSchema>;
