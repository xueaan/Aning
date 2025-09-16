import {
  MentionDetection,
  MENTION_PATTERNS,
  SHORTCUT_MENTIONS,
  type ShortcutMention,
} from '@/types/dialogue';

// 提及类型
export type MentionType = 'shortcut' | 'task' | 'tasks' | 'page' | 'pages' | 'kb' | 'unknown';

// 提及解析结果
export interface ParsedMention {
  type: MentionType;
  value: string;
  args?: string[];
  isValid: boolean;
  error?: string;
}

// 提及替换结果
export interface MentionReplacement {
  original: string;
  replacement: string;
  displayText: string;
  start: number;
  end: number;
}

/**
 * 提及检测和处理引擎
 */
export class MentionEngine {
  /**
   * 检测文本中的@提及
   * @param text 输入文本
   * @param cursorPosition 光标位置（可选）
   * @returns 检测结果，如果未找到则返回null
   */
  static detectMention(text: string, cursorPosition?: number): MentionDetection | null {
    // 如果提供了光标位置，只检查光标附近的内容
    let searchText = text;
    let offset = 0;

    if (cursorPosition !== undefined) {
      // 从光标位置向前查找，最多查找100个字符
      const startPos = Math.max(0, cursorPosition - 100);
      searchText = text.substring(startPos, cursorPosition + 1);
      offset = startPos;
    }

    // 使用正则表达式查找@提及模式
    const regex = MENTION_PATTERNS.MENTION_REGEX;
    regex.lastIndex = 0; // 重置正则表达式状态

    let match;
    let bestMatch = null;

    // 查找所有匹配项，选择最近的一个
    while ((match = regex.exec(searchText)) !== null) {
      const start = match.index + offset;
      const end = start + match[0].length;

      // 如果有光标位置，只关心光标位置附近的匹配
      if (
        cursorPosition !== undefined &&
        (start > cursorPosition || end < cursorPosition - (match[1]?.length || 0))
      ) {
        continue;
      }

      bestMatch = {
        start,
        end,
        query: match[1] || '',
        fullMatch: match[0],
      };

      // 如果找到当前光标位置的匹配，直接返回
      if (cursorPosition !== undefined && start <= cursorPosition && cursorPosition <= end) {
        break;
      }
    }

    return bestMatch;
  }

  /**
   * 解析@提及字符串，确定类型和值
   * @param mention 提及字符串（如 "@today" 或 "@page:页面标题"）
   * @returns 解析结果
   */
  static parseMention(mention: string): ParsedMention {
    // 移除@符号
    const content = mention.startsWith('@') ? mention.slice(1) : mention;

    if (!content) {
      return {
        type: 'unknown',
        value: '',
        isValid: false,
        error: '提及内容为空',
      };
    }

    // 检查是否是快捷方式
    const shortcut = SHORTCUT_MENTIONS.find(
      (s) => s.trigger === content || s.aliases?.includes(content)
    );
    if (shortcut) {
      return {
        type: 'shortcut',
        value: shortcut.value,
        isValid: true,
      };
    }

    // 检查是否是页面引用 (@page:页面ID 或 @page:页面标题)
    if (content.startsWith('page:')) {
      const pageRef = content.slice(5);
      return {
        type: 'page',
        value: pageRef,
        isValid: pageRef.length > 0,
        error: pageRef.length === 0 ? '页面引用为空' : undefined,
      };
    }

    // 检查是否是任务引用 (@task:任务ID)
    if (content.startsWith('task:')) {
      const taskRef = content.slice(5);
      return {
        type: 'task',
        value: taskRef,
        isValid: taskRef.length > 0,
        error: taskRef.length === 0 ? '任务引用为空' : undefined,
      };
    }

    // 检查是否是复数形式的引用
    if (content === 'tasks' || content === '任务' || content === '今日任务') {
      return {
        type: 'tasks',
        value: 'today',
        isValid: true,
      };
    }

    if (content === 'pages' || content === '页面' || content === '所有页面') {
      return {
        type: 'pages',
        value: 'all',
        isValid: true,
      };
    }

    // 检查是否是知识库引用 (@kb:知识库名称)
    if (content.startsWith('kb:')) {
      const kbRef = content.slice(3);
      return {
        type: 'kb',
        value: kbRef,
        isValid: kbRef.length > 0,
        error: kbRef.length === 0 ? '知识库引用为空' : undefined,
      };
    }

    // 其他情况作为普通查询处理
    return {
      type: 'unknown',
      value: content,
      isValid: content.length > 0,
      error: content.length === 0 ? '查询内容为空' : undefined,
    };
  }

  /**
   * 替换文本中的@提及为实际内容
   * @param text 原始文本
   * @param replacements 替换映射
   * @returns 替换后的文本和替换详情
   */
  static replaceMentions(
    text: string,
    replacements: Record<string, string>
  ): {
    text: string;
    replacements: MentionReplacement[];
  } {
    const resultReplacements: MentionReplacement[] = [];
    let resultText = text;
    let offset = 0;

    const regex = MENTION_PATTERNS.MENTION_REGEX;
    regex.lastIndex = 0;

    let match;
    while ((match = regex.exec(text)) !== null) {
      const original = match[0];
      const key = match[1] || '';

      if (replacements[key]) {
        const replacement = replacements[key];
        const start = match.index + offset;
        const end = start + original.length;

        // 记录替换信息
        resultReplacements.push({
          original,
          replacement,
          displayText: replacement,
          start,
          end: start + replacement.length,
        });

        // 执行替换
        resultText = resultText.substring(0, start) + replacement + resultText.substring(end);
        offset += replacement.length - original.length;
      }
    }

    return {
      text: resultText,
      replacements: resultReplacements,
    };
  }

  /**
   * 验证提及是否有效
   * @param mention 提及字符串
   * @returns 验证结果
   */
  static validateMention(mention: string): boolean {
    const parsed = this.parseMention(mention);
    return parsed.isValid;
  }

  /**
   * 获取提及的显示文本
   * @param mention 提及字符串
   * @returns 显示文本
   */
  static getDisplayText(mention: string): string {
    const parsed = this.parseMention(mention);

    switch (parsed.type) {
      case 'shortcut':
        const shortcut = SHORTCUT_MENTIONS.find((s) => s.value === parsed.value);
        return shortcut?.label || mention;
      case 'page':
        return `页面: ${parsed.value}`;
      case 'task':
        return `任务: ${parsed.value}`;
      case 'tasks':
        return '今日任务';
      case 'pages':
        return '所有页面';
      case 'kb':
        return `知识库: ${parsed.value}`;
      default:
        return mention;
    }
  }

  /**
   * 提取文本中的所有@提及
   * @param text 文本内容
   * @returns 提及列表
   */
  static extractMentions(text: string): string[] {
    const mentions: string[] = [];
    const regex = MENTION_PATTERNS.MENTION_REGEX;
    regex.lastIndex = 0;

    let match;
    while ((match = regex.exec(text)) !== null) {
      mentions.push(match[0]);
    }

    return mentions;
  }

  /**
   * 检查文本是否包含@提及
   * @param text 文本内容
   * @returns 是否包含提及
   */
  static hasMentions(text: string): boolean {
    return MENTION_PATTERNS.MENTION_REGEX.test(text);
  }

  /**
   * 获取快捷方式建议
   * @param query 搜索查询
   * @returns 快捷方式列表
   */
  static getShortcutSuggestions(query: string = ''): ShortcutMention[] {
    const lowerQuery = query.toLowerCase();

    if (!lowerQuery) {
      return SHORTCUT_MENTIONS;
    }

    return SHORTCUT_MENTIONS.filter(
      (shortcut) =>
        shortcut.trigger.toLowerCase().includes(lowerQuery) ||
        shortcut.label.toLowerCase().includes(lowerQuery) ||
        shortcut.aliases?.some((alias) => alias.toLowerCase().includes(lowerQuery))
    );
  }
}
