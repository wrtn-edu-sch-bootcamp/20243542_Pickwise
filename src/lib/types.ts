export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  mbti?: string; // 16가지 MBTI 또는 '모름'
}

export interface UserProfileEntry {
  id: string;
  createdAt: string;
  profile: UserProfile;
}

export const MAX_PROFILES = 4;

export interface DecisionItem {
  id: string;
  name: string;
  imageBase64?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  items: DecisionItem[];
  situation: string;
  userProfile: UserProfile;
  result: string;
  chosenItem?: string;    // 모지가 고른 선택지
  rating?: number;        // 1~5점 만족도
  ratingNote?: string;    // 후기 메모 (선택)
  profileId?: string;     // 어느 사용자 프로필의 기록인지
}

// API 호출 시 전달하는 히스토리 맥락 (이미지 제외)
export interface HistoryContext {
  situation: string;
  chosenItem: string;
  rating: number;
  ratingNote?: string;
}

export interface DecisionRequest {
  items: DecisionItem[];
  situation: string;
  userProfile: UserProfile;
  historyContext?: HistoryContext[]; // 과거 결정 맥락 (취향 학습용)
}
