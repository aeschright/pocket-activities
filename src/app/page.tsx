import { PocketActivitiesClient } from '@/components/pocket-activities-client';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-body">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl font-headline font-bold text-foreground">
            Pocket Activities
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
            Tell us how much time you have, and we'll suggest some fun activities to fill your break.
          </p>
        </header>
        <PocketActivitiesClient />
      </div>
    </main>
  );
}
