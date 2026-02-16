"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function MessagePage() {
  return (
    <div className="space-y-6 pb-12 bg-white px-6">
      <Link href="/home" className="flex items-center text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-5 w-5 mr-1" />
        ホーム
      </Link>

      <h1 className="pt-20 sm:pt-24 text-4xl sm:text-5xl font-semibold tracking-[0.35em] uppercase text-left">MESSAGE</h1>
      <p className="mt-6 text-sm sm:text-base leading-7 tracking-[0.06em] text-zinc-600 text-left mx-auto max-w-[720px] px-0">One day, one idea. 日々の気づきを資産に変える。</p>
      
      <div className="mt-12 sm:mt-16 text-left mx-auto max-w-[720px] px-0 space-y-5 lg:space-y-7"> {/* Added mx-auto max-w-md for centering and max-width */}


        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800 mt-6">ONEIDEAは、誰もがクリエイティブに戻れるための思考ツールです。</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">クリエイティブとは、想像し、創造する力。</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">それは特別な才能ではなく、どんな人にも元々備わっている力です。</p>

        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800 mt-6">ONEIDEAは、その力のスイッチを「問い（なんで？）」に置きました。</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">正解を出さなくていい。</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">日常の小さな瞬間に「なんで？」を取り戻すことで、</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">いつもの景色に違和感が見つかり、観察が鋭くなり、世界の見え方が変わります。</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">その積み重ねが、毎日をIDEAの源泉に変えていきます。</p>

        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800 mt-6">ONEIDEAが大事にしているのは、</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">うまい答えより、いい違和感。</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">問いは深めるほど、IDEAは具体になる。</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">失敗していい。試すことがクリエイティブ。</p>

        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800 mt-6">この価値観と一緒に、</p>
        <p className="leading-8 lg:leading-9 text-[15px] sm:text-base tracking-[0.06em] text-zinc-800">あなたの毎日を少しずつ育てていけたら嬉しいです。</p>
      </div>
    </div>
  );
}
