/**
 * 环境检测工具函数
 * 用于检测当前是否在 Tauri 应用环境中运行
 */

// 全局类型声明
declare global {
  interface Window {
    __TAURI__?: any;
    __TAURI_INTERNALS__?: any;
  }
}

let _isTauriEnvironment: boolean | null = null;

/**
 * 检测是否在 Tauri 环境中运行
 * 结果会被缓存，避免重复检测
 */
export const isTauriEnvironment = (): boolean => {
  // 如果已经检测过，直接返回缓存结果
  if (_isTauriEnvironment !== null) {
    return _isTauriEnvironment;
  }

  try {
    // 检查 Tauri 特有的全局对象
    const hasTauriAPI = typeof window !== 'undefined' &&
                       window.__TAURI__ !== undefined;

    // 检查 Tauri 运行时标识
    const hasTauriRuntime = typeof window !== 'undefined' &&
                           window.__TAURI_INTERNALS__ !== undefined;

    _isTauriEnvironment = hasTauriAPI || hasTauriRuntime;
  } catch (error) {
    // 在任何异常情况下，都认为是浏览器环境
    _isTauriEnvironment = false;
  }

  return _isTauriEnvironment;
};

/**
 * 安全地调用 Tauri API
 * 如果不在 Tauri 环境中，返回 null 而不是抛出异常
 */
export const safeTauriCall = async <T>(
  tauriApiCall: () => Promise<T>,
  fallbackValue: T | null = null
): Promise<T | null> => {
  if (!isTauriEnvironment()) {
    return fallbackValue;
  }

  try {
    return await tauriApiCall();
  } catch (error) {
    console.warn('Tauri API 调用失败:', error);
    return fallbackValue;
  }
};

/**
 * 获取环境名称（用于日志输出）
 */
export const getEnvironmentName = (): string => {
  return isTauriEnvironment() ? 'Tauri' : '浏览器';
};

/**
 * 在浏览器环境中显示功能不可用的提示
 */
export const showBrowserLimitation = (featureName: string): void => {
  if (!isTauriEnvironment()) {
    console.info(`🌐 ${featureName} 仅在 Tauri 应用中可用，当前在浏览器环境中运行`);
  }
};

/**
 * 显示环境信息横幅（开发调试用）
 */
export const showEnvironmentBanner = (): void => {
  // TODO: Implement environment banner display if needed
};