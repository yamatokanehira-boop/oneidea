"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function MessagePage() {
  return (
    <div className="space-y-6 pb-12">
      <Link href="/home" className="flex items-center text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-5 w-5 mr-1" />
        ホーム
      </Link>

      <h1 className="text-3xl font-bold text-center">ONEIDEAからのメッセージ</h1>
      
      <div className="space-y-6 mt-8 text-center mx-auto max-w-md"> {/* Added mx-auto max-w-md for centering and max-width */}
        <p className="leading-relaxed">正解じゃなくていい。</p>
        <p className="leading-relaxed">問いを立てた時点で価値がある。</p>

        <p className="leading-relaxed mt-6">ONEIDEAは、誰もがクリエイティブに戻れるための思考ツールです。</p>
        <p className="leading-relaxed">クリエイティブとは、想像し、創造する力。</p>
        <p className="leading-relaxed">それは特別な才能ではなく、どんな人にも元々備わっている力です。</p>

        <p className="leading-relaxed mt-6">ONEIDEAは、その力のスイッチを「問い（なんで？）」に置きました。</p>
        <p className="leading-relaxed">正解を出さなくていい。</p>
        <p className="leading-relaxed">日常の小さな瞬間に「なんで？」を取り戻すことで、</p>
        <p className="leading-relaxed">いつもの景色に違和感が見つかり、観察が鋭くなり、世界の見え方が変わります。</p>
        <p className="leading-relaxed">その積み重ねが、毎日をIDEAの源泉に変えていきます。</p>

        <p className="leading-relaxed mt-6">ONEIDEAが大事にしているのは、</p>
        <p className="leading-relaxed">うまい答えより、いい違和感。</p>
        <p className="leading-relaxed">問いは深めるほど、IDEAは具体になる。</p>
        <p className="leading-relaxed">失敗していい。試すことがクリエイティブ。</p>

        <p className="leading-relaxed mt-6">この価値観と一緒に、</p>
        <p className="leading-relaxed">あなたの毎日を少しずつ育てていけたら嬉しいです。</p>
      </div>
    </div>
  );
}
