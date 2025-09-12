import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { useMindBoardStore } from '@/stores/mindBoardStore';
import { Paintbrush2, Target, Edit, Trash2 } from 'lucide-react';

const colors = [
  {
    name: 'blue',
    border: 'border-blue-400 dark:border-blue-500', bg: 'rgba(59, 130, 246, 0.2)'
  },
  {
    name: 'green',
    border: 'border-green-400 dark:border-green-500', bg: 'rgba(34, 197, 94, 0.2)'
  },
  {
    name: 'yellow',
    border: 'border-yellow-400 dark:border-yellow-500', bg: 'rgba(234, 179, 8, 0.2)'
  },
  {
    name: 'red',
    border: 'border-red-400 dark:border-red-500', bg: 'rgba(239, 68, 68, 0.2)'
  },
  {
    name: 'purple',
    border: 'border-purple-400 dark:border-purple-500', bg: 'rgba(147, 51, 234, 0.2)'
  },
  {
    name: 'gray',
    border: 'theme-border-primary',
    bg: 'rgba(var(--bg-tertiary), 0.8)'
  },
];

export const TextCard: React.FC<NodeProps> = ({ data, id, selected, xPos, yPos }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text || '');
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [dimensions, setDimensions] = useState({
    width: data.width || 280,
    height: data.height || 180
  });
  const [isResizing, setIsResizing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { currentBoard, updateBoard, deleteNode } = useMindBoardStore();
  const { fitBounds } = useReactFlow();
  const currentColor = colors[colorIndex];

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const updateNodeData = useCallback(() => {
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node =>
        node.id === id
          ? {
            ...node,
            data: { ...node.data, text, colorIndex, width: dimensions.width, height: dimensions.height },
            style: { ...node.style, width: dimensions.width, height: dimensions.height }
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

  const handleColorChange = (newColorIndex: number) => {
    setColorIndex(newColorIndex);
    setShowColorPicker(false);
    // Update immediately
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node =>
        node.id === id
          ? {
            ...node,
            data: { ...node.data, colorIndex: newColorIndex }
          }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  };

  const handleFocus = () => {
    // 使用当前节点的位置和尺寸来聚焦
    const padding = 50;
    fitBounds(
      {
        x: (xPos || 0) - padding,
        y: (yPos || 0) - padding,
        width: dimensions.width + padding * 2,
        height: dimensions.height + padding * 2
      },
      { duration: 800, padding: 0.1 }
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = () => {
    if (currentBoard && window.confirm('确定要删除这个卡片吗？')) {
      deleteNode(id);
    }
  };

  // 流畅的大小调整处理
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !cardRef.current) return;

    e.preventDefault();

    // 直接操作DOM，避免React状态更新导致的卡顿
    requestAnimationFrame(() => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const newWidth = Math.max(120, e.clientX - rect.left);
      const newHeight = Math.max(60, e.clientY - rect.top);

      // 直接更新DOM样式，流畅无卡顿
      cardRef.current.style.width = `${newWidth}px`;
      cardRef.current.style.height = `${newHeight}px`;

      // 显示实时尺寸提示
      showResizeTooltip(newWidth, newHeight);
    });
  }, [isResizing]);

  // 显示调整大小时的实时尺寸提示
  const showResizeTooltip = (width: number, height: number) => {
    if (!cardRef.current) return;

    let tooltip = cardRef.current.querySelector('.resize-tooltip') as HTMLElement;
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'resize-tooltip absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-50';
      cardRef.current.appendChild(tooltip);
    }

    tooltip.textContent = `${Math.round(width)} × ${Math.round(height)}`;
    tooltip.style.opacity = '1';
  };

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);

    if (!cardRef.current) return;

    // 从DOM读取最终尺寸，同步到React状态
    const finalWidth = parseInt(cardRef.current.style.width) || dimensions.width;
    const finalHeight = parseInt(cardRef.current.style.height) || dimensions.height;

    // 更新React状态
    setDimensions({
      width: finalWidth,
      height: finalHeight
    });

    // 隐藏尺寸提示
    const tooltip = cardRef.current.querySelector('.resize-tooltip') as HTMLElement;
    if (tooltip) {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip?.remove(), 200);
    }

    // 更新存储的数据
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node =>
        node.id === id
          ? {
            ...node,
            data: { ...node.data, text, colorIndex, width: finalWidth, height: finalHeight },
            style: { ...node.style, width: finalWidth, height: finalHeight }
          }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  }, [dimensions, text, colorIndex, id, currentBoard, updateBoard]);

  // 添加鼠标事件监听
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  return (
    <div className="text-card-node relative group">
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      
      {/* Floating operation buttons - only show when selected */}
      {selected && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 z-20">
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
                        onClick={() => handleColorChange(index)}
                        className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-all ${
                          index === colorIndex ? 'ring-2 ring-blue-400' : ''
                        }`}
                        style={{ backgroundColor: color.bg }}
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
              title="编辑卡片"
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
        className={`px-4 py-3 rounded-lg border-2 ${currentColor.border} feather-glass-deco shadow-lg transition-all relative`}
        style={{
          backgroundColor: currentColor.bg,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          minWidth: '120px',
          minHeight: '60px'
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* 简化的调整大小控制柄 */}
        {selected && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 cursor-nw-resize nodrag"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsResizing(true);
            }}
            title="拖拽调整大小"
          >
            <div className="w-3 h-3 rounded-full bg-gray-400/50 hover:bg-gray-600/70 transition-colors" />
          </div>
        )}

        <div className="h-full overflow-hidden">
          {isEditing ? (
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur} 
              onKeyDown={handleKeyDown}
              className="w-full h-full p-1 bg-transparent border-none outline-none resize-none theme-text-primary placeholder:theme-text-tertiary"
              autoFocus
              placeholder="输入文字..."
            />
          ) : (
            <div className="theme-text-primary whitespace-pre-wrap h-full overflow-auto">
              {text || (
                <span className="theme-text-tertiary italic">记录思考</span>
              )}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};












