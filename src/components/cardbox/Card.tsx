import React, { useState } from 'react';
import { Calendar, Maximize2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Card as CardType } from '@/stores';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

interface CardProps {
  card: CardType;
  onDelete?: (card: CardType) => void;
  onExpand?: (card: CardType) => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  card,
  onDelete,
  onExpand,
  className = ''
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // 处理双击展开
  const handleDoubleClick = () => {
    onExpand?.(card);
  };

  // 处理展开按钮点击
  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand?.(card);
  };

  // 处理删除按钮点击
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  // 处理确认删除
  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete?.(card);
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 处理取消删除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl p-6 cursor-pointer group h-[280px] flex flex-col feather-glass-deco transition-all duration-300',
        card.is_pinned && 'pinned',
        card.is_archived && 'opacity-60',
        className
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* 笔记内容区域 */}
      <div className="flex flex-col h-full">
        
        {/* 顶部操作按钮区域 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 展开按钮 */}
          <button
            onClick={handleExpandClick}
            className="p-1.5 rounded-lg hover:theme-bg-tertiary transition-colors"
            title="展开编辑"
          >
            <Maximize2 size={14} className="theme-text-secondary" />
          </button>
          
          {/* 删除按钮 */}
          <button
            onClick={handleDeleteClick}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="删除笔记"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-semibold theme-text-primary mb-4 mt-2 pr-12 line-clamp-2 leading-relaxed">
          {card.title}
        </h3>

        {/* 内容预览 */}
        <div className="text-sm theme-text-secondary mb-4 whitespace-pre-line line-clamp-6 leading-relaxed flex-1 overflow-hidden">
          {card.preview || (
            <span className="theme-text-tertiary italic">
              暂无内容...
            </span>
          )}
        </div>

        {/* 标签 */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {card.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs bg-white/10 theme-text-secondary rounded-full"
              >
                {tag}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="px-3 py-1 text-xs bg-white/10 theme-text-secondary rounded-full">
                +{card.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 底部信息 - 固定在底部 */}
        <div className="flex items-center justify-between text-xs theme-text-tertiary pt-2 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-1.5">
            <Calendar size={16} />
            <span>{formatDate(card.created_at)}</span>
          </div>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="删除笔记"
        message="确定要删除这篇笔记吗？删除后将无法恢复。"
        itemName={card.title}
        isLoading={isDeleting}
      />
    </div>
  );
};