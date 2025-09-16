import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores';

interface AnningLogoProps {
  className?: string;
}

export const AnningLogo: React.FC<AnningLogoProps> = ({ className = '' }) => {
  const { theme } = useAppStore();
  const [colorIndex, setColorIndex] = useState(0);

  // 动态颜色数组
  const isDark = theme === 'dark';
  const colorPalette = isDark
    ? [
        { color: '#E9D5FF', shadow: 'rgba(168, 85, 247, 0.5)' }, // 紫色
        { color: '#FBBF24', shadow: 'rgba(251, 191, 36, 0.4)' }, // 金色
        { color: '#34D399', shadow: 'rgba(52, 211, 153, 0.4)' }, // 绿色
        { color: '#F87171', shadow: 'rgba(248, 113, 113, 0.4)' }, // 红色
        { color: '#60A5FA', shadow: 'rgba(96, 165, 250, 0.4)' }, // 蓝色
        { color: '#A78BFA', shadow: 'rgba(167, 139, 250, 0.4)' }, // 靛色
      ]
    : [
        { color: '#FBBF24', shadow: 'rgba(251, 191, 36, 0.5)' }, // 金色
        { color: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.4)' }, // 紫色
        { color: '#10B981', shadow: 'rgba(16, 185, 129, 0.4)' }, // 绿色
        { color: '#EF4444', shadow: 'rgba(239, 68, 68, 0.4)' }, // 红色
        { color: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.4)' }, // 蓝色
        { color: '#F97316', shadow: 'rgba(249, 115, 22, 0.4)' }, // 橙色
      ];

  const currentColors = colorPalette[colorIndex];

  useEffect(() => {
    // 确保加载 Google Fonts
    if (!document.querySelector('link[href*="Caveat"]')) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // 颜色循环变化
  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colorPalette.length);
    }, 3000); // 每3秒变换一次颜色

    return () => clearInterval(interval);
  }, [colorPalette.length]);

  const letters = ['A', 'n', 'n', 'i', 'n', 'g'];

  return (
    <div className={`w-full flex items-center justify-center select-none ${className}`}>
      <motion.div
        className="handwriting-container flex items-center justify-center relative"
        animate={{
          color: currentColors.color,
          textShadow: `0 0 20px ${currentColors.shadow}`,
          filter: `drop-shadow(0 0 10px ${currentColors.shadow})`,
        }}
        transition={{
          duration: 1.5,
          ease: 'easeInOut',
        }}
        style={{
          fontFamily: '"Caveat", cursive',
          fontSize: '28px',
          fontWeight: 700,
          fontStyle: 'italic',
          letterSpacing: '4px',
          transform: 'rotate(-3deg)',
        }}
      >
        {letters.map((letter, index) => {
          // 每个字母的随机倾斜和缩放
          const rotations = [-5, -10, -3, -12, -6, -9];
          const scales = [1, 0.95, 1.05, 0.9, 1.02, 1.08];

          return (
            <motion.span
              key={`${letter}-${index}`}
              className="handwriting-letter"
              initial={{
                opacity: 0,
                y: 40,
                rotate: rotations[index] - 15,
                scale: scales[index] * 0.7,
              }}
              animate={{
                opacity: 1,
                y: 0,
                rotate: rotations[index],
                scale: scales[index],
              }}
              transition={{
                duration: 1,
                delay: index * 0.5 + 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
                type: 'spring',
                bounce: 0.3,
              }}
              whileHover={{
                scale: scales[index] * 1.1,
                rotate: rotations[index] + (Math.random() - 0.5) * 10,
                transition: { duration: 0.3, type: 'spring', bounce: 0.4 },
              }}
              style={{
                display: 'inline-block',
                transformOrigin: 'center bottom',
                marginRight: '6px',
                position: 'relative',
              }}
            >
              {letter}
            </motion.span>
          );
        })}

        {/* 装饰星星 */}
        <motion.span
          initial={{ opacity: 0, rotate: 0, scale: 0 }}
          animate={{
            opacity: 0.8,
            rotate: 360,
            scale: 1,
            color: currentColors.color,
          }}
          transition={{
            duration: 1.2,
            delay: 3.8,
            ease: 'backOut',
          }}
          style={{
            position: 'absolute',
            right: '10px',
            top: '-8px',
            fontSize: '14px',
            filter: `drop-shadow(0 0 8px ${currentColors.shadow})`,
          }}
        >
          ✨
        </motion.span>
      </motion.div>
    </div>
  );
};
