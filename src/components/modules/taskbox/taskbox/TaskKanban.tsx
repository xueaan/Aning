import React, { useState, useCallback } from 'react';
import { Task, TaskProject, TaskStatus } from '@/types';
import { TaskItem } from './TaskItem';
import { SimpleTaskQuickAdd } from './SimpleTaskQuickAdd';
import { Plus } from 'lucide-react';

interface TaskKanbanProps {
  tasks: Task[];
  projects: TaskProject[];
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskDelete: (id: number) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
}

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
}

const columns: Column[] = [
  {
    id: 'todo',
    title: '待处理',
    color: 'theme-text-accent',
    bgColor: 'theme-bg-accent/10',
  },
  {
    id: 'in_progress',
    title: '进行中',
    color: 'theme-text-warning',
    bgColor: 'status-warning/10',
  },
  {
    id: 'completed',
    title: '已完成',
    color: 'theme-text-success',
    bgColor: 'status-success/10',
  },
  {
    id: 'cancelled',
    title: '已取消',
    color: 'theme-text-tertiary',
    bgColor: 'theme-bg-tertiary/50',
  },
];

export const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  projects,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate,
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState<TaskStatus | null>(null);

  // 按状态分组任务
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  // 处理拖拽覆盖
  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // 只有当鼠标真正离开区域时才清除高亮
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverColumn(null);
    }
  }, []);

  // 处理放置
  const handleDrop = useCallback(
    (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();

      if (draggedTask && draggedTask.status !== status) {
        const updates: Partial<Task> = { status };

        // 如果移动到已完成，设置完成时间
        if (status === 'completed') {
          updates.completed_at = new Date().toISOString();
        }
        // 如果从已完成移出，清除完成时间
        else if (draggedTask.status === 'completed') {
          updates.completed_at = undefined;
        }

        onTaskUpdate(draggedTask.id!, updates);
      }

      setDraggedTask(null);
      setDragOverColumn(null);
    },
    [draggedTask, onTaskUpdate]
  );

  // 处理快速添加任务
  const handleQuickAdd = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    onTaskCreate({
      ...taskData,
      status: showQuickAdd!,
    });
    setShowQuickAdd(null);
  };

  return (
    <div className="flex-1 overflow-auto p-3 md:p-4 lg:p-6">
      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 md:gap-4 lg:gap-6 auto-rows-fr">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isDragOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className={`flex flex-col bg-bg-secondary border border-border-primary rounded-lg transition-all min-h-[300px] ${
                isDragOver ? 'ring-2 ring-accent ring-opacity-50 bg-accent/5' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* 列头 */}
              <div className="flex-shrink-0 px-3 md:px-4 py-3 border-b border-border-primary">
                <div className="flex items-center justify-between">
                  <h3 className={`font-medium text-sm md:text-base ${column.color}`}>
                    {column.title}
                  </h3>
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-xs text-text-tertiary px-2 py-1 bg-bg-tertiary rounded-full min-w-6 text-center">
                      {columnTasks.length}
                    </span>
                    <button
                      onClick={() => setShowQuickAdd(column.id)}
                      className="p-1 text-text-tertiary hover:text-text-primary hover:bg-hover-bg rounded transition-colors"
                      title="添加任务"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-2 md:p-3 space-y-2 overflow-y-auto">
                {/* 快速添加 */}
                {showQuickAdd === column.id && (
                  <div className="mb-3">
                    <SimpleTaskQuickAdd
                      onSubmit={handleQuickAdd}
                      onCancel={() => setShowQuickAdd(null)}
                      defaultStatus={column.id}
                      placeholder={`在${column.title}中添加...`}
                      compact
                    />
                  </div>
                )}

                {/* 任务项 */}
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={`cursor-move transition-opacity ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    <TaskItem
                      task={task}
                      projects={projects}
                      onUpdate={(updates) => onTaskUpdate(task.id!, updates)}
                      onDelete={() => onTaskDelete(task.id!)}
                      compact={true}
                      showProject={true}
                    />
                  </div>
                ))}

                {/* 空状态 */}
                {columnTasks.length === 0 && showQuickAdd !== column.id && (
                  <div className="flex flex-col items-center justify-center py-8 md:py-12 text-text-tertiary">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-bg-tertiary flex items-center justify-center mb-2">
                      <Plus size={16} />
                    </div>
                    <p className="text-xs md:text-sm text-center mb-1">暂无任务</p>
                    <button
                      onClick={() => setShowQuickAdd(column.id)}
                      className="text-xs md:text-sm text-accent hover:text-accent-dark"
                    >
                      点击添加
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
