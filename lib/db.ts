import Dexie, { type Table } from 'dexie';
import { type AppSettings, type Idea, type Draft } from './types';

// Default settings object, derived from the logic in store.ts
const initialSettings: AppSettings = {
  id: 'appSettings',
  weekStartsOn: 1,
  reviewDay: 0,
  reviewTime: '20:00',
  theme: 'system',
  fontSize: 'md',
  afterNewIdeaBehavior: 'home',
  hasShownSplash: true,
  cardDensity: 'standard',
  fontMode: 'gothic',
};

export class OneIdeaDexie extends Dexie {
  ideas!: Table<Idea, string>;
  settings!: Table<AppSettings, string>;
  drafts!: Table<Draft, string>;

  constructor() {
    super('oneideaDB');
    this.version(1).stores({
      ideas: 'id, createdAt, isFavorite, pinned', // *tagsを削除
      settings: 'id',
    });
    this.version(2).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory', // *tagsを削除
    });
    this.version(3).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType', // *tagsを削除
    }).upgrade(tx => {
      return tx.table('ideas').toCollection().modify(idea => {
        if (idea.sourceType === undefined) {
          idea.sourceType = 'self';
        }
        if (idea.sourceDetail === undefined) {
          idea.sourceDetail = null;
        }
      });
    });
    this.version(4).stores({
        ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType', // *tagsを削除
    }).upgrade(tx => {
        // Obsolete modification, but keep structure for history
    });
    this.version(5).stores({
        ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCatesgory, sourceType', // *tagsを削除
    }).upgrade(tx => {
        // Obsolete modification, but keep structure for history
    });
     this.version(6).stores({
        ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType', // *tagsを削除
    });
    this.version(7).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType', // *tagsを削除
    });
    this.version(8).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType', // *tagsを削除
    });
    this.version(9).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType', // *tagsを削除
    });
    this.version(10).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType', // *tagsを削除
    });
    this.version(11).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(12).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    }).upgrade(tx => {
      return tx.table('ideas').toCollection().modify(idea => {
        if(idea.cultivation === undefined) {
            idea.cultivation = {};
        }
      });
    });
    this.version(13).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    }).upgrade(tx => {
      return tx.table('ideas').toCollection().modify(idea => {
        if(idea.cultivation === undefined) {
            idea.cultivation = {};
        }
      });
    });
    this.version(14).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(15).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(16).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(17).stores({
        ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(18).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(19).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(20).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated, detailText', // *tagsを削除
    });
    this.version(21).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated, detailText', // *tagsを削除
    });
    this.version(22).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(23).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(24).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
    });
    this.version(25).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
      drafts: 'id, updatedAt',
    });
     this.version(26).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
      drafts: 'id, updatedAt',
    });
    this.version(27).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
      drafts: 'id, updatedAt',
    }).upgrade(tx => {
      // It's a good practice to handle data migration.
      // Here, we ensure old drafts (string-only) are converted to idea-like objects.
      return tx.table('drafts').toCollection().modify(draft => {
        if (typeof draft.text === 'string' && Object.keys(draft).length <= 4) {
          return {
            id: draft.id,
            text: draft.text,
            createdAt: new Date(draft.createdAt).toISOString(),
            updatedAt: draft.updatedAt,
            problemCategory: null,
            valueCategory: null,
            isFavorite: false,
            isCultivated: false,
            sourceType: 'self',
            sourceDetail: null,
            pinned: false,
            // tags: [], // tagsを削除
          };
        }
      });
    });
    this.version(28).stores({
      ideas: 'id, createdAt, isFavorite, pinned, problemCategory, valueCategory, sourceType, isCultivated', // *tagsを削除
      drafts: 'id, updatedAt',
    });

    this.on('populate', this.populate);
  }

  populate = async () => {
    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      await this.settings.add(initialSettings);
    }
  }

  // Draft methods
  async addDraft(draft: Draft) {
    const newDraft = {
      ...draft,
      updatedAt: Date.now(),
    };
    await this.drafts.put(newDraft); // Use put to handle both add and update
    return newDraft.id;
  }

  async deleteDraft(id: string) {
    await this.drafts.delete(id);
  }

  async convertDraftToIdea(draftId: string): Promise<string> {
    const draft = await this.drafts.get(draftId);
    if (!draft) {
      throw new Error("Draft not found");
    }

    // The draft is already a full Idea object, just ensure it's finalized
    const newIdea: Idea = {
      ...draft,
      createdAt: new Date().toISOString(), // Set final creation date
      updatedAt: undefined, // Remove draft-specific field
      // tags: [], // tagsを削除
    };
    
    await this.transaction('rw', this.drafts, this.ideas, async () => {
      await this.ideas.add(newIdea);
      await this.drafts.delete(draftId);
    });

    return newIdea.id;
  }

  async clearAllData() {
    await this.transaction('rw', this.ideas, this.settings, this.drafts, async () => {
      await this.ideas.clear();
      await this.settings.clear();
      await this.drafts.clear();
      await this.populate();
    });
  }

  async deleteIdea(id: string) {
    await this.ideas.delete(id);
  }

  // async setTags(id: string, tags: string[]): Promise<void> { // setTagsを削除
  //   await this.ideas.update(id, { tags });
  // }

  async togglePinned(id: string) {
    const idea = await this.ideas.get(id);
    if (idea) {
      await this.ideas.update(id, { pinned: !idea.pinned });
    }
  }
}

export const db = new OneIdeaDexie();