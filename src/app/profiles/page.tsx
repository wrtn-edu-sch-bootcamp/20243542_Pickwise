'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { MAX_PROFILES } from '@/lib/types';
import type { UserProfileEntry } from '@/lib/types';

const GENDER_LABEL = { male: '남성', female: '여성', other: '기타' } as const;

function ProfileCard({
  entry,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: {
  entry: UserProfileEntry;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { profile } = entry;
  const genderLabel = GENDER_LABEL[profile.gender];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="glass-card"
      style={{
        padding: '16px 18px',
        border: isActive ? '1px solid rgba(124,58,237,0.5)' : undefined,
        background: isActive ? 'rgba(124,58,237,0.06)' : undefined,
        cursor: 'pointer',
      }}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 아바타 */}
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: isActive
            ? 'linear-gradient(135deg, #7C3AED, #EC4899)'
            : 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          boxShadow: isActive ? '0 0 14px rgba(124,58,237,0.4)' : 'none',
        }}>
          {profile.gender === 'female' ? '👩' : profile.gender === 'male' ? '👨' : '🧑'}
        </div>

        {/* 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {profile.name}
            </p>
            {isActive && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: '#A78BFA',
                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 6, padding: '1px 6px',
              }}>
                현재 사용자
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {genderLabel} · {profile.age}세 · {profile.mbti ?? '모름'}
          </p>
        </div>

        {/* 수정 / 삭제 버튼 묶음 */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="수정"
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'rgba(124,58,237,0.10)',
              color: '#A78BFA', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            ✏️
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="삭제"
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'rgba(239,68,68,0.08)',
              color: '#f87171', fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProfilesPage() {
  const router = useRouter();
  const { profiles, activeProfileId, setActiveProfile, removeProfile } = useUser();
  const [deleteTarget, setDeleteTarget] = useState<UserProfileEntry | null>(null);

  const handleSelect = (id: string) => {
    setActiveProfile(id);
    router.push('/');
  };

  const handleEdit = (id: string) => {
    router.push(`/onboarding?edit=true&profileId=${id}`);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    removeProfile(deleteTarget.id);
    setDeleteTarget(null);
  };

  const canAddMore = profiles.length < MAX_PROFILES;

  return (
    <>
      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteTarget(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9000,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card"
              style={{
                width: '100%', maxWidth: 360, padding: '24px 22px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              }}
            >
              <p style={{ fontSize: 22, textAlign: 'center', marginBottom: 12 }}>🗑️</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8 }}>
                사용자를 삭제할까요?
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
                <span style={{ color: '#A78BFA', fontWeight: 600 }}>{deleteTarget.profile.name}</span>님의<br />
                프로필과 관련 기록이 모두 사라질 수 있어요.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="btn-ghost"
                  style={{ flex: 1, fontSize: 14 }}
                >
                  취소
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="page-container">
        <div style={{ paddingTop: 'max(48px, env(safe-area-inset-top, 48px))' }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <button onClick={() => router.back()} className="btn-ghost"
              style={{ width: 40, height: 40, padding: 0, borderRadius: 12, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>사용자 선택</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                최대 {MAX_PROFILES}명 · 현재 {profiles.length}명 등록됨
              </p>
            </div>
          </div>

          {/* 프로필 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <AnimatePresence mode="popLayout">
              {profiles.map((entry) => (
                <ProfileCard
                  key={entry.id}
                  entry={entry}
                  isActive={entry.id === activeProfileId}
                  onSelect={() => handleSelect(entry.id)}
                  onEdit={() => handleEdit(entry.id)}
                  onDelete={() => setDeleteTarget(entry)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* 사용자 추가 버튼 */}
          {canAddMore ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/onboarding?new=true')}
              style={{
                width: '100%', padding: '14px', borderRadius: 14,
                border: '1.5px dashed var(--border-accent)',
                background: 'rgba(124,58,237,0.04)',
                color: '#A78BFA', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 18 }}>+</span>
              사용자 추가 ({profiles.length}/{MAX_PROFILES})
            </motion.button>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
              최대 {MAX_PROFILES}명까지 등록할 수 있어요
            </p>
          )}

          {/* 안내 문구 */}
          {profiles.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
              카드를 탭하면 해당 사용자로 전환돼요<br />
              각 사용자의 결정 기록은 따로 관리됩니다
            </p>
          )}
        </div>
      </main>
    </>
  );
}
