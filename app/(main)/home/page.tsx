"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getThisWeekRange, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProblemCategories, ValueCategories } from "@/consts";
import { useAppStore } from "@/lib/store"; // useAppStoreをインポート
import { hasAnyCultivationInput } from "@/lib/utils"; // Import the new function
import { Idea } from "@/lib/types"; // Import Idea type
import { eachDayOfInterval, format, isSameDay, subWeeks, startOfWeek, endOfWeek } from 'date-fns'; // date-fnsから追加
import { ja } from 'date-fns/locale'; // jaロケールを追加
import { useMemo, useState, useEffect } from 'react'; // useMemo, useState, useEffectを追加

import { IdeaCard } from "@/components/features/idea-card";

export default function HomePage() {
  const { settings } = useAppStore();

  if (!settings) {
    return null;
  }

  const homeData = useLiveQuery(() => {
    if (!settings) { // This check inside useLiveQuery might be redundant now, but harmless.
      return [0, [], [], [], []] as [number, Idea[], Idea[], Idea[], Idea[]];
    }

    const range = getThisWeekRange(new Date(), settings.weekStartsOn);
    const start = range.start.toISOString();
    const end = range.end.toISOString();

    const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: settings.weekStartsOn });
    const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: settings.weekStartsOn });
    const lastWeekStartISO = lastWeekStart.toISOString();
    const lastWeekEndISO = lastWeekEnd.toISOString();

    return Promise.all([
      db.ideas.where('createdAt').between(start, end).count(), // 今週のIDEA数
      db.ideas.orderBy("createdAt").reverse().limit(10).toArray(), // 最近の10件
      db.ideas.where('createdAt').between(start, end).toArray(), // 今週のIDEAリストを全て取得
      db.ideas.toArray(), // 全てのIDEA (ランダム用)
      db.ideas.where('createdAt').between(lastWeekStartISO, lastWeekEndISO).toArray(), // 先週のIDEA
    ]);
  }, [settings]);

  const [weeklyCount, fetchedIdeas, weeklyIdeas, allIdeas, lastWeekRawIdeas] = homeData || [0, [], [], [], []];

  // 最近のIDEAのソート (既存ロジック)
  const recentIdeas = fetchedIdeas.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // 先週のIDEAのソート (新しい順に最大7件)
  const lastWeekIdeas = lastWeekRawIdeas.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 7);

  // Fisher-Yates (Knuth) シャッフルアルゴリズム
  const shuffleArray = (array: Idea[]) => {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array]; // 元の配列を破壊しないようにコピー
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [newArray[currentIndex], newArray[randomIndex]] = [
        newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
  };

  const [randomIdeas, setRandomIdeas] = useState<Idea[]>([]);
  const [shuffleTrigger, setShuffleTrigger] = useState(0);

  useEffect(() => {
    if (settings.homeDisplayMode === 'random' && allIdeas.length > 0) {
      const shuffled = shuffleArray(allIdeas);
      setRandomIdeas(shuffled.slice(0, 7)); // 最大7件
    }
  }, [settings.homeDisplayMode, shuffleTrigger, allIdeas]);

  const displayIdeas = useMemo(() => {
    switch (settings.homeDisplayMode) {
      case 'lastWeek':
        return lastWeekIdeas;
      case 'random':
        return randomIdeas;
      case 'recent':
      default:
        return recentIdeas;
    }
  }, [settings.homeDisplayMode, recentIdeas, lastWeekIdeas, randomIdeas]);

  const handleShuffle = () => {
    setShuffleTrigger(prev => prev + 1);
  };


  return (
    <div className="space-y-8">
      <section className="text-center">
        <div className="inline-flex flex-col items-center"> {/* 新しいラッパー要素 */}
          <h1 className="text-4xl font-bold tracking-tight">{weeklyCount} / 7</h1> {/* text-5xl から text-4xl に変更 */}
          {/* ピル表示 */}
          <div className="mt-2 w-full flex justify-between gap-1"> {/* mt-2とw-fullとjustify-betweenとgap-1を追加 */}
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 w-4 rounded-full", // ピルのサイズ
                  index < weeklyCount ? "bg-black dark:bg-white" : "border border-zinc-300 dark:border-zinc-700 bg-transparent" // 達成/未達成のスタイル
                )}
                role="img"
                aria-label={`今週のIDEA ${index + 1}番目: ${index < weeklyCount ? '達成' : '未達成'}`}
              />
            ))}
          </div>
          <p className="text-muted-foreground mt-1.5">今週のIDEA</p> {/* mt-4からmt-1.5に変更 */}
        </div>
        <Link href="/new" passHref>
          <Button size="lg" className="mt-6 w-full rounded-full">
            <Plus className="mr-2 h-5 w-5" />
            気づきを記録する
          </Button>
        </Link>
      </section>



      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {settings.homeDisplayMode === 'recent' && '最近のIDEA'}
            {settings.homeDisplayMode === 'lastWeek' && '先週のIDEA'}
            {settings.homeDisplayMode === 'random' && 'ランダムIDEA'}
          </h2>
          {settings.homeDisplayMode === 'random' && (
            <Button variant="outline" size="sm" onClick={handleShuffle}>シャッフル</Button>
          )}
        </div>
        <div className="mt-4 space-y-4">
          {displayIdeas && displayIdeas.length > 0 ? (
            displayIdeas.map(idea => (
              <IdeaCard idea={idea} key={idea.id} fromPage="home" />
            ))
          ) : (
             <p className="py-8 text-center text-sm text-muted-foreground">
              まだIDEAがありません。
            </p>
          )}
        </div>
      </section>    </div>
  );
}
