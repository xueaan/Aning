import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Node,
  Background,
  BackgroundVariant,
  SelectionMode,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  ReactFlowProvider,
  useReactFlow,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Plus, Trash2, Image, StickyNote as StickyNoteIcon, Download, Users, Search, Brain } from 'lucide-react';
import { useMindBoardStore } from '@/stores/mindBoardStore';
import { TextCard } from './nodes/TextCard';
import { NoteCard } from './nodes/NoteCard';
import { ImageCard } from './nodes/ImageCard';
import { TodoCard } from './nodes/TodoCard';
import { StickyNote } from './nodes/StickyNote';
import { GroupNode } from './nodes/GroupNode';
import { MindMapNode } from './nodes/MindMapNode';
import { CardSearchModal } from './components/CardSearchModal';
import { MindMapEdge } from './edges/MindMapEdge';
import { createMindMap } from './utils/mindMapGenerator';
import { exportToPNG } from './utils/export';
import './styles.css';
import './styles/selection.css';
import './styles/custom-controls.css';

const nodeTypes = {
  textCard: TextCard,
  noteCard: NoteCard,
  imageCard: ImageCard,
  todoCard: TodoCard,
  stickyNote: StickyNote,
  groupNode: GroupNode,
  mindMapNode: MindMapNode
};

const edgeTypes = {
  mindMapEdge: MindMapEdge
};

const BoardCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { project, fitBounds: _fitBounds } = useReactFlow();


  const {
    currentBoard,
    updateBoard,
    exitCanvas,
    deleteBoard
  } = useMindBoardStore();

  // Store references removed - themeMode cleanup
  if (!currentBoard) {
    return null;
  }

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      console.log('onNodesChange called with:', changes);
      const newNodes = applyNodeChanges(changes, currentBoard.nodes);
      console.log('Applying node changes, result:', newNodes.length, 'nodes');
      updateBoard(currentBoard.id, { nodes: newNodes });
      // 更新选中节点数量
      const selected = newNodes.filter(n => n.selected && n.type !== 'groupNode');
      setSelectedCount(selected.length);
    },
    [currentBoard, updateBoard]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, currentBoard.edges);
      updateBoard(currentBoard.id, { edges: newEdges });
    },
    [currentBoard, updateBoard]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, currentBoard.edges);
      updateBoard(currentBoard.id, { edges: newEdges });
    },
    [currentBoard, updateBoard]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      });

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position,
        data: type === 'textCard'
          ? { text: '新文字卡片' }
          : { content: '# 新笔记卡片\n\n在这里输入内容...' }
      };

      const newNodes = [...currentBoard.nodes, newNode];
      updateBoard(currentBoard.id, { nodes: newNodes });
    },
    [currentBoard, updateBoard, project]
  );

  const handleAddTextCard = () => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'textCard',
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: { text: '新文字卡片' }
    };

    console.log('Adding new text card:', newNode);
    console.log('Current board nodes before:', currentBoard.nodes.length);

    const newNodes = [...currentBoard.nodes, newNode];
    console.log('New nodes array:', newNodes.length);

    updateBoard(currentBoard.id, { nodes: newNodes });
  };

  // 创建思维导图（简化版）
  const handleCreateMindMap = () => {
    const centerPosition = {
      centerX: 400 + Math.random() * 200,
      centerY: 300 + Math.random() * 200,
      topic: '新思维导图',
      subtopics: [] // 不创建子节点
    };

    const { nodes: mindMapNodes, edges: mindMapEdges } = createMindMap(centerPosition);

    console.log('Creating mindmap:', { mindMapNodes, mindMapEdges });

    const newNodes = [...currentBoard.nodes, ...mindMapNodes];
    const newEdges = [...currentBoard.edges, ...mindMapEdges];

    updateBoard(currentBoard.id, {
      nodes: newNodes,
      edges: newEdges
    });
  };

  // 从搜索的卡片创建节点
  const handleAddCardFromSearch = (card: any) => {
    const newNode: Node = {
      id: `card-${card.id}-${Date.now()}`,
      type: 'noteCard',
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: {
        title: card.title || '无标题笔记',
        content: card.content || '空笔记',
        sourceCardId: card.id,
        sourceCardTitle: card.title,
        colorIndex: Math.floor(Math.random() * 6)
      }
    };

    console.log('Adding card from search:', newNode);

    const newNodes = [...currentBoard.nodes, newNode];
    updateBoard(currentBoard.id, { nodes: newNodes });
  };

  const handleAddNode = (type: string, data: any) => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type,
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data
    };

    console.log('Adding new node:', type, newNode);

    const newNodes = [...currentBoard.nodes, newNode];
    updateBoard(currentBoard.id, { nodes: newNodes });
  };

  const handleDeleteBoard = () => {
    if (confirm('确定要删除这个思维板吗？此操作不可恢复。')) {
      deleteBoard(currentBoard.id);
      exitCanvas();
    }
  };

  const handleGroupSelected = () => {
    const selectedNodes = currentBoard.nodes.filter(node => node.selected && node.type !== 'groupNode');
    if (selectedNodes.length < 2) {
      return; // 不显示 alert，更友好
    }

    // 获取节点实际尺寸，如果没有则使用默认值
    const nodeWithSizes = selectedNodes.map(node => ({
      ...node,
      width: node.width || (node.type === 'stickyNote' ? 250 : node.type === 'noteCard' ? 400 : 300),
      height: node.height || (node.type === 'stickyNote' ? 150 : node.type === 'noteCard' ? 250 : 150)
    }));

    // 计算分组范围，添加更多 padding
    const padding = 30;
    const bounds = {
      minX: Math.min(...nodeWithSizes.map(n => n.position.x)) - padding,
      minY: Math.min(...nodeWithSizes.map(n => n.position.y)) - padding,
      maxX: Math.max(...nodeWithSizes.map(n => n.position.x + n.width)) + padding,
      maxY: Math.max(...nodeWithSizes.map(n => n.position.y + n.height)) + padding
    };

    const groupNode: Node = {
      id: `group-${Date.now()}`,
      type: 'groupNode',
      position: { x: bounds.minX, y: bounds.minY },
      data: {
        title: `分组 ${currentBoard.nodes.filter(n => n.type === 'groupNode').length + 1}`,
        nodeIds: selectedNodes.map(n => n.id),
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY,
        colorIndex: Math.floor(Math.random() * 6),
        isCollapsed: false
      },
      style: {
        zIndex: -1,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxY - bounds.minY
      },
      draggable: true,
      selectable: true
    };

    // 将节点的绝对坐标转换为相对于分组的坐标
    const updatedNodes = currentBoard.nodes.map(node => {
      if (selectedNodes.find(n => n.id === node.id)) {
        return {
          ...node,
          // 转换为相对坐标：子节点位置 = 绝对位置 - 父节点位置
          position: {
            x: node.position.x - bounds.minX,
            y: node.position.y - bounds.minY
          },
          parentNode: groupNode.id,
          extent: 'parent' as const, // 限制在父节点内
          selected: false
        };
      }
      return node;
    });

    updateBoard(currentBoard.id, {
      nodes: [...updatedNodes, groupNode]
    });
  };

  const handleExportPNG = async () => {
    if (reactFlowWrapper.current) {
      setIsExporting(true);
      try {
        const element = reactFlowWrapper.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (element) {
          await exportToPNG(element, `${currentBoard.title}.png`);
        }
      } catch (error) {
        console.error('导出失败:', error);
        alert('导出PNG失败，请重试');
      }
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow 
        key={`${currentBoard.id}-${currentBoard.nodes.length}`} 
        nodes={currentBoard.nodes} 
        edges={currentBoard.edges}
        onNodesChange={onNodesChange} 
        onEdgesChange={onEdgesChange}
        onConnect={onConnect} 
        onDragOver={onDragOver}
        onDrop={onDrop} 
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        selectionMode={SelectionMode.Partial} 
        selectionOnDrag={true}
        panOnDrag={[1, 2]} 
        selectNodesOnDrag={true}
        multiSelectionKeyCode={null}
      >
        <Panel position="top-left" className="flex gap-2">
          <button 
            onClick={exitCanvas}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all backdrop-blur-md bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 text-black dark:text-white shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
          
          <div className="flex items-center px-3 py-2 rounded-lg backdrop-blur-md bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white shadow-lg">
            <span className="font-medium">
              {currentBoard.title}
            </span>
          </div>
        </Panel>

        <Background variant={BackgroundVariant.Dots} gap={12} size={16} />
      </ReactFlow>

      {/* 底部横向工具栏 */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 p-3 backdrop-blur-lg bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-2xl shadow-xl">
          {/* 节点创建按钮组 */}
          <button 
            onClick={handleAddTextCard}
            className="p-3 backdrop-blur-sm bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 hover:scale-105 transition-all rounded-xl text-black dark:text-white shadow-lg"
            title="文字卡片"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => handleAddNode('imageCard', { imageUrl: '' })}
            className="p-3 backdrop-blur-sm bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 hover:scale-105 transition-all rounded-xl text-black dark:text-white shadow-lg"
            title="图片卡片"
          >
            <Image className="w-5 h-5" />
          </button>

          <button 
            onClick={() => handleAddNode('stickyNote', { text: '', colorIndex: Math.floor(Math.random() * 6) })}
            className="p-3 backdrop-blur-sm bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 hover:scale-105 transition-all rounded-xl text-black dark:text-white shadow-lg"
            title="便签"
          >
            <StickyNoteIcon className="w-5 h-5" />
          </button>

          <button 
            onClick={() => setSearchModalOpen(true)}
            className="p-3 backdrop-blur-sm bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 hover:scale-105 transition-all rounded-xl text-black dark:text-white shadow-lg"
            title="搜索笔记卡片"
          >
            <Search className="w-5 h-5" />
          </button>

          <button 
            onClick={handleCreateMindMap}
            className="p-3 backdrop-blur-sm bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 hover:scale-105 transition-all rounded-xl text-black dark:text-white shadow-lg"
            title="创建思维导图"
          >
            <Brain className="w-5 h-5" />
          </button>

          {/* 分隔线 */}
          <div className="h-8 w-px bg-black/20 dark:bg-white/20 mx-2"></div>

          {/* 操作按钮组 */}
          <button 
            onClick={handleGroupSelected} 
            disabled={selectedCount < 2}
            className={`relative p-3 rounded-xl transition-all shadow-lg ${
              selectedCount >= 2 
                ? 'backdrop-blur-sm bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 hover:scale-105 text-black dark:text-white' 
                : 'bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/40 dark:text-white/40 cursor-not-allowed opacity-50'
            }`}
            title={selectedCount >= 2 ? `分组 ${selectedCount} 个节点 (CtrlG)` : '请选择至少2个节点'}
          >
            <Users className="w-5 h-5" />
            {selectedCount >= 2 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedCount}
              </span>
            )}
          </button>

          <button 
            onClick={handleExportPNG} 
            disabled={isExporting}
            className="p-3 backdrop-blur-sm bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 rounded-xl transition-all hover:scale-105 disabled:opacity-50 text-black dark:text-white shadow-lg"
            title="导出为图片"
          >
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>

          <button 
            onClick={handleDeleteBoard}
            className="p-3 backdrop-blur-sm bg-white/10 dark:bg-white/10 border border-black/20 dark:border-white/20 hover:bg-red-500/20 dark:hover:bg-red-500/20 rounded-xl transition-all hover:scale-105 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 shadow-lg"
            title="删除思维板"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 搜索笔记对话框 */}
      <CardSearchModal 
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectCard={handleAddCardFromSearch}
      />
    </div>
  );
};

export const BoardCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <BoardCanvasInner />
    </ReactFlowProvider>
  );
};