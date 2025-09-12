import { dbConnection } from './connection';
import { MigrationService } from './migrations';
import { PageRepository } from './repositories';

class DatabaseService {
  private static instance: DatabaseService;
  private initialized = false;
  
  public pages: PageRepository;
  public migrations: MigrationService;

  private constructor() {
    this.pages = new PageRepository();
    this.migrations = new MigrationService();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await dbConnection.initialize();
      await this.migrations.runMigrations();
      this.initialized = true;
    } catch (error) {
      console.error('数据库服务初始化失败:', error);
      throw error;
    }
  }

  async backup(backupPath: string): Promise<void> {
    await dbConnection.backup(backupPath);
  }

  async reset(): Promise<void> {
    await this.migrations.reset();
  }

  getStats() {
    return {
      connection: dbConnection.getStats(),
      pages: {
        total: 0 // this.pages.count() - placeholder
      }
      // notes: this.notes.getStatsByModule(),
      // timeline: {
      //   weather: this.timeline.getStatsByWeather(),
      //   mood: this.timeline.getStatsByMood()
      // },
      // tags: {
      //   total: this.tags.count(),
      //   popular: this.tags.getPopularTags(5),
      //   unused: this.tags.getUnusedTags().length
      // }
    };
  }

  close(): void {
    dbConnection.close();
    this.initialized = false;
  }
}

export const db = DatabaseService.getInstance();
export default db;