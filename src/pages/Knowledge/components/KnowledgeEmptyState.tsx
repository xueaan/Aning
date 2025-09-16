import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { useKnowledgeStore } from '@/stores'; // 暂时未使用

interface KnowledgeEmptyStateProps {
  className?: string;
  hasKnowledgeBases?: boolean;
  onCreateKnowledgeBase?: () => void;
  onCreate?: () => void;
}

export const KnowledgeEmptyState: React.FC<KnowledgeEmptyStateProps> = ({
  className = '',
  hasKnowledgeBases = false,
  onCreateKnowledgeBase,
}) => {
  if (!hasKnowledgeBases) {
    // 没有知识库的空状态
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full theme-bg-primary/50 backdrop-blur-sm',
          className
        )}
      >
        <div className="text-center max-w-md mx-auto p-8">
          {/* 创建知识库按钮 */}
          <button
            onClick={onCreateKnowledgeBase}
            className={cn(
              'flex items-center justify-center gap-3 px-8 py-4 rounded-lg transition-all duration-200',
              'theme-bg-accent theme-text-smart-contrast text-base',
              'hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm',
              'border theme-border-accent'
            )}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">创建知识库</span>
          </button>
        </div>
      </div>
    );
  }

  // 有知识库但没有选择页面时返回null，让sCatalog组件处理
  return null;
};
