import React, { useState, useEffect } from 'react';
import { Task, TaskProject, TaskPriority, TaskStatus } from '@/types';
import { useTaskBoxStore } from '@/stores';
import { Edit2, Trash2, Calendar, Check, X, Flag, ChevronDown } from 'lucide-react';
import { DatePicker } from '@/components/common/DatePicker/DatePicker';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { formatDate as formatDateUtil } from '@/utils/timeUtils';
import { getIconComponent } from '@/constants/commonIcons';

interface TaskItemProps {
  task: Task;
  projects: TaskProject[];
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  showProject?: boolean;
  compact?: boolean;
  position?: 'first' | 'middle' | 'last' | 'only';
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  projects,
  onUpdate,
  onDelete,
  showProject = true,
  compact = false,
  position = 'only',
}) => {
  // compact 参数目前保留，未来可能用于切换紧凑显示模式
  void compact;
  // Store references removed - themeMode cleanup,
  const { toggleTaskStatus } = useTaskBoxStore();

  // 查找任务关联的项目
  const project = projects.find((p) => p.id === task.project_id);

  // 检查任务是否逾期
  const isOverdue = task.due_date
    ? new Date(task.due_date) < new Date() && task.status !== 'completed'
    : false;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);
  const [editStatus, setEditStatus] = useState<TaskStatus>(task.status);
  const [editDueDate, setEditDueDate] = useState(task.due_date || '');
  const [editProjectId, setEditProjectId] = useState<number | null>(task.project_id ?? null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 新增：现代化选择器的状态
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // 同步task数据到编辑状态
  useEffect(() => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.due_date || '');
    setEditProjectId(task.project_id ?? null);
  }, [task]);

  // 处理任务完成状态切换
  const handleToggleComplete = async () => {
    try {
      await toggleTaskStatus(task.id!);
    } catch (error) {
      console.error('Failed to toggle task status:', error);
    }
  };

  // 添加组件挂载日志
  useEffect(() => {}, []);

  // 处理任务编辑保存
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      return;
    }

    const updates = {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      priority: editPriority,
      status: editStatus,
      due_date: editDueDate && editDueDate.trim() ? editDueDate.trim() : undefined,
      project_id: editProjectId,
    };

    try {
      await onUpdate(updates);

      setIsEditing(false);
    } catch (error) {
      console.error('Task update failed:', error);
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

  // 重置编辑状态
  const resetEditState = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.due_date || '');
    setEditProjectId(task.project_id ?? null);
    setIsEditing(false);
    // 重置弹窗状态
    setShowProjectPicker(false);
    setShowPriorityPicker(false);
    setShowStatusPicker(false);
  };

  // 处理项目选择
  const handleProjectSelect = (project: TaskProject | null) => {
    setEditProjectId(project ? (project.id ?? null) : null);
    setShowProjectPicker(false);
  };

  // 处理优先级选择
  const handlePrioritySelect = (priority: TaskPriority) => {
    setEditPriority(priority);
    setShowPriorityPicker(false);
  };

  // 处理状态选择
  const handleStatusSelect = (status: TaskStatus) => {
    setEditStatus(status);
    setShowStatusPicker(false);
  };

  // 获取优先级选项
  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'urgent', label: '紧急', color: 'theme-text-error' },
    { value: 'high', label: '高', color: 'theme-text-warning' },
    { value: 'medium', label: '中', color: 'theme-text-accent' },
    { value: 'low', label: '低', color: 'theme-text-tertiary' },
  ];

  // 获取状态选项
  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'todo', label: '待处理', color: 'theme-text-accent' },
    { value: 'in_progress', label: '进行中', color: 'theme-text-warning' },
    { value: 'completed', label: '已完成', color: 'theme-text-success' },
    { value: 'cancelled', label: '已取消', color: 'theme-text-tertiary' },
  ];

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

  // 获取任务项样式 - 应用今日待办的毛玻璃风格
  const getItemClassName = () => {
    let baseClass = 'group flex items-start gap-3 p-3 cursor-pointer transition-all duration-200';

    // 根据位置设置圆角和边框样式
    switch (position) {
      case 'first':
        baseClass = ' rounded-t-lg';
        break;
      case 'middle':
        baseClass = ' rounded-none';
        break;
      case 'last':
        baseClass = ' rounded-b-lg border-b-0'; // 最后一项不需要底部边框
        break;
      case 'only':
      default:
        baseClass = ' rounded-lg border-b-0'; // 单独项不需要底部边框
        break;
    }

    if (isOverdue) {
      baseClass = ' opacity-90'; // 简化逾期样式
    } else if (task.status === 'completed') {
      baseClass = ' opacity-70'; // 简化已完成样式
    }

    return baseClass;
  };

  return (
    <div className={`${getItemClassName()} feather-glass-bottom-border`}>
      {/* 复选框 */}
      <div className="flex-shrink-0 pt-0.5">
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
        {isEditing ? (
          <div className="space-y-3 rounded-lg p-3 -m-1 feather-glass-panel">
            {/* 任务标题 */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  resetEditState();
                }
              }}
              className="w-full px-3 py-2 text-sm font-medium rounded focus:outline-none transition-colors feather-glass-content theme-text-primary"
              placeholder="任务标题..."
              autoFocus
            />

            {/* 任务描述 */}
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="任务描述 (可选)..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded focus:outline-none resize-none transition-colors feather-glass-content theme-text-primary"
            />

            {/* 任务属性设置 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 截止日期 */}
              <div className="space-y-1">
                <label className="text-xs theme-text-tertiary flex items-center gap-1">
                  <Calendar size={12} className="theme-text-tertiary" />
                  截止日期
                </label>
                <DatePicker
                  value={editDueDate}
                  onChange={setEditDueDate}
                  placeholder="选择截止日期"
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
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs theme-text-tertiary flex items-center gap-1">
                  <Flag size={12} className="theme-text-tertiary" />
                  优先级
                </label>
                <div className="relative">
                  <button
                    className="w-full flex items-center justify-between px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-all duration-200 theme-text-primary"
                    onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                  >
                    <span>
                      {priorityOptions.find((p) => p.value === editPriority)?.label || '选择优先级'}
                    </span>
                    <ChevronDown size={12} className="theme-text-tertiary" />
                  </button>

                  {showPriorityPicker && (
                    <div className="absolute top-full left-0 mt-1 w-full z-50 rounded bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handlePrioritySelect(option.value)}
                          className={`w-full flex items-center px-2 py-1.5 text-xs hover:bg-white/10 transition-all duration-200 ${
                            editPriority === option.value
                              ? 'bg-white/20 theme-text-primary'
                              : 'theme-text-secondary'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs theme-text-tertiary">状态</label>
                <div className="relative">
                  <button
                    className="w-full flex items-center justify-between px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-all duration-200 theme-text-primary"
                    onClick={() => setShowStatusPicker(!showStatusPicker)}
                  >
                    <span>
                      {statusOptions.find((s) => s.value === editStatus)?.label || '选择状态'}
                    </span>
                    <ChevronDown size={12} className="theme-text-tertiary" />
                  </button>

                  {showStatusPicker && (
                    <div className="absolute top-full left-0 mt-1 w-full z-50 rounded bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusSelect(option.value)}
                          className={`w-full flex items-center px-2 py-1.5 text-xs hover:bg-white/10 transition-all duration-200 ${
                            editStatus === option.value
                              ? 'bg-white/20 theme-text-primary'
                              : 'theme-text-secondary'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs theme-text-secondary">项目</label>
                <div className="relative">
                  <button
                    className="w-full flex items-center justify-between px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-all duration-200 theme-text-primary"
                    onClick={() => setShowProjectPicker(!showProjectPicker)}
                  >
                    <span className="flex items-center gap-1">
                      {editProjectId ? (
                        (() => {
                          const selectedProject = projects.find((p) => p.id === editProjectId);
                          return selectedProject ? (
                            <>
                              <span className="flex items-center justify-center w-3 h-3">
                                {selectedProject.icon?.length === 1 ? (
                                  <span className="text-xs">{selectedProject.icon}</span>
                                ) : (
                                  React.createElement(
                                    getIconComponent(selectedProject.icon || 'Folder'),
                                    {
                                      size: 12,
                                      className: 'theme-text-secondary',
                                    }
                                  )
                                )}
                              </span>
                              <span>{selectedProject.name}</span>
                            </>
                          ) : (
                            <span className="theme-text-tertiary">选择项目</span>
                          );
                        })()
                      ) : (
                        <span className="theme-text-tertiary">无</span>
                      )}
                    </span>
                    <ChevronDown size={12} className="theme-text-tertiary" />
                  </button>

                  {showProjectPicker && (
                    <div className="absolute top-full left-0 mt-1 w-full z-50 rounded bg-white/10 backdrop-blur-md border border-white/20 shadow-lg max-h-32 overflow-y-auto">
                      <button
                        onClick={() => handleProjectSelect(null)}
                        className={`w-full flex items-center px-2 py-1.5 text-xs hover:bg-white/10 transition-all duration-200 ${
                          editProjectId === null
                            ? 'bg-white/20 theme-text-primary'
                            : 'theme-text-secondary'
                        }`}
                      >
                        无
                      </button>
                      {projects.map((proj) => (
                        <button
                          key={proj.id}
                          onClick={() => handleProjectSelect(proj)}
                          className={`w-full flex items-center gap-1 px-2 py-1.5 text-xs hover:bg-white/10 transition-all duration-200 ${
                            editProjectId === proj.id
                              ? 'bg-white/20 theme-text-primary'
                              : 'theme-text-secondary'
                          }`}
                        >
                          <span className="flex items-center justify-center w-3 h-3">
                            {proj.icon?.length === 1 ? (
                              <span className="text-xs">{proj.icon}</span>
                            ) : (
                              React.createElement(getIconComponent(proj.icon || 'Folder'), {
                                size: 12,
                                className: 'theme-text-secondary',
                              })
                            )}
                          </span>
                          <span>{proj.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* 操作按钮 */}
            <div className="flex items-center justify-between pt-2 border-t theme-border-primary">
              <div className="text-xs theme-text-tertiary">按 CtrlEnter 保存</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetEditState}
                  className="theme-button-secondary flex items-center gap-1 px-3 py-1.5 text-xs"
                >
                  <X size={12} className="theme-text-tertiary" />
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editTitle.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed theme-bg-accent theme-text-on-accent hover:theme-bg-accent-hover"
                >
                  <Check size={16} />
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 任务标题 */}
            <h4
              className={`font-medium leading-tight text-sm ${
                task.status === 'completed'
                  ? 'line-through theme-text-secondary'
                  : isOverdue
                    ? 'theme-text-error'
                    : 'theme-text-primary'
              }`}
              onDoubleClick={() => setIsEditing(true)}
            >
              {task.title}
            </h4>
            {/* 任务描述 */}
            {task.description && (
              <p
                className={`text-xs mt-1 ${
                  task.status === 'completed'
                    ? 'line-through theme-text-tertiary'
                    : 'theme-text-secondary'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* 任务元数据 */}
            <div className="flex items-center justify-between gap-2 mt-1.5">
              <div className="flex items-center gap-2">
                {/* 到期日期 */}
                {task.due_date && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      isOverdue ? 'theme-text-error font-semibold' : 'theme-text-tertiary'
                    }`}
                  >
                    <Calendar
                      size={12}
                      className={isOverdue ? 'theme-text-error' : 'theme-text-tertiary'}
                    />
                    <span>{formatDate(task.due_date)}</span>
                  </div>
                )}

                {/* 项目标签 */}
                {showProject && project && (
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 theme-text-secondary font-medium">
                    {project.name}
                  </span>
                )}
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 theme-text-accent font-medium">
                {priorityOptions.find((p) => p.value === task.priority)?.label || '中'}
              </span>
            </div>
          </>
        )}
      </div>
      {/* 操作按钮 */}
      {!isEditing && (
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 transition-colors rounded theme-text-tertiary hover:theme-text-accent hover:theme-bg-accent/10"
            title="编辑任务"
          >
            <Edit2 size={16} />
          </button>

          <button
            onClick={handleDelete}
            className="p-1 transition-colors rounded theme-text-tertiary hover:theme-text-error hover:theme-bg-error/10"
            title="删除任务"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

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
