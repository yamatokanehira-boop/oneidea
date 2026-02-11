"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ProblemCategories, ValueCategories } from "@/consts";
import type { ProblemCategory, ValueCategory } from "@/consts";
import { useAppStore } from "@/lib/store"; // useAppStoreをインポート

export default function NewIdeaPage() {
  const router = useRouter();
  const { showToast, settings } = useAppStore(); // settingsを取得
  const [text, setText] = useState("");
  const [detailText, setDetailText] = useState(""); // 新規追加
  const [problem, setProblem] = useState<ProblemCategory | null>(null);
  const [value, setValue] = useState<ValueCategory | null>(null);

  if (!settings) return null; // settingsがロードされるまで表示しない

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !problem || !value) {
      alert("すべての項目を入力してください。");
      return;
    }

    try {
      const newIdea = {
        id: crypto.randomUUID(),
        text,
        detailText, // 新規追加
        problemCategory: problem,
        valueCategory: value,
        createdAt: new Date().toISOString(),
      };
      await db.ideas.add(newIdea);
      showToast("アイディアを保存しました");
      
      // 設定に基づいて遷移を分岐
      if (settings.afterNewIdeaBehavior === 'home') {
        router.push("/home");
      } else { // 'continue'
        setText(""); // フォームをクリアして連続入力
        setDetailText(""); // 詳細もクリア
        setProblem(null);
        setValue(null);
      }

    } catch (error) {
      console.error("Failed to save idea:", error);
      alert("保存に失敗しました。");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">見つけたアイディア</h1>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="アイディアを1行で記録..."
          className="mt-4 text-lg"
          required
        />
        <div className="space-y-2 mt-4">
          <label htmlFor="detailText" className="text-sm font-medium">詳細 (任意)</label>
          <Textarea
            id="detailText"
            value={detailText}
            onChange={(e) => setDetailText(e.target.value)}
            placeholder="気づいた背景、具体例、なぜ良いと思ったか、など"
            rows={5}
            className="text-base"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">課題 (Problem)</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ProblemCategories).map(([key, label]) => (
            <Badge
              key={key}
              variant={problem === key ? "default" : "outline"}
              onClick={() => setProblem(key as ProblemCategory)}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">価値 (Value)</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ValueCategories).map(([key, label]) => (
            <Badge
              key={key}
              variant={value === key ? "default" : "outline"}
              onClick={() => setValue(key as ValueCategory)}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!text || !problem || !value}>
        アイディアを保存
      </Button>
    </form>
  );
}
