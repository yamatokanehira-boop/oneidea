"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { SourceTypes, ProblemCategories, ValueCategories } from "@/consts";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { type Idea } from "@/lib/types"; // SourceTypeを削除
import { type SourceType } from "@/consts"; // constsからSourceTypeをインポート
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdeaCard } from "@/components/features/idea-card";
// import { normalizeTag } from "@/lib/utils"; // Removed normalizeTag import
import { getThisWeekRange } from "@/lib/utils";
import { subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { FilterIcon, XCircle, PinIcon, PinOffIcon } from "lucide-react";

// Helper function definition outside the component
const getSearchableString = (idea: Idea): string => {
  const parts = [
    idea.text,
    idea.detailText,
    idea.sourceDetail?.title,
    idea.sourceDetail?.author,
    idea.sourceDetail?.person,
    idea.sourceDetail?.note,
    idea.sourceDetail?.url,
    // ...(idea.tags || []), // Removed tags from searchable string
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

type FilterDateRange = 'all' | '7days' | '30days';

export default function DrawerPage() {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'media' | 'cultivated' | 'favorite'>('all');
  const [mediaSourceFilter, setMediaSourceFilter] = useState<SourceType | 'all'>('all');
  // const [filterTag, setFilterTag] = useState(""); // Removed filterTag state
  const [filterDateRange, setFilterDateRange] = useState<FilterDateRange>('all');
  const [filterPinned, setFilterPinned] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const ideas = useLiveQuery(() => db.ideas.orderBy("createdAt").reverse().toArray(), []);

  const searchWords = useMemo(() => {
    return keyword.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  }, [keyword]);

  const filteredIdeas = useMemo((): Idea[] => {
    if (ideas === undefined) { // Explicitly check for undefined
      return [];
    }

    let tempIdeas = ideas; // Let TypeScript infer after the guard

    // Apply keyword search (AND condition for multiple words)
    if (searchWords.length > 0) {
      tempIdeas = tempIdeas.filter((idea: Idea) => { // Explicitly type idea
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

    // Removed tag filtering logic
    // if (filterTag) {
    //   const normalizedFilterTag = normalizeTag(filterTag);
    //   if (normalizedFilterTag) {
    //     tempIdeas = tempIdeas.filter(idea => idea.tags?.includes(normalizedFilterTag));
    //   }
    // }

    // Filter by date range
    if (filterDateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      if (filterDateRange === '7days') {
        startDate = subDays(now, 7);
      } else { // 30days
        startDate = subDays(now, 30);
      }
      tempIdeas = tempIdeas.filter((idea: Idea) => new Date(idea.createdAt) >= startDate);
    }

    // Filter by pinned status
    if (filterPinned) {
      tempIdeas = tempIdeas.filter((idea: Idea) => idea.pinned);
    }
    
    // Sort ideas: pinned=true first, then by createdAt desc
    tempIdeas.sort((a: Idea, b: Idea) => { // Explicitly type a, b
      // Pinned items come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // For items with the same pinned status, sort by createdAt descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Removed filterTag from dependency array
    return tempIdeas as Idea[]; // Explicitly cast the return value
  }, [ideas, searchWords, activeTab, mediaSourceFilter, filterDateRange, filterPinned]);

  const handleClearFilters = () => {
    setKeyword("");
    setActiveTab('all');
    setMediaSourceFilter('all');
    // setFilterTag(""); // Removed setFilterTag
    setFilterDateRange('all');
    setFilterPinned(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold">引き出し</h1>
      
      <div className="space-y-4">
        <Input 
          placeholder="キーワード検索..." 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => setShowFilters(!showFilters)}
            className="px-2 py-1 h-auto text-sm text-muted-foreground"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            フィルタ ({showFilters ? '非表示' : '表示'})
          </Button>
          {(keyword || activeTab !== 'all' || mediaSourceFilter !== 'all' /*|| filterTag*/ || filterDateRange !== 'all' || filterPinned) && (
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

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-border mt-4">
            {/* Removed Tag Filter UI */}
            {/* <div>
              <label htmlFor="filterTag" className="text-sm font-medium">タグで絞り込み</label>
              <Input 
                id="filterTag"
                placeholder="例: #UI" 
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="mt-1"
              />
            </div> */}

            {/* Pinned Filter */}
            <div>
              <label className="text-sm font-medium">ピン留め</label>
              <Button 
                variant={filterPinned ? "default" : "outline"} 
                onClick={() => setFilterPinned(!filterPinned)}
                className="w-full mt-1"
              >
                {filterPinned ? <PinIcon className="h-4 w-4 mr-2" /> : <PinOffIcon className="h-4 w-4 mr-2" />}
                {filterPinned ? "ピン留め済みのみ" : "すべて表示"}
              </Button>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium">期間</label>
              <Tabs value={filterDateRange} onValueChange={(value) => setFilterDateRange(value as FilterDateRange)} className="mt-1">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">すべて</TabsTrigger>
                  <TabsTrigger value="7days">過去7日</TabsTrigger>
                  <TabsTrigger value="30days">過去30日</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
             <TabsTrigger value="all">すべて</TabsTrigger>
             <TabsTrigger value="media">媒体</TabsTrigger>
             <TabsTrigger value="cultivated">育成済み</TabsTrigger>
             <TabsTrigger value="favorite">お気に入り</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'media' && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge
              variant={mediaSourceFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setMediaSourceFilter('all')}
              className="cursor-pointer"
            >
              すべて
            </Badge>
            {Object.entries(SourceTypes).map(([key, label]) => (
              <Badge
                key={key}
                variant={mediaSourceFilter === key ? 'default' : 'outline'}
                onClick={() => setMediaSourceFilter(key as SourceType)}
                className="cursor-pointer"
              >
                {label}
              </Badge>
            ))}
          </div>
        )}
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