import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { PenTool } from 'lucide-react';
import { useCardBoxStore } from '@/stores';
import { CardGrid } from './CardGrid';
import { CardFullEditor } from './CardFullEditor';
import { CreateCardBoxModal } from '@/components/modals/CreateCardBoxModal';

interface CardBoxLayoutProps {
  className?: string;
}

export const CardBoxLayout: React.FC<CardBoxLayoutProps> = ({
  className = ''
}) => {
  const {
    boxes,
    activeBoxId,
    cards,
    isLoading,
    fullEditorOpen,
    fullEditingCard,

    loadBoxes,
    loadCards,
    deleteCard,
    openFullEditor,
    closeFullEditor,
    saveFullCard
  } = useCardBoxStore();

  const [showCreateBoxModal, setShowCreateBoxModal] = useState(false);

  // 组件初始化
  useEffect(() => {
    const initializeData = async () => {
      await loadBoxes();
      // 默认加载所有笔记（activeBoxId 为 null 时显示全部）
      await loadCards();
    };

    initializeData();
  }, [loadBoxes, loadCards]);

  // 创建新笔记
  const handleCreateCard = async () => {
    if (!activeBoxId && boxes.length === 0) {
      alert('请先创建一个笔记盒');
      return;
    }

    const targetBoxId = activeBoxId || boxes[0]?.id;
    await openFullEditor(undefined, targetBoxId);
  };

  // 创建笔记盒
  const handleCreateBox = () => {
    setShowCreateBoxModal(true);
  };

  // 删除笔记
  const handleDeleteCard = async (card: any) => {
    try {
      await deleteCard(card.id);
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  };

  // 展开笔记
  const handleExpandCard = async (card: any) => {
    await openFullEditor(card);
  };

  // 如果全屏编辑器打开，显示全屏编辑器
  if (fullEditorOpen) {
    return (
      <div className={cn('flex h-full', className)}>
        <CardFullEditor
          isOpen={fullEditorOpen}
          card={fullEditingCard}
          boxId={activeBoxId}
          onClose={closeFullEditor}
          onSave={saveFullCard}
          className="flex-1"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex h-full relative', className)}>
      {/* 主内容区 - 占满全宽 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 笔记展示区域 */}
        <CardGrid
          cards={cards}
          isLoading={isLoading}
          onDeleteCard={handleDeleteCard}
          onExpandCard={handleExpandCard}
          onCreateBox={boxes.length === 0 ? handleCreateBox : undefined}
          className="flex-1"
        />
      </div>

      {/* 新建笔记按钮 */}
      <button
        onClick={handleCreateCard}
        className="fixed bottom-6 right-6 w-14 h-14 theme-button-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center group hover:scale-105"
        title="新建笔记"
      >
        <PenTool size={24} className="text-white transition-transform group-hover:rotate-12 duration-200" />
      </button>


      {/* 创建笔记盒模态框 */}
      <CreateCardBoxModal
        isOpen={showCreateBoxModal}
        onClose={() => setShowCreateBoxModal(false)}
      />
    </div>
  );
};