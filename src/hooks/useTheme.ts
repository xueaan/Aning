import { useCallback, useEffect, useMemo } from 'react';
import { useAppStore } from '@/stores';
import { getGradientTheme, GradientTheme } from '@/utils/gradientThemes';
import { processGradient } from '@/utils/colorBlend';

export interface UseThemeReturn {
  // 主题状态
  theme: 'light' | 'dark' | 'auto';
  currentTheme: 'light' | 'dark';
  gradientTheme: string;
  noiseLevel: number;
  gradientAngle: number;
  blendMode: number;
  
  // 当前渐变配置
  currentGradient: GradientTheme | undefined;
  
  // 主题切换方法
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleTheme: () => void;
  
  // 渐变主题配置
  setGradientTheme: (themeId: string) => void;
  setNoiseLevel: (level: number) => void;
  setGradientAngle: (angle: number) => void;
  setBlendMode: (mode: number) => void;
  
  // 主题CSS变量
  getThemeStyles: () => React.CSSProperties;
  
  // 主题工具方法
  applyTheme: (element?: HTMLElement) => void;
  getThemeClass: (baseClass: string) => string;
}

export const useTheme = (): UseThemeReturn => {
  const {
    theme,
    gradientTheme,
    noiseLevel,
    gradientAngle,
    blendMode,
    setTheme,
    toggleTheme,
    setGradientTheme,
    setNoiseLevel,
    setGradientAngle,
    setBlendMode
  } = useAppStore();

  // 获取当前实际主题（处理auto模式）
  const currentTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  // 获取当前渐变配置（应用角度和混合色）
  const currentGradient = useMemo(() => {
    const theme = getGradientTheme(gradientTheme);
    if (!theme) return undefined;
    
    // 应用角度和混合色处理
    const processedGradient = processGradient(theme.gradient, blendMode, gradientAngle);
    
    return {
      ...theme,
      gradient: processedGradient
    };
  }, [gradientTheme, gradientAngle, blendMode]);

  // 生成主题CSS变量样式（注意：App.tsx 直接设置了这些变量，这个方法目前未使用）
  const getThemeStyles = useCallback((): React.CSSProperties => {
    const styles: any = {};
    
    if (currentGradient) {
      styles['--gradient-theme'] = currentGradient.gradient;
      // 透明度控制已经在 App.tsx 中正确实现
      // 这里保留方法但不设置透明度相关变量，避免冲突
    }

    return styles;
  }, [currentGradient]);

  // 应用主题到DOM元素（只处理主题切换，不设置渐变变量）
  const applyTheme = useCallback((element: HTMLElement = document.documentElement) => {
    // 设置主题属性
    element.setAttribute('data-theme', currentTheme);
    element.className = element.className.replace(/(^|\s)(light|dark)(\s|$)/g, ' ').trim();
    element.classList.add(currentTheme);
    
    // 注意：不再设置渐变相关CSS变量到全局，这些变量只在App.tsx的局部作用域中设置
  }, [currentTheme]);

  // 生成带主题前缀的CSS类
  const getThemeClass = useCallback((baseClass: string) => {
    return `${baseClass} theme-${currentTheme}`;
  }, [currentTheme]);

  // 监听系统主题变化（auto模式）
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  // 应用主题到DOM
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // 注释：移除全局CSS变量设置，渐变相关变量现在只在App.tsx的局部作用域中设置
  // 这样可以确保透明度只影响背景渐变，而不影响其他UI元素的透明度

  return {
    theme,
    currentTheme,
    gradientTheme,
    noiseLevel,
    gradientAngle,
    blendMode,
    currentGradient,
    setTheme,
    toggleTheme,
    setGradientTheme,
    setNoiseLevel,
    setGradientAngle,
    setBlendMode,
    getThemeStyles,
    applyTheme,
    getThemeClass
  };
};





