/**
 * 统一动画配置模块
 * 管理整个应用的动画参数、缓动函数和 Framer Motion variants
 */

// ===== 动画时长标准 =====
export const DURATIONS = {
  instant: 100, // 即时反馈 - hover、active 等微交互
  fast: 150, // 快速交互 - 按钮点击、简单状态变化
  normal: 250, // 标准动画 - 选中、展开收起
  slow: 350, // 复杂动画 - 布局变化、复合动画
  enter: 400, // 进入动画 - 页面切换、模态框
  slow_enter: 500, // 慢进入 - 复杂页面转场
} as const;

// ===== 缓动函数标准 =====
export const EASINGS = {
  linear: 'linear' as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  spring: [0.68, -0.55, 0.265, 1.55] as const,
  bounce: [0.175, 0.885, 0.32, 1.275] as const,
} as const;

// ===== Framer Motion 缓动配置 =====
export const SPRING_CONFIGS = {
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },
} as const;

// ===== 通用动画 Variants =====

// 按钮动画
export const buttonVariants = {
  idle: {
    scale: 1,
    opacity: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: DURATIONS.fast / 1000,
      ease: EASINGS.easeOut,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: DURATIONS.instant / 1000,
      ease: EASINGS.easeOut,
    },
  },
  disabled: {
    opacity: 0.5,
    scale: 1,
    transition: {
      duration: DURATIONS.fast / 1000,
    },
  },
} as const;

// 图标按钮动画
export const iconButtonVariants = {
  idle: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 2,
    transition: {
      duration: DURATIONS.fast / 1000,
      ease: EASINGS.easeOut,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: DURATIONS.instant / 1000,
    },
  },
} as const;

// 卡片动画
export const cardVariants = {
  idle: {
    scale: 1,
    y: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
    transition: {
      duration: DURATIONS.normal / 1000,
      ease: EASINGS.easeOut,
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: DURATIONS.instant / 1000,
    },
  },
} as const;

// 列表项动画
export const listItemVariants = {
  hidden: (index: number) => ({
    opacity: 0,
    y: 20,
    transition: {
      duration: DURATIONS.fast / 1000,
      delay: index * 0.05,
    },
  }),
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal / 1000,
      delay: index * 0.05,
      ease: EASINGS.easeOut,
    },
  }),
  hover: {
    x: 2,
    backgroundColor: 'var(--hover-bg-rgb, rgba(241, 245, 249, 0.5))',
    transition: {
      duration: DURATIONS.fast / 1000,
      ease: EASINGS.easeOut,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: DURATIONS.instant / 1000,
    },
  },
  idle: {
    x: 0,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  active: {
    x: 0,
    backgroundColor: 'var(--accent-bg-rgb, rgba(59, 130, 246, 0.1))',
    borderLeft: '3px solid var(--accent-rgb, rgb(59, 130, 246))',
    transition: SPRING_CONFIGS.gentle,
  },
} as const;

// 侧边栏动画
export const sidebarVariants = {
  expanded: (width: number) => ({
    width,
    transition: SPRING_CONFIGS.gentle,
  }),
  collapsed: {
    width: 60,
    transition: SPRING_CONFIGS.gentle,
  },
} as const;

// 模态框动画
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...SPRING_CONFIGS.gentle,
      duration: DURATIONS.enter / 1000,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: DURATIONS.normal / 1000,
      ease: EASINGS.easeInOut,
    },
  },
} as const;

// 背景遮罩动画
export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATIONS.normal / 1000,
      ease: EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATIONS.fast / 1000,
      ease: EASINGS.easeInOut,
    },
  },
} as const;

// 页面切换动画
export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATIONS.enter / 1000,
      ease: EASINGS.easeOut,
    },
  },
  out: {
    opacity: 0,
    y: -20,
    transition: {
      duration: DURATIONS.fast / 1000,
      ease: EASINGS.easeInOut,
    },
  },
} as const;

// 淡入淡出动画
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATIONS.normal / 1000,
      ease: EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: DURATIONS.fast / 1000,
      ease: EASINGS.easeInOut,
    },
  },
} as const;

// 滑动动画
export const slideVariants = {
  slideInLeft: {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: DURATIONS.normal / 1000,
        ease: EASINGS.easeOut,
      },
    },
  },
  slideInRight: {
    hidden: { x: 20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: DURATIONS.normal / 1000,
        ease: EASINGS.easeOut,
      },
    },
  },
  slideInUp: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: DURATIONS.normal / 1000,
        ease: EASINGS.easeOut,
      },
    },
  },
  slideInDown: {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: DURATIONS.normal / 1000,
        ease: EASINGS.easeOut,
      },
    },
  },
} as const;

// Stagger 动画配置
export const staggerConfigs = {
  fast: {
    staggerChildren: 0.05,
    delayChildren: 0.1,
  },
  normal: {
    staggerChildren: 0.1,
    delayChildren: 0.2,
  },
  slow: {
    staggerChildren: 0.15,
    delayChildren: 0.3,
  },
} as const;

// 列表容器动画（用于 stagger 效果）
export const listContainerVariants = {
  hidden: {},
  visible: {
    transition: staggerConfigs.fast,
  },
} as const;

// ===== CSS 动画类名 =====
export const CSS_ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
} as const;

// ===== 性能优化相关 =====
export const PERFORMANCE = {
  // GPU 加速属性（推荐用于动画的 CSS 属性）
  gpuAccelerated: ['transform', 'opacity', 'filter'] as const,

  // 避免使用这些属性做动画（会触发重排）
  avoidAnimating: ['width', 'height', 'top', 'left', 'margin', 'padding'] as const,

  // will-change 优化
  willChange: {
    transform: 'transform',
    opacity: 'opacity',
    auto: 'auto',
  } as const,
} as const;
