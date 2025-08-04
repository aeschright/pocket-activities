import type { Activity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Sun, Moon, User, Trash2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ActivityCardProps {
  activity: Activity;
  onDelete?: (id: string) => void;
}

export function ActivityCard({ activity, onDelete }: ActivityCardProps) {
  return (
    <TooltipProvider>
      <Card className="group relative bg-card/90 backdrop-blur-sm transition-all hover:shadow-accent/20 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-headline pr-8">{activity.name}</CardTitle>
           {activity.isCustom && (
            <Tooltip>
              <TooltipTrigger asChild>
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Custom Activity</p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
            <div className="flex items-center">
              <Clock className="mr-1.5 h-4 w-4" />
              {activity.duration} min
            </div>
            <div className="flex items-center">
              {activity.daylightNeeded ? (
                <>
                  <Sun className="mr-1.5 h-4 w-4 text-amber-500" />
                  <span>Daylight needed</span>
                </>
              ) : (
                <>
                  <Moon className="mr-1.5 h-4 w-4 text-indigo-400" />
                  <span>Works at night</span>
                </>
              )}
            </div>
          </div>
          {activity.weatherTip && (
             <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center text-sm text-accent-foreground border-t border-dashed border-accent/20 pt-2">
                        <Info className="mr-1.5 h-4 w-4 text-accent" />
                        <span>{activity.weatherTip}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                    <p>Based on current weather conditions.</p>
                </TooltipContent>
            </Tooltip>
          )}
        </CardContent>
        {activity.isCustom && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(activity.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete activity</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Activity</p>
            </TooltipContent>
          </Tooltip>
        )}
      </Card>
    </TooltipProvider>
  );
}
