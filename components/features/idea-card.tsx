"use client";

import Link from "next/link";
import { type MouseEvent, useState } from "react"; // useState をインポート
import { type Idea } from "@/lib/types";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  Heart,
  Book,
  Youtube,
  User,
  Sparkles,
  MoreHorizontal,
  Trash2,
  Pencil, // Pencil をインポート
} from "lucide-react";
import { SourceTypes, ProblemCategories, ValueCategories } from "@/consts"; // ProblemCategories, ValueCategories も必要
import { getCultivationProgress } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { IdeaEditModal } from "./idea-edit-modal"; // IdeaEditModal をインポート

interface IdeaCardProps {
  idea: Idea;
  onDelete?: (id: string) => void;
}

const SourceIcon = ({ type }: { type: Idea["sourceType"] }) => {
  switch (type) {
    case "self":
      return <Sparkles className="h-4 w-4 text-zinc-500" />;
    case "book":
      return <Book className="h-4 w-4 text-zinc-500" />;
    case "youtube":
      return <Youtube className="h-4 w-4 text-zinc-500" />;
    case "person":
      return <User className="h-4 w-4 text-zinc-500" />;
    case "other":
      return <MoreHorizontal className="h-4 w-4 text-zinc-500" />;
    default:
      return null;
  }
};

export function IdeaCard({ idea, onDelete }: IdeaCardProps) {
  const { showToast } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // モーダルの開閉状態

  const handleFavoriteToggle = async (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await db.ideas.update(idea.id, { isFavorite: !idea.isFavorite });
  };

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!window.confirm("この気づきを削除しますか？")) {
      return;
    }

    try {
      await db.deleteIdea(idea.id);
      showToast("気づきを削除しました");
      onDelete?.(idea.id);

      if (pathname === `/idea/${idea.id}`) {
        router.push("/home");
      }
    } catch (error) {
      console.error("Failed to delete idea:", error);
      showToast("削除に失敗しました。");
    }
  };

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditModalOpen(true);
  };

  const handleSaveEditedIdea = async (updatedIdea: Partial<Idea>) => {
    try {
      if (idea.id) { // idea.id が undefined の可能性もあるためチェック
        await db.ideas.update(idea.id, updatedIdea);
        showToast("気づきを更新しました！");
      }
    } catch (error) {
      console.error("Failed to update idea:", error);
      showToast("更新に失敗しました。");
    }
  };

  const { percentage } = getCultivationProgress(idea);

  return (
    <> {/* Fragment で囲む */}
      <Link
        href={`/idea/${idea.id}`}
        className="block rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex justify-between items-start gap-4">
            <p className="font-semibold leading-tight flex-1">{idea.text}</p>
            <div className="flex items-center gap-2 -mr-2 -mt-1">
              <button
                onClick={handleEdit}
                className="p-1 text-zinc-400 hover:text-foreground"
              >
                <Pencil className="h-6 w-6" />
              </button>
              <button
                onClick={handleFavoriteToggle}
                className="p-1 text-zinc-400 hover:text-foreground"
              >
                <Heart
                  className={cn(
                    "h-6 w-6",
                    idea.isFavorite && "fill-current text-foreground"
                  )}
                />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-zinc-400 hover:text-red-500"
              >
                <Trash2 className="h-6 w-6" />
              </button>
            </div>
          </div>

          {idea.detailText && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {idea.detailText}
            </p>
          )}

          {/* Progress Bar and Percentage Display */}
          <div className="mt-2">
            <div className="h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  background: percentage > 0 ? 'linear-gradient(90deg, #A1A1AA 0%, #111827 100%)' : 'transparent',
                }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-zinc-500">{percentage}% 育成</p>
          </div>

          <div className="flex-grow" />

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <SourceIcon type={idea.sourceType} />
              <span>{SourceTypes[idea.sourceType]}</span>
            </div>
            <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>

      <IdeaEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        idea={idea}
        onSave={handleSaveEditedIdea}
      />
    </>
  );
}
