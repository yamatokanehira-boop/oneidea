"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge"; // Add this import
import { ProblemCategories, ValueCategories } from "@/consts"; // Add this import
import type { Idea, Cultivation } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { cn, hasAnyCultivationInput, getCultivationProgress, getNextAction } from "@/lib/utils"; // Import hasAnyCultivationInput, getCultivationProgress, getNextAction
import { ChevronLeft } from "lucide-react"; // Add this import
import { Progress } from "@/components/ui/progress"; // Progressコンポーネントをインポート
import { useRouter } from "next/navigation"; // useRouterをインポート

import { CultivationField } from "@/components/ui/cultivation-field";
import { ApplySceneSection } from "@/components/features/apply-scene-section";
import { ApplyContextType } from "@/consts";

export default function CultivationPage() {
  const { showToast } = useAppStore();
  const router = useRouter(); // useRouterを初期化
  
  const allIdeas = useLiveQuery(
    () => db.ideas.orderBy('createdAt').reverse().toArray(),
    []
  );

  const cultivatedIdeas = allIdeas?.filter(idea => hasAnyCultivationInput(idea)) || [];
  const cultivatedIdeasCount = cultivatedIdeas.length;

  // 平均育成%の計算
  const averageCultivationPercentage = useMemo(() => {
    if (cultivatedIdeasCount === 0) return 0;
    const totalPercentage = cultivatedIdeas.reduce((sum, idea) => sum + getCultivationProgress(idea).percentage, 0);
    return Math.round(totalPercentage / cultivatedIdeasCount);
  }, [cultivatedIdeas, cultivatedIdeasCount]);

  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [deepProblemDetail, setDeepProblemDetail] = useState("");
  const [deepSolution, setDeepSolution] = useState("");
  const [deepValueDetail, setDeepValueDetail] = useState("");
  const [cultivationState, setCultivationState] = useState<Cultivation>({});

  useEffect(() => {
    if (selectedIdea) {
      setDeepProblemDetail(selectedIdea.deepProblemDetail || "");
      setDeepSolution(selectedIdea.deepSolution || "");
      setDeepValueDetail(selectedIdea.deepValueDetail || "");
      setCultivationState(selectedIdea.cultivation || {});
    } else {
      setDeepProblemDetail("");
      setDeepSolution("");
      setDeepValueDetail("");
      setCultivationState({});
    }
  }, [selectedIdea]);

  const recommendIdeaToCultivate = () => {
    if (cultivatedIdeasCount === 0) {
      router.push('/drawer'); // 育成中のIDEAがなければ引き出しページへ
      return;
    }

    // 育成%が最も低いもの、同率ならcreatedAtが新しいものを選択
    const recommended = cultivatedIdeas.sort((a, b) => {
      const progA = getCultivationProgress(a).percentage;
      const progB = getCultivationProgress(b).percentage;

      if (progA !== progB) {
        return progA - progB; // 育成%が低い方を優先
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // createdAtが新しい方を優先
    })[0];

    if (recommended) {
      setSelectedIdea(recommended);
    }
  };

  const handleSaveCultivation = async () => {
    if (!selectedIdea) return;

    try {
      await db.ideas.update(selectedIdea.id, {
        deepProblemDetail: deepProblemDetail,
        deepSolution: deepSolution,
        deepValueDetail: deepValueDetail,
        cultivation: cultivationState,
      });
      showToast("IDEAを育成しました！");
      setSelectedIdea(null); // Return to list after saving
    } catch (error) {
      console.error("Failed to cultivate idea:", error);
      alert("育成に失敗しました。");
    }
  };

  const handleApplySceneTypesChange = ( // 関数名変更
    scene: 1 | 2 | 3,
    types: ApplyContextType[] // 配列を受け取る
  ) => {
    setCultivationState((prev) => ({
      ...prev,
      [`applyScene${scene}Type`]: types.length > 0 ? types : null, // 配列が空ならnullをセット
    }));
  };

  const handleApplySceneNoteChange = (
    scene: 1 | 2 | 3,
    note: string
  ) => {
    setCultivationState((prev) => ({
      ...prev,
      [`applyScene${scene}Note`]: note,
    }));
  };

    // If no idea is selected, show the list of ideas
    if (!selectedIdea) {
      return (
        <div className="space-y-6 pb-12">
          {/* ページ上部（モチベ領域） */}
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold">育成</h1>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">                育成中 {cultivatedIdeasCount}件 {cultivatedIdeasCount > 0 && `(平均 ${averageCultivationPercentage}%)`}
              </p>
              <Button onClick={recommendIdeaToCultivate} className="bg-black text-white hover:bg-gray-800">
                今日のIDEAを育成
              </Button>
            </div>
          </div>
  
          {/* 育成中リスト */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">育成中のIDEA</h2>
            <div className="space-y-2">
              {cultivatedIdeasCount > 0 ? (
                cultivatedIdeas.map((ideaItem: Idea) => {
                  const progress = getCultivationProgress(ideaItem);
                  const nextAction = getNextAction(ideaItem);
                  return (
                    <div
                      key={ideaItem.id}
                      className="block rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md cursor-pointer p-4"
                      onClick={() => setSelectedIdea(ideaItem)}
                    >
                      <p className="font-semibold leading-tight line-clamp-2">{ideaItem.text}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Progress value={progress.percentage} className="h-2 flex-grow" />
                        <span className="font-medium">{progress.percentage}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{nextAction}</p>
                      <div className="flex items-end justify-between mt-2">
                        <p className="text-xs text-muted-foreground">{new Date(ideaItem.createdAt).toLocaleDateString()}</p>
                        <Button variant="ghost" size="sm" className="px-2 py-0.5 h-auto text-sm" onClick={(e) => { e.stopPropagation(); setSelectedIdea(ideaItem); }}>
                          続きから
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">育成中のIDEAはまだありません</p>
                  <Button onClick={() => router.push('/drawer')} className="bg-black text-white hover:bg-gray-800">
                    1件育ててみる
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  // If an idea is selected, show the cultivation form
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setSelectedIdea(null)} className="flex items-center gap-1 -ml-2">
          <ChevronLeft className="h-5 w-5" />
          <span>IDEA一覧</span>
        </Button>
        <h1 className="text-xl font-bold">{selectedIdea.text}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>育成シート</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <CultivationField label="1) 課題の具体" description="誰が、いつ、どこで、どのような課題を抱えているか">
            <Textarea
              value={deepProblemDetail}
              onChange={e => setDeepProblemDetail(e.target.value)}
              placeholder="例: 学生がカフェで勉強中、集中できない"
            />
          </CultivationField>
          <CultivationField label="2) 解決IDEA（工夫）" description="その課題を解決するための具体的なアプローチや独自の工夫">
            <Textarea
              value={deepSolution}
              onChange={e => setDeepSolution(e.target.value)}
              placeholder="例: 環境音を生成するアプリで、好みの集中空間を再現する"
            />
          </CultivationField>
          <CultivationField label="3) 価値の具体（どう良くなる）" description="解決策がもたらすポジティブな変化や、どうすればもっと良くなるか">
            <Textarea
              value={deepValueDetail}
              onChange={e => setDeepValueDetail(e.target.value)}
              placeholder="例: カフェでも自宅でも、ノイズを気にせず高い集中力を維持できる"
            />
          </CultivationField>
          <ApplySceneSection
            sceneNumber={1}
            selectedTypes={cultivationState.applyScene1Type || null}
            note={cultivationState.applyScene1Note || null}
            onTypesChange={(types) => handleApplySceneTypesChange(1, types)}
            onNoteChange={(note) => handleApplySceneNoteChange(1, note)}
          />
          <ApplySceneSection
            sceneNumber={2}
            selectedTypes={cultivationState.applyScene2Type || null}
            note={cultivationState.applyScene2Note || null}
            onTypesChange={(types) => handleApplySceneTypesChange(2, types)}
            onNoteChange={(note) => handleApplySceneNoteChange(2, note)}
          />
          <ApplySceneSection
            sceneNumber={3}
            selectedTypes={cultivationState.applyScene3Type || null}
            note={cultivationState.applyScene3Note || null}
            onTypesChange={(types) => handleApplySceneTypesChange(3, types)}
            onNoteChange={(note) => handleApplySceneNoteChange(3, note)}
          />
          <Button onClick={handleSaveCultivation} className="w-full">保存する</Button>
        </CardContent>
      </Card>
    </div>
  );
}
