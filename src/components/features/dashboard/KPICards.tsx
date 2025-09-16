import { FC } from 'react';
import { useTaskBoxStore } from '@/stores';
import { Clock, Trophy } from 'lucide-react';

export const KPICards: FC = () => {
  const { getDashboardStats } = useTaskBoxStore();

  const stats = getDashboardStats();

  const kpiData = [
    {
      title: '总任务数',
      value: stats.totalTasks,
      icon: Clock,
      iconColorClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: '完成率',
      value: `${stats.completionRate}%`,
      icon: Trophy,
      iconColorClass: 'text-green-600 dark:text-green-400',
    },
    {
      title: '今日任务',
      value: stats.todayTasks,
      icon: Clock,
      iconColorClass: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: '逾期任务',
      value: stats.overdueTasks,
      icon: Clock,
      iconColorClass: 'text-red-600 dark:text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {kpiData.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className="rounded-xl p-4 md:p-6 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium theme-text-secondary">{item.title}</p>
                <p className="text-xl md:text-2xl font-bold theme-text-primary mt-1 md:mt-2">
                  {item.value}
                </p>
              </div>
              <div className="p-2 md:p-3 rounded-full">
                <Icon
                  size={20}
                  fill="currentColor"
                  strokeWidth={2}
                  className={`${item.iconColorClass} md:w-6 md:h-6`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
