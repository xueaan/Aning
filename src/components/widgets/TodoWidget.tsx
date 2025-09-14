import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, CheckCircle2, Circle } from 'lucide-react';
import { useTaskBoxStore } from '@/stores';
import { Task, TaskPriority } from '@/types';
import { listContainerVariants, listItemVariants } from '@/config/animation';
import { Skeleton } from '../ui/Skeleton';

const priorityLabels = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低'
};

const priorityColors = {
  urgent: 'priority-urgent',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low'
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
          <motion.div className="space-y-0"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {todayTasks.map((task, index) => {
                const project = projects.find(p => p.id === task.project_id);
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
                    <motion.button
                      onClick={(e) => handleCompleteTask(task.id!, e)}
                      className="flex-shrink-0 mt-0.5 p-1 rounded-full theme-text-tertiary"
                      title="标记完成"
                      whileHover={{
                        color: 'rgb(34 197 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        scale: 1.1
                      }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Circle size={16} className="group-hover:hidden" />
                      <CheckCircle2 size={16} className="hidden group-hover:block" />
                    </motion.button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="theme-text-primary text-sm font-medium break-words leading-relaxed">
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1.5">
                          {project && (
                            <motion.span
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-medium"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.15 }}
                            >
                              {project.name}
                            </motion.span>
                          )}
                        </div>

                        <motion.span
                          className={`text-[10px] px-1 py-0.5 rounded font-medium ${priorityColors[task.priority as TaskPriority] || 'priority-medium'}`}
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.15 }}
                        >
                          {priorityLabels[task.priority as TaskPriority] || '中'}
                        </motion.span>
                      </div>
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