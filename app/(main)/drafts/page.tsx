"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { type Draft } from "@/lib/types";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { DraftEditModal } from "@/components/features/draft-edit-modal"; // 仮

export default function DraftsPage() {
  const router = useRouter();
  const { showToast } = useAppStore();
  const drafts = useLiveQuery(() => db.drafts.orderBy('updatedAt').reverse().toArray());

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);

  const handleEditDraft = (draft: Draft) => {
    setEditingDraft(draft);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedDraft = async (updatedText: string) => {
    if (editingDraft) {
      await db.updateDraft(editingDraft.id, updatedText);
      showToast("下書きを更新しました");
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (window.confirm("この下書きを削除しますか？")) {
      await db.deleteDraft(id);
      showToast("下書きを削除しました");
    }
  };

  const handleConvertDraftToIdea = async (id: string) => {
    if (window.confirm("この下書きを「気づき」として引き出しに入れますか？")) {
      try {
        const newIdeaId = await db.convertDraftToIdea(id);
        showToast("下書きを気づきに変換しました！");
        router.push(`/idea/${newIdeaId}`);
      } catch (error) {
        console.error("Failed to convert draft to idea:", error);
        showToast("変換に失敗しました。");
      }
    }
  };

  if (!drafts) {
    return <p className="p-4 text-center">読み込み中...</p>;
  }

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold">下書き箱</h1>

      {drafts.length === 0 ? (
        <p className="text-center text-muted-foreground mt-8">下書きはありません。</p>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="relative">
              <CardContent className="p-4 flex flex-col justify-between items-start gap-2">
                <p 
                  className="font-semibold text-base leading-tight flex-1 line-clamp-2 cursor-pointer"
                  onClick={() => handleEditDraft(draft)}
                >
                  {draft.text}
                </p>
                <div className="flex justify-between items-center w-full text-xs text-zinc-500 mt-2">
                  <span>更新: {format(draft.updatedAt, "yyyy/MM/dd HH:mm")}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditDraft(draft)}
                      className="h-7 w-7 text-zinc-400 hover:text-foreground"
                    >
                      <Edit size={16} />
                    </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteDraft(draft.id)}
                                          className="h-7 w-7 text-zinc-400 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >                      <Trash2 size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleConvertDraftToIdea(draft.id)}
                    >
                      引き出しへ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingDraft && (
        <DraftEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          draft={editingDraft}
          onSave={handleSaveEditedDraft}
        />
      )}
    </div>
  );
}
