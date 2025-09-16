import { BaseEntity } from '@/types/common/base';

// 知识库类型
export interface KnowledgeBase extends BaseEntity {
  name: string;
  icon?: string;
  description?: string | null;
}

// 页面类型
export interface Page extends BaseEntity {
  kb_id: string;
  title: string;
  parent_id?: string;
  sort_order: number;
}

// 块类型
export interface Block extends BaseEntity {
  page_id: string;
  block_type: 'paragraph' | 'heading' | 'list' | 'code' | 'image' | 'quote' | 'divider';
  content: string;
  parent_id?: string;
  order_index: number;
  data?: any;
}

// 链接类型
export interface Link extends BaseEntity {
  source_page_id: string;
  target_page_id: string;
}

// 资源类型
export interface Resource extends BaseEntity {
  knowledge_base_id: string;
  name: string;
  mime_type: string;
  size: number;
  file_path: string;
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
