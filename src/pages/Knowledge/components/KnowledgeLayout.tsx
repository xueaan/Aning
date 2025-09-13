import React, { useState, useEffect } from 'react';
import { useKnowledgeOperations } from '@/stores/knowledgeStore';
import { KnowledgeTree } from './KnowledgeTree';
import { BlockEditor } from './BlockEditor';
import { KnowledgeEmptyState } from './KnowledgeEmptyState';
import { PagesCatalog } from './PagesCatalog';
import { CreateKnowledgeBaseModal } from '@/components/modals/CreateKnowledgeBaseModal';
import { FloatingOutline } from './FloatingOutline';
import type { OutlineItem } from './HeadingExtractor';
import { Plus, ChevronRight, ChevronDown, FileText } from 'lucide-react';

interface KnowledgeLayoutProps {
  searchQuery?: string;
}

export const KnowledgeLayout: React.FC<KnowledgeLayoutProps> = ({
  searchQuery: externalSearchQuery
}) => {
  const knowledgeOps = useKnowledgeOperations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateKnowledgeBaseModal, setShowCreateKnowledgeBaseModal] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300); // 默认256px,
  const [isResizing, setIsResizing] = useState(false);

  // 大纲相关状态
  const [headings, setHeadings] = useState<OutlineItem[]>([]);
  const [isOutlineVisible, setIsOutlineVisible] = useState(false);
  const [activeHeadingId, _setActiveHeadingId] = useState<string | null>(null);

  // 处理全局展开/折叠
  const handleToggleExpandAll = () => {
    if (knowledgeOps.expandedIds?.size === 0) {
      knowledgeOps.expandAll?.();
    } else {
      knowledgeOps.collapseAll?.();
    }
  };

  // 处理创建页面
  const handleCreate = async () => {
    if (!knowledgeOps.currentKnowledgeBase) return;

    try {
      const newTitle = `新页面 ${new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}`;
      const newId = await knowledgeOps.createPage?.(knowledgeOps.currentKnowledgeBase.id, newTitle);
      if (newId) {
        setSelectedId(newId);
      }
    } catch (error) {
      console.error('创建页面失败:', error);
    }
  };

  // 处理创建知识库
  const handleCreateKnowledgeBase = () => {
    setShowCreateKnowledgeBaseModal(true);
  };

  // 临时清理功能 - 测试用
  const handleCleanupData = async () => {
    try {
      const { DatabaseAPI } = await import('@/services/api/database');
      const updatedCount = await DatabaseAPI.cleanupUnnamedPages();
      console.log(`清理完成，更新了 ${updatedCount} 个页面`);
      // 刷新页面数据
      if (knowledgeOps.currentKnowledgeBase) {
        await knowledgeOps.loadPages?.(knowledgeOps.currentKnowledgeBase.id);
      }
    } catch (error) {
      console.error('清理失败:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      try {
        await knowledgeOps.loadKnowledgeBases?.();
      } catch (error) {
        console.error('加载知识库失败:', error);
      }
    };

    initData();
  }, [knowledgeOps.loadKnowledgeBases]);

  // 当选择知识库时加载页面并重置页面选择
  useEffect(() => {
    if (knowledgeOps.currentKnowledgeBase) {
      // 切换知识库时重置页面选择
      setSelectedId(null);

      const loadPages = async () => {
        try {
          await knowledgeOps.loadPages?.(knowledgeOps.currentKnowledgeBase!.id);
        } catch (error) {
          console.error('加载页面失败:', error);
        }
      };

      loadPages();
    } else {
      // 如果没有知识库，也重置页面选择
      setSelectedId(null);
    }
  }, [knowledgeOps.currentKnowledgeBase, knowledgeOps.loadPages]);

  // 当选择页面时加载块
  useEffect(() => {
    if (selectedId) {
      const loadPageBlocks = async () => {
        try {
          await knowledgeOps.loadBlocks?.(selectedId);
        } catch (error) {
          console.error('加载页面内容失败:', error);
        }
      };

      loadPageBlocks();
    }
  }, [selectedId, knowledgeOps.loadBlocks]);

  // 处理页面选择
  const handleSelect = (pageId: string) => {
    setSelectedId(pageId);
  };

  // 处理块数据变更
  const handleBlocksChange = async (newBlocks: any[]) => {
    if (!selectedId) return;

    try {
      // Note: Block updates are handled by individual components
      console.log('Blocks changed:', newBlocks);
    } catch (error) {
      console.error('保存页面内容失败:', error);
    }
  };

  // 处理侧边栏拖拽调整
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = Math.min(Math.max(200, e.clientX), 500); // 限制在200-500px之间
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('resizing-sidebar');
    };

    if (isResizing) {
      document.body.classList.add('resizing-sidebar');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing-sidebar');
    };
  }, [isResizing]);

  // 处理大纲相关功能
  const handleHeadingsChange = (newHeadings: OutlineItem[]) => {
    setHeadings(newHeadings);
  };

  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOutlineToggle = (visible: boolean) => {
    setIsOutlineVisible(visible);
  };

  return (
    <div className="h-full w-full flex relative overflow-hidden">
      {/* 左侧边栏 - flex布局 */}
      <div className="flex-shrink-0 z-40 h-full flex flex-col relative overflow-hidden"
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* 侧边栏内容 - 单层设计 */}
        <div className="theme-knowledge-sidebar-content">
          {/* 头部区域 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-sm font-medium text-white/70">
                知识目录
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleToggleExpandAll}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/8 text-white/50 hover:text-white/80 transition-colors"
              title={knowledgeOps.expandedIds?.size === 0 ? "展开全部" : "折叠全部"}
              >
              {knowledgeOps.expandedIds?.size === 0 ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            <button onClick={handleCreate}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/15 text-white/50 hover:text-blue-300 transition-colors"
            title="创建新页面"
              >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCleanupData}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-green-500/15 text-white/50 hover:text-green-300 transition-colors text-xs"
            title="清理历史数据"
              >
            🧹
          </button>
          <button onClick={async () => {
            if (knowledgeOps.currentKnowledgeBase) {
              await knowledgeOps.loadPages?.(knowledgeOps.currentKnowledgeBase.id);
            }
          }}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-500/15 text-white/50 hover:text-blue-300 transition-colors text-xs"
            title="刷新页面数据"
              >
            🔄
          </button>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">
        <KnowledgeTree onSelect={handleSelect} selectedId={selectedId}
        searchQuery={externalSearchQuery}
            />
      </div>
    </div>{/* 拖拽调整手柄 */ }
  <div className="knowledge-resize-handle"
    onMouseDown={handleMouseDown}
  />
      </div>{/* 主内容区 - flex自动分配剩余空间 */ }
  <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

  {/* 编辑器区域 */ }
  <div className="flex-1 flex h-full">
    {/* 条件渲染：空状态、目录视图或编辑器 */ }
{
  !knowledgeOps.currentKnowledgeBase || knowledgeOps.knowledgeBases?.length === 0 ? (
    <KnowledgeEmptyState hasKnowledgeBases={knowledgeOps.knowledgeBases?.length > 0} onCreateKnowledgeBase={handleCreateKnowledgeBase}
      onCreate={handleCreate}
            className="flex-1"
    />
  ) : !selectedId ? (
    <PagesCatalog onSelect={handleSelect} onCreate={handleCreate}
      onCreateKnowledgeBase={handleCreateKnowledgeBase} searchQuery={externalSearchQuery}
      className="flex-1"
    />
  ) : (
  /* BlockSuite 编辑器 */
  <BlockEditor knowledgeBaseId={knowledgeOps.currentKnowledgeBase?.id || ''} pageId={selectedId}
    initialBlocks={knowledgeOps.blocks || []} onBlocksChange={handleBlocksChange}
    onHeadingsChange={handleHeadingsChange} onOutlineToggle={handleOutlineToggle}
    isOutlineVisible={isOutlineVisible}
            className="flex-1"
  />
)
}
        </div>
      </div>{/* 加载状态遮罩 */ }
{
  knowledgeOps.isLoading && (
    <div className="absolute inset-0 theme-overlay flex items-center justify-center z-50">
      <div className="rounded-lg p-6 shadow-lg theme-card">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="theme-text-primary">加载中...</span>
        </div>
      </div>
    </div>
  )
}

{/* 浮动的新建页面按钮 - 只在有知识库时显示 */ }
{
  knowledgeOps.currentKnowledgeBase && (
    <button onClick={handleCreate}
            className="fixed bottom-6 right-6 w-14 h-14 theme-button-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center group hover:scale-105"
      title="新建页面"
    >
      <FileText size={24} 
            className="text-white transition-transform group-hover:rotate-12 duration-200" />
    </button>
  )
}

{/* 创建知识库模态框 */ }
<CreateKnowledgeBaseModal isOpen={showCreateKnowledgeBaseModal} onClose={() => setShowCreateKnowledgeBaseModal(false)}
/>

{/* 浮动大纲 - 在最外层渲染，避免定位问题 */ }
{
  isOutlineVisible && headings.length > 0 && (
    <FloatingOutline headings={headings} onHeadingClick={handleHeadingClick}
      activeHeadingId={activeHeadingId} isExpanded={true}
      onClose={() => setIsOutlineVisible(false)}
    />
  )
}
    </div>
  );
};










