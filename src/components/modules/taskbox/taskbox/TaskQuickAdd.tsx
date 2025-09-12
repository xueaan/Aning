import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskPriority } from '@/types';
import { useTaskBoxStore } from '@/stores';
import { getIconComponent } from '@/constants/commonIcons';
import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import { formatDate } from '@/utils/timeUtils';
import { Plus, Check, ChevronDown, Flag } from 'lucide-react';

interface TaskQuickAddProps {
  placeholder?: string;
  defaultProjectId?: number | null;
  defaultDueDate?: string;
  onTaskAdded?: (task: Task) => void;
  className?: string;
}

export const TaskQuickAdd: React.FC<TaskQuickAddProps> = ({
  placeholder = "快速添加任务...",
  defaultProjectId = null,
  defaultDueDate,
  onTaskAdded,
  className = ""
}) => {
  const { createTask, projects, currentView } = useTaskBoxStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(defaultDueDate || '');
  const [projectId, setProjectId] = useState<number | null>(defaultProjectId);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部区域关闭展开状态
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // 检查是否点击在容器内
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }

      // 检查是否点击在 DatePicker 弹窗内
      const datePickerPopup = document.querySelector('[data-datepicker-popup="true"]');
      if (datePickerPopup && datePickerPopup.contains(target)) {
        return;
      }

      handleCancel();
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // 处理展开
  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // 处理取消
  const handleCancel = () => {
    if (!title.trim() && !description.trim()) {
      setIsExpanded(false);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(defaultDueDate || '');
      setProjectId(defaultProjectId);
    }
  };

  // 处理添加任务
  const handleAddTask = async () => {
    // 清除之前的错误状态
    setValidationError('');

    if (!title.trim()) {
      setValidationError('请输入任务标题');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      // 根据当前视图设置默认值
      let finalDueDate = dueDate;
      let finalProjectId = projectId;

      if (currentView === 'today' && !dueDate) {
        finalDueDate = formatDate(new Date());
      }

      const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'todo',
        priority,
        due_date: finalDueDate && finalDueDate.trim() ? finalDueDate.trim() : undefined,
        project_id: finalProjectId,
        tags: []
      };

      await createTask(newTask);

      // 显示成功状态
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // 重置表单
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(defaultDueDate || '');
      setProjectId(defaultProjectId);
      setIsExpanded(false);
      setValidationError('');

      // 回调
      if (onTaskAdded) {
        onTaskAdded(newTask as Task);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
      setValidationError('添加任务失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAddTask();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // getPriorityColor removed - was not used
  const priorityOptions: { value: TaskPriority; label: string; color: string; }[] = [
    { value: 'urgent', label: '紧急', color: 'text-red-500' },
    { value: 'high', label: '高', color: 'text-orange-500' },
    { value: 'medium', label: '中', color: 'text-blue-500' },
    { value: 'low', label: '低', color: 'text-green-500' }
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

  if (!isExpanded) {
    // 简化状态
    return (
      <div className={`${className}`} ref={containerRef}>
        <button 
          onClick={handleExpand} 
          className="w-full flex items-center gap-2 p-3 text-left rounded-lg transition-all duration-200 hover:shadow-sm theme-text-primary feather-glass-deco"
        >
          <Plus size={16} className="theme-text-secondary" />
          <span className="text-sm theme-text-secondary">{placeholder}</span>
        </button>
      </div>
    );
  }

  // 展开状态 - 毛玻璃风格
  return (
    <div className={`${className} relative`} ref={containerRef}>
      <motion.div 
        className="rounded-lg p-4 shadow-lg feather-glass-deco"
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{
          opacity: 1,
          scale: 1
        }}
        transition={{ duration: 0.2 }}
      >
    {/* 任务标题输入 */}
    <div className="relative">
        <motion.input 
          ref={inputRef} 
          type="text"
          value={title} 
          onChange={(e) => {
            setTitle(e.target.value);
            if (validationError && e.target.value.trim()) {
              setValidationError('');
            }
          }}
          onKeyDown={handleKeyDown} 
          placeholder="任务标题..."
          className={`w-full px-0 py-2 text-base bg-transparent border-none outline-none transition-colors ${validationError ? 'text-red-500' : 'theme-text-primary'} theme-placeholder`}
          animate={{
            x: validationError ? [0, -10, 10, -5, 5, 0] : 0
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <AnimatePresence>
      {validationError && (
        <motion.div 
          initial={{ opacity: 0, y: -10, height: 0 }} 
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }} 
          transition={{ duration: 0.2 }}
          className="text-red-500 text-sm mt-1 font-medium"
        >
          {validationError}
        </motion.div>
      )}
      </AnimatePresence>
      
      {/* 任务描述输入 */}
      <div className="relative mt-3">
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown} 
          placeholder="任务描述 (可选)"
          rows={2} 
          className="w-full px-0 py-1 text-sm bg-transparent border-none outline-none resize-none theme-text-secondary theme-placeholder"
        />
      </div>
      
      {/* 任务属性设置 */}
      <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-white/10">

        {/* 截止日期选择器 */}
        <div className="flex items-center gap-2">
          <DatePicker 
            value={dueDate} 
            onChange={setDueDate} 
            placeholder="选择截止日期"
            size="md"
            showShortcuts={true} 
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Flag size={16} className="theme-text-secondary" />
          <div className="flex gap-1">
            {priorityOptions.map(option => (
              <button 
                key={option.value} 
                type="button"
                onClick={() => setPriority(option.value)}
                className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 font-medium ${priority === option.value
                  ? 'theme-bg-accent theme-text-on-accent shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 theme-text-secondary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 项目选择器 */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm theme-text-secondary">项目:</span>
            <div className="relative">
              <button 
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 min-w-32"
                onClick={() => setShowProjectPicker(!showProjectPicker)}
              >
                {selectedProject ? (
                  <>
                    <span className="flex items-center justify-center w-4 h-4">
                      {selectedProject.icon?.length === 1 ? (
                        <span className="text-sm">{selectedProject.icon}</span>
                      ) : (
                        React.createElement(getIconComponent(selectedProject.icon || 'Folder'), {
                          theme: 'outline',
                          size: 14,
                          fill: 'currentColor',
                          strokeWidth: 2,
                          className: 'theme-text-secondary'
                        })
                      )}
                    </span>
                    <span className="theme-text-primary text-sm">{selectedProject.name}</span>
                  </>
                ) : (
                  <span className="theme-text-tertiary text-sm">选择项目</span>
                )}
                <ChevronDown size={12} className="theme-text-secondary" />
              </button>
              {showProjectPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-full max-h-40 overflow-y-auto rounded-lg shadow-xl z-50 feather-glass-deco">
                  <button 
                    type="button"
                    onClick={() => handleProjectSelect({ id: null })}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-all duration-200 text-left"
                  >
                    <span className="theme-text-tertiary text-sm">无项目</span>
                  </button>
                  {projects.map(project => (
                    <button 
                      key={project.id} 
                      type="button"
                      onClick={() => handleProjectSelect(project)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-all duration-200 text-left"
                    >
                      <span className="flex items-center justify-center w-4 h-4">
                        {project.icon?.length === 1 ? (
                          <span className="text-sm">{project.icon}</span>
                        ) : (
                          React.createElement(getIconComponent(project.icon || 'Folder'), {
                            theme: 'outline',
                            size: 14,
                            fill: 'currentColor',
                            strokeWidth: 2,
                            className: 'theme-text-secondary'
                          })
                        )}
                      </span>
                      <span className="theme-text-primary text-sm">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
        
        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs theme-text-muted">
            按 <kbd className="px-1 py-0.5 text-[10px] font-mono theme-bg-secondary border theme-border rounded">CtrlEnter</kbd> 快速添加
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="px-3 py-1.5 text-xs border theme-border rounded hover:theme-border-hover theme-text-secondary transition-colors"
              disabled={isLoading}
            >
              取消
            </button>
            <motion.button
              onClick={handleAddTask}
              disabled={!title.trim() || isLoading}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed theme-text-on-accent transition-colors ${
                showSuccess
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'theme-bg-accent hover:theme-bg-accent-hover'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                scale: showSuccess ? [1, 1.05, 1] : 1,
                backgroundColor: showSuccess ? '#22c55e' : undefined
              }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {isLoading && (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, rotate: 0 }} 
                    animate={{ opacity: 1, rotate: 360 }}
                    exit={{ opacity: 0 }} 
                    transition={{ 
                      duration: 0.2, 
                      rotate: { duration: 1, repeat: Infinity, ease: 'linear' } 
                    }}
                    className="w-3 h-3 border border-white/30 border-t-white rounded-full"
                  />
                )}
                {showSuccess && !isLoading && (
                  <motion.div 
                    key="success"
                    initial={{ scale: 0, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }} 
                    transition={{ duration: 0.2 }}
                  >
                    <Check size={16} />
                  </motion.div>
                )}
                {!isLoading && !showSuccess && (
                  <motion.div 
                    key="normal"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.span 
                animate={{ color: showSuccess ? '#ffffff' : undefined }}
                transition={{ duration: 0.3 }}
              >
                {showSuccess ? '已添加!' : '添加任务'}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};












