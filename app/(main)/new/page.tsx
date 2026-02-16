"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ProblemCategories, ValueCategories, SourceTypes } from "@/consts";
import type { ProblemCategory, ValueCategory, SourceType } from "@/consts";
import type { SourceDetail, Idea } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { CameraIcon, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/utils";

export default function NewIdeaPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewIdeaPageContent />
    </Suspense>
  );
}

function NewIdeaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, settings, tempCapturedImage, setTempCapturedImage } = useAppStore();
  
  const [draftId, setDraftId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [detailText, setDetailText] = useState("");
  const [problem, setProblem] = useState<ProblemCategory | null>(null);
  const [value, setValue] = useState<ValueCategory | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sourceType, setSourceType] = useState<SourceType>('self');
  const [sourceDetail, setSourceDetail] = useState<SourceDetail>({});

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = searchParams.get('draftId');
    if (id) {
      setDraftId(id);
      db.drafts.get(id).then(draft => {
        if (draft) {
          setText(draft.text || "");
          setDetailText(draft.detailText || "");
          setProblem(draft.problemCategory || null);
          setValue(draft.valueCategory || null);
          setPhotoDataUrl(draft.photo || null);
          setSourceType(draft.sourceType || 'self');
          setSourceDetail(draft.sourceDetail || {});
          // createdAtはISO文字列で保存されていると仮定
          if (draft.createdAt) {
            setSelectedDate(new Date(draft.createdAt));
          }
        }
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (tempCapturedImage) {
      setPhotoDataUrl(tempCapturedImage);
      setTempCapturedImage(null);
    }
  }, [tempCapturedImage, setTempCapturedImage]);

  if (!settings) return null;

  const handlePhotoChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setPhotoDataUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (libraryInputRef.current) libraryInputRef.current.value = '';
  }, []);

  const handleRemovePhoto = useCallback(() => setPhotoDataUrl(null), []);

  const handleSourceDetailChange = (field: keyof SourceDetail, value: string) => {
    setSourceDetail(prev => ({ ...prev, [field]: value }));
  };
  
  const buildIdeaObject = (): Idea => {
    return {
      id: draftId || crypto.randomUUID(),
      text,
      detailText,
      problemCategory: problem,
      valueCategory: value,
      createdAt: selectedDate.toISOString(),
      isFavorite: false,
      isCultivated: false,
      sourceType: sourceType,
      sourceDetail: sourceDetail,
      cultivation: {},
      photo: photoDataUrl || undefined,
      pinned: false,
      // tags: [], // tagsを削除
    };
  };

  const handleSaveDraft = async () => {
    if (!text.trim()) {
      showToast("下書き内容を入力してください。");
      return;
    }
    try {
      const draftData = buildIdeaObject();
      await db.addDraft(draftData);
      showToast("下書きに保存しました");
      router.push("/drafts");
    } catch (error) {
      console.error("Failed to save draft:", error);
      showToast("下書きの保存に失敗しました。");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert("気づきを1行で記録してください。");
      return;
    }
    
    // Validation
    // 各sourceTypeに応じたvalidationをここに集約
    const validateSourceDetail = () => {
      switch (sourceType) {
        case 'self':
          // 場所の入力は必須としない
          break;
        case 'person':
          if (!sourceDetail.person) { alert('名前を入力してください。'); return false; }
          // 関係の入力は必須としない
          break;
        case 'book':
          if (!sourceDetail.title) { alert('書名を入力してください。'); return false; }
          // 著者の入力は必須としない
          break;
        case 'youtube':
          if (!sourceDetail.title) { alert('タイトルを入力してください。'); return false; }
          if (!sourceDetail.url) { alert('URLを入力してください。'); return false; }
          break;
        case 'tv':
          if (!sourceDetail.title) { alert('タイトルを入力してください。'); return false; }
          break;
        case 'web':
          if (!sourceDetail.title) { alert('タイトルを入力してください。'); return false; }
          if (!sourceDetail.url) { alert('URLを入力してください。'); return false; }
          break;
        case 'other':
          if (!sourceDetail.note) { alert('詳細を入力してください。'); return false; }
          break;
        default:
          break;
      }
      return true;
    };

    if (!validateSourceDetail()) {
      return;
    }

    try {
      const ideaData = buildIdeaObject();
      if (draftId) {
        // Overwrite existing draft before converting
        await db.addDraft(ideaData);
        await db.convertDraftToIdea(draftId);
      } else {
        await db.ideas.add(ideaData);
      }
      
      showToast("気づきを保存しました");

      const resetForm = () => {
        setDraftId(null);
        setText("");
        setDetailText("");
        setProblem(null);
        setValue(null);
        setPhotoDataUrl(null);
        setSelectedDate(new Date());
        setSourceType('self');
        setSourceDetail({});
      };

      switch (settings.afterNewIdeaBehavior) {
        case 'detail':
          router.push(`/idea/${ideaData.id}`);
          break;
        case 'home':
          router.push("/home");
          break;
        case 'continue':
          resetForm();
          break;
        default:
          router.push("/home");
          break;
      }
    } catch (error) {
      console.error("Failed to save idea:", error);
      showToast("保存に失敗しました。");
    }
  };

  // 媒体選択に応じて入力欄をレンダリングする部分
  const renderSourceDetailInputs = () => {
    switch (sourceType) {
      case 'self':
        // 場所
        return (
          <Input placeholder="場所" value={sourceDetail.note || ''} onChange={e => handleSourceDetailChange('note', e.target.value)} />
        );
      case 'person':
        // 名前、関係
        return (
          <>
            <Input placeholder="名前" value={sourceDetail.person || ''} onChange={e => handleSourceDetailChange('person', e.target.value)} />
            <Input placeholder="関係" value={sourceDetail.note || ''} onChange={e => handleSourceDetailChange('note', e.target.value)} />
          </>
        );
      case 'book':
        // 書名、著者
        return (
          <>
            <Input placeholder="書名" value={sourceDetail.title || ''} onChange={e => handleSourceDetailChange('title', e.target.value)} />
            <Input placeholder="著者" value={sourceDetail.author || ''} onChange={e => handleSourceDetailChange('author', e.target.value)} />
          </>
        );
      case 'youtube':
        // タイトル、URL
        return (
          <>
            <Input placeholder="タイトル" value={sourceDetail.title || ''} onChange={e => handleSourceDetailChange('title', e.target.value)} />
            <Input placeholder="URL" value={sourceDetail.url || ''} onChange={e => handleSourceDetailChange('url', e.target.value)} />
          </>
        );
      case 'tv':
        // タイトル
        return (
          <Input placeholder="タイトル" value={sourceDetail.title || ''} onChange={e => handleSourceDetailChange('title', e.target.value)} />
        );
      case 'web':
        // タイトル、URL
        return (
          <>
            <Input placeholder="タイトル" value={sourceDetail.title || ''} onChange={e => handleSourceDetailChange('title', e.target.value)} />
            <Input placeholder="URL" value={sourceDetail.url || ''} onChange={e => handleSourceDetailChange('url', e.target.value)} />
          </>
        );
      case 'other':
        // 詳細
        return (
          <Input placeholder="詳細" value={sourceDetail.note || ''} onChange={e => handleSourceDetailChange('note', e.target.value)} />
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{draftId ? "下書きを編集中" : "見つけた気づき"}</h1>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="気づきを1行で記録..."
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
        <h2 className="font-semibold">写真</h2>
        {photoDataUrl ? (
          <div className="relative w-32 h-32 overflow-hidden rounded-lg border">
            <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={handleRemovePhoto}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
              <CameraIcon className="mr-2 h-4 w-4" />
              写真を撮る
            </Button>
            <Button type="button" variant="outline" onClick={() => libraryInputRef.current?.click()}>
              画像を追加
            </Button>
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handlePhotoChange} className="hidden" />
            <input type="file" accept="image/*" ref={libraryInputRef} onChange={handlePhotoChange} className="hidden" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">媒体 (Source)</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SourceTypes).map(([key, label]) => (
            <Badge
              key={key}
              variant={sourceType === key ? "default" : "outline"}
              onClick={() => { setSourceType(key as SourceType); setSourceDetail({}); }}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          ))}
        </div>
        <div className="space-y-2 mt-2">
          {renderSourceDetailInputs()}
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

      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" className="flex-1" onClick={handleSaveDraft} disabled={!text}>
          下書きに保存
        </Button>
        <Button type="submit" className="flex-1" disabled={!text}>
          気づきを保存
        </Button>
      </div>
    </form>
  );
}