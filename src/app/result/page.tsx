'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loadPendingDecision, clearPendingDecision, saveToHistory, updateHistoryEntry } from '@/lib/storage';
import type { DecisionRequest, HistoryEntry } from '@/lib/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';

type Status = 'loading' | 'streaming' | 'done' | 'error';

// loading + streaming 모두 커버하는 메시지
const LOADING_MESSAGES = [
  '사진을 자세히 살펴보는 중이야... 🔍',
  '선택지들을 꼼꼼히 비교하고 있어... ⚖️',
  '효율성이랑 가성비를 따져보는 중이야... 💰',
  '네 상황에 가장 맞는 걸 찾고 있어... 🎯',
  '논리적인 근거를 정리하고 있어... 📝',
  '분석 내용을 정리하는 중이야... 📄',
  '최선의 선택을 결정하고 있어... ✨',
  '거의 다 됐어! 조금만 기다려줘... 🙏',
];

function parseChoice(text: string): string | null {
  const match = text.match(/★선택:\s*([^\n]+)/);
  return match ? match[1].trim() : null;
}

function parseUnanalyzable(text: string): boolean {
  return text.includes('★분석불가');
}

function parseReport(text: string): string {
  const lines = text.split('\n');
  // ### 헤딩 또는 이모지 섹션 제목 모두 인식
  const startIdx = lines.findIndex((l) =>
    l.startsWith('###') || /^[🎯⚡💰⭐✅⚠️📊💡]/u.test(l)
  );
  if (startIdx === -1) return '';
  return lines.slice(startIdx).join('\n');
}

export default function ResultPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { activeProfileId } = useUser();
  const [data, setData] = useState<DecisionRequest | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [streamedText, setStreamedText] = useState('');
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const savedRef = useRef(false);
  const savedEntryId = useRef<string | null>(null);

  // 별점 UI 상태
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingNote, setRatingNote] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // loading + streaming 둘 다 메시지 순환
  useEffect(() => {
    if (status === 'done' || status === 'error') return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const pending = loadPendingDecision();
    if (!pending) { router.replace('/decide'); return; }
    setData(pending);

    const controller = new AbortController();
    abortRef.current = controller;

    const analyze = async () => {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pending),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: '알 수 없는 오류' }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        setStatus('streaming');
        const reader = res.body?.getReader();
        if (!reader) throw new Error('스트리밍을 시작할 수 없습니다');

        const decoder = new TextDecoder();
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setStreamedText(fullText);
        }

        setStatus('done');
        clearPendingDecision();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
      }
    };

    analyze();
    return () => controller.abort();
  }, [router]);

  // 완료 시 히스토리 저장
  useEffect(() => {
    if (status === 'done' && data && streamedText && !savedRef.current) {
      savedRef.current = true;
      const chosen = parseChoice(streamedText);
      const entryId = crypto.randomUUID();
      savedEntryId.current = entryId;
      const entry: HistoryEntry = {
        id: entryId,
        createdAt: new Date().toISOString(),
        items: data.items,
        situation: data.situation,
        userProfile: data.userProfile,
        result: streamedText,
        chosenItem: chosen ?? undefined,
        profileId: activeProfileId ?? undefined,
      };
      saveToHistory(entry);
    }
  }, [status, data, streamedText]);

  const chosenItem = parseChoice(streamedText);
  const isUnanalyzable = parseUnanalyzable(streamedText);
  const reportText = parseReport(streamedText);

  return (
    <main className="page-container">
      <div style={{ paddingTop: 'max(48px, env(safe-area-inset-top, 48px))' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.push('/decide')} className="btn-ghost"
            style={{ width: 40, height: 40, padding: 0, borderRadius: 12, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>모지의 분석 결과</h1>
            {data && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{data.userProfile.name}님의 고민</p>}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ─── 로딩 & 스트리밍 중: 분석 완료 전까지 이 화면 유지 ─── */}
          {(status === 'loading' || status === 'streaming') && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              style={{ textAlign: 'center', paddingTop: 20, paddingBottom: 40 }}
            >
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-block', marginBottom: 20 }}
              >
                <Image src="/moji.png" alt="모지" width={120} height={120}
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 10px 24px rgba(124,58,237,0.5))' }} />
              </motion.div>

              {/* 상태 라벨 */}
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 600, color: '#A78BFA',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#A78BFA',
                    boxShadow: '0 0 6px #A78BFA', animation: 'pulse-dot 1.2s ease-in-out infinite',
                  }} />
                  {status === 'streaming' ? '분석 중...' : '연결 중...'}
                </span>
              </div>

              {/* 로딩 메시지 말풍선 */}
              <AnimatePresence mode="wait">
                <motion.div key={loadingMsgIdx}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: 'inline-block', background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.3)', borderRadius: 16,
                    padding: '12px 20px', marginBottom: 10,
                  }}
                >
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                    {LOADING_MESSAGES[loadingMsgIdx]}
                  </p>
                </motion.div>
              </AnimatePresence>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 36 }}>
                모지가 열심히 분석하는 중이야 🤔
              </p>

              {/* 스켈레톤 미리보기 */}
              <div style={{ textAlign: 'left' }}>
                <div className="skeleton" style={{ height: 90, borderRadius: 16, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 14, width: '85%', borderRadius: 6, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '65%', borderRadius: 6, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '75%', borderRadius: 6 }} />
              </div>
            </motion.div>
          )}

          {/* ─── 에러 ─── */}
          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Image src="/moji.png" alt="모지" width={80} height={80} style={{ objectFit: 'contain', opacity: 0.7 }} />
              </div>
              <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>연결 오류가 발생했어...</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>{errorMsg}</p>
                <button className="btn-primary" onClick={() => router.push('/decide')}>다시 시도하기</button>
              </div>
            </motion.div>
          )}

          {/* ─── 분석 완료 후 결과 전체 등장 ─── */}
          {status === 'done' && (
            <motion.div key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' as const }}
            >
              {/* 비교 대상 태그 */}
              {data && data.items.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                    비교 대상
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.items.map((item, i) => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 20,
                        background: chosenItem === item.name ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${chosenItem === item.name ? 'rgba(124,58,237,0.5)' : 'var(--border-subtle)'}`,
                      }}>
                        {item.imageBase64 && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageBase64} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }} />
                        )}
                        <span style={{ fontSize: 12, color: chosenItem === item.name ? '#A78BFA' : 'var(--text-secondary)', fontWeight: chosenItem === item.name ? 600 : 400 }}>
                          {item.name || `선택지 ${i + 1}`}
                        </span>
                        {chosenItem === item.name && <span style={{ fontSize: 10, color: '#A78BFA' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 모지의 선택 카드 ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                style={{ marginBottom: 14 }}
              >
                {/* 모지 + 말풍선 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                    <Image src="/moji.png" alt="모지" width={90} height={90}
                      style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 14px rgba(124,58,237,0.4))' }} />
                  </motion.div>
                  <div style={{
                    background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 14, borderBottomLeftRadius: 4, padding: '10px 14px', flex: 1,
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                      {(isUnanalyzable || !chosenItem)
                        ? '정확한 비교를 위해 정보를 분석하는 중 작은 오류가 발생했어요. 다시 한번만 업로드 부탁드릴게요! 🧐'
                        : '분석 완료! 내 선택을 알려줄게 👇'}
                    </p>
                  </div>
                </div>

                {/* 모지의 선택 박스 */}
                <div style={{
                  borderRadius: 18,
                  background: (isUnanalyzable || !chosenItem)
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))'
                    : 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.18))',
                  border: `1px solid ${(isUnanalyzable || !chosenItem) ? 'rgba(239,68,68,0.35)' : 'rgba(124,58,237,0.45)'}`,
                  padding: '20px 22px',
                }}>
                  <p style={{
                    fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: (isUnanalyzable || !chosenItem) ? '#f87171' : '#A78BFA', marginBottom: 10,
                  }}>
                    {(isUnanalyzable || !chosenItem) ? '⚠️ 분석 불가' : '✦ 모지의 선택'}
                  </p>

                  {(isUnanalyzable || !chosenItem) ? (
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      분석 결과를 불러오지 못했어요. 다시 시도해 주세요.
                    </p>
                  ) : (
                    <p style={{
                      fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em',
                      background: isLight
                        ? 'linear-gradient(135deg, #6D28D9, #DB2777)'
                        : 'linear-gradient(135deg, #A78BFA, #F9A8D4)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      lineHeight: 1.3, margin: 0,
                    }}>
                      {chosenItem}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* ── 모지의 분석 리포트 카드 ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.4 }}
                className="glass-card"
                style={{ padding: '20px 20px', marginBottom: 18 }}
              >
                <p style={{
                  fontSize: 14, fontWeight: 700, color: 'var(--text-muted)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16,
                }}>
                  📋 모지의 분석 리포트
                </p>
                {reportText ? (
                  <div className="markdown-content">
                    <ReportMarkdown text={reportText} />
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    분석 내용을 불러오지 못했어요. 다시 시도해 주세요.
                  </p>
                )}
              </motion.div>

              {/* 액션 버튼 */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.35 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <button className="btn-primary" onClick={() => router.push('/decide')}>새 고민 들고 오기</button>
                <button className="btn-ghost" style={{ width: '100%' }} onClick={() => router.push('/history')}>
                  모지의 결정 기록 보기
                </button>
              </motion.div>

              {/* ── 별점 & 후기 카드 ── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="glass-card"
                style={{ padding: '20px', marginTop: 4 }}
              >
                <AnimatePresence mode="wait">
                  {!ratingSubmitted ? (
                    <motion.div key="rating-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        모지의 선택, 얼마나 도움이 됐나요?
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                        별점을 남기면 다음번에 더 잘 도와줄 수 있어요 ✦
                      </p>

                      {/* 별점 선택 */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '4px', borderRadius: 8,
                              fontSize: 32,
                              filter: (hoverRating || rating) >= star
                                ? 'none'
                                : 'grayscale(1) opacity(0.3)',
                              transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>

                      {rating > 0 && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                          {/* 후기 메모 */}
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                            결과가 어땠나요? <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>(선택사항)</span>
                          </p>
                          <textarea
                            value={ratingNote}
                            onChange={(e) => setRatingNote(e.target.value)}
                            placeholder="예) 실제로 사봤더니 만족스러웠어요! / 생각보다 별로였어요..."
                            maxLength={200}
                            rows={2}
                            className="input-field"
                            style={{ fontSize: 13, resize: 'none', marginBottom: 12, lineHeight: 1.6 }}
                          />
                          <button
                            onClick={() => {
                              if (!savedEntryId.current) return;
                              updateHistoryEntry(savedEntryId.current, {
                                rating,
                                ratingNote: ratingNote.trim() || undefined,
                              });
                              setRatingSubmitted(true);
                            }}
                            style={{
                              width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                              color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                              boxShadow: '0 0 16px rgba(124,58,237,0.3)',
                              transition: 'all 0.2s',
                            }}
                          >
                            후기 남기기
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="rating-done"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ textAlign: 'center', padding: '8px 0' }}
                    >
                      <p style={{ fontSize: 22, marginBottom: 6 }}>🎉</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        고마워요! 잘 기억해둘게!
                      </p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {'⭐'.repeat(rating)} {rating}점 — 다음번엔 더 잘할게요 ✦
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </main>
  );
}

// 섹션 제목 판별: ### 헤딩 또는 이모지로 시작하는 짧은 줄 (bullet 아님)
const SECTION_TITLE_RE = /^(#{1,3}\s|[🎯⚡💰⭐✅⚠️📊💡])/u;

function ReportMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        // 섹션 제목
        if (SECTION_TITLE_RE.test(line) && !line.startsWith('- ') && line.trim().length < 30) {
          return (
            <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-heading)', marginTop: i === 0 ? 0 : 18, marginBottom: 6 }}>
              {line.replace(/^#{1,3}\s+/, '')}
            </h3>
          );
        }
        // bullet
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <ul key={i} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <span style={{ color: '#7C3AED', flexShrink: 0, marginTop: 2 }}>▸</span>
                <span>{renderInline(line.replace(/^[-•]\s+/, ''))}</span>
              </li>
            </ul>
          );
        }
        if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
        return (
          <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 5px' }}>
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : part
  );
}
