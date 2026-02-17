import type { 
  ProblemCategory, 
  ValueCategory, 
  ApplyContextType,
  SourceType // constsからインポート
} from '@/consts';

// lib/types.ts からのSourceType定義を削除
// export type SourceType = "self" | "book" | "youtube" | "person" | "other";

export type SourceDetail = {
  title?: string;
  author?: string;
  url?: string;
  person?: string;
  note?: string;
};

export type Cultivation = {
  memo?: string;
  nextAction?: string;
  hypothesis?: string;
  useCase?: string;
  applyScene1Type?: ApplyContextType[] | null;
  applyScene1Note?: string | null;
  applyScene2Type?: ApplyContextType[] | null;
  applyScene2Note?: string | null;
  applyScene3Type?: ApplyContextType[] | null;
  applyScene3Note?: string | null;
  [key: string]: any; // Add index signature
};

export interface Idea {
  id: string;
  text: string;
  createdAt: string; // ISO string
  problemCategory: ProblemCategory | null;
  valueCategory: ValueCategory | null;
  
  isFavorite: boolean;
  isCultivated: boolean;
  sourceType: SourceType; // constsからインポートしたSourceTypeを使用
  sourceDetail: SourceDetail | null;
  cultivation?: Cultivation;

  photo?: string;
  locationText?: string;
  deepProblemDetail?: string;
  deepSolution?: string;
  deepValueDetail?: string;
  detailText?: string;
  pinned: boolean;
  // tags: string[]; // tagsを削除
  updatedAt?: number; // Keep for drafts compatibility
}

export type IdeaStatus = 'FLASH' | 'FOSTERED' | 'BEST';

// 新規追加
export type WeekStartsOn = 0 | 1; // 0 for Sunday, 1 for Monday
export type AppTheme = 'system' | 'light' | 'dark';
export type FontSize = 'sm' | 'md' | 'lg'; // Small, Medium, Large
export type AfterNewIdeaBehavior = 'home' | 'continue' | 'detail';

export interface AppSettings {
  id: string; // Always 'appSettings' for single entry
  weekStartsOn: WeekStartsOn;
  reviewDay: number; // 0-6 (Sunday-Saturday)
  reviewTime: string; // HH:MM format (e.g., "20:00")
  theme: AppTheme;
  fontSize: FontSize;
  afterNewIdeaBehavior: AfterNewIdeaBehavior;
  hasShownSplash: boolean;
  cardDensity: CardDensity;
  fontMode: FontMode;
  homeDisplayMode: 'recent' | 'lastWeek' | 'random'; // 新しく追加
}

export type CardDensity = 'compact' | 'standard' | 'spacious';
export type FontMode = 'rounded' | 'gothic' | 'mincho';

// Draft type is now an alias for Idea, as drafts will store the full idea object.
export type Draft = Idea;

export type SortOrder = 'newest' | 'oldest' | 'progress_high' | 'progress_low';
