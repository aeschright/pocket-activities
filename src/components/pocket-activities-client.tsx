"use client";

import { useState, useMemo, useTransition } from 'react';
import type { Activity, WeatherData } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getSuggestionsAction, getWeatherAction } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CustomActivityForm } from '@/components/custom-activity-form';
import { ActivityCard } from '@/components/activity-card';
import { PlusCircle, Zap, Loader2, Sparkles, LocateIcon, Thermometer, Wind, Cloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


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
  const { toast } = useToast();


  const [isPending, startTransition] = useTransition();

  const handleGetSuggestions = () => {
    setHasSearched(true);
    startTransition(async () => {
      const timeInMinutes = timeUnit === 'hours' ? time * 60 : time;
      const result = await getSuggestionsAction({
        availableTimeMinutes: timeInMinutes,
        daylightNeeded: daylightNeeded,
      });
      setSuggestions(result);
    });
  };
  
  const handleGetWeather = () => {
    setIsFetchingWeather(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const result = await getWeatherAction({ latitude, longitude });
      if ('error' in result) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else {
        setWeather(result);
      }
      setIsFetchingWeather(false);
    }, (error) => {
      console.error("Geolocation error:", error);
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Could not get your location. Please ensure location services are enabled.",
      })
      setIsFetchingWeather(false);
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
  };

  const filteredActivities = useMemo(() => {
    const allActivities = [...suggestions, ...customActivities];
    const timeInMinutes = timeUnit === 'hours' ? time * 60 : time;
    return allActivities.filter(activity => 
      activity.duration <= timeInMinutes &&
      (daylightNeeded ? activity.daylightNeeded === true : true)
    );
  }, [time, timeUnit, daylightNeeded, suggestions, customActivities]);
  
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
        <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center"><Thermometer className="mr-1.5 h-4 w-4 text-destructive" /> {weather.temperature}°C</div>
            <div className="flex items-center"><Cloud className="mr-1.5 h-4 w-4 text-blue-400" /> {weather.conditions}</div>
            <div className="flex-1 text-muted-foreground">{weather.forecast}</div>
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
            <div className="space-y-2">
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
            <div className="flex items-center space-x-3 pb-2">
              <Switch 
                id="daylight-switch"
                checked={daylightNeeded}
                onCheckedChange={setDaylightNeeded}
              />
              <Label htmlFor="daylight-switch" className="text-base">Needs Daylight</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1 lg:col-start-3">
                <Button onClick={handleGetSuggestions} disabled={isPending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Suggest
                </Button>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Custom
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
              </div>
          </div>
          <div className="border-t pt-4 mt-4 flex flex-col sm:flex-row items-center gap-4">
            <Button onClick={handleGetWeather} disabled={isFetchingWeather} variant="outline">
              {isFetchingWeather ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateIcon className="mr-2 h-4 w-4" />}
              Get My Weather
            </Button>
            <div className="flex-1">
              <WeatherDisplay />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isPending ? (
              [...Array(3)].map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
              ))
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map(activity => (
                <ActivityCard 
                  key={activity.id} 
                  activity={activity} 
                  onDelete={activity.isCustom ? handleDeleteCustomActivity : undefined}
                />
              ))
            ) : hasSearched ? (
              <div className="col-span-full text-center py-16 px-6 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold text-muted-foreground">No activities found</h3>
                <p className="mt-2 text-muted-foreground">Try adjusting your time or daylight filter, or add a custom activity!</p>
              </div>
            ) : (
               <div className="col-span-full text-center py-16 px-6 border-2 border-dashed rounded-lg bg-card">
                 <Sparkles className="mx-auto h-12 w-12 text-accent" />
                <h3 className="mt-4 text-xl font-semibold text-foreground">Ready for an adventure?</h3>
                <p className="mt-2 text-muted-foreground">Click "Suggest" to get your first batch of ideas!</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
