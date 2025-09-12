import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  /** 骨架屏宽�?*/
  width?: string | number;
  /** 骨架屏高�?*/
  height?: string | number;
  /** 是否为圆形骨架屏 */
  circle?: boolean;
  /** 自定义类�?*/
  className?: string;
  /** 动画类型 */
  animation?: 'pulse' | 'wave' | 'shimmer';
  /** 是否显示动画 */
  animate?: boolean;
}

// 动画变体
const pulseVariants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

const waveVariants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

const shimmerVariants = {
  initial: { 
    backgroundPosition: '-200px 0'
  },
  animate: {
    backgroundPosition: 'calc(200px + 100%) 0',
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: "linear" as const
    }
  }
};

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  circle = false,
  className = '',
  animation = 'pulse',
  animate = true
}) => {
  const baseStyles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  const baseClassName = `
    bg-bg-tertiary/30 
    ${circle ? 'rounded-full' : 'rounded'} 
    ${className}
  `.trim();

  if (!animate) {
    return (
      <div className={baseClassName} style={baseStyles}
      />
    );
  }

  switch (animation) {
    case 'wave':
      return (
        <div className={`relative overflow-hidden ${baseClassName}`}
          style={baseStyles}
        >
          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-bg-secondary/20 to-transparent"
            variants={waveVariants} initial="initial"
            animate="animate"
          />
        </div>
      );

    case 'shimmer':
      return (
        <motion.div className={baseClassName} style={{
            ...baseStyles,
            background: `
              linear-gradient(
                90deg,
                rgba(var(--color-bg-tertiary), 0.3) 25%,
                rgba(var(--color-bg-secondary), 0.4) 50%,
                rgba(var(--color-bg-tertiary), 0.3) 75%
              )
            `,
            backgroundSize: '200px 100%',
            backgroundRepeat: 'no-repeat'
          }}
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      );

    case 'pulse':
    default:
      return (
        <motion.div className={baseClassName} style={baseStyles}
          variants={pulseVariants} initial="initial"
          animate="animate"
        />
      );
  }
};

// 预设骨架屏组件
export const SkeletonCard: React.FC<{ animate?: boolean }> = ({ animate = true }) => (
  <div className="space-y-3 p-4 rounded-lg bg-bg-secondary/20">
    <Skeleton width="60%" height="1.25rem" animate={animate} />
    <div className="space-y-2">
      <Skeleton width="100%" height="0.875rem" animate={animate} />
      <Skeleton width="80%" height="0.875rem" animate={animate} />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton circle width={24} height={24} animate={animate} />
      <Skeleton width="30%" height="0.75rem" animate={animate} />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ 
  count?: number; 
  animate?: boolean;
  itemHeight?: string | number;
}> = ({ 
  count = 5, 
  animate = true,
  itemHeight = "3rem"
}) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, index) => (
      <motion.div key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary/10"
            style={{ minHeight: itemHeight }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Skeleton circle width={32} height={32} animate={animate} />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height="1rem" animate={animate} />
          <Skeleton width="40%" height="0.75rem" animate={animate} />
        </div>
      </motion.div>
    ))}
  </div>
);

export const SkeletonText: React.FC<{ 
  lines?: number;
  animate?: boolean;
}> = ({ lines = 3, animate = true }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton key={index} width={index === lines - 1 ? "70%" : "100%"}
        height="1rem"
        animate={animate}
      />
    ))}
  </div>
);










