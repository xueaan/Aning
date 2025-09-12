import Database from 'better-sqlite3';
import { join } from '@tauri-apps/api/path';
import { appDataDir } from '@tauri-apps/api/path';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database | null = null;
  private dbPath: string = '';

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async initialize(): Promise<void> {
    if (this.db) return;

    try {
      // 获取应用数据目录
      const dataDir = await appDataDir();
      this.dbPath = await join(dataDir, 'database.db');

      // 创建数据库连接
      this.db = new Database(this.dbPath);
      
      // 性能优化设置
      this.db.pragma('journal_mode = WAL'); // 写前日志模式
      this.db.pragma('synchronous = NORMAL'); // 平衡性能和安全
      this.db.pragma('cache_size = 10000'); // 缓存大小
      this.db.pragma('foreign_keys = ON'); // 启用外键约束
      this.db.pragma('temp_store = MEMORY'); // 临时表存储在内存
      
    } catch (error) {
      console.error('数据库连接失败:', error);
      throw error;
    }
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('数据库未初始化，请先调用 initialize()');
    }
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // 事务处理
  transaction<T>(fn: () => T): T {
    const db = this.getDatabase();
    const transaction = db.transaction(fn);
    return transaction();
  }

  // 备份数据库
  async backup(backupPath: string): Promise<void> {
    const db = this.getDatabase();
    await db.backup(backupPath);
  }

  // 获取数据库统计信息
  getStats() {
    const db = this.getDatabase();
    return {
      memoryUsed: (db.pragma('cache_size') as any[])[0],
      pageSize: (db.pragma('page_size') as any[])[0],
      pageCount: (db.pragma('page_count') as any[])[0],
      walMode: (db.pragma('journal_mode') as any[])[0]
    };
  }
}

export const dbConnection = DatabaseConnection.getInstance();