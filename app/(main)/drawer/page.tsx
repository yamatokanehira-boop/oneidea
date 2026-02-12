"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { SourceTypes } from "@/consts";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { type Idea, type SourceType } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdeaCard } from "@/components/features/idea-card";

const getSearchableString = (idea: Idea): string => {
  const parts = [
    idea.text,
    idea.detailText,
    idea.sourceDetail?.title,
    idea.sourceDetail?.author,
    idea.sourceDetail?.person,
    idea.sourceDetail?.note,
    idea.sourceDetail?.url,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
};

export default function DrawerPage() {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'media' | 'cultivated' | 'favorite'>('all');
  const [mediaSourceFilter, setMediaSourceFilter] = useState<SourceType | 'all'>('all');

  const ideas = useLiveQuery(() => db.ideas.orderBy("createdAt").reverse().toArray(), []);

  const filteredIdeas = useMemo(() => {
    if (!ideas) return [];

    let tempIdeas = ideas;

    // Filter by keyword
    if (keyword) {
      const lowercasedKeyword = keyword.toLowerCase();
      tempIdeas = tempIdeas.filter(idea => getSearchableString(idea).includes(lowercasedKeyword));
    }

    // Filter by tab
    switch (activeTab) {
      case 'favorite':
        tempIdeas = tempIdeas.filter(idea => idea.isFavorite);
        break;
      case 'cultivated':
        tempIdeas = tempIdeas.filter(idea => idea.isCultivated);
        break;
      case 'media':
        if (mediaSourceFilter !== 'all') {
          tempIdeas = tempIdeas.filter(idea => idea.sourceType === mediaSourceFilter);
        }
        break;
    }
    
    return tempIdeas;
  }, [ideas, keyword, activeTab, mediaSourceFilter]);

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold">引き出し</h1>
      
      <div className="space-y-4">
        <Input 
          placeholder="キーワード検索..." 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
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
        {filteredIdeas && filteredIdeas.map((idea) => (
            <IdeaCard idea={idea} key={idea.id} />
        ))}
        {filteredIdeas && filteredIdeas.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            条件に合うアイデアはありません。
          </p>
        )}
      </div>
    </div>
  );
}
