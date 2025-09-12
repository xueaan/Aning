// 基础类型定义

// 知识库系统类型
export interface KnowledgeBase {
  id: string;
  name: string;
  icon?: string;
  description?: string | null;
  created_at: number;
  updated_at: number;
}

export interface Page {
  id: string;
  kb_id: string;
  title: string;
  parent_id?: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface Block {
  id: string;
  page_id: string;
  block_type: 'paragraph' | 'heading' | 'list' | 'code' | 'image' | 'quote' | 'divider';
  content: string;
  parent_id?: string;
  order_index: number;
  created_at: number;
  updated_at: number;
  data?: any; // 添加 data 属性以兼容 BlockSuite
}

export interface Link {
  id: string;
  source_page_id: string;
  target_page_id: string;
  created_at: number;
}

export interface Resource {
  id: string;
  knowledge_base_id: string;
  name: string;
  mime_type: string;
  size: number;
  file_path: string;
  created_at: number;
}

// 兼容类型（用于保持旧的组件兼容）
export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  parent_id?: string;
  sort_order: number;
}

export interface TimelineEntry {
  id: string;
  content: string;
  created_at: string;
  converted_to_note_id?: string;
  tags?: string[];
}

// 应用状态类型
export interface AppState {
  currentKnowledgeBase?: KnowledgeBase;
  current?: Page;
  currentModule: AppModule;
  isLoading: boolean;
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export type AppModule = 
  | 'home'
  | 'editor'
  | 'knowledge' 
  | 'timeline'
  | 'cardbox'
  | 'mindboard'
  | 'taskbox'
  | 'habit'
  | 'password'
  | 'dialogue';

// Tauri 命令返回类型
export interface TauriResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 搜索结果类型
export interface SearchResult {
  type: 'page' | 'block';
  item: Page | Block;
  matches: SearchMatch[];
  score: number;
}

export interface SearchMatch {
  field: 'title' | 'content';
  text: string;
  start: number;
  length: number;
}

// 知识库管理类型
export interface KnowledgeBaseWithStats extends KnowledgeBase {
  page_count: number;
  block_count: number;
  recent_pages: Page[];
}

export interface PageWithBlocks extends Page {
  blocks: Block[];
  child_pages?: Page[];
}

export interface BlockWithChildren extends Block {
  children: Block[];
}

// 标签类型定义
export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at: number;
  updated_at: number;
}

// TaskBox 任务管理类型定义
export interface Task {
  id?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  completed_at?: string;
  project_id?: number | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskProject {
  id?: number;
  name: string;
  icon: string;
  color?: string;
  description?: string;
  task_count?: number;
  completed_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  project_id: number | null;
  due_date_range: 'today' | 'week' | 'month' | 'overdue' | 'all';
  search_query: string;
}

export type TaskViewType = 'inbox' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'project' | 'dashboard';
export type TaskDisplayMode = 'list' | 'kanban' | 'calendar';

// Habit 习惯追踪类型定义
export interface Habit {
  id?: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  target_count?: number; // 目标次数（每日/每周）
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface HabitRecord {
  id?: number;
  habit_id: number;
  date: string; // YYYY-MM-DD 格式
  completed_count: number; // 当日完成次数
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HabitStats {
  habit_id: number;
  total_days: number;
  completed_days: number;
  current_streak: number; // 当前连续天数
  longest_streak: number; // 最长连续天数
  completion_rate: number; // 完成率 0-100
  this_week_completion: number;
  this_month_completion: number;
}

export interface HabitWithStats extends Habit {
  stats?: HabitStats;
  today_record?: HabitRecord;
}

export type HabitViewType = 'list' | 'stats';

// 导出密码管理相关类型
export * from './password';

// 导出对话上下文相关类型
export * from './dialogue';

// 导出CardBox相关类型
export type { CardBox, Card, CardBoxUpdate, CardUpdate } from '../stores/cardBoxStore';