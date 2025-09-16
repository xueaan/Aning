import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Target, Edit, Trash2 } from 'lucide-react';
import { Paintbrush2 } from 'lucide-react';
import { useMindBoardStore } from '@/stores/mindBoardStore';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

const colors = [
  {
    name: 'green',
    border: 'border-green-400 dark:border-green-500',
    bg: 'rgba(34, 197, 94, 0.2)',
    header: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
  },
  {
    name: 'blue',
    border: 'border-blue-400 dark:border-blue-500',
    bg: 'rgba(59, 130, 246, 0.2)',
    header: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
  },
  {
    name: 'purple',
    border: 'border-purple-400 dark:border-purple-500',
    bg: 'rgba(147, 51, 234, 0.2)',
    header: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700',
  },
  {
    name: 'yellow',
    border: 'border-yellow-400 dark:border-yellow-500',
    bg: 'rgba(234, 179, 8, 0.2)',
    header: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700',
  },
  {
    name: 'red',
    border: 'border-red-400 dark:border-red-500',
    bg: 'rgba(239, 68, 68, 0.2)',
    header: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700',
  },
  {
    name: 'gray',
    border: 'theme-border-primary',
    bg: 'rgba(var(--bg-tertiary), 0.8)',
    header: 'theme-bg-secondary/30 theme-border-secondary',
  },
];

export const NoteCard: React.FC<NodeProps> = ({ data, id, selected, xPos, yPos }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content || '');
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // ReactFlow 会自动处理选中状态
  };

  const updateNodeData = useCallback(() => {
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                content,
                colorIndex,
                width: dimensions.width,
                height: dimensions.height,
                title: data.title || data.sourceCardTitle || '笔记卡片',
              },
              style: { ...node.style, width: dimensions.width, height: dimensions.height },
            }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  }, [
    content,
    colorIndex,
    dimensions,
    data.title,
    data.sourceCardTitle,
    id,
    currentBoard,
    updateBoard,
  ]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    updateNodeData();
  }, [updateNodeData]);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteNode) {
      setIsDeleting(true);
      try {
        deleteNode(id);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Failed to delete note card:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        handleBlur();
      }
    },
    [handleBlur]
  );

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

        const newWidth = Math.max(250, startDimensionsRef.current.width + deltaX);
        const newHeight = Math.max(200, startDimensionsRef.current.height + deltaY);

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
                data: { ...node.data, content, colorIndex, width: finalWidth, height: finalHeight },
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
    <div className="note-card-node relative group">
      {/* 简化连接点 - 只保留基本的4个方向 */}

      {/* Floating operation buttons - only show when selected */}
      {selected && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 z-50 nodrag">
          <div className="flex items-center justify-center gap-1">
            {/* Color picker  */}
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
                        className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-all ${
                          index === colorIndex ? 'ring-2 ring-blue-400' : ''
                        }`}
                        style={{
                          backgroundColor: color.bg.includes('var(--')
                            ? 'rgba(148, 163, 184, 0.5)'
                            : color.bg,
                        }}
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
              title="编辑笔记"
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
        className={`theme-card-glass rounded-lg border-2 ${currentColor.border} relative overflow-hidden flex flex-col cursor-pointer`}
        style={{
          backgroundColor: currentColor.bg,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          minWidth: '250px',
          minHeight: '200px',
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
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

        <div className="px-4 py-2 theme-bg-secondary/30 border-b theme-border-secondary backdrop-blur-sm">
          <span className="text-sm font-medium theme-text-primary truncate block">
            {data.title || data.sourceCardTitle || '笔记卡片'}
          </span>
        </div>

        <div className="p-4 flex-1 overflow-hidden">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full p-2 bg-white/95 dark:bg-gray-800/95 border theme-border-secondary rounded outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
              placeholder="支持 Markdown 格式..."
            />
          ) : (
            <div className="h-full overflow-y-auto theme-text-primary">
              {content ? (
                <div
                  className="whitespace-pre-wrap break-words text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: content
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&amp;/g, '&')
                      .replace(/&quot;/g, '"')
                      .replace(/&#x27;/g, "'"),
                  }}
                />
              ) : (
                <p className="theme-text-tertiary text-sm">双击编辑内容...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 简化的连接点 - 和其他卡片保持一致 */}
      <Handle
        type="target"
        position={Position.Top}
        id="note-target-top"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="note-target-left"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="note-source-bottom"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="note-source-right"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />

      {/* 删除确认弹窗 */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="删除笔记卡片"
        itemName="这个笔记卡片"
        isLoading={isDeleting}
      />
    </div>
  );
};
