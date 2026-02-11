"use client";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppTheme, FontSize, WeekStartsOn, AfterNewIdeaBehavior } from "@/lib/types";
import { ProblemCategories, ValueCategories, ApplyContextTypes } from "@/consts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { enUS, ja } from 'date-fns/locale'; // 日本語ロケールをインポート
import { Idea } from "@/lib/types";
import { getIdeaStatus } from "@/lib/utils";

// PDF Exportの期間フィルタオプション
const pdfExportPeriodOptions = [
  { label: "今週", value: "current_week" },
  { label: "今月", value: "current_month" },
  { label: "全期間", value: "all_time" },
  // { label: "カスタム", value: "custom" }, // MVPでは後回し
];

// PDF Exportの条件指定オプション (カテゴリ、状態、応用先)
const problemConditionOptions = Object.entries(ProblemCategories).map(([key, label]) => ({ label, value: key }));
const valueConditionOptions = Object.entries(ValueCategories).map(([key, label]) => ({ label, value: key }));
const statusConditionOptions = [
  { label: "ひらめき", value: "FLASH" },
  { label: "育成済み", value: "FOSTERED" },
  { label: "ベスト", value: "BEST" },
];
const applyConditionOptions = Object.entries(ApplyContextTypes).map(([key, label]) => ({ label, value: key }));

export default function SettingsPage() {
  const { settings, updateSettings, showToast } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Export 関連のState
  const [pdfPeriod, setPdfPeriod] = useState<string>("all_time");
  const [pdfSelectedProblems, setPdfSelectedProblems] = useState<string[]>([]);
  const [pdfSelectedValues, setPdfSelectedValues] = useState<string[]>([]);
  const [pdfSelectedStatuses, setPdfSelectedStatuses] = useState<string[]>([]);
  const [pdfSelectedApplies, setPdfSelectedApplies] = useState<string[]>([]);

  if (!settings) return null; // 設定がロードされるまで何も表示しない

  const handleExport = async () => {
    try {
      const allIdeas = await db.ideas.toArray();
      const allWeeklyBests = await db.weeklyBests.toArray();
      const data = {
        ideas: allIdeas,
        weeklyBests: allWeeklyBests,
        settings: settings, // 設定もエクスポート対象に含める
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `oneidea_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("全データをエクスポートしました");
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("エクスポートに失敗しました。");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("現在のデータをすべて削除し、インポートしたデータで上書きします。よろしいですか？")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') throw new Error("File could not be read.");
        
        const data = JSON.parse(result);

        if (!data.ideas || !data.weeklyBests || !data.settings) { // settingsもチェック
          throw new Error("Invalid data format.");
        }

        await db.transaction('rw', db.ideas, db.weeklyBests, db.settings, async () => { // settingsもトランザクションに含める
          await db.ideas.clear();
          await db.weeklyBests.clear();
          await db.settings.clear(); // 設定もクリアしてインポート

          await db.ideas.bulkAdd(data.ideas);
          await db.weeklyBests.bulkAdd(data.weeklyBests);
          await db.settings.add(data.settings); // 設定をインポート
        });

        showToast("データのインポートが完了しました");
        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = "";
        // 設定が更新されたので、アプリに反映させるためにリロードを促すか、stateを更新
        updateSettings(data.settings); // Zustandストアの設定も更新

      } catch (error) {
        console.error("Failed to import data:", error);
        if (error instanceof Error) {
          alert(`インポートに失敗しました: ${error.message}`);
        } else {
          alert("インポートに失敗しました: 不明なエラーが発生しました。");
        }
      }
    };
    reader.readAsText(file);
  };

  const generatePdfContent = async () => {
    let targetIdeas: Idea[] = [];
    const allIdeas = await db.ideas.orderBy("createdAt").reverse().toArray();
    const allWeeklyBests = await db.weeklyBests.toArray();
    const now = new Date();

    // 期間フィルタリング
    switch (pdfPeriod) {
      case "current_week":
        const weekRangeStart = startOfWeek(now, { weekStartsOn: settings.weekStartsOn }); // settings.weekStartsOnを渡す
        const weekRangeEnd = endOfWeek(now, { weekStartsOn: settings.weekStartsOn }); // settings.weekStartsOnを渡す
        targetIdeas = allIdeas.filter(idea => new Date(idea.createdAt) >= weekRangeStart && new Date(idea.createdAt) <= weekRangeEnd);
        break;
      case "current_month":
        const monthRangeStart = startOfMonth(now);
        const monthRangeEnd = endOfMonth(now);
        targetIdeas = allIdeas.filter(idea => new Date(idea.createdAt) >= monthRangeStart && new Date(idea.createdAt) <= monthRangeEnd);
        break;
      case "all_time":
        targetIdeas = allIdeas;
        break;
    }

    // 条件フィルタリング (課題、価値、状態、応用先)
    if (pdfSelectedProblems.length > 0) {
      targetIdeas = targetIdeas.filter(idea => pdfSelectedProblems.includes(idea.problemCategory));
    }
    if (pdfSelectedValues.length > 0) {
      targetIdeas = targetIdeas.filter(idea => pdfSelectedValues.includes(idea.valueCategory));
    }
    if (pdfSelectedStatuses.length > 0) {
      targetIdeas = targetIdeas.filter(idea => pdfSelectedStatuses.includes(getIdeaStatus(idea, allWeeklyBests)));
    }
    if (pdfSelectedApplies.length > 0) {
      targetIdeas = targetIdeas.filter(idea => idea.applyContextType && pdfSelectedApplies.includes(idea.applyContextType));
    }

    if (targetIdeas.length === 0) {
      alert("選択された条件に合うアイデアがありません。");
      return;
    }

    // PDF用のHTMLを生成 (簡易版)
    let htmlContent = `
      <html lang="ja">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ONEIDEA Export</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20mm; background: #fff; }
              h1 { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
              h2 { font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
              .idea-card { border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 20px; background: #fff; page-break-inside: avoid; }
              .idea-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
              .idea-date { font-size: 12px; color: #777; }
              .idea-text { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
              .idea-badges { margin-bottom: 10px; }
              .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; background: #f0f0f0; color: #555; font-size: 11px; margin-right: 5px; margin-bottom: 5px; }
              .deep-dive { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; }
              .deep-dive p { margin: 5px 0; font-size: 14px; }
              .deep-dive-label { font-weight: bold; color: #555; }
              .best-badge { background: #007aff; color: white; } /* Apple Blue */
          </style>
      </head>
      <body>
          <h1>ONEIDEA Export (${format(now, 'yyyy年MM月dd日', { locale: ja })})</h1>
    `;

    targetIdeas.forEach(idea => {
      const isBest = allWeeklyBests.some(best => best.bestIdeaId === idea.id);
      htmlContent += `
        <div class="idea-card">
            <div class="idea-header">
                <div class="idea-date">${format(new Date(idea.createdAt), 'yyyy/MM/dd (eee)', { locale: ja })}</div>
                ${isBest ? '<div class="badge best-badge">Best</div>' : ''}
            </div>
            <div class="idea-text">${idea.text}</div>
            <div class="idea-badges">
                <span class="badge">${ProblemCategories[idea.problemCategory]}</span>
                <span class="badge">${ValueCategories[idea.valueCategory]}</span>
            </div>
            ${(idea.deepProblemDetail || idea.deepSolution || idea.deepValueDetail || idea.applyContextNote) ? `
              <div class="deep-dive">
                  ${idea.deepProblemDetail ? `<p><span class="deep-dive-label">課題の具体:</span> ${idea.deepProblemDetail}</p>` : ''}
                  ${idea.deepSolution ? `<p><span class="deep-dive-label">解決アイディア:</span> ${idea.deepSolution}</p>` : ''}
                  ${idea.deepValueDetail ? `<p><span class="deep-dive-label">価値の具体:</span> ${idea.deepValueDetail}</p>` : ''}
                  ${idea.applyContextType || idea.applyContextNote ? `<p><span class="deep-dive-label">応用先:</span> ${idea.applyContextType ? ApplyContextTypes[idea.applyContextType] : ''} ${idea.applyContextNote ? `(${idea.applyContextNote})` : ''}</p>` : ''}
              </div>
            ` : ''}
        </div>
      `;
    });

    htmlContent += `</body></html>`;

    // 新しいウィンドウでHTMLを開き、印刷ダイアログを表示
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      // setTimeout(() => printWindow.close(), 1000); // 印刷ダイアログが表示されたら閉じる
      showToast("PDFの生成準備ができました。印刷ダイアログから保存してください。");
    } else {
      alert("ポップアップがブロックされました。PDF生成のためには許可してください。");
    }
  };

  const togglePdfSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, key: string) => {
    setter(prev => prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]);
  };

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold">設定</h1>

      {/* 一般設定 */}
      <Card>
        <CardHeader><CardTitle>一般設定</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">テーマ</label>
            <Tabs value={settings.theme} onValueChange={(val) => updateSettings({ theme: val as AppTheme })}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="system">自動</TabsTrigger>
                <TabsTrigger value="light">ライト</TabsTrigger>
                <TabsTrigger value="dark">ダーク</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">文字サイズ</label>
            <Tabs value={settings.fontSize} onValueChange={(val) => updateSettings({ fontSize: val as FontSize })}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sm">標準</TabsTrigger>
                <TabsTrigger value="md">大</TabsTrigger>
                <TabsTrigger value="lg">特大</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">週の開始</label>
            <Tabs value={String(settings.weekStartsOn)} onValueChange={(val) => updateSettings({ weekStartsOn: Number(val) as WeekStartsOn })}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="1">月曜</TabsTrigger>
                <TabsTrigger value="0">日曜</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium">追加後の動き</label>
            <Tabs value={settings.afterNewIdeaBehavior} onValueChange={(val) => updateSettings({ afterNewIdeaBehavior: val as AfterNewIdeaBehavior })}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="home">ホームへ戻る</TabsTrigger>
                <TabsTrigger value="continue">連続入力</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

        </CardContent>
      </Card>

      {/* データ管理 */}
      <Card>
        <CardHeader><CardTitle>データ管理</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">JSONデータ</h3>
            <p className="text-sm text-muted-foreground">
              全データをJSONファイルとしてエクスポート・インポートできます。インポートすると既存のデータは上書きされます。
            </p>
            <div className="flex gap-4 pt-2">
              <Button variant="outline" onClick={handleExport}>
                エクスポート
              </Button>
              <Button variant="outline" onClick={handleImportClick}>
                インポート
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">PDFで書き出し</h3>
            <p className="text-sm text-muted-foreground">
              選択した条件のアイデアをPDFとして保存できます。（ブラウザの印刷機能を利用）
            </p>
            <div className="space-y-4 pt-2">
              <div>
                <label className="mb-2 block text-sm font-medium">期間選択</label>
                <Tabs value={pdfPeriod} onValueChange={setPdfPeriod}>
                  <TabsList className="grid w-full grid-cols-3">
                    {pdfExportPeriodOptions.map(opt => (
                      <TabsTrigger key={opt.value} value={opt.value}>{opt.label}</TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">課題</label>
                <div className="flex flex-wrap gap-2">
                  {problemConditionOptions.map(opt => (
                    <Badge 
                      key={opt.value} 
                      variant={pdfSelectedProblems.includes(opt.value) ? "default" : "outline"}
                      onClick={() => togglePdfSelection(setPdfSelectedProblems, opt.value)}
                      className="cursor-pointer"
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">価値</label>
                <div className="flex flex-wrap gap-2">
                  {valueConditionOptions.map(opt => (
                    <Badge 
                      key={opt.value} 
                      variant={pdfSelectedValues.includes(opt.value) ? "default" : "outline"}
                      onClick={() => togglePdfSelection(setPdfSelectedValues, opt.value)}
                      className="cursor-pointer"
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">状態</label>
                <div className="flex flex-wrap gap-2">
                  {statusConditionOptions.map(opt => (
                    <Badge 
                      key={opt.value} 
                      variant={pdfSelectedStatuses.includes(opt.value) ? "default" : "outline"}
                      onClick={() => togglePdfSelection(setPdfSelectedStatuses, opt.value)}
                      className="cursor-pointer"
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">応用先</label>
                <div className="flex flex-wrap gap-2">
                  {applyConditionOptions.map(opt => (
                    <Badge 
                      key={opt.value} 
                      variant={pdfSelectedApplies.includes(opt.value) ? "default" : "outline"}
                      onClick={() => togglePdfSelection(setPdfSelectedApplies, opt.value)}
                      className="cursor-pointer"
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={generatePdfContent} className="w-full">PDF出力</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ONEIDEA辞書 */}
      <Card>
        <CardHeader><CardTitle>ONEIDEA辞書</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold">課題 (Problem)</h3>
            <p className="mt-1"><span className="font-bold">効率（ムダ/手間）:</span> 作業の無駄や非効率な点を減らす。</p>
            <p className="mt-1"><span className="font-bold">理解（迷い/分かりにくさ）:</span> 情報や手順が不明瞭で困惑する状況を改善する。</p>
            <p className="mt-1"><span className="font-bold">安心（不安/リスク）:</span> 将来への不確実性や潜在的な危険性を解消する。</p>
            <p className="mt-1"><span className="font-bold">体験（楽しくない/続かない）:</span> 活動がつまらない、継続しにくいと感じる状況を変える。</p>
          </div>
          <div>
            <h3 className="font-semibold">価値 (Value)</h3>
            <p className="mt-1"><span className="font-bold">機能的価値:</span> 製品やサービスが持つ具体的な機能や性能の向上。</p>
            <p className="mt-1"><span className="font-bold">情緒的価値:</span> ユーザーの感情や感覚に訴えかける喜び、感動、安心感。</p>
            <p className="mt-1"><span className="font-bold">経済的価値:</span> コスト削減、収益向上、時間短縮など金銭的・資源的な恩恵。</p>
            <p className="mt-1"><span className="font-bold">社会/環境価値:</span> 社会貢献、環境保護、倫理的配慮など、より広い範囲への良い影響。</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
