/**
 * 时间格式化工具函数
 * 基于时光记Timeline的实现，统一项目中的时间处理
 */

/**
 * 格式化日期为 YYYY-MM-DD (本地时区)
 * @param date Date对象
 * @returns YYYY-MM-DD格式的字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取当前时间 HH:MM (中国时区)
 * @returns,HH:MM格式的时间字符串
 */
export function getCurrentTime(): string {
  const now = new Date();
  // 确保使用本地时区
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * 从 created_at 提取时间部分
 * @param created_at 格式: "2025-08-28 13:58:14" 或时间戳
 * @returns,HH:MM格式的时间
 */
export function extractTimeFromCreatedAt(created_at: string | number): string {
  if (typeof created_at === 'number') {
    // 如果是时间戳，先转换为本地时间
    const date = new Date(created_at);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  
  // created_at 格式: "2025-08-28,13:58:14"
  return created_at.split(' ')[1]?.substring(0, 5) || created_at;
}

/**
 * 格式化相对时间（刚刚、几分钟前等）
 * @param timestamp 时间戳（毫秒）或日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(timestamp: number | string): string {
  let actualTimestamp: number;
  
  if (typeof timestamp === 'string') {
    actualTimestamp = new Date(timestamp).getTime();
  } else {
    // 如果时间戳是秒级的，转换为毫秒级
    actualTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  }
  
  if (!actualTimestamp || actualTimestamp <= 0 || isNaN(actualTimestamp)) {
    return '未知时间';
  }
  
  const now = Date.now();
  const diff = now - actualTimestamp;
  
  if (diff < 0) {
    return '刚刚';
  }
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    // 超过7天，显示具体日期
    return formatAbsoluteTime(actualTimestamp, false);
  }
}

/**
 * 格式化绝对时间（今天、昨天、具体日期）
 * @param timestamp 时间戳（毫秒）或日期字符串
 * @param includeTime 是否包含时间
 * @returns 格式化的时间字符串
 */
export function formatAbsoluteTime(timestamp: number | string, includeTime: boolean = true): string {
  let actualTimestamp: number;
  
  if (typeof timestamp === 'string') {
    actualTimestamp = new Date(timestamp).getTime();
  } else {
    // 如果时间戳是秒级的，转换为毫秒级
    actualTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  }
  
  if (!actualTimestamp || actualTimestamp <= 0 || isNaN(actualTimestamp)) {
    return '未知时间';
  }
  
  const date = new Date(actualTimestamp);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = includeTime ? ` ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : '';
  
  if (targetDate.getTime() === today.getTime()) {
    return `今天${timeStr}`;
  } else if (targetDate.getTime() === yesterday.getTime()) {
    return `昨天${timeStr}`;
  } else if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日${timeStr}`;
  } else {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${timeStr}`;
  }
}

/**
 * 智能格式化时间（结合相对时间和绝对时间）
 * 适用于知识库页面的"最后修改"时间显示
 * @param timestamp 时间戳（毫秒）或日期字符串
 * @returns 智能格式化的时间字符串
 */
export function formatSmartTime(timestamp: number | string): string {
  let actualTimestamp: number;
  
  if (typeof timestamp === 'string') {
    actualTimestamp = new Date(timestamp).getTime();
  } else {
    // 如果时间戳是秒级的，转换为毫秒级
    actualTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  }
  
  if (!actualTimestamp || actualTimestamp <= 0 || isNaN(actualTimestamp)) {
    return '未知时间';
  }
  
  const now = Date.now();
  const diff = now - actualTimestamp;

  // 1小时内显示相对时间
  if (diff < 60 * 60 * 1000) {
    return formatRelativeTime(actualTimestamp);
  }
  
  // 超过1小时显示绝对时间
  return formatAbsoluteTime(actualTimestamp);
}

/**
 * 标准化时间戳（确保为毫秒级）
 * @param timestamp 时间戳（秒或毫秒）
 * @returns 毫秒级时间戳
 */
export function normalizeTimestamp(timestamp: number): number {
  if (!timestamp || timestamp <= 0) {
    return Date.now();
  }
  
  // 如果是秒级时间戳（小于10位数），转换为毫秒级
  return timestamp < 10000000000 ? timestamp * 1000 : timestamp;
}

/**
 * 检查时间戳是否有效
 * @param timestamp 时间戳
 * @returns 是否为有效时间戳
 */
export function isValidTimestamp(timestamp: number | string): boolean {
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  }
  
  return timestamp > 0 && timestamp < Date.now() + 365 * 24 * 60 * 60 * 1000; // 未来一年内
}


