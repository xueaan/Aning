import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useHabitStore } from '@/stores';
import { HabitWithStats, HabitRecord } from '@/types';
import {
  CheckCircle2,
  Calendar,
  Target,
  TrendingUp,
  Flame,
  Star,
  Crown,
  Trophy,
} from 'lucide-react';
import { getIconComponent } from '@/constants/commonIcons';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, color, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-6 transition-all hover:shadow-lg duration-300 feather-glass-deco"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-text-muted text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-text-primary mb-1">{value}</p>
          <p className="theme-text-secondary text-sm">{description}</p>

          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs ${
                trend.isPositive ? 'theme-text-success' : 'theme-text-error'
              }`}
            >
              <TrendingUp
                size={12}
                style={{
                  transform: trend.isPositive ? 'none' : 'rotate(180deg)',
                }}
              />
              <span>{Math.abs(trend.value)}% vs 上周</span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

interface HabitProgressBarProps {
  habit: HabitWithStats;
  records: HabitRecord[];
}

const HabitProgressBar: React.FC<HabitProgressBarProps> = ({ habit, records }) => {
  const completionRate = habit.stats?.completion_rate || 0;
  const currentStreak = habit.stats?.current_streak || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl p-4 transition-all feather-glass-deco"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
          >
            {React.createElement(getIconComponent(habit.icon), {
              theme: 'outline',
              size: 18,
              fill: 'currentColor',
              strokeWidth: 2,
            })}
          </div>
          <div>
            <h3 className="font-medium text-text-primary">{habit.name}</h3>
            <p className="text-sm text-text-muted">
              {habit.frequency === 'daily' ? '每日' : '每周'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <p className="text-text-primary font-bold">{completionRate}%</p>
            <p className="text-text-muted text-xs">完成率</p>
          </div>
          {currentStreak > 0 && (
            <div className="flex items-center gap-1 status-warning/10 theme-text-warning px-2 py-1 rounded-full text-xs">
              <Flame size={16} />
              <span>{currentStreak}天</span>
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completionRate}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${habit.color}80, ${habit.color})`,
          }}
        />
      </div>

      {/* 最近7天完成情况 */}
      <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
        <span>最近7天</span>
        <div className="flex items-center gap-1">
          {[...Array(7)].map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const isCompleted = records.some((r) => r.habit_id === habit.id && r.date === dateStr);
            return (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${isCompleted ? 'status-success' : 'bg-bg-tertiary'}`}
                title={`${7 - i}天前: ${isCompleted ? '已完成' : '未完成'}`}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  icon,
  color,
  unlocked,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`
        relative p-4 rounded-xl transition-all duration-300 ${
          unlocked ? 'shadow-lg feather-glass-deco' : 'opacity-60 feather-glass-deco'
        }
      `}
    >
      <div className="text-center">
        <div
          className={`
          w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center
          ${unlocked ? '' : 'grayscale'}
        `}
          style={unlocked ? { backgroundColor: `${color}20`, color } : {}}
        >
          {icon}
        </div>
        <h4
          className={`font-medium text-sm mb-1 ${
            unlocked ? 'text-text-primary' : 'text-text-muted'
          }`}
        >
          {title}
        </h4>
        <p className="text-xs theme-text-secondary">{description}</p>
      </div>

      {unlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 status-warning rounded-full flex items-center justify-center"
        >
          <Crown size={12} className="theme-text-on-accent" />
        </motion.div>
      )}
    </motion.div>
  );
};

export const HabitStats: React.FC = () => {
  const { habits, records, getOverallStats } = useHabitStore();
  const stats = getOverallStats();

  // 计算高级统计数据
  const advancedStats = useMemo(() => {
    const activeHabits = habits.filter((h) => h.is_active);
    const totalRecords = records.length;

    // 最佳连续天数
    const longestStreak = Math.max(...activeHabits.map((h) => h.stats?.longest_streak || 0), 0);

    // 本周完成情况
    const thisWeekRecords = records.filter((r) => {
      const recordDate = new Date(r.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return recordDate >= weekAgo;
    });

    // 完美天数（所有习惯都完成的天数）
    const perfectDays = records.reduce(
      (acc, record) => {
        const date = record.date;
        if (!acc[date]) acc[date] = 0;
        acc[date]++;
        return acc;
      },
      {} as Record<string, number>
    );

    const perfectDayCount = Object.values(perfectDays).filter(
      (count) => count === activeHabits.length
    ).length;

    return {
      longestStreak,
      thisWeekCount: thisWeekRecords.length,
      perfectDays: perfectDayCount,
      totalRecords,
    };
  }, [habits, records]);

  // 成就数据
  const achievements = [
    {
      title: '新手起步',
      description: '完成第一个习惯',
      icon: <Star size={16} />,
      color: '#10b981',
      unlocked: stats.todayCompleted > 0,
    },
    {
      title: '连击专家',
      description: '连续打卡7天',
      icon: <Flame size={16} />,
      color: '#f59e0b',
      unlocked: advancedStats.longestStreak >= 7,
    },
    {
      title: '习惯大师',
      description: '同时保持5个习惯',
      icon: <Crown size={16} />,
      color: '#8b5cf6',
      unlocked: stats.activeHabits >= 5,
    },
    {
      title: '完美主义',
      description: '单日完成所有习惯',
      icon: <Trophy size={16} />,
      color: '#f97316',
      unlocked: advancedStats.perfectDays > 0,
    },
  ];

  if (habits.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center feather-glass-deco">
            <TrendingUp size={32} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">暂无统计数据</h3>
          <p className="text-text-muted">创建并完成一些习惯后查看统计信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 主要统计指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总完成次数"
          value={advancedStats.totalRecords}
          description="累计打卡记录"
          icon={<CheckCircle2 size={20} />}
          color="#3b82f6"
          trend={{ value: 12, isPositive: true }}
        />

        <StatCard
          title="最长连击"
          value={`${advancedStats.longestStreak}天`}
          description="历史最佳连击"
          icon={<Flame size={20} />}
          color="#f59e0b"
        />

        <StatCard
          title="完美天数"
          value={advancedStats.perfectDays}
          description="全部习惯完成"
          icon={<Crown size={20} />}
          color="#8b5cf6"
        />

        <StatCard
          title="平均完成率"
          value={`${stats.averageCompletionRate}%`}
          description="整体表现"
          icon={<Target size={20} />}
          color="#10b981"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">习惯表现</h3>
        <div className="space-y-3">
          {habits
            .filter((h) => h.is_active)
            .map((habit) => (
              <HabitProgressBar key={habit.id} habit={habit} records={records} />
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2">
          <Trophy size={16} />
          成就徽章
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement, index) => (
            <AchievementBadge key={index} {...achievement} />
          ))}
        </div>
      </div>

      <div className="rounded-xl p-6 transition-all feather-glass-deco">
        <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp size={16} />
          完成趋势
        </h3>
        <div className="space-y-4">
          <div className="flex items-end justify-between h-32 px-4">
            {[...Array(7)].map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const dateStr = date.toISOString().split('T')[0];

              // 计算当天完成的习惯数量
              const dayRecords = records.filter((r) => r.date === dateStr);
              const activeHabitsCount = habits.filter((h) => h.is_active).length;
              const completionRate =
                activeHabitsCount > 0 ? (dayRecords.length / activeHabitsCount) * 100 : 0;
              const height = Math.max(20, completionRate);

              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="w-8 bg-gradient-to-t from-accent/50 to-accent rounded-t-md min-h-[20px]"
                    title={`${date.getMonth() + 1}/${date.getDate()}: ${dayRecords.length}/${activeHabitsCount} 完成 (${Math.round(completionRate)}%)`}
                  />
                  <span className="text-xs text-text-muted">{date.getDate()}</span>
                </div>
              );
            })}
          </div>

          <div className="text-center text-sm text-text-muted">最近7天完成情况</div>
        </div>
      </div>

      <div className="rounded-xl p-6 transition-all feather-glass-deco">
        <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2">
          <Calendar size={16} />
          本周总结
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold theme-text-accent mb-2">
              {advancedStats.thisWeekCount}
            </div>
            <div className="text-sm text-text-muted">本周完成次数</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold theme-text-success mb-2">
              {Math.round((stats.todayCompleted / Math.max(stats.todayTotal, 1)) * 100)}%
            </div>
            <div className="text-sm text-text-muted">今日完成率</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold theme-text-accent mb-2">{stats.activeHabits}</div>
            <div className="text-sm text-text-muted">活跃习惯数</div>
          </div>
        </div>
      </div>
    </div>
  );
};
