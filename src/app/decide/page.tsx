'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { savePendingDecision, loadHistory } from '@/lib/storage';
import type { DecisionItem, HistoryContext } from '@/lib/types';
import MojiCharacter from '@/components/MojiCharacter';

let idCounter = 0;
const newId = () => `item-${++idCounter}`;

const MOJI_TIPS = [
  '사진을 선명하게 찍어서 올려줘!\n내가 더 정확히 분석할 수 있어 📸',
  '선택지 이름을 입력하면 분석이 훨씬 정밀해져! ✍️',
  '세부사항에 예산, 목적, 상황을 구체적으로 적어줘 🎯',
  '실제 사용 환경이나 조건도 알려주면 더 좋아! 🌟',
  '비교 대상이 많을수록 내가 더 꼼꼼하게 따져볼게 🔍',
  '고민 배경까지 적어주면 네 상황에 딱 맞는 추천이 나와 💪',
];

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageSlot({
  item,
  index,
  canRemove,
  onNameChange,
  onImageChange,
  onRemove,
}: {
  item: DecisionItem;
  index: number;
  canRemove: boolean;
  onNameChange: (id: string, name: string) => void;
  onImageChange: (id: string, base64: string) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const b64 = await compressImage(file);
        onImageChange(item.id, b64);
      } finally {
        setLoading(false);
      }
    },
    [item.id, onImageChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card"
      style={{ padding: 16 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#A78BFA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          선택지 {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(item.id)}
            style={{
              width: 24, height: 24, borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Image area */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          height: 130,
          borderRadius: 12,
          border: item.imageBase64 ? 'none' : '1.5px dashed rgba(124, 58, 237, 0.3)',
          background: item.imageBase64 ? 'none' : 'rgba(124,58,237,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: loading ? 'wait' : 'pointer',
          overflow: 'hidden', marginBottom: 12, position: 'relative',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        {item.imageBase64 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageBase64} alt={item.name || `선택지 ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)', borderRadius: 12,
            }} />
            <div style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 8px',
              fontSize: 11, color: '#A78BFA', fontWeight: 500,
            }}>
              탭하여 변경
            </div>
          </>
        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28,
              border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7C3AED',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>처리 중...</span>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>📷</div>
            <p style={{ fontSize: 12, color: '#A78BFA', fontWeight: 500 }}>
              탭하여 사진 선택 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(선택사항)</span>
            </p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*"
          onChange={handleChange} style={{ display: 'none' }} />
      </div>

      {/* Name input — required */}
      <div style={{ position: 'relative' }}>
        <input
          className="input-field"
          type="text"
          placeholder={['예시: 나이키 에어맥스', '예시시: 아디다스 삼바', '예: 뉴발란스 990'][index] ?? `예시시: 선택지 ${index + 1} 이름`}
          value={item.name}
          onChange={(e) => onNameChange(item.id, e.target.value)}
          style={{ fontSize: 14, paddingRight: item.name.trim() ? 36 : 16 }}
        />
        {item.name.trim() && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#7C3AED', fontSize: 16,
          }}>✓</span>
        )}
      </div>
    </motion.div>
  );
}

export default function DecidePage() {
  const router = useRouter();
  const { profile, activeProfileId, isLoaded } = useUser();

  const [items, setItems] = useState<DecisionItem[]>([
    { id: newId(), name: '' },
    { id: newId(), name: '' },
  ]);
  const [situation, setSituation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  if (isLoaded && !profile) {
    router.replace('/onboarding');
    return null;
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: newId(), name: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleNameChange = (id: string, name: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const handleImageChange = (id: string, imageBase64: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, imageBase64 } : item)));
  };

  const filledNames = items.filter((i) => i.name.trim());
  const hasAtLeastTwoNames = filledNames.length >= 2;
  const hasSituation = situation.trim().length > 0;
  const isValid = hasAtLeastTwoNames && hasSituation;

  const validationErrors = [];
  if (touched && !hasAtLeastTwoNames) validationErrors.push('선택지 이름을 최소 2개 입력해주세요');
  if (touched && !hasSituation) validationErrors.push('세부 상황을 입력해주세요');

  const handleSubmit = async () => {
    setTouched(true);
    if (!profile || isSubmitting || !isValid) return;

    setIsSubmitting(true);
    const filledItems = items.filter((i) => i.name.trim() || i.imageBase64);

    // 현재 날짜/시간 (분석에 활용)
    const now = new Date();
    const currentDateTime = now.toLocaleString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      weekday: 'long', hour: '2-digit', minute: '2-digit',
    });

    // 최근 히스토리 최대 8건 (별점 유무 관계없이, 선택지가 있는 것만)
    const historyContext: HistoryContext[] = loadHistory(activeProfileId ?? undefined)
      .filter((h) => h.chosenItem)
      .slice(0, 8)
      .map((h) => ({
        situation: h.situation,
        chosenItem: h.chosenItem!,
        rating: h.rating,
        ratingNote: h.ratingNote,
      }));

    savePendingDecision({
      items: filledItems,
      situation,
      userProfile: profile,
      currentDateTime,
      historyContext: historyContext.length > 0 ? historyContext : undefined,
    });
    router.push('/result');
  };

  return (
    <main className="page-container">
      <div style={{ paddingTop: 'max(48px, env(safe-area-inset-top, 48px))' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => router.push('/')}
            className="btn-ghost"
            style={{ width: 40, height: 40, padding: 0, borderRadius: 12, flexShrink: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              무엇을 결정할까요?
            </h1>
            {profile && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {profile.name}님의 고민을 모지에게 알려주세요
              </p>
            )}
          </div>
        </div>

        {/* Moji tips */}
        <div style={{ marginBottom: 24 }}>
          <MojiCharacter
            messages={MOJI_TIPS}
            size="md"
            interval={5000}
            bubblePosition="right"
          />
        </div>

        {/* Section: Situation — 필수 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              세부 상황
            </p>
            <span style={{
              fontSize: 11,
              color: hasSituation ? '#7C3AED' : '#EC4899',
              fontWeight: 600,
            }}>
              {hasSituation ? '✓ 입력됨' : '* 필수 입력'}
            </span>
          </div>

          <textarea
            className="input-field"
            placeholder={`고민 상황을 구체적으로 알려주세요. (필수)\n\n예: 결혼식 하객으로 참석하는데 어떤 옷이 더 잘 어울릴까요?\n예산은 10만원 이내이고 격식 있는 자리입니다.\n저는 키가 165cm이고 단발머리예요.`}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            rows={5}
            style={{ resize: 'none', lineHeight: 1.6, fontSize: 14 }}
          />

          {/* Moji hint for situation */}
          {!hasSituation && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                marginTop: 8, padding: '10px 12px',
                background: 'rgba(236,72,153,0.06)',
                border: '1px solid rgba(236,72,153,0.2)',
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 14 }}>💬</span>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                모지가 더 정확하게 분석하려면 상황 설명이 꼭 필요해요! 예산, 목적, 사용 환경 등을 알려주세요.
              </p>
            </motion.div>
          )}
        </div>

        <div className="divider" />

        {/* Section: Items */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              비교할 선택지
            </p>
            <span style={{
              fontSize: 11,
              color: hasAtLeastTwoNames ? '#7C3AED' : '#EC4899',
              fontWeight: 600,
            }}>
              {hasAtLeastTwoNames ? `✓ ${filledNames.length}개 입력됨` : '* 이름 최소 2개 필수'}
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, i) => (
                <ImageSlot
                  key={item.id}
                  item={item}
                  index={i}
                  canRemove={items.length > 2}
                  onNameChange={handleNameChange}
                  onImageChange={handleImageChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          </AnimatePresence>

          <motion.button
            onClick={handleAddItem}
            className="btn-ghost"
            style={{ width: '100%', marginTop: 10, gap: 8 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            선택지 추가
          </motion.button>
        </div>

        {/* Validation errors */}
        <AnimatePresence>
          {touched && validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginBottom: 16, padding: '12px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 12,
              }}
            >
              {validationErrors.map((err, i) => (
                <p key={i} style={{ fontSize: 13, color: '#f87171', margin: 0, lineHeight: 1.6 }}>
                  • {err}
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <div>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: 18, height: 18,
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                }} />
                모지 준비 중...
              </>
            ) : (
              <>
                <span>✦</span>
                모지에게 분석 맡기기
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
