"use client";

import { ChevronLeft, Sparkles, HelpCircle, Sprout, Wand2 } from "lucide-react"; // Removed unused PlusCircle, CheckCircle
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge"; // Badge is not used in this file. Removed import.

export default function GuidePage() {
  return (
    <div className="space-y-6 pb-12">
      <Link href="/home" className="flex items-center text-muted-foreground hover:text-foreground" aria-label="ホームに戻る">
        <ChevronLeft className="h-5 w-5 mr-1" />
        ホーム
      </Link>

      <h1 className="text-3xl font-bold text-center">ONEIDEAの使い方</h1>
      <p className="text-center text-muted-foreground mt-2">
        日常の「なんで？」を、IDEAに育てよう。
      </p>

      <div className="space-y-6 mt-8">
        <Card className="p-4">
          <CardContent className="space-y-4">
            <div className="text-left space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles size={24} className="text-foreground" aria-label="違和感" />
                <p className="text-lg font-semibold">違和感</p>
              </div>
              <p className="text-muted-foreground ml-8">ラベルが無いペットボトルが売っていた。</p>
              <p className="text-muted-foreground text-center">↓</p>

              <div className="flex items-center space-x-2">
                <HelpCircle size={24} className="text-foreground" aria-label="問い" />
                <p className="text-lg font-semibold">問い（なんで？）</p>
              </div>
              <p className="text-muted-foreground ml-8">なんでラベルが無いんだろう？</p>
              <p className="text-muted-foreground text-center">↓</p>

              <div className="flex items-center space-x-2">
                <Sprout size={24} className="text-foreground" aria-label="育てる" />
                <p className="text-lg font-semibold">育てる（理由を言語化＝仮説）</p>
              </div>
              <ul className="list-disc list-inside text-muted-foreground ml-8 space-y-1">
                <li>環境：ラベルごみを減らす（負荷・CO2削減につながる可能性）</li>
                <li>体験：分別時の「ラベル剥がし」が不要</li>
              </ul>
              <p className="text-muted-foreground text-center">↓</p>

              <div className="flex items-center space-x-2">
                <Wand2 size={24} className="text-foreground" aria-label="応用" />
                <p className="text-lg font-semibold">応用（使う）</p>
              </div>
              <p className="text-muted-foreground ml-8">生活の「手間」や「ムダ」を減らす工夫に置き換える。</p>
            </div>
          </CardContent>
        </Card>

        {/* メモ追加導線の説明 */}
        <Card className="p-4">
          <CardContent className="space-y-2">
            <h3 className="text-xl font-semibold text-center">メモを追加する</h3>
            <p className="text-muted-foreground text-center">ホームの「気づきを記録する」ボタン、またはタブバーの「＋」から新しいメモを追加できます。</p>
          </CardContent>
        </Card>

        {/* Removed "4つの思考ステップ" card */}

        {/* Problem/Value 選択の説明 */}
        <Card className="p-4">
          <CardContent className="space-y-4">
            <h3 className="text-xl font-semibold text-center">「課題」と「価値」を選ぶ</h3>
            <p className="text-muted-foreground text-center">課題と価値の2軸で気づきを整理する。</p>

            <div className="space-y-2">
              <p className="text-lg font-semibold">課題 (Problem)　1つ選択する</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>効率（ムダ/手間）</li>
                <li>理解（迷い/分かりにくさ）</li>
                <li>安心（不安/リスク）</li>
                <li>体験（楽しくない/続かない）</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold">価値 (Value)　1つ選択する</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>機能的価値</li>
                <li>情緒的価値</li>
                <li>経済的価値</li>
                <li>社会/環境価値</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* New Card: 「気づきを保存」の説明 */}
        <Card className="p-4">
          <CardContent className="space-y-2">
            <h3 className="text-xl font-semibold text-center">気づきを保存</h3>
            <p className="text-muted-foreground text-center">
              「<strong className="font-semibold">気づきを保存</strong>」を押すと、その気づきが<br />
              <strong className="font-semibold">引き出しページに“IDEAカード”として保存</strong>されます。
            </p>
          </CardContent>
        </Card>

        {/* New Card: 「アイディアを育成」の説明 */}
        <Card className="p-4">
          <CardContent className="space-y-2">
            <h3 className="text-xl font-semibold text-center">IDEAを育成する</h3>
            <p className="text-muted-foreground text-center">
              引き出しの<strong className="font-semibold">IDEAカードをタップすると</strong>、<br />
              そのIDEAを<strong className="font-semibold">育成（深める）</strong>できます。
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-sm mt-8">今日の「なんで？」を、ひとつ残そう。</p>
      </div>
    </div>
  );
}
