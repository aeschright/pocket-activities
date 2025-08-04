export interface Activity {
  id: string;
  name: string;
  duration: number; // in minutes
  daylightNeeded: boolean;
  isCustom?: boolean;
}
