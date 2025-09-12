import { invoke } from '@tauri-apps/api/core';
import type { KnowledgeBase, Page, Block } from '@/types';

// 时光记类型（保持不变）
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

// 任务类型（保持不变）
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

// 习惯类型（保持不变）
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
  completed_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DBStats {
  knowledge_bases: number;
  pages: number;
  blocks: number;
  timeline_entries: number;
  tasks: number;
  habits: number;
  database_path: string;
}

// 数据库 API
export class DatabaseAPI {
  // 初始化数据库
  static async init(): Promise<DBStats> {
    try {
      const result = await invoke<DBStats>('db_init');
      return result;
    } catch (error) {
      console.error('[DatabaseAPI] init() failed:', error);
      throw error;
    }
  }

  // 获取数据库路径
  static async getPath(): Promise<string> {
    try {
      const result = await invoke('get_db_path');
      return result as string;
    } catch (error) {
      console.error('[DatabaseAPI] getPath() failed:', error);
      throw error;
    }
  }

  // 获取统计信息
  static async getStats(): Promise<DBStats> {
    try {
      const result = await invoke('get_db_stats');
      return result as DBStats;
    } catch (error) {
      console.error('[DatabaseAPI] getStats() failed:', error);
      throw error;
    }
  }

  // ===== 知识库操作 =====
  
  static async createKnowledgeBase(name: string, icon?: string, description?: string): Promise<string> {
    try {
      return await invoke('create_knowledge_base', { name, icon, description });
    } catch (error) {
      console.error('[DatabaseAPI] createKnowledgeBase failed:', error);
      throw error;
    }
  }

  static async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    try {
      return await invoke('get_knowledge_bases');
    } catch (error) {
      console.error('[DatabaseAPI] getKnowledgeBases failed:', error);
      throw error;
    }
  }

  static async updateKnowledgeBase(id: string, name?: string, icon?: string, description?: string): Promise<void> {
    try {
      await invoke('update_knowledge_base', { id, name, icon, description });
    } catch (error) {
      console.error('[DatabaseAPI] updateKnowledgeBase failed:', error);
      throw error;
    }
  }

  static async deleteKnowledgeBase(id: string): Promise<void> {
    try {
      await invoke('delete_knowledge_base', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deleteKnowledgeBase failed:', error);
      throw error;
    }
  }

  static async searchKnowledgeBases(query: string): Promise<KnowledgeBase[]> {
    try {
      return await invoke('search_knowledge_bases', { query });
    } catch (error) {
      console.error('[DatabaseAPI] searchKnowledgeBases failed:', error);
      throw error;
    }
  }

  // ===== 页面操作 =====
  
  static async createPage(knowledgeBaseId: string, title: string, parentId?: string, orderIndex?: number): Promise<string> {
    try {
      return await invoke('create_page', { knowledgeBaseId, title, parentId, orderIndex });
    } catch (error) {
      console.error('[DatabaseAPI] createPage failed:', error);
      throw error;
    }
  }

  static async getPages(knowledgeBaseId: string, parentId?: string): Promise<Page[]> {
    try {
      return await invoke('get_pages', { knowledgeBaseId, parentId });
    } catch (error) {
      console.error('[DatabaseAPI] getPages failed:', error);
      throw error;
    }
  }

  static async getAllPages(knowledgeBaseId: string): Promise<Page[]> {
    try {
      return await invoke('get_all_pages', { knowledgeBaseId });
    } catch (error) {
      console.error('[DatabaseAPI] getAllPages failed:', error);
      throw error;
    }
  }

  static async getPageById(id: string): Promise<Page | null> {
    try {
      return await invoke('get_page_by_id', { id });
    } catch (error) {
      console.error('[DatabaseAPI] getPageById failed:', error);
      throw error;
    }
  }

  static async updatePage(id: string, title?: string, parentId?: string, orderIndex?: number): Promise<void> {
    try {
      await invoke('update_page', { id, title, parentId, orderIndex });
    } catch (error) {
      console.error('[DatabaseAPI] updatePage failed:', error);
      throw error;
    }
  }

  static async deletePage(id: string): Promise<void> {
    try {
      await invoke('delete_page', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deletePage failed:', error);
      throw error;
    }
  }

  static async searchPages(knowledgeBaseId: string, query: string): Promise<Page[]> {
    try {
      return await invoke('search_pages', { knowledgeBaseId, query });
    } catch (error) {
      console.error('[DatabaseAPI] searchPages failed:', error);
      throw error;
    }
  }

  static async movePage(pageId: string, newParentId?: string, newOrderIndex: number = 0): Promise<void> {
    try {
      await invoke('move_page', { pageId, newParentId, newOrderIndex });
    } catch (error) {
      console.error('[DatabaseAPI] movePage failed:', error);
      throw error;
    }
  }

  static async getPageBreadcrumb(pageId: string): Promise<Page[]> {
    try {
      return await invoke('get_page_breadcrumb', { pageId });
    } catch (error) {
      console.error('[DatabaseAPI] getPageBreadcrumb failed:', error);
      throw error;
    }
  }

  // ===== 块操作 =====
  
  static async createBlock(pageId: string, blockType: string, content: string, parentId?: string, orderIndex?: number): Promise<string> {
    try {
      return await invoke('create_block', { pageId, blockType, content, parentId, orderIndex });
    } catch (error) {
      console.error('[DatabaseAPI] createBlock failed:', error);
      throw error;
    }
  }

  static async getBlocks(pageId: string, parentId?: string): Promise<Block[]> {
    try {
      return await invoke('get_blocks', { pageId, parentId });
    } catch (error) {
      console.error('[DatabaseAPI] getBlocks failed:', error);
      throw error;
    }
  }

  static async getBlockById(id: string): Promise<Block | null> {
    try {
      return await invoke('get_block_by_id', { id });
    } catch (error) {
      console.error('[DatabaseAPI] getBlockById failed:', error);
      throw error;
    }
  }

  static async updateBlock(id: string, content?: string, parentId?: string, orderIndex?: number): Promise<void> {
    try {
      await invoke('update_block', { id, content, parentId, orderIndex });
    } catch (error) {
      console.error('[DatabaseAPI] updateBlock failed:', error);
      throw error;
    }
  }

  static async deleteBlock(id: string): Promise<void> {
    try {
      await invoke('delete_block', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deleteBlock failed:', error);
      throw error;
    }
  }

  static async searchBlocks(pageId: string, query: string): Promise<Block[]> {
    try {
      return await invoke('search_blocks', { pageId, query });
    } catch (error) {
      console.error('[DatabaseAPI] searchBlocks failed:', error);
      throw error;
    }
  }

  static async moveBlock(blockId: string, newParentId?: string, newOrderIndex: number = 0): Promise<void> {
    try {
      await invoke('move_block', { blockId, newParentId, newOrderIndex });
    } catch (error) {
      console.error('[DatabaseAPI] moveBlock failed:', error);
      throw error;
    }
  }

  // ===== 时光记操作（保持不变） =====
  
  static async createTimelineEntry(
    date: string,
    time: string,
    content: string,
    _weather?: string,
    _mood?: string,
    timestamp?: number
  ): Promise<number> {
    try {
      const result = await invoke('create_timeline_entry', {
        date,
        time,
        content,
        timestamp
      });
      return result as number;
    } catch (error) {
      console.error('[DatabaseAPI] createTimelineEntry failed:', error);
      throw error;
    }
  }

  static async getTimelineByDate(date: string): Promise<DBTimelineEntry[]> {
    return await invoke('get_timeline_by_date', { date });
  }

  static async getRecentTimeline(limit: number = 20): Promise<DBTimelineEntry[]> {
    return await invoke('get_recent_timeline', { limit });
  }

  static async deleteTimelineEntry(id: number): Promise<void> {
    return await invoke('db_delete_timeline_entry', { id });
  }

  // ===== 数据迁移 =====
  
  static async migrateMarkdownToDB(): Promise<string> {
    return await invoke('migrate_markdown_to_db');
  }

  // ===== 任务操作（保持不变） =====
  
  static async createTask(
    title: string,
    description?: string,
    status: string = 'todo',
    priority: string = 'medium',
    dueDate?: string,
    projectId?: number | null
  ): Promise<number> {
    try {
      const result = await invoke('create_task', {
        title,
        description: description ?? null,
        status,
        priority,
        deadline: dueDate ?? null,
        project: projectId ?? null
      });
      
      return result as number;
    } catch (error) {
      console.error('[DatabaseAPI] createTask failed:', error);
      throw error;
    }
  }

  static async getAllTasks(): Promise<DBTask[]> {
    try {
      const result = await invoke('get_all_tasks');
      return result as DBTask[];
    } catch (error) {
      console.error('[DatabaseAPI] getAllTasks failed:', error);
      throw error;
    }
  }

  static async getTasksByStatus(status: string): Promise<DBTask[]> {
    try {
      const result = await invoke('get_tasks_by_status', { status });
      return result as DBTask[];
    } catch (error) {
      console.error('[DatabaseAPI] getTasksByStatus failed:', error);
      throw error;
    }
  }

  static async getTasksByProject(projectId: number): Promise<DBTask[]> {
    try {
      const result = await invoke('get_tasks_by_project', { project_id: projectId });
      return result as DBTask[];
    } catch (error) {
      console.error('[DatabaseAPI] getTasksByProject failed:', error);
      throw error;
    }
  }

  static async getTasksByDateRange(startDate?: string, endDate?: string): Promise<DBTask[]> {
    try {
      const result = await invoke('get_tasks_by_date_range', { 
        start_date: startDate, 
        end_date: endDate 
      });
      return result as DBTask[];
    } catch (error) {
      console.error('[DatabaseAPI] getTasksByDateRange failed:', error);
      throw error;
    }
  }

  static async updateTask(
    id: number,
    updates: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      due_date?: string;
      completed_at?: string;
      project_id?: number | null;
    }
  ): Promise<void> {
    try {
      await invoke('update_task', {
        id: id,
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        deadline: updates.due_date,
        completed_at: updates.completed_at,
        project: updates.project_id
      });
    } catch (error) {
      console.error('[DatabaseAPI] updateTask failed:', error);
      throw error;
    }
  }

  static async deleteTask(id: number, soft: boolean = true): Promise<void> {
    try {
      await invoke('delete_task', { id, soft });
    } catch (error) {
      console.error('[DatabaseAPI] deleteTask failed:', error);
      throw error;
    }
  }

  static async searchTasks(query: string): Promise<DBTask[]> {
    try {
      const result = await invoke('search_tasks', { query });
      return result as DBTask[];
    } catch (error) {
      console.error('[DatabaseAPI] searchTasks failed:', error);
      throw error;
    }
  }

  // ===== 项目操作（保持不变） =====
  
  static async createTaskProject(
    name: string,
    icon: string = '📁',
    color?: string,
    description?: string
  ): Promise<number> {
    try {
      const result = await invoke('create_task_project', {
        name,
        icon,
        color,
        description
      });
      return result as number;
    } catch (error) {
      console.error('[DatabaseAPI] createTaskProject failed:', error);
      throw error;
    }
  }

  static async getAllTaskProjects(): Promise<DBTaskProject[]> {
    try {
      const result = await invoke('get_all_task_projects');
      return result as DBTaskProject[];
    } catch (error) {
      console.error('[DatabaseAPI] getAllTaskProjects failed:', error);
      throw error;
    }
  }

  static async updateTaskProject(
    id: number,
    updates: {
      name?: string;
      icon?: string;
      color?: string;
      description?: string;
    }
  ): Promise<void> {
    try {
      await invoke('update_task_project', { id, ...updates });
    } catch (error) {
      console.error('[DatabaseAPI] updateTaskProject failed:', error);
      throw error;
    }
  }

  static async deleteTaskProject(id: number): Promise<void> {
    try {
      await invoke('delete_task_project', { id });
    } catch (error) {
      console.error('[DatabaseAPI] deleteTaskProject failed:', error);
      throw error;
    }
  }

  static async getTaskProjectStats(projectId: number): Promise<{
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
  }> {
    try {
      const result = await invoke('get_task_project_stats', { projectId });
      const [total_tasks, completed_tasks, overdue_tasks] = result as [number, number, number];
      return { total_tasks, completed_tasks, overdue_tasks };
    } catch (error) {
      console.error('[DatabaseAPI] getTaskProjectStats failed:', error);
      throw error;
    }
  }

  // ===== 习惯管理（保持不变） =====

  static async createHabit(
    name: string,
    description?: string,
    icon: string = '✅',
    color: string = '#3B82F6',
    frequency: 'daily' | 'weekly' | 'monthly' = 'daily',
    target_count: number = 1
  ): Promise<number> {
    try {
      const result = await invoke<number>('create_habit', {
        name,
        description,
        icon,
        color,
        frequency,
        targetCount: target_count
      });
      return result;
    } catch (error) {
      console.error('[DatabaseAPI] createHabit failed:', error);
      throw error;
    }
  }

  static async getHabits(): Promise<DBHabit[]> {
    try {
      return await invoke<DBHabit[]>('get_habits');
    } catch (error) {
      console.error('[DatabaseAPI] getHabits failed:', error);
      throw error;
    }
  }

  static async getHabitById(id: number): Promise<DBHabit | null> {
    try {
      return await invoke<DBHabit | null>('get_habit_by_id', { id });
    } catch (error) {
      console.error('[DatabaseAPI] getHabitById failed:', error);
      throw error;
    }
  }

  static async updateHabit(
    id: number,
    name: string,
    description?: string,
    icon: string = '✅',
    color: string = '#3B82F6',
    frequency: 'daily' | 'weekly' | 'monthly' = 'daily',
    target_count: number = 1,
    is_active: boolean = true
  ): Promise<void> {
    try {
      await invoke('update_habit', {
        id,
        name,
        description,
        icon,
        color,
        frequency,
        targetCount: target_count,
        isActive: is_active
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

  // ===== 习惯记录管理（保持不变） =====

  static async recordHabitCompletion(
    habit_id: number,
    date: string,
    completed_count: number = 1,
    notes?: string
  ): Promise<number> {
    try {
      return await invoke<number>('record_habit_completion', {
        habitId: habit_id,
        date,
        completedCount: completed_count,
        notes
      });
    } catch (error) {
      console.error('[DatabaseAPI] recordHabitCompletion failed:', error);
      throw error;
    }
  }

  static async getHabitRecords(
    habit_id?: number,
    start_date?: string,
    end_date?: string
  ): Promise<DBHabitRecord[]> {
    try {
      return await invoke<DBHabitRecord[]>('get_habit_records', {
        habitId: habit_id,
        startDate: start_date,
        endDate: end_date
      });
    } catch (error) {
      console.error('[DatabaseAPI] getHabitRecords failed:', error);
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

  static async undoHabitCompletion(habit_id: number, date: string): Promise<void> {
    try {
      await invoke('undo_habit_completion', {
        habitId: habit_id,
        date
      });
    } catch (error) {
      console.error('[DatabaseAPI] undoHabitCompletion failed:', error);
      throw error;
    }
  }

  static async getHabitStats(habit_id: number): Promise<{
    total_days: number;
    completed_days: number;
    current_streak: number;
    longest_streak: number;
    completion_rate: number;
  }> {
    try {
      const [total_days, completed_days, current_streak, longest_streak, completion_rate] = 
        await invoke<[number, number, number, number, number]>('get_habit_stats', { habit_id: habit_id });
      
      return {
        total_days,
        completed_days,
        current_streak,
        longest_streak,
        completion_rate: Math.round(completion_rate)
      };
    } catch (error) {
      console.error('[DatabaseAPI] getHabitStats failed:', error);
      throw error;
    }
  }
}