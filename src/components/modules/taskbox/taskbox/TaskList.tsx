import React, { useMemo, useState } from 'react';
import { Task, TaskProject, TaskStatus, TaskPriority } from '@/types';
import { TaskItem } from './TaskItem';
import { CompactTaskItem } from './CompactTaskItem';
import { formatDate } from '@/utils/timeUtils';
import { Calendar, Check, Filter, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  projects: TaskProject[];
  onTaskUpdate?: (id: number, updates: Partial<Task>) => void;
  onTaskDelete?: (id: number) => void;
  showFilters?: boolean;
  showProject?: boolean;
  groupByStatus?: boolean;
  groupByDate?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  compact?: boolean; // 新增 compact 模式支持
}

type SortBy = 'created_at' | 'due_date' | 'priority' | 'title';
type SortOrder = 'asc' | 'desc';

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  projects,
  onTaskUpdate,
  onTaskDelete,
  showFilters = false,
  showProject = true,
  groupByStatus = false,
  groupByDate = false,
  emptyMessage = "暂无任务",
  emptyIcon = <Check size={16} />,
  compact = false
}) => {
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 过滤和排序任务
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // 状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }


    // 优先级过滤
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }


    // 排序
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      // 处理优先级排序
      if (sortBy === 'priority') {
        const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
      }


      // 处理日期排序
      if (sortBy === 'due_date' || sortBy === 'created_at') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }


      // 处理字符串排序
      if (sortBy === 'title') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }


      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, filterStatus, filterPriority, sortBy, sortOrder]);

// 分组任务
const groupedTasks = useMemo((): [string, Task[]][] => {
  if (groupByStatus) {
    const groups = {
      todo: filteredAndSortedTasks.filter(t => t.status === 'todo'),
      in_progress: filteredAndSortedTasks.filter(t => t.status === 'in_progress'),
      completed: filteredAndSortedTasks.filter(t => t.status === 'completed'),
      cancelled: filteredAndSortedTasks.filter(t => t.status === 'cancelled')
    };
    return Object.entries(groups).filter(([_, tasks]) => tasks.length > 0);
  }

  if (groupByDate) {
    const today = formatDate(new Date());
    // yesterday removed - was not used,
    const groups: { [key: string]: Task[] } = {
      overdue: [],
      today: [],
      upcoming: [],
      nodate: []
    };

    filteredAndSortedTasks.forEach(task => {
      if (!task.due_date) {
        groups.nodate.push(task);
      } else if (task.due_date < today && task.status !== 'completed') {
        groups.overdue.push(task);
      } else if (task.due_date === today) {
        groups.today.push(task);
      } else if (task.due_date > today) {
        groups.upcoming.push(task);
      }
    });

    return Object.entries(groups).filter(([_, tasks]) => tasks.length > 0);
  }

  return [['all', filteredAndSortedTasks]];
}, [filteredAndSortedTasks, groupByStatus, groupByDate]);

// getProject removed - was not used

// 获取分组标题
const getGroupTitle = (groupKey: string, taskCount: number) => {
  const titles: { [key: string]: { title: string; icon: React.ReactNode; color?: string } } = {
    todo: {
      title: `待办 (${taskCount})`,
      icon: <div className="w-2 h-2 theme-bg-accent rounded-full" />
    },
    in_progress: {
      title: `进行中 (${taskCount})`,
      icon: <div className="w-2 h-2 theme-bg-warning rounded-full" />
    },
    completed: {
      title: `已完成 (${taskCount})`,
      icon: <Check size={16} />
    },
    cancelled: {
      title: `已取消 (${taskCount})`,
      icon: <div className="w-2 h-2 theme-bg-tertiary rounded-full" />
    },
    overdue: {
      title: `逾期 (${taskCount})`,
      icon: <AlertTriangle size={16} className="theme-text-error" strokeWidth={3} fill="currentColor" />,
      color: 'theme-text-error'
    },
    today: {
      title: `今天 (${taskCount})`,
      icon: <Calendar size={16} />
    },
    upcoming: {
      title: `即将到期 (${taskCount})`,
      icon: <Calendar size={16} />
    },
    nodate: {
      title: `无截止日期 (${taskCount})`,
      icon: <div className="w-2 h-2 theme-bg-tertiary rounded-full" />
    },
    all: {
      title: `全部任务 (${taskCount})`,
      icon: <Check size={16} />
    }
  };

  return titles[groupKey] || { title: `${groupKey} (${taskCount})`, icon: null };
};

// 切换排序
const handleSort = (field: SortBy) => {
  if (sortBy === field) {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortBy(field);
    setSortOrder('asc');
  }
};

if (tasks.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="theme-text-tertiary mb-4">
        {emptyIcon}
      </div>
      <h3 className="text-lg font-medium theme-text-secondary mb-2">
        {emptyMessage}
      </h3>
    </div>
  );
}

return (
  <div className="space-y-4">
    {/* 过滤和排序栏 */}
    {showFilters && (
      <div className="flex items-center gap-4 p-3 rounded-lg feather-glass-deco">
        {/* 状态过滤 */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="theme-text-tertiary" />
          <select value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="theme-input text-sm rounded px-2 py-1"
          >
            <option value="all" className="theme-bg-primary theme-text-primary">全部状态</option>
            <option value="todo" className="theme-bg-primary theme-text-primary">待办</option>
            <option value="in_progress" className="theme-bg-primary theme-text-primary">进行中</option>
            <option value="completed" className="theme-bg-primary theme-text-primary">已完成</option>
            <option value="cancelled" className="theme-bg-primary theme-text-primary">已取消</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
            className="theme-input text-sm rounded px-2 py-1"
          >
            <option value="all" className="theme-bg-primary theme-text-primary">全部优先级</option>
            <option value="urgent" className="theme-bg-primary theme-text-primary">紧急</option>
            <option value="high" className="theme-bg-primary theme-text-primary">高</option>
            <option value="medium" className="theme-bg-primary theme-text-primary">中</option>
            <option value="low" className="theme-bg-primary theme-text-primary">低</option>
          </select>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => handleSort('due_date')}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded border transition-colors ${sortBy === 'due_date'
              ? 'theme-bg-accent theme-text-on-accent theme-border-accent'
              : 'theme-border-primary border theme-text-secondary hover:theme-border-secondary'
            }`}
          >
                      日期
                      {sortBy === 'due_date' && (
                        sortOrder === 'asc' ?
                          <ArrowUp size={16} /> :
                          <ArrowDown size={16} />
                      )}
                    </button>

                    <button onClick={() => handleSort('priority')}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded border transition-colors ${sortBy === 'priority'
                        ? 'theme-bg-accent theme-text-on-accent theme-border-accent'
                        : 'theme-border-primary border theme-text-secondary hover:theme-border-secondary'
                      }`}
            >
                    优先�?              {sortBy === 'priority' && (
                      sortOrder === 'asc' ?
                        <ArrowUp size={16} /> :
                        <ArrowDown size={16} />
                    )}
                  </button>

                  <button onClick={() => handleSort('title')}
            className={`flex items-center gap-1 px-2 py-1 text-sm rounded border transition-colors ${sortBy === 'title'
                      ? 'theme-bg-accent theme-text-on-accent theme-border-accent'
                      : 'theme-border-primary border theme-text-secondary hover:theme-border-secondary'
                    }`}
            >
                  标题
                  {sortBy === 'title' && (
                    sortOrder === 'asc' ?
                      <ArrowUp size={16} /> :
                      <ArrowDown size={16} />
                  )}
                </button>
            </div>
        </div>
      )}

        {/* 任务分组列表 */}
        <div className="space-y-6">
          {groupedTasks.map(([groupKey, groupTasks]) => {
            const group = getGroupTitle(groupKey, groupTasks.length);

            return (
              <div key={groupKey} 
            className="space-y-3">
                {/* 分组标题 */}
                {(groupByStatus || groupByDate) && (
                  <div className={`flex items-center gap-2 text-sm font-medium ${group.color || 'theme-text-primary'}`}>
                    {group.icon}
                    <span>{group.title}</span>
                  </div>
                )}

                {/* 任务列表 */}
                <div className={compact ? "bg-transparent rounded-lg border-transparent" : "space-y-2"}>
                  {compact && showProject && (
                    // Compact模式的表头
                    <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-text-tertiary rounded-t-lg border-b bg-transparent border-transparent">
                    <div className="flex-shrink-0 w-4"></div>
                    <div className="flex-1 min-w-0">任务</div>
                    <div className="flex-shrink-0 w-28">项目</div>
                    <div className="flex-shrink-0 w-24">优先级</div>
                    <div className="flex-shrink-0 w-28">截止日期</div>
                    <div className="flex-shrink-0 w-12"></div>
                  </div>
                  )}
                  {groupTasks.map((task: Task, index: number) => {
                    // 确定任务在列表中的位置
                    let position: 'first' | 'middle' | 'last' | 'only' = 'only';
                    if (groupTasks.length > 1) {
                      if (index === 0) {
                        position = 'first';
                      } else if (index === groupTasks.length - 1) {
                        position = 'last';
                      } else {
                        position = 'middle';
                      }
                    }

                    return compact ? (
                      <CompactTaskItem key={task.id} task={task}
                      projects={projects}
                      onUpdate={(updates) => onTaskUpdate?.(task.id!, updates)}
                  onDelete={() => onTaskDelete?.(task.id!)} showProject={showProject}
                    />
                  ) : (
                  <TaskItem key={task.id} task={task}
                  projects={projects} onUpdate={(updates) => onTaskUpdate?.(task.id!, updates)}
                  onDelete={() => onTaskDelete?.(task.id!)} showProject={showProject}
                  position={position}
                    />
                  );
                })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    );
};










