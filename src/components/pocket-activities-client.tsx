"use client";

import { useState, useMemo, useTransition } from 'react';
import type { Activity } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getSuggestionsAction } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CustomActivityForm } from '@/components/custom-activity-form';
import { ActivityCard } from '@/components/activity-card';
import { PlusCircle, Zap, Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


export function PocketActivitiesClient() {
  const [time, setTime] = useState(60);
  const [daylightNeeded, setDaylightNeeded] = useState(false);
  const [suggestions, setSuggestions] = useState<Activity[]>([]);
  const [customActivities, setCustomActivities] = useLocalStorage<Activity[]>('custom-activities', []);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [isPending, startTransition] = useTransition();

  const handleGetSuggestions = () => {
    setHasSearched(true);
    startTransition(async () => {
      const result = await getSuggestionsAction({
        availableTimeMinutes: time,
        daylightNeeded: daylightNeeded,
      });
      setSuggestions(result);
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
    return allActivities.filter(activity => 
      activity.duration <= time &&
      (daylightNeeded ? activity.daylightNeeded === true : true)
    );
  }, [time, daylightNeeded, suggestions, customActivities]);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Find an Activity</CardTitle>
          <CardDescription>Adjust the settings below to get activity suggestions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="time-input">Available Time (minutes)</Label>
            <Input 
              id="time-input" 
              type="number" 
              value={time} 
              onChange={(e) => setTime(Math.max(0, parseInt(e.target.value, 10) || 0))} 
              placeholder="e.g. 60"
              className="text-base"
            />
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
