"use client";

import { useEffect, useState } from "react";
import { type Idea, type ProblemCategory, type ValueCategory, type SourceType, type SourceDetail } from "@/lib/types";
import { ProblemCategories, ValueCategories, SourceTypes, ApplyContextTypes } from "@/consts"; // ApplyContextTypesも必要になるかも
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XCircle, Save } from "lucide-react"; // アイコンを追加

interface IdeaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea;
  onSave: (updatedIdea: Partial<Idea>) => Promise<void>;
}

export function IdeaEditModal({ isOpen, onClose, idea, onSave }: IdeaEditModalProps) {
  const [editedText, setEditedText] = useState(idea.text);
  const [editedDetailText, setEditedDetailText] = useState(idea.detailText || "");
  const [editedProblemCategory, setEditedProblemCategory] = useState<ProblemCategory>(idea.problemCategory);
  const [editedValueCategory, setEditedValueCategory] = useState<ValueCategory>(idea.valueCategory);
  const [editedSourceType, setEditedSourceType] = useState<SourceType>(idea.sourceType);
  const [editedSourceDetail, setEditedSourceDetail] = useState<SourceDetail>(idea.sourceDetail || {});

  // モーダルが開くたびにstateを初期化
  useEffect(() => {
    if (isOpen) {
      setEditedText(idea.text);
      setEditedDetailText(idea.detailText || "");
      setEditedProblemCategory(idea.problemCategory);
      setEditedValueCategory(idea.valueCategory);
      setEditedSourceType(idea.sourceType);
      setEditedSourceDetail(idea.sourceDetail || {});
    }
  }, [isOpen, idea]);

  if (!isOpen) return null;

  const handleSourceDetailChange = (field: keyof SourceDetail, value: string) => {
    setEditedSourceDetail(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    const updatedIdea: Partial<Idea> = {
      text: editedText,
      detailText: editedDetailText,
      problemCategory: editedProblemCategory,
      valueCategory: editedValueCategory,
      sourceType: editedSourceType,
      sourceDetail: editedSourceDetail,
    };
    await onSave(updatedIdea);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 py-4">
          <CardTitle className="text-xl">気づきを編集</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XCircle className="h-6 w-6" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="editedText" className="text-sm font-medium">1行メモ</label>
            <Input
              id="editedText"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="気づきを1行で記録..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="editedDetailText" className="text-sm font-medium">詳細 (任意)</label>
            <Textarea
              id="editedDetailText"
              value={editedDetailText}
              onChange={(e) => setEditedDetailText(e.target.value)}
              placeholder="気づいた背景、具体例、なぜ良いと思ったか、など"
              rows={4}
            />
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">媒体 (Source)</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SourceTypes).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={editedSourceType === key ? "default" : "outline"}
                  onClick={() => {
                    setEditedSourceType(key as SourceType);
                    setEditedSourceDetail({}); // Reset details on change
                  }}
                  className="cursor-pointer"
                >
                  {label}
                </Badge>
              ))}
            </div>
            <div className="space-y-2 mt-2">
              {editedSourceType === 'book' && (
                <>
                  <Input placeholder="書名（必須）" value={editedSourceDetail.title || ''} onChange={e => handleSourceDetailChange('title', e.target.value)} />
                  <Input placeholder="著者" value={editedSourceDetail.author || ''} onChange={e => handleSourceDetailChange('author', e.target.value)} />
                </>
              )}
              {editedSourceType === 'youtube' && (
                <>
                  <Input placeholder="URL（必須）" value={editedSourceDetail.url || ''} onChange={e => handleSourceDetailChange('url', e.target.value)} />
                  <Input placeholder="タイトル" value={editedSourceDetail.title || ''} onChange={e => handleSourceDetailChange('title', e.target.value)} />
                </>
              )}
              {editedSourceType === 'person' && (
                <>
                  <Input placeholder="名前（必須）" value={editedSourceDetail.person || ''} onChange={e => handleSourceDetailChange('person', e.target.value)} />
                  <Input placeholder="肩書き・関係など" value={editedSourceDetail.note || ''} onChange={e => handleSourceDetailChange('note', e.target.value)} />
                </>
              )}
              {editedSourceType === 'other' && (
                <Input placeholder="詳細（必須）" value={editedSourceDetail.note || ''} onChange={e => handleSourceDetailChange('note', e.target.value)} />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold">課題 (Problem)</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ProblemCategories).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={editedProblemCategory === key ? "default" : "outline"}
                  onClick={() => setEditedProblemCategory(key as ProblemCategory)}
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
                  variant={editedValueCategory === key ? "default" : "outline"}
                  onClick={() => setEditedValueCategory(key as ValueCategory)}
                  className="cursor-pointer"
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSaveClick} className="flex items-center gap-1">
              <Save className="h-4 w-4" />
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
