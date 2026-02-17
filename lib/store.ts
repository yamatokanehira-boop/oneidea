import { create } from 'zustand';
import { db } from './db';
import { AppSettings, AppTheme, FontSize, AfterNewIdeaBehavior, WeekStartsOn, SortOrder } from './types'; // SortOrderをインポート

interface ToastState {
  message: string;
  id: number;
}

interface AppState {
  isDbError: boolean;
  setDbError: (isError: boolean) => void;
  toast: ToastState | null;
  showToast: (message: string) => void;
  hideToast: () => void;
  settings: AppSettings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  tempCapturedImage: string | null;
  setTempCapturedImage: (imageData: string | null) => void;
  sortOrder: SortOrder; // 並び替え順序の状態を追加
  setSortOrder: (order: SortOrder) => void; // 並び替え順序を設定するアクションを追加
}

export const useAppStore = create<AppState>((set, get) => ({
  isDbError: false,
  setDbError: (isError) => set({ isDbError: isError }),
  toast: null,
  showToast: (message: string) => {
    const id = Date.now();
    set({ toast: { message, id } });
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : {}));
    }, 2500);
  },
  hideToast: () => set({ toast: null }),
  settings: null,
  tempCapturedImage: null,
  setTempCapturedImage: (imageData) => set({ tempCapturedImage: imageData }),
  sortOrder: 'newest', // sortOrderの初期値を設定
  setSortOrder: (order) => set({ sortOrder: order }), // setSortOrderの実装
  loadSettings: async () => {
    // DBがオープンするのを待つ
    await db.open(); // ★ここを追加/修正★
    console.log('db.settings:', db.settings); // デバッグ用ログ

    const appSettings = await db.settings.get('appSettings');
    console.log('Fetched appSettings from DB:', appSettings);
    if (appSettings) {
      set({ settings: appSettings });
      console.log('Settings set from DB:', appSettings);
    } else {
      // 設定がまだない場合はデフォルト値を挿入
      const defaultSettings: AppSettings = {
        id: 'appSettings',
        weekStartsOn: 1, // Default Monday
        reviewDay: 0, // Default Sunday (0-6)
        reviewTime: '20:00',
        theme: 'system',
        fontSize: 'md',
        afterNewIdeaBehavior: 'home',
        hasShownSplash: true,
        cardDensity: 'standard', // Added default
        fontMode: 'gothic',      // Added default
        homeDisplayMode: 'recent', // Added default
      };
      await db.settings.add(defaultSettings);
      set({ settings: defaultSettings });
      console.log('Default settings set:', defaultSettings);
    }
    // localStorageから移行するスプラッシュフラグの処理 (初回のみ)
    const localStorageSplashShown = localStorage.getItem('oneidea-splash-shown');
    if (localStorageSplashShown === 'true') {
        const currentSettings = get().settings;
        if (currentSettings && !currentSettings.hasShownSplash) {
            await get().updateSettings({ hasShownSplash: true });
            localStorage.removeItem('oneidea-splash-shown'); // 移行が完了したら削除
        }
    }
  },
  updateSettings: async (newSettings) => {
    const currentSettings = get().settings;
    if (!currentSettings) return;

    const updated = { ...currentSettings, ...newSettings };
    await db.settings.put(updated);
    set({ settings: updated });
  },
}));
