import React from 'react';
import { Book, MoreVertical, Trash2, Play, CheckCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Book as BookType } from '@/types/book';

interface BookCardProps {
  book: BookType;
  onClick: () => void;
  onDelete: () => void;
  onStartReading: () => void;
  onMarkAsFinished: () => void;
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onClick,
  onDelete,
  onStartReading,
  onMarkAsFinished,
  className,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  // 计算阅读进度百分比
  const progressPercentage = book.total_pages
    ? Math.round((book.current_page / book.total_pages) * 100)
    : 0;

  // 获取状态标签颜色和文字
  const getStatusBadge = () => {
    switch (book.status) {
      case 'reading':
        return { color: 'bg-green-500', text: '在读' };
      case 'finished':
        return { color: 'bg-blue-500', text: '已读' };
      case 'wanted':
        return { color: 'bg-orange-500', text: '想读' };
      default:
        return { color: 'bg-gray-500', text: '未知' };
    }
  };

  const statusBadge = getStatusBadge();

  // 处理菜单点击
  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all duration-200 hover:scale-102',
        'feather-glass-deco rounded-lg overflow-hidden shadow-sm hover:shadow-lg',
        className
      )}
      onClick={onClick}
    >
      {/* 封面区域 */}
      <div className="aspect-[2/3] relative bg-gradient-to-br from-blue-400 to-purple-600">
        {book.cover ? (
          <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Book className="w-12 h-12 text-white/50" />
          </div>
        )}

        {/* 状态标签 */}
        <div
          className={cn(
            'absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white',
            statusBadge.color
          )}
        >
          {statusBadge.text}
        </div>

        {/* 评分 */}
        {book.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs text-white">{book.rating}</span>
          </div>
        )}

        {/* 操作菜单按钮 */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>

          {/* 下拉菜单 */}
          {showMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-40 feather-glass-dropdown rounded-lg shadow-xl z-[8000]">
              {book.status === 'wanted' && (
                <button
                  onClick={(e) => handleMenuClick(e, onStartReading)}
                  className="w-full flex items-center gap-2 px-3 py-2 feather-glass-hover rounded transition-colors text-[rgba(var(--text-primary),1)]"
                >
                  <Play className="w-4 h-4" />
                  开始阅读
                </button>
              )}
              {book.status === 'reading' && (
                <button
                  onClick={(e) => handleMenuClick(e, onMarkAsFinished)}
                  className="w-full flex items-center gap-2 px-3 py-2 feather-glass-hover rounded transition-colors text-[rgba(var(--text-primary),1)]"
                >
                  <CheckCircle className="w-4 h-4" />
                  标记已读
                </button>
              )}
              <button
                onClick={(e) => handleMenuClick(e, onDelete)}
                className="w-full flex items-center gap-2 px-3 py-2 feather-glass-hover rounded transition-colors text-[rgba(var(--color-error),0.8)]"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 信息区域 */}
      <div className="p-2">
        <h3
          className="text-xs font-semibold text-[rgba(var(--text-primary),1)] truncate"
          title={book.title}
        >
          {book.title}
        </h3>
        {book.author && (
          <p
            className="text-xs text-[rgba(var(--text-secondary),1)] truncate mt-0.5"
            title={book.author}
          >
            {book.author}
          </p>
        )}

        {/* 进度条 */}
        {book.status === 'reading' && book.total_pages && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-xs text-[rgba(var(--text-secondary),1)] mb-1">
              <span className="text-xs">{progressPercentage}%</span>
            </div>
            <div className="h-1.5 bg-[rgba(var(--bg-tertiary),0.5)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* 标签 */}
        {book.tags && book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {book.tags.slice(0, 1).map((tag, index) => (
              <span
                key={index}
                className="px-1.5 py-0.5 text-xs feather-glass-content text-[rgba(var(--text-secondary),1)] rounded-full"
              >
                {tag}
              </span>
            ))}
            {book.tags.length > 1 && (
              <span className="px-1.5 py-0.5 text-xs text-[rgba(var(--text-tertiary),1)]">
                +{book.tags.length - 1}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
