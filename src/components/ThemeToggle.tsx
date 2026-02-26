'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      title={isLight ? '다크 모드로 전환' : '라이트 모드로 전환'}
      style={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top, 16px))',
        right: 20,
        zIndex: 9999,
        width: 40,
        height: 40,
        borderRadius: 12,
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
        background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'all 0.25s ease',
        fontSize: 18,
      }}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 30, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isLight ? '🌙' : '☀️'}
      </motion.span>
    </motion.button>
  );
}
