import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskPriority } from '@/types';
import { useTaskBoxStore } from '@/stores';
import { getIconComponent } from '@/constants/commonIcons';
import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import { formatDate } from '@/utils/timeUtils';
import { Plus, Check, X, ChevronDown } from 'lucide-react';

interface InlineTaskAddProps {
  placeholder?: string;
  defaultProjectId?: number | null;
  defaultDueDate?: string;
  onTaskAdded?: (task: Task) => void;
  className?: string;
  showProject?: boolean;
}

export const InlineTaskAdd: React.FC<InlineTaskAddProps> = ({
  placeholder = "点击添加新任务...",
  defaultProjectId = null,
  defaultDueDate,
  onTaskAdded,
  className = "",
  showProject = true
}) => {
  const { createTask, projects, currentView } = useTaskBoxStore();

  // 状态管理
  const [isActive, setIsActive] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(defaultDueDate || '');
  const [projectId, setProjectId] = useState<number | null>(defaultProjectId);
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // 引用管理
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 点击外部区域取消
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    if (isActive) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActive]);

  // 激活输入状态
  const handleActivate = () => {
    setIsActive(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  };

  // 取消输入
  const handleCancel = () => {
    if (!title.trim()) {
      setIsActive(false);
      setTitle('');
      setPriority('medium');
      setDueDate(defaultDueDate || '');
      setProjectId(defaultProjectId);
    }
  };

  // 添加任务
  const handleAddTask = async () => {
    if (!title.trim()) {
      titleInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      // 根据当前视图设置默认值
      let finalDueDate = dueDate;
      if (currentView === 'today' && !dueDate) {
        finalDueDate = formatDate(new Date());
      }

      const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        title: title.trim(),
        description: undefined,
        status: 'todo',
        priority,
        due_date: finalDueDate && finalDueDate.trim() ? finalDueDate.trim() : undefined,
        project_id: projectId,
        tags: []
      };

      await createTask(newTask);

      // 重置表单
      setTitle('');
      setPriority('medium');
      setDueDate(defaultDueDate || '');
      setProjectId(defaultProjectId);
      setIsActive(false);

      // 回调
      if (onTaskAdded) {
        onTaskAdded(newTask as Task);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 获取优先级选项
  const priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: 'urgent', label: '紧急' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' }
  ];

  // 获取选中的项目
  const selectedProject = projects.find(p => p.id === projectId);

  // 处理项目选择
  const handleProjectSelect = (project: any) => {
    setProjectId(project.id);
    setShowProjectPicker(false);
  };

  // 处理点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowProjectPicker(false);
      }
    };

    if (showProjectPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectPicker]);

  if (!isActive) {
    // 非激活状态 - 毛玻璃风格
    return (
      <div className={`${className}`} ref={containerRef}>
        <button 
          onClick={handleActivate}
          className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg transition-all duration-200 hover:shadow-sm theme-text-secondary hover:theme-text-primary feather-glass-deco"
        >
          <Plus size={16} className="theme-text-secondary" />
          <span className="text-sm">{placeholder}</span>
        </button>
      </div>
    );
  }

  // 激活状态 - 毛玻璃风格
  return (
    <div className={`${className} relative`} ref={containerRef}>
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 shadow-sm feather-glass-deco">
      {/* 占位复选框 */}
      <div className="flex-shrink-0 w-4 h-4 border-2 border-white/20 rounded"></div>
      <div className="flex-1 min-w-0">
        <input 
          ref={titleInputRef} 
          type="text"
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown} 
          placeholder="输入任务标题..."
          className="w-full text-sm font-medium bg-transparent border-none outline-none theme-text-primary theme-placeholder"
        />
      </div>
      {showProject && (
        <div className="flex-shrink-0 relative w-28">
          <button 
            className="w-full flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-xs"
            onClick={() => setShowProjectPicker(!showProjectPicker)}
          >
            {selectedProject ? (
              <>
                <span className="flex items-center justify-center w-3 h-3">
                  {selectedProject.icon?.length === 1 ? (
                    <span className="text-xs">{selectedProject.icon}</span>
                  ) : (
                    React.createElement(getIconComponent(selectedProject.icon || 'Folder'), {
                      theme: 'outline',
                      size: 12,
                      fill: 'currentColor',
                      strokeWidth: 2,
                      className: 'theme-text-secondary'
                    })
                  )}
                </span>
                <span className="theme-text-primary truncate">{selectedProject.name}</span>
              </>
            ) : (
              <span className="theme-text-tertiary">无项目</span>
            )}
            <ChevronDown size={10} className="theme-text-secondary ml-auto" />
          </button>
          {showProjectPicker && (
            <div className="absolute bottom-full left-0 mb-1 w-full max-h-32 overflow-y-auto rounded-lg shadow-xl z-50 feather-glass-deco">
              <button 
                onClick={() => handleProjectSelect({ id: null })}
                className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-white/10 transition-all duration-200 text-left text-xs"
              >
                <span className="theme-text-tertiary">无项目</span>
              </button>
                {projects.map(project => (
              <button 
                key={project.id} 
                onClick={() => handleProjectSelect(project)}
                className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-white/10 transition-all duration-200 text-left text-xs"
              >
                <span className="flex items-center justify-center w-3 h-3">
                  {project.icon?.length === 1 ? (
                    <span className="text-xs">{project.icon}</span>
                  ) : (
                    React.createElement(getIconComponent(project.icon || 'Folder'), {
                      theme: 'outline',
                      size: 12,
                      fill: 'currentColor',
                      strokeWidth: 2,
                      className: 'theme-text-secondary'
                    })
                  )}
                </span>
                <span className="theme-text-primary truncate">{project.name}</span>
              </button>
            ))}
            </div>
          )}
        </div>
      )}

      {/* 优先级选择 */}
      <div className="flex-shrink-0 w-16">
        <div className="relative">
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-white/10 theme-text-accent font-medium">
            {priorityOptions.find(p => p.value === priority)?.label || '中'}
          </span>
        </div>
      </div>

      {/* 截止日期 */}
      <div className="flex-shrink-0 w-24">
        <DatePicker 
          value={dueDate} 
          onChange={setDueDate}
          placeholder="无日期"
          size="sm"
          showShortcuts={true} 
          shortcuts={[
            { label: '今天', value: () => formatDate(new Date()) },
            { label: '明天', value: () => formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) },
            { label: '清除', value: '' }
          ]}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex-shrink-0 flex items-center gap-1">
          <button 
            onClick={handleCancel}
            className="p-1 theme-text-secondary hover:theme-text-error hover:bg-white/10 transition-all duration-200 rounded"
            title="取消"
            disabled={isLoading}
          >
            <X size={16} />
          </button>
          
          <button 
            onClick={handleAddTask} 
            disabled={!title.trim() || isLoading}
            className="p-1 theme-text-secondary hover:theme-text-accent hover:bg-white/10 transition-all duration-200 rounded disabled:opacity-50"
            title="添加任务"
          >
            {isLoading ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={16} />
            )}
          </button>
      </div>
    </div>

      {/* 快捷键提示 */}
      <div className="px-4 py-1 text-xs theme-text-tertiary">
        按 Enter 添加任务，Esc 取消
      </div>
    </div>
  );
};











