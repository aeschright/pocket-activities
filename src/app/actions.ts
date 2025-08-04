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
    const suggestions: Activity[] = result.suggestions.map((suggestion: string) => ({
      id: `ai-${suggestion.toLowerCase().replace(/\s+/g, '-')}-${Math.random()}`,
      name: suggestion,
      duration: input.availableTimeMinutes,
      isCustom: false,
      // We don't know if the AI will respect this, so we have to trust it.
      // For more complex scenarios, we might want to have the AI return structured data.
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
