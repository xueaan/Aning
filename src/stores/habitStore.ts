import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Habit, 
  HabitRecord, 
  HabitStats, 
  HabitWithStats,
  HabitViewType 
} from '@/types';
import { DatabaseAPI } from '@/services/api/database';
import { DatabaseInitializer } from '@/services/database/initializer';
import { formatDate } from '@/utils/timeUtils';

export interface HabitStore {
  // 核心状态
  habits: HabitWithStats[];
  records: HabitRecord[];
  isLoading: boolean;
  
  // 视图状态
  currentView: HabitViewType;
  selectedHabitId: number | null;
  selectedDate: string; // YYYY-MM-DD 格式
  
  // 搜索和过滤
  searchQuery: string;
  filterActive: boolean;
  
  // 习惯操作方法
  loadHabits: () => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateHabit: (id: number, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
  toggleHabitActive: (id: number) => Promise<void>;
  
  // 记录操作方法
  loadRecords: (habitId?: number, dateRange?: { start: string; end: string }) => Promise<void>;
  recordHabitCompletion: (habitId: number, date: string, count?: number, notes?: string) => Promise<void>;
  undoHabitCompletion: (habitId: number, date: string) => Promise<void>;
  updateHabitRecord: (recordId: number, updates: Partial<HabitRecord>) => Promise<void>;
  deleteHabitRecord: (recordId: number) => Promise<void>;
  
  // 视图控制方法
  setCurrentView: (view: HabitViewType) => void;
  setSelectedHabit: (id: number | null) => void;
  setSelectedDate: (date: string) => void;
  
  // 搜索和过滤方法
  setSearchQuery: (query: string) => void;
  setFilterActive: (active: boolean) => void;
  
  // 辅助方法
  getTodayHabits: () => HabitWithStats[];
  getHabitsByDate: (date: string) => HabitRecord[];
  getHabitStats: (habitId: number) => HabitStats | undefined;
  getOverallStats: () => {
    totalHabits: number;
    activeHabits: number;
    todayCompleted: number;
    todayTotal: number;
    averageCompletionRate: number;
  };
  getStreakData: (habitId: number, days: number) => { date: string; completed: boolean }[];
}

export const useHabitStore = create<HabitStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      habits: [],
      records: [],
      isLoading: false,
      currentView: 'list',
      selectedHabitId: null,
      selectedDate: formatDate(new Date()),
      searchQuery: '',
      filterActive: false,

      // 习惯操作方法
      loadHabits: async () => {
        set({ isLoading: true });
        try {
          // 确保数据库已初始化
          await DatabaseInitializer.ensureInitialized();
          
          const dbHabits = await DatabaseAPI.getHabits();
          
          // 如果没有习惯，直接返回空数组
          if (dbHabits.length === 0) {
            set({ habits: [], records: [], isLoading: false });
            return;
          }

          // 加载所有记录用于统计计算
          const allRecords = await DatabaseAPI.getHabitRecords();
          
          // 获取今日日期
          const today = formatDate(new Date());
          
          // 加载基础习惯信息和计算真实统计
          const basicHabits: HabitWithStats[] = await Promise.all(
            dbHabits.map(async (dbHabit) => {
              // 获取今日记录
              const todayRecords = await DatabaseAPI.getHabitRecords(dbHabit.id!, today, today);
              const todayRecord = todayRecords.length > 0 ? todayRecords[0] : undefined;
              
              // 获取此习惯的所有记录
              const habitRecords = allRecords.filter(r => r.habit_id === dbHabit.id);
              
              // 计算真实统计数据
              const totalDays = Math.max(1, Math.ceil((Date.now() - new Date(dbHabit.created_at).getTime()) / (1000 * 60 * 60 * 24)));
              const completedDays = habitRecords.length;
              const completionRate = Math.round((completedDays / totalDays) * 100);
              
              // 计算连续天数
              let currentStreak = 0;
              let longestStreak = 0;
              let tempStreak = 0;
              
              // 按日期排序记录
              const sortedRecords = habitRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              
              // 计算当前连续天数
              const currentDate = new Date();
              for (let i = 0; i < 30; i++) {
                const checkDate = new Date(currentDate);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = formatDate(checkDate);
                
                if (sortedRecords.some(r => r.date === dateStr)) {
                  currentStreak = i + 1;
                } else {
                  break;
                }
              }
              
              // 计算最长连续天数
              const recordDates = new Set(habitRecords.map(r => r.date));
              for (let i = 0; i < 365; i++) {
                const checkDate = new Date();
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = formatDate(checkDate);
                
                if (recordDates.has(dateStr)) {
                  tempStreak++;
                  longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                  tempStreak = 0;
                }
              }
              
              // 本周完成情况
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              const thisWeekRecords = habitRecords.filter(r => new Date(r.date) >= weekAgo);
              
              // 本月完成情况
              const monthAgo = new Date();
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              const thisMonthRecords = habitRecords.filter(r => new Date(r.date) >= monthAgo);
              
              return {
                id: dbHabit.id!,
                name: dbHabit.name,
                description: dbHabit.description,
                icon: dbHabit.icon,
                color: dbHabit.color,
                frequency: dbHabit.frequency,
                target_count: dbHabit.target_count,
                is_active: dbHabit.is_active,
                created_at: dbHabit.created_at,
                updated_at: dbHabit.updated_at,
                today_record: todayRecord,
                stats: {
                  habit_id: dbHabit.id!,
                  total_days: totalDays,
                  completed_days: completedDays,
                  current_streak: currentStreak,
                  longest_streak: longestStreak,
                  completion_rate: completionRate,
                  this_week_completion: thisWeekRecords.length,
                  this_month_completion: thisMonthRecords.length
                }
              };
            })
          );
          
          // 转换记录格式
          const records: HabitRecord[] = allRecords.map(dbRecord => ({
            id: dbRecord.id,
            habit_id: dbRecord.habit_id,
            date: dbRecord.date,
            completed_count: dbRecord.completed_count,
            notes: dbRecord.notes,
            created_at: dbRecord.created_at,
            updated_at: dbRecord.updated_at
          }));
          
          set({ habits: basicHabits, records, isLoading: false });
          
        } catch (error) {
          set({ habits: [], records: [], isLoading: false });
        }
      },

      createHabit: async (habitData) => {
        try {
          await DatabaseAPI.createHabit(
            habitData.name,
            habitData.description,
            habitData.icon,
            habitData.color,
            habitData.frequency,
            habitData.target_count
          );
          
          // 重新加载习惯列表
          await get().loadHabits();
        } catch (error) {
          throw error;
        }
      },

      updateHabit: async (id, updates) => {
        try {
          const habit = get().habits.find(h => h.id === id);
          if (!habit) throw new Error('习惯未找到');

          await DatabaseAPI.updateHabit(
            id,
            updates.name || habit.name,
            updates.description || habit.description,
            updates.icon || habit.icon,
            updates.color || habit.color,
            updates.frequency || habit.frequency,
            updates.target_count || habit.target_count,
            updates.is_active !== undefined ? updates.is_active : habit.is_active
          );
          
          // 重新加载习惯列表
          await get().loadHabits();
        } catch (error) {
          throw error;
        }
      },

      deleteHabit: async (id) => {
        try {
          await DatabaseAPI.deleteHabit(id);
          
          // 重新加载习惯列表
          await get().loadHabits();
        } catch (error) {
          throw error;
        }
      },

      toggleHabitActive: async (id) => {
        const habit = get().habits.find(h => h.id === id);
        if (habit) {
          await get().updateHabit(id, { is_active: !habit.is_active });
        }
      },

      // 记录操作方法
      loadRecords: async (habitId?, dateRange?) => {
        try {
          const dbRecords = await DatabaseAPI.getHabitRecords(
            habitId,
            dateRange?.start,
            dateRange?.end
          );
          
          // 转换数据库记录为应用记录格式
          const records: HabitRecord[] = dbRecords.map(dbRecord => ({
            id: dbRecord.id,
            habit_id: dbRecord.habit_id,
            date: dbRecord.date,
            completed_count: dbRecord.completed_count,
            notes: dbRecord.notes,
            created_at: dbRecord.created_at,
            updated_at: dbRecord.updated_at
          }));
          
          set({ records });
        } catch (error) {
          console.error('Failed to load habit records:', error);
          set({ records: [] });
        }
      },

      recordHabitCompletion: async (habitId, date, count = 1, notes) => {
        try {
          
          // 对于习惯打卡，通常每天只记录一次完成，count=1
          // 使用数据库的 INSERT OR REPLACE 来确保每天只有一条记录
          const recordId = await DatabaseAPI.recordHabitCompletion(habitId, date, count, notes);
          
          // 局部更新状态，避免全部刷新
          set(state => {
            const updatedHabits = state.habits.map(habit => {
              if (habit.id === habitId) {
                // 更新今日记录
                const updatedHabit = { ...habit };
                updatedHabit.today_record = {
                  id: recordId,
                  habit_id: habitId,
                  date: date,
                  completed_count: count,
                  notes: notes,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                // 更新统计数据
                if (updatedHabit.stats) {
                  updatedHabit.stats.completed_days += 1;
                  updatedHabit.stats.current_streak += 1;
                  updatedHabit.stats.this_week_completion += 1;
                  updatedHabit.stats.this_month_completion += 1;
                  updatedHabit.stats.completion_rate = Math.round(
                    (updatedHabit.stats.completed_days / updatedHabit.stats.total_days) * 100
                  );
                }

                return updatedHabit;
              }
              return habit;
            });
            
            return { habits: updatedHabits };
          });
        } catch (error) {
          console.error('Failed to record habit completion:', {
            habitId,
            date,
            count,
            notes,
            error
          });
          throw error;
        }
      },

      updateHabitRecord: async (recordId, updates) => {
        try {
          set(state => ({
            records: state.records.map(record =>
              record.id === recordId
                ? { ...record, ...updates, updated_at: new Date().toISOString() }
                : record
            )
          }));
        } catch (error) {
          console.error('Failed to update habit record:', error);
          throw error;
        }
      },

      undoHabitCompletion: async (habitId, date) => {
        try {
          await DatabaseAPI.undoHabitCompletion(habitId, date);
          
          // 局部更新状态，避免全部刷新
          set(state => {
            const updatedHabits = state.habits.map(habit => {
              if (habit.id === habitId) {
                // 清除今日记录
                const updatedHabit = { ...habit };
                updatedHabit.today_record = undefined;
                
                // 更新统计数据
                if (updatedHabit.stats) {
                  updatedHabit.stats.completed_days = Math.max(0, updatedHabit.stats.completed_days - 1);
                  updatedHabit.stats.current_streak = Math.max(0, updatedHabit.stats.current_streak - 1);
                  updatedHabit.stats.this_week_completion = Math.max(0, updatedHabit.stats.this_week_completion - 1);
                  updatedHabit.stats.this_month_completion = Math.max(0, updatedHabit.stats.this_month_completion - 1);
                  updatedHabit.stats.completion_rate = updatedHabit.stats.total_days > 0 
                    ? Math.round((updatedHabit.stats.completed_days / updatedHabit.stats.total_days) * 100)
                    : 0;
                }

                return updatedHabit;
              }
              return habit;
            });
            
            return { habits: updatedHabits };
          });
        } catch (error) {
          throw error;
        }
      },

      deleteHabitRecord: async (recordId) => {
        try {
          set(state => ({
            records: state.records.filter(record => record.id !== recordId)
          }));
        } catch (error) {
          console.error('Failed to delete habit record:', error);
        }
      },

      // 视图控制方法
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedHabit: (id) => set({ selectedHabitId: id }),
      setSelectedDate: (date) => set({ selectedDate: date }),

      // 搜索和过滤方法
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterActive: (active) => set({ filterActive: active }),

      // 辅助方法
      getTodayHabits: () => {
        const { habits, filterActive } = get();
        let todayHabits = habits.filter(habit => habit.is_active);
        
        if (filterActive) {
          todayHabits = todayHabits.filter(habit => habit.today_record);
        }

        return todayHabits;
      },

      getHabitsByDate: (date) => {
        return get().records.filter(record => record.date === date);
      },

      getHabitStats: (habitId) => {
        const habit = get().habits.find(h => h.id === habitId);
        return habit?.stats;
      },

      getOverallStats: () => {
        const { habits } = get();
        const activeHabits = habits.filter(h => h.is_active);
        const todayTotal = activeHabits.length;
        const todayCompleted = activeHabits.filter(h => h.today_record).length;
        const avgCompletionRate = activeHabits.length > 0
          ? activeHabits.reduce((sum, h) => sum + (h.stats?.completion_rate || 0), 0) / activeHabits.length
          : 0;

        return {
          totalHabits: habits.length,
          activeHabits: activeHabits.length,
          todayCompleted,
          todayTotal,
          averageCompletionRate: Math.round(avgCompletionRate)
        };
      },

      getStreakData: (habitId, days) => {
        const records = get().records.filter(r => r.habit_id === habitId);
        const today = new Date();
        const streakData: { date: string; completed: boolean }[] = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = formatDate(date);
          const record = records.find(r => r.date === dateStr);
          
          streakData.push({
            date: dateStr,
            completed: record ? record.completed_count > 0 : false
          });
        }

        return streakData;
      }
    }),
    {
      name: 'habit-store'
    }
  )
);




