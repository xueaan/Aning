import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Users, ChevronDown, ChevronRight, X, Palette } from 'lucide-react';
import { useMindBoardStore } from '@/stores/mindBoardStore';

const colors = [
  { name: 'blue', bg: 'theme-bg-accent/30', border: 'theme-border-accent', header: 'theme-bg-accent/50' },
  { name: 'green', bg: 'theme-bg-success/30', border: 'theme-border-accent', header: 'theme-bg-success/50' },
  { name: 'purple', bg: 'theme-bg-secondary/40', border: 'theme-border-accent', header: 'theme-bg-secondary/60' },
  { name: 'yellow', bg: 'theme-bg-warning/30', border: 'theme-border-accent', header: 'theme-bg-warning/50' },
  { name: 'red', bg: 'theme-bg-error/30', border: 'theme-border-error', header: 'theme-bg-error/50' },
  { name: 'gray', bg: 'theme-bg-secondary/30', border: 'theme-border', header: 'theme-bg-secondary/50' },
];

export const GroupNode: React.FC<NodeProps> = ({ data, id }) => {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);
  const [title, setTitle] = useState(data.title || '分组');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { currentBoard, updateBoard, deleteNode } = useMindBoardStore();

  const currentColor = colors[colorIndex];
  const nodeCount = data.nodeIds?.length || 0;

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node =>
        node.id === id
          ? { ...node, data: { ...node.data, title } }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  };

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node => {
        // 更新分组节点的折叠状态
        if (node.id === id) {
          return { ...node, data: { ...node.data, isCollapsed: newCollapsedState } };
        }
        // 隐藏/显示子节点
        if (data.nodeIds?.includes(node.id)) {
          return {
            ...node,
            hidden: newCollapsedState // ReactFlow 的 hidden 属性可以隐藏节点
          };
        }
        return node;
      });

      // 同时隐藏相关的连线
      const updatedEdges = currentBoard.edges.map(edge => {
        const isRelatedToHiddenNode = data.nodeIds?.includes(edge.source) || data.nodeIds?.includes(edge.target);
        return {
          ...edge,
          hidden: newCollapsedState && isRelatedToHiddenNode
        };
      });

      updateBoard(currentBoard.id, {
        nodes: updatedNodes,
        edges: updatedEdges
      });
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
      // 解组：将内部节点释放出来
      if (currentBoard && data.nodeIds) {
        // 获取分组节点的位置
        const groupNode = currentBoard.nodes.find(n => n.id === id);
      if (!groupNode) return;

      const updatedNodes = currentBoard.nodes.map(node => {
        if (data.nodeIds.includes(node.id)) {
          // 将相对坐标转换回绝对坐标
          const { parentNode, extent, ...rest } = node;
          return {
            ...rest,
            position: {
              // 绝对位置 = 相对位置 + 父节点位置
              x: node.position.x + groupNode.position.x,
              y: node.position.y + groupNode.position.y
            }
          };
        }
        return node;
      }).filter(node => node.id !== id);

        updateBoard(currentBoard.id, { nodes: updatedNodes });
      } else {
        deleteNode(id);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(data.title || '分组');
    }
  };

  return (
  <div className="group-node relative group" style={{ width: '100%', height: '100%' }}>
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />

    {/* 操作按钮 - 放在分组内部右上角 */}
    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
      <button onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 theme-bg-primary rounded shadow-md hover:shadow-lg"
      title="换色"
        >
      <Palette className="w-3 h-3" />
    </button>
    <button onClick={handleDelete}
            className="p-1 theme-bg-primary rounded shadow-md hover:shadow-lg hover:theme-bg-error/20"
    title="解散分组"
        >
    <X className="w-3 h-3" />
  </button>
      </div>
      {/* 颜色选择器 */}
{
  showColorPicker && (
    <div className="absolute -top-10 right-0 flex gap-1 p-1 theme-card rounded shadow-lg z-20">
      {colors.map((color, index) => (
          <button key={color.name} onClick={() => handleColorChange(index)}
            className={`w-6 h-6 rounded ${color.border} ${color.bg} hover:scale-110 transition-transform`}
            title={color.name}
          />
        ))}
        </div>
      )
      }

      <div className={`rounded-lg ${currentColor.bg} ${currentColor.border} border-2 border-dashed`}
        style={{
          width: isCollapsed ? '250px' : '100%',
          height: isCollapsed ? 'auto' : '100%',
          minWidth: isCollapsed ? '250px' : '100px',
          minHeight: isCollapsed ? '60px' : '100px'
        }}
>
        <div className={`flex items-center justify-between px-3 py-2 ${currentColor.header} rounded-t-md cursor-pointer`}
          onClick={toggleCollapse}>
          <div className="flex items-center gap-2">
            <button className="p-0.5 hover:theme-bg-primary/20 rounded">
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <Users className="w-4 h-4" />
            {isEditingTitle ? (
              <input type="text"
                value={title} onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave} onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="px-1 bg-transparent border-b theme-border-primary outline-none text-sm font-medium"
                autoFocus />
            ) : (
              <span className="text-sm font-medium cursor-text"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
              >
                {title}
              </span>
            )}
            <span className="text-xs theme-text-secondary">
              ({nodeCount} 节点)
            </span>
          </div>
        </div>

{
  !isCollapsed && (
    <div className="p-4">
      {/* 分组内容区域 - 子节点会由 ReactFlow 渲染在这里 */}
      <div className="text-xs theme-text-secondary text-center mt-4">
                拖动节点到此区域
      </div>
    </div>
  )
}
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
};











