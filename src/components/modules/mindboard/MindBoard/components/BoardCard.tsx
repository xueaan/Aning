import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Brain } from 'lucide-react';
import { Board } from '@/types/mindBoard';
import { useMindBoardStore } from '@/stores/mindBoardStore';

interface BoardCardProps {
  board: Board;
  displayMode: 'card' | 'list';
  onOpen: () => void;
}

export const BoardCard: React.FC<BoardCardProps> = ({ board, displayMode, onOpen }) => {
  const { updateBoard } = useMindBoardStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(board.title);

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(board.title);
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== board.title) {
      updateBoard(board.id, { title: trimmedTitle });
    } else if (!trimmedTitle) {
      setEditTitle(board.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditTitle(board.title);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    handleSaveTitle();
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
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  className="w-full text-base font-medium theme-text-primary mb-2 bg-transparent border-none outline-none focus:ring-0"
                  autoFocus
                />
              ) : (
                <h3
                  className="text-base font-medium theme-text-primary mb-2 cursor-text"
                  onDoubleClick={handleTitleDoubleClick}
                >
                  {board.title}
                </h3>
              )}
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
      </div>
      </div>
    );
  }

return (
    <div onClick={onOpen}
            className="rounded-xl bg-transparent theme-border backdrop-blur-sm hover:backdrop-blur-md hover:theme-bg-secondary/50 transition-all cursor-pointer overflow-hidden"
    >
      <div className="aspect-video relative bg-transparent border-b theme-border">
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
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full font-semibold theme-text-primary mb-3 text-lg bg-transparent border-none outline-none focus:ring-0"
            autoFocus
          />
        ) : (
          <h3
            className="font-semibold theme-text-primary truncate mb-3 text-lg cursor-text"
            onDoubleClick={handleTitleDoubleClick}
          >
            {board.title}
          </h3>
        )}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 theme-bg-secondary/50 backdrop-blur-sm rounded-full text-xs theme-text-secondary theme-border">
          <Clock className="w-3 h-3" />
          <span>{formatDate(board.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};










