import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores';
import { AppModule } from '@/types';
import {
  Clock,
  BookOpen,
  Brain,
  Edit2,
  CheckCircle2,
  Sun,
  Moon,
  LockKeyhole,
  Grid3X3,
  X,
  Circle,
  MessageSquare,
  Workflow,
  Settings
} from 'lucide-react';
import { ThemePicker } from '../common/ThemePicker';
import { AnningLogo } from '../common/AnningLogo';
import { CollapsedAnningLogo } from '../common/CollapsedAnningLogo';
import { SettingsModal } from '../modals/SettingsModal';
import { TodoWidget } from '@/components/widgets/TodoWidget';
import {
  sidebarVariants,
  listContainerVariants
} from '@/config/animation';

const modules = [
  { id: 'home', name: '标签', icon: Workflow },
  { id: 'timeline', name: '时光标', icon: Clock },
  { id: 'knowledge', name: '知识库', icon: BookOpen },
  { id: 'cardbox', name: '笔记盒', icon: Grid3X3 },
  { id: 'mindboard', name: '思维板', icon: Brain },
  { id: 'taskbox', name: '待办箱', icon: CheckCircle2 },
  { id: 'habit', name: '习惯圈', icon: Circle },
  { id: 'password', name: '密钥本', icon: LockKeyhole },
  { id: 'dialogue', name: '对话屋', icon: MessageSquare },
];

export const Sidebar: React.FC = () => {
  const {
    currentModule,
    setCurrentModule,
    theme,
    toggleTheme,
    sidebarOpen,
    leftSidebarWidth,
    setLeftSidebarWidth,
    settingsModalOpen,
    toggleSettingsModal
  } = useAppStore();

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    folderId: number | null;
    folderName: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    folderId: null,
    folderName: ''
  });

  // 左侧栏拖动状态
  const [isResizing, setIsResizing] = useState(false);

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  // 左侧栏拖动处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 280 && newWidth <= 800) {
        setLeftSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setLeftSidebarWidth]);

  return (
    <motion.div className={`h-full flex flex-col ${!isResizing ? 'transition-all duration-300' : ''} relative feather-glass-sidebar`}
      variants={sidebarVariants} custom={leftSidebarWidth}
      animate={sidebarOpen ? "expanded" : "collapsed"} initial={sidebarOpen ? "expanded" : "collapsed"}
    >
      {/* 拖动手柄 */}
      {sidebarOpen && (
        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-accent/30 bg-border-primary/20 transition-colors z-50"
          style={{ width: '4px' }}
          onMouseDown={handleMouseDown}
        />
      )}
      
      {/* 应用品牌展示区 */}
      <div className="px-3 py-2">
        <div className="group relative flex items-center rounded-xl overflow-hidden h-8">
          {sidebarOpen ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              
            className="flex-1 flex items-center justify-center h-full"
            >
              <div className="group">
                <AnningLogo />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 w-full flex items-center justify-center h-full"
            >
              <CollapsedAnningLogo />
            </motion.div>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <motion.div
          className="px-3 py-3"
          variants={listContainerVariants} initial="hidden"
          animate="visible"
        >
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = currentModule === module.id;

            return (
              <div key={module.id}
            className="mb-1"
              >
                <div className="group relative flex items-center rounded-xl overflow-hidden">
                  <button onClick={() => {
                      setCurrentModule(module.id as AppModule);
                    }}
                    
            className={`flex-1 flex items-center ${sidebarOpen ? 'gap-3 px-3 py-2' : 'px-2 py-2 justify-center'
                      } transition-all duration-300 ease-out relative rounded-xl ${isActive
                        ? 'theme-text-primary font-medium shadow-sm feather-glass-panel'
                        : 'theme-text-secondary hover:theme-text-primary hover:scale-[1.02]'
                      }`}
                    title={!sidebarOpen ? module.name : undefined}
                    style={{
                      transform: 'translateZ(0)'
                    }}
                  >
                    <div className={`transition-all duration-200 ${isActive ? 'theme-text-primary' : 'group-hover:scale-105 group-hover:rotate-1'
                      }`}>
                      <Icon size={16} />
                    </div>
                    {sidebarOpen && (
                      <span className={`text-sm transition-all duration-200 ${isActive ? 'theme-text-primary font-medium' : ''
                        }`}>
                        {module.name}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </motion.div>
        {sidebarOpen && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-2 h-full flex flex-col gap-2">
                {/* 今日待办 - 占满剩余高度 */}
                <div className="flex-1 min-h-0">
                  <TodoWidget />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      <div>
        <div className={`flex items-center gap-1 h-10 px-2 ${sidebarOpen ? 'justify-end' : 'justify-center'
          }`}>

          {/* 主题选择器 - 展开时显示 */}
          {sidebarOpen && <ThemePicker />}

          {/* 主题切换按钮 - 始终显示 */}
          <button onClick={toggleTheme}
            className="btn-toolbar w-8 h-8 flex items-center justify-center tooltip-up"
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {sidebarOpen && (
            <button onClick={toggleSettingsModal}
            className="btn-toolbar w-8 h-8 flex items-center justify-center tooltip-up"
              title="设置"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>
      {contextMenu.visible && (
        <div className="fixed z-50 py-1 rounded-lg min-w-[150px] feather-glass-dropdown"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => {
              setContextMenu({ ...contextMenu, visible: false });
            }}
            
            className="w-full px-3 py-2 text-left text-sm theme-text-secondary hover:theme-text-primary hover:theme-bg-primary/50 transition-colors flex items-center gap-2"
          >
            <Edit2 size={16} />
            <span>重命名</span>
          </button>
          <div className="h-px bg-border-primary my-1" />
          <button onClick={() => {
              if (contextMenu.folderId && contextMenu.folderName) {
                // handleDeleteFolder(contextMenu.folderId, contextMenu.folderName);
              }
              setContextMenu({ ...contextMenu, visible: false });
            }}
            
            className="w-full px-3 py-2 text-left text-sm theme-text-error hover:theme-bg-error/10 transition-colors flex items-center gap-2"
          >
            <X size={16} />
            <span>删除</span>
          </button>
        </div>
      )}

      {/* 设置弹窗 */}
      <SettingsModal isOpen={settingsModalOpen} onClose={() => toggleSettingsModal()}
      />
    </motion.div>
  );
};








