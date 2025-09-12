import React from 'react';
import { BoardList } from './BoardList';
import { BoardCanvas } from './BoardCanvas';
import { useMindBoardStore } from '@/stores/mindBoardStore';

export const MindBoard: React.FC = () => {
  const { viewMode, currentBoard } = useMindBoardStore();

  if (viewMode === 'canvas' && currentBoard) {
    return <BoardCanvas />;
  }

  return <BoardList/>;
};

