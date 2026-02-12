"use client";

import { useState, useRef, useEffect, useCallback } from "react"; // Add useRef, useEffect, useCallback
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ProblemCategories, ValueCategories, SourceTypes } from "@/consts";
import type { ProblemCategory, ValueCategory, SourceType } from "@/consts";
import type { SourceDetail } from "@/lib/types";
import { useAppStore } from "@/lib/store"; // useAppStoreをインポート
import { CameraIcon, Trash2 } from "lucide-react"; // Import CameraIcon, Trash2
import { compressImage } from "@/lib/utils"; // Import compressImage


export default function NewIdeaPage() {
  const router = useRouter();
  const { showToast, settings, tempCapturedImage, setTempCapturedImage } = useAppStore(); // settingsとtempCapturedImage, setTempCapturedImageを取得
  const [text, setText] = useState("");
  const [detailText, setDetailText] = useState("");
  const [problem, setProblem] = useState<ProblemCategory | null>(null);
  const [value, setValue] = useState<ValueCategory | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null); // State for image data URL
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const searchParams = new URLSearchParams(window.location.search); // Get search params
    const dateParam = searchParams.get('date'); // Get date from URL param
    return dateParam ? new Date(dateParam) : new Date();
  }); // State for selected date
  const [sourceType, setSourceType] = useState<SourceType>('self');
  const [sourceDetail, setSourceDetail] = useState<SourceDetail>({});

  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input for manual photo selection

  // Load captured image from Zustand if available
  useEffect(() => {
    if (tempCapturedImage) {
      setPhotoDataUrl(tempCapturedImage);
      setTempCapturedImage(null); // Clear temporary state
    }
  }, [tempCapturedImage, setTempCapturedImage]);

  if (!settings) return null;

  // Handle photo file selection (for manual addition)
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
      fileInputRef.current.value = ''; // Reset file input to allow re-selecting same file
    }
  }, []);

  // Handle removing photo
  const handleRemovePhoto = useCallback(() => {
    setPhotoDataUrl(null);
  }, []);

  const handleSourceDetailChange = (field: keyof SourceDetail, value: string) => {
    setSourceDetail(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !problem || !value) {
      alert("すべての項目を入力してください。");
      return;
    }
    
    // Source validation
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
      };
      await db.ideas.add(newIdea);
      showToast("気づきを保存しました");

      if (settings.afterNewIdeaBehavior === 'home') {
        router.push("/home");
      } else {
        // Reset form
        setText("");
        setDetailText("");
        setProblem(null);
        setValue(null);
        setPhotoDataUrl(null);
        setSelectedDate(new Date());
        setSourceType('self');
        setSourceDetail({});
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
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full"
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
                setSourceDetail({}); // Reset details on change
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

      <Button type="submit" className="w-full" disabled={!text || !problem || !value}>
        気づきを保存
      </Button>
    </form>
  );
}
