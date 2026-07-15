import { describe, it, expect } from 'vitest';
import { readStoredDarkMode, writeStoredDarkMode, type StorageLike } from './themeStorage';

function createFakeStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
  };
}

describe('themeStorage', () => {
  it('defaults to light mode when nothing stored', () => {
    const storage = createFakeStorage();
    expect(readStoredDarkMode(storage)).toBe(false);
  });

  it('reads back a stored dark mode value', () => {
    const storage = createFakeStorage();
    writeStoredDarkMode(true, storage);
    expect(readStoredDarkMode(storage)).toBe(true);
  });

  it('reads back light mode after toggling off', () => {
    const storage = createFakeStorage();
    writeStoredDarkMode(true, storage);
    writeStoredDarkMode(false, storage);
    expect(readStoredDarkMode(storage)).toBe(false);
  });
});
