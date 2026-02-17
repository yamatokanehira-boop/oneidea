"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProblemCategories, ValueCategories } from "@/consts";
import type { Idea, Cultivation } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { cn, hasAnyCultivationInput, getCultivationProgress, getNextAction, applyIdeaSorting } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

import { CultivationField } from "@/components/ui/cultivation-field";
import { ApplySceneSection } from "@/components/features/apply-scene-section";
import { ApplyContextType } from "@/consts";
import { SortOrderSelector } from "@/components/ui/sort-order-selector";

// Chevron Icon for collapsible sections
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
  >
    <path
      fillRule="evenodd"
      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
      clipRule="evenodd"
    />
  </svg>
);


export default function CultivationPage() {
  const { showToast, sortOrder, setSortOrder } = useAppStore();
  const router = useRouter();

  const allIdeas = useLiveQuery(
    () => db.ideas.orderBy('createdAt').reverse().toArray(),
    []
  );

  // 1. Data Preparation: Split ideas into developed and in-progress
  const { developedIdeas, inProgressIdeas } = useMemo(() => {
    if (!allIdeas) return { developedIdeas: [], inProgressIdeas: [] };
    const sorted = applyIdeaSorting(allIdeas, sortOrder);
    const developed = sorted.filter(idea => getCultivationProgress(idea).percentage === 100);
    const inProgress = sorted.filter(idea => hasAnyCultivationInput(idea) && getCultivationProgress(idea).percentage < 100);
    return { developedIdeas: developed, inProgressIdeas: inProgress };
  }, [allIdeas, sortOrder]);

  const inProgressIdeasCount = inProgressIdeas.length;

  // Average cultivation percentage for in-progress ideas
  const averageCultivationPercentage = useMemo(() => {
    if (inProgressIdeasCount === 0) return 0;
    const totalPercentage = inProgressIdeas.reduce((sum, idea) => sum + getCultivationProgress(idea).percentage, 0);
    return Math.round(totalPercentage / inProgressIdeasCount);
  }, [inProgressIdeas, inProgressIdeasCount]);

  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  // 2. State Management: Collapsible sections
  const [isDevelopedSectionOpen, setDevelopedSectionOpen] = useState(false);
  const [isInProgressSectionOpen, setInProgressSectionOpen] = useState(true);


  // --- (Existing hooks and handlers: useEffect, recommendIdeaToCultivate, handleSaveCultivation, etc. - NO CHANGE) ---
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
    if (inProgressIdeasCount === 0) {
      router.push('/drawer');
      return;
    }
    const recommended = inProgressIdeas.sort((a, b) => {
      const progA = getCultivationProgress(a).percentage;
      const progB = getCultivationProgress(b).percentage;
      if (progA !== progB) return progA - progB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })[0];
    if (recommended) setSelectedIdea(recommended);
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
      setSelectedIdea(null);
    } catch (error) {
      console.error("Failed to cultivate idea:", error);
      alert("育成に失敗しました。");
    }
  };

  const handleApplySceneTypesChange = (scene: 1 | 2 | 3, types: ApplyContextType[]) => {
    setCultivationState((prev) => ({ ...prev, [`applyScene${scene}Type`]: types.length > 0 ? types : null }));
  };

  const handleApplySceneNoteChange = (scene: 1 | 2 | 3, note: string) => {
    setCultivationState((prev) => ({ ...prev, [`applyScene${scene}Note`]: note }));
  };
  // --- (End of unchanged hooks and handlers) ---


  const IdeaListItem = ({ idea }: { idea: Idea }) => {
    const progress = getCultivationProgress(idea);
    const nextAction = getNextAction(idea);
    return (
      <div
        key={idea.id}
        className="block rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md cursor-pointer p-4"
        onClick={() => setSelectedIdea(idea)}
      >
        <p className="font-semibold leading-tight line-clamp-2">{idea.text}</p>
        <div className="flex items-center gap-2 mt-2 text-sm">
          <Progress value={progress.percentage} className="h-2 flex-grow" />
          <span className="font-medium">{progress.percentage}%</span>
        </div>
        {progress.percentage < 100 && <p className="text-sm text-muted-foreground mt-2">{nextAction}</p>}
        <div className="flex items-end justify-between mt-2">
          <p className="text-xs text-muted-foreground">{new Date(idea.createdAt).toLocaleDateString()}</p>
          <Button variant="ghost" size="sm" className="px-2 py-0.5 h-auto text-sm" onClick={(e) => { e.stopPropagation(); setSelectedIdea(idea); }}>
            続きから
          </Button>
        </div>
      </div>
    );
  };


  // 3. UI Re-construction
  if (!selectedIdea) {
    return (
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">育成</h1>
          <SortOrderSelector sortOrder={sortOrder} setSortOrder={setSortOrder} />
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              育成中 {inProgressIdeasCount}件 {inProgressIdeasCount > 0 && `(平均 ${averageCultivationPercentage}%)`}
            </p>
            <Button onClick={recommendIdeaToCultivate} className="bg-black text-white hover:bg-gray-800">
              今日のIDEAを育成
            </Button>
          </div>
        </div>

        {/* Developed Ideas Section */}
        <div className="space-y-2 pt-4">
          <button
            onClick={() => setDevelopedSectionOpen(!isDevelopedSectionOpen)}
            className="w-full flex justify-between items-center py-2 group"
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">育成済みIDEA</h2>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <span className="text-sm font-medium">{developedIdeas.length}</span>
              <ChevronIcon isOpen={isDevelopedSectionOpen} />
            </div>
          </button>
          {isDevelopedSectionOpen && (
            <div className="space-y-2">
              {developedIdeas.length > 0 ? (
                developedIdeas.map((idea) => <IdeaListItem key={idea.id} idea={idea} />)
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">育成済みのIDEAはありません</p>
              )}
            </div>
          )}
        </div>

        {/* In-Progress Ideas Section */}
        <div className="space-y-2 pt-4">
          <button
            onClick={() => setInProgressSectionOpen(!isInProgressSectionOpen)}
            className="w-full flex justify-between items-center py-2 group"
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">育成中IDEA</h2>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <span className="text-sm font-medium">{inProgressIdeas.length}</span>
              <ChevronIcon isOpen={isInProgressSectionOpen} />
            </div>
          </button>
          {isInProgressSectionOpen && (
            <div className="space-y-2">
              {inProgressIdeas.length > 0 ? (
                inProgressIdeas.map((idea) => <IdeaListItem key={idea.id} idea={idea} />)
              ) : (
                <div className="py-8 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">育成中のIDEAはまだありません</p>
                  <Button onClick={() => router.push('/drawer')} className="bg-black text-white hover:bg-gray-800">
                    1件育ててみる
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Cultivation form for selected idea (no change)
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
              placeholder="記入する"
            />
          </CultivationField>
          <CultivationField label="2) 解決IDEA（工夫）" description="その課題を解決するための具体的なアプローチや独自の工夫">
            <Textarea
              value={deepSolution}
              onChange={e => setDeepSolution(e.target.value)}
              placeholder="記入する"
            />
          </CultivationField>
          <CultivationField label="3) 価値の具体（どう良くなる）" description="解決策がもたらすポジティブな変化や、どうすればもっと良くなるか">
            <Textarea
              value={deepValueDetail}
              onChange={e => setDeepValueDetail(e.target.value)}
              placeholder="記入する"
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
