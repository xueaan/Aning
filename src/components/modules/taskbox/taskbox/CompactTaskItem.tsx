import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskProject, TaskPriority, TaskStatus } from '@/types';
import { useTaskBoxStore } from '@/stores';
import { getIconComponent } from '@/constants/commonIcons';
import { Edit2, Trash2, Calendar, ChevronDown } from 'lucide-react';
import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { formatDate as formatDateUtil } from '@/utils/timeUtils';

interface CompactTaskItemProps {
  task: Task;
  projects: TaskProject[];
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  showProject?: boolean;
}

export const CompactTaskItem: React.FC<CompactTaskItemProps> = ({
  task,
  projects,
  onUpdate,
  onDelete,
  showProject = true,
}) => {
  const { toggleTaskStatus } = useTaskBoxStore();

  // 编辑状态管理
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // 输入框引用
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const projectPickerRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 查找任务关联的项目
  const project = projects.find((p) => p.id === task.project_id);

  // 检查任务是否逾期
  const isOverdue = task.due_date
    ? new Date(task.due_date) < new Date() && task.status !== 'completed'
    : false;

  // 自动聚焦到编辑输入框
  useEffect(() => {
    if (editField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    if (editField && selectRef.current) {
      selectRef.current.focus();
    }
    // 显示项目选择器
    if (editField === 'project') {
      setShowProjectPicker(true);
    }
  }, [editField]);

  // 处理点击外部关闭项目选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectPickerRef.current && !projectPickerRef.current.contains(event.target as Node)) {
        setShowProjectPicker(false);
        if (editField === 'project') {
          setEditField(null);
          setEditValue('');
        }
      }
    };

    if (showProjectPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProjectPicker, editField]);

  // 处理任务完成状态切换
  const handleToggleComplete = async () => {
    try {
      await toggleTaskStatus(task.id!);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 开始编辑字段
  const handleStartEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editField) {
      handleCancelEdit();
      return;
    }

    // 对于非标题字段，允许空值（比如清除日期）
    if (editField === 'title' && !editValue.trim()) {
      handleCancelEdit();
      return;
    }

    try {
      const updates: Partial<Task> = {};

      switch (editField) {
        case 'title':
          updates.title = editValue.trim();
          break;
        case 'due_date':
          updates.due_date = editValue && editValue.trim() ? editValue.trim() : undefined;
          break;
        case 'priority':
          updates.priority = editValue as TaskPriority;
          break;
        case 'status':
          updates.status = editValue as TaskStatus;
          break;
        case 'project':
          updates.project_id = editValue ? parseInt(editValue) : null;
          break;
      }

      await onUpdate(updates);
      setEditField(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to save task edit:', error);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditField(null);
    setEditValue('');
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // 处理任务删除
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  // 确认删除任务
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    try {
      if (date.toDateString() === today.toDateString()) {
        return '今天';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return '明天';
      } else {
        return date.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
      }
    } catch (error) {
      console.error('formatDate error:', error);
      return dateString;
    }
  };

  // 获取优先级选项
  const priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: 'urgent', label: '紧急' },
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
  ];

  // statusOptions removed - was not used

  // 获取任务项样式 - 底部边框样式
  const getItemClassName = () => {
    let baseClass = 'group flex items-center gap-3 p-3 transition-all duration-200';

    // 状态特定样式
    if (isOverdue) {
      baseClass += ' opacity-90';
    } else if (task.status === 'completed') {
      baseClass += ' opacity-70';
    }

    return baseClass;
  };

  return (
    <div className={`${getItemClassName()} feather-glass-bottom-border`}>
      {/* 复选框 */}
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={handleToggleComplete}
          className={`w-4 h-4 bg-transparent border-2 theme-border rounded focus:ring-2 focus:ring-offset-0 ${
            isOverdue
              ? 'theme-text-error focus:theme-ring-error'
              : 'theme-text-accent focus:theme-ring-accent'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        {editField === 'title' ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            className="w-full px-3 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco"
          />
        ) : (
          <span
            className={`text-sm font-medium cursor-pointer px-2 py-1 rounded-md transition-all duration-200 hover:shadow-sm truncate block ${
              task.status === 'completed'
                ? 'line-through theme-text-tertiary'
                : isOverdue
                  ? 'theme-text-error'
                  : 'theme-text-primary'
            }`}
            onClick={() => handleStartEdit('title', task.title)}
            title={`${task.title} (点击编辑标题)`}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* 项目标签 */}
      {showProject && (
        <div className="flex-shrink-0 w-28 relative" ref={projectPickerRef}>
          {editField === 'project' ? (
            <>
              <button
                className="w-full flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-xs"
                onClick={() => setShowProjectPicker(!showProjectPicker)}
              >
                {editValue ? (
                  (() => {
                    const selectedProject = projects.find((p) => p.id?.toString() === editValue);
                    return selectedProject ? (
                      <>
                        <span className="flex items-center justify-center w-3 h-3">
                          {selectedProject.icon?.length === 1 ? (
                            <span className="text-xs">{selectedProject.icon}</span>
                          ) : (
                            React.createElement(
                              getIconComponent(selectedProject.icon || 'Folder'),
                              {
                                theme: 'outline',
                                size: 12,
                                fill: 'currentColor',
                                strokeWidth: 2,
                                className: 'theme-text-secondary',
                              }
                            )
                          )}
                        </span>
                        <span className="theme-text-primary truncate">{selectedProject.name}</span>
                      </>
                    ) : (
                      <span className="theme-text-tertiary">无项目</span>
                    );
                  })()
                ) : (
                  <span className="theme-text-tertiary">无项目</span>
                )}
                <ChevronDown size={10} className="theme-text-secondary ml-auto" />
              </button>
              {showProjectPicker && (
                <div className="absolute bottom-full left-0 mb-1 w-full max-h-32 overflow-y-auto rounded-lg shadow-xl z-50 feather-glass-deco">
                  <button
                    onClick={() => {
                      const completeUpdates = {
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        status: task.status,
                        due_date: task.due_date,
                        project_id: null,
                        completed_at: task.completed_at,
                      };
                      setEditValue('');
                      onUpdate(completeUpdates);
                      setEditField(null);
                      setShowProjectPicker(false);
                    }}
                    className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-white/10 transition-all duration-200 text-left text-xs"
                  >
                    <span className="theme-text-tertiary">无项目</span>
                  </button>
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => {
                        const completeUpdates = {
                          title: task.title,
                          description: task.description,
                          priority: task.priority,
                          status: task.status,
                          due_date: task.due_date,
                          project_id: proj.id,
                          completed_at: task.completed_at,
                        };
                        setEditValue(proj.id?.toString() || '');
                        onUpdate(completeUpdates);
                        setEditField(null);
                        setShowProjectPicker(false);
                      }}
                      className="w-full flex items-center gap-1 px-2 py-1.5 hover:bg-white/10 transition-all duration-200 text-left text-xs"
                    >
                      <span className="flex items-center justify-center w-3 h-3">
                        {proj.icon?.length === 1 ? (
                          <span className="text-xs">{proj.icon}</span>
                        ) : (
                          React.createElement(getIconComponent(proj.icon || 'Folder'), {
                            theme: 'outline',
                            size: 12,
                            fill: 'currentColor',
                            strokeWidth: 2,
                            className: 'theme-text-secondary',
                          })
                        )}
                      </span>
                      <span className="theme-text-primary truncate">{proj.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <span
              className="inline-flex items-center px-2 py-1 text-xs theme-text-secondary rounded-full cursor-pointer transition-all duration-200 hover:shadow-sm truncate bg-white/10 hover:bg-white/20 project-tag font-medium"
              onClick={() => handleStartEdit('project', task.project_id?.toString() || '')}
              title={`点击编辑项目 ${project ? `(当前: ${project.name})` : '(无项目)'}`}
            >
              {project ? (
                <>
                  <span className="mr-1.5 flex items-center justify-center w-4 h-4">
                    {project.icon?.length === 1 ? (
                      // 如果是单个字符（emoji），直接显示
                      <span className="text-sm">{project.icon}</span>
                    ) : (
                      // 如果是图标名称，渲染对应的图标组件
                      React.createElement(getIconComponent(project.icon || 'Folder'), {
                        theme: 'outline',
                        size: 14,
                        fill: 'currentColor',
                        strokeWidth: 2,
                        className: 'theme-text-secondary',
                      })
                    )}
                  </span>
                  <span className="font-medium">{project.name}</span>
                </>
              ) : (
                <span className="theme-text-tertiary italic">无项目</span>
              )}
            </span>
          )}
        </div>
      )}

      {/* 优先级 */}
      <div className="flex-shrink-0 w-auto">
        {editField === 'priority' ? (
          <div className="flex gap-0.5">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const completeUpdates = {
                    title: task.title,
                    description: task.description,
                    priority: option.value,
                    status: task.status,
                    due_date: task.due_date,
                    project_id: task.project_id,
                    completed_at: task.completed_at,
                  };
                  setEditValue(option.value);
                  onUpdate(completeUpdates);
                  setEditField(null);
                }}
                className={`px-2 py-1 text-xs rounded-full transition-all duration-200 font-medium ${
                  editValue === option.value || (!editValue && task.priority === option.value)
                    ? 'theme-bg-accent theme-text-on-accent shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 theme-text-secondary'
                }`}
                title={option.label}
              >
                {option.label.charAt(0)}
              </button>
            ))}
          </div>
        ) : (
          <span
            onClick={() => handleStartEdit('priority', task.priority)}
            className="inline-flex items-center px-2 py-1 text-xs theme-text-accent rounded-full cursor-pointer transition-all duration-200 hover:shadow-sm bg-white/10 hover:bg-white/20 font-medium"
            title="点击编辑优先级"
          >
            {priorityOptions.find((p) => p.value === task.priority)?.label || '中'}
          </span>
        )}
      </div>

      {/* 截止日期 */}
      <div className="flex-shrink-0 w-28">
        {editField === 'due_date' ? (
          <div className="w-full">
            <DatePicker
              value={editValue}
              onChange={(newValue) => {
                setEditValue(newValue);
                // 立即保存，不需要等关闭
                setTimeout(() => {
                  const completeUpdates = {
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    status: task.status,
                    due_date: newValue && newValue.trim() ? newValue.trim() : undefined,
                    project_id: task.project_id,
                    completed_at: task.completed_at,
                  };
                  onUpdate(completeUpdates);
                  setEditField(null);
                  setEditValue('');
                }, 100);
              }}
              onClose={() => {
                // 如果没有更改值就关闭
                setEditField(null);
                setEditValue('');
              }}
              placeholder="选择日期"
              size="sm"
              showShortcuts={true}
              shortcuts={[
                { label: '今天', value: () => formatDateUtil(new Date()) },
                {
                  label: '明天',
                  value: () => formatDateUtil(new Date(Date.now() + 24 * 60 * 60 * 1000)),
                },
                { label: '清除', value: '' },
              ]}
              className="w-full"
            />
          </div>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full cursor-pointer transition-all duration-200 hover:shadow-sm font-medium ${
              isOverdue
                ? 'theme-text-error bg-white/10 hover:bg-white/20'
                : task.due_date
                  ? 'theme-text-secondary bg-white/10 hover:bg-white/20'
                  : 'theme-text-tertiary bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => handleStartEdit('due_date', task.due_date || '')}
            title="点击编辑截止日期"
          >
            <Calendar size={16} />
            <span className="font-medium">
              {task.due_date ? formatDate(task.due_date) : '无日期'}
            </span>
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={() => handleStartEdit('title', task.title)}
          className="p-1.5 theme-text-tertiary transition-all duration-200 rounded-md hover:shadow-sm hover:theme-text-accent hover:bg-white/20"
          title="编辑任务"
        >
          <Edit2 size={16} />
        </button>

        <button
          onClick={handleDelete}
          className="p-1.5 theme-text-tertiary transition-all duration-200 rounded-md hover:shadow-sm hover:theme-text-error hover:bg-white/20"
          title="删除任务"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="删除任务"
        itemName={task.title}
        isLoading={isDeleting}
      />
    </div>
  );
};
