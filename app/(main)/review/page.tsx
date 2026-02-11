"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { db } from "@/lib/db";
import { getThisWeekRange, getWeekId } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProblemCategories, ValueCategories } from "@/consts";
import type { Idea } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { format } from "date-fns";
import { ja } from 'date-fns/locale'; // jaロケールをインポート

export default function WeeklyReviewPage() {
  const { showToast, settings } = useAppStore();
  const [currentWeekId, setCurrentWeekId] = useState("");

  useMemo(() => {
    if (settings && currentWeekId === "") {
        setCurrentWeekId(getWeekId(new Date(), settings.weekStartsOn));
    }
  }, [settings, currentWeekId]);

  const weeklyData = useLiveQuery(() => {
    if (!settings || currentWeekId === "") return null;

    const range = getThisWeekRange(new Date(currentWeekId), settings.weekStartsOn);
    const start = range.start.toISOString();
    const end = range.end.toISOString();
    
    return Promise.all([
      db.ideas.where('createdAt').between(start, end).toArray(),
      db.weeklyBests.get(currentWeekId),
    ]);
  }, [currentWeekId, settings]);

  const [ideas, weeklyBest] = weeklyData || [[], undefined];

  const handleSetBest = async (ideaId: string) => {
    try {
      await db.weeklyBests.put({
        weekId: currentWeekId,
        bestIdeaId: ideaId,
        createdAt: new Date().toISOString(),
      });
      showToast("今週のベストアイデアを更新しました！");
    } catch (error) {
      console.error("Failed to set best idea:", error);
      alert("ベストアイデアの更新に失敗しました。");
    }
  };

  const trend = useMemo(() => {
    if (!ideas || ideas.length === 0) return null;

    const problemCounts: { [key: string]: number } = Object.keys(ProblemCategories).reduce((acc, key) => ({...acc, [key]: 0}), {});
    const valueCounts: { [key: string]: number } = Object.keys(ValueCategories).reduce((acc, key) => ({...acc, [key]: 0}), {});
    const pairCounts: { [key: string]: number } = {};

    ideas.forEach(idea => {
      problemCounts[idea.problemCategory]++;
      valueCounts[idea.valueCategory]++;
      const pair = `${idea.problemCategory}-${idea.valueCategory}`;
      pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    });
    
    const topProblem = Object.entries(problemCounts).sort((a, b) => b[1] - a[1])[0];
    const topValue = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0];
    const topPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0];

    return { problemCounts, topProblem, topValue, topPair };
  }, [ideas]);

  if (!settings || currentWeekId === "") return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">週次レビュー</h1>
        <p className="text-muted-foreground">{format(new Date(currentWeekId), 'yyyy年MM月dd日', { locale: ja })}からの週</p>
      </div>

      <Card>
        <CardHeader><CardTitle>今週のひらめき一覧</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {ideas && ideas.length > 0 ? (
            ideas.map((idea) => (
              <div key={idea.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <p>{idea.text}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">{ProblemCategories[idea.problemCategory]}</Badge>
                      <Badge variant="secondary" className="text-xs">{ValueCategories[idea.valueCategory]}</Badge>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant={weeklyBest?.bestIdeaId === idea.id ? "default" : "outline"}
                  onClick={() => handleSetBest(idea.id)}
                >
                  {weeklyBest?.bestIdeaId === idea.id ? "ベスト" : "選ぶ"}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground">今週のアイデアはまだありません。</p>
          )}
        </CardContent>
      </Card>

      {trend && (
        <Card>
          <CardHeader><CardTitle>今週の傾向</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold">多かった課題</h3>
              <p>{ProblemCategories[trend.topProblem[0] as keyof typeof ProblemCategories]}: {trend.topProblem[1]}件</p>
            </div>
            <div>
              <h3 className="font-semibold">多かった価値</h3>
              <p>{ValueCategories[trend.topValue[0] as keyof typeof ValueCategories]}: {trend.topValue[1]}件</p>
            </div>
             <div>
              <h3 className="font-semibold">最頻ペア</h3>
              <p>
                {/* 複合キーをデコードして表示 */}
                {ProblemCategories[trend.topPair[0].split('-')[0] as keyof typeof ProblemCategories]} × {ValueCategories[trend.topPair[0].split('-')[1] as keyof typeof ValueCategories]}: {trend.topPair[1]}件
              </p>
            </div>
            {/* TODO: 4x4 Table */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
