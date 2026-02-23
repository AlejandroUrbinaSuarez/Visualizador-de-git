import type { RepoState } from '../core/types';

const STORAGE_KEY = 'git-visual-simulator-state';
const DEBOUNCE_MS = 500;

export function loadState(): RepoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RepoState;
    if (!parsed.commits || !parsed.branches || !parsed.head) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createAutoSaver(getState: () => RepoState): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function save(): void {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getState()));
      } catch (e) {
        console.warn('Failed to save state:', e);
      }
    }, DEBOUNCE_MS);
  };
}

export function clearSavedState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
