// 基础类型定义

// Tauri 命令返回类型
export interface TauriResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 应用模块类型
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

// 基础实体接口
export interface BaseEntity {
  id: string;
  created_at: number;
  updated_at: number;
}

// 排序和分页
export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

// 搜索选项
export interface SearchOptions {
  query: string;
  filters?: Record<string, any>;
  sort?: SortOptions;
  pagination?: PaginationOptions;
}
