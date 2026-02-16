export const APP_NAME = "ONEIDEA";
export const APP_SUBCOPY = "One day, one idea.";

export const ProblemCategories = {
  EFFICIENCY: "効率（ムダ/手間）",
  CLARITY: "理解（迷い/分かりにくさ）",
  TRUST_RISK: "安心（不安/リスク）",
  EXPERIENCE: "体験（楽しくない/続かない）",
} as const;

export const ValueCategories = {
  FUNCTIONAL: "機能的価値",
  EMOTIONAL: "情緒的価値",
  ECONOMIC: "経済的価値",
  SOCIAL_ENVIRONMENTAL: "社会/環境価値",
} as const;

export const SourceTypes = {
  self: "自分",
  person: "人",
  book: "本",
  youtube: "YouTube",
  tv: "テレビ",
  web: "Web",
  other: "その他",
} as const;

export const ApplyContextTypes = {
  WORK: "仕事",
  LIFE: "生活",
  HOBBY: "趣味",
} as const;

export type ProblemCategory = keyof typeof ProblemCategories;
export type ValueCategory = keyof typeof ValueCategories;
export type SourceType = keyof typeof SourceTypes;
export type ApplyContextType = keyof typeof ApplyContextTypes;
