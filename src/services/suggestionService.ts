import { invoke } from '@tauri-apps/api/core';
import {
  MentionSuggestion,
  SuggestionGroups,
  SuggestionGroup,
  ContextSearchOptions,
  DEFAULT_CONTEXT_CONFIG
} from '@/types/dialogue';
import { MentionEngine } from '@/utils/mentionEngine';
import { Task } from '@/types';

// 缓存接口
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 搜索结果缓存
class SearchCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttl: number = DEFAULT_CONTEXT_CONFIG.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 任务搜索结果接口
interface TaskSearchResult extends Task {
  project_name?: string;
  score?: number;
}

/**
 * 建议服务类
 * 负责获取和管理@提及的建议内容
 */
export class SuggestionService {
  private static instance: SuggestionService;
  private cache = new SearchCache();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  
  private constructor() {}

  static getInstance(): SuggestionService {
    if (!SuggestionService.instance) {
      SuggestionService.instance = new SuggestionService();
    }
    return SuggestionService.instance;
  }
  
  /**
   * 获取快捷提及建议
   * @param query 搜索查询
   * @returns 快捷提及数组
   */
  getShortcuts(query: string = ''): MentionSuggestion[] {
    return MentionEngine.getShortcutSuggestions(query).map((shortcut) => ({
      label: shortcut.label,
      value: shortcut.value,
      icon: shortcut.icon,
      preview: shortcut.description,
      type: 'shortcut' as const,
      metadata: {
        tokens: 20 // 快捷方式估算token数
      }
    }));
  }

  /**
   * 搜索任务
   * @param query 搜索查询
   * @param options 搜索选项
   * @returns 任务建议数组
   */
  async searchTasks(
    query: string,
    options?: ContextSearchOptions
  ): Promise<MentionSuggestion[]> {
    if (!query.trim()) {
      return this.getPendingTasks();
    }

    const cacheKey = `tasks:${query}:${JSON.stringify(options)}`;
    const cached = this.cache.get<MentionSuggestion[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const results: TaskSearchResult[] = await invoke('search_tasks', {
        query: query.trim(),
        includeCompleted: false,
        projectId: options?.taskProject,
        limit: options?.limit || DEFAULT_CONTEXT_CONFIG.SEARCH_LIMIT
      });
      
      const suggestions = results.map(task => ({
        label: task.title,
        value: `@task:${task.id}`,
        icon: this.getTaskIcon(task.status, task.priority),
        preview: task.description?.substring(0, 60) || '',
        type: 'task' as const,
        metadata: {
          status: task.status,
          priority: task.priority,
          project: task.project_name,
          due_date: task.due_date,
          score: task.score || 1,
          tokens: this.estimateTaskTokens(task)
        }
      }));
      
      // 缓存结果
      this.cache.set(cacheKey, suggestions);
      
      return suggestions;
    } catch (error) {
      console.error('搜索任务失败:', error);
      return [];
    }
  }
  
  /**
   * 获取最近编辑的页面
   * @param limit 限制数量
   * @returns 页面建议数组
   */
  
  /**
   * 获取待办任务
   * @param limit 限制数量
   * @returns 任务建议数组
   */
  private async getPendingTasks(limit: number = 10): Promise<MentionSuggestion[]> {
    const cacheKey = `pending_tasks:${limit}`;
    const cached = this.cache.get<MentionSuggestion[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const results: TaskSearchResult[] = await invoke('get_pending_tasks', { limit });
      
      const suggestions = results.map(task => ({
        label: task.title,
        value: `@task:${task.id}`,
        icon: this.getTaskIcon(task.status, task.priority),
        preview: task.due_date ? `截止: ${task.due_date}` : '待办任务',
        type: 'task' as const,
        metadata: {
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          tokens: this.estimateTaskTokens(task)
        }
      }));
      
      this.cache.set(cacheKey, suggestions, 2 * 60 * 1000); // 2分钟缓存
      return suggestions;
    } catch (error) {
      console.error('获取待办任务失败:', error);
      return [];
    }
  }
  
  /**
   * 获取组合的搜索建议
   * @param query 搜索查询
   * @param options 搜索选项
   * @returns 分组的建议结果
   */
  async getCombinedSuggestions(
    query: string,
    options?: ContextSearchOptions
  ): Promise<SuggestionGroups> {
    const groups: SuggestionGroup[] = [];
    
    // 如果查询为空或很短，优先显示快捷方式
    if (!query.trim() || query.length < 2) {
      const shortcuts = this.getShortcuts(query);
      if (shortcuts.length > 0) {
        groups.push({
          type: 'shortcuts',
          title: '快捷方式',
          icon: '⚡',
          items: shortcuts
        });
      }
      
      // 显示待办任务
      const pendingTasks = await this.getPendingTasks(5);
      
      if (pendingTasks.length > 0) {
        groups.push({
          type: 'tasks',
          title: '待办任务',
          icon: '📋',
          items: pendingTasks
        });
      }
    } else {
      // 执行搜索
      const [shortcuts, tasks] = await Promise.all([
        Promise.resolve(this.getShortcuts(query)), 
        this.searchTasks(query, options)
      ]);
      
      // 快捷方式匹配
      if (shortcuts.length > 0) {
        groups.push({
          type: 'shortcuts',
          title: '快捷方式',
          icon: '⚡',
          items: shortcuts
        });
      }
      
      // 任务结果
      if (tasks.length > 0) {
        groups.push({
          type: 'tasks',
          title: '任务',
          icon: '✅',
          items: tasks.slice(0, 8) // 限制显示数量
        });
      }
    }

    const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
    
    return {
      groups,
      total: totalItems,
      hasMore: false // TODO: 实现分页
    };
  }
  
  /**
   * 防抖搜索
   * @param query 搜索查询
   * @param callback 回调函数
   * @param delay 延迟时间
   * @param key 防抖键
   */
  debounceSearch(
    query: string,
    callback: (results: SuggestionGroups) => void,
    delay: number = DEFAULT_CONTEXT_CONFIG.DEBOUNCE_MS,
    key: string = 'default'
  ): void {
    // 清除现有的定时器
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // 设置新的定时器
    const timer = setTimeout(async () => {
      try {
        const results = await this.getCombinedSuggestions(query);
        callback(results);
      } catch (error) {
        console.error('防抖搜索失败:', error);
        callback({ groups: [], total: 0, hasMore: false });
      } finally {
        this.debounceTimers.delete(key);
      }
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }
  
  /**
   * 获取任务图标
   * @param status 任务状态
   * @param priority 任务优先级
   * @returns 图标字符串
   */
  private getTaskIcon(status: string, priority?: string): string {
    if (status === 'completed') return '✅';
    if (status === 'in_progress') return '🔄';
    if (priority === 'urgent') return '🚨';
    if (priority === 'high') return '⚡';
    return '⏳';
  }
  
  /**
   * 估算文本内容的token数量
   * @param content 文本内容
   * @returns 估算的token数
   */
  private estimateTextTokens(content: string): number {
    if (!content) return 30; // 基础元数据token
    
    // 简单的token估算：中文字符 * 1.5 + 英文单词 * 1.3
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3) + 30;
  }
  
  /**
   * 估算任务的token数量
   * @param task 任务对象
   * @returns 估算的token数
   */
  private estimateTaskTokens(task: TaskSearchResult): number {
    let tokens = 50; // 基础元数据
    
    if (task.title) {
      tokens += this.estimateTextTokens(task.title);
    }

    if (task.description) {
      tokens += this.estimateTextTokens(task.description);
    }

    return tokens;
  }
  
  /**
   * 清理缓存
   * @param pattern 可选的模式匹配
   */
  clearCache(_pattern?: string): void {
    this.cache.clear();
  }
  
  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size(),
      keys: [] // TODO: 实现键名获取
    };
  }
  
  /**
   * 取消所有防抖计时器
   */
  cancelAllDebounce(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
  
  /**
   * 销毁服务实例
   */
  destroy(): void {
    this.cancelAllDebounce();
    this.clearCache();
    SuggestionService.instance = null as any;
  }
}

// 导出单例实例
export const suggestionService = SuggestionService.getInstance();

// 导出便利方法
export const getShortcutSuggestions = (query?: string) => suggestionService.getShortcuts(query);
export const searchTasks = (query: string, options?: ContextSearchOptions) => 
  suggestionService.searchTasks(query, options);
export const getCombinedSuggestions = (query: string, options?: ContextSearchOptions) => 
  suggestionService.getCombinedSuggestions(query, options);
export const debounceSearch = (query: string, callback: (results: SuggestionGroups) => void, delay?: number, key?: string) => 
  suggestionService.debounceSearch(query, callback, delay, key);