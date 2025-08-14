'use client';

// localStorage操作の単一入口
// SSRでは一切アクセスしない。Client Component内のuseEffectでのみ使用

export type FavoriteItem = {
  toolSlug: string;
  addedAt: string; // ISO8601
};

export type HistoryItem = {
  id: string;
  toolSlug: string;
  inputs: Record<string, unknown>;
  output: Record<string, unknown>;
  createdAt: string; // ISO8601
};

export type MetaData = {
  version: number;
  migratedAt: string; // ISO8601
};

const STORAGE_KEYS = {
  favorites: 'mvp_favorites_v2',
  history: 'mvp_runs_v2',
  meta: 'mvp_meta_v2',
} as const;

const CURRENT_VERSION = 2;
const MAX_HISTORY_ITEMS = 50;

// ブラウザ環境チェック
const isClient = typeof window !== 'undefined';

// Safe localStorage access
const safeGetItem = (key: string): string | null => {
  if (!isClient) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  if (!isClient) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

// Migration logic
const migrateLegacyData = (): void => {
  const meta = getMeta();
  if (meta.version === CURRENT_VERSION) return;

  // Backup existing data
  const backup = {
    favorites: safeGetItem(STORAGE_KEYS.favorites),
    history: safeGetItem(STORAGE_KEYS.history),
    meta: safeGetItem(STORAGE_KEYS.meta),
  };

  const backupKey = `mvp_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;
  safeSetItem(backupKey, JSON.stringify(backup));

  // Reset to empty state
  safeSetItem(STORAGE_KEYS.favorites, JSON.stringify([]));
  safeSetItem(STORAGE_KEYS.history, JSON.stringify([]));
  setMeta({ version: CURRENT_VERSION, migratedAt: new Date().toISOString() });
};

// Meta operations
export const getMeta = (): MetaData => {
  const stored = safeGetItem(STORAGE_KEYS.meta);
  if (!stored) {
    return { version: 1, migratedAt: new Date().toISOString() };
  }
  try {
    return JSON.parse(stored);
  } catch {
    return { version: 1, migratedAt: new Date().toISOString() };
  }
};

export const setMeta = (meta: MetaData): void => {
  safeSetItem(STORAGE_KEYS.meta, JSON.stringify(meta));
};

// Favorites operations
export const getFavorites = (): FavoriteItem[] => {
  migrateLegacyData();
  const stored = safeGetItem(STORAGE_KEYS.favorites);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const addFavorite = (toolSlug: string): void => {
  const favorites = getFavorites();
  const exists = favorites.some(fav => fav.toolSlug === toolSlug);
  if (exists) return;

  const newFavorite: FavoriteItem = {
    toolSlug,
    addedAt: new Date().toISOString(),
  };

  const updated = [...favorites, newFavorite];
  safeSetItem(STORAGE_KEYS.favorites, JSON.stringify(updated));
};

export const removeFavorite = (toolSlug: string): void => {
  const favorites = getFavorites();
  const updated = favorites.filter(fav => fav.toolSlug !== toolSlug);
  safeSetItem(STORAGE_KEYS.favorites, JSON.stringify(updated));
};

export const isFavorite = (toolSlug: string): boolean => {
  const favorites = getFavorites();
  return favorites.some(fav => fav.toolSlug === toolSlug);
};

// History operations
export const getHistory = (): HistoryItem[] => {
  migrateLegacyData();
  const stored = safeGetItem(STORAGE_KEYS.history);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const addHistory = (item: Omit<HistoryItem, 'id' | 'createdAt'>): void => {
  const history = getHistory();
  
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  // Add to beginning and limit to MAX_HISTORY_ITEMS
  const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
  safeSetItem(STORAGE_KEYS.history, JSON.stringify(updated));
};

export const clearHistory = (): void => {
  safeSetItem(STORAGE_KEYS.history, JSON.stringify([]));
};

// Initialize on first load (client-side only)
export const initializeStore = (): void => {
  if (!isClient) return;
  migrateLegacyData();
};
