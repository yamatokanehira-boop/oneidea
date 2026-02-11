import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { enUS } from 'date-fns/locale'; // ロケールが必要

import { type Idea, type WeeklyBest, type IdeaStatus, WeekStartsOn } from './types'; // WeekStartsOnをインポート

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// weekStartsOnを引数として受け取るように変更
export function getWeekId(date: Date = new Date(), weekStartsOn: WeekStartsOn = 1): string {
  const monday = startOfWeek(date, { weekStartsOn, locale: enUS });
  return format(monday, 'yyyy-MM-dd');
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

export function isFostered(idea: { deepProblemDetail?: string; deepSolution?: string; deepValueDetail?: string; applyContextNote?: string; }): boolean {
    return !!(idea.deepProblemDetail || idea.deepSolution || idea.deepValueDetail || idea.applyContextNote);
}

export function getIdeaStatus(idea: Idea, weeklyBests: WeeklyBest[]): IdeaStatus {
  if (weeklyBests.some(best => best.bestIdeaId === idea.id)) {
    return 'BEST';
  }
  if (isFostered(idea)) {
    return 'FOSTERED';
  }
  return 'FLASH';
}
