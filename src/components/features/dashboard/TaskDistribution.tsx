import React from 'react';
import { useTaskBoxStore } from '@/stores';
import { Clock, Play, Pause } from 'lucide-react';

export const TaskDistribution: React.FC = () => {
  const { getDashboardStats } = useTaskBoxStore();
  const stats = getDashboardStats();

  const statusData = [
    {
      status: 'completed',
      label: '已完成',
      count: stats.completedTasks,
      color: 'bg-green-500',
      icon: Clock,
        textColor: 'text-green-600'
    },
    {
      status: 'in_progress',
      label: '进行中',
      count: stats.inProgressTasks,
      color: 'bg-blue-500',
      icon: Play,
      textColor: 'text-blue-600'
    },
    {
      status: 'pending',
      label: '待开始',
      count: stats.pendingTasks,
      color: 'theme-bg-tertiary',
      icon: Pause,
      textColor: 'theme-text-tertiary'
    },
    {
      status: 'overdue',
      label: '已逾期',
      count: stats.overdueTasks,
      color: 'bg-red-500',
      icon: Clock,
      textColor: 'text-red-600'
    }
  ];

  const priorityData = [
    {
      priority: 'high',
      label: '高优先级',
      count: stats.highPriorityTasks,
      color: 'bg-red-500'
    },
    {
      priority: 'medium',
      label: '中优先级',
      count: stats.mediumPriorityTasks,
      color: 'bg-yellow-500'
    },
    {
      priority: 'low',
      label: '低优先级',
      count: stats.lowPriorityTasks,
      color: 'bg-green-500'
    }
  ];

  const getPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  return (
    <div className="rounded-xl p-4 md: p-6">
      <h3 className="text-lg font-semibold theme-text-primary mb-4 md:mb-6">
        任务分布统计
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Task Status Distribution */}
        <div>
          <h4 className="text-sm font-medium theme-text-secondary mb-4">
            按状态分布
          </h4>
          <div className="space-y-3">
            {statusData.map((item) => {
              const Icon = item.icon;
              const percentage = getPercentage(item.count, stats.totalTasks);
              return (
                <div key={item.status} 
            className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon 
                      size={16} fill="currentColor"
                    strokeWidth={2}
            className={item.textColor}
                    />
                    <span className="text-sm theme-text-secondary min-w-16">
                      {item.label}
                    </span>
                    <div className="flex-1 theme-bg-tertiary rounded-full h-2">
                      <div className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-medium theme-text-primary">
                      {item.count}
                    </span>
                    <span className="text-xs theme-text-tertiary ml-1">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium theme-text-secondary mb-4">
            按优先级分布
          </h4>
          <div className="space-y-3">
            {priorityData.map((item) => {
              const percentage = getPercentage(item.count, stats.activeTasks);
              return (
                <div key={item.priority} 
            className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm theme-text-secondary min-w-20">
                      {item.label}
                    </span>
                    <div className="flex-1 theme-bg-tertiary rounded-full h-2">
                      <div className={`h-2 rounded-full ${item.color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-medium theme-text-primary">
                      {item.count}
                    </span>
                    <span className="text-xs theme-text-tertiary ml-1">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};











