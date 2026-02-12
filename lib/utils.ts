import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { enUS } from 'date-fns/locale'; // ロケールが必要

import { type Idea, WeekStartsOn } from './types'; // WeekStartsOnをインポート

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// weekStartsOnを引数として受け取るように変更
export function getThisWeekRange(date: Date = new Date(), weekStartsOn: WeekStartsOn = 1): { start: Date, end: Date } {
  const start = startOfWeek(date, { weekStartsOn, locale: enUS });
  const end = endOfWeek(date, { weekStartsOn, locale: enUS });
  return { start, end };
}

export function getThisMonthRange(date: Date = new Date()): { start: Date, end: Date } {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return { start, end };
}

// Check if an idea has any cultivation input (items 1-6)
export function hasAnyCultivationInput(idea: Idea): boolean {
  // Check text fields (items 1, 2, 3)
  if (
    (idea.deepProblemDetail && idea.deepProblemDetail.trim().length > 0) ||
    (idea.deepSolution && idea.deepSolution.trim().length > 0) ||
    (idea.deepValueDetail && idea.deepValueDetail.trim().length > 0)
  ) {
    return true;
  }

  // Check new applyScene fields (items 4, 5, 6)
  for (let i = 1; i <= 3; i++) {
    const applySceneType = idea.cultivation?.[`applyScene${i}Type` as keyof Cultivation];
    const applySceneNote = idea.cultivation?.[`applyScene${i}Note` as keyof Cultivation];
    if (applySceneType || (applySceneNote && (applySceneNote as string).trim().length > 0)) {
      return true;
    }
  }

  return false;
}

export function getCultivationProgress(idea: Idea): { filledCount: number; totalCount: number; percentage: number } {
  let filledCount = 0;
  const totalCount = 6; // Items 1-6 (3 deep fields + 3 applyScene sets)

  // Item 1: deepProblemDetail
  if (idea.deepProblemDetail && idea.deepProblemDetail.trim().length > 0) {
    filledCount++;
  }
  // Item 2: deepSolution
  if (idea.deepSolution && idea.deepSolution.trim().length > 0) {
    filledCount++;
  }
  // Item 3: deepValueDetail
  if (idea.deepValueDetail && idea.deepValueDetail.trim().length > 0) {
    filledCount++;
  }

  // Items 4, 5, 6: applySceneXType OR applySceneXNote
  for (let i = 1; i <= 3; i++) {
    const applySceneType = idea.cultivation?.[`applyScene${i}Type` as keyof Cultivation];
    const applySceneNote = idea.cultivation?.[`applyScene${i}Note` as keyof Cultivation];
    if (applySceneType || (applySceneNote && (applySceneNote as string).trim().length > 0)) {
      filledCount++;
    }
  }

  const percentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  return { filledCount, totalCount, percentage };
}

/**
 * 画像をリサイズ・圧縮し、DataURLとして返す。
 * @param imageDataUrl 元画像のDataURL
 * @param maxWidth 最大幅（px）。これより大きい場合はリサイズされる。
 * @param quality JPEG/WebPの圧縮品質（0.0〜1.0）。
 * @returns 圧縮・リサイズされた画像のDataURL
 */
export async function compressImage(
  imageDataUrl: string,
  maxWidth: number = 1280,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Safari PWAのためにwebpの代わりにjpegを使用
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } else {
        resolve(imageDataUrl); // Fallback if canvas context not available
      }
    };
    img.onerror = () => resolve(imageDataUrl); // Fallback on error
  });
}