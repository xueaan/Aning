import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  /** 路由键值，用于识别页面切换 */
  routeKey: string;
  /** 子组件 */
  children: React.ReactNode;
  /** 转场类型 */
  transitionType?: 'slide' | 'fade' | 'scale' | 'slideUp';
  /** 自定义类名 */
  className?: string;
}

// 不同转场效果的变体
const transitionVariants = {
  // 滑动转场
  slide: {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 },
  },
  // 淡入淡出
  fade: {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  },
  // 缩放
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 1.05 },
  },
  // 向上滑动
  slideUp: {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  },
};

export const PageTransition: React.FC<PageTransitionProps> = ({
  routeKey,
  children,
  transitionType = 'fade',
  className = '',
}) => {
  const variants = transitionVariants[transitionType];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        className={`h-full w-full ${className}`}
        variants={variants}
        initial="initial"
        animate="in"
        exit="out"
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1], // ease-out
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
