import type { 
  ProblemCategory, 
  ValueCategory, 
  ApplyContextType 
} from '@/consts';

export interface Idea {
  id: string;
  text: string;
  createdAt: string; // ISO string
  problemCategory: ProblemCategory;
  valueCategory: ValueCategory;
  photoUri?: string;
  locationText?: string;
  deepProblemDetail?: string;
  deepSolution?: string;
  deepValueDetail?: string;
  applyContextType?: ApplyContextType;
  applyContextNote?: string;
  detailText?: string; // 新規追加: アイディアの詳細テキスト
}

export interface WeeklyBest {
  weekId: string; // YYYY-MM-DD format (Monday of the week)
  bestIdeaId: string;
  createdAt: string; // ISO string
}

export type IdeaStatus = 'FLASH' | 'FOSTERED' | 'BEST';

// 新規追加
export type WeekStartsOn = 0 | 1; // 0 for Sunday, 1 for Monday
export type AppTheme = 'system' | 'light' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg'; // Small, Medium, Large
export type AfterNewIdeaBehavior = 'home' | 'continue';

export interface AppSettings {
  id: string; // Always 'appSettings' for single entry
  weekStartsOn: WeekStartsOn;
  reviewDay: number; // 0-6 (Sunday-Saturday)
  reviewTime: string; // HH:MM format (e.g., "20:00")
  theme: AppTheme;
  fontSize: FontSize;
  afterNewIdeaBehavior: AfterNewIdeaBehavior;
  hasShownSplash: boolean;
}
