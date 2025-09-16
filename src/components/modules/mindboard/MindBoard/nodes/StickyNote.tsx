import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Target, Edit, Trash2 } from 'lucide-react';
import { Paintbrush2 } from 'lucide-react';
import { useMindBoardStore } from '@/stores/mindBoardStore';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

const colors = [
  {
    name: 'yellow',
    bg: 'bg-yellow-200 dark:bg-yellow-700/50',
    border: 'border-yellow-400',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  {
    name: 'pink',
    bg: 'bg-pink-200 dark:bg-pink-700/50',
    border: 'border-pink-400',
    text: 'text-pink-800 dark:text-pink-200',
  },
  {
    name: 'blue',
    bg: 'bg-blue-200 dark:bg-blue-700/50',
    border: 'border-blue-400',
    text: 'text-blue-800 dark:text-blue-200',
  },
  {
    name: 'green',
    bg: 'bg-green-200 dark:bg-green-700/50',
    border: 'border-green-400',
    text: 'text-green-800 dark:text-green-200',
  },
  {
    name: 'purple',
    bg: 'bg-purple-200 dark:bg-purple-700/50',
    border: 'border-purple-400',
    text: 'text-purple-800 dark:text-purple-200',
  },
  {
    name: 'orange',
    bg: 'bg-orange-200 dark:bg-orange-700/50',
    border: 'border-orange-400',
    text: 'text-orange-800 dark:text-orange-200',
  },
];

export const StickyNote: React.FC<NodeProps> = ({ data, id, selected, xPos, yPos }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || '');
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: data.width || 280,
    height: data.height || 180,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const startDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const handleResizeRef = useRef<((e: MouseEvent) => void) | null>(null);
  const handleResizeEndRef = useRef<(() => void) | null>(null);
  const { currentBoard, updateBoard, deleteNode } = useMindBoardStore();
  const { fitBounds } = useReactFlow();

  const currentColor = colors[colorIndex];

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const updateNodeData = useCallback(() => {
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                text,
                colorIndex,
                width: dimensions.width,
                height: dimensions.height,
              },
              style: { ...node.style, width: dimensions.width, height: dimensions.height },
            }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  }, [text, colorIndex, dimensions, id, currentBoard, updateBoard]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    updateNodeData();
  }, [updateNodeData]);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (currentBoard && deleteNode) {
      setIsDeleting(true);
      try {
        deleteNode(id);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Failed to delete sticky note:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // 允许换行
      return;
    }

    if (e.key === 'Escape') {
      handleBlur();
    }
  };

  // 流畅的大小调整处理
  // 创建稳定的 handleResize 函数
  useEffect(() => {
    handleResizeRef.current = (e: MouseEvent) => {
      if (!cardRef.current || !startMousePosRef.current || !startDimensionsRef.current) return;

      e.preventDefault();

      // 直接操作DOM，避免React状态更新导致的卡顿
      requestAnimationFrame(() => {
        if (!cardRef.current || !startMousePosRef.current || !startDimensionsRef.current) return;

        // 使用相对位移计算新尺寸（更稳定）
        const deltaX = e.clientX - startMousePosRef.current.x;
        const deltaY = e.clientY - startMousePosRef.current.y;

        const newWidth = Math.max(150, startDimensionsRef.current.width + deltaX);
        const newHeight = Math.max(100, startDimensionsRef.current.height + deltaY);

        // 直接更新DOM样式，流畅无卡顿
        cardRef.current.style.width = `${newWidth}px`;
        cardRef.current.style.height = `${newHeight}px`;

        // 显示实时尺寸提示
        showResizeTooltip(newWidth, newHeight);
      });
    };
  });

  // 显示调整大小时的实时尺寸提示
  const showResizeTooltip = (width: number, height: number) => {
    if (!cardRef.current) return;

    let tooltip = cardRef.current.querySelector('.resize-tooltip') as HTMLElement;
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className =
        'resize-tooltip absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-50';
      cardRef.current.appendChild(tooltip);
    }

    tooltip.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    tooltip.style.opacity = '1';
  };

  // 创建稳定的 handleResizeEnd 函数
  useEffect(() => {
    handleResizeEndRef.current = () => {
      setIsResizing(false);
      startMousePosRef.current = null;
      startDimensionsRef.current = null;

      // 恢复正常光标
      document.body.style.cursor = '';

      if (!cardRef.current) return;

      // 从DOM读取最终尺寸，同步到React状态
      const finalWidth = parseInt(cardRef.current.style.width) || dimensions.width;
      const finalHeight = parseInt(cardRef.current.style.height) || dimensions.height;

      // 更新React状态
      setDimensions({
        width: finalWidth,
        height: finalHeight,
      });

      // 隐藏尺寸提示
      const tooltip = cardRef.current.querySelector('.resize-tooltip') as HTMLElement;
      if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip?.remove(), 200);
      }

      // 更新存储的数据
      if (currentBoard) {
        const updatedNodes = currentBoard.nodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: { ...node.data, text, colorIndex, width: finalWidth, height: finalHeight },
                style: { ...node.style, width: finalWidth, height: finalHeight },
              }
            : node
        );
        updateBoard(currentBoard.id, { nodes: updatedNodes });
      }
    };
  });

  useEffect(() => {
    if (isResizing && handleResizeRef.current && handleResizeEndRef.current) {
      // 设置全局调整大小光标
      document.body.style.cursor = 'nw-resize';
      document.addEventListener('mousemove', handleResizeRef.current, { passive: false });
      document.addEventListener('mouseup', handleResizeEndRef.current);
      // 防止选中文本
      document.addEventListener('selectstart', (e) => e.preventDefault());
    }

    return () => {
      document.body.style.cursor = '';
      if (handleResizeRef.current) {
        document.removeEventListener('mousemove', handleResizeRef.current);
      }
      if (handleResizeEndRef.current) {
        document.removeEventListener('mouseup', handleResizeEndRef.current);
      }
      document.removeEventListener('selectstart', (e) => e.preventDefault());
    };
  }, [isResizing]);

  const handleFocus = () => {
    const padding = 50;
    fitBounds(
      {
        x: (xPos || 0) - padding,
        y: (yPos || 0) - padding,
        width: dimensions.width + padding * 2,
        height: dimensions.height + padding * 2,
      },
      { duration: 800, padding: 0.1 }
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleColorPickerChange = (index: number) => {
    setColorIndex(index);
    setShowColorPicker(false);
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, colorIndex: index } } : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  };

  return (
    <div className="sticky-note-node relative group">
      <Handle
        type="target"
        position={Position.Top}
        id="sticky-target-top"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="sticky-target-left"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />

      {/* Floating operation buttons - only show when selected */}
      {selected && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 z-50 nodrag">
          <div className="flex items-center justify-center gap-1">
            {/* Color picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
                title="更改颜色"
              >
                <Paintbrush2 className="w-3.5 h-3.5 theme-text-primary" />
              </button>

              {showColorPicker && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
                  <div className="flex gap-1 p-2 backdrop-blur-sm bg-white/95 dark:bg-black/95 rounded-lg shadow-lg">
                    {colors.map((color, index) => (
                      <button
                        key={color.name}
                        onClick={() => handleColorPickerChange(index)}
                        className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-all ${color.bg} ${color.border} ${
                          index === colorIndex ? 'ring-2 ring-blue-400' : ''
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleFocus}
              className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
              title="聚焦卡片"
            >
              <Target className="w-3.5 h-3.5 theme-text-primary" />
            </button>

            <button
              onClick={handleEdit}
              className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
              title="编辑便签"
            >
              <Edit className="w-3.5 h-3.5 theme-text-primary" />
            </button>

            <button
              onClick={handleDelete}
              className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
              title="删除卡片"
            >
              <Trash2 className="w-3.5 h-3.5 theme-text-error" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={cardRef}
        className={`${currentColor.bg} ${currentColor.border} ${currentColor.text} rounded-lg shadow-md border-2 relative transform hover:scale-105 transition-transform`}
        onDoubleClick={handleDoubleClick}
        style={{
          transform: 'rotate(-1deg)',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          minWidth: '150px',
          minHeight: '100px',
        }}
      >
        {/* 简化的调整大小控制柄 */}
        {selected && (
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 cursor-nw-resize nodrag"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startMousePosRef.current = { x: e.clientX, y: e.clientY };
              startDimensionsRef.current = { width: dimensions.width, height: dimensions.height };
              setIsResizing(true);
            }}
            title="拖拽调整大小"
          >
            <div className="w-3 h-3 rounded-full bg-gray-400/50 hover:bg-gray-600/70 transition-colors" />
          </div>
        )}

        {/* 折角效果 */}
        <div className="absolute top-0 right-0 w-6 h-6">
          <div
            className={`absolute top-0 right-0 w-0 h-0 border-t-[24px] border-r-[24px] border-t-theme-bg-primary/50 border-r-transparent`}
          />
        </div>

        <div className="p-3 h-full flex flex-col">
          {isEditing ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={`w-full h-full p-1 bg-transparent border-none outline-none resize-none ${currentColor.text}`}
              autoFocus
              placeholder="记录想法..."
              style={{ fontFamily: 'cursive, sans-serif' }}
            />
          ) : (
            <div
              className={`flex-1 whitespace-pre-wrap ${currentColor.text} overflow-auto`}
              style={{ fontFamily: 'cursive, sans-serif' }}
            >
              {text || '双击添加便签...'}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="sticky-source-bottom"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="sticky-source-right"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />

      {/* 删除确认弹窗 */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="删除便签"
        itemName="这个便签"
        isLoading={isDeleting}
      />
    </div>
  );
};
