import React, { useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckSquare, Square, Plus, X, Palette } from 'lucide-react';
import { useMindBoardStore } from '@/stores/mindBoardStore';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

const colors = [
  { name: 'indigo', border: 'border-indigo-200 dark:border-indigo-700', bg: 'bg-indigo-50 dark:bg-indigo-900/30', header: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700', progress: 'bg-indigo-500' },
  { name: 'blue', border: 'border-blue-200 dark:border-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/30', header: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700', progress: 'bg-blue-500' },
  { name: 'green', border: 'border-green-200 dark:border-green-700', bg: 'bg-green-50 dark:bg-green-900/30', header: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700', progress: 'bg-green-500' },
  { name: 'purple', border: 'border-purple-200 dark:border-purple-700', bg: 'bg-purple-50 dark:bg-purple-900/30', header: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700', progress: 'bg-purple-500' },
  { name: 'orange', border: 'border-orange-200 dark:border-orange-700', bg: 'bg-orange-50 dark:bg-orange-900/30', header: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700', progress: 'bg-orange-500' },
  { name: 'gray', border: 'theme-border', bg: 'theme-bg-secondary/30', header: 'theme-bg-secondary/30 theme-border', progress: 'theme-bg-secondary' },
];

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export const TodoCard: React.FC<NodeProps> = ({ data, id }) => {
  const [todos, setTodos] = useState<TodoItem[]>(data.todos || []);
  const [newTodoText, setNewTodoText] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [colorIndex, setColorIndex] = useState(data.colorIndex || 0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { currentBoard, updateBoard, deleteNode } = useMindBoardStore();
  const currentColor = colors[colorIndex];

  const updateNodeData = useCallback((newTodos: TodoItem[]) => {
    if (currentBoard) {
      const updatedNodes = currentBoard.nodes.map(node =>
        node.id === id
          ? { ...node, data: { ...node.data, todos: newTodos, colorIndex } }
          : node
      );
      updateBoard(currentBoard.id, { nodes: updatedNodes });
    }
  }, [currentBoard, updateBoard, id, colorIndex]);

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
        console.error('Failed to delete todo card:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const toggleTodo = (todoId: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    updateNodeData(updatedTodos);
  };

  const addTodo = () => {
    if (newTodoText.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: newTodoText.trim(),
        completed: false
      };
      const updatedTodos = [...todos, newTodo];
      setTodos(updatedTodos);
      updateNodeData(updatedTodos);
      setNewTodoText('');
      setIsAddingTodo(false);
    }
  };

  const deleteTodo = (todoId: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== todoId);
    setTodos(updatedTodos);
    updateNodeData(updatedTodos);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTodo();
    } else if (e.key === 'Escape') {
      setIsAddingTodo(false);
      setNewTodoText('');
    }
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="todo-card-node relative group">
      <Handle
        type="target"
        position={Position.Top}
        id="todo-target-top"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="todo-target-left"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />

      {/* 操作按钮  */}
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-1 theme-bg-secondary/80 backdrop-blur-sm rounded border theme-border-secondary hover:theme-bg-secondary"
          title="换色"
        >
          <Palette className="w-3 h-3" />
        </button>
        <button 
          onClick={handleDelete}
          className="p-1 theme-bg-secondary/80 backdrop-blur-sm rounded border theme-border-secondary hover:theme-bg-error/20"
          title="删除"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* 颜色选择器 */}
      {
        showColorPicker && (
    <div className="absolute -top-10 right-0 flex gap-1 p-1 theme-bg-secondary/90 backdrop-blur-sm rounded border theme-border-secondary shadow-lg z-10">
      {colors.map((color, index) => (
        <button 
          key={color.name} 
          onClick={() => handleColorChange(index)}
          className={`w-6 h-6 rounded ${color.border} ${color.bg} hover:scale-110 transition-transform`}
          title={color.name}
        />
      ))}
    </div>
  )
}

      <div className={`theme-bg-primary/80 backdrop-blur-sm rounded-lg shadow-lg border-2 ${currentColor.border} min-w-[280px] max-w-[400px]`}>
  <div className={`px-3 py-2 ${currentColor.header} border-b`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 theme-text-secondary" />
        <span className="text-sm font-medium theme-text-primary">
          任务卡片
        </span>
      </div>
      {totalCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs theme-text-secondary">
            {completedCount}/{totalCount}
          </span>
          <div className="w-16 h-2 theme-bg-secondary/50 rounded-full overflow-hidden">
            <div className={`h-full ${currentColor.progress} transition-all duration-300`}
            style={{ width: `${progress}%` }}
                  />
          </div>
        </div>
      )}
    </div>
  </div>

  <div className="p-3">
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {todos.map(todo => (
        <div key={todo.id}
            className="flex items-center gap-2 group hover:theme-bg-secondary/50 p-1 rounded transition-colors"
        >
          <button onClick={() => toggleTodo(todo.id)} className="flex-shrink-0 theme-text-accent hover:theme-text-accent/80"
        >
        {
          todo.completed ? (
            <CheckSquare className="w-5 h-5" />
          ) : (
            <Square className="w-5 h-5" />
          )
        }
                </button>
    <span className={`flex-1 text-sm ${todo.completed
          ? 'line-through theme-text-secondary/70'
          : 'theme-text-primary'
        }`}
    >
      {todo.text}
    </span>
    <button onClick={() => deleteTodo(todo.id)}
            className="opacity-0 group-hover:opacity-100 theme-text-error hover:theme-text-error/80 transition-opacity"
                >
      <X className="w-4 h-4" />
  </button>
</div>
            ))}

{
  isAddingTodo ? (
    <div className="flex items-center gap-2 mt-2">
      <Square className="w-5 h-5 theme-text-secondary flex-shrink-0" />
      <input type="text"
        value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)}
        onKeyDown={handleKeyDown} 
        onBlur={() => {
          if (!newTodoText.trim()) {
            setIsAddingTodo(false);
          }
        }}
      
            className="flex-1 text-sm px-2 py-1 border theme-border-accent rounded bg-transparent outline-none focus:theme-border-accent/80"
      placeholder="输入任务内容..."
                  autoFocus />
    </div>
  ) : (
    <button onClick={() => setIsAddingTodo(true)}
            className="flex items-center gap-2 w-full mt-2 px-2 py-1 text-sm theme-text-accent hover:theme-bg-accent/10 rounded transition-colors"
    >
      <Plus className="w-4 h-4" />
      添加任务
    </button>
  )
}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="todo-source-bottom"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="todo-source-right"
        className="!w-3 !h-3 !bg-white/90 !border-2 !border-gray-400 hover:!border-blue-500 hover:!scale-110 transition-all"
      />

      {/* 删除确认弹窗 */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="删除待办卡片"
        itemName="这个待办卡片"
        isLoading={isDeleting}
      />
    </div>
  );
};












