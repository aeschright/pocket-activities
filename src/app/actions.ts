'use server';

import { generateActivitySuggestions, GenerateActivitySuggestionsInput } from '@/ai/flows/generate-activity-suggestions';
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
      daylightNeeded: input.daylightNeeded,
      isCustom: false,
    }));
    return suggestions;
  } catch (error) {
    console.error('Error generating activity suggestions:', error);
    // In case of an error, return an empty array or handle it as needed
    return [];
  }
}
