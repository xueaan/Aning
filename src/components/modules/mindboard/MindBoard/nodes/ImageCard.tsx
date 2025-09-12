import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Upload, Image as ImageIcon, Target, Edit, Trash2, Paintbrush2 } from 'lucide-react';
import { useMindBoardStore } from '@/stores/mindBoardStore';

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

export const ImageCard: React.FC<NodeProps> = ({ data, id, selected, xPos, yPos }) => {
  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: data.width || 280,
    height: data.height || 180
  });
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { currentBoard, updateBoard, deleteNode } = useMindBoardStore();
  const { fitBounds } = useReactFlow();
  const currentColor = colors[colorIndex];

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImageUrl(url);
        updateNodeData(url);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            setIsLoading(true);
            const reader = new FileReader();
            reader.onload = (event) => {
              const url = event.target?.result as string;
              setImageUrl(url);
              updateNodeData(url);
              setIsLoading(false);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImageUrl(url);
        updateNodeData(url);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const updateNodeData = (url: string) => {
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node =>
        node.id === id
          ? {
            ...node,
            data: { ...node.data, imageUrl: url, colorIndex, width: dimensions.width, height: dimensions.height },
            style: { ...node.style, width: dimensions.width, height: dimensions.height }
          }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  };

  const handleColorChange = (index: number) => {
    setColorIndex(index);
    setShowColorPicker(false);
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node =>
        node.id === id
          ? { ...node, data: { ...node.data, colorIndex: index } }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  };

  const handleDelete = () => {
    if (deleteNode) {
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
      const newWidth = Math.max(200, e.clientX - rect.left);
      const newHeight = Math.max(150, e.clientY - rect.top);

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
            data: { ...node.data, imageUrl, colorIndex, width: finalWidth, height: finalHeight },
            style: { ...node.style, width: finalWidth, height: finalHeight }
          }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  }, [imageUrl, colorIndex, dimensions, id, currentBoard, updateBoard]);

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

  const handleFocus = () => {
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
    fileInputRef.current?.click();
  };

  return (
    <div className="image-card-node relative group">
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      
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
                        onClick={() => handleColorChange(index)}
                        className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-all ${
                          index === colorIndex ? 'ring-2 ring-blue-400' : ''
                        }`}
                        style={{ backgroundColor: color.bg.includes('var(--') ? 'rgba(148, 163, 184, 0.5)' : color.bg }}
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
              title="编辑图片"
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
        className={`feather-glass-deco rounded-lg border-2 ${currentColor.border} relative overflow-hidden`}
        style={{
          backgroundColor: currentColor.bg,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          minWidth: '200px',
          minHeight: '150px'
        }}
        onPaste={handlePaste} 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
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
        <div className="px-3 py-2 theme-bg-secondary/30 border-b theme-border-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 theme-text-secondary" />
            <span className="text-sm font-medium theme-text-primary">
              图片卡片 
            </span>
          </div>
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <span className="theme-text-secondary">加载中...</span>
            </div>
          ) : imageUrl ? (
            <div className="relative group">
              <img src={imageUrl} alt="上传的图片"
                className="w-full h-auto max-h-[300px] object-contain rounded"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed theme-border-primary rounded cursor-pointer hover:theme-border-accent transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 theme-text-secondary mb-2" />
              <p className="text-sm theme-text-secondary">
                点击上传、粘贴或拖拽图片
              </p>
              <p className="text-xs theme-text-secondary mt-1">
                支持 JPG、PNG、GIF 等格式
              </p>
            </div>
          )}
          
          <input ref={fileInputRef} type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};












