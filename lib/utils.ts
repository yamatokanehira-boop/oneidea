import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfWeek, endOfWeek } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getThisWeekRange(date: Date, weekStartsOn: 0 | 1) {
  const start = startOfWeek(date, { weekStartsOn });
  const end = endOfWeek(date, { weekStartsOn });
  return { start, end };
}

export function normalizeTag(tag: string): string | null {
  const normalized = tag.trim().toLowerCase().replace(/^#/, '');
  return normalized === '' ? null : normalized;
}

// Function to compress image (for photo feature)
export const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800; // 最大幅
      const MAX_HEIGHT = 800; // 最大高さ
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // 画質を0.7に設定してJPEGで圧縮
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = (error) => reject(error);
  });
};

import { Idea } from '@/lib/types'; // Idea型をインポート
import { ApplyContextType } from '@/consts';

export const hasAnyCultivationInput = (idea: Idea): boolean => {
  if (!idea.cultivation) {
    return false;
  }
  const c = idea.cultivation;
  return (
    !!c.memo ||
    !!c.nextAction ||
    !!c.hypothesis ||
    !!c.useCase ||
    (c.applyScene1Type && c.applyScene1Type.length > 0) ||
    !!c.applyScene1Note ||
    (c.applyScene2Type && c.applyScene2Type.length > 0) ||
    !!c.applyScene2Note ||
    (c.applyScene3Type && c.applyScene3Type.length > 0) ||
    !!c.applyScene3Note
  );
};

export const getCultivationProgress = (idea: Idea): { percentage: number; totalFields: number } => {
  if (!idea.cultivation) {
    return { percentage: 0, totalFields: 100 }; // totalFields は常に100%を表す
  }

  const cultivation = idea.cultivation;
  let currentProgress = 0;

  // ヘルパー関数
  const isFilled = (s?: string | null) => (s ?? "").trim().length > 0;
  const isAnyTypeSelected = (types?: ApplyContextType[] | null) => (types?.length ?? 0) > 0;

  // 1) 記入欄: deepProblemDetail (15%)
  if (isFilled(idea.deepProblemDetail)) {
    currentProgress += 15;
  }

  // 2) 記入欄: deepSolution (15%)
  if (isFilled(idea.deepSolution)) {
    currentProgress += 15;
  }

  // 3) 記入欄: deepValueDetail (15%)
  if (isFilled(idea.deepValueDetail)) {
    currentProgress += 15;
  }

  // 4) 記入欄: applyScene1Note (15%) + ボタン: applyScene1Type (3%)
  if (isFilled(cultivation.applyScene1Note)) {
    currentProgress += 15;
  }
  if (isAnyTypeSelected(cultivation.applyScene1Type)) {
    currentProgress += 3;
  }

  // 5) 記入欄: applyScene2Note (15%) + ボタン: applyScene2Type (3%)
  if (isFilled(cultivation.applyScene2Note)) {
    currentProgress += 15;
  }
  if (isAnyTypeSelected(cultivation.applyScene2Type)) {
    currentProgress += 3;
  }

  // 6) 記入欄: applyScene3Note (16%) + ボタン: applyScene3Type (3%)
  // ユーザーの指示により、applyScene3Noteが16%
  if (isFilled(cultivation.applyScene3Note)) {
    currentProgress += 16;
  }
  if (isAnyTypeSelected(cultivation.applyScene3Type)) {
    currentProgress += 3;
  }
  
  // Progress cannot exceed 100%
  const percentage = Math.min(currentProgress, 100);

  return { percentage, totalFields: 100 };
};

export const getNextAction = (idea: Idea): string => {
  const cultivation = idea.cultivation || {}; // cultivationが存在しない場合を考慮
  const isFilled = (s?: string | null) => (s ?? "").trim().length > 0;
  const isAnyTypeSelected = (types?: ApplyContextType[] | null) => (types?.length ?? 0) > 0;

  // 1) deepProblemDetail
  if (!isFilled(idea.deepProblemDetail)) {
    return "次：課題の具体 を1行書く（+15%）";
  }

  // 2) deepSolution
  if (!isFilled(idea.deepSolution)) {
    return "次：解決IDEA を1行書く（+15%）";
  }

  // 3) deepValueDetail
  if (!isFilled(idea.deepValueDetail)) {
    return "次：価値の具体 を1行書く（+15%）";
  }

  // 4) applyScene1Note / applyScene1Type
  if (!isFilled(cultivation.applyScene1Note)) {
    return "次：応用先01 のメモを1行書く（+15%）";
  }
  if (!isAnyTypeSelected(cultivation.applyScene1Type)) {
    return "次：応用先01 の用途ボタンを1つ選ぶ（+3%）";
  }

  // 5) applyScene2Note / applyScene2Type
  if (!isFilled(cultivation.applyScene2Note)) {
    return "次：応用先02 のメモを1行書く（+15%）";
  }
  if (!isAnyTypeSelected(cultivation.applyScene2Type)) {
    return "次：応用先02 の用途ボタンを1つ選ぶ（+3%）";
  }

  // 6) applyScene3Note / applyScene3Type
  if (!isFilled(cultivation.applyScene3Note)) {
    return "次：応用先03 のメモを1行書く（+16%）";
  }
  if (!isAnyTypeSelected(cultivation.applyScene3Type)) {
    return "次：応用先03 の用途ボタンを1つ選ぶ（+3%）";
  }

  return "育成完了！🎉";
};

