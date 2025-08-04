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
