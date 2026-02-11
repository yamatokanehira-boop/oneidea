"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProblemCategories, ValueCategories } from "@/consts";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { getIdeaStatus } from "@/lib/utils";
import { type IdeaStatus } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusFilters: { label: string; value: IdeaStatus | 'ALL' }[] = [
  { label: "すべて", value: 'ALL' },
  { label: "ひらめき", value: 'FLASH' },
  { label: "育成済み", value: 'FOSTERED' },
  { label: "ベスト", value: 'BEST' },
];

const getStatusBadgeVariant = (status: IdeaStatus) => {
  switch (status) {
    case 'BEST': return 'default';
    case 'FOSTERED': return 'secondary';
    default: return 'outline';
  }
};

export default function DrawerPage() {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'ALL'>('ALL');

  const allData = useLiveQuery(() => Promise.all([
    db.ideas.orderBy("createdAt").reverse().toArray(),
    db.weeklyBests.toArray()
  ]), []);

  const filteredIdeas = useMemo(() => {
    if (!allData) return [];
    const [allIdeas, allBests] = allData;

    let ideas = allIdeas;

    if (keyword) {
      ideas = ideas.filter(idea => idea.text.toLowerCase().includes(keyword.toLowerCase()));
    }

    if (statusFilter !== 'ALL') {
      ideas = ideas.filter(idea => getIdeaStatus(idea, allBests) === statusFilter);
    }
    
    return ideas;
  }, [allData, keyword, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold">引き出し</h1>
      
      <div className="space-y-4">
        <Input 
          placeholder="キーワード検索..." 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as IdeaStatus | 'ALL')}>
          <TabsList className="grid w-full grid-cols-4">
             {statusFilters.map(filter => (
                <TabsTrigger key={filter.value} value={filter.value}>{filter.label}</TabsTrigger>
             ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {filteredIdeas.map((idea) => {
            const status = getIdeaStatus(idea, allData ? allData[1] : []);
            return (
              <Link href={`/idea/${idea.id}`} key={idea.id} className="block">
                <Card className="hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{idea.text}</CardTitle>
                    <CardDescription>{new Date(idea.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    <Badge variant={getStatusBadgeVariant(status)} className="capitalize">{status.toLowerCase()}</Badge>
                    <Badge variant="outline">{ProblemCategories[idea.problemCategory]}</Badge>
                    <Badge variant="outline">{ValueCategories[idea.valueCategory]}</Badge>
                  </CardContent>
                </Card>
              </Link>
            )
        })}
        {filteredIdeas.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            条件に合うアイデアはありません。
          </p>
        )}
      </div>
    </div>
  );
}
