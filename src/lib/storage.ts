import type { UserProfile, UserProfileEntry, HistoryEntry, DecisionRequest } from './types';

const KEYS = {
  USER_PROFILE: 'decide_user_profile',       // legacy (단일 프로필)
  PROFILES: 'decide_profiles',               // 다중 프로필 배열
  ACTIVE_PROFILE_ID: 'decide_active_profile_id',
  HISTORY: 'decide_history',
  PENDING: 'decide_pending',
} as const;

// ── 레거시 단일 프로필 → 다중 프로필로 마이그레이션 ──
function migrateIfNeeded(): void {
  if (localStorage.getItem(KEYS.PROFILES)) return; // 이미 마이그레이션됨
  const legacy = localStorage.getItem(KEYS.USER_PROFILE);
  if (!legacy) return;
  try {
    const profile = JSON.parse(legacy) as UserProfile;
    const entry: UserProfileEntry = {
      id: 'profile-legacy',
      createdAt: new Date().toISOString(),
      profile,
    };
    localStorage.setItem(KEYS.PROFILES, JSON.stringify([entry]));
    localStorage.setItem(KEYS.ACTIVE_PROFILE_ID, entry.id);
  } catch { /* ignore */ }
}

// ── 다중 프로필 ──

export function loadProfiles(): UserProfileEntry[] {
  try {
    migrateIfNeeded();
    const raw = localStorage.getItem(KEYS.PROFILES);
    return raw ? (JSON.parse(raw) as UserProfileEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: UserProfileEntry[]): void {
  localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
}

export function addProfile(profile: UserProfile): UserProfileEntry {
  const profiles = loadProfiles();
  const entry: UserProfileEntry = {
    id: `profile-${Date.now()}`,
    createdAt: new Date().toISOString(),
    profile,
  };
  profiles.push(entry);
  saveProfiles(profiles);
  return entry;
}

export function updateProfile(id: string, profile: UserProfile): void {
  const profiles = loadProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profiles[idx] = { ...profiles[idx], profile };
    saveProfiles(profiles);
  }
}

export function deleteProfile(id: string): void {
  const profiles = loadProfiles().filter((p) => p.id !== id);
  saveProfiles(profiles);
  // 활성 프로필이 삭제되면 첫 번째로 교체
  if (getActiveProfileId() === id) {
    setActiveProfileId(profiles.length > 0 ? profiles[0].id : null);
  }
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(KEYS.ACTIVE_PROFILE_ID);
}

export function setActiveProfileId(id: string | null): void {
  if (id) {
    localStorage.setItem(KEYS.ACTIVE_PROFILE_ID, id);
  } else {
    localStorage.removeItem(KEYS.ACTIVE_PROFILE_ID);
  }
}

export function getActiveProfile(): UserProfile | null {
  try {
    migrateIfNeeded();
    const id = getActiveProfileId();
    if (!id) return null;
    const profiles = loadProfiles();
    return profiles.find((p) => p.id === id)?.profile ?? null;
  } catch {
    return null;
  }
}

// ── 레거시 단일 프로필 (하위 호환) ──

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function loadUserProfile(): UserProfile | null {
  try {
    migrateIfNeeded();
    return getActiveProfile();
  } catch {
    return null;
  }
}

// ── Pending Decision ──

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

// ── History ──

export function saveToHistory(entry: HistoryEntry): void {
  const history = loadAllHistory();
  history.unshift(entry);
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

/** 활성 프로필에 해당하는 기록만 반환 (무기한 보존, 수동 삭제 전까지 유지) */
export function loadHistory(profileId?: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const all = JSON.parse(raw) as HistoryEntry[];
    if (!profileId) return all;
    // profileId가 있으면 해당 프로필 것만, profileId 없는 레거시 항목은 legacy 프로필에 귀속
    return all.filter((h) =>
      h.profileId === profileId ||
      (!h.profileId && profileId === 'profile-legacy')
    );
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(KEYS.HISTORY);
}

/** 특정 프로필의 기록만 삭제 */
export function clearHistoryForProfile(profileId: string): void {
  try {
    const all = loadAllHistory();
    // 해당 profileId가 아닌 것만 남김
    const filtered = all.filter((h) =>
      h.profileId !== profileId &&
      !(profileId === 'profile-legacy' && !h.profileId)
    );
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

/** 특정 항목 하나만 삭제 */
export function deleteHistoryEntry(id: string): void {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return;
    const history = JSON.parse(raw) as HistoryEntry[];
    const filtered = history.filter((h) => h.id !== id);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

/** 전체 히스토리 (필터 없이) */
export function loadAllHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
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
