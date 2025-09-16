import { DatabaseAPI } from '@/services/api/database';

/**
 * 数据库初始化管理器
 * 使用单例模式确保数据库只初始化一次，支持懒加载以提高启动速度
 */
class DatabaseInitializer {
  private static initPromise: Promise<any> | null = null;
  private static isInitialized = false;

  /**
   * 确保数据库已初始化
   * 如果未初始化，则进行初始化；如果正在初始化，则等待完成
   * @returns Promise that resolves when database is initialized
   */
  static async ensureInitialized(): Promise<void> {
    // 如果已经初始化完成，直接返回
    if (this.isInitialized) {
      return Promise.resolve();
    }

    // 如果正在初始化，返回现有的 Promise,
    if (this.initPromise) {
      return this.initPromise;
    }

    // 🔥 使用 postMessage 或 setTimeout 将数据库初始化推迟到下个事件循环
    // 避免阻塞主渲染线程
    this.initPromise = new Promise<void>((resolve, reject) => {
      setTimeout(async () => {
        try {
          await DatabaseAPI.init();

          this.isInitialized = true;
          // Database initialized successfully
          resolve();
        } catch (error) {
          const dbStartTime = performance.now();
          const initTime = performance.now() - dbStartTime;
          console.error(
            `💾 Database initialization failed after ${initTime.toFixed(2)} ms:`,
            error
          );
          // 重置状态，允许重试
          this.initPromise = null;
          this.isInitialized = false;
          reject(error);
        }
      }, 0);
    });

    return this.initPromise;
  }

  /**
   * 重置初始化状态（用于测试或强制重新初始化）
   */
  static reset(): void {
    this.initPromise = null;
    this.isInitialized = false;
  }

  /**
   * 检查是否已初始化
   */
  static get initialized(): boolean {
    return this.isInitialized;
  }
}

export { DatabaseInitializer };
