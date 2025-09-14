/**
 * Tauri API 安全包装器
 * 提供环境检测和优雅降级的 invoke 调用
 */

import { invoke } from '@tauri-apps/api/core';
import { isTauriEnvironment, showBrowserLimitation } from './environmentUtils';

/**
 * 安全的 Tauri invoke 调用
 * 在浏览器环境中返回默认值而不是抛出异常
 */
export const safeInvoke = async <T>(
  command: string,
  args?: any,
  fallbackValue?: T,
  featureName?: string
): Promise<T | null> => {
  if (!isTauriEnvironment()) {
    if (featureName) {
      showBrowserLimitation(featureName);
    }
    return fallbackValue ?? null;
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Tauri invoke "${command}" 失败:`, error);
    return fallbackValue ?? null;
  }
};

/**
 * 用于数据库操作的安全调用
 * 提供数据库相关的默认值
 */
export const safeDbInvoke = async <T>(
  command: string,
  args?: any,
  fallbackValue?: T
): Promise<T | null> => {
  return safeInvoke(command, args, fallbackValue, '数据库功能');
};

/**
 * 用于文件系统操作的安全调用
 */
export const safeFileInvoke = async <T>(
  command: string,
  args?: any,
  fallbackValue?: T
): Promise<T | null> => {
  return safeInvoke(command, args, fallbackValue, '文件系统功能');
};

/**
 * 用于AI相关操作的安全调用
 */
export const safeAiInvoke = async <T>(
  command: string,
  args?: any,
  fallbackValue?: T
): Promise<T | null> => {
  return safeInvoke(command, args, fallbackValue, 'AI功能');
};