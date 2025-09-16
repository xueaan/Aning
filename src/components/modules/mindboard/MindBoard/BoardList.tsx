import React from 'react';
import { GitBranch } from 'lucide-react';
import { BoardCard } from './components/BoardCard';
import { useMindBoardStore } from '@/stores/mindBoardStore';

export const BoardList: React.FC = () => {
  const { displayMode, searchTerm, createBoard, openBoard, getFilteredBoards } =
    useMindBoardStore();
  // Store references removed - themeMode cleanup
  const filteredBoards = getFilteredBoards();

  const handleCreateBoard = () => {
    const newBoard = createBoard();
    openBoard(newBoard.id);
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-6 pb-0">
        <h2 className="text-lg font-semibold theme-text-primary">我的思维板</h2>
      </div>
      <div className="flex-1 overflow-auto p-6 pt-4">
        {filteredBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full theme-text-tertiary">
            <div className="text-6xl mb-4">🧠</div>
            <p className="text-lg mb-2">
              {searchTerm ? '没有找到匹配的思维板' : '还没有创建思维板'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateBoard}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-all theme-bg-accent/20 border theme-border-accent theme-text-accent hover:theme-bg-accent/30"
              >
                <GitBranch className="w-4 h-4" />
                创建第一个思维板
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              displayMode === 'card'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'flex flex-col gap-2'
            }
          >
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                displayMode={displayMode}
                onOpen={() => openBoard(board.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 浮动的新建思维板按钮 */}
      <button
        onClick={handleCreateBoard}
        className="fixed bottom-6 right-6 w-14 h-14 theme-button-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center group hover:scale-105"
        title="新建思维板"
      >
        <GitBranch
          size={24}
          className="text-white transition-transform group-hover:rotate-12 duration-200"
        />
      </button>
    </div>
  );
};
