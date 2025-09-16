import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { type Card as CardType } from '@/stores';

interface CardGridProps {
  cards: CardType[];
  isLoading?: boolean;
  onDeleteCard?: (card: CardType) => void;
  onExpandCard?: (card: CardType) => void;
  onCreateBox?: () => void;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  cards,
  isLoading = false,
  onDeleteCard,
  onExpandCard,
  onCreateBox,
  viewMode = 'grid',
  className = '',
}) => {
  // 按更新时间排序笔记
  const sortedCards = React.useMemo(() => {
    return [...cards].sort((a, b) => {
      return b.updated_at - a.updated_at;
    });
  }, [cards]);

  // 加载状态
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="flex items-center gap-3 theme-text-secondary">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  // 空状态 - 没有笔记盒时
  if (onCreateBox && cards.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center max-w-md">
          <FileText size={64} className="mx-auto mb-6 theme-text-tertiary" />
          <h3 className="text-xl font-semibold theme-text-primary mb-3">欢迎使用笔记管理</h3>
          <p className="theme-text-secondary mb-6 leading-relaxed">
            开始创建你的第一个笔记盒，用于组织和管理你的想法与记录
          </p>
          <button
            onClick={onCreateBox}
            className="inline-flex items-center gap-2 px-6 py-3 theme-button-primary rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            创建笔记盒
          </button>
        </div>
      </div>
    );
  }

  // 空状态 - 有笔记盒但没有笔记
  if (cards.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="text-center max-w-md">
          <FileText size={64} className="mx-auto mb-6 theme-text-tertiary" />
          <h3 className="text-xl font-semibold theme-text-primary mb-3">还没有笔记</h3>
          <p className="theme-text-secondary mb-6 leading-relaxed">
            点击右下角的按钮开始创建你的第一篇笔记
          </p>
        </div>
      </div>
    );
  }

  // 网格模式
  if (viewMode === 'grid') {
    return (
      <div className={cn('h-full overflow-auto', className)}>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCards.map((card) => (
              <Card
                key={card.id}
                card={card}
                onDelete={onDeleteCard}
                onExpand={onExpandCard}
                className="transform transition-all duration-200 hover:scale-105"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 列表模式
  return (
    <div className={cn('h-full overflow-auto', className)}>
      <div className="p-6">
        <div className="space-y-4">
          {sortedCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onDelete={onDeleteCard}
              onExpand={onExpandCard}
              className="transform transition-all duration-200 hover:scale-[1.02]"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
