'use server';

import { generateActivitySuggestions, GenerateActivitySuggestionsInput } from '@/ai/flows/generate-activity-suggestions';
import { getWeather, GetWeatherInput, GetWeatherOutput } from '@/ai/flows/get-weather';
import type { Activity } from '@/lib/types';

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
    } catch (error) {
        console.error('Error getting weather:', error);
        return { error: 'Failed to get weather data.' };
    }
}
