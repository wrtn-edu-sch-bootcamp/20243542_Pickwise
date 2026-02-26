'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { loadHistory, clearHistory, clearHistoryForProfile, updateHistoryEntry, deleteHistoryEntry } from '@/lib/storage';
import type { HistoryEntry } from '@/lib/types';
import MojiCharacter from '@/components/MojiCharacter';
import { useUser } from '@/contexts/UserContext';

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function StarRow({
  value,
  onChange,
  size = 20,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            background: 'none', border: 'none',
            cursor: readonly ? 'default' : 'pointer',
            padding: 0, lineHeight: 1,
            fontSize: size,
            filter: (hover || value) >= star ? 'none' : 'grayscale(1) opacity(0.25)',
            transform: !readonly && (hover || value) >= star ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.12s ease',
          }}
        >
          ⭐
        </button>
      ))}
    </div>
  );
}

function HistoryCard({
  entry,
  onExpand,
  isExpanded,
  onUpdate,
  onRequestDelete,
}: {
  entry: HistoryEntry;
  onExpand: () => void;
  isExpanded: boolean;
  onUpdate: (id: string, updates: Partial<HistoryEntry>) => void;
  onRequestDelete: (id: string, name: string) => void;
}) {
  const [editingRating, setEditingRating] = useState(false);
  const [draftRating, setDraftRating] = useState(entry.rating ?? 0);
  const [draftNote, setDraftNote] = useState(entry.ratingNote ?? '');

  const preview = entry.result.slice(0, 160).replace(/[#*>\-]/g, '').trim();
  const itemNames = entry.items.map((i) => i.name || '이미지').join(' vs ');

  const handleSaveRating = useCallback(() => {
    onUpdate(entry.id, {
      rating: draftRating || undefined,
      ratingNote: draftNote.trim() || undefined,
    });
    setEditingRating(false);
  }, [entry.id, draftRating, draftNote, onUpdate]);

  return (
    <motion.div
      layout
      className="glass-card"
      style={{ overflow: 'hidden' }}
      transition={{ duration: 0.15 }}
    >
      {/* 헤더 (클릭 → 펼치기) */}
      <div style={{ padding: '16px 16px 0', cursor: 'pointer' }} onClick={onExpand}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#A78BFA', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {itemNames || '결정 기록'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {timeAgo(entry.createdAt)} · 모지가 도와줬어요
            </p>
          </div>
          {/* 이미지 썸네일 + X 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
            <div style={{ display: 'flex' }}>
              {entry.items.filter((i) => i.imageBase64).slice(0, 2).map((item, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={item.id} src={item.imageBase64} alt=""
                  style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '2px solid var(--bg-base)', marginLeft: idx > 0 ? -10 : 0 }} />
              ))}
            </div>
            {/* 삭제 X 버튼 */}
            <button
              onClick={(e) => { e.stopPropagation(); onRequestDelete(entry.id, itemNames || '이 기록'); }}
              title="이 기록 삭제"
              style={{
                width: 28, height: 28, borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s ease',
                fontSize: 14, fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 모지가 선택한 것 */}
        {entry.chosenItem && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 20, marginBottom: 8,
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
          }}>
            <span style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>✦ 모지의 선택:</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{entry.chosenItem}</span>
          </div>
        )}

        {/* 별점 미리보기 */}
        {entry.rating && !isExpanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <StarRow value={entry.rating} readonly size={14} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.rating}점</span>
            {entry.ratingNote && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                · {entry.ratingNote}
              </span>
            )}
          </div>
        )}

        {entry.situation && (
          <p style={{
            fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {entry.situation}
          </p>
        )}

        {!isExpanded && (
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(124,58,237,0.06)', marginBottom: 12 }}>
            <p style={{
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {preview}...
            </p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {isExpanded ? '접기' : '전체 보기'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>

      {/* 펼쳐진 내용 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              {/* 전체 분석 내용 */}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                {entry.result}
              </p>

              {/* 별점 섹션 */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                {!editingRating ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>만족도</p>
                      {entry.rating ? (
                        <div>
                          <StarRow value={entry.rating} readonly size={18} />
                          {entry.ratingNote && (
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5, lineHeight: 1.5 }}>
                              &ldquo;{entry.ratingNote}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>아직 별점이 없어요</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingRating(true); setDraftRating(entry.rating ?? 0); setDraftNote(entry.ratingNote ?? ''); }}
                      style={{
                        fontSize: 12, color: '#A78BFA', background: 'rgba(124,58,237,0.08)',
                        border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8,
                        padding: '5px 10px', cursor: 'pointer',
                      }}
                    >
                      {entry.rating ? '수정하기' : '별점 남기기'}
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>만족도를 선택해주세요</p>
                    <StarRow value={draftRating} onChange={setDraftRating} size={24} />

                    {draftRating > 0 && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 10 }}>
                        <textarea
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          placeholder="결과가 어땠나요? (선택사항)"
                          maxLength={200}
                          rows={2}
                          className="input-field"
                          style={{ fontSize: 13, resize: 'none', marginBottom: 10, lineHeight: 1.6 }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={handleSaveRating}
                            style={{
                              flex: 1, padding: '9px', borderRadius: 10, border: 'none',
                              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                              color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                            }}
                          >저장</button>
                          <button
                            onClick={() => setEditingRating(false)}
                            className="btn-ghost"
                            style={{ flex: 1, fontSize: 13 }}
                          >취소</button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { activeProfileId } = useUser();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setEntries(loadHistory(activeProfileId ?? undefined));
  }, [activeProfileId]);

  const handleClear = () => {
    if (activeProfileId) {
      clearHistoryForProfile(activeProfileId);
    } else {
      clearHistory();
    }
    setEntries([]);
    setShowClearConfirm(false);
  };

  const handleUpdate = useCallback((id: string, updates: Partial<HistoryEntry>) => {
    updateHistoryEntry(id, updates);
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const handleRequestDelete = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteHistoryEntry(deleteTarget.id);
    setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    if (expandedId === deleteTarget.id) setExpandedId(null);
    setDeleteTarget(null);
  }, [deleteTarget, expandedId]);

  const ratedCount = entries.filter((e) => e.rating).length;
  const avgRating = ratedCount > 0
    ? (entries.filter((e) => e.rating).reduce((sum, e) => sum + (e.rating ?? 0), 0) / ratedCount).toFixed(1)
    : null;

  const mojiMsg = entries.length === 0
    ? '아직 나한테 물어본 게 없네? 첫 고민을 들려줘! 🤔'
    : ratedCount === 0
    ? `내가 도와준 결정이 ${entries.length}개! 후기도 남겨줄래? 😊`
    : `평균 ${avgRating}점! ${Number(avgRating) >= 4 ? '도움이 됐다니 기뻐 🎉' : '다음엔 더 잘할게! 💪'}`;

  return (
    <>
    {/* ── 개별 삭제 확인 모달 ── */}
    <AnimatePresence>
      {deleteTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setDeleteTarget(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
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
            style={{ width: '100%', maxWidth: 360, padding: '24px 22px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p style={{ fontSize: 22, textAlign: 'center', marginBottom: 12 }}>🗑️</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8 }}>
              기록을 삭제할까요?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
              <span style={{ color: '#A78BFA', fontWeight: 600 }}>{deleteTarget.name}</span> 기록이 삭제됩니다.<br />
              삭제하면 복구할 수 없어요.
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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} className="btn-ghost"
              style={{ width: 40, height: 40, padding: 0, borderRadius: 12, flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>결정 기록</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                최근 7일 · {entries.length}건
                {avgRating && ` · 평균 ${avgRating}점`}
              </p>
            </div>
          </div>
          {entries.length > 0 && (
            <button onClick={() => setShowClearConfirm(true)}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              전체 삭제
            </button>
          )}
        </div>

        {/* Moji greeting */}
        <div style={{ marginBottom: 24 }}>
          <MojiCharacter
            singleMessage={mojiMsg}
            size="sm"
            bubblePosition="right"
          />
        </div>

        {/* Clear confirm */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>
                모든 기록을 삭제할까요?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleClear} style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}>삭제</button>
                <button onClick={() => setShowClearConfirm(false)} className="btn-ghost" style={{ flex: 1, fontSize: 14 }}>취소</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {entries.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
              모지와 함께한 결정 기록이 여기에 쌓여요.<br />
              분석을 받으면 7일간 다시 볼 수 있어요.
            </p>
            <button className="btn-primary" onClick={() => router.push('/decide')} style={{ maxWidth: 240, margin: '0 auto' }}>
              첫 고민 물어보기
            </button>
          </motion.div>
        )}

        {/* History list */}
        {entries.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              총 {entries.length}개의 기록 {ratedCount > 0 && `· ${ratedCount}개에 별점 완료`}
            </p>
            <AnimatePresence mode="popLayout">
              {entries.map((entry) => (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  isExpanded={expandedId === entry.id}
                  onExpand={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  onUpdate={handleUpdate}
                  onRequestDelete={handleRequestDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {entries.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <button className="btn-primary" onClick={() => router.push('/decide')}>
              새 고민 물어보기
            </button>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
