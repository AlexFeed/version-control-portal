export const STORAGE_KEY = 'vcp-dark-mode';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function readStoredDarkMode(storage: StorageLike = window.localStorage): boolean {
  return storage.getItem(STORAGE_KEY) === 'true';
}

export function writeStoredDarkMode(value: boolean, storage: StorageLike = window.localStorage): void {
  storage.setItem(STORAGE_KEY, String(value));
}
