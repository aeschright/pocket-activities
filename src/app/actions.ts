'use server';

import { generateActivitySuggestions } from '@/ai/flows/generate-activity-suggestions';
import type { Activity, GenerateActivitySuggestionsInput, GetWeatherInput, GetWeatherOutput, GetSunriseSunsetInput, GetSunriseSunsetOutput } from '@/lib/types';
import { weatherCodeToString } from '@/lib/utils';

export async function getSuggestionsAction(input: GenerateActivitySuggestionsInput): Promise<Activity[]> {
  try {
    const result = await generateActivitySuggestions(input);
    if (!result || !result.suggestions) {
      return [];
    }

    const suggestions: Activity[] = result.suggestions.map((suggestion) => {
       // A simple heuristic to determine if an AI-suggested activity needs daylight.
       // This could be improved with a more sophisticated check or another AI call.
       const daylightNeededHeuristic = suggestion.activity.toLowerCase().includes('hike') || 
                                       suggestion.activity.toLowerCase().includes('walk') ||
                                       suggestion.activity.toLowerCase().includes('gardening') ||
                                       suggestion.activity.toLowerCase().includes('sketching') ||
                                       suggestion.activity.toLowerCase().includes('outside') ||
                                       suggestion.activity.toLowerCase().includes('park') ||
                                       suggestion.activity.toLowerCase().includes('run');

      return {
        id: `ai-${suggestion.activity.toLowerCase().replace(/\s+/g, '-')}-${Math.random()}`,
        name: suggestion.activity,
        duration: suggestion.duration,
        isCustom: false,
        daylightNeeded: daylightNeededHeuristic, 
      }
    });
    return suggestions;
  } catch (error) {
    console.error('Error generating activity suggestions:', error);
    return [];
  }
}

export async function getWeatherAction(input: GetWeatherInput): Promise<GetWeatherOutput | { error: string }> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current=temperature_2m,weathercode,uv_index&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit`;
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch weather data: ${response.statusText}`);
      }
      const data = await response.json();
      const weatherCode = data.current.weathercode;
      const conditions = weatherCodeToString(weatherCode);
      const temperature = Math.round(data.current.temperature_2m);
      const uvIndex = Math.round(data.current.uv_index);
      
      return {
        temperature: temperature,
        conditions: conditions,
        forecast: `The weather will be ${conditions.toLowerCase()} for the next hour.`,
        uvIndex: uvIndex,
      };
    } catch (error: any) {
      console.error("Error fetching from weather API:", error);
      return { error: error.message || "Could not retrieve weather information." };
    }
}

export async function getSunriseSunsetAction(input: GetSunriseSunsetInput): Promise<GetSunriseSunsetOutput | { error: string }> {
    try {
       // Using a public, no-key-required API for sunrise/sunset
      const url = `https://api.sunrise-sunset.org/json?lat=${input.latitude}&lng=${input.longitude}&formatted=0`;
      const response = await fetch(url, { cache: 'no-store' });
       if (!response.ok) {
        throw new Error(`Failed to fetch sunrise/sunset data: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.status !== 'OK') {
        throw new Error(`Sunrise/Sunset API returned an error: ${data.status}`);
      }
      return {
        sunrise: data.results.sunrise,
        sunset: data.results.sunset,
      };
    } catch (error: any) {
        console.error('Error getting sunrise/sunset data:', error);
        return { error: error.message || 'Failed to get sunrise/sunset data.' };
    }
}
