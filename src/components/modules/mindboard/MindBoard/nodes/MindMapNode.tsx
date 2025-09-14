import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { Plus, Target, Edit, Trash2 } from 'lucide-react';
import { Paintbrush2 } from 'lucide-react';
import { useMindBoardStore } from '@/stores/mindBoardStore';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

const colors = [
  {
    name: 'blue',
    border: 'border-blue-400 dark:border-blue-500', bg: 'rgba(59, 130, 246, 0.2)',
    text: 'text-blue-800 dark:text-blue-200'
  },
  {
    name: 'green',
    border: 'border-green-400 dark:border-green-500', bg: 'rgba(34, 197, 94, 0.2)',
    text: 'text-green-800 dark:text-green-200'
  },
  {
    name: 'purple',
    border: 'border-purple-400 dark:border-purple-500', bg: 'rgba(147, 51, 234, 0.2)',
    text: 'text-purple-800 dark:text-purple-200'
  },
  {
    name: 'yellow',
    border: 'border-yellow-400 dark:border-yellow-500', bg: 'rgba(234, 179, 8, 0.2)',
    text: 'text-yellow-800 dark:text-yellow-200'
  },
  {
    name: 'red',
    border: 'border-red-400 dark:border-red-500', bg: 'rgba(239, 68, 68, 0.2)',
    text: 'text-red-800 dark:text-red-200'
  },
  {
    name: 'gray',
    border: 'theme-border-primary',
    bg: 'rgba(var(--bg-tertiary), 0.8)',
    text: 'theme-text-primary'
  },
];

export const MindMapNode: React.FC<NodeProps> = ({ data, id, selected, xPos, yPos }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '新节点');
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentBoard, updateBoard, deleteNode } = useMindBoardStore();
  const { fitBounds } = useReactFlow();
  const currentColor = colors[colorIndex];

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    updateNodeData();
  }, [label, colorIndex, id, currentBoard, updateBoard]);

  const updateNodeData = useCallback(() => {
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node =>
        node.id === id
          ? {
            ...node,
            data: { ...node.data, label, colorIndex }
          }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  }, [label, colorIndex, id, currentBoard, updateBoard]);

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
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteNode) {
      setIsDeleting(true);
      try {
        deleteNode(id);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Failed to delete mind map node:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAddChild = () => {
    if (currentBoard) {
      const newNodeId = `mindmap-${Date.now()}`;
      const newNode = {
        id: newNodeId,
        type: 'mindMapNode',
        position: {
          x: (xPos || 0) + 200,
          y: (yPos || 0) + Math.random() * 100 - 50
        },
        data: {
          label: '子节点',
          colorIndex: Math.floor(Math.random() * colors.length)
        }
      };

      const newEdge = {
        id: `edge-${id}-${newNodeId}`,
        source: id,
        target: newNodeId,
        type: 'mindMapEdge',
        animated: false
      };

      const updatedNodes = [...currentBoard.nodes, newNode];
      const updatedEdges = [...currentBoard.edges, newEdge];

      updateBoard(currentBoard.id, {
        nodes: updatedNodes,
        edges: updatedEdges
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label || '新节点');
    }
  };

  const handleFocus = () => {
    const padding = 50;
    fitBounds(
      {
        x: (xPos || 0) - padding,
        y: (yPos || 0) - padding,
        width: 200 + padding * 2,
        height: 80 + padding * 2
      },
      { duration: 800, padding: 0.1 }
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="mindmap-node relative group">
      <Handle type="target" 
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 border-2 border-white shadow-md"
      />
      
      {/* Floating operation buttons - only show when selected */}
      {selected && (
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 z-50 nodrag">
          <div className="flex items-center justify-center gap-1">
            {/* Color picker */}
            <div className="relative">
              <button onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
                title="更改颜色"
              >
                <Paintbrush2 className="w-3.5 h-3.5 theme-text-primary" />
              </button>
              
              {showColorPicker && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
                  <div className="flex gap-1 p-2 backdrop-blur-sm bg-white/95 dark:bg-black/95 rounded-lg shadow-lg">
                    {colors.map((color, index) => (
                      <button key={color.name} onClick={() => handleColorChange(index)}
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
            
            <button onClick={handleFocus}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
              title="聚焦节点"
            >
              <Target className="w-3.5 h-3.5 theme-text-primary" />
            </button>
            
            <button onClick={handleEdit}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
              title="编辑节点"
            >
              <Edit className="w-3.5 h-3.5 theme-text-primary" />
            </button>

            <button onClick={handleAddChild}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
              title="添加子节点"
            >
              <Plus className="w-3.5 h-3.5 theme-text-primary" />
            </button>
            
            <button onClick={handleDelete}
            className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/70 dark:bg-white/10 hover:bg-black/60 dark:hover:bg-white/20 transition-all"
              title="删除节点"
            >
              <Trash2 className="w-3.5 h-3.5 theme-text-error" />
            </button>
          </div>
        </div>
      )}

      <div className={`px-4 py-2 rounded-lg border-2 ${currentColor.border} ${currentColor.text} cursor-pointer transition-all hover:scale-105 min-w-[120px] max-w-[200px] text-center shadow-md`}
        style={{ backgroundColor: currentColor.bg }}
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <input ref={inputRef} value={label}
            onChange={(e) => setLabel(e.target.value)} onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none text-center w-full font-medium"
            placeholder="输入节点名称"
          />
        ) : (
          <span className="font-medium text-sm">
            {label}
          </span>
        )}
      </div>

      <Handle type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 border-2 border-white shadow-md"
      />

      {/* 删除确认弹窗 */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="删除思维导图节点"
        itemName={label || '新节点'}
        isLoading={isDeleting}
      />
    </div>
  );
};












