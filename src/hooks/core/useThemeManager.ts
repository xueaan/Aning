import { useAppStore } from '@/stores';

export const useThemeManager = () => {
  const {
    theme,
    gradientTheme,
    noiseLevel,
    transparencyLevel,
    gradientAngle,
    blendMode,
    setTheme,
    toggleTheme,
    setGradientTheme,
    setNoiseLevel,
    setTransparencyLevel,
    setGradientAngle,
    setBlendMode
  } = useAppStore();

  const isDark = theme === 'dark' || (theme === 'auto' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches);

  const applyTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  return {
    theme,
    isDark,
    gradientTheme,
    noiseLevel,
    transparencyLevel,
    gradientAngle,
    blendMode,
    setTheme: applyTheme,
    toggleTheme,
    setGradientTheme,
    setNoiseLevel,
    setTransparencyLevel,
    setGradientAngle,
    setBlendMode
  };
};