"use client";

import Link from "next/link";
import { type MouseEvent, useState } from "react";
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
  Pencil,
  Pin,
  PinOff,
} from "lucide-react";
import { SourceTypes, ProblemCategories, ValueCategories } from "@/consts";
import { getCultivationProgress } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useSettings } from "@/components/providers/settings-provider";
import { IdeaEditModal } from "./idea-edit-modal";
import { HighlightText } from "@/components/ui/highlight-text";
import { Button } from "@/components/ui/button"; // Buttonをインポート

interface IdeaCardProps {
  idea: Idea;
  onDelete?: (id: string) => void;
  highlightTerms?: string[];
  fromPage?: 'home' | 'drawer'; // fromPageプロパティを追加
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

export function IdeaCard({ idea, onDelete, highlightTerms, fromPage }: IdeaCardProps) {
  const { showToast } = useAppStore();
  const { settings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleTogglePinned = async (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await db.togglePinned(idea.id);
  };

  const handleCultivateClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const href = `/idea/${idea.id}${fromPage ? `?from=${fromPage}` : ''}`;
    router.push(href);
  };

  const { percentage } = getCultivationProgress(idea);
  const cardDensity = settings.cardDensity;

  const densityClasses = {
    padding: {
      compact: "p-2",
      standard: "p-4",
      spacious: "p-6",
    },
    gap: {
      compact: "gap-1",
      standard: "gap-2",
      spacious: "gap-4",
    },
    title: {
      compact: "text-base",
      standard: "text-base", // font-semibold is enough
      spacious: "text-lg",
    },
    detailText: {
      compact: "text-xs line-clamp-3",
      standard: "text-sm line-clamp-2",
      spacious: "text-sm",
    },
    progressMargin: {
      compact: "mt-1",
      standard: "mt-2",
      spacious: "mt-3",
    },
    footerMargin: {
      compact: "mt-2",
      standard: "mt-4",
      spacious: "mt-6",
    }
  };

  return (
    <>
      <Link
        href={`/idea/${idea.id}${fromPage ? `?from=${fromPage}` : ''}`}
        className="block rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
      >
        <div className={cn("flex flex-col h-full", densityClasses.padding[cardDensity])}>
          <div className="flex justify-between items-start gap-4">
            <HighlightText
              text={idea.text}
              highlight={highlightTerms}
              className={cn("leading-tight flex-1", densityClasses.title[cardDensity], cardDensity === 'compact' ? "font-normal" : "font-semibold" )}
            />
            <div className={cn("flex items-center -mr-2 -mt-1", densityClasses.gap[cardDensity])}>
               {/* Buttons are slightly smaller in compact mode */}
              <button
                onClick={handleTogglePinned}
                className="p-1 text-zinc-400 hover:text-foreground"
              >
                {idea.pinned ? (
                  <Pin className={cn(cardDensity === 'compact' ? "h-5 w-5" : "h-6 w-6", "fill-current text-foreground")} />
                ) : (
                  <PinOff className={cn(cardDensity === 'compact' ? "h-5 w-5" : "h-6 w-6")} />
                )}
              </button>
              <button onClick={handleEdit} className="p-1 text-zinc-400 hover:text-foreground">
                <Pencil className={cn(cardDensity === 'compact' ? "h-5 w-5" : "h-6 w-6")} />
              </button>
              <button onClick={handleFavoriteToggle} className="p-1 text-zinc-400 hover:text-foreground">
                <Heart className={cn(cardDensity === 'compact' ? "h-5 w-5" : "h-6 w-6", idea.isFavorite && "fill-current text-foreground")} />
              </button>
              <button onClick={handleDelete} className="p-1 text-zinc-400 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Trash2 className={cn(cardDensity === 'compact' ? "h-5 w-5" : "h-6 w-6")} />
              </button>
            </div>
          </div>

          {idea.detailText && (
            <HighlightText
              text={idea.detailText}
              highlight={highlightTerms}
              className={cn("text-zinc-600 dark:text-zinc-400", densityClasses.detailText[cardDensity], cardDensity === 'compact' ? 'mt-1' : 'mt-2')}
            />
          )}

          {/* idea.tagsの表示ブロックを削除
          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {idea.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
              {idea.tags.length > 3 && (
                <span className="rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300">
                  +{idea.tags.length - 3}
                </span>
              )}
            </div>
          )}
          */}

          <div className={cn(densityClasses.progressMargin[cardDensity])}>
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

          {/* New combined footer with Cultivate Button */}
          <div className={cn("flex items-center justify-between text-xs text-zinc-500", densityClasses.footerMargin[cardDensity])}>
            {/* Left: Source */}
            <div className="flex items-center gap-1 flex-1 text-left min-w-0">
              <SourceIcon type={idea.sourceType} />
              <span className="truncate">{SourceTypes[idea.sourceType]}</span>
            </div>

            {/* Center: Cultivate Button */}
            <div className="flex-none flex justify-center mx-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCultivateClick}
                aria-label="このIDEAを育成する"
                className="h-[36px] px-3 py-1 text-xs"
              >
                育成する
              </Button>
            </div>

            {/* Right: Date */}
            <span className="flex-1 text-right">{new Date(idea.createdAt).toLocaleDateString()}</span>
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