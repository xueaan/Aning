import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/stores';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ResponsiveState {
  windowWidth: number;
  windowHeight: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

// 断点定义（2025年显示器标准）
const BREAKPOINTS = {
  xs: 0,        // 极小窗口
  sm: 768,      // 小窗口模式  
  md: 1024,     // 中等窗口
  lg: 1440,     // 标准桌面
  xl: 1920,     // FHD全屏（主流起步）
  '2xl': 2560,  // 2K/QHD及以上
};

// 自动折叠阈值（适配笔记本窗口模式）
const AUTO_FOLD_THRESHOLDS = {
  rightPanel: 1280,  // < 1280px 时右侧栏自动折叠
  leftPanel: 1024,   // < 1024px 时左侧栏也自动折叠
};

export const useResponsive = () => {
  const { 
    setSidebarOpen, 
    setRightPanelOpen,
    setWindowWidth,
    setBreakpoint,
    userOverride,
    setUserOverride
  } = useAppStore();

  const [state, setState] = useState<ResponsiveState>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);
    
    return {
      windowWidth: width,
      windowHeight: height,
      breakpoint,
      isMobile: width < BREAKPOINTS.sm,
      isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      isLargeDesktop: width >= BREAKPOINTS.xl
    };
  });

  // 获取当前断点
  function getBreakpoint(width: number): Breakpoint {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);
    const prevBreakpoint = state.breakpoint;

    // 更新状态
    setState({
      windowWidth: width,
      windowHeight: height,
      breakpoint,
      isMobile: width < BREAKPOINTS.sm,
      isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      isLargeDesktop: width >= BREAKPOINTS.xl
    });

    // 更新 store
    setWindowWidth(width);
    setBreakpoint(breakpoint);

    // 自动折叠逻辑（仅在断点变化时触发）
    if (breakpoint !== prevBreakpoint) {
      handleAutoFold(width);
    }
  }, [state.breakpoint]);

  // 自动折叠处理
  const handleAutoFold = useCallback((width: number) => {
    // 右侧栏自动折叠
    if (width < AUTO_FOLD_THRESHOLDS.rightPanel && !userOverride?.rightSidebar) {
      setRightPanelOpen(false);
    } else if (width >= AUTO_FOLD_THRESHOLDS.rightPanel && !userOverride?.rightSidebar) {
      setRightPanelOpen(true);
    }

    // 左侧栏自动折叠
    if (width < AUTO_FOLD_THRESHOLDS.leftPanel && !userOverride?.leftSidebar) {
      setSidebarOpen(false);
    } else if (width >= AUTO_FOLD_THRESHOLDS.leftPanel && !userOverride?.leftSidebar) {
      setSidebarOpen(true);
    }
  }, [userOverride, setSidebarOpen, setRightPanelOpen]);

  // 手动切换侧边栏（记录用户操作）
  const toggleSidebarWithOverride = useCallback((isLeft: boolean) => {
    if (isLeft) {
      const newState = !useAppStore.getState().sidebarOpen;
      setSidebarOpen(newState);
      setUserOverride({ ...userOverride, leftSidebar: true });
      
      // 5秒后清除用户覆盖状态
      setTimeout(() => {
        setUserOverride({ ...userOverride, leftSidebar: false });
      }, 5000);
    } else {
      const newState = !useAppStore.getState().rightPanelOpen;
      setRightPanelOpen(newState);
      setUserOverride({ ...userOverride, rightSidebar: true });
      
      // 5秒后清除用户覆盖状态
      setTimeout(() => {
        setUserOverride({ ...userOverride, rightSidebar: false });
      }, 5000);
    }
  }, [userOverride, setSidebarOpen, setRightPanelOpen, setUserOverride]);

  // 监听窗口大小变化
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    };

    // 初始化
    handleResize();

    // 添加监听器
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, [handleResize]);

  return {
    ...state,
    toggleSidebarWithOverride,
    breakpoints: BREAKPOINTS,
    autoFoldThresholds: AUTO_FOLD_THRESHOLDS
  };
};

// 导出工具函数
export const getBreakpointValue = (breakpoint: Breakpoint): number => {
  return BREAKPOINTS[breakpoint];
};

export const isBreakpointOrLarger = (current: Breakpoint, target: Breakpoint): boolean => {
  return BREAKPOINTS[current] >= BREAKPOINTS[target];
};

export const isBreakpointOrSmaller = (current: Breakpoint, target: Breakpoint): boolean => {
  return BREAKPOINTS[current] <= BREAKPOINTS[target];
};





