"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProblemCategories, ValueCategories, ApplyContextTypes, ApplyContextType, SourceTypes } from "@/consts"; // ApplyContextTypeとSourceTypesをインポート
import { useAppStore } from "@/lib/store";
import { hasAnyCultivationInput } from "@/lib/utils";
import { CultivationField } from "@/components/ui/cultivation-field";
import { Cultivation } from "@/lib/types"; // Import Cultivation type
// TagInputは削除

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams(); // 追加
  const from = searchParams.get('from'); // 追加
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
        cultivation: cultivationState, // cultivationState全体を保存
      });
      showToast("育成内容を保存しました");
      // 保存成功後、元のページに戻る
      if (from === 'home') {
        router.replace('/home'); // ホーム画面へ遷移
      } else if (from === 'drawer') {
        router.replace('/drawer'); // 引き出し画面へ遷移
      }
    } catch (error) {
      console.error("Failed to save cultivation:", error);
      alert("保存に失敗しました。");
    }
  };

  const handleApplySceneTypeToggle = (
    scene: 1 | 2 | 3,
    typeToToggle: ApplyContextType
  ) => {
    setCultivationState(prev => {
      const currentTypes = (prev[`applyScene${scene}Type`] || []) as ApplyContextType[];
      const newTypes = currentTypes.includes(typeToToggle)
        ? currentTypes.filter(type => type !== typeToToggle)
        : [...currentTypes, typeToToggle];
      return {
        ...prev,
        [`applyScene${scene}Type`]: newTypes.length > 0 ? newTypes : null,
      };
    });
  };

  const handleApplySceneNoteChange = (
    scene: 1 | 2 | 3,
    note: string
  ) => {
    setCultivationState(prev => ({
      ...prev,
      [`applyScene${scene}Note`]: note,
    }));
  };

  if (idea === undefined) return <div>Loading...</div>;
  if (idea === null) return notFound();

  // 応用先のセクションをレンダリングするヘルパー関数
  const renderApplySceneSection = (sceneNumber: 1 | 2 | 3) => {
    const selectedTypes = (cultivationState[`applyScene${sceneNumber}Type`] || []) as ApplyContextType[];
    const note = (cultivationState[`applyScene${sceneNumber}Note`] || "") as string;

    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold">{`${sceneNumber + 3}) 応用先0${sceneNumber}`}</h3>
        <p className="text-xs text-muted-foreground">このIDEAがどのような場面で役立つか</p>

        <div className="flex bg-gray-100 rounded-lg p-1 space-x-1 border border-gray-200">
          {Object.entries(ApplyContextTypes).map(([key, label]) => {
            const type = key as ApplyContextType;
            const isSelected = selectedTypes.includes(type);
            return (
              <Button
                key={key}
                className={`flex-1 rounded-md text-sm transition-colors duration-200 h-8 ${
                  isSelected
                    ? "bg-black shadow-sm text-white border border-black" // 選択時：背景黒、文字白、黒い境界線
                    : "bg-white text-black hover:bg-gray-100 border border-gray-200" // 未選択時：背景白、文字黒、薄い灰色の境界線、hoverで薄い灰色
                }`}
                onClick={() => handleApplySceneTypeToggle(sceneNumber, type)}
              >
                {label}
              </Button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label htmlFor={`apply-note-${sceneNumber}`} className="text-sm font-medium leading-none">
            具体的メモ
          </label>
          <Textarea
            id={`apply-note-${sceneNumber}`}
            placeholder="記入する"
            value={note}
            onChange={(e) => handleApplySceneNoteChange(sceneNumber, e.target.value)}
            className="min-h-[80px] rounded-lg border border-gray-200 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="text-muted-foreground">{new Date(idea.createdAt).toLocaleDateString()}</p>
        <h1 className="mt-1 text-3xl font-bold">{idea.text}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
            {idea.problemCategory && <Badge variant="outline">{ProblemCategories[idea.problemCategory]}</Badge>}
            {idea.valueCategory && <Badge variant="outline">{ValueCategories[idea.valueCategory]}</Badge>}
            {hasInputForDisplay && <Badge>育成済み</Badge>}
        </div>
        {/* タグ関連の表示を削除
        {idea.tags && idea.tags.length > 0 && (
          <div className="mt-4">
            <TagInput initialTags={idea.tags} onTagsChange={() => {}} disabled={true} />
          </div>
        )}
        */}
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

      {/* A) 写真セクション */}
      {idea.photo && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">写真</h2>
          <div className="mt-4">
            <img src={idea.photo} alt="IDEA Photo" className="w-full h-48 object-cover rounded-md" />
          </div>
        </section>
      )}

      {/* B) 媒体セクション */}
      {idea.sourceType && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">媒体</h2>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">{SourceTypes[idea.sourceType]}</p>
            {idea.sourceDetail && (
              <div className="space-y-1 text-sm text-muted-foreground">
                {idea.sourceDetail.title && <p>タイトル: {idea.sourceDetail.title}</p>}
                {idea.sourceDetail.author && <p>著者: {idea.sourceDetail.author}</p>}
                {idea.sourceDetail.url && <p>URL: <a href={idea.sourceDetail.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{idea.sourceDetail.url}</a></p>}
                {idea.sourceDetail.person && <p>人物: {idea.sourceDetail.person}</p>}
                {idea.sourceDetail.note && <p>メモ: {idea.sourceDetail.note}</p>}
              </div>
            )}
          </div>
        </section>
      )}

      {/* C) 課題セクション */}
      {idea.problemCategory && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">課題</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{ProblemCategories[idea.problemCategory]}</Badge>
          </div>
        </section>
      )}

      {/* D) 価値セクション */}
      {idea.valueCategory && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">価値</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline">{ValueCategories[idea.valueCategory]}</Badge>
          </div>
        </section>
      )}

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
          <CultivationField label="2) 解決IDEA（工夫）" description="その課題を解決するための具体的なアプローチや独自の工夫" className="space-y-2">
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

          {renderApplySceneSection(1)}
          {renderApplySceneSection(2)}
          {renderApplySceneSection(3)}

          <Button onClick={handleSave} className="w-full">保存する</Button>
        </CardContent>
      </Card>
    </div>
  );
}