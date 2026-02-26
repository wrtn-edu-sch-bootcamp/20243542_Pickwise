'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface MojiCharacterProps {
  messages?: string[];
  singleMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  interval?: number;
  showBubble?: boolean;
  bubblePosition?: 'top' | 'right';
}

// 크기 업데이트 (전체적으로 크게)
const SIZES = { sm: 88, md: 120, lg: 164 };

export default function MojiCharacter({
  messages = [],
  singleMessage,
  size = 'md',
  interval = 3500,
  showBubble = true,
  bubblePosition = 'top',
}: MojiCharacterProps) {
  const [idx, setIdx] = useState(0);
  // 사용자가 점을 클릭할 때 이 키를 바꿔서 타이머를 재시작시킴
  const [timerKey, setTimerKey] = useState(0);

  const allMessages = singleMessage ? [singleMessage] : messages;
  const hasMessages = showBubble && allMessages.length > 0;

  useEffect(() => {
    if (allMessages.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % allMessages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [allMessages.length, interval, timerKey]);

  // 점 클릭 시 해당 메시지로 이동 + 타이머 리셋
  const handleDotClick = useCallback((i: number) => {
    setIdx(i);
    setTimerKey((k) => k + 1);
  }, []);

  const imgSize = SIZES[size];

  const bubble = hasMessages && (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        initial={{ opacity: 0, scale: 0.88, y: bubblePosition === 'top' ? 6 : 0, x: bubblePosition === 'right' ? -6 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: bubblePosition === 'top' ? -4 : 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        style={{
          background: 'rgba(124, 58, 237, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          borderRadius: 16,
          padding: '12px 16px',
          maxWidth: bubblePosition === 'right' ? 240 : 290,
          position: 'relative',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-line' }}>
          {allMessages[idx]}
        </p>

        {/* 말풍선 꼬리 */}
        {bubblePosition === 'top' && (
          <span style={{
            position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '8px solid transparent', borderRight: '8px solid transparent',
            borderTop: '8px solid rgba(124, 58, 237, 0.3)',
          }} />
        )}
        {bubblePosition === 'right' && (
          <span style={{
            position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
            width: 0, height: 0,
            borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
            borderRight: '8px solid rgba(124, 58, 237, 0.3)',
          }} />
        )}

        {/* 클릭 가능한 점 인디케이터 */}
        {allMessages.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            {allMessages.map((_, i) => (
              <button
                key={i}
                onClick={() => handleDotClick(i)}
                aria-label={`${i + 1}번 메시지 보기`}
                style={{
                  width: i === idx ? 18 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: i === idx ? '#A78BFA' : 'rgba(167,139,250,0.3)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'block',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  if (bubblePosition === 'right') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ flexShrink: 0 }}
        >
          <Image src="/moji.png" alt="모지" width={imgSize} height={imgSize}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(124, 58, 237, 0.3))' }} />
        </motion.div>
        {/* 말풍선 높이를 고정해서 레이아웃이 튀지 않도록 */}
        <div style={{ minHeight: hasMessages ? 96 : 0, display: 'flex', alignItems: 'center' }}>
          {bubble}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* 말풍선 높이를 고정해서 아래 모지 이미지가 튀지 않도록 */}
      <div style={{ minHeight: hasMessages ? 96 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        {bubble}
      </div>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image src="/moji.png" alt="모지" width={imgSize} height={imgSize}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 10px 22px rgba(124, 58, 237, 0.4))' }} />
      </motion.div>
    </div>
  );
}
