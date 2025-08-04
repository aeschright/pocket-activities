'use server';

import { generateActivitySuggestions } from '@/ai/flows/generate-activity-suggestions';
import { getWeather } from '@/ai/flows/get-weather';
import { getSunriseSunset } from '@/ai/flows/get-sunrise-sunset';
import type { Activity, GenerateActivitySuggestionsInput, GetWeatherInput, GetWeatherOutput, GetSunriseSunsetInput, GetSunriseSunsetOutput } from '@/lib/types';

export async function getSuggestionsAction(input: GenerateActivitySuggestionsInput): Promise<Activity[]> {
  try {
    const result = await generateActivitySuggestions(input);
    if (!result || !result.suggestions) {
      return [];
    }
    const suggestions: Activity[] = result.suggestions.map((suggestion) => ({
      id: `ai-${suggestion.activity.toLowerCase().replace(/\s+/g, '-')}-${Math.random()}`,
      name: suggestion.activity,
      duration: suggestion.duration,
      isCustom: false,
      daylightNeeded: input.daylightNeeded, 
    }));
    return suggestions;
  } catch (error) {
    console.error('Error generating activity suggestions:', error);
    // In case of an error, return an empty array or handle it as needed
    return [];
  }
}

export async function getWeatherAction(input: GetWeatherInput): Promise<GetWeatherOutput | { error: string }> {
    try {
        const result = await getWeather(input);
        return result;
    } catch (error: any) {
        console.error('Error getting weather:', error);
        return { error: error.message || 'Failed to get weather data.' };
    }
}

export async function getSunriseSunsetAction(input: GetSunriseSunsetInput): Promise<GetSunriseSunsetOutput | { error: string }> {
    try {
        const result = await getSunriseSunset(input);
        return result;
    } catch (error: any) {
        console.error('Error getting sunrise/sunset data:', error);
        return { error: error.message || 'Failed to get sunrise/sunset data.' };
    }
}
