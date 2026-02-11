"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProblemCategories, ValueCategories, ApplyContextTypes } from "@/consts";
import type { ApplyContextType } from "@/consts";
import { useAppStore } from "@/lib/store";
import { isFostered as checkIsFostered } from "@/lib/utils";

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const showToast = useAppStore((state) => state.showToast);
  const idea = useLiveQuery(() => db.ideas.get(params.id), [params.id]);

  const [deepProblem, setDeepProblem] = useState("");
  const [deepSolution, setDeepSolution] = useState("");
  const [deepValue, setDeepValue] = useState("");
  const [applyContext, setApplyContext] = useState<ApplyContextType | undefined>();
  const [applyNote, setApplyNote] = useState("");
  const [detailText, setDetailText] = useState(""); // 新規追加
  
  const isFostered = idea ? checkIsFostered(idea) : false;

  useEffect(() => {
    if (idea) {
      setDeepProblem(idea.deepProblemDetail || "");
      setDeepSolution(idea.deepSolution || "");
      setDeepValue(idea.deepValueDetail || "");
      setApplyContext(idea.applyContextType);
      setApplyNote(idea.applyContextNote || "");
      setDetailText(idea.detailText || ""); // 新規追加
    }
  }, [idea]);

  const handleSave = async () => {
    if (!idea) return;
    try {
      await db.ideas.update(idea.id, {
        deepProblemDetail: deepProblem,
        deepSolution: deepSolution,
        deepValueDetail: deepValue,
        applyContextType: applyContext,
        applyContextNote: applyNote,
        detailText: detailText, // 新規追加
      });
      showToast("深掘り内容を保存しました");
    } catch (error) {
      console.error("Failed to save deep dive:", error);
      alert("保存に失敗しました。");
    }
  };
  
  if (idea === undefined) return <div>Loading...</div>;
  if (idea === null) return notFound();

  return (
    <div className="space-y-8">
      <section>
        <p className="text-muted-foreground">{new Date(idea.createdAt).toLocaleDateString()}</p>
        <h1 className="mt-1 text-3xl font-bold">{idea.text}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{ProblemCategories[idea.problemCategory]}</Badge>
            <Badge variant="outline">{ValueCategories[idea.valueCategory]}</Badge>
            {isFostered && <Badge>育成済み</Badge>}
        </div>
        <div className="mt-6 space-y-2">
          <label htmlFor="detailText" className="text-sm font-medium text-muted-foreground">詳細</label>
          <Textarea
            id="detailText"
            value={detailText}
            onChange={e => setDetailText(e.target.value)}
            placeholder="気づいた背景、具体例、なぜ良いと思ったか、など"
            rows={5}
            className="text-base resize-y min-h-[100px]"
          />
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>深掘りする</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">1) 課題の具体（誰が/いつ/どこで）</label>
            <Textarea value={deepProblem} onChange={e => setDeepProblem(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">2) 解決アイディア（工夫）</label>
            <Textarea value={deepSolution} onChange={e => setDeepSolution(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">3) 価値の具体（どう良くなる）</label>
            <Textarea value={deepValue} onChange={e => setDeepValue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">4) 応用先</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ApplyContextTypes).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={applyContext === key ? "default" : "outline"}
                  onClick={() => setApplyContext(key as ApplyContextType)}
                  className="cursor-pointer"
                >
                  {label}
                </Badge>
              ))}
            </div>
            <Textarea value={applyNote} onChange={e => setApplyNote(e.target.value)} placeholder="応用先の詳細"/>
          </div>
          <Button onClick={handleSave} className="w-full">保存する</Button>
        </CardContent>
      </Card>
    </div>
  );
}
