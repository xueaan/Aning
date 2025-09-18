import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import {
  useAppStore,
  useTimelineStore,
  useTaskBoxStore,
  usePasswordStore,
  useHabitStore,
  useCardBoxStore,
  useKnowledgeStore,
  useBookStore,
} from '@/stores';
import { useMindBoardStore } from '@/stores/mindBoardStore';
import { Home } from '@/pages/Home';

// 懒加载非首屏组件
const Timeline = React.lazy(() =>
  import('@/pages/Timeline').then((m) => ({ default: m.Timeline }))
);
const Knowledge = React.lazy(() =>
  import('@/pages/Knowledge').then((m) => ({ default: m.Knowledge }))
);
const TaskBox = React.lazy(() => import('@/pages/TaskBox'));
const Habit = React.lazy(() => import('@/pages/Habit'));
const CardBox = React.lazy(() => import('@/pages/CardBox'));
const MindBoard = React.lazy(() =>
  import('@/pages/MindBoard').then((m) => ({ default: m.MindBoard }))
);
const PasswordManager = React.lazy(() =>
  import('@/components/features/password/PasswordManager').then((m) => ({
    default: m.PasswordManager,
  }))
);
const DialogueRoom = React.lazy(() =>
  import('@/components/modules/dialogue').then((m) => ({ default: m.DialogueRoom }))
);
const BookShelf = React.lazy(() => import('@/pages/BookShelf'));
// keep imports referenced to satisfy noUnusedLocals during gradual migration
void (KnowledgeSearchInput as any);
void (PasswordSearchInput as any);

import { KnowledgeSearchInput } from '@/components/modules/knowledge/KnowledgeSearchInput';
import { PasswordSearchInput } from '@/components/modules/password/PasswordSearchInput';
import { TimelineDateSwitcher } from '@/components/modules/timeline/TimelineDateSwitcher';
import { PageTransition } from '../common/PageTransition';
import {
  Search,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Chrome,
  MonitorStop,
  LayoutGrid,
  DatabaseZap,
  X,
  List,
  TrendingUp,
  WalletCards,
  Network,
  BarChart3,
} from 'lucide-react';
import { KnowledgeBaseSelector } from '@/components/common/KnowledgeBaseSelector';
import { TaskViewTabs } from '@/components/modules/taskbox/TaskViewTabs';
import { CardBoxSelector } from '@/components/common/CardBoxSelector';
import { CreateKnowledgeBaseModal } from '@/components/modals/CreateKnowledgeBaseModal';
import { EditKnowledgeBaseModal } from '@/components/modals/EditKnowledgeBaseModal';
import { EditCardBoxModal } from '@/components/modals/EditCardBoxModal';
import { CreateCardBoxModal } from '@/components/modals/CreateCardBoxModal';
import { HabitForm } from '@/components/features/habit/HabitForm';
import { isTauriEnvironment, showBrowserLimitation } from '@/utils/environmentUtils';
import { WindowControls } from '@/components/modules/window/WindowControls';

export const MainContent: React.FC = () => {
  const [appWindow, setAppWindow] = useState<any>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // 在 useEffect 中安全地获取 webview window
  useEffect(() => {
    const initializeWindow = () => {
      const isInTauri = isTauriEnvironment();

      if (isInTauri) {
        try {
          const window = getCurrentWebviewWindow();
          setAppWindow(window);
        } catch (error) {
          setAppWindow(null);
        }
      } else {
        showBrowserLimitation('窗口控制功能');
      }
    };

    initializeWindow();
  }, []);

  // 监听窗口最大化状态
  useEffect(() => {
    if (!appWindow) return;

    const checkMaximized = async () => {
      try {
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error('Failed to check maximized state:', error);
      }
    };

    checkMaximized();

    // 监听窗口大小变化事件
    const unlisten = appWindow.onResized?.(async () => {
      checkMaximized();
    });

    return () => {
      unlisten?.then((fn: any) => fn?.());
    };
  }, [appWindow]);

  // 窗口控制函数
  const handleMinimize = useCallback(async () => {
    if (appWindow) {
      try {
        await appWindow.minimize();
      } catch (error) {
        console.error('Failed to minimize window:', error);
      }
    }
  }, [appWindow]);

  const handleMaximize = useCallback(async () => {
    if (appWindow) {
      try {
        await appWindow.toggleMaximize();
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error('Failed to toggle maximize:', error);
      }
    }
  }, [appWindow]);

  const handleClose = useCallback(async () => {
    if (appWindow) {
      try {
        await appWindow.close();
      } catch (error) {
        console.error('Failed to close window:', error);
      }
    }
  }, [appWindow]);

  const {
    currentModule,
    sidebarOpen,
    toggleSidebar,
    navigationHistory,
    navigationIndex,
    navigateBack,
    navigateForward,
  } = useAppStore();

  // TaskBox store for task-related functionality
  const {
    currentView: currentTaskView,
    setCurrentView: setCurrentTaskView,
    getTaskStats,
  } = useTaskBoxStore();

  // Get task counts for badges
  const taskStats = getTaskStats();
  const { inboxCount, todayCount, upcomingCount, overdueCount, completedCount } = useMemo(() => ({
    inboxCount: taskStats.inbox,
    todayCount: taskStats.today,
    upcomingCount: taskStats.upcoming,
    overdueCount: taskStats.overdue,
    completedCount: taskStats.completed,
  }), [taskStats.inbox, taskStats.today, taskStats.upcoming, taskStats.overdue, taskStats.completed]);

  // Handle task view change
  const handleTaskViewChange = useCallback((view: 'inbox' | 'today' | 'upcoming' | 'overdue' | 'completed') => {
    setCurrentTaskView(view);
  }, [setCurrentTaskView]);

  const { currentDate, changeDate, setCurrentDate, toggleViewMode } = useTimelineStore();

  // Knowledge store
  useKnowledgeStore();

  const { selectedCategory, selectCategory, categories, searchQuery, searchEntries, clearSearch } =
    usePasswordStore();

  const { currentView: habitView, setCurrentView: setHabitView, createHabit } = useHabitStore();

  // CardBox store references
  const { searchQuery: cardBoxSearchQuery, searchCards: searchCardBoxCards } = useCardBoxStore();

  // BookShelf store
  const { searchQuery: bookShelfSearchQuery, searchBooks: searchBookShelfBooks } = useBookStore();

  // MindBoard store references
  const { searchTerm: mindBoardSearchTerm, setSearchTerm: setMindBoardSearchTerm } =
    useMindBoardStore();

  // Handle habit creation
  const handleHabitSubmit = async (habitData: any) => {
    try {
      await createHabit(habitData);
      setShowHabitCreateModal(false);
    } catch (error) {
      console.error('创建习惯失败:', error);
    }
  };

  // 监听窗口状态变化
  useEffect(() => {
    // 检查是否在Tauri环境中
    if (!appWindow) {
      return;
    }

    const checkMaximized = async () => {
      try {
        await appWindow.isMaximized();
      } catch (error) {
        console.error('检查窗口状态失败:', error);
      }
    };

    checkMaximized();

    const unlisten = appWindow.listen('tauri://resize', async () => {
      try {
        await appWindow.isMaximized();
      } catch (error) {
        console.error('监听窗口状态变化失败:', error);
      }
    });

    return () => {
      unlisten.then((fn: () => void) => fn());
    };
  }, [appWindow]);

  // Knowledge 相关状态
  const [showKnowledgeCreateModal, setShowKnowledgeCreateModal] = useState(false);
  const [showKnowledgeEditModal, setShowKnowledgeEditModal] = useState(false);
  const [editingKnowledgeBase, setEditingKnowledgeBase] = useState<any>(null);
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');

  // CardBox 相关状态
  const [showCardBoxCreateModal, setShowCardBoxCreateModal] = useState(false);
  const [showCardBoxEditModal, setShowCardBoxEditModal] = useState(false);
  const [editingCardBox, setEditingCardBox] = useState<any>(null);

  // Habit 相关状态
  const [showHabitCreateModal, setShowHabitCreateModal] = useState(false);

  const getModuleTitle = () => {
    const titles = {
      home: '',
      editor: '',
      timeline: '',
      knowledge: '',
      cardbox: '',
      taskbox: '',
      habit: '',
      password: '',
      dialogue: '',
      mindboard: '',
      bookshelf: '',
    } as Record<string, string>;
    return titles[currentModule as unknown as string] || '';
  };

  // 格式化日期显示
  const formatDisplayDate = (date: Date) => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];

    // 计算周数
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    return `${weekday} W${weekNumber}`;
  };

  // 导航按钮状态计算（增强边界检查）
  const canGoBack = useMemo(() => (
    navigationHistory && navigationHistory.length > 0 && navigationIndex > 0
  ), [navigationHistory, navigationIndex]);
  const canGoForward = useMemo(() => (
    navigationHistory && navigationHistory.length > 0 && navigationIndex < navigationHistory.length - 1
  ), [navigationHistory, navigationIndex]);

  // 调试信息
  useEffect(() => {
    console.log('[MainContent] 导航状态:', {
      historyLength: navigationHistory?.length,
      currentIndex: navigationIndex,
      canGoBack,
      canGoForward,
      currentModule,
    });
  }, [navigationHistory, navigationIndex, canGoBack, canGoForward, currentModule]);

  // 添加键盘快捷键支持 (Alt+Left/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'ArrowLeft' && canGoBack) {
          e.preventDefault();
          navigateBack();
        } else if (e.key === 'ArrowRight' && canGoForward) {
          e.preventDefault();
          navigateForward();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, canGoForward, navigateBack, navigateForward]);

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(var(--bg-primary), 0.05)',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
      }}
    >
      {/* 顶部标题栏 - 作为窗口标题栏 */}
      <header
        className="titlebar flex items-center justify-between px-4 py-2"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-2">
          {/* 导航按钮 */}
          <button
            onClick={toggleSidebar}
            className="titlebar-nav-button"
            title={sidebarOpen ? '折叠侧边栏' : '展开侧边栏'}
          >
            <PanelLeftOpen
              size={16}
              className={`transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <button
            onClick={navigateBack}
            disabled={!canGoBack}
            className={`titlebar-nav-button ${canGoBack ? '' : 'disabled'}`}
            title="后退"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={navigateForward}
            disabled={!canGoForward}
            className={`titlebar-nav-button ${canGoForward ? '' : 'disabled'}`}
            title="前进"
          >
            <ChevronRight size={16} />
          </button>

          {/* 分隔线 */}
          <div className="w-px h-6 bg-border-primary mx-2"></div>

          {/* 模块特定控件 */}
          <div className="flex items-center gap-2">
            {currentModule === 'knowledge' ? (
              <>
                <KnowledgeBaseSelector
                  onCreateKnowledgeBase={() => setShowKnowledgeCreateModal(true)}
                  onEditKnowledgeBase={(kb) => {
                    setEditingKnowledgeBase(kb);
                    setShowKnowledgeEditModal(true);
                  }}
                />
              </>
            ) : currentModule === 'cardbox' ? (
              <>
                <CardBoxSelector
                  onCreateCardBox={() => setShowCardBoxCreateModal(true)}
                  onEditCardBox={(cardBox) => {
                    setEditingCardBox(cardBox);
                    setShowCardBoxEditModal(true);
                  }}
                />
              </>
            ) : currentModule === 'habit' ? (
              <div className="flex items-center gap-2">
                {/* 视图切换按钮 */}
                <div className="flex gap-0.5 theme-bg-secondary/30 rounded-lg p-0.5 backdrop-blur-sm">
                  <button
                    onClick={() => setHabitView('list')}
                    className={`p-1.5 rounded-md transition-all duration-200 ${
                      habitView === 'list'
                        ? 'theme-bg-accent theme-text-smart-contrast shadow-sm scale-105'
                        : 'theme-text-secondary hover:theme-text-primary, hover:theme-bg-secondary/50'
                    }`}
                    title="列表视图"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setHabitView('stats')}
                    className={`p-1.5 rounded-md transition-all duration-200 ${
                      habitView === 'stats'
                        ? 'theme-bg-accent theme-text-smart-contrast shadow-sm scale-105'
                        : 'theme-text-secondary hover:theme-text-primary, hover:theme-bg-secondary/50'
                    }`}
                    title="统计视图"
                  >
                    <TrendingUp size={16} />
                  </button>
                </div>
              </div>
            ) : null}

            {currentModule === 'timeline' && (
              <>
                <button
                  onClick={toggleViewMode}
                  className="theme-text-primary text-sm ml-2 hover:bg-hover-bg px-2 py-0.5 rounded transition-colors cursor-pointer"
                  title="点击切换视图"
                >
                  {formatDisplayDate(currentDate)}
                </button>
              </>
            )}

            {currentModule === 'taskbox' && (
              <>
                {/* 任务类型按钮组 - 移动到左侧 */}
                <TaskViewTabs
                  current={currentTaskView as any}
                  onChange={handleTaskViewChange}
                  counts={{
                    inbox: inboxCount,
                    today: todayCount,
                    upcoming: upcomingCount,
                    overdue: overdueCount,
                    completed: completedCount,
                  }}
                />
              </>
            )}

            {currentModule === 'password' && (
              <>
                <div className="w-px h-4 bg-border-primary mx-2"></div>

                {/* 密码分类快捷按钮 */}
                <div className="flex items-center gap-1">
                  {/* 全部分类按钮 */}
                  <button
                    onClick={() => selectCategory(undefined)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      !selectedCategory
                        ? 'theme-bg-accent theme-text-smart-contrast'
                        : 'theme-text-secondary hover:theme-bg-secondary'
                    }`}
                    title="全部"
                  >
                    <WalletCards size={16} />
                  </button>

                  <button
                    onClick={() => selectCategory(categories.find((c) => c.name === '网站'))}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedCategory?.name === '网站'
                        ? 'status-success theme-text-smart-contrast'
                        : 'theme-text-secondary hover:theme-bg-secondary'
                    }`}
                    title="网站"
                  >
                    <Chrome size={16} />
                  </button>

                  <button
                    onClick={() => selectCategory(categories.find((c) => c.name === '应用软件'))}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedCategory?.name === '应用软件'
                        ? 'status-info theme-text-smart-contrast'
                        : 'theme-text-secondary hover:theme-bg-secondary'
                    }`}
                    title="APP"
                  >
                    <LayoutGrid size={16} />
                  </button>

                  <button
                    onClick={() => selectCategory(categories.find((c) => c.name === '服务器'))}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedCategory?.name === '服务器'
                        ? 'status-warning theme-text-smart-contrast'
                        : 'theme-text-secondary hover:theme-bg-secondary'
                    }`}
                    title="Machine"
                  >
                    <MonitorStop size={16} />
                  </button>

                  <button
                    onClick={() => selectCategory(categories.find((c) => c.name === '数据库'))}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedCategory?.name === '数据库'
                        ? 'status-error theme-text-smart-contrast'
                        : 'theme-text-secondary hover:theme-bg-secondary'
                    }`}
                    title="Database"
                  >
                    <DatabaseZap size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 中间可拖动区域 */}
        <div className="flex-1" data-tauri-drag-region="true" onDoubleClick={handleMaximize}></div>

        <div className="flex items-center gap-2">
          {currentModule === 'timeline' ? (
            <>
              {/* 日期导航区 */}
              <TimelineDateSwitcher
                currentDate={currentDate}
                onPrev={() => changeDate(-1)}
                onNext={() => changeDate(1)}
                onChange={setCurrentDate}
              />
              <div className="w-px h-4 bg-border-primary mx-1"></div>
            </>
          ) : null}

          {/* Password 搜索和视图控制 */}
          {currentModule === 'password' && (
            <div className="flex items-center gap-2">
              <PasswordSearchInput
                value={searchQuery}
                onChange={(v) => (v ? searchEntries(v) : clearSearch())}
              />
              {/* 搜索框 */}
            </div>
          )}

          {/* Knowledge 知识库专属控制 */}
          {currentModule === 'knowledge' && (
            <div className="flex items-center gap-2">
              <KnowledgeSearchInput
                value={knowledgeSearchQuery}
                onChange={setKnowledgeSearchQuery}
              />
              {/* 页面搜索框 */}
            </div>
          )}

          {/* 数据概览按钮 - 移动到右侧 */}
          {currentModule === 'taskbox' && (
            <div className="flex items-center gap-1 mr-3">
              <button
                onClick={() => setCurrentTaskView('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all theme-border ${
                  currentTaskView === 'dashboard'
                    ? 'theme-bg-accent theme-text-smart-contrast shadow-md'
                    : 'theme-text-primary hover:theme-bg-secondary/20, hover:theme-text-primary backdrop-blur-sm'
                }`}
                title="数据概览"
              >
                <BarChart3 className="w-4 h-4 text-current" />
                <span>数据概览</span>
              </button>
            </div>
          )}

          {/* BookShelf 搜索 */}
          {currentModule === 'bookshelf' && (
            <div className="flex items-center gap-2">
              {/* 搜索框 */}
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 theme-text-tertiary pointer-events-none"
                />
                <input
                  type="text"
                  value={bookShelfSearchQuery}
                  onChange={(e) => searchBookShelfBooks(e.target.value)}
                  placeholder="搜索书籍..."
                  className="pl-6 pr-8 py-1 w-48 rounded-md text-xs focus: outline-none focus:ring-1 focus:theme-ring-accent transition-all duration-200 theme-text-primary placeholder:theme-text-tertiary focus:w-56 bg-white/10 dark:bg-gray-900/20 backdrop-filter backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-gray-700/30 hover:bg-white/15 dark:hover:bg-gray-900/30 focus:bg-white/20 , dark:focus:bg-gray-900/40 shadow-lg shadow-black/5,dark:shadow-black/20"
                />
                {bookShelfSearchQuery && (
                  <button
                    onClick={() => searchBookShelfBooks('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 theme-text-tertiary hover:theme-text-primary p-0.5 rounded-sm, hover:theme-bg-secondary/50 transition-colors"
                    title="清除搜索"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CardBox 搜索和控制 */}
          {currentModule === 'cardbox' && (
            <div className="flex items-center gap-2">
              {/* 搜索框 */}
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 theme-text-tertiary pointer-events-none"
                />
                <input
                  type="text"
                  value={cardBoxSearchQuery}
                  onChange={(e) => searchCardBoxCards(e.target.value)}
                  placeholder="搜索笔记..."
                  className="pl-6 pr-8 py-1 w-48 rounded-md text-xs focus: outline-none focus:ring-1 focus:theme-ring-accent transition-all duration-200 theme-text-primary placeholder:theme-text-tertiary focus:w-56 bg-white/10 dark:bg-gray-900/20 backdrop-filter backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-gray-700/30 hover:bg-white/15 dark:hover:bg-gray-900/30 focus:bg-white/20 , dark:focus:bg-gray-900/40 shadow-lg shadow-black/5,dark:shadow-black/20"
                />
                {cardBoxSearchQuery && (
                  <button
                    onClick={() => searchCardBoxCards('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 theme-text-tertiary hover:theme-text-primary p-0.5 rounded-sm, hover:theme-bg-secondary/50 transition-colors"
                    title="清除搜索"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MindBoard 思维板专属控制 */}
          {currentModule === 'mindboard' && (
            <div className="flex items-center gap-2">
              {/* 搜索框 */}
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 transform -translate-y-1/2 theme-text-tertiary pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="搜索思维图..."
                  value={mindBoardSearchTerm}
                  onChange={(e) => setMindBoardSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-32 rounded-md text-xs focus: outline-none focus:ring-1 focus:theme-ring-accent transition-all duration-200 theme-text-primary placeholder:theme-text-tertiary focus:w-40 bg-white/10 dark:bg-gray-900/20 backdrop-filter backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-gray-700/30 hover:bg-white/15 dark:hover:bg-gray-900/30 focus:bg-white/20 , dark:focus:bg-gray-900/40 shadow-lg shadow-black/5,dark:shadow-black/20"
                />
                {mindBoardSearchTerm && (
                  <button
                    onClick={() => setMindBoardSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 theme-text-tertiary hover:theme-text-primary p-0.5 rounded-sm, hover:theme-bg-secondary/50 transition-colors"
                    title="清除搜索"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 窗口控制按钮 - 仅在Tauri环境中显示 */}
          <WindowControls
            isTauriEnv={isTauriEnvironment()}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onClose={handleClose}
            isMaximized={isMaximized}
          />
        </div>
      </header>

      {/* 主内容区域 */}
      <main
        className={`flex-1 ${currentModule === 'knowledge' ? 'overflow-hidden' : 'overflow-y-auto'}`}
      >
        <PageTransition routeKey={currentModule} transitionType="fade" className="h-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <div className="theme-text-secondary text-sm">加载中...</div>
                </div>
              </div>
            }
          >
            {currentModule === 'home' ? (
              <Home />
            ) : currentModule === 'timeline' ? (
              <Timeline />
            ) : currentModule === 'knowledge' ? (
              <Knowledge searchQuery={knowledgeSearchQuery} />
            ) : currentModule === 'cardbox' ? (
              <CardBox />
            ) : currentModule === 'taskbox' ? (
              <TaskBox />
            ) : currentModule === 'habit' ? (
              <Habit />
            ) : currentModule === 'password' ? (
              <PasswordManager />
            ) : currentModule === 'dialogue' ? (
              <DialogueRoom />
            ) : currentModule === 'mindboard' ? (
              <MindBoard />
            ) : currentModule === 'bookshelf' ? (
              <BookShelf />
            ) : (
              <div className="p-6">
                <DefaultModuleContent module={getModuleTitle()} />
              </div>
            )}
          </Suspense>
        </PageTransition>
      </main>

      {/* 编辑知识库弹窗 */}
      <EditKnowledgeBaseModal
        isOpen={showKnowledgeEditModal}
        onClose={() => {
          setShowKnowledgeEditModal(false);
          setEditingKnowledgeBase(null);
        }}
        knowledgeBase={editingKnowledgeBase}
      />

      {/* 编辑笔记盒弹窗 */}
      <EditCardBoxModal
        isOpen={showCardBoxEditModal}
        onClose={() => {
          setShowCardBoxEditModal(false);
          setEditingCardBox(null);
        }}
        cardBox={editingCardBox}
      />

      {/* 创建知识库弹窗 */}
      <CreateKnowledgeBaseModal
        isOpen={showKnowledgeCreateModal}
        onClose={() => setShowKnowledgeCreateModal(false)}
      />

      {/* 创建笔记盒弹窗 */}
      <CreateCardBoxModal
        isOpen={showCardBoxCreateModal}
        onClose={() => setShowCardBoxCreateModal(false)}
      />

      {/* 新建习惯浮动按钮 - 仅在habit模块显示 */}
      {currentModule === 'habit' && (
        <button
          onClick={() => setShowHabitCreateModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full theme-bg-accent theme-text-smart-contrast shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-50"
          title="新建习惯"
        >
          <Network size={16} />
        </button>
      )}

      {/* 新建习惯弹窗 */}
      <HabitForm
        isOpen={showHabitCreateModal}
        onClose={() => setShowHabitCreateModal(false)}
        onSubmit={handleHabitSubmit}
      />
    </div>
  );
};

const DefaultModuleContent: React.FC<{ module: string }> = React.memo(({ module }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-6xl theme-text-muted mb-4">📝</div>
        <h2 className="text-xl theme-text-secondary mb-2">{module}</h2>
        <p className="theme-text-tertiary">此模块功能正在开发中...</p>
      </div>
    </div>
  );
});

DefaultModuleContent.displayName = 'DefaultModuleContent';




