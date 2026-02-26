# ✦ 결정장애 해결사 — 모지 (Moji Decision Maker)

> 사진과 텍스트로 고민을 올리면 AI 캐릭터 **모지**가 분석하고 최선의 선택을 골라주는 풀스택 PWA 웹앱

---

## 1. 프로젝트 개요

사용자가 결정하기 힘든 상황(상품 비교, 선택지 고민 등)을 사진과 텍스트로 입력하면,  
AI 캐릭터 **모지**가 사용자의 프로필(이름·성별·나이·MBTI)과 **과거 결정 이력(별점·후기)**을 종합 분석하여  
최적의 선택지와 상세한 논리적 근거를 스트리밍으로 제시하는 풀스택 PWA 웹 애플리케이션입니다.

---

## 2. 기술 스택

| 분류 | 사용 기술 |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS + Custom CSS Variables (다크/라이트 테마) |
| **Animation** | Framer Motion |
| **AI** | Google Gemini 2.5 Flash (`@google/generative-ai` SDK) — 멀티모달 |
| **PWA** | `manifest.json` + 모바일 설치 지원 |
| **State** | React Context API (`UserContext`, `ThemeContext`) |
| **Storage** | LocalStorage (사용자 프로필, 결정 이력 7일 보존) |

---

## 3. 핵심 기능

### 랜딩 페이지 (`/`)
- 모지 캐릭터가 말풍선으로 서비스를 소개 (메시지 자동 순환)
- 기존 프로필 보유 시 "모지에게 물어보기" 버튼 노출, 없으면 "지금 시작하기"
- 프로필 수정 버튼 (`수정하기`) → 온보딩 수정 모드로 이동
- 서비스 기능 카드 3개 (멀티모달 분석 / 실시간 스트리밍 / 7일 결정 기록)
- 결정 기록 바로가기 버튼

### 온보딩 (`/onboarding`) — 4단계
1. **이름 입력**
2. **성별 선택** (남성 / 여성 / 기타)
3. **나이 입력**
4. **MBTI 선택** (16가지 유형 + 모름)
- 프로필 수정 시에도 동일 흐름으로 편집 가능
- 슬라이드 애니메이션으로 각 단계 전환

### 결정 입력 (`/decide`)
- **세부 상황** 텍스트 입력 (필수)
- **선택지 추가** — 이름(필수 1개 이상) + 이미지 업로드(선택사항, 탭하여 사진 선택)
- 선택지 무한 추가 / 삭제 가능
- 이미지 클라이언트 사이드 압축 (최대 600px, JPEG 변환) 후 Base64 전송
- 모지 캐릭터가 팁 말풍선 순환 노출 (사진 촬영 요령, 입력 방법 안내)
- 제출 전 유효성 검사 (상황 필수, 선택지 이름 1개 이상 필수)
- 제출 시 **최근 별점 이력 최대 5건**을 AI에 함께 전달 (취향 학습)

### AI 분석 결과 (`/result`)
- **로딩 → 스트리밍 → 완료** 3단계 상태 관리
- 로딩 중 모지 애니메이션 + 분석 진행 메시지 자동 순환
- 분석 완료 후 표시:
  - **비교 대상 태그** — 모지가 선택한 항목 강조 표시
  - **✦ 모지의 선택** 카드 — 최종 추천 선택지 대형 텍스트로 표시
  - **📋 모지의 분석 리포트** 카드 — 아래 섹션으로 구성:
    - 🎯 이 선택을 한 이유 (5~7문장)
    - ⚡ 효율성 분석 (4~5항목 비교)
    - 💰 가성비 분석
    - ⭐ 실사용자 리뷰 & 반응
    - ✅ 핵심 근거 (5~7 bullet)
    - ⚠️ 이 선택의 단점 & 주의사항
    - 📊 선택지별 종합 비교
  - 분석 불가 시 안내 메시지 표시

- **별점 & 후기 카드** (분석 완료 후 노출):
  - ⭐ 1~5점 별점 선택 (호버 시 확대 애니메이션)
  - 후기 메모 입력 (선택사항, 최대 200자)
  - 저장 시 히스토리 엔트리에 별점·메모 자동 업데이트

### 결정 기록 (`/history`)
- 최근 7일간 모지가 분석한 결정 목록
- 각 카드에 **모지의 선택 배지** 표시
- 별점 있으면 카드에 별 + 점수 + 후기 요약 표시
- 카드 펼치기 → 전체 분석 내용 + 만족도 섹션
  - 별점 없으면 "별점 남기기" 버튼
  - 별점 있으면 "수정하기" 버튼
- 헤더에 전체 평균 별점 자동 계산 표시
- 모지 말풍선 메시지가 평균 별점에 따라 변동
- 전체 삭제 기능

---

## 4. AI 취향 학습 (핵심 차별점)

```
사용자가 별점을 남기면 → 다음 분석 시 Gemini에 과거 기록 전달
→ 모지가 패턴을 파악하고 자연스럽게 잔소리
```

- 별점 1~2점 결정과 비슷한 패턴 발견 시:
  > "지난번에 비싼 걸 샀다가 후회하셨잖아요. 이번엔 가성비를 조금 더 챙겨볼게요!"
- 별점 4~5점 결정의 공통점을 다음 추천에 반영
- 후기 메모 내용도 구체적으로 참고

---

## 5. AI 분석 구조

- **모델**: `gemini-2.5-flash` (멀티모달, 최대 1M 토큰)
- **API 버전**: `v1beta` (systemInstruction 지원)
- **전달 데이터**:
  - 사용자 프로필 (이름, 성별, 나이, MBTI)
  - 선택지별 이름 + 이미지 (Base64 인라인)
  - 세부 상황 텍스트
  - 과거 결정 이력 (별점·후기 포함, 최대 5건)
- **응답 형식**: 마커(`★선택:`, `★분석불가`) 기반 구조화 스트리밍 텍스트
- **온도(temperature)**: 0.6

---

## 6. 테마 & 디자인

### 다크 / 라이트 모드
- 우측 상단 ☀️/🌙 버튼으로 즉시 전환
- `localStorage`에 선호 테마 저장 (새로고침 유지)
- CSS Custom Properties 기반 — `:root` (다크) / `html.light` (라이트)

### 색상 팔레트 (다크 기준)
| 변수 | 값 | 용도 |
|---|---|---|
| `--bg-base` | `#08080F` | 전체 배경 |
| `--bg-card` | `rgba(255,255,255,0.03)` | 카드 배경 |
| `--accent-violet` | `#7C3AED` | 주 포인트 |
| `--accent-pink` | `#EC4899` | 보조 포인트 |
| `--text-primary` | `#F1F5F9` | 본문 텍스트 |
| `--text-secondary` | `#94A3B8` | 보조 텍스트 |

### 모바일 퍼스트
- 모든 터치 타깃 최소 44px
- `max-width: 480px` 중앙 정렬 레이아웃
- Safe Area Inset 대응 (`env(safe-area-inset-top)`)
- PWA 설치 지원 (`manifest.json`)

---

## 7. 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 랜딩
│   ├── onboarding/page.tsx   # 온보딩 (4단계)
│   ├── decide/page.tsx       # 결정 입력
│   ├── result/page.tsx       # 분석 결과 + 별점
│   ├── history/page.tsx      # 결정 기록
│   ├── api/analyze/route.ts  # Gemini API Route Handler
│   └── globals.css           # 전역 스타일 + 테마 변수
├── components/
│   ├── MojiCharacter.tsx     # 모지 캐릭터 + 말풍선 컴포넌트
│   └── ThemeToggle.tsx       # 다크/라이트 전환 버튼
├── contexts/
│   ├── UserContext.tsx       # 사용자 프로필 전역 상태
│   └── ThemeContext.tsx      # 테마 전역 상태
└── lib/
    ├── types.ts              # TypeScript 인터페이스 정의
    └── storage.ts            # LocalStorage 유틸리티 함수
```

---

## 8. 환경 변수 설정

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

> Google AI Studio (https://aistudio.google.com) 에서 API 키 발급

---

## 9. 로컬 실행

```bash
npm install
npm run dev
# http://localhost:3000
```

---

## 10. 데이터 흐름

```
[사용자 입력]
  이름/성별/나이/MBTI → UserContext (LocalStorage 저장)
  선택지 이름 + 이미지 → 클라이언트 압축 → Base64
  세부 상황 텍스트
  과거 결정 이력 (별점 있는 것만)
        ↓
[/api/analyze Route Handler]
  Gemini 2.5 Flash API 호출 (systemInstruction + 멀티파트)
  스트리밍 응답 → 클라이언트로 전달
        ↓
[/result 페이지]
  마커 파싱 → 모지의 선택 + 분석 리포트 표시
  LocalStorage에 결과 저장 (chosenItem 포함)
  별점 UI → updateHistoryEntry()로 패치 저장
        ↓
[/history 페이지]
  7일 이내 기록 목록 표시
  별점/후기 표시 및 수정
  평균 별점 계산 표시
```
