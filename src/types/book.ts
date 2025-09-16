// 书籍状态枚举
export type BookStatus = 'wanted' | 'reading' | 'finished';

// 笔记类型枚举
export type NoteType = 'note' | 'thought' | 'summary';

// 高亮颜色枚举
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'red' | 'purple';

// 书籍接口
export interface Book {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  cover?: string;
  status: BookStatus;
  total_pages?: number;
  current_page: number;
  rating?: number;
  tags?: string[];
  description?: string;
  start_date?: number;
  finish_date?: number;
  created_at: number;
  updated_at: number;
}

// 创建书籍输入
export interface BookCreate {
  title: string;
  author?: string;
  isbn?: string;
  cover?: string;
  status?: BookStatus;
  total_pages?: number;
  current_page?: number;
  rating?: number;
  tags?: string[];
  description?: string;
}

// 更新书籍输入
export interface BookUpdate {
  title?: string;
  author?: string;
  isbn?: string;
  cover?: string;
  status?: BookStatus;
  total_pages?: number;
  current_page?: number;
  rating?: number;
  tags?: string[];
  description?: string;
  start_date?: number;
  finish_date?: number;
}

// 读书笔记接口
export interface ReadingNote {
  id: string;
  book_id: string;
  chapter?: string;
  page_number?: number;
  content: string;
  note_type: NoteType;
  created_at: number;
  updated_at: number;
}

// 创建读书笔记输入
export interface ReadingNoteCreate {
  book_id: string;
  chapter?: string;
  page_number?: number;
  content: string;
  note_type?: NoteType;
}

// 书籍高亮接口
export interface BookHighlight {
  id: string;
  book_id: string;
  note_id?: string;
  text: string;
  page_number?: number;
  color: HighlightColor;
  notes?: string;
  created_at: number;
}

// 创建书籍高亮输入
export interface BookHighlightCreate {
  book_id: string;
  note_id?: string;
  text: string;
  page_number?: number;
  color?: HighlightColor;
  notes?: string;
}

// 书籍统计接口
export interface BookStats {
  total_books: number;
  reading_books: number;
  finished_books: number;
  wanted_books: number;
  total_pages_read: number;
  total_notes: number;
  total_highlights: number;
  this_month_finished: number;
  this_year_finished: number;
}

// 书籍详情（包含笔记和高亮）
export interface BookWithDetails extends Book {
  notes?: ReadingNote[];
  highlights?: BookHighlight[];
  notes_count: number;
  highlights_count: number;
}

// 阅读进度
export interface ReadingProgress {
  book_id: string;
  percentage: number;
  pages_read: number;
  pages_total: number;
  estimated_finish_date?: number;
  daily_average?: number;
}

// 书籍筛选器
export interface BookFilters {
  status?: BookStatus | 'all';
  tags?: string[];
  rating?: number;
  search?: string;
  sort?: 'recent' | 'title' | 'author' | 'progress';
}

// 书籍显示模式
export type BookViewMode = 'grid' | 'list' | 'shelf';
