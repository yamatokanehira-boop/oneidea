"use client";

import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { useState } from "react"; // useRef は不要になる
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AppTheme, FontSize, WeekStartsOn, AfterNewIdeaBehavior } from "@/lib/types";
import { useSettings } from "@/components/providers/settings-provider";
import { CardDensity, FontMode } from "@/lib/types";
import { ProblemCategories, ValueCategories, ApplyContextTypes } from "@/consts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { enUS, ja } from 'date-fns/locale'; // 日本語ロケールをインポート
import { Idea } from "@/lib/types";
import { useRouter } from "next/navigation"; // useRouter をインポート
import Link from "next/link"; // Link をインポート
import { AlertCircle, FileText } from "lucide-react"; // AlertCircle, FileText をインポート

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
  { label: "気づき", value: "FLASH" },
  { label: "育成済み", value: "FOSTERED" },
];
const applyConditionOptions = Object.entries(ApplyContextTypes).map(([key, label]) => ({ label, value: key }));

export default function SettingsPage() {
  const { settings, updateSettings, showToast } = useAppStore();
  const { settings: userSettings, updateSettings: updateUserAppSettings } = useSettings();
  // const fileInputRef = useRef<HTMLInputElement>(null); // 削除
  const router = useRouter(); // useRouter を取得

  // PDF Export 関連のState
  const [pdfPeriod, setPdfPeriod] = useState<string>("all_time");
  const [pdfSelectedProblems, setPdfSelectedProblems] = useState<string[]>([]);
  const [pdfSelectedValues, setPdfSelectedValues] = useState<string[]>([]);
  const [pdfSelectedStatuses, setPdfSelectedStatuses] = useState<string[]>([]);
  const [pdfSelectedApplies, setPdfSelectedApplies] = useState<string[]>([]);

  if (!settings || !userSettings) return null; // 設定がロードされるまで何も表示しない

  // handleExport, handleImportClick, handleFileChange 関数は削除

  const handleResetAll = async () => {
    if (!window.confirm("本当にすべての気づきを削除しますか？元に戻せません。")) {
      return;
    }
    const confirmationText = window.prompt("最終確認のため「RESET」と入力してください。");
    if (confirmationText !== "RESET") {
      showToast("リセットをキャンセルしました。");
      return;
    }

    try {
      await db.clearAllData();
      showToast("リセットしました");
      router.push("/home"); // Homeへ遷移
    } catch (error) {
      console.error("Failed to reset all data:", error);
      showToast("リセットに失敗しました。");
    }
  };


  const generatePdfContent = async () => {
    let targetIdeas: Idea[] = [];
    const allIdeas = await db.ideas.orderBy("createdAt").reverse().toArray();
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
      targetIdeas = targetIdeas.filter(idea => idea.problemCategory !== null && pdfSelectedProblems.includes(idea.problemCategory));
    }
    if (pdfSelectedValues.length > 0) {
      targetIdeas = targetIdeas.filter(idea => idea.valueCategory !== null && pdfSelectedValues.includes(idea.valueCategory));
    }
    if (pdfSelectedStatuses.length > 0) {
      targetIdeas = targetIdeas.filter(idea => {
        if (pdfSelectedStatuses.includes("FLASH") && !idea.isCultivated) return true;
        if (pdfSelectedStatuses.includes("FOSTERED") && idea.isCultivated) return true;
        return false;
      });
    }
    // applyContextType は単一の ApplyContextType | null であり、配列ではないため、ここを修正する必要がある
    // しかし、この機能はPDF出力なので、現在のデータ構造に合わせておくのが安全。
    // 育成フォームで applySceneXType が配列になったので、PDF出力のフィルタリングもそれに合わせる必要がある。
    // ただし、現在の pdfSelectedApplies は単一選択を想定しているので、設計見直しが必要。
    // 今回のタスク範囲外なので、既存のコードに合わせておく。
    if (pdfSelectedApplies.length > 0) {
      targetIdeas = targetIdeas.filter(idea => idea.cultivation?.applyScene1Type && idea.cultivation.applyScene1Type.some(type => pdfSelectedApplies.includes(type)));
    }


    if (targetIdeas.length === 0) {
      alert("選択された条件に合うIDEAがありません。");
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
              .favorite-badge { background: #007aff; color: white; }
          </style>
      </head>
      <body>
          <h1>ONEIDEA Export (${format(now, 'yyyy年MM月dd日', { locale: ja })})</h1>
    `;

    targetIdeas.forEach(idea => {
      const isFavorite = idea.isFavorite; // isFavoriteを使用
      htmlContent += `
        <div class="idea-card">
            <div class="idea-header">
                <div class="idea-date">${format(new Date(idea.createdAt), 'yyyy/MM/dd (eee)', { locale: ja })}</div>
                ${isFavorite ? '<div class="badge favorite-badge">お気に入り</div>' : ''}
            </div>
            <div class="idea-text">${idea.text}</div>
            <div class="idea-badges">
                ${idea.problemCategory ? `<span class="badge">${ProblemCategories[idea.problemCategory]}</span>` : ''}
                ${idea.valueCategory ? `<span class="badge">${ValueCategories[idea.valueCategory]}</span>` : ''}
            </div>
            ${(idea.deepProblemDetail || idea.deepSolution || idea.deepValueDetail || idea.cultivation?.applyScene1Note) ? `
              <div class="deep-dive">
                  ${idea.deepProblemDetail ? `<p><span class="deep-dive-label">課題の具体:</span> ${idea.deepProblemDetail}</p>` : ''}
                  ${idea.deepSolution ? `<p><span class="deep-dive-label">解決IDEA:</span> ${idea.deepSolution}</p>` : ''}
                  ${idea.deepValueDetail ? `<p><span class="deep-dive-label">価値の具体:</span> ${idea.deepValueDetail}</p>` : ''}
                  ${idea.cultivation?.applyScene1Type?.length ? `<p><span class="deep-dive-label">応用先:</span> ${idea.cultivation.applyScene1Type.map(type => ApplyContextTypes[type]).join(', ')}</p>` : ''}
                  ${idea.cultivation?.applyScene1Note ? `<p><span class="deep-dive-label">応用先メモ:</span> ${idea.cultivation.applyScene1Note}</p>` : ''}
              </div>
            ` : ''}
        </div>
      `;
    });

    htmlContent += `</body></html>`;

    try {
      // 新しいウィンドウでHTMLを開き、印刷ダイアログを表示
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        // ロードイベントリスナーを設定
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
          // showToast("PDFの生成準備ができました。印刷ダイアログから保存してください。"); // toastは一度のみでよい
          // setTimeout(() => printWindow.close(), 1000); // 印刷ダイアログが表示されたら閉じる
        };
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        showToast("PDFの生成準備ができました。印刷ダイアログから保存してください。");
      } else {
        alert("ポップアップがブロックされました。PDF生成のためには許可してください。");
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      showToast("PDFの生成中にエラーが発生しました。ブラウザのポップアップ設定を確認してください。");
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
            <label className="mb-2 block text-sm font-medium">表示</label>
            <Tabs value={userSettings.cardDensity} onValueChange={(val) => updateUserAppSettings({ cardDensity: val as CardDensity })}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="compact">コンパクト</TabsTrigger>
                <TabsTrigger value="standard">スタンダード</TabsTrigger>
                <TabsTrigger value="spacious">スペーシャス</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">フォント</label>
            <Tabs value={userSettings.fontMode} onValueChange={(val) => updateUserAppSettings({ fontMode: val as FontMode })}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="rounded">丸ゴ</TabsTrigger>
                <TabsTrigger value="gothic">角ゴ</TabsTrigger>
                <TabsTrigger value="mincho">明朝</TabsTrigger>
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="home">ホームへ戻る</TabsTrigger>
                <TabsTrigger value="continue">連続入力</TabsTrigger>
                <TabsTrigger value="detail">詳細へ移動</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

        </CardContent>
      </Card>
      

      {/* データ管理 */}
      <Card>
        <CardHeader><CardTitle>データ管理</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* PDFで書き出し */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold">PDFで書き出し</h3>
            <p className="text-sm text-muted-foreground">
              選択した条件のIDEAをPDFとして保存できます。（ブラウザの印刷機能を利用）
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
          
          {/* 下書き箱への導線 */}
          <div className="space-y-2 pt-6">
            <h3 className="text-base font-semibold">下書き箱</h3>
            <p className="text-sm text-muted-foreground">
              一時保存された気づきを確認・編集できます。
            </p>
            <Link href="/drafts" className="block">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                下書き一覧へ
              </Button>
            </Link>
          </div>



          <div className="space-y-2 pt-6"> {/* リセットボタンセクション */}
            <h3 className="text-base font-semibold text-black dark:text-white">
              <AlertCircle className="inline-block h-4 w-4 mr-1 mb-0.5 text-black dark:text-white" />
              全データのリセット
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-bold">すべての気づきと設定を削除します。</span> この操作は元に戻せません。
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground p-2 rounded-md">
                <AlertCircle className="inline-block h-3 w-3 mr-1 text-black dark:text-white" />
                リセット前に<span className="font-bold">大切なデータのエクスポートを強く推奨します。</span>
              </p>
              <Button onClick={handleResetAll} className="w-full bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                リセット
              </Button>
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