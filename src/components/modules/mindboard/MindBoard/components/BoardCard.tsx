import React from 'react';
import { Star, StarOff, Clock } from 'lucide-react';
import { Brain } from 'lucide-react';
import { Board } from '@/types/mindBoard';
import { useMindBoardStore } from '@/stores/mindBoardStore';

interface BoardCardProps {
  board: Board;
  displayMode: 'card' | 'list';
  onOpen: () => void;
}

export const BoardCard: React.FC<BoardCardProps> = ({ board, displayMode, onOpen }) => {
  const { toggleFavorite } = useMindBoardStore();
  // Store references removed - themeMode cleanup
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(board.id);
  };

  // const getBoardStats = () => {
  //   if (nodeCount === 0) return '空白思维�?;
  //   if (nodeCount === 1) return '单个节点';
  //   if (edgeCount === 0) return `${nodeCount} 个孤立节点`;
  //   return `${nodeCount} 个节点，${edgeCount} 个连接`;
  // };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return dateObj.toLocaleDateString();
  };

  const nodeCount = board.nodes.length;
  const edgeCount = board.edges.length;

  if (displayMode === 'list') {
    return (
      <div onClick={onOpen}
            className="group rounded-xl bg-transparent theme-border backdrop-blur-sm hover:backdrop-blur-md hover:theme-bg-secondary/50 transition-all hover:translate-x-1 hover:shadow-lg cursor-pointer will-change-transform"
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 theme-bg-secondary/30 backdrop-blur-sm rounded-lg flex items-center justify-center theme-border">
              <Brain size={24} 
            className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium theme-text-primary mb-2">
                {board.title}
              </h3>
              <div className="flex items-center gap-3 text-xs theme-text-secondary">
                <span>{nodeCount} 节点</span>
                <span>·</span>
                <span>{edgeCount} 连接</span>
                <span>·</span>
                <div className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(board.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleToggleFavorite}
            className="p-2 rounded-lg theme-bg-secondary/50 hover:theme-bg-secondary/70 backdrop-blur-sm theme-border transition-colors duration-200"
          title={board.isFavorite ? '取消收藏' : '添加收藏'}
          >
          {board.isFavorite ? (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff className="w-4 h-4 theme-text-tertiary" />
          )}
        </button>
      </div>
      </div>
    );
  }

return (
    <div onClick={onOpen}
            className="rounded-xl bg-transparent theme-border backdrop-blur-sm hover:backdrop-blur-md hover:theme-bg-secondary/50 transition-all cursor-pointer overflow-hidden"
    >
      <div className="aspect-video relative bg-transparent border-b theme-border">
        <div className="absolute top-2 right-2">
          <button onClick={handleToggleFavorite}
            className="p-1.5 rounded-lg theme-bg-primary/20 hover:theme-bg-primary/30 backdrop-blur-sm border theme-border-primary transition-colors duration-200"
            title={board.isFavorite ? '取消收藏' : '添加收藏'}
          >
            {board.isFavorite ? (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="w-4 h-4 theme-text-tertiary" />
            )}
          </button>
        </div>
      <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 theme-bg-secondary/30 backdrop-blur-sm rounded-xl flex items-center justify-center theme-border mb-3 mx-auto">
              <Brain size={48} 
            className="text-blue-600" />
            </div>
            <div className="text-xs theme-text-secondary">
              {nodeCount} 节点 · {edgeCount} 连接
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative p-4 bg-transparent border-t theme-border">
        <h3 className="font-semibold theme-text-primary truncate mb-3 text-lg">
          {board.title}
        </h3>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 theme-bg-secondary/50 backdrop-blur-sm rounded-full text-xs theme-text-secondary theme-border">
          <Clock className="w-3 h-3" />
          <span>{formatDate(board.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};










