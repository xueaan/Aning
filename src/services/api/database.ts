import { invoke } from '@tauri-apps/api/core';
import type { KnowledgeBase, Page, Block } from '@/types';

// Import specialized API modules
import { KnowledgeBaseAPI } from './modules/knowledgeBaseAPI';
import { PageAPI } from './modules/pageAPI';
import { BlockAPI } from './modules/blockAPI';

// Types (preserved from original)
export interface DBTimelineEntry {
  id?: number;
  date: string;
  time: string;
  content: string;
  weather?: string;
  mood?: string;
  timestamp?: number;
  created_at: string;
}

export interface DBTask {
  id?: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  project_id?: number | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface DBTaskProject {
  id?: number;
  name: string;
  icon: string;
  color?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DBHabit {
  id?: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBHabitRecord {
  id?: number;
  habit_id: number;
  date: string;
  count: number;
  created_at: string;
}

export interface DBStats {
  timeline_entries: number;
  knowledge_bases: number;
  pages: number;
  blocks: number;
  tasks: number;
  habits: number;
  database_path: string;
}

// Main Database API class - delegates knowledge operations to specialized APIs
export class DatabaseAPI {
  // ===== Database Core Operations =====
  
  static async init(): Promise<DBStats> {
    try {
      const result = await invoke<DBStats>('db_init');
      return result;
    } catch (error) {
      console.error('[DatabaseAPI] init() failed:', error);
      throw error;
    }
  }

  static async getPath(): Promise<string> {
    try {
      const result = await invoke('get_db_path');
      return result as string;
    } catch (error) {
      console.error('[DatabaseAPI] getPath() failed:', error);
      throw error;
    }
  }

  static async getStats(): Promise<DBStats> {
    try {
      const result = await invoke('get_db_stats');
      return result as DBStats;
    } catch (error) {
      console.error('[DatabaseAPI] getStats() failed:', error);
      throw error;
    }
  }

  // ===== Knowledge Base Operations (Delegated) =====
  
  static async createKnowledgeBase(name: string, icon?: string, description?: string): Promise<string> {
    return KnowledgeBaseAPI.createKnowledgeBase(name, icon, description);
  }

  static async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    return KnowledgeBaseAPI.getKnowledgeBases();
  }

  static async getAllKnowledgeBases(): Promise<KnowledgeBase[]> {
    return KnowledgeBaseAPI.getAllKnowledgeBases();
  }

  static async updateKnowledgeBase(id: string, name?: string, icon?: string, description?: string): Promise<void> {
    return KnowledgeBaseAPI.updateKnowledgeBase(id, name, icon, description);
  }

  static async deleteKnowledgeBase(id: string): Promise<void> {
    return KnowledgeBaseAPI.deleteKnowledgeBase(id);
  }

  static async searchKnowledgeBases(query: string): Promise<KnowledgeBase[]> {
    return KnowledgeBaseAPI.searchKnowledgeBases(query);
  }

  // ===== Page Operations (Delegated) =====
  
  static async createPage(knowledgeBaseId: string, title: string, parentId?: string, orderIndex?: number): Promise<string> {
    return PageAPI.createPage(knowledgeBaseId, title, parentId, orderIndex);
  }

  static async getPages(knowledgeBaseId: string, parentId?: string): Promise<Page[]> {
    return PageAPI.getPages(knowledgeBaseId, parentId);
  }

  static async getAllPages(knowledgeBaseId: string): Promise<Page[]> {
    return PageAPI.getAllPages(knowledgeBaseId);
  }

  static async getPageById(id: string): Promise<Page | null> {
    return PageAPI.getPageById(id);
  }

  static async updatePage(id: string, title?: string, parentId?: string, orderIndex?: number): Promise<void> {
    return PageAPI.updatePage(id, title, parentId, orderIndex);
  }

  static async deletePage(id: string): Promise<void> {
    return PageAPI.deletePage(id);
  }

  static async searchPages(knowledgeBaseId: string, query: string): Promise<Page[]>;
  static async searchPages(query: string, knowledgeBaseId?: string): Promise<Page[]>;
  static async searchPages(queryOrKnowledgeBaseId: string, queryOrUndefined?: string): Promise<Page[]> {
    if (queryOrUndefined === undefined) {
      // Single parameter case - assume it's a global query
      throw new Error('Global page search not implemented. Please provide knowledgeBaseId.');
    }
    return PageAPI.searchPages(queryOrKnowledgeBaseId, queryOrUndefined);
  }

  static async movePage(pageId: string, newParentId?: string, newOrderIndex: number = 0): Promise<void> {
    return PageAPI.movePage(pageId, newParentId, newOrderIndex);
  }

  static async getPageBreadcrumb(pageId: string): Promise<Page[]> {
    return PageAPI.getPageBreadcrumb(pageId);
  }

  static async getPageContent(pageId: string): Promise<{ title: string; content: string }> {
    return PageAPI.getPageContent(pageId);
  }

  static async updatePageContent(pageId: string, content: string, title?: string): Promise<void> {
    return PageAPI.updatePageContent(pageId, content, title);
  }

  // ===== Block Operations (Delegated) =====
  
  static async createBlock(pageId: string, blockType: string, content: string, parentId?: string, orderIndex?: number): Promise<string> {
    return BlockAPI.createBlock(pageId, blockType, content, parentId, orderIndex);
  }

  static async getBlocks(pageId: string, parentId?: string): Promise<Block[]> {
    return BlockAPI.getBlocks(pageId, parentId);
  }

  static async getBlockById(id: string): Promise<Block | null> {
    return BlockAPI.getBlockById(id);
  }

  static async updateBlock(id: string, content?: string, parentId?: string, orderIndex?: number): Promise<void> {
    return BlockAPI.updateBlock(id, content, parentId, orderIndex);
  }

  static async deleteBlock(id: string): Promise<void> {
    return BlockAPI.deleteBlock(id);
  }

  static async searchBlocks(query: string, knowledgeBaseId?: string): Promise<Block[]> {
    return BlockAPI.searchBlocks(query, knowledgeBaseId);
  }

  static async moveBlock(blockId: string, newParentId?: string, newOrderIndex: number = 0): Promise<void> {
    return BlockAPI.moveBlock(blockId, newParentId, newOrderIndex);
  }

  // ===== Timeline Operations =====
  
  static async createTimelineEntry(date: string, time: string, content: string, weather?: string, mood?: string): Promise<number> {
    try {
      return await invoke('create_timeline_entry', { date, time, content, weather, mood });
    } catch (error) {
      console.error('[DatabaseAPI] createTimelineEntry failed:', error);
      throw error;
    }
  }

  static async getTimelineEntries(page: number = 1, limit: number = 10): Promise<{ entries: DBTimelineEntry[]; total: number }> {
    try {
      return await invoke('get_timeline_entries', { page, limit });
    } catch (error) {
      console.error('[DatabaseAPI] getTimelineEntries failed:', error);
      throw error;
    }
  }

  static async getTimelineByDate(date: string): Promise<DBTimelineEntry[]> {
    try {
      return await invoke('get_timeline_by_date', { date });
    } catch (error) {
      console.error('[DatabaseAPI] getTimelineByDate failed:', error);
      throw error;
    }
  }

  static async updateTimelineEntry(id: number, content?: string, weather?: string, mood?: string): Promise<void> {
    try {
      await invoke('update_timeline_entry', { id, content, weather, mood });
    } catch (error) {
      console.error('[DatabaseAPI] updateTimelineEntry failed:', error);
      throw error;
    }
  }

  static async deleteTimelineEntry(id: number): Promise<void> {
    try {
      await invoke('delete_timeline_entry', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deleteTimelineEntry failed:', error);
      throw error;
    }
  }

  // ===== Data Migration =====
  
  static async migrateData(): Promise<void> {
    try {
      await invoke('migrate_database');
    } catch (error) {
      console.error('[DatabaseAPI] migrateData failed:', error);
      throw error;
    }
  }

  // ===== Task Operations =====
  
  static async createTask(task: Omit<DBTask, 'id' | 'created_at' | 'updated_at'>): Promise<number>;
  static async createTask(title: string, description?: string, status?: string, priority?: string, due_date?: string, project_id?: number): Promise<number>;
  static async createTask(...args: any[]): Promise<number> {
    try {
      if (args.length === 1 && typeof args[0] === 'object') {
        // New API format
        return await invoke('create_task', { task: args[0] });
      } else {
        // Old API format - convert to new format
        const [title, description, status, priority, due_date, project_id] = args;
        const task = {
          title,
          description,
          status: status || 'todo',
          priority: priority || 'medium',
          due_date,
          project_id
        };
        return await invoke('create_task', { task });
      }
    } catch (error) {
      console.error('[DatabaseAPI] createTask failed:', error);
      throw error;
    }
  }

  static async getTasks(filters?: { status?: string; priority?: string; projectId?: number }): Promise<DBTask[]> {
    try {
      // 智能路由到对应的后端命令
      if (filters?.status) {
        return await invoke('get_tasks_by_status', { status: filters.status });
      } else if (filters?.projectId) {
        return await invoke('get_tasks_by_project', { project_id: filters.projectId });
      } else {
        return await invoke('get_all_tasks');
      }
    } catch (error) {
      console.error('[DatabaseAPI] getTasks failed:', error);
      throw error;
    }
  }

  // Compatibility alias
  static async getAllTasks(): Promise<DBTask[]> {
    return this.getTasks();
  }

  static async updateTask(id: number, updates: Partial<Omit<DBTask, 'id' | 'created_at'>>): Promise<void> {
    try {
      await invoke('update_task', { id, updates });
    } catch (error) {
      console.error('[DatabaseAPI] updateTask failed:', error);
      throw error;
    }
  }

  static async deleteTask(id: number): Promise<void> {
    try {
      await invoke('delete_task', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deleteTask failed:', error);
      throw error;
    }
  }

  // ===== Project Operations =====
  
  static async createProject(project: Omit<DBTaskProject, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      return await invoke('create_task_project', { name: project.name, icon: project.icon, color: project.color, description: project.description });
    } catch (error) {
      console.error('[DatabaseAPI] createProject failed:', error);
      throw error;
    }
  }

  static async getProjects(): Promise<DBTaskProject[]> {
    try {
      return await invoke('get_all_task_projects');
    } catch (error) {
      console.error('[DatabaseAPI] getProjects failed:', error);
      throw error;
    }
  }

  static async updateProject(id: number, updates: Partial<Omit<DBTaskProject, 'id' | 'created_at'>>): Promise<void> {
    try {
      await invoke('update_task_project', { id, updates });
    } catch (error) {
      console.error('[DatabaseAPI] updateProject failed:', error);
      throw error;
    }
  }

  static async deleteProject(id: number): Promise<void> {
    try {
      await invoke('delete_task_project', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deleteProject failed:', error);
      throw error;
    }
  }

  // Compatibility aliases for task projects
  static async createTaskProject(project: Omit<DBTaskProject, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    return this.createProject(project);
  }

  static async getAllTaskProjects(): Promise<DBTaskProject[]> {
    return this.getProjects();
  }

  static async updateTaskProject(id: number, updates: Partial<Omit<DBTaskProject, 'id' | 'created_at'>>): Promise<void> {
    return this.updateProject(id, updates);
  }

  static async deleteTaskProject(id: number): Promise<void> {
    return this.deleteProject(id);
  }

  static async getTaskProjectStats(id: number): Promise<any> {
    // This method needs to be implemented based on requirements
    try {
      return await invoke('get_task_project_stats', { id });
    } catch (error) {
      console.error('[DatabaseAPI] getTaskProjectStats failed:', error);
      throw error;
    }
  }

  // ===== Habit Operations =====
  
  static async createHabit(habit: Omit<DBHabit, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      // Parameter validation
      if (!habit.name || habit.name.trim() === '') {
        throw new Error('Habit name is required and cannot be empty');
      }
      if (!habit.icon || habit.icon.trim() === '') {
        throw new Error('Habit icon is required');
      }
      if (!habit.color || habit.color.trim() === '') {
        throw new Error('Habit color is required');
      }
      if (!['daily', 'weekly', 'monthly'].includes(habit.frequency)) {
        throw new Error('Habit frequency must be daily, weekly, or monthly');
      }
      if (habit.target_count <= 0) {
        throw new Error('Habit target count must be greater than 0');
      }
      
      return await invoke('create_habit', { 
        name: habit.name.trim(),
        description: habit.description || null,
        icon: habit.icon.trim(),
        color: habit.color.trim(),
        frequency: habit.frequency,
        targetCount: habit.target_count
      });
    } catch (error) {
      console.error('[DatabaseAPI] createHabit failed:', error);
      throw error;
    }
  }

  static async getHabits(): Promise<DBHabit[]> {
    try {
      return await invoke('get_habits');
    } catch (error) {
      console.error('[DatabaseAPI] getHabits failed:', error);
      throw error;
    }
  }

  static async updateHabit(id: number, updates: Partial<Omit<DBHabit, 'id' | 'created_at'>>): Promise<void> {
    try {
      // Parameter validation
      if (!id || id <= 0) {
        throw new Error('Valid habit ID is required');
      }
      if (Object.keys(updates).length === 0) {
        throw new Error('At least one field must be provided for update');
      }
      if (updates.name !== undefined && updates.name.trim() === '') {
        throw new Error('Habit name cannot be empty');
      }
      if (updates.frequency && !['daily', 'weekly', 'monthly'].includes(updates.frequency)) {
        throw new Error('Habit frequency must be daily, weekly, or monthly');
      }
      if (updates.target_count !== undefined && updates.target_count <= 0) {
        throw new Error('Habit target count must be greater than 0');
      }
      
      // Get current habit to fill in missing required fields
      const currentHabit = await this.getHabits().then(habits => habits.find(h => h.id === id));
      if (!currentHabit) {
        throw new Error(`Habit with ID ${id} not found`);
      }
      
      await invoke('update_habit', {
        id,
        name: updates.name !== undefined ? updates.name.trim() : currentHabit.name,
        description: updates.description !== undefined ? updates.description : currentHabit.description,
        icon: updates.icon !== undefined ? updates.icon.trim() : currentHabit.icon,
        color: updates.color !== undefined ? updates.color.trim() : currentHabit.color,
        frequency: updates.frequency !== undefined ? updates.frequency : currentHabit.frequency,
        targetCount: updates.target_count !== undefined ? updates.target_count : currentHabit.target_count,
        isActive: updates.is_active !== undefined ? updates.is_active : currentHabit.is_active
      });
    } catch (error) {
      console.error('[DatabaseAPI] updateHabit failed:', error);
      throw error;
    }
  }

  static async deleteHabit(id: number): Promise<void> {
    try {
      await invoke('delete_habit', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deleteHabit failed:', error);
      throw error;
    }
  }

  static async createHabitRecord(habitId: number, date: string, count: number = 1): Promise<number> {
    try {
      return await invoke('record_habit_completion', { habitId: habitId, date, completedCount: count, notes: null });
    } catch (error) {
      console.error('[DatabaseAPI] createHabitRecord failed:', error);
      throw error;
    }
  }

  static async getHabitRecords(habitId: number, startDate?: string, endDate?: string): Promise<DBHabitRecord[]> {
    try {
      return await invoke('get_habit_records', { habitId: habitId, startDate: startDate, endDate: endDate });
    } catch (error) {
      console.error('[DatabaseAPI] getHabitRecords failed:', error);
      throw error;
    }
  }

  static async updateHabitRecord(id: number, count: number): Promise<void> {
    try {
      // Note: Backend doesn't have update_habit_record command
      // This method is kept for API compatibility but will throw an error
      throw new Error(`updateHabitRecord is not supported by backend. Use recordHabitCompletion instead. (Attempted to update record ${id} with count ${count})`);
    } catch (error) {
      console.error('[DatabaseAPI] updateHabitRecord failed:', error);
      throw error;
    }
  }

  static async deleteHabitRecord(id: number): Promise<void> {
    try {
      await invoke('delete_habit_record', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deleteHabitRecord failed:', error);
      throw error;
    }
  }

  // Additional habit methods for compatibility
  static async recordHabitCompletion(habitId: number, date: string, count: number = 1, notes?: string): Promise<number> {
    try {
      return await invoke('record_habit_completion', { habitId: habitId, date, completedCount: count, notes });
    } catch (error) {
      console.error('[DatabaseAPI] recordHabitCompletion failed:', error);
      throw error;
    }
  }

  static async undoHabitCompletion(habitId: number, date: string): Promise<void> {
    try {
      await invoke('undo_habit_completion', { habitId: habitId, date });
    } catch (error) {
      console.error('[DatabaseAPI] undoHabitCompletion failed:', error);
      throw error;
    }
  }

  // Task search method
  static async searchTasks(query: string, filters?: any): Promise<DBTask[]> {
    try {
      return await invoke('search_tasks', { query, filters });
    } catch (error) {
      console.error('[DatabaseAPI] searchTasks failed:', error);
      throw error;
    }
  }

  // 清理历史数据
  static async cleanupUnnamedPages(): Promise<number> {
    try {
      return await invoke('cleanup_unnamed_pages');
    } catch (error) {
      console.error('[DatabaseAPI] cleanupUnnamedPages failed:', error);
      throw error;
    }
  }
}