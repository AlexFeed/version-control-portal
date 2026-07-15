export interface PinnedTab {
  key: string; // route, e.g. "/projects/5"
  label: string;
  type: 'project' | 'user';
}

export const STORAGE_KEY = 'vcp-pinned-tabs';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function readStoredPinnedTabs(storage: StorageLike = window.localStorage): PinnedTab[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeStoredPinnedTabs(tabs: PinnedTab[], storage: StorageLike = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}

// Keys of "core" nav tabs (e.g. "/projects", "/users") the user has unpinned
// from the header. They stay listed (and re-pinnable) in the VCP dropdown.
export const HIDDEN_CORE_STORAGE_KEY = 'vcp-hidden-core-tabs';

export function readHiddenCoreTabs(storage: StorageLike = window.localStorage): string[] {
  try {
    const raw = storage.getItem(HIDDEN_CORE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeHiddenCoreTabs(keys: string[], storage: StorageLike = window.localStorage): void {
  storage.setItem(HIDDEN_CORE_STORAGE_KEY, JSON.stringify(keys));
}
