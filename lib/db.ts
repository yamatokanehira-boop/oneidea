import Dexie, { type Table } from 'dexie';
import { type Idea, type WeeklyBest, type AppSettings } from './types';

export class OneIdeaDB extends Dexie {
  ideas!: Table<Idea, string>;
  weeklyBests!: Table<WeeklyBest, string>;
  settings!: Table<AppSettings, string>; // 新規追加

  constructor() {
    super('OneIdeaDatabase');
    this.version(1).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, applyContextType', // 'text' を追加
      weeklyBests: 'weekId, bestIdeaId, createdAt',
    });
    this.version(2).stores({ // version 2でsettingsテーブルのスキーマを定義
      ideas: 'id, text, createdAt, problemCategory, valueCategory, applyContextType',
      weeklyBests: 'weekId, bestIdeaId, createdAt',
      settings: 'id', // settingsテーブルのスキーマ定義
    }).upgrade(async tx => {
      // Version 1からVersion 2へのアップグレード処理
      // 新しい設定テーブルに初期値を挿入
      await tx.table('settings').add({
        id: 'appSettings',
        weekStartsOn: 1, // Default Monday
        reviewDay: 0, // Default Sunday
        reviewTime: '20:00',
        theme: 'system',
        fontSize: 'md',
        afterNewIdeaBehavior: 'home',
        hasShownSplash: false, // スプラッシュはlocalStorageからDexieへ移行
      });
    });
    this.version(3).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, applyContextType, detailText', // Add detailText
      weeklyBests: 'weekId, bestIdeaId, createdAt',
      settings: 'id',
    });
  }
}

export const db = new OneIdeaDB();
