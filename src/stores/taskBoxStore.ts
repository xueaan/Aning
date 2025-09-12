import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Task, 
  TaskProject, 
  TaskStatus, 
  TaskPriority, 
  TaskFilters, 
  TaskViewType, 
  TaskDisplayMode 
} from '@/types';
import { DatabaseAPI, DBTask, DBTaskProject } from '@/services/api/database';
import { DatabaseInitializer } from '@/services/database/initializer';
import { formatDate } from '@/utils/timeUtils';

// 数据转换函数
const dbTaskToTask = (dbTask: DBTask): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  status: dbTask.status as TaskStatus,
  priority: dbTask.priority as TaskPriority,
  due_date: dbTask.due_date,
  completed_at: dbTask.completed_at,
  project_id: dbTask.project_id,
  tags: [],
  created_at: dbTask.created_at,
  updated_at: dbTask.updated_at
});

const dbTaskProjectToTaskProject = (dbProject: DBTaskProject): TaskProject => ({
  id: dbProject.id,
  name: dbProject.name,
  icon: dbProject.icon,
  color: dbProject.color,
  description: dbProject.description,
  task_count: 0, // 将在后续查询中更新
  completed_count: 0, // 将在后续查询中更新
  created_at: dbProject.created_at,
  updated_at: dbProject.updated_at
});

export interface TaskBoxStore {
  // 核心状态
  tasks: Task[];
  projects: TaskProject[];
  isLoading: boolean;
  
  // 视图状态
  currentView: TaskViewType;
  displayMode: TaskDisplayMode;
  selectedTaskId: number | null;
  selectedProjectId: number | null;
  
  // 过滤和搜索
  filters: TaskFilters;
  searchQuery: string;
  
  // 侧栏状态
  expandedInSidebar: boolean;
  
  // 任务操作方法
  loadTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  toggleTaskStatus: (id: number) => Promise<void>;
  completeTask: (id: number) => Promise<void>;
  
  // 项目操作方法
  loadProjects: () => Promise<void>;
  createProject: (project: Omit<TaskProject, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (id: number, updates: Partial<TaskProject>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  
  // 视图控制方法
  setCurrentView: (view: TaskViewType) => void;
  setDisplayMode: (mode: TaskDisplayMode) => void;
  setSelectedTask: (id: number | null) => void;
  setSelectedProject: (id: number | null) => void;
  
  // 过滤和搜索方法
  setFilters: (filters: Partial<TaskFilters>) => void;
  searchTasks: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // 侧栏控制
  toggleSidebarExpand: () => void;
  
  // 辅助方法
  getTodayTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getUpcomingTasks: (days?: number) => Task[];
  getTasksByProject: (projectId: number) => Task[];
  getTaskStats: () => {
    total: number;
    completed: number;
    overdue: number;
    today: number;
    upcoming: number;
    inbox: number;
  };
  getDashboardStats: () => {
    totalTasks: number;
    completionRate: number;
    todayTasks: number;
    overdueTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    activeTasks: number;
    highPriorityTasks: number;
    mediumPriorityTasks: number;
    lowPriorityTasks: number;
  };
  getProjectStats: (projectId: number) => {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
  };
}

export const useTaskBoxStore = create<TaskBoxStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      tasks: [],
      projects: [],
      isLoading: false,
      
      currentView: 'today',
      displayMode: 'list',
      selectedTaskId: null,
      selectedProjectId: null,
      
      filters: {
        status: 'all',
        priority: 'all',
        project_id: null,
        due_date_range: 'all',
        search_query: ''
      },
      searchQuery: '',
      
      expandedInSidebar: true,
      
      // 任务操作方法实现
      loadTasks: async () => {
        set({ isLoading: true });
        try {
          // 确保数据库已初始化
          await DatabaseInitializer.ensureInitialized();
          
          const dbTasks = await DatabaseAPI.getAllTasks();
          const tasks = dbTasks.map(dbTaskToTask);
          
          set({ tasks, isLoading: false });
        } catch (error) {
          console.error('Failed to load tasks:', error);
          set({ tasks: [], isLoading: false });
        }
      },
      
      createTask: async (taskData) => {
        try {
          
          await DatabaseAPI.createTask(
            taskData.title,
            taskData.description,
            taskData.status,
            taskData.priority,
            taskData.due_date,
            taskData.project_id
          );

          // 重新加载任务列表以获取最新数据
          await get().loadTasks();
          
          // 如果任务关联了项目，也需要重新加载项目数据以更新统计信息
          if (taskData.project_id) {
            await get().loadProjects();
          }
        } catch (error) {
          console.error('Failed to create task:', error);
          throw error;
        }
      },
      
      updateTask: async (id, updates) => {
        try {
          
          await DatabaseAPI.updateTask(id, {
            title: updates.title,
            description: updates.description,
            status: updates.status,
            priority: updates.priority,
            due_date: updates.due_date,
            completed_at: updates.completed_at,
            project_id: updates.project_id
          });

          // 重新加载任务列表以获取最新数据
          await get().loadTasks();
          
          // 如果更新了项目关联，也需要重新加载项目数据以更新统计信息
          if (updates.project_id !== undefined) {
            await get().loadProjects();
          }
        } catch (error) {
          console.error('Failed to update task:', error);
          throw error;
        }
      },
      
      deleteTask: async (id) => {
        try {
          await DatabaseAPI.deleteTask(id);
          
          // 重新加载任务列表以获取最新数据
          await get().loadTasks();
        } catch (error) {
          console.error('Failed to delete task:', error);
          throw error;
        }
      },
      
      toggleTaskStatus: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return;
        
        const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
        const updates: Partial<Task> = {
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
        };
        
        await get().updateTask(id, updates);
      },
      
      completeTask: async (id) => {
        await get().updateTask(id, {
          status: 'completed',
          completed_at: new Date().toISOString()
        });
      },
      
      // 项目操作方法实现
      loadProjects: async () => {
        try {
          // 确保数据库已初始化
          await DatabaseInitializer.ensureInitialized();
          
          const dbProjects = await DatabaseAPI.getAllTaskProjects();
          const projects = dbProjects.map(dbTaskProjectToTaskProject);
          
          // 更新每个项目的任务统计
          for (const project of projects) {
            if (project.id) {
              try {
                const stats = await DatabaseAPI.getTaskProjectStats(project.id);
                project.task_count = stats.total_tasks;
                project.completed_count = stats.completed_tasks;
              } catch (error) {
                console.error('Failed to load project stats:', error);
              }
            }
          }

          set({ projects });
        } catch (error) {
          console.error('Failed to load projects:', error);
          set({ projects: [] });
        }
      },
      
      createProject: async (projectData) => {
        try {
          await DatabaseAPI.createTaskProject(
            projectData.name,
            projectData.icon || '📁',
            projectData.color,
            projectData.description
          );
          
          // 重新加载项目列表
          await get().loadProjects();
        } catch (error) {
          console.error('Failed to create project:', error);
          throw error;
        }
      },
      
      updateProject: async (id, updates) => {
        try {
          await DatabaseAPI.updateTaskProject(id, {
            name: updates.name,
            icon: updates.icon,
            color: updates.color,
            description: updates.description
          });
          
          // 重新加载项目列表
          await get().loadProjects();
        } catch (error) {
          console.error('Failed to update project:', error);
          throw error;
        }
      },
      
      deleteProject: async (id) => {
        try {
          await DatabaseAPI.deleteTaskProject(id);
          
          // 重新加载项目列表
          await get().loadProjects();
        } catch (error) {
          console.error('Failed to delete project:', error);
          throw error;
        }
      },
      
      // 视图控制方法
      setCurrentView: (view) => set({ currentView: view }),
      setDisplayMode: (mode) => set({ displayMode: mode }),
      setSelectedTask: (id) => set({ selectedTaskId: id }),
      setSelectedProject: (id) => set({ selectedProjectId: id }),
      
      // 过滤和搜索方法
      setFilters: (filters) => set(state => ({
        filters: { ...state.filters, ...filters }
      })),
      
      searchTasks: async (query) => {
        set({ searchQuery: query, isLoading: true });
        try {
          if (!query.trim()) {
            await get().loadTasks();
            return;
          }

          const dbTasks = await DatabaseAPI.searchTasks(query);
          const tasks = dbTasks.map(dbTaskToTask);
          
          set({ tasks, isLoading: false });
        } catch (error) {
          console.error('Failed to search tasks:', error);
          set({ isLoading: false });
        }
      },
      
      clearSearch: () => {
        set({ searchQuery: '' });
        get().loadTasks();
      },
      
      // 侧栏控制
      toggleSidebarExpand: () => set(state => ({
        expandedInSidebar: !state.expandedInSidebar
      })),
      
      // 辅助方法
      getTodayTasks: () => {
        const today = formatDate(new Date());
        return get().tasks.filter(task => 
          task.due_date === today && task.status !== 'completed'
        );
      },
      
      getOverdueTasks: () => {
        const today = formatDate(new Date());
        return get().tasks.filter(task => 
          task.due_date && task.due_date < today && task.status !== 'completed'
        );
      },
      
      getUpcomingTasks: (days = 7) => {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        
        const todayStr = formatDate(today);
        const futureDateStr = formatDate(futureDate);
        
        return get().tasks.filter(task => 
          task.due_date && task.due_date > todayStr && task.due_date <= futureDateStr && task.status !== 'completed'
        );
      },
      
      getTasksByProject: (projectId) => {
        return get().tasks.filter(task => task.project_id === projectId);
      },
      
      getTaskStats: () => {
        const tasks = get().tasks;
        const completed = tasks.filter(t => t.status === 'completed');
        const overdue = get().getOverdueTasks();
        const today = get().getTodayTasks();
        const upcoming = get().getUpcomingTasks();
        const inbox = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
        
        return {
          total: tasks.length,
          completed: completed.length,
          overdue: overdue.length,
          today: today.length,
          upcoming: upcoming.length,
          inbox: inbox.length
        };
      },

      getDashboardStats: () => {
        const tasks = get().tasks;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
        const pendingTasks = tasks.filter(t => t.status === 'todo').length;
        const activeTasks = tasks.filter(t => t.status !== 'completed').length;
        const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
        const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium' && t.status !== 'completed').length;
        const lowPriorityTasks = tasks.filter(t => t.priority === 'low' && t.status !== 'completed').length;
        const overdueTasks = get().getOverdueTasks().length;
        const todayTasks = get().getTodayTasks().length;
        
        const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
        
        return {
          totalTasks: tasks.length,
          completionRate,
          todayTasks,
          overdueTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          activeTasks,
          highPriorityTasks,
          mediumPriorityTasks,
          lowPriorityTasks
        };
      },

      getProjectStats: (projectId) => {
        const projectTasks = get().getTasksByProject(projectId);
        const completed = projectTasks.filter(t => t.status === 'completed').length;
        const inProgress = projectTasks.filter(t => t.status === 'in_progress').length;
        const pending = projectTasks.filter(t => t.status === 'todo').length;
        const overdue = projectTasks.filter(t => {
          if (!t.due_date || t.status === 'completed') return false;
          const today = formatDate(new Date());
          return t.due_date < today;
        }).length;
        
        return {
          total: projectTasks.length,
          completed,
          inProgress,
          pending,
          overdue
        };
      }
    }),
    {
      name: 'taskbox-store'
    }
  )
);





