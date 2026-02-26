'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';
import MojiCharacter from '@/components/MojiCharacter';

const features = [
  {
    icon: '🧠',
    title: '멀티모달 분석',
    desc: '사진 + 텍스트를 함께 분석해 최적 선택 도출',
  },
  {
    icon: '⚡',
    title: '실시간 스트리밍',
    desc: '모지의 사고 과정을 타이핑 효과로 생생하게',
  },
  {
    icon: '📋',
    title: '15일 결정 기록',
    desc: '모지가 도와준 고민과 결과를 언제든 다시 확인',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const MOJI_INTRO_MESSAGES = [
  '안녕! 나는 모지야 👋\n결정이 어려울 때 내가 도와줄게!',
  '사진이랑 상황을 알려주면\n내가 꼼꼼히 분석해줄게 🔍',
  '효율성, 가성비, 상황까지 모두 따져볼게 ✦',
];

export default function LandingPage() {
  const router = useRouter();
  const { profile, profiles, isLoaded } = useUser();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    if (isLoaded && profile) {
      router.prefetch('/decide');
    }
  }, [isLoaded, profile, router]);

  const handleStart = () => {
    if (profile) {
      router.push('/decide');
    } else if (profiles.length === 0) {
      // 처음 방문: 온보딩으로
      router.push('/onboarding');
    } else {
      // 프로필은 있지만 active가 없는 경우 (이론상 드묾)
      router.push('/profiles');
    }
  };

  return (
    <main className="page-container">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ paddingTop: 'max(60px, env(safe-area-inset-top, 60px))' }}
      >
        {/* Logo / Brand */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-8">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 0 16px rgba(124, 58, 237, 0.5)',
            }}
          >
            ✦
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text-secondary)',
            }}
          >
            모지픽
          </span>
        </motion.div>

        {/* Moji character — intro */}
        <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
          <MojiCharacter
            messages={MOJI_INTRO_MESSAGES}
            size="lg"
            interval={3500}
          />
          {/* 이름표 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{
              textAlign: 'center',
              marginTop: 4,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: isLight ? '#BE185D' : '#F9A8D4',
            }}
          >
            결정장애 해결사 모지
          </motion.p>
        </motion.div>

        {/* Hero */}
        <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
          <div className="badge" style={{ marginBottom: 16 }}>
            <span>✦</span>
            <span>Gemini Vision 기반 분석</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 9vw, 48px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            <span style={{ display: 'block', color: 'var(--text-primary)' }}>결정이</span>
            <span className="gradient-text" style={{ display: 'block' }}>
              두려운 순간,
            </span>
            <span style={{ display: 'block', color: 'var(--text-primary)' }}>모지에게</span>
            <span className="gradient-text" style={{ display: 'block' }}>
              물어봐
            </span>
          </h1>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              maxWidth: 340,
            }}
          >
            사진과 상황을 올리면 모지가 당신의 프로필을 바탕으로
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {' '}데이터 기반의 최선{' '}
            </strong>
            을 골라드립니다.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants} style={{ marginBottom: 40 }}>
          <button className="btn-primary pulse-glow" onClick={handleStart}>
            <span>{profile ? '모지에게 물어보기' : '지금 시작하기'}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {profile && (
            <div style={{ textAlign: 'center', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                안녕하세요, <span style={{ color: '#A78BFA' }}>{profile.name}</span>님 👋
              </p>
              <button
                onClick={() => router.push('/profiles')}
                style={{
                  fontSize: 11, color: 'var(--text-primary)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8, padding: '3px 8px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  transition: 'all 0.2s',
                }}
              >
                사용자 변경
              </button>
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="divider" />

        {/* Feature cards */}
        <motion.div variants={itemVariants}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              marginBottom: 14,
            }}
          >
            모지가 하는 일
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="glass-card"
                style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.15 }}
              >
                <span style={{ fontSize: 24, lineHeight: 1 }}>{f.icon}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {f.title}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* History shortcut */}
        {profile && (
          <motion.div variants={itemVariants} style={{ marginTop: 20 }}>
            <button
              className="btn-ghost"
              style={{ width: '100%' }}
              onClick={() => router.push('/history')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              모지의 결정 기록 보기
            </button>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-muted)' }}>
            데이터는 디바이스 로컬에만 저장됩니다
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
