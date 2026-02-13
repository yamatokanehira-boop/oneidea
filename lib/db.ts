import Dexie, { type Table } from 'dexie';
import { type Idea, type AppSettings, type Draft } from './types';
import { type ApplyContextType } from '@/consts';

export class OneIdeaDB extends Dexie {
  ideas!: Table<Idea, string>;
  settings!: Table<AppSettings, string>; // 新規追加
  drafts!: Table<Draft, string>;

  constructor() {
    super('OneIdeaDatabase');
    this.version(1).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, applyContextType', // 'text' を追加
    });
    this.version(2).stores({ // version 2でsettingsテーブルのスキーマを定義
      ideas: 'id, text, createdAt, problemCategory, valueCategory, applyContextType',
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
      settings: 'id',
    });
    this.version(4).stores({ // New version 4
      ideas: 'id, text, createdAt, problemCategory, valueCategory, applyContextType, detailText, photo', // Add photo
      settings: 'id',
    });
    this.version(5).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, applyContextType, isFavorite, sourceType, isCultivated',
      weeklyBests: null,
      settings: 'id',
    }).upgrade(async tx => {
      await tx.table('ideas').toCollection().modify(idea => {
        idea.isFavorite = false;
        idea.sourceType = 'self';
        idea.sourceDetail = null;
        idea.isCultivated = !!(idea.deepProblemDetail || idea.deepSolution || idea.deepValueDetail);
        idea.cultivation = {};
      });
    });
    // New version 6 for cultivation fields
    this.version(6).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, applyContextType, isFavorite, sourceType, isCultivated',
      weeklyBests: null,
      settings: 'id',
    }).upgrade(async tx => {
      await tx.table('ideas').toCollection().modify(idea => {
        if (!idea.cultivation) {
          idea.cultivation = {};
        }
        if (idea.cultivation.cultivateApplyTargets === undefined) {
          idea.cultivation.cultivateApplyTargets = { work: false, life: false, hobby: false };
        }
        if (idea.cultivation.cultivateConcreteExamples === undefined) {
          idea.cultivation.cultivateConcreteExamples = '';
        }
      });
    });
    // New version 7 for applySceneXType/Note fields and migration
    this.version(7).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, isFavorite, sourceType, isCultivated', // Removed applyContextType
      weeklyBests: null,
      settings: 'id',
    }).upgrade(async tx => {
      await tx.table('ideas').toCollection().modify(idea => {
        if (!idea.cultivation) {
          idea.cultivation = {};
        }

        // Migrate applyContextType and applyContextNote to applyScene1
        // applyScene1Type を配列で扱うように変更
        idea.cultivation.applyScene1Type = idea.applyContextType ? [idea.applyContextType as ApplyContextType] : null;
        if (idea.applyContextNote) {
          idea.cultivation.applyScene1Note = idea.applyContextNote;
        }

        // Migrate cultivateApplyTargets and cultivateConcreteExamples to applyScene2
        // applyScene2Type も配列で扱うように変更
        if (idea.cultivation.cultivateApplyTargets) {
          const targets = idea.cultivation.cultivateApplyTargets;
          const selected: ApplyContextType[] = [];
          if (targets.work) {
            selected.push('WORK');
          }
          if (targets.life) {
            selected.push('LIFE');
          }
          if (targets.hobby) {
            selected.push('HOBBY');
          }
          idea.cultivation.applyScene2Type = selected.length > 0 ? selected : null;
        } else {
          idea.cultivation.applyScene2Type = null;
        }
        if (idea.cultivation.cultivateConcreteExamples) {
          idea.cultivation.applyScene2Note = idea.cultivation.cultivateConcreteExamples;
        }

        // Initialize applyScene3
        idea.cultivation.applyScene3Type = null;
        idea.cultivation.applyScene3Note = null;

        // Clean up old properties
        delete idea.applyContextType;
        if (idea.cultivation) {
          delete idea.cultivation.cultivateApplyTargets;
          delete idea.cultivation.cultivateConcreteExamples;
        }
      });
    });
    // New version 8 for applySceneXType array migration
    this.version(8).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, isFavorite, sourceType, isCultivated',
      weeklyBests: null,
      settings: 'id',
    }).upgrade(async tx => {
      await tx.table('ideas').toCollection().modify(idea => {
        if (idea.cultivation) {
          // applyScene1Type のマイグレーション (念のため、string型が残っている場合に対応)
          if (typeof idea.cultivation.applyScene1Type === 'string') {
            idea.cultivation.applyScene1Type = [idea.cultivation.applyScene1Type];
          } else if (idea.cultivation.applyScene1Type === undefined) { // undefined の場合は null に初期化
             idea.cultivation.applyScene1Type = null;
          }

          // applyScene2Type のマイグレーション (念のため、string型が残っている場合に対応)
          if (typeof idea.cultivation.applyScene2Type === 'string') {
            idea.cultivation.applyScene2Type = [idea.cultivation.applyScene2Type];
          } else if (idea.cultivation.applyScene2Type === undefined) { // undefined の場合は null に初期化
            idea.cultivation.applyScene2Type = null;
          }

          // applyScene3Type のマイグレーション (念のため、string型が残っている場合に対応)
          if (typeof idea.cultivation.applyScene3Type === 'string') {
            idea.cultivation.applyScene3Type = [idea.cultivation.applyScene3Type];
          } else if (idea.cultivation.applyScene3Type === undefined) { // undefined の場合は null に初期化
            idea.cultivation.applyScene3Type = null;
          }
        }
      });
    });
    this.version(9).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, isFavorite, sourceType, isCultivated',
      settings: 'id',
      drafts: 'id, updatedAt',
    });
    this.version(10).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, isFavorite, sourceType, isCultivated, pinned', // Add pinned
      settings: 'id',
      drafts: 'id, updatedAt',
    }).upgrade(async tx => {
      await tx.table('ideas').toCollection().modify(idea => {
        idea.pinned = false;
      });
    });
    // New version 11 for tags
    this.version(11).stores({
      ideas: 'id, text, createdAt, problemCategory, valueCategory, isFavorite, sourceType, isCultivated, pinned, *tags', // Add tags
      settings: 'id',
      drafts: 'id, updatedAt',
    }).upgrade(async tx => {
      await tx.table('ideas').toCollection().modify(idea => {
        if (!idea.tags) {
          idea.tags = [];
        }
      });
    });
  }

  // --- Idea Methods ---
  async togglePinned(id: string): Promise<void> {
    const idea = await this.ideas.get(id);
    if (idea) {
      await this.ideas.update(id, { pinned: !idea.pinned });
    }
  }

  async setTags(id: string, tags: string[]): Promise<void> {
    await this.ideas.update(id, { tags });
  }
  
  // アイデアを削除するメソッド
  async deleteIdea(id: string): Promise<void> {
    await this.ideas.delete(id);
  }

  // --- Draft Methods ---
  async addDraft(text: string): Promise<string> {
    const now = Date.now();
    const newDraft: Draft = {
      id: crypto.randomUUID(),
      text,
      createdAt: now,
      updatedAt: now,
    };
    await this.drafts.add(newDraft);
    return newDraft.id;
  }

  async updateDraft(id: string, text: string): Promise<void> {
    await this.drafts.update(id, {
      text,
      updatedAt: Date.now(),
    });
  }

  async deleteDraft(id: string): Promise<void> {
    await this.drafts.delete(id);
  }

  async convertDraftToIdea(draftId: string): Promise<string> {
    const draft = await this.drafts.get(draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    const newIdea: Idea = {
      id: crypto.randomUUID(),
      text: draft.text,
      createdAt: new Date().toISOString(),
      problemCategory: 'EFFICIENCY', // Default
      valueCategory: 'FUNCTIONAL', // Default
      isFavorite: false,
      isCultivated: false,
      sourceType: 'self',
      sourceDetail: null,
      cultivation: {},
      detailText: '',
      photo: undefined,
      locationText: undefined,
      deepProblemDetail: undefined,
      deepSolution: undefined,
      deepValueDetail: undefined,
      pinned: false, // Default for new ideas
      tags: [],
    };
    
    await this.transaction('rw', this.drafts, this.ideas, async () => {
      await this.ideas.add(newIdea);
      await this.drafts.delete(draftId);
    });
    
    return newIdea.id;
  }

  // 全てのデータをリセットするメソッド
  async resetAll(): Promise<void> {
    await this.transaction('rw', this.ideas, this.settings, this.drafts, async () => {
      await this.ideas.clear();
      await this.settings.clear();
      await this.drafts.clear();
    });
  }
}


export const db = new OneIdeaDB();
