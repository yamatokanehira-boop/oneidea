"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getThisWeekRange } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProblemCategories, ValueCategories } from "@/consts";
import { useAppStore } from "@/lib/store"; // useAppStoreをインポート
import { hasAnyCultivationInput } from "@/lib/utils"; // Import the new function
import { Idea } from "@/lib/types"; // Import Idea type

import { IdeaCard } from "@/components/features/idea-card";

export default function HomePage() {
  const { settings } = useAppStore();

  if (!settings) {
    return null;
  }

  const homeData = useLiveQuery(() => {
    if (!settings) { // This check inside useLiveQuery might be redundant now, but harmless.
      return [0, [] as Idea[]] as [number, Idea[]];
    }

    const range = getThisWeekRange(new Date(), settings.weekStartsOn);
    const start = range.start.toISOString();
    const end = range.end.toISOString();

    return Promise.all([
      db.ideas.where('createdAt').between(start, end).count(),
      // Fetch recent 7 ideas, then filter them in memory using hasAnyCultivationInput
      db.ideas.orderBy("createdAt").reverse().limit(10).toArray(), // Fetch recent 10 ideas
    ]);
  }, [settings]);

  const [weeklyCount, fetchedIdeas] = homeData || [0, []];
  // The fetchedIdeas from useLiveQuery will already be the latest 10 by createdAt descending.
  // Apply custom sorting for pinned items within this set of 10.
  const recentIdeas = fetchedIdeas.sort((a, b) => {
    // Pinned items come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    // For items with the same pinned status, sort by createdAt descending
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });


  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">{weeklyCount} / 7</h1>
        <p className="text-muted-foreground">今週のIDEA</p>
        <Link href="/new" passHref>
          <Button size="lg" className="mt-6 w-full rounded-full">
            <Plus className="mr-2 h-5 w-5" />
            気づきを記録する
          </Button>
        </Link>
      </section>



      <section>
        <h2 className="text-xl font-semibold">最近のIDEA</h2>
        <div className="mt-4 space-y-4">
          {recentIdeas && recentIdeas.length > 0 ? (
            recentIdeas.map(idea => (
              <IdeaCard idea={idea} key={idea.id} fromPage="home" />
            ))
          ) : (
             <p className="py-8 text-center text-sm text-muted-foreground">
              まだIDEAがありません。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
