"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Activity, EnergyLevel } from "@/lib/types";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Activity name must be at least 2 characters.",
  }).max(50, {
    message: "Activity name must not exceed 50 characters."
  }),
  duration: z.coerce.number().min(1, {
    message: "Duration must be at least 1 minute.",
  }).max(1440, { // 24 hours
    message: "Duration seems a bit long, doesn't it?"
  }),
  daylightNeeded: z.boolean().default(false),
  energyLevel: z.enum(["Any", "Tired", "Low Focus", "Ready to Go", "High Energy"]).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CustomActivityFormProps {
  onAddActivity?: (activity: Omit<Activity, 'id' | 'isCustom'>) => void;
  onEditActivity?: (activity: Activity) => void;
  onDone: () => void;
  activityToEdit?: Activity | null;
}

export function CustomActivityForm({ onAddActivity, onEditActivity, onDone, activityToEdit }: CustomActivityFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      duration: 30,
      daylightNeeded: false,
      energyLevel: "Any",
    },
  });

  useEffect(() => {
    if (activityToEdit) {
      form.reset({
        name: activityToEdit.name,
        duration: activityToEdit.duration,
        daylightNeeded: activityToEdit.daylightNeeded,
        energyLevel: activityToEdit.energyLevel || "Any",
      });
    } else {
        form.reset({
            name: "",
            duration: 30,
            daylightNeeded: false,
            energyLevel: "Any",
        });
    }
  }, [activityToEdit, form]);

  function onSubmit(values: FormData) {
    const { energyLevel, ...rest } = values;
    const activityData = {
        ...rest,
        energyLevel: energyLevel === "Any" ? undefined : (energyLevel as EnergyLevel),
    }

    if (activityToEdit) {
        onEditActivity?.({ ...activityData, id: activityToEdit.id, isCustom: true });
    } else {
        onAddActivity?.(activityData);
    }
    
    form.reset();
    onDone();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Go for a walk" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (in minutes)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="30" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="energyLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Energy Level</FormLabel>
               <Select onValueChange={field.onChange} value={field.value || 'Any'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an energy level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  <SelectItem value="Tired">Tired</SelectItem>
                  <SelectItem value="Low Focus">Low Focus</SelectItem>
                  <SelectItem value="Ready to Go">Ready to Go</SelectItem>
                  <SelectItem value="High Energy">High Energy</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How much energy does this activity typically require?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="daylightNeeded"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Needs Daylight?</FormLabel>
                <FormDescription>
                  Does this require sunlight?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
              {activityToEdit ? "Save Changes" : "Add Activity"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
