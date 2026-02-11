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
import { Idea } from "@/lib/types"; // Import Idea type

export default function HomePage() {
  const { settings } = useAppStore();

  console.log('HomePage: Rendered, settings:', settings);

  const homeData = useLiveQuery(() => {
    if (!settings) {
      console.log('HomePage: useLiveQuery waiting for settings...');
      return [0, [] as Idea[]] as [number, Idea[]];
    }

    const range = getThisWeekRange(new Date(), settings.weekStartsOn);
    const start = range.start.toISOString();
    const end = range.end.toISOString();

    console.log('HomePage: useLiveQuery fetching ideas for range:', start, 'to', end);
    return Promise.all([
      db.ideas.where('createdAt').between(start, end).count(),
      db.ideas.orderBy("createdAt").reverse().limit(3).toArray(),
    ]);
  }, [settings]);

  const [weeklyCount, recentIdeas] = homeData || [0, []];
  const isReviewDay = new Date().getDay() === 0;

  if (!settings) {
    console.log('HomePage: Returning null because settings is null');
    return null;
  }
  console.log('HomePage: Rendering content. weeklyCount:', weeklyCount, 'recentIdeas:', recentIdeas);

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">{weeklyCount} / 7</h1>
        <p className="text-muted-foreground">今週のアイデア</p>
        <Link href="/new" passHref>
          <Button size="lg" className="mt-6 w-full rounded-full">
            <Plus className="mr-2 h-5 w-5" />
            今日のひらめきを記録する
          </Button>
        </Link>
      </section>

      {isReviewDay && (
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>週次レビューの時間です</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              今週のアイデアを振り返り、ベストワンを選びましょう。
            </p>
            <Link href="/review" passHref>
              <Button className="w-full">レビューを始める</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-xl font-semibold">最近のアイデア</h2>
        <div className="mt-4 space-y-4">
          {recentIdeas && recentIdeas.length > 0 ? (
            recentIdeas.map(idea => (
              <Link href={`/idea/${idea.id}`} key={idea.id} className="block">
                <Card className="hover:bg-muted/50">
                   <CardHeader>
                    <CardTitle className="text-base line-clamp-2">{idea.text}</CardTitle>
                    <CardDescription>{new Date(idea.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                     <Badge variant="outline" className="text-xs">{ProblemCategories[idea.problemCategory]}</Badge>
                     <Badge variant="outline" className="text-xs">{ValueCategories[idea.valueCategory]}</Badge>
                  </CardContent>
                </Card>
              </Link>
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
