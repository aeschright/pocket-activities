import { config } from 'dotenv';
config();

import '@/ai/flows/generate-activity-suggestions.ts';
import '@/ai/flows/get-tomorrow-weather-tip.ts';
import '@/ai/tools/is-daylight.ts';
