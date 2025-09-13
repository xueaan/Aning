// 密码管理相关类型定义

export interface PasswordCategory {
  id?: number;
  name: string;
  icon: string;
  color?: string;
  created_at?: string;
}

// 别名，用于向后兼容
export type Category = PasswordCategory;

export interface PasswordEntry {
  id?: number;
  title: string;
  username?: string;
  password?: string; // 用于创建/更新时传递明文密码
  // 网站分类字段
  url?: string;           // 网站地址
  // 服务器分类字段
  ip?: string;            // 服务器IP
  // 数据库分类字段
  db_type?: string;       // 数据库类型
  db_ip?: string;         // 数据库IP
  db_username?: string;   // 数据库用户名
  // 应用分类字段
  app_name?: string;      // 应用名称
  
  category_id?: number;
  is_favorite: boolean;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

// 用于显示的密码条目（不包含明文密码）
export interface PasswordEntryDisplay {
  id?: number;
  title: string;
  username?: string;
  // 网站分类字段
  url?: string;           // 网站地址
  // 服务器分类字段
  ip?: string;            // 服务器IP
  // 数据库分类字段
  db_type?: string;       // 数据库类型
  db_ip?: string;         // 数据库IP
  db_username?: string;   // 数据库用户名
  // 应用分类字段
  app_name?: string;      // 应用名称
  
  category_id?: number;
  is_favorite: boolean;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
  category?: PasswordCategory; // 关联的分类信息
}

// 密码生成器选项
export interface PasswordGeneratorOptions {
  length: number;
  include_uppercase: boolean;
  include_lowercase: boolean;
  include_numbers: boolean;
  include_symbols: boolean;
}

// 密码强度等级
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number; // 0-100
  level: PasswordStrength;
  feedback: string[];
}

// 主密码验证请求
export interface MasterPasswordRequest {
  password: string;
  salt?: string;
}

// 密码库状态
export type VaultStatus = 'locked' | 'unlocked' | 'initializing';

// 搜索和筛选
export interface PasswordSearchFilters {
  query?: string;
  category_id?: number;
  is_favorite?: boolean;
  has_url?: boolean;
}

// 排序选项
export type PasswordSortBy = 
  | 'title' 
  | 'created_at' 
  | 'updated_at' 
  | 'last_used_at' 
  | 'category';

export type PasswordSortOrder = 'asc' | 'desc';

export interface PasswordSortOptions {
  sortBy: PasswordSortBy;
  sortOrder: PasswordSortOrder;
}

// 密码操作类型
export type PasswordActionType = 
  | 'view' 
  | 'copy_username' 
  | 'copy_password' 
  | 'edit' 
  | 'delete' 
  | 'toggle_favorite'
  | 'open_url';

// 密码导入/导出格式
export interface PasswordExportData {
  categories: PasswordCategory[];
  entries: PasswordEntry[];
  exported_at: string;
  version: string;
}

// 密码安全分析
export interface PasswordSecurityAnalysis {
  total_passwords: number;
  weak_passwords: number;
  duplicate_passwords: number;
  old_passwords: number; // 超过90天未更新
  strong_passwords: number;
  recommendations: string[];
}

// 最近使用的密码条目
export interface RecentPasswordEntry extends PasswordEntryDisplay {
  access_count: number;
  last_accessed: string;
}

// 密码分享（临时链接）
export interface PasswordShareLink {
  id: string;
  entry_id: number;
  expires_at: string;
  max_access_count: number;
  current_access_count: number;
  created_at: string;
}

// 密码备份信息
export interface PasswordBackup {
  id: string;
  filename: string;
  size: number;
  entry_count: number;
  category_count: number;
  created_at: string;
  encrypted: boolean;
}

// 密码组件状态
export interface PasswordComponentState {
  // 列表状态
  entries: PasswordEntryDisplay[];
  categories: PasswordCategory[];
  selectedCategory?: PasswordCategory;
  selectedEntry?: PasswordEntryDisplay;
  
  // UI状态
  searchQuery: string;
  filters: PasswordSearchFilters;
  sortOptions: PasswordSortOptions;
  
  // 编辑状态
  isCreating: boolean;
  isEditing: boolean;
  editingEntry?: PasswordEntryDisplay;
  
  // 密码生成器状态
  generatorOptions: PasswordGeneratorOptions;
  generatedPassword?: string;
  
  // 安全状态
  vaultStatus: VaultStatus;
  sessionId?: string;
  masterPasswordAttempts: number;
  
  // 加载状态
  isLoading: boolean;
  error?: string;
}

// 密码事件类型
export type PasswordEventType = 
  | 'entry_created'
  | 'entry_updated' 
  | 'entry_deleted'
  | 'entry_accessed'
  | 'category_created'
  | 'category_updated'
  | 'category_deleted'
  | 'vault_locked'
  | 'vault_unlocked'
  | 'password_generated'
  | 'security_check_completed';

export interface PasswordEvent {
  type: PasswordEventType;
  timestamp: string;
  data?: any;
}

// 密码历史记录（用于审计）
export interface PasswordHistoryEntry {
  id: number;
  entry_id: number;
  action: PasswordEventType;
  user_agent?: string;
  ip_address?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// API响应包装类型
export interface PasswordApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 默认值常量
export const DEFAULT_PASSWORD_GENERATOR_OPTIONS: PasswordGeneratorOptions = {
  length: 16,
  include_uppercase: true,
  include_lowercase: true,
  include_numbers: true,
  include_symbols: true
};

export const DEFAULT_SORT_OPTIONS: PasswordSortOptions = {
  sortBy: 'title',
  sortOrder: 'asc'
};

export const DEFAULT_SEARCH_FILTERS: PasswordSearchFilters = {
  query: ''
};

// 密码强度判断函数
export const getPasswordStrength = (score: number): PasswordStrengthResult => {
  let level: PasswordStrength;
  let feedback: string[] = [];
  
  if (score < 30) {
    level = 'weak';
    feedback = [
      '密码太短，建议至少8个字符', 
      '添加大写字母、数字和特殊字符', 
      '避免使用常见词汇'
    ];
  } else if (score < 60) {
    level = 'fair';
    feedback = [
      '密码强度一般', 
      '考虑增加密码长度', 
      '添加更多字符类型'
    ];
  } else if (score < 80) {
    level = 'good';
    feedback = [
      '密码强度良好',
      '可以考虑进一步增强'
    ];
  } else {
    level = 'strong';
    feedback = ['密码强度很高！'];
  }
  
  return { score, level, feedback };
};

// 密码强度颜色映射
export const PASSWORD_STRENGTH_COLORS = {
  weak: '#ef4444',     // red-500
  fair: '#f59e0b',     // amber-500
  good: '#3b82f6',     // blue-500
  strong: '#10b981',   // emerald-500
} as const;

// 默认分类图标
export const DEFAULT_CATEGORY_ICONS = {
  '网站账号': '🌐',
  '应用软件': '📱',
  '服务器': '🖥️',
  '数据库': '🗄️',
  '邮箱': '📧',
  '社交媒体': '💬',
  '金融理财': '💰',
  '其他': '🔐'
} as const;