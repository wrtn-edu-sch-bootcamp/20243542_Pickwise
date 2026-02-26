'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { MAX_PROFILES } from '@/lib/types';
import type { UserProfile } from '@/lib/types';

const genderOptions = [
  { value: 'female', label: '여성', emoji: '👩' },
  { value: 'male', label: '남성', emoji: '👨' },
  { value: 'other', label: '기타', emoji: '🧑' },
] as const;

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

const TOTAL_STEPS = 4;

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  const isNewMode = searchParams.get('new') === 'true'; // 새 사용자 추가
  const editProfileId = searchParams.get('profileId'); // 특정 프로필 수정 시

  const { profile, profiles, setProfile, addNewProfile, editProfile } = useUser();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<UserProfile['gender'] | ''>('');
  const [age, setAge] = useState('');
  const [mbti, setMbti] = useState('');
  const [direction, setDirection] = useState(1);

  // 수정 모드일 때 기존 값으로 초기화
  useEffect(() => {
    if (isEditMode) {
      // profileId가 있으면 해당 프로필, 없으면 현재 활성 프로필
      const targetProfile = editProfileId
        ? profiles.find((p) => p.id === editProfileId)?.profile
        : profile;
      if (targetProfile) {
        setName(targetProfile.name);
        setGender(targetProfile.gender);
        setAge(String(targetProfile.age));
        setMbti(targetProfile.mbti ?? '');
      }
    }
  // profiles가 로드된 이후에만 실행되도록 profiles를 의존성에 포함
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editProfileId, profiles.length]);

  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goPrev = () => { setDirection(-1); setStep((s) => s - 1); };

  const handleFinish = () => {
    if (!name || !gender || !age) return;
    const newProfile: UserProfile = {
      name: name.trim(),
      gender: gender as UserProfile['gender'],
      age: Number(age),
      mbti: mbti || '모름',
    };
    if (isNewMode) {
      // 새 사용자 추가 (addNewProfile이 자동으로 active로 설정)
      addNewProfile(newProfile);
      router.push('/profiles');
    } else if (isEditMode && editProfileId) {
      // 특정 프로필 ID 수정
      editProfile(editProfileId, newProfile);
      router.push('/profiles');
    } else {
      setProfile(newProfile);
      router.push(isEditMode ? '/' : '/decide');
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d * 60, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
    exit: (d: number) => ({ x: d * -60, opacity: 0, transition: { duration: 0.25 } }),
  };

  return (
    <main className="page-container">
      <div style={{ paddingTop: 'max(48px, env(safe-area-inset-top, 48px))' }}>
        {/* Back button */}
        <button
          onClick={step > 0 ? goPrev : () => router.back()}
          className="btn-ghost"
          style={{ width: 'auto', padding: '8px 16px', marginBottom: 28, fontSize: 14 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {step > 0 ? '이전' : (isEditMode || isNewMode) ? '취소' : '뒤로'}
        </button>

        {/* 모드 배지 */}
        {isNewMode && (
          <div className="badge" style={{ marginBottom: 20 }}>
            <span>👤</span>
            <span>새 사용자 추가 ({profiles.length + 1}/{MAX_PROFILES})</span>
          </div>
        )}
        {isEditMode && !isNewMode && (
          <div className="badge" style={{ marginBottom: 20 }}>
            <span>✏️</span>
            <span>
              {editProfileId
                ? `${profiles.find((p) => p.id === editProfileId)?.profile.name ?? ''}님 프로필 수정`
                : '프로필 수정 중'}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              {isEditMode ? '프로필 수정' : '프로필 설정'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step + 1} / {TOTAL_STEPS}</span>
          </div>
          <div style={{ height: 3, borderRadius: 4, background: 'var(--border-subtle)', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }}
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div key="step-name" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <StepName name={name} setName={setName} onNext={goNext} isEdit={isEditMode} />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="step-gender" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <StepGender gender={gender} setGender={setGender} onNext={goNext} isEdit={isEditMode} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="step-age" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <StepAge age={age} setAge={setAge} onNext={goNext} isEdit={isEditMode} />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="step-mbti" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit">
              <StepMbti mbti={mbti} setMbti={setMbti} onFinish={handleFinish} isEdit={isEditMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function StepName({ name, setName, onNext, isEdit }: { name: string; setName: (v: string) => void; onNext: () => void; isEdit: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Step 1
      </p>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
        이름을<br />알려주세요 👋
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
        {isEdit ? '이름을 수정할 수 있어요.' : '모지가 당신에게 맞는 분석을 위해\n기본 정보를 수집합니다.'}
      </p>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
          이름 또는 닉네임
        </label>
        <input
          className="input-field" type="text" placeholder="예: 지수, Alex..." value={name}
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && onNext()}
          autoFocus maxLength={20}
        />
      </div>
      <button className="btn-primary" onClick={onNext} disabled={!name.trim()}>
        다음
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function StepGender({ gender, setGender, onNext, isEdit }: { gender: string; setGender: (v: UserProfile['gender']) => void; onNext: () => void; isEdit: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Step 2
      </p>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
        성별을<br />선택해주세요
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
        {isEdit ? '성별을 변경할 수 있어요.' : '모지가 개인화된 추천을 위해 활용합니다.'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {genderOptions.map((opt) => (
          <button key={opt.value} onClick={() => setGender(opt.value)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14,
            border: `1px solid ${gender === opt.value ? 'rgba(124, 58, 237, 0.5)' : 'var(--border-subtle)'}`,
            background: gender === opt.value ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.02)',
            cursor: 'pointer', transition: 'all 0.2s ease', width: '100%', textAlign: 'left',
          }}>
            <span style={{ fontSize: 24 }}>{opt.emoji}</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: gender === opt.value ? '#A78BFA' : 'var(--text-primary)' }}>
              {opt.label}
            </span>
            {gender === opt.value && <span style={{ marginLeft: 'auto', color: '#7C3AED' }}>✓</span>}
          </button>
        ))}
      </div>
      <button className="btn-primary" onClick={onNext} disabled={!gender}>
        다음
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function StepAge({ age, setAge, onNext, isEdit }: { age: string; setAge: (v: string) => void; onNext: () => void; isEdit: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Step 3
      </p>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
        나이를<br />알려주세요 🎂
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
        {isEdit ? '나이를 수정할 수 있어요.' : '연령대에 맞는 분석이 이루어집니다.'}
      </p>
      <div style={{ marginBottom: 32 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
          나이 (만 나이)
        </label>
        <input
          className="input-field" type="number" placeholder="예: 27" value={age}
          onChange={(e) => setAge(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && Number(age) > 0 && onNext()}
          min="1" max="120" autoFocus style={{ fontSize: 18, fontWeight: 600 }}
        />
      </div>
      <button className="btn-primary" onClick={onNext} disabled={!age || Number(age) <= 0}>
        다음
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

function StepMbti({ mbti, setMbti, onFinish, isEdit }: { mbti: string; setMbti: (v: string) => void; onFinish: () => void; isEdit: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
        Step 4
      </p>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.2 }}>
        MBTI를<br />알려주세요 🧠
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
        {isEdit ? 'MBTI를 변경할 수 있어요.' : '성격 유형을 알면 더 맞춤화된 추천이 가능해요.\n몰라도 괜찮아요!'}
      </p>

      {/* MBTI 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {MBTI_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setMbti(mbti === type ? '' : type)}
            style={{
              padding: '10px 4px',
              borderRadius: 10,
              border: `1px solid ${mbti === type ? 'rgba(124,58,237,0.6)' : 'var(--border-subtle)'}`,
              background: mbti === type ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
              color: mbti === type ? '#A78BFA' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: mbti === type ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              letterSpacing: '0.02em',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 모름 버튼 */}
      <button
        onClick={() => setMbti(mbti === '모름' ? '' : '모름')}
        style={{
          width: '100%', padding: '12px', borderRadius: 12, marginBottom: 24,
          border: `1px solid ${mbti === '모름' ? 'rgba(236,72,153,0.5)' : 'var(--border-subtle)'}`,
          background: mbti === '모름' ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.02)',
          color: mbti === '모름' ? '#EC4899' : 'var(--text-muted)',
          fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <span>🤷</span>
        <span>잘 모르겠어요</span>
        {mbti === '모름' && <span style={{ color: '#EC4899' }}>✓</span>}
      </button>

      {/* 선택된 MBTI 표시 */}
      {mbti && mbti !== '모름' && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center', marginBottom: 16, padding: '8px 16px',
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 10,
          }}
        >
          <span style={{ fontSize: 13, color: '#A78BFA', fontWeight: 600 }}>
            선택된 유형: {mbti}
          </span>
        </motion.div>
      )}

      <button className="btn-primary" onClick={onFinish} disabled={!mbti}>
        {isEdit ? '✓  수정 완료' : '완료 - 모지에게 물어보기 ✦'}
      </button>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
