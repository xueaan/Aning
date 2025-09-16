// 数据库表结构类型定义

// 知识库表
export interface KnowledgeBase {
  id: string;
  name: string;
  icon?: string;
  description?: string | null;
  created_at: number;
  updated_at: number;
}

// 页面表
export interface Page {
  id: string;
  kb_id: string;
  title: string;
  parent_id?: string;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

// 块表
export interface Block {
  id: string;
  page_id: string;
  block_type: 'paragraph' | 'heading' | 'list' | 'code' | 'image' | 'quote' | 'divider';
  content: string;
  parent_id?: string;
  order_index: number;
  created_at: number;
  updated_at: number;
}

// 时光记条目
export interface DBTimelineEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  content: string;
  weather?: string;
  mood?: string;
  created_at?: string;
}

// 页面链接关系
export interface Link {
  id: string;
  source_page_id: string;
  target_page_id: string;
  created_at: number;
}

// 资源表（用于存储图片、文件等）
export interface Resource {
  id: string;
  knowledge_base_id: string;
  name: string;
  mime_type: string;
  size: number;
  file_path: string;
  created_at: number;
}

// 查询选项
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

// 搜索选项
export interface SearchOptions extends QueryOptions {
  query: string;
  searchIn?: ('title' | 'content')[];
  knowledgeBaseId?: string;
  pageId?: string;
}

// 分页结果
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
