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
      db.ideas.orderBy("createdAt").reverse().limit(7).toArray(), // Fetch recent 7 ideas
    ]);
  }, [settings]);

  const [weeklyCount, allIdeas] = homeData || [0, []];
  // Filter allIdeas to get only those with cultivation input and then take the recent 7
  const recentIdeas = allIdeas.filter(idea => hasAnyCultivationInput(idea)).slice(0, 7);


  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">{weeklyCount} / 7</h1>
        <p className="text-muted-foreground">今週のアイデア</p>
        <Link href="/new" passHref>
          <Button size="lg" className="mt-6 w-full rounded-full">
            <Plus className="mr-2 h-5 w-5" />
            気づきを記録する
          </Button>
        </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold">最近のアイデア</h2>
        <div className="mt-4 space-y-4">
          {recentIdeas && recentIdeas.length > 0 ? (
            recentIdeas.map(idea => (
              <IdeaCard idea={idea} key={idea.id} />
            ))
          ) : (
             <p className="py-8 text-center text-sm text-muted-foreground">
              まだアイデアがありません。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
