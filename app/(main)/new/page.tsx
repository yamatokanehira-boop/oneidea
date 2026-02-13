"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ProblemCategories, ValueCategories, SourceTypes } from "@/consts";
import type { ProblemCategory, ValueCategory, SourceType } from "@/consts";
import type { SourceDetail } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { CameraIcon, Trash2 } from "lucide-react";
import { compressImage } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
// import { TagInput } from "@/components/features/tag-input"; // TagInput import removed
// import { Card, CardContent } from "@/components/ui/card"; // Card, CardContent import removed

export default function NewIdeaPage() {
  const router = useRouter();
  const { showToast, settings, tempCapturedImage, setTempCapturedImage } = useAppStore();
  const [text, setText] = useState("");
  const [detailText, setDetailText] = useState("");
  const [problem, setProblem] = useState<ProblemCategory | null>(null);
  const [value, setValue] = useState<ValueCategory | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const dateParam = searchParams.get('date');
    return dateParam ? new Date(dateParam) : new Date();
  });
  const [sourceType, setSourceType] = useState<SourceType>('self');
  const [sourceDetail, setSourceDetail] = useState<SourceDetail>({});
  // const [tags, setTags] = useState<string[]>([]); // tags state removed

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPhotoDataUrl(null);
  }, []);

  const handleSourceDetailChange = (field: keyof SourceDetail, value: string) => {
    setSourceDetail(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    if (!text.trim()) {
      showToast("下書き内容を入力してください。");
      return;
    }
    try {
      await db.addDraft(text);
      showToast("下書きに保存しました");
      router.push("/drafts");
    } catch (error) {
      console.error("Failed to save draft:", error);
      alert("下書きの保存に失敗しました。");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !problem || !value) {
      alert("すべての項目を入力してください。");
      return;
    }
    
    switch (sourceType) {
      case 'book':
        if (!sourceDetail.title) { alert('書名を入力してください。'); return; }
        break;
      case 'youtube':
        if (!sourceDetail.url) { alert('YouTubeのURLを入力してください。'); return; }
        break;
      case 'person':
        if (!sourceDetail.person) { alert('名前を入力してください。'); return; }
        break;
      case 'other':
        if (!sourceDetail.note) { alert('詳細を入力してください。'); return; }
        break;
    }

    const resetForm = () => {
      setText("");
      setDetailText("");
      setProblem(null);
      setValue(null);
      setPhotoDataUrl(null);
      setSelectedDate(new Date());
      setSourceType('self');
      setSourceDetail({});
      // setTags([]); // setTags removed from resetForm
    };

    try {
      const newIdea = {
        id: crypto.randomUUID(),
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
        ...(photoDataUrl && { photo: photoDataUrl }),
        pinned: false,
        tags: [], // tags property always set to empty array
      };
      await db.ideas.add(newIdea);
      showToast("気づきを保存しました");

      switch (settings.afterNewIdeaBehavior) {
        case 'detail':
          router.push(`/idea/${newIdea.id}`);
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
      alert("保存に失敗しました。");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">見つけた気づき</h1>
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
          <div>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <CameraIcon className="mr-2 h-4 w-4" />
              写真を追加
            </Button>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
            />
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
              onClick={() => {
                setSourceType(key as SourceType);
                setSourceDetail({});
              }}
              className="cursor-pointer"
            >
              {label}
            </Badge>
          ))}
        </div>
        <div className="space-y-2 mt-2">
          {sourceType === 'book' && (
            <>
              <Input placeholder="書名（必須）" value={sourceDetail.title || ''} onChange={e => handleSourceDetailChange('title', e.target.value)} />
              <Input placeholder="著者" value={sourceDetail.author || ''} onChange={e => handleSourceDetailChange('author', e.target.value)} />
            </>
          )}
          {sourceType === 'youtube' && (
            <>
              <Input placeholder="URL（必須）" value={sourceDetail.url || ''} onChange={e => handleSourceDetailChange('url', e.target.value)} />
              <Input placeholder="タイトル" value={sourceDetail.title || ''} onChange={e => handleSourceDetailChange('title', e.target.value)} />
            </>
          )}
          {sourceType === 'person' && (
            <>
              <Input placeholder="名前（必須）" value={sourceDetail.person || ''} onChange={e => handleSourceDetailChange('person', e.target.value)} />
              <Input placeholder="肩書き・関係など" value={sourceDetail.note || ''} onChange={e => handleSourceDetailChange('note', e.target.value)} />
            </>
          )}
          {sourceType === 'other' && (
            <Input placeholder="詳細（必須）" value={sourceDetail.note || ''} onChange={e => handleSourceDetailChange('note', e.target.value)} />
          )}
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
        <Button type="submit" className="flex-1" disabled={!text || !problem || !value}>
          気づきを保存
        </Button>
      </div>
    </form>
  );
}