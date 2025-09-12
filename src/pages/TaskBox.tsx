import React, { useEffect } from 'react';
import { useTaskBoxStore } from '@/stores';
import { TaskQuickAdd, TaskKanban, TaskCalendar } from '@/components/modules/taskbox';
import { TaskList } from '@/components/modules/taskbox/taskbox/TaskList';
import { TaskBoxDashboard } from '@/components/features/dashboard/TaskBoxDashboard';
import { Calendar, Clock } from 'lucide-react';

const TaskBox: React.FC = () => {
  const {
    tasks,
    projects,
    currentView,
    displayMode,
    selectedProjectId,
    isLoading,
    loadTasks,
    loadProjects,
    createTask,
    updateTask,
    deleteTask,
    getTodayTasks,
    getOverdueTasks,
    getUpcomingTasks,
    getTasksByProject
  } = useTaskBoxStore();

  // 组件挂载时延迟加载数据，避免阻塞启动
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
      loadProjects();
    }, 100); // 短暂延迟，让UI先渲染
    return () => clearTimeout(timer);
  }, [loadTasks, loadProjects]);

  // 获取当前视图的标题和图标
  const getView = () => {
    switch (currentView) {
      case 'inbox':
        return {
          title: '收件箱',
          icon: Clock,
          description: '未分类的任务'
        };
      case 'today':
        return {
          title: '今天',
          icon: Calendar,
          description: '今日到期的任务'
        };
      case 'upcoming':
        return {
          title: '即将到期',
          icon: Clock,
          description: '7天内到期的任务'
        };
      case 'overdue':
        return {
          title: '逾期任务',
          icon: Clock,
          description: '已过期的任务'
        };
      case 'completed':
        return {
          title: '已完成',
          icon: Clock,
          description: '已完成的任务'
        };
      case 'dashboard':
        return {
          title: '数据概览',
          icon: () => <span className="text-xl">📈</span>,
          description: '任务数据统计'
        };
      case 'project':
        const project = projects.find(p => p.id === selectedProjectId);
        return {
          title: project?.name || '项目',
          icon: () => <span className="text-xl">{project?.icon || '📁'}</span>,
          description: project?.description || '项目任务'
        };
      default:
        return {
          title: '任务管理',
          icon: Clock,
          description: '管理你的任务'
        };
    }
  };

  // 获取当前视图的任务列表
  const getCurrentTasks = () => {
    switch (currentView) {
      case 'inbox':
        return tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
      case 'today':
        return getTodayTasks();
      case 'upcoming':
        return getUpcomingTasks();
      case 'overdue':
        return getOverdueTasks();
      case 'completed':
        return tasks.filter(task => task.status === 'completed');
      case 'dashboard':
        return tasks; // 仪表盘显示所有任务的统计
      case 'project':
        return selectedProjectId ? getTasksByProject(selectedProjectId) : [];
      default:
        return tasks;
    }
  };

  const view = getView();
  const ViewIcon = view.icon;
  const currentTasks = getCurrentTasks();

  return (
    <div className="h-full flex flex-col">
      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="theme-text-secondary">加载中...</p>
            </div>
          </div>
        ) : currentView === 'dashboard' ? (
          <TaskBoxDashboard />
        ) : (
          <div className={`h-full ${displayMode === 'list' ? 'p-6' : ''}`}>
            {/* 根据显示模式渲染不同的视图 */}
            {displayMode === 'list' && (
              <TaskList 
                tasks={currentTasks}
                projects={projects}
                onTaskUpdate={updateTask}
                onTaskDelete={deleteTask}
                showFilters={false}
                showProject={currentView !== 'project'}
                groupByDate={currentView === 'today' || currentView === 'upcoming'}
                groupByStatus={false}
                compact={true}
                emptyMessage={
                  currentView === 'inbox' ? '收件箱中没有待处理的任务' :
                  currentView === 'today' ? '今天没有安排任务' :
                  currentView === 'upcoming' ? '近期没有即将到期的任务' :
                  currentView === 'overdue' ? '没有逾期的任务' :
                  currentView === 'completed' ? '还没有完成任何任务' :
                  currentView === 'project' ? '这个项目中还没有任务' :
                  '暂无任务'
                }
                emptyIcon={
                  typeof ViewIcon === 'function' && ViewIcon.length === 0 ? 
                    <ViewIcon /> :
                    React.createElement(ViewIcon as React.ComponentType<any>, { size: 48 })
                }
              />
            )}

            {/* 看板视图 */}
            {displayMode === 'kanban' && (
              <TaskKanban 
                tasks={currentTasks} 
                projects={projects}
                onTaskUpdate={updateTask}
                onTaskDelete={deleteTask}
                onTaskCreate={createTask}
              />
            )}

            {/* 日历视图 */}
            {displayMode === 'calendar' && (
              <TaskCalendar 
                tasks={tasks} 
                projects={projects}
                onTaskUpdate={updateTask}
                onTaskDelete={deleteTask}
                onTaskCreate={createTask}
              />
            )}
          </div>
        )}
      </main>
      
      {displayMode === 'list' && (
        <footer className="flex-shrink-0 p-4 bg-transparent">
          <TaskQuickAdd 
            placeholder="快速添加任务..."
            defaultProjectId={currentView === 'project' ? selectedProjectId : null}
            defaultDueDate={currentView === 'today' ? new Date().toISOString().split('T')[0] : undefined}
          />
        </footer>
      )}
    </div>
  );
};

export default TaskBox;