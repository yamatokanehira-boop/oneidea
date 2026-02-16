"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { SourceTypes, ProblemCategories, ValueCategories } from "@/consts";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { type Idea } from "@/lib/types";
import { type SourceType } from "@/consts";

import { IdeaCard } from "@/components/features/idea-card";
import { getCultivationProgress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react"; // XCircleを再インポート

import { useAppStore } from "@/lib/store";
import { useSettings } from "@/components/providers/settings-provider";

const getSearchableString = (idea: Idea): string => {
  const parts = [
    idea.text,
    idea.detailText,
    idea.sourceDetail?.title,
    idea.sourceDetail?.author,
    idea.sourceDetail?.person,
    idea.sourceDetail?.note,
    idea.sourceDetail?.url,
    idea.cultivation?.memo,
    idea.cultivation?.nextAction,
    idea.cultivation?.hypothesis,
    idea.cultivation?.useCase,
    idea.cultivation?.applyScene1Note,
    idea.cultivation?.applyScene2Note,
    idea.cultivation?.applyScene3Note,
    idea.problemCategory ? ProblemCategories[idea.problemCategory] : null,
    idea.valueCategory ? ValueCategories[idea.valueCategory] : null,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
};

type SortOrder = 'newest' | 'oldest' | 'progress_high' | 'progress_low';

export default function DrawerPage() {
  const { settings } = useAppStore();
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'media' | 'cultivated' | 'favorite'>('all');
  const [mediaSourceFilter, setMediaSourceFilter] = useState<SourceType | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const ideas = useLiveQuery(() => db.ideas.orderBy("createdAt").reverse().toArray(), []);

  const searchWords = useMemo(() => {
    return keyword.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  }, [keyword]);



  const filteredIdeas = useMemo((): Idea[] => {
    if (!settings || ideas === undefined) {
      return [];
    }

    let tempIdeas = ideas;

    // Apply keyword search (AND condition for multiple words)
    if (searchWords.length > 0) {
      tempIdeas = tempIdeas.filter((idea: Idea) => {
        const searchableString = getSearchableString(idea);
        return searchWords.every(word => searchableString.includes(word));
      });
    }

    // Filter by tab
    switch (activeTab) {
      case 'favorite':
        tempIdeas = tempIdeas.filter((idea: Idea) => idea.isFavorite);
        break;
      case 'cultivated':
        tempIdeas = tempIdeas.filter((idea: Idea) => idea.isCultivated);
        break;
      case 'media':
        if (mediaSourceFilter !== 'all') {
          tempIdeas = tempIdeas.filter((idea: Idea) => idea.sourceType === mediaSourceFilter);
        }
        break;
    }

    // Apply sorting
    const sortedIdeas = [...tempIdeas].sort((a, b) => {
      // Pinned items always come first (既存のソートロジックを維持しつつ、ソート順の前に適用)
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // 以下、選択された並び替え順序
      switch (sortOrder) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'progress_high':
          return getCultivationProgress(b).percentage - getCultivationProgress(a).percentage;
        case 'progress_low':
          return getCultivationProgress(a).percentage - getCultivationProgress(b).percentage;
        case 'newest': // デフォルトまたは明示的な'newest'
        default:
          return new Date(b.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });
    
    return sortedIdeas;
  }, [ideas, searchWords, activeTab, mediaSourceFilter, sortOrder, settings.weekStartsOn]);

  const handleClearFilters = () => {
    setKeyword("");
    setActiveTab('all');
    setMediaSourceFilter('all');
    setSortOrder('newest');
  };

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold">引き出し</h1>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Input 
            placeholder="キーワード検索..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-grow mr-2"
          />
          {(keyword || activeTab !== 'all' || mediaSourceFilter !== 'all' || sortOrder !== 'newest') && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="px-2 py-1 h-auto text-sm text-muted-foreground"
            >
              <XCircle className="h-4 w-4 mr-2" />
              クリア
            </Button>
          )}
        </div>

        {/* 並び替えブロック */}
        <div className="space-y-2 border-t border-border mt-4 pt-4">
          <p className="text-sm font-medium text-gray-700">並び替え</p>
          <div className="grid grid-cols-4 bg-gray-100 rounded-lg p-1 gap-1 border border-gray-200">
            <Button
              className={`rounded-md text-sm transition-colors duration-200 h-8 ${sortOrder === 'newest' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => setSortOrder('newest')}
            >
              新しい順
            </Button>
            <Button
              className={`rounded-md text-sm transition-colors duration-200 h-8 ${sortOrder === 'oldest' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => setSortOrder('oldest')}
            >
              古い順
            </Button>
            <Button
              className={`rounded-md text-sm transition-colors duration-200 h-8 ${sortOrder === 'progress_high' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => setSortOrder('progress_high')}
            >
              育成％ 高い順
            </Button>
            <Button
              className={`rounded-md text-sm transition-colors duration-200 h-8 ${sortOrder === 'progress_low' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => setSortOrder('progress_low')}
            >
              育成％ 低い順
            </Button>
          </div>
        </div>

        {/* フィルタブロック */}
        <div className="space-y-2 border-t border-border mt-4 pt-4">
          <p className="text-sm font-medium text-gray-700">フィルタ</p>
          <div className="grid grid-cols-4 bg-gray-100 rounded-lg p-1 gap-1 border border-gray-200">
            <Button
              className={`rounded-md text-sm transition-colors duration-200 h-8 ${activeTab === 'all' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => {
                setActiveTab('all');
                setMediaSourceFilter('all');
              }}
            >
              すべて
            </Button>
            <Button
              className={`rounded-md text-sm transition-colors duration-200 h-8 ${activeTab === 'media' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => setActiveTab('media')}
            >
              媒体
            </Button>
            <Button
              className={`rounded-md text-sm transition-colors duration-200 h-8 ${activeTab === 'cultivated' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => {
                setActiveTab('cultivated');
                setMediaSourceFilter('all');
              }}
            >
              育成済み
            </Button>
            <Button
              className={`rounded-md text-sm transition-colors duration-200 h-8 ${activeTab === 'favorite' ? 'bg-black shadow-sm text-white border border-black' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
              onClick={() => {
                setActiveTab('favorite');
                setMediaSourceFilter('all');
              }}
            >
              お気に入り
            </Button>
          </div>
          {activeTab === 'media' && (
            <div className="flex flex-nowrap gap-1 pt-2 overflow-x-auto">
              <Button
                className={`cursor-pointer rounded-md px-2 py-0.5 text-xs h-8 ${mediaSourceFilter === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
                onClick={() => setMediaSourceFilter('all')}
              >
                すべて
              </Button>
              {Object.entries(SourceTypes).map(([key, label]) => (
                <Button
                  key={key}
                  className={`cursor-pointer rounded-md px-2 py-0.5 text-xs h-8 ${mediaSourceFilter === key ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100 border border-gray-200'}`}
                  onClick={() => setMediaSourceFilter(key as SourceType)}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{filteredIdeas?.length || 0}件の気づき</p>
        {filteredIdeas && filteredIdeas.map((idea) => (
            <IdeaCard idea={idea} key={idea.id} highlightTerms={searchWords} fromPage="drawer" />
        ))}
        {filteredIdeas && filteredIdeas.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            条件に合うIDEAはありません。
          </p>
        )}
      </div>
    </div>
  );
}
