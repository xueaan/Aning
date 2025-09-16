import { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { useAppStore } from '@/stores';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/useTheme';
import { Sidebar } from '@/components/core/Sidebar';
import { MainContent } from '@/components/core/MainContent';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { Toast } from '@/components/common/Toast';

function App() {
  const { initializeApp, sidebarOpen, fontFamily, editorFontFamily } = useAppStore();

  useResponsive(); // Hook 会自动处理响应式逻辑
  const { currentGradient, noiseLevel } = useTheme();

  // 应用字体类
  useEffect(() => {
    const fontClasses: Record<string, string> = {
      system: 'font-system',
      'lxgw-neo-zhisong': 'font-lxgw-neo-zhisong',
      'lxgw-neo-xihei': 'font-lxgw-neo-xihei',
    };

    const editorFontClasses: Record<string, string> = {
      default: 'editor-font-default',
    };

    // 移除所有字体类
    Object.values(fontClasses).forEach((cls) => {
      document.documentElement.classList.remove(cls);
    });
    Object.values(editorFontClasses).forEach((cls) => {
      document.documentElement.classList.remove(cls);
    });

    // 添加当前字体类
    if (fontClasses[fontFamily]) {
      document.documentElement.classList.add(fontClasses[fontFamily]);
    }
    if (editorFontClasses[editorFontFamily]) {
      document.documentElement.classList.add(editorFontClasses[editorFontFamily]);
    }
  }, [fontFamily, editorFontFamily]);

  // 初始化应用
  useEffect(() => {
    const startupProcess = async () => {
      try {
        // 添加网络稳定性检查和重试机制
        const retryWithDelay = async (fn: () => Promise<any>, retries = 3, delay = 500) => {
          for (let i = 0; i < retries; i++) {
            try {
              return await fn();
            } catch (error: any) {
              if (error?.message?.includes('ERR_NETWORK_CHANGED') && i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 1.5; // 递增延迟
              } else {
                throw error;
              }
            }
          }
        };

        // 并行初始化数据，带重试机制
        const [appInitResult] = await Promise.allSettled([
          retryWithDelay(() => initializeApp()),
          new Promise((resolve) => setTimeout(resolve, 50)), // 最小显示时间
        ]);

        if (appInitResult.status === 'rejected') {
          console.error('应用初始化失败:', appInitResult.reason);
        } else {
        }

        // 显示环境信息
        const { isTauriEnvironment, showEnvironmentBanner } = await import(
          '@/utils/environmentUtils'
        );
        showEnvironmentBanner();

        // 确保窗口显示（仅在Tauri环境中）
        try {
          if (isTauriEnvironment()) {
            const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
            const mainWindow = getCurrentWebviewWindow();
            if (mainWindow) {
              // 确保窗口可见和获得焦点
              await mainWindow.show();
              await mainWindow.setFocus();
            }
          }
        } catch (windowError: unknown) {
          console.warn('窗口操作跳过:', (windowError as Error).message);
        }
      } catch (error) {
        console.error('应用启动失败:', error);
      }
    };

    // 监听网络状态变化
    const handleOnline = () => {};
    const handleOffline = () => {};

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    startupProcess();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initializeApp]);

  return (
    <TooltipProvider>
      <DndProvider backend={HTML5Backend}>
        <div
          className="h-screen theme-text-primary overflow-hidden relative theme-gradient-bg with-noise"
          style={
            {
              '--gradient-theme':
                currentGradient?.gradient ||
                'linear-gradient(135deg, rgba(102, 126, 234, 1) 0%, rgba(240, 147, 251, 1) 50%, rgba(245, 87, 108, 1) 100%)',
              '--bg-gradient-opacity-local': 1, // 现在由混合色控制强度
              '--noise-opacity': Math.max(0.1, Math.min(1, noiseLevel / 50)),
            } as React.CSSProperties
          }
        >
          {/* 全局确认对话框 */}
          <ConfirmDialog />

          {/* 全局Toast通知 */}
          <Toast />

          {/* 装饰效果 */}
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none">
            <div className="absolute inset-0 bg-gradient-radial from-white/20 to-transparent blur-3xl animate-pulse opacity-50" />
          </div>
          <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none">
            <div className="absolute inset-0 bg-gradient-radial from-white/20 to-transparent blur-3xl animate-pulse animation-delay-2000 opacity-50" />
          </div>
          <div className="h-full flex overflow-hidden relative">
            {/* 左侧边栏 - 响应式，小屏幕自动折叠 */}
            <div
              className={`transition-all duration-300 ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}
            >
              <Sidebar />
            </div>
            <MainContent />
          </div>
        </div>
      </DndProvider>
    </TooltipProvider>
  );
}

export default App;
