"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProblemCategories, ValueCategories, ApplyContextTypes, ApplyContextType } from "@/consts";
import { useAppStore } from "@/lib/store";
import { hasAnyCultivationInput } from "@/lib/utils";
import { CultivationField } from "@/components/ui/cultivation-field";
import { ApplySceneSection } from "@/components/features/apply-scene-section";
import { Cultivation } from "@/lib/types"; // Import Cultivation type
import { TagInput } from "@/components/features/tag-input";

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const showToast = useAppStore((state) => state.showToast);
  const idea = useLiveQuery(() => db.ideas.get(params.id), [params.id]);

  const [deepProblem, setDeepProblem] = useState("");
  const [deepSolution, setDeepSolution] = useState("");
  const [deepValue, setDeepValue] = useState("");
  const [detailText, setDetailText] = useState("");
  const [cultivationState, setCultivationState] = useState<Cultivation>({}); // New state variable

  
  const hasInputForDisplay = idea ? hasAnyCultivationInput(idea) : false;

  useEffect(() => {
    if (idea) {
      setDeepProblem(idea.deepProblemDetail || "");
      setDeepSolution(idea.deepSolution || "");
      setDeepValue(idea.deepValueDetail || "");
      setDetailText(idea.detailText || "");
      setCultivationState(idea.cultivation || {}); // Initialize cultivationState
    }
  }, [idea]);


  const handleSave = async () => {
    if (!idea) return;
    try {
      await db.ideas.update(idea.id, {
        deepProblemDetail: deepProblem,
        deepSolution: deepSolution,
        deepValueDetail: deepValue,
        detailText: detailText,
        cultivation: cultivationState,
      });
      showToast("育成内容を保存しました");
    } catch (error) {
      console.error("Failed to save cultivation:", error);
      alert("保存に失敗しました。");
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
            {hasInputForDisplay && <Badge>育成済み</Badge>}
        </div>
        {idea.tags && idea.tags.length > 0 && (
          <div className="mt-4">
            <TagInput initialTags={idea.tags} onTagsChange={() => {}} disabled={true} />
          </div>
        )}
        <div className="mt-6 space-y-2">
          <label htmlFor="detailText" className="text-sm font-medium text-muted-foreground">詳細</label>
          <Textarea
            id="detailText"
            value={detailText}
            onChange={e => setDetailText(e.target.value)}
            placeholder="記入する"
            rows={5}
            className="text-base resize-y min-h-[100px]"
          />
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle>育成する</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <CultivationField label="1) 課題の具体" description="誰が、いつ、どこで、どのような課題を抱えているか" className="space-y-2">
            <Textarea
              value={deepProblem}
              onChange={e => setDeepProblem(e.target.value)}
              placeholder="記入する"
            />
          </CultivationField>
          <CultivationField label="2) 解決アイディア（工夫）" description="その課題を解決するための具体的なアプローチや独自の工夫" className="space-y-2">
            <Textarea
              value={deepSolution}
              onChange={e => setDeepSolution(e.target.value)}
              placeholder="記入する"
            />
          </CultivationField>
          <CultivationField label="3) 価値の具体（どう良くなる）" description="解決策がもたらすポジティブな変化や、どうすればもっと良くなるか" className="space-y-2">
            <Textarea
              value={deepValue}
              onChange={e => setDeepValue(e.target.value)}
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
          <Button onClick={handleSave} className="w-full">保存する</Button>
        </CardContent>
      </Card>
    </div>
  );
}


  
