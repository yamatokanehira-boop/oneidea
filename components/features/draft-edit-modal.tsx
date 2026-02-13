import { useState, useEffect } from "react";
import { type Draft } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface DraftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: Draft;
  onSave: (updatedText: string) => void;
}

export function DraftEditModal({
  isOpen,
  onClose,
  draft,
  onSave,
}: DraftEditModalProps) {
  const [editedText, setEditedText] = useState(draft.text);

  useEffect(() => {
    setEditedText(draft.text); // draftが変わったら、editedTextも更新
  }, [draft]);

  const handleSave = () => {
    if (editedText.trim()) {
      onSave(editedText);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>下書きを編集</AlertDialogTitle>
          <AlertDialogDescription>
            下書きの内容を編集してください。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            placeholder="下書き内容"
            rows={5}
            className="w-full"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={!editedText.trim()}>
            保存
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
