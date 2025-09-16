import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen, X, FileText, ChevronsDown, ChevronsRight } from 'lucide-react';
import { useKnowledgeOperations } from '@/stores/knowledgeStore';
import { KnowledgeTree } from './KnowledgeTree';

interface KnowledgeSidebarProps {
  onClose: () => void;
  selectedPageId?: string | null;
  onPageSelect?: (pageId: string) => void;
  className?: string;
}

export const KnowledgeSidebar: React.FC<KnowledgeSidebarProps> = ({
  onClose,
  selectedPageId,
  onPageSelect,
  className = '',
}) => {
  const knowledgeOps = useKnowledgeOperations();
  const [allExpanded, setAllExpanded] = useState(false);
  const [forceExpandAll, setForceExpandAll] = useState<boolean | undefined>(undefined);

  // 初始化知识库数据
  useEffect(() => {
    const initData = async () => {
      if (!knowledgeOps.knowledgeBases || knowledgeOps.knowledgeBases.length === 0) {
        await knowledgeOps.loadKnowledgeBases?.();
      }
    };
    initData();
  }, []);

  // 展开/折叠所有
  const handleToggleAll = () => {
    const newExpanded = !allExpanded;
    setAllExpanded(newExpanded);
    setForceExpandAll(newExpanded);

    // 使用pageStore的展开/折叠方法
    if (newExpanded) {
      knowledgeOps.expandAll?.();
    } else {
      knowledgeOps.collapseAll?.();
    }
  };

  // 处理页面选择
  const handlePageSelect = (pageId: string) => {
    onPageSelect?.(pageId);
    // 不再自动关闭目录面板，让用户手动控制
  };

  return (
    <div className={cn('h-full w-72 transition-all duration-300', className)}>
      <div
        className={cn(
          'theme-bg-primary/95 backdrop-blur-md shadow-xl h-full overflow-hidden flex flex-col'
        )}
      >
        {/* 头部 */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3 border-b-2 theme-border-primary backdrop-blur-sm flex-shrink-0'
          )}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold theme-text-primary">目录</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleAll}
              className={cn(
                'p-1 rounded transition-all duration-200',
                'hover:theme-bg-secondary hover:backdrop-blur-sm',
                'theme-text-secondary hover:theme-text-primary'
              )}
              title={allExpanded ? '折叠所有' : '展开所有'}
            >
              {allExpanded ? (
                <ChevronsRight className="w-4 h-4" />
              ) : (
                <ChevronsDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className={cn(
                'p-1 rounded transition-all duration-200',
                'hover:theme-bg-secondary hover:backdrop-blur-sm',
                'theme-text-secondary hover:theme-text-primary'
              )}
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 知识树内容 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {knowledgeOps.currentKnowledgeBase ? (
            <KnowledgeTree
              onSelect={handlePageSelect}
              selectedId={selectedPageId}
              className="p-2"
              forceExpandAll={forceExpandAll}
            />
          ) : (
            <div className="px-4 py-8 text-center theme-text-secondary">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">请先选择或创建知识库</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
