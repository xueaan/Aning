import React, { useState, useEffect } from 'react';
import { useKnowledgeOperations } from '@/stores/knowledgeStore';
import { BlockEditor } from './BlockEditor';
import { KnowledgeEmptyState } from './KnowledgeEmptyState';
import { PagesCatalog } from './PagesCatalog';
import { CreateKnowledgeBaseModal } from '@/components/modals/CreateKnowledgeBaseModal';
import { FloatingOutline } from './FloatingOutline';
import { KnowledgeSidebar } from './KnowledgeSidebar';
import type { OutlineItem } from './HeadingExtractor';
import { FileText } from 'lucide-react';

interface KnowledgeLayoutProps {
  searchQuery?: string;
}

export const KnowledgeLayout: React.FC<KnowledgeLayoutProps> = ({
  searchQuery: externalSearchQuery,
}) => {
  const knowledgeOps = useKnowledgeOperations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateKnowledgeBaseModal, setShowCreateKnowledgeBaseModal] = useState(false);

  // 大纲相关状态
  const [headings, setHeadings] = useState<OutlineItem[]>([]);
  const [isOutlineVisible, setIsOutlineVisible] = useState(false);
  const [activeHeadingId, _setActiveHeadingId] = useState<string | null>(null);

  // 知识目录相关状态
  const [isKnowledgeTreeVisible, setIsKnowledgeTreeVisible] = useState(false);

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

  // 初始化数据 - 使用新的智能默认选择逻辑
  useEffect(() => {
    const initData = async () => {
      try {
        await knowledgeOps.initializeKnowledge?.();
      } catch (error) {
        console.error('初始化知识库失败:', error);
      }
    };

    initData();
  }, [knowledgeOps.initializeKnowledge]);

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
    // 不再自动关闭知识目录，保持显示状态
  };

  // 处理块数据变更
  const handleBlocksChange = async (_newBlocks: any[]) => {
    if (!selectedId) return;

    try {
      // Note: Block updates are handled by individual components
    } catch (error) {
      console.error('保存页面内容失败:', error);
    }
  };

  // 处理大纲相关功能
  const handleHeadingsChange = (newHeadings: OutlineItem[]) => {
    setHeadings(newHeadings);
  };

  const handleHeadingClick = (headingId: string) => {
    // 直接通过ID查找元素
    const element = document.getElementById(headingId);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    } else {
      console.warn(`Element with ID "${headingId}" not found`);
    }
  };

  const handleOutlineToggle = (visible: boolean) => {
    setIsOutlineVisible(visible);
  };

  const handleKnowledgeTreeToggle = (visible: boolean) => {
    setIsKnowledgeTreeVisible(visible);
  };

  return (
    <div className="h-full w-full flex relative overflow-hidden">
      {/* 左侧目录侧边栏 */}
      {isKnowledgeTreeVisible && knowledgeOps.currentKnowledgeBase && (
        <KnowledgeSidebar
          onClose={() => setIsKnowledgeTreeVisible(false)}
          selectedPageId={selectedId}
          onPageSelect={handleSelect}
        />
      )}

      {/* 主内容区 - 根据目录显示状态自适应宽度 */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* 编辑器区域 */}
        <div className="flex-1 flex h-full">
          {/* 条件渲染：空状态、目录视图或编辑器 */}
          {!knowledgeOps.currentKnowledgeBase || knowledgeOps.knowledgeBases?.length === 0 ? (
            <KnowledgeEmptyState
              hasKnowledgeBases={knowledgeOps.knowledgeBases?.length > 0}
              onCreateKnowledgeBase={handleCreateKnowledgeBase}
              onCreate={handleCreate}
              className="flex-1"
            />
          ) : !selectedId ? (
            <PagesCatalog
              onSelect={handleSelect}
              onCreate={handleCreate}
              onCreateKnowledgeBase={handleCreateKnowledgeBase}
              searchQuery={externalSearchQuery}
              className="flex-1"
            />
          ) : (
            /* BlockSuite 编辑器 */
            <BlockEditor
              knowledgeBaseId={knowledgeOps.currentKnowledgeBase?.id || ''}
              pageId={selectedId}
              initialBlocks={knowledgeOps.blocks || []}
              onBlocksChange={handleBlocksChange}
              onHeadingsChange={handleHeadingsChange}
              onOutlineToggle={handleOutlineToggle}
              isOutlineVisible={isOutlineVisible}
              onKnowledgeTreeToggle={handleKnowledgeTreeToggle}
              isKnowledgeTreeVisible={isKnowledgeTreeVisible}
              className="flex-1"
            />
          )}
        </div>
      </div>

      {/* 加载状态遮罩 */}
      {knowledgeOps.isLoading && (
        <div className="absolute inset-0 theme-overlay flex items-center justify-center z-50">
          <div className="rounded-lg p-6 shadow-lg theme-card">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="theme-text-primary">加载中...</span>
            </div>
          </div>
        </div>
      )}

      {/* 浮动的新建页面按钮 - 只在有知识库时显示 */}
      {knowledgeOps.currentKnowledgeBase && (
        <button
          onClick={handleCreate}
          className="fixed bottom-6 right-6 w-14 h-14 theme-button-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center group hover:scale-105"
          title="新建页面"
        >
          <FileText
            size={24}
            className="theme-text-on-accent transition-transform group-hover:rotate-12 duration-200"
          />
        </button>
      )}

      {/* 创建知识库模态框 */}
      <CreateKnowledgeBaseModal
        isOpen={showCreateKnowledgeBaseModal}
        onClose={() => setShowCreateKnowledgeBaseModal(false)}
      />

      {/* 浮动大纲 - 在最外层渲染 */}
      {isOutlineVisible && headings.length > 0 && (
        <FloatingOutline
          headings={headings}
          onHeadingClick={handleHeadingClick}
          activeHeadingId={activeHeadingId}
          isExpanded={true}
          onClose={() => setIsOutlineVisible(false)}
        />
      )}
    </div>
  );
};
