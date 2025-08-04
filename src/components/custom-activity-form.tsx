"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import type { Activity } from "@/lib/types";

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
});

interface CustomActivityFormProps {
  onAddActivity: (activity: Omit<Activity, 'id' | 'isCustom'>) => void;
  onDone: () => void;
}

export function CustomActivityForm({ onAddActivity, onDone }: CustomActivityFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      duration: 30,
      daylightNeeded: false,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddActivity(values);
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
            <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Add Activity</Button>
        </div>
      </form>
    </Form>
  );
}
