
"use client";

import { useState, useMemo, useTransition, useEffect } from 'react';
import type { Activity, WeatherData, SunriseSunsetData, Coords } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getSuggestionsAction, getWeatherAction, getSunriseSunsetAction } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CustomActivityForm } from '@/components/custom-activity-form';
import { ActivityCard } from '@/components/activity-card';
import { PlusCircle, Zap, Loader2, Sparkles, LocateIcon, Thermometer, Cloud, Clock, Sun, Moon, SunDim, Droplet, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { formatDuration } from '@/lib/utils';


export function PocketActivitiesClient() {
  const [time, setTime] = useState(60);
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [daylightNeeded, setDaylightNeeded] = useState(false);
  const [suggestions, setSuggestions] = useState<Activity[]>([]);
  const [customActivities, setCustomActivities] = useLocalStorage<Activity[]>('custom-activities', []);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunsetData | null>(null);
  const [isFetchingSunriseSunset, setIsFetchingSunriseSunset] = useState(false);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedCustomActivityId, setSelectedCustomActivityId] = useState<string | null>(null);
  const [selectedSuggestedActivity, setSelectedSuggestedActivity] = useState<Activity | null>(null);

  const [timeToSunset, setTimeToSunset] = useState<string | null>(null);


  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [isPending, startTransition] = useTransition();
  const [isRefetchingSuggestion, startRefetchingSuggestion] = useTransition();
  
  const handleResetSelections = () => {
    setSelectedCustomActivityId(null);
    setSelectedSuggestedActivity(null);
    setSuggestions([]);
    setHasSearched(false);
  };

  const handleGetSuggestions = () => {
    setHasSearched(true);
    handleResetSelections();
    startTransition(async () => {
      const timeInMinutes = timeUnit === 'hours' ? time * 60 : time;
      
      let minutesToSunset: number | undefined = undefined;
      if (sunriseSunset?.sunset) {
        const sunsetDate = new Date(sunriseSunset.sunset);
        if (sunsetDate > new Date()) {
          minutesToSunset = differenceInMinutes(sunsetDate, new Date());
        }
      }

      let weatherPayload: { uvIndex: number, precipitationProbability: number } | undefined = undefined;
      if (weather) {
          weatherPayload = {
              uvIndex: weather.uvIndex,
              precipitationProbability: weather.precipitationProbability || 0,
          }
      }

      const aiSuggestions = await getSuggestionsAction({
        availableTimeMinutes: timeInMinutes,
        daylightNeeded: false, // We let the AI decide based on time to sunset
        minutesToSunset: minutesToSunset,
        weather: weatherPayload,
        coords: coords ?? undefined,
      });

      // Find matching custom activities
      const matchingCustomActivities = customActivities.filter(activity =>
        activity.duration <= timeInMinutes &&
        (!daylightNeeded || activity.daylightNeeded)
      );
      
      let finalSuggestions = aiSuggestions;

      // Add one random matching custom activity if available
      if (matchingCustomActivities.length > 0) {
        const randomIndex = Math.floor(Math.random() * matchingCustomActivities.length);
        const customSuggestion = matchingCustomActivities[randomIndex];
        // Avoid adding a duplicate if the AI somehow suggested it.
        if (!finalSuggestions.some(s => s.name === customSuggestion.name)) {
            finalSuggestions = [customSuggestion, ...finalSuggestions];
        }
      }

      setSuggestions(finalSuggestions);
    });
  };
  
  const getLocationAndFetchData = () => {
    if (!navigator.geolocation) {
       toast({
        variant: "destructive",
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation.",
      });
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
  
    setLocationError(null);
    setIsFetchingWeather(true);
    setIsFetchingSunriseSunset(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const newCoords = { latitude, longitude };
      setCoords(newCoords);
      
      try {
        const [weatherResult, sunriseSunsetResult] = await Promise.all([
            getWeatherAction(newCoords),
            getSunriseSunsetAction(newCoords)
        ]);

        if (weatherResult && 'error' in weatherResult) {
            toast({ variant: "destructive", title: "Weather Error", description: weatherResult.error });
            setWeather(null);
        } else if (weatherResult) {
            setWeather(weatherResult);
        }
        
        if (sunriseSunsetResult && 'error' in sunriseSunsetResult) {
            toast({ variant: "destructive", title: "Sunrise/Sunset Error", description: sunriseSunsetResult.error });
            setSunriseSunset(null);
        } else if (sunriseSunsetResult) {
            setSunriseSunset(sunriseSunsetResult);
        }

      } catch (e: any) {
         toast({
            variant: "destructive",
            title: "Data Fetching Error",
            description: e.message || "An unexpected error occurred while fetching location data.",
          });
          setWeather(null);
          setSunriseSunset(null);
      } finally {
        setIsFetchingWeather(false);
        setIsFetchingSunriseSunset(false);
      }

    }, (error) => {
      const errorMsg = `Could not get your location: ${error.message}`;
      setLocationError(errorMsg);
      toast({
        variant: "destructive",
        title: "Location Error",
        description: errorMsg,
      })
      setIsFetchingWeather(false);
      setIsFetchingSunriseSunset(false);
    });
  };

  const handleAddCustomActivity = (newActivityData: Omit<Activity, 'id' | 'isCustom'>) => {
    const newActivity: Activity = {
      ...newActivityData,
      id: `custom-${Date.now()}`,
      isCustom: true,
    };
    setCustomActivities(prev => [...prev, newActivity]);
  };
  
  const handleDeleteCustomActivity = (idToDelete: string) => {
    setCustomActivities(prev => prev.filter(activity => activity.id !== idToDelete));
    if (selectedCustomActivityId === idToDelete) {
      setSelectedCustomActivityId(null);
    }
  };

  const handleSuggestedActivitySelect = (activity: Activity) => {
    setSelectedSuggestedActivity(activity);
    setSelectedCustomActivityId(null); // Clear custom selection
  };

  const handleCustomActivitySelect = (id: string) => {
    const activity = customActivities.find(act => act.id === id);
    if(activity) {
      setSelectedSuggestedActivity(null); // Clear suggested selection
      setSelectedCustomActivityId(id);
    }
  }

  const timeInMinutes = timeUnit === 'hours' ? time * 60 : time;
  
  const selectedActivity = useMemo(() => {
    if (selectedSuggestedActivity) {
      return selectedSuggestedActivity;
    }
    if (selectedCustomActivityId) {
        return customActivities.find(act => act.id === selectedCustomActivityId) || null;
    }
    return null;
  }, [selectedSuggestedActivity, selectedCustomActivityId, customActivities]);
  
  const selectedActivityFitsCriteria = useMemo(() => {
    if (!selectedActivity) return false;
    const fitsTime = selectedActivity.duration <= timeInMinutes;
    const fitsDaylight = !daylightNeeded || selectedActivity.daylightNeeded;
    return fitsTime && fitsDaylight;
  }, [selectedActivity, timeInMinutes, daylightNeeded]);

  useEffect(() => {
    if (selectedActivity?.daylightNeeded && !weather && !isFetchingWeather && !locationError) {
      getLocationAndFetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedActivity]);


  useEffect(() => {
     // If we have a selected activity and new weather data becomes available,
     // re-fetch the suggestion to get an updated weather tip.
    if (selectedActivity && !selectedActivity.isCustom && weather && !isFetchingWeather) {
      const originalSuggestion = suggestions.find(s => s.id === selectedActivity.id);
      
      // Only refetch if the weather tip could change.
      if (originalSuggestion && !originalSuggestion.weatherTipLong) {
        startRefetchingSuggestion(async () => {
          const weatherPayload = {
            uvIndex: weather.uvIndex,
            precipitationProbability: weather.precipitationProbability || 0,
          };
          
          // Let's ask for just one suggestion to update the current one
          const result = await getSuggestionsAction({
            availableTimeMinutes: 0, // Not needed
            daylightNeeded: false, // Not needed
            activityToUpdate: {
              name: selectedActivity.name,
              duration: selectedActivity.duration,
            },
            weather: weatherPayload,
          });

          // Find a similar activity and update our selected one
          if(result.length > 0) {
            const updatedSuggestion = result[0];
            setSelectedSuggestedActivity(updatedSuggestion);
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather, isFetchingWeather]);

  useEffect(() => {
    if (sunriseSunset?.sunset) {
      const sunsetDate = new Date(sunriseSunset.sunset);
      const updateSunset = () => {
        if (sunsetDate > new Date()) {
          setTimeToSunset(formatDistanceToNow(sunsetDate, { addSuffix: true }));
        } else {
          setTimeToSunset('Sunset has passed.');
          if(interval) clearInterval(interval);
        }
      };

      updateSunset();
      const interval = setInterval(updateSunset, 1000 * 60); // Update every minute
      return () => clearInterval(interval);
    } else {
        setTimeToSunset(null);
    }
  }, [sunriseSunset]);


  
  const filteredSuggestedActivities = suggestions.filter(activity => 
    activity.duration <= timeInMinutes &&
    (!daylightNeeded || activity.daylightNeeded)
  );

  const filteredCustomActivities = useMemo(() => {
    return customActivities.filter(activity => !daylightNeeded || activity.daylightNeeded);
  }, [customActivities, daylightNeeded]);

  const WeatherDisplay = () => {
    if (isFetchingWeather) {
      return (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      );
    }
    if (weather) {
      return (
        <div className="text-sm space-y-1">
            <div className="flex items-center space-x-4 flex-wrap">
                <div className="flex items-center"><Thermometer className="mr-1.5 h-4 w-4 text-destructive" /> {weather.temperature}°F</div>
                <div className="flex items-center"><Cloud className="mr-1.5 h-4 w-4 text-blue-400" /> {weather.conditions}</div>
                <div className="flex items-center"><SunDim className="mr-1.5 h-4 w-4 text-orange-400" /> UV: {weather.uvIndex}</div>
                {weather.precipitationProbability !== undefined && (
                    <div className="flex items-center"><Droplet className="mr-1.5 h-4 w-4 text-cyan-400" /> {weather.precipitationProbability}% rain</div>
                )}
            </div>
            <div className="text-muted-foreground pt-1">{weather.forecast}</div>
        </div>
      )
    }
    return null;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Find an Activity</CardTitle>
          <CardDescription>Adjust the settings below to get activity suggestions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 items-end gap-6">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="time-input">Available Time</Label>
              <div className="flex space-x-2">
                <Input 
                  id="time-input" 
                  type="number" 
                  value={time} 
                  onChange={(e) => setTime(Math.max(0, parseInt(e.target.value, 10) || 0))} 
                  placeholder="e.g. 60"
                  className="text-base"
                />
                <Select value={timeUnit} onValueChange={setTimeUnit}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="lg:col-span-3">
              <Button onClick={handleGetSuggestions} disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Suggest Activities
              </Button>
            </div>
          </div>

          {isClient && customActivities.length > 0 && (
             <div className="space-y-4 border-t pt-6">
              <Label>Or pick one of your activities</Label>
               <div className="flex items-center gap-4">
                 <div className="flex-1">
                    <Select onValueChange={handleCustomActivitySelect} value={selectedCustomActivityId || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a custom activity..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCustomActivities.length > 0 ? (
                          filteredCustomActivities.map(activity => (
                            <SelectItem key={activity.id} value={activity.id}>
                              {activity.name} ({formatDuration(activity.duration)})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No custom activities match</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="daylight-switch"
                      checked={daylightNeeded}
                      onCheckedChange={setDaylightNeeded}
                    />
                    <Label htmlFor="daylight-switch" className="text-base">Daylight Only</Label>
                  </div>
               </div>
            </div>
          )}

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add a Custom Activity
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="font-headline text-2xl">Create a Custom Activity</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <CustomActivityForm 
                  onAddActivity={handleAddCustomActivity}
                  onDone={() => setIsSheetOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="border-t pt-4 mt-4 flex flex-col sm:flex-row items-center gap-4">
            <Button onClick={getLocationAndFetchData} disabled={isFetchingWeather || isFetchingSunriseSunset} variant="outline">
              {(isFetchingWeather || isFetchingSunriseSunset) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateIcon className="mr-2 h-4 w-4" />}
              Get My Weather
            </Button>
            <div className="flex-1">
              <WeatherDisplay />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedActivity && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-headline text-2xl">Activity Preview</CardTitle>
            <Button onClick={handleResetSelections} variant="ghost" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
             <h3 className="text-xl font-semibold">{selectedActivity.name}</h3>
             <div className="flex items-center space-x-6 text-muted-foreground">
                <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5" />
                    <span>{formatDuration(selectedActivity.duration)}</span>
                </div>
                <div className="flex items-center">
                    {selectedActivity.daylightNeeded ? (
                        <Sun className="mr-2 h-5 w-5 text-amber-500" />
                    ) : (
                        <Moon className="mr-2 h-5 w-5 text-indigo-400" />
                    )}
                    <span>{selectedActivity.daylightNeeded ? "Needs Daylight" : "Works at Night"}</span>
                </div>
             </div>
             
             {selectedActivity.weatherTipLong && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center text-sm text-accent-foreground border-t border-dashed border-accent/20 pt-3 mt-3">
                                <Info className="mr-1.5 h-4 w-4 text-accent" />
                                <span>{selectedActivity.weatherTipLong}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start">
                            <p>Based on current weather conditions.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
             )}
             
             {selectedActivity.daylightNeeded && !selectedActivity.weatherTipLong && (isFetchingWeather || isRefetchingSuggestion) && (
                <div className="flex items-center text-sm font-medium text-muted-foreground p-3 mt-4">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Fetching weather tip...</span>
                </div>
             )}

             {selectedActivity.daylightNeeded && !selectedActivity.weatherTipLong && !isFetchingWeather && !isRefetchingSuggestion && (
                 <div className="flex items-center text-sm font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mt-4">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    <span>Click "Get My Weather" or grant location access to see relevant weather tips.</span>
                </div>
             )}

             {!selectedActivityFitsCriteria && (
                <div className="flex items-center text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-4">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    <span>This activity doesn't fit your current "Available Time" or "Daylight" settings.</span>
                </div>
             )}

             {selectedActivity.daylightNeeded && (
                <div className="border-t pt-4 mt-4">
                    {isFetchingSunriseSunset ? (
                         <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Fetching sunset time...</span>
                         </div>
                    ) : timeToSunset ? (
                        <p className="text-sm text-accent-foreground font-medium">
                            Time until sunset: {timeToSunset}
                        </p>
                    ) : sunriseSunset === null && !isFetchingSunriseSunset ? (
                        <p className="text-sm text-muted-foreground">Click "Get My Weather" to fetch sunset time.</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">Could not determine sunset time.</p>
                    )
                    }
                </div>
             )}
          </CardContent>
        </Card>
      )}
      
      {!selectedActivity && (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isPending ? (
                [...Array(3)].map((_, i) => (
                    <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                ))
                ) : filteredSuggestedActivities.length > 0 ? (
                filteredSuggestedActivities.map(activity => (
                    <ActivityCard 
                    key={activity.id} 
                    activity={activity} 
                    onClick={() => handleSuggestedActivitySelect(activity)}
                    />
                ))
                ) : hasSearched ? (
                <div className="col-span-full text-center py-16 px-6 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold text-muted-foreground">No suggested activities found</h3>
                    <p className="mt-2 text-muted-foreground">Try adjusting your time filter.</p>
                </div>
                ) : !isClient || customActivities.length === 0 ? (
                <div className="col-span-full text-center py-16 px-6 border-2 border-dashed rounded-lg bg-card">
                    <Sparkles className="mx-auto h-12 w-12 text-accent" />
                    <h3 className="mt-4 text-xl font-semibold text-foreground">Ready for an adventure?</h3>
                    <p className="mt-2 text-muted-foreground">Click "Suggest" to get your first batch of ideas or add a custom one!</p>
                </div>
                ) : null}
            </div>
            {isClient && customActivities.length > 0 && (
            <div className="mt-8">
                <h2 className="text-2xl font-headline font-bold mb-4">Your Custom Activities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customActivities.map(activity => (
                    <ActivityCard 
                        key={activity.id} 
                        activity={activity} 
                        onDelete={handleDeleteCustomActivity}
                        onClick={() => handleCustomActivitySelect(activity.id)}
                    />
                ))}
                </div>
            </div>
            )}
        </div>
      )}
    </div>
  );
}
