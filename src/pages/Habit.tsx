import React, { useEffect, useState } from 'react';
import { useHabitStore } from '@/stores';
import { HabitWithStats } from '@/types';
import { HabitCard, HabitForm, HabitStats } from '@/components/features/habit';
import { CheckCircle2, Calendar, TrendingUp } from 'lucide-react';

const Habit: React.FC = () => {
  const {
    isLoading,
    currentView,
    selectedDate,
    loadHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    getTodayHabits,
    getOverallStats,
    recordHabitCompletion,
    undoHabitCompletion,
  } = useHabitStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | undefined>(undefined);

  // 组件挂载时延迟加载数据 - 避免阻塞启动
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // 延迟200ms后开始加载
    const delayTimer = setTimeout(() => {
      const loadWithTimeout = async () => {
        // 设置10秒超时
        timeoutId = setTimeout(() => {
          console.error('习惯数据加载超时');
          // 强制停止加载状态
          useHabitStore.setState({ isLoading: false, habits: [] });
        }, 10000);

        try {
          await loadHabits();
          clearTimeout(timeoutId);
        } catch (error) {
          console.error('加载习惯失败:', error);
          clearTimeout(timeoutId);
        }
      };

      loadWithTimeout();
    }, 200); // 延迟200ms
    return () => {
      clearTimeout(delayTimer);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loadHabits]);

  // 获取当前视图的标题和图标 - 暂时未使用
  /*
  const getView = () => {
    switch (currentView) {
      case 'list':
        return {
          title: '习惯列表',
          icon: Clock,
          description: '管理你的所有习惯'
        };
      case 'stats':
        return {
          title: '统计数据',
          icon: TrendingUp,
          description: '分析习惯数据'
        };
      default:
        return {
          title: '习惯追踪',
          icon: Clock,
          description: '培养良好习惯'
        };
    }
  };
  */

  // const viewConfig = getView(); // Unused for now
  const todayHabits = getTodayHabits();
  const stats = getOverallStats();

  // 处理习惯完成
  const handleHabitComplete = async (habitId: number) => {
    try {
      await recordHabitCompletion(habitId, selectedDate);
      // loadHabits 已经在 store 的 recordHabitCompletion 中调用了，无需重复调用
    } catch (error) {
      console.error('记录习惯完成失败:', error);
    }
  };

  // 处理编辑习惯
  const handleEditHabit = (habit: HabitWithStats) => {
    setEditingHabit(habit);
    setShowCreateForm(true);
  };

  // 处理删除习惯
  const handleDeleteHabit = async (habitId: number) => {
    try {
      await deleteHabit(habitId);
    } catch (error) {
      console.error('删除习惯失败:', error);
    }
  };

  // 处理撤销打卡
  const handleUndoHabit = async (habitId: number) => {
    try {
      await undoHabitCompletion(habitId, selectedDate);
      // loadHabits 已经在 store 的 undoHabitCompletion 中调用了，无需重复调用
    } catch (error) {
      console.error('撤销习惯打卡失败:', error);
    }
  };

  // 处理提交表单（创建或更新）
  const handleFormSubmit = async (habitData: any) => {
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id!, habitData);
      } else {
        await createHabit(habitData);
      }
    } catch (error) {
      console.error('保存习惯失败:', error);
    }
  };

  // 关闭表单
  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingHabit(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="theme-text-secondary">正在加载习惯数据...</div>
          <div className="text-xs text-text-muted mt-2">如果加载时间过长，请检查数据库连接</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 头部统计卡片 */}
      <div className="p-6 border-b border-border-primary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl feather-glass-deco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">总习惯数</p>
                <p className="text-2xl font-bold text-text-primary">{stats.totalHabits}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-blue-500" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl feather-glass-deco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">活跃习惯</p>
                <p className="text-2xl font-bold text-text-primary">{stats.activeHabits}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl feather-glass-deco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">今日完成</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.todayCompleted}/{stats.todayTotal}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Calendar size={20} className="text-orange-500" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl feather-glass-deco">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">平均完成率</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stats.averageCompletionRate}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 p-6">
        {currentView === 'list' && (
          <div className="space-y-4">
            {todayHabits.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center feather-glass-deco">
                  <CheckCircle2 size={32} className="text-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">暂无活跃习惯</h3>
                <p className="text-text-muted mb-4">开始创建你的第一个习惯吧！</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-2 rounded-lg theme-text-accent"
                >
                  新建习惯
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {todayHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onComplete={handleHabitComplete}
                    onUndo={handleUndoHabit}
                    onEdit={handleEditHabit}
                    onDelete={handleDeleteHabit}
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'stats' && <HabitStats />}
      </div>

      {/* 习惯表单模态框 */}
      <HabitForm
        habit={editingHabit}
        isOpen={showCreateForm}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default Habit;
