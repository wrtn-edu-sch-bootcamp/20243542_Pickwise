import type { UserProfile, HistoryEntry, DecisionRequest } from './types';

const KEYS = {
  USER_PROFILE: 'decide_user_profile',
  HISTORY: 'decide_history',
  PENDING: 'decide_pending',
} as const;

const HISTORY_DAYS = 7;

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEYS.USER_PROFILE);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function savePendingDecision(data: DecisionRequest): void {
  localStorage.setItem(KEYS.PENDING, JSON.stringify(data));
}

export function loadPendingDecision(): DecisionRequest | null {
  try {
    const raw = localStorage.getItem(KEYS.PENDING);
    return raw ? (JSON.parse(raw) as DecisionRequest) : null;
  } catch {
    return null;
  }
}

export function clearPendingDecision(): void {
  localStorage.removeItem(KEYS.PENDING);
}

export function saveToHistory(entry: HistoryEntry): void {
  const history = loadHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);

  const filtered = history.filter(
    (h) => new Date(h.createdAt) > cutoff
  );

  filtered.unshift(entry);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered));
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const history = JSON.parse(raw) as HistoryEntry[];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - HISTORY_DAYS);
    return history.filter((h) => new Date(h.createdAt) > cutoff);
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(KEYS.HISTORY);
}

/** rating, ratingNote 등 특정 필드만 업데이트 */
export function updateHistoryEntry(id: string, updates: Partial<HistoryEntry>): void {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return;
    const history = JSON.parse(raw) as HistoryEntry[];
    const idx = history.findIndex((h) => h.id === id);
    if (idx !== -1) {
      history[idx] = { ...history[idx], ...updates };
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
    }
  } catch {
    // ignore
  }
}
