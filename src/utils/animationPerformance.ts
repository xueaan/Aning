/**
 * 动画性能优化工具
 */

// ===== 性能监测 =====

/**
 * 检测是否支持 CSS will-change 属性
 */
export const supportsWillChange = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const testEl = document.createElement('div');
  const prefixes = ['willChange', 'webkitWillChange', 'mozWillChange'];
  
  return prefixes.some(prefix => prefix in testEl.style);
};

/**
 * 检测是否支持硬件加速
 */
export const supportsHardwareAcceleration = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const testEl = document.createElement('div');
  testEl.style.transform = 'translateZ(0)';
  
  return testEl.style.transform !== '';
};

/**
 * 检测设备性能等级
 */
export const getDevicePerformanceLevel = (): 'low' | 'medium' | 'high' => {
  if (typeof window === 'undefined') return 'medium';
  
  // 检查硬件并发数
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  
  // 检查内存 (如果支持)
  const deviceMemory = (navigator as any).deviceMemory || 4;
  
  // 检查连接质量 (如果支持)
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  // 综合判断性能等级
  if (hardwareConcurrency >= 8 && deviceMemory >= 8 && effectiveType === '4g') {
    return 'high';
  } else if (hardwareConcurrency >= 4 && deviceMemory >= 4) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * 检测是否启用了减少动画偏好设置
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

// ===== 性能优化配置 =====

/**
 * 根据设备性能获取动画配置
 */
export const getPerformanceBasedAnimationConfig = () => {
  const performanceLevel = getDevicePerformanceLevel();
  const reducedMotion = prefersReducedMotion();
  
  if (reducedMotion) {
    return {
      enableAnimations: false,
      enableComplexAnimations: false,
      enableTransitions: true,
      animationDuration: 0,
      maxConcurrentAnimations: 0
    };
  }

  switch (performanceLevel) {
    case 'high':
      return {
        enableAnimations: true,
        enableComplexAnimations: true,
        enableTransitions: true,
        animationDuration: 1,
        maxConcurrentAnimations: 10
      };
    case 'medium':
      return {
        enableAnimations: true,
        enableComplexAnimations: false,
        enableTransitions: true,
        animationDuration: 0.8,
        maxConcurrentAnimations: 5
      };
    case 'low':
      return {
        enableAnimations: false,
        enableComplexAnimations: false,
        enableTransitions: true,
        animationDuration: 0.5,
        maxConcurrentAnimations: 2
      };
    default:
      return {
        enableAnimations: true,
        enableComplexAnimations: false,
        enableTransitions: true,
        animationDuration: 0.8,
        maxConcurrentAnimations: 5
      };
  }
};

// ===== 性能优化工具函数 =====

/**
 * 节流动画帧
 */
export const throttleAnimationFrame = (callback: () => void): (() => void) => {
  let ticking = false;
  
  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
};

/**
 * 防抖动画帧
 */
export const debounceAnimationFrame = (
  callback: () => void, 
  delay: number = 16
): (() => void) => {
  let timeoutId: number;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      requestAnimationFrame(callback);
    }, delay);
  };
};

/**
 * 优化的批量 DOM 更新
 */
export const batchDOMUpdates = (updates: (() => void)[]): Promise<void> => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
      resolve();
    });
  });
};

/**
 * 设置元素的 will-change 属性
 */
export const setWillChange = (
  element: HTMLElement, 
  properties: string[]
): (() => void) => {
  if (!supportsWillChange()) {
    return () => {}; // 不支持则返回空函数
  }

  const originalWillChange = element.style.willChange;
  element.style.willChange = properties.join(', ');
  
  // 返回清理函数
  return () => {
    element.style.willChange = originalWillChange;
  };
};

/**
 * 启用硬件加速
 */
export const enableHardwareAcceleration = (element: HTMLElement): (() => void) => {
  if (!supportsHardwareAcceleration()) {
    return () => {};
  }

  const originalTransform = element.style.transform;
  const currentTransform = getComputedStyle(element).transform;
  
  if (currentTransform === 'none') {
    element.style.transform = 'translateZ(0)';
  } else {
    element.style.transform = `${currentTransform} translateZ(0)`;
  }
  
  // 返回清理函数
  return () => {
    element.style.transform = originalTransform;
  };
};

/**
 * 动画性能监控
 */
export class AnimationPerformanceMonitor {
  private animationCount = 0;
  private maxAnimations: number;
  private performanceObserver?: PerformanceObserver;
  
  constructor(maxAnimations = 5) {
    this.maxAnimations = maxAnimations;
    this.initPerformanceObserver();
  }

  private initPerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') return;
    
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'measure' && entry.name.includes('animation')) {
          // Animation timing tracked
        }
      });
    });
    
    try {
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    } catch (e) {
      // Performance Observer not fully supported
    }
  }
  
  /**
   * 请求开始动画
   */
  requestAnimation(): boolean {
    if (this.animationCount >= this.maxAnimations) {
      return false;
    }

    this.animationCount++;
    return true;
  }
  
  /**
   * 动画结束
   */
  releaseAnimation(): void {
    this.animationCount = Math.max(0, this.animationCount - 1);
  }
  
  /**
   * 获取当前动画数量
   */
  getCurrentAnimationCount(): number {
    return this.animationCount;
  }
  
  /**
   * 销毁监控器
   */
  destroy(): void {
    this.performanceObserver?.disconnect();
  }
}

// ===== 全局性能监控实例 =====
export const globalAnimationMonitor = new AnimationPerformanceMonitor(
  getPerformanceBasedAnimationConfig().maxConcurrentAnimations
);

// ===== React Hook 相关 =====

/**
 * 获取优化的动画配置 Hook 使用的配置
 */
export const getOptimizedAnimationProps = () => {
  const config = getPerformanceBasedAnimationConfig();
  
  return {
    skipAnimations: !config.enableAnimations,
    skipComplexAnimations: !config.enableComplexAnimations,
    animationScale: config.animationDuration,
    maxConcurrentAnimations: config.maxConcurrentAnimations
  };
};

// ===== 调试工具 =====

/**
 * 动画调试信息
 */
export const logAnimationDebug = () => {
  // Debug info collection for development tools
  const debug = {
    devicePerformanceLevel: getDevicePerformanceLevel(),
    prefersReducedMotion: prefersReducedMotion(),
    supportsWillChange: supportsWillChange(),
    supportsHardwareAcceleration: supportsHardwareAcceleration(),
    animationConfig: getPerformanceBasedAnimationConfig(),
    currentAnimationCount: globalAnimationMonitor.getCurrentAnimationCount()
  };
  return debug;
};


