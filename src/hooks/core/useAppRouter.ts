import { useAppStore } from '@/stores';
import { AppModule } from '@/types/common/base';

export const useAppRouter = () => {
  const {
    currentModule,
    navigationHistory,
    navigationIndex,
    setCurrentModule,
    navigateBack,
    navigateForward,
    clearHistory,
  } = useAppStore();

  const navigateTo = (module: AppModule) => {
    setCurrentModule(module);
  };

  const canGoBack = navigationIndex > 0;
  const canGoForward = navigationIndex < navigationHistory.length - 1;

  return {
    currentModule,
    navigationHistory,
    navigateTo,
    navigateBack,
    navigateForward,
    clearHistory,
    canGoBack,
    canGoForward,
  };
};
