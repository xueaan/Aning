import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, CheckCircle2, Circle } from 'lucide-react';
import { useTaskBoxStore } from '@/stores';
import { Task } from '@/types';
import { listContainerVariants, listItemVariants } from '@/config/animation';
import { Skeleton } from '../ui/Skeleton';

const priorityLabels = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

const priorityColors = {
  urgent: 'priority-urgent',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

export const TodoWidget: React.FC = () => {
  const { getTodayTasks, loadTasks, completeTask, projects, loadProjects } = useTaskBoxStore();

  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const refreshTasks = async () => {
    setIsRefreshing(true);
    try {
      await loadTasks();
      await loadProjects();
      setTodayTasks(getTodayTasks());
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCompleteTask = async (taskId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await completeTask(taskId);
      setTodayTasks(getTodayTasks());
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  useEffect(() => {
    const initializeTasks = async () => {
      try {
        await loadTasks();
        await loadProjects();
        setTodayTasks(getTodayTasks());
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    initializeTasks();
  }, [loadTasks, loadProjects, getTodayTasks]);

  useEffect(() => {
    setTodayTasks(getTodayTasks());
  }, [getTodayTasks]);

  const todoCount = todayTasks.length;

  return (
    <div className="h-full flex flex-col p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium theme-text-primary">今日待办</h2>
          {todoCount > 0 && (
            <motion.span
              className="px-2 py-0.5 text-xs rounded-full theme-bg-accent theme-text-on-accent font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {todoCount}
            </motion.span>
          )}
        </div>

        <motion.button
          onClick={refreshTasks}
          disabled={isRefreshing || initialLoading}
          className="p-1.5 rounded-lg theme-text-tertiary hover:theme-text-primary hover:theme-bg-secondary transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="刷新任务"
        >
          <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* 任务列表 */}
      {initialLoading ? (
        <div className="space-y-2 flex-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : todoCount === 0 ? (
        <div className="flex-1 flex items-center justify-center theme-text-tertiary">
          <div className="text-center">
            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">今日无待办事项</p>
          </div>
        </div>
      ) : (
        <div className="h-full overflow-y-auto scrollbar-hidden">
          <motion.div
            className="space-y-0"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {todayTasks.map((task, index) => {
                const project = projects.find((p) => p.id === task.project_id);
                const isLast = index === todayTasks.length - 1;

                return (
                  <motion.div
                    key={task.id}
                    className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer feather-glass-bottom-border ${isLast ? 'border-b-0' : ''}`}
                    variants={listItemVariants}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    layout
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {/* 复选框 */}
                    <motion.button
                      onClick={(e) => handleCompleteTask(task.id!, e)}
                      className="flex-shrink-0 p-1 rounded-full theme-text-tertiary hover:theme-text-accent transition-colors"
                      title="标记为完成"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 size={16} className="theme-text-accent" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </motion.button>

                    {/* 任务内容 - 中间部分 */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-sm font-medium leading-tight ${
                          task.status === 'completed'
                            ? 'line-through theme-text-secondary'
                            : 'theme-text-primary'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p
                          className={`text-xs mt-0.5 ${
                            task.status === 'completed'
                              ? 'line-through theme-text-tertiary'
                              : 'theme-text-secondary'
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* 项目标签 */}
                      {project && (
                        <span className="inline-block text-xs px-2 py-0.5 mt-1 rounded-full feather-glass-deco theme-text-secondary">
                          {project.name}
                        </span>
                      )}
                    </div>

                    {/* 右侧信息 - 截止日期和优先级 */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {task.due_date && (
                        <span
                          className={`text-xs ${
                            new Date(task.due_date) < new Date() && task.status !== 'completed'
                              ? 'theme-text-error font-medium'
                              : 'theme-text-tertiary'
                          }`}
                        >
                          {new Date(task.due_date).toLocaleDateString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </span>
                      )}

                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority]} font-medium`}
                      >
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
};
