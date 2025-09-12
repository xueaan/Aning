import React, { useState, useMemo } from 'react';
import { Task, TaskProject, TaskStatus, TaskPriority } from '@/types';
import { TaskItem } from './TaskItem';
import { SimpleTaskQuickAdd } from './SimpleTaskQuickAdd';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { formatDate } from '@/utils/timeUtils';

interface TaskCalendarProps {
  tasks: Task[];
  projects: TaskProject[];
  onTaskUpdate: (id: number, updates: Partial<Task>) => void;
  onTaskDelete: (id: number) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return 'status-error';
    case 'high':
      return 'theme-bg-warning';
    case 'medium':
      return 'theme-bg-accent';
    case 'low':
      return 'theme-bg-tertiary';
    default:
      return 'theme-bg-tertiary';
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return 'theme-text-success';
    case 'in_progress':
      return 'theme-text-warning';
    case 'cancelled':
      return 'theme-text-tertiary';
    default:
      return 'theme-text-accent';
  }
};

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  projects,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState<string | null>(null);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);
    const today = new Date();
    const todayString = formatDate(today);

    while (currentDateObj <= endDate) {
      const dateString = formatDate(currentDateObj);
      const dayTasks = tasks.filter(task => task.due_date === dateString);

      days.push({
        date: new Date(currentDateObj),
        dateString,
        isCurrentMonth: currentDateObj.getMonth() === month,
        isToday: dateString === todayString,
        tasks: dayTasks
      });

      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return days;
  }, [currentDate, tasks]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleQuickAdd = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
  onTaskCreate({
    ...taskData,
    due_date: showQuickAdd!
  });
  setShowQuickAdd(null);
};

const selectedDayTasks = selectedDate ?
  tasks.filter(task => task.due_date === selectedDate) : [];

return (
  <div className="flex-1 overflow-hidden flex">
    {/* 日历视图 */}
    <div className="flex-1 flex flex-col">
      {/* 日历头部 */}
      <div className="flex-shrink-0 p-4 border-b border-border-primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {currentDate.getFullYear()}年{MONTHS[currentDate.getMonth()]}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => navigateMonth('prev')}
            className="p-2 theme-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors"
              title="上个月"
                >
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => navigateMonth('next')}
            className="p-2 theme-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded transition-colors"
            title="下个月"
                >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <button onClick={goToToday}
            className="px-3 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent-dark transition-colors"
            >
      今天
    </button>
      </div>
      {/* 星期标头 */}
<div className="grid grid-cols-7 gap-1">
  {WEEKDAYS.map(day => (
    <div key={day} 
            className="p-2 text-center text-sm font-medium theme-text-secondary">
      {day}
    </div>
  ))}
</div>
        </div>
        {/* 日历网格 */}
  <div className="flex-1 p-4 overflow-auto">
    <div className="grid grid-cols-7 gap-1 h-full">
      {calendarData.map((day, index) => (
        <div 
          key={index}
          className={`
            min-h-24 p-2 border border-border-secondary rounded-lg cursor-pointer transition-all
            ${day.isCurrentMonth ? 'bg-bg-primary' : 'bg-bg-secondary'}
            ${day.isToday ? 'ring-2 ring-accent ring-opacity-50' : ''}
            ${selectedDate === day.dateString ? 'bg-accent bg-opacity-10' : ''}
            hover:bg-bg-secondary
          `}
          onClick={() => setSelectedDate(
            selectedDate === day.dateString ? null : day.dateString
          )}
        >
          <div className="flex items-center justify-between mb-1">
        <span className={`
                    text-sm font-medium
                    ${day.isCurrentMonth ? 'text-text-primary' : 'text-text-tertiary'}
                    ${day.isToday ? 'text-accent font-bold' : ''}
                  `}>
          {day.date.getDate()}
        </span>
        {day.tasks.length > 0 && (
          <span className="text-xs bg-accent text-white px-1.5 py-0.5 rounded-full">
            {day.tasks.length}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {day.tasks.slice(0, 3).map(task => (
          <div key={task.id}
            className="flex items-center gap-1"
            title={task.title}
          >
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                      <span className={`
                        text-xs truncate flex-1 ${getStatusColor(task.status)}
                        ${task.status === 'completed' ? 'line-through' : ''}
                      `}>
                        {task.title}
                      </span>
                    </div>
        ))}
        {day.tasks.length > 3 && (
          <div className="text-xs text-text-tertiary">
            {day.tasks.length - 3} 更多
          </div>
        )}
      </div>
      {/* 快速添加按钮 */}
      {
        selectedDate === day.dateString && (
          <button onClick={(e) => {
              e.stopPropagation();
              setShowQuickAdd(day.dateString);
            }}
            className="mt-1 w-full py-1 text-xs text-accent hover:bg-accent hover:text-white rounded transition-colors"
          >
            <Plus size={16} />
          </button>
        )
      }
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* 侧栏：选中日期的任务详情 */}
      {
        selectedDate && (
          <div className="w-80 border-l border-border-primary bg-bg-primary flex flex-col">
      <div className="flex-shrink-0 p-4 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">
            {new Date(selectedDate).toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric',
              weekday: 'short'
            })}
          </h3>
          <button onClick={() => setSelectedDate(null)}
            className="p-1 theme-text-secondary hover:text-text-primary rounded"
              >
          ✕
        </button>
      </div>
      <div className="text-sm theme-text-secondary mt-1">
        共 {selectedDayTasks.length} 个任务
      </div>
    </div>
        {/* 快速添加 */}
  {
    showQuickAdd === selectedDate && (
      <div className="flex-shrink-0 p-4 border-b border-border-secondary">
        <SimpleTaskQuickAdd onSubmit={handleQuickAdd} onCancel={() => setShowQuickAdd(null)}
          defaultStatus="todo"
          placeholder={`在 ${new Date(selectedDate).getMonth() + 1}/${new Date(selectedDate).getDate()} 添加任务...`}
                compact />
      </div>
    )
  }

  {/* 任务列表 */ }
  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
    {selectedDayTasks.length === 0 && showQuickAdd !== selectedDate ? (
      <div className="flex flex-col items-center justify-center py-8 text-text-tertiary">
        <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mb-3">
          <Plus size={16} />
        </div>
        <p className="text-sm text-center mb-2">暂无任务</p>
        <button onClick={() => setShowQuickAdd(selectedDate)}
            className="text-xs text-accent hover:text-accent-dark"
                >
        点击添加
      </button>
              </div>
            ) : (
    selectedDayTasks.map(task => (
      <TaskItem key={task.id} task={task}
        projects={projects} onUpdate={(updates) => onTaskUpdate(task.id!, updates)}
        onDelete={() => onTaskDelete(task.id!)} compact={true}
        showProject={true}
      />
    ))
  )
}
          </div>
        {/* 底部添加按钮 */}
{
  showQuickAdd !== selectedDate && selectedDayTasks.length > 0 && (
    <div className="flex-shrink-0 p-4 border-t border-border-secondary">
      <button onClick={() => setShowQuickAdd(selectedDate)}
            className="w-full py-2 text-sm text-accent border border-accent rounded hover:bg-accent hover:text-white transition-colors"
              >
      <Plus size={14} 
            className="inline mr-1" />
      添加任务
    </button>
            </div>
          )
}
        </div>
      )}
    </div>
  );
};











