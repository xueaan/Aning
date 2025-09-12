import { dbConnection } from './connection';
import { schemas, indexes, triggers } from './schema';

interface Migration {
  version: number;
  name: string;
  up: (db: any) => void;
  down?: (db: any) => void;
}

export class MigrationService {
  private db = dbConnection.getDatabase();

  constructor() {
    this.ensureMigrationTable();
  }

  private ensureMigrationTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private getCurrentVersion(): number {
    const result = this.db.prepare(
      'SELECT MAX(version) as version FROM migrations'
    ).get() as { version: number | null };
    return result.version || 0;
  }

  private recordMigration(version: number, name: string) {
    this.db.prepare(
      'INSERT INTO migrations (version, name) VALUES (?, ?)'
    ).run(version, name);
  }

  async runMigrations() {
    const currentVersion = this.getCurrentVersion();

    const migrations: Migration[] = [
      {
        version: 1,
        name: '初始化数据库结构',
        up: (db) => {
          // 创建表
          Object.values(schemas).forEach(schema => {
            db.exec(schema);
          });
          
          // 创建索引
          Object.values(indexes).forEach(index => {
            db.exec(index);
          });
          
          // 创建触发器
          Object.values(triggers).forEach(trigger => {
            db.exec(trigger);
          });
        }
      }
    ];

    // 执行未运行的迁移
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      return;
    }

    for (const migration of pendingMigrations) {
      try {
        dbConnection.transaction(() => {
          migration.up(this.db);
          this.recordMigration(migration.version, migration.name);
        });
      } catch (error) {
        console.error('Database migration failed:', error);
        throw error;
      }
    }
  }

  // 回滚迁移（可选功能）
  async rollback(targetVersion: number = 0) {
    const currentVersion = this.getCurrentVersion();
    
    if (currentVersion <= targetVersion) {
      return;
    }

    // 实现回滚逻辑...
  }

  // 重置数据库
  async reset() {
    // 删除所有表
    const tables = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    ).all() as { name: string }[];
    
    tables.forEach(table => {
      this.db.exec(`DROP TABLE IF EXISTS ${table.name}`);
    });

    // 重新运行所有迁移
    this.ensureMigrationTable();
    await this.runMigrations();
  }
}