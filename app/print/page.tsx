"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Idea, Cultivation } from "@/lib/types";
import { ProblemCategories, ValueCategories, ApplyContextTypes, SourceTypes } from "@/consts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer } from "lucide-react";
import { useRouter } from "next/navigation"; // useRouterを追加
import { getCultivationProgress } from "@/lib/utils";

export default function PrintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const ideaId = searchParams.get("id");

  const idea = useLiveQuery(() => {
    if (mode === "idea" && ideaId) {
      return db.ideas.get(ideaId);
    }
    return undefined;
  }, [mode, ideaId]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (idea !== undefined) {
      setLoading(false);
    }
  }, [idea]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-4 text-center">読み込み中...</div>;
  }

  if (mode === "idea" && !idea) {
    return <div className="p-4 text-center">IDEAが見つかりません。</div>;
  }

  if (mode === "idea" && idea) {
    const createdAt = idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : '不明';
    const updatedAt = idea.updatedAt ? new Date(idea.updatedAt).toLocaleDateString() : '不明';
    const cultivation = idea.cultivation || {} as Cultivation;

    const renderCultivationField = (label: string, content: string | undefined | null) => {
      if (!content) return null;
      return (
        <div className="mb-2">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-base whitespace-pre-wrap">{content}</p>
        </div>
      );
    };

    const renderApplyScene = (sceneNumber: 1 | 2 | 3, types: (string[] | null | undefined), note: string | null | undefined) => {
      if (!types && !note) return null;
      return (
        <div className="mb-2">
          <p className="text-sm font-semibold">{`${sceneNumber + 3}) 応用先0${sceneNumber}`}</p>
          {types && types.length > 0 && (
            <p className="text-base">応用シーン: {types.map(type => ApplyContextTypes[type as keyof typeof ApplyContextTypes]).join(', ')}</p>
          )}
          {note && <p className="text-base">メモ: {note}</p>}
        </div>
      );
    };

    return (
      <div className="p-4 print:p-0 min-h-screen flex flex-col items-center print:block">
        <style jsx global>{`
          @page {
            size: A4;
            margin: 1.5cm; /* 適切な余白を設定 */
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: flex;
            width: 100%;
            justify-content: flex-end;
            padding-bottom: 1rem;
            gap: 1rem;
          }
          .print-header {
            display: none;
          }
          .print-main-content {
            width: 21cm; /* A4幅 */
            min-height: 29.7cm; /* A4高 */
            box-sizing: border-box;
            background-color: white;
            color: black;
          }
          @media print {
            .no-print, .print-header-placeholder {
              display: none !important;
            }
            .print-main-content {
              width: auto;
              min-height: auto;
              margin: 0;
              box-shadow: none;
            }
            .page-break {
              page-break-before: always;
            }
            body {
              background-color: white;
              color: black;
            }
          }
        `}</style>
        
        <div className="no-print">
          <Button onClick={() => router.back()} variant="outline" className="flex items-center gap-1">
            <ChevronLeft size={20} /> 戻る
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-1">
            <Printer size={20} /> 印刷 / PDF保存
          </Button>
        </div>

        <div className="print-main-content p-8 border rounded-lg shadow-md print:border-none print:shadow-none">
          <div className="print-header-placeholder"></div> {/* 印刷時のヘッダー用スペース、通常時は非表示 */}
          <h1 className="text-3xl font-bold mb-4">{idea.text}</h1>
          <p className="text-sm text-gray-500 mb-4">作成日: {createdAt} {idea.updatedAt && `(更新日: ${updatedAt})`}</p>

          <div className="mb-6 flex flex-wrap gap-2 print:hidden"> {/* 印刷時に不要なバッジを非表示 */}
            {idea.problemCategory && <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{ProblemCategories[idea.problemCategory]}</span>}
            {idea.valueCategory && <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{ValueCategories[idea.valueCategory]}</span>}
            {getCultivationProgress(idea).percentage > 0 && <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">育成中</span>}
          </div>
          
          {renderCultivationField("詳細", idea.detailText)}
          {renderCultivationField("1) 課題の具体", idea.deepProblemDetail)}
          {renderCultivationField("2) 解決IDEA（工夫）", idea.deepSolution)}
          {renderCultivationField("3) 価値の具体（どう良くなる）", idea.deepValueDetail)}
          
          {renderApplyScene(1, cultivation.applyScene1Type, cultivation.applyScene1Note)}
          {renderApplyScene(2, cultivation.applyScene2Type, cultivation.applyScene2Note)}
          {renderApplyScene(3, cultivation.applyScene3Type, cultivation.applyScene3Note)}

          {idea.photo && (
            <div className="mt-6">
              <p className="text-sm font-semibold mb-2">写真</p>
              <img src={idea.photo} alt="IDEA Photo" className="max-w-full h-auto object-contain" />
            </div>
          )}

          {idea.sourceType && (
            <div className="mt-6">
              <p className="text-sm font-semibold mb-2">媒体</p>
              <p className="text-base">{SourceTypes[idea.sourceType]}</p>
              {idea.sourceDetail?.title && <p className="text-sm text-gray-600">タイトル: {idea.sourceDetail.title}</p>}
              {idea.sourceDetail?.author && <p className="text-sm text-gray-600">著者: {idea.sourceDetail.author}</p>}
              {idea.sourceDetail?.url && <p className="text-sm text-gray-600">URL: <a href={idea.sourceDetail.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{idea.sourceDetail.url}</a></p>}
              {idea.sourceDetail?.person && <p className="text-sm text-gray-600">人物: {idea.sourceDetail.person}</p>}
              {idea.sourceDetail?.note && <p className="text-sm text-gray-600">メモ: {idea.sourceDetail.note}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="p-4 text-center">不正なアクセスです。</div>;
}
