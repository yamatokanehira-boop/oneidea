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
    return { percentage: 0, totalFields: 0 };
  }

  const cultivation = idea.cultivation;
  let filledFields = 0;
  let totalFields = 0;

  // Memo
  totalFields++;
  if (!!cultivation.memo) filledFields++;

  // Next Action
  totalFields++;
  if (!!cultivation.nextAction) filledFields++;

  // Hypothesis
  totalFields++;
  if (!!cultivation.hypothesis) filledFields++;

  // Use Case
  totalFields++;
  if (!!cultivation.useCase) filledFields++;

  // Apply Scene 1
  totalFields++;
  if (cultivation.applyScene1Type && cultivation.applyScene1Type.length > 0) filledFields++;
  totalFields++;
  if (!!cultivation.applyScene1Note) filledFields++;

  // Apply Scene 2
  totalFields++;
  if (cultivation.applyScene2Type && cultivation.applyScene2Type.length > 0) filledFields++;
  totalFields++;
  if (!!cultivation.applyScene2Note) filledFields++;

  // Apply Scene 3
  totalFields++;
  if (cultivation.applyScene3Type && cultivation.applyScene3Type.length > 0) filledFields++;
  totalFields++;
  if (!!cultivation.applyScene3Note) filledFields++;

  const percentage = totalFields === 0 ? 0 : Math.round((filledFields / totalFields) * 100);

  return { percentage, totalFields };
};
