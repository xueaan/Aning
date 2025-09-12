use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// 新的数据模型定义
#[derive(Debug, Serialize, Deserialize)]
pub struct KnowledgeBase {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub description: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Page {
    pub id: String,
    pub kb_id: String,
    pub title: String,
    pub content: Option<String>,
    pub parent_id: Option<String>,
    pub sort_order: f64,
    pub is_deleted: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub page_id: String,
    #[serde(rename = "block_type")]
    pub r#type: String,  // type 是 Rust 关键字，需要 raw identifier
    pub content: String,
    pub data: String,    // JSON string
    pub parent_id: Option<String>,
    #[serde(rename = "order_index")]
    pub sort_order: f64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PageLink {
    pub source_id: String,
    pub target_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Resource {
    pub id: String,
    pub page_id: String,
    pub block_id: Option<String>,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: i64,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PageVersion {
    pub id: String,
    pub page_id: String,
    pub content: String,
    pub version: i32,
    pub created_at: i64,
    pub created_by: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Attachment {
    pub id: String,
    pub page_id: String,
    pub block_id: Option<String>,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub file_size: i64,
    pub uploaded_at: i64,
}

// 保留旧的 Note 结构用于向后兼容（如果需要）
#[derive(Debug, Serialize, Deserialize)]
pub struct Note {
    pub id: Option<i64>,
    pub title: String,
    pub content: String,
    pub module: String,
    pub folder_id: Option<i64>,
    pub parent_id: Option<i64>,
    pub level: i64,
    pub sort_order: i64,
    pub is_expanded: bool,
    pub knowledge_base_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Folder {
    pub id: Option<i64>,
    pub name: String,
    pub icon: String,
    pub color: Option<String>,
    pub module: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineEntry {
    pub id: Option<i64>,
    pub date: String,
    pub time: String,
    pub content: String,
    pub weather: Option<String>,
    pub mood: Option<String>,
    pub timestamp: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Tag {
    pub id: Option<i64>,
    pub name: String,
    pub color: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AiConversation {
    pub id: String,
    pub title: String,
    pub provider: String,
    pub model: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AiMessage {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub error: bool,
    pub timestamp: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordCategory {
    pub id: Option<i64>,
    pub name: String,
    pub icon: String,
    pub color: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordEntry {
    pub id: Option<i64>,
    pub title: String,
    pub username: Option<String>,
    pub password_encrypted: String,
    pub url: Option<String>,
    pub notes: Option<String>,
    // 服务器相关字段
    pub ip: Option<String>,
    // 数据库相关字段
    pub db_type: Option<String>,
    pub db_ip: Option<String>,
    pub db_username: Option<String>,
    // 应用相关字段
    pub app_name: Option<String>,
    pub category_id: Option<i64>,
    pub tags: Option<String>,
    pub is_favorite: bool,
    pub last_used_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub id: Option<i64>,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub completed_at: Option<String>,
    pub project_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskProject {
    pub id: Option<i64>,
    pub name: String,
    pub icon: String,
    pub color: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct Habit {
    pub id: Option<i64>,
    pub name: String,
    pub description: Option<String>,
    pub icon: String,
    pub color: String,
    pub frequency: String,
    pub target_count: i64,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HabitRecord {
    pub id: Option<i64>,
    pub habit_id: i64,
    pub date: String,
    pub completed_count: i64,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}


// AI提供商配置
#[derive(Debug, Serialize, Deserialize)]
pub struct AiProvider {
    pub id: Option<i64>,
    pub provider: String,    // 'deepseek' | 'claude' | etc
    pub api_key: String,     // 加密存储
    pub base_url: Option<String>,
    pub model: String,
    pub temperature: f64,
    pub max_tokens: i32,
    pub system_prompt: Option<String>,
    pub enabled: i32,        // 0 or 1
    pub is_current: i32,     // 0 or 1, 是否为当前选中的提供商
    pub created_at: String,
    pub updated_at: String,
}

// AI智能体配置
#[derive(Debug, Serialize, Deserialize)]
pub struct AiAgent {
    pub id: Option<i64>,
    pub agent_id: String,    // 智能体唯一ID
    pub name: String,
    pub description: String,
    pub icon: String,
    pub system_prompt: String,
    pub temperature: f64,
    pub max_tokens: i32,
    pub provider: Option<String>,  // 可选绑定的提供商
    pub model: Option<String>,     // 可选绑定的模型
    pub is_builtin: i32,     // 0 or 1, 是否为内置智能体
    pub is_current: i32,     // 0 or 1, 是否为当前选中的智能体
    pub created_at: String,
    pub updated_at: String,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    // 提供访问数据库连接的公开方法
    pub fn with_connection<T, F>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> Result<T, rusqlite::Error>,
    {
        let conn = self.conn.lock().map_err(|e| format!("Database lock error: {}", e))?;
        f(&*conn).map_err(|e| format!("Database operation error: {}", e))
    }

    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        // 获取应用数据目录
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| rusqlite::Error::InvalidPath(PathBuf::from(e.to_string())))?;
        
        // 确保目录存在
        if !app_dir.exists() {
            std::fs::create_dir_all(&app_dir)
                .map_err(|e| rusqlite::Error::InvalidPath(PathBuf::from(e.to_string())))?;
        }
        
        // 数据库文件路径
        let db_path = app_dir.join("database.db");
        
        // 创建数据库连接
        let conn = Connection::open(db_path)?;
        
        // 启用外键约束和 WAL 模式
        conn.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA cache_size = 10000;
             PRAGMA temp_store = MEMORY;"
        )?;
        
        let db = Database {
            conn: Mutex::new(conn),
        };
        
        // 初始化表结构
        db.init_tables()?;
        
        Ok(db)
    }
    
    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // 直接删除旧的知识库相关表
        self.drop_legacy_tables(&conn)?;
        
        // 创建新的知识库表结构
        self.create_knowledge_tables(&conn)?;
        
        // 创建卡片盒表结构
        self.create_cardbox_tables(&conn)?;
        
        
        // 创建其他表（保持不变）
        self.create_other_tables(&conn)?;
        
        Ok(())
    }
    
    fn drop_legacy_tables(&self, conn: &Connection) -> Result<()> {
        // 只删除旧的笔记系统表，保留新的知识库系统表
        conn.execute("DROP TABLE IF EXISTS note_tags", [])?;
        conn.execute("DROP TABLE IF EXISTS folders", [])?;
        conn.execute("DROP TABLE IF EXISTS notes", [])?;
        
        println!("✅ 已删除旧的笔记系统表结构");
        Ok(())
    }
    
    fn create_knowledge_tables(&self, conn: &Connection) -> Result<()> {
        // 创建新的知识库表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS knowledge_bases (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT DEFAULT '📚',
                description TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;
        
        // 创建页面表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS pages (
                id TEXT PRIMARY KEY,
                kb_id TEXT NOT NULL,
                title TEXT,
                content TEXT,
                parent_id TEXT,
                sort_order REAL,
                is_deleted BOOLEAN DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (kb_id) REFERENCES knowledge_bases(id)
            )",
            [],
        )?;
        
        // 检查并添加 is_deleted 列（如果不存在）
        let has_is_deleted = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('pages') WHERE name = 'is_deleted'",
            [],
            |row| row.get::<_, i32>(0)
        ).unwrap_or(0) > 0;
        
        if !has_is_deleted {
            conn.execute("ALTER TABLE pages ADD COLUMN is_deleted BOOLEAN DEFAULT 0", [])?;
            println!("✅ 已为 pages 表添加 is_deleted 列");
        }
        
        // 创建块表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS blocks (
                id TEXT PRIMARY KEY,
                page_id TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                data TEXT,
                parent_id TEXT,
                sort_order REAL,
                is_deleted BOOLEAN DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // 检查并添加 is_deleted 列（如果不存在）
        let blocks_has_is_deleted = conn.query_row(
            "SELECT COUNT(*) FROM pragma_table_info('blocks') WHERE name = 'is_deleted'",
            [],
            |row| row.get::<_, i32>(0)
        ).unwrap_or(0) > 0;
        
        if !blocks_has_is_deleted {
            conn.execute("ALTER TABLE blocks ADD COLUMN is_deleted BOOLEAN DEFAULT 0", [])?;
            println!("✅ 已为 blocks 表添加 is_deleted 列");
        }
        
        // 创建全文搜索索引（检查是否已存在）
        let search_index_exists = conn.query_row(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='search_index'",
            [],
            |_| Ok(true)
        ).unwrap_or(false);
        
        if !search_index_exists {
            conn.execute(
                "CREATE VIRTUAL TABLE search_index USING fts5(
                    id UNINDEXED,
                    type UNINDEXED,
                    title,
                    content,
                    tokenize = 'unicode61'
                )",
                [],
            )?;
        }
        
        // 创建页面链接表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS page_links (
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                PRIMARY KEY (source_id, target_id),
                FOREIGN KEY (source_id) REFERENCES pages(id),
                FOREIGN KEY (target_id) REFERENCES pages(id)
            )",
            [],
        )?;
        
        // 创建资源表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS resources (
                id TEXT PRIMARY KEY,
                page_id TEXT NOT NULL,
                block_id TEXT,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 创建页面版本表（用于 Editor.js 版本管理）
        conn.execute(
            "CREATE TABLE IF NOT EXISTS page_versions (
                id TEXT PRIMARY KEY,
                page_id TEXT NOT NULL,
                content TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                created_at INTEGER NOT NULL,
                created_by TEXT,
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // 创建索引
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pages_kb ON pages(kb_id, is_deleted)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pages_parent ON pages(parent_id) WHERE parent_id IS NOT NULL", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pages_updated ON pages(updated_at DESC)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_blocks_parent ON blocks(parent_id) WHERE parent_id IS NOT NULL", [])?;
        
        // 创建正确的触发器 - 使用整数时间戳
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_knowledge_bases_timestamp 
             AFTER UPDATE ON knowledge_bases
             FOR EACH ROW
             BEGIN
                UPDATE knowledge_bases SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
             END",
            [],
        )?;
        
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_pages_timestamp 
             AFTER UPDATE ON pages
             FOR EACH ROW
             BEGIN
                UPDATE pages SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
             END",
            [],
        )?;
        
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_blocks_timestamp 
             AFTER UPDATE ON blocks
             FOR EACH ROW
             BEGIN
                UPDATE blocks SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
             END",
            [],
        )?;
        
        println!("✅ 已创建新的知识库表结构");
        Ok(())
    }
    
    fn create_cardbox_tables(&self, conn: &Connection) -> Result<()> {
        // 创建卡片盒表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS card_boxes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT,
                icon TEXT,
                cards_count INTEGER DEFAULT 0,
                sort_order REAL,
                created_at INTEGER,
                updated_at INTEGER
            )",
            [],
        )?;

        // 创建卡片表  
        conn.execute(
            "CREATE TABLE IF NOT EXISTS cards (
                id TEXT PRIMARY KEY,
                box_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT,
                preview TEXT,
                color TEXT,
                tags TEXT,
                is_pinned INTEGER DEFAULT 0,
                is_archived INTEGER DEFAULT 0,
                sort_order REAL,
                created_at INTEGER,
                updated_at INTEGER,
                FOREIGN KEY (box_id) REFERENCES card_boxes(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 创建卡片链接表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS card_links (
                id TEXT PRIMARY KEY,
                source_card_id TEXT NOT NULL,
                target_card_id TEXT NOT NULL,
                link_type TEXT DEFAULT 'related',
                created_at INTEGER,
                UNIQUE(source_card_id, target_card_id),
                FOREIGN KEY (source_card_id) REFERENCES cards(id) ON DELETE CASCADE,
                FOREIGN KEY (target_card_id) REFERENCES cards(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // 创建卡片全文搜索虚拟表
        conn.execute(
            "CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
                card_id,
                title,
                content,
                preview,
                tokenize='unicode61'
            )",
            [],
        )?;

        // 创建索引
        conn.execute("CREATE INDEX IF NOT EXISTS idx_card_boxes_created ON card_boxes(created_at DESC)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_card_boxes_sort ON card_boxes(sort_order)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cards_box ON cards(box_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cards_created ON cards(created_at DESC)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cards_updated ON cards(updated_at DESC)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cards_pinned ON cards(is_pinned, sort_order)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_cards_archived ON cards(is_archived)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_card_links_source ON card_links(source_card_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_card_links_target ON card_links(target_card_id)", [])?;

        // 创建触发器
        
        // 卡片盒更新时间触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_card_boxes_timestamp 
             AFTER UPDATE ON card_boxes
             FOR EACH ROW
             BEGIN
               UPDATE card_boxes SET updated_at = (strftime('%s', 'now') * 1000) WHERE id = NEW.id;
             END",
            [],
        )?;

        // 卡片更新时间触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_cards_timestamp 
             AFTER UPDATE ON cards
             FOR EACH ROW
             BEGIN
               UPDATE cards SET updated_at = (strftime('%s', 'now') * 1000) WHERE id = NEW.id;
             END",
            [],
        )?;

        // 卡片计数更新 - 插入
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_box_count_insert 
             AFTER INSERT ON cards
             FOR EACH ROW
             BEGIN
               UPDATE card_boxes 
               SET cards_count = cards_count + 1,
                   updated_at = (strftime('%s', 'now') * 1000)
               WHERE id = NEW.box_id;
             END",
            [],
        )?;

        // 卡片计数更新 - 删除
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_box_count_delete 
             AFTER DELETE ON cards
             FOR EACH ROW
             BEGIN
               UPDATE card_boxes 
               SET cards_count = cards_count - 1,
                   updated_at = (strftime('%s', 'now') * 1000)
               WHERE id = OLD.box_id;
             END",
            [],
        )?;

        // 卡片移动时更新计数
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_box_count_move 
             AFTER UPDATE OF box_id ON cards
             FOR EACH ROW
             WHEN OLD.box_id != NEW.box_id
             BEGIN
               UPDATE card_boxes 
               SET cards_count = cards_count - 1,
                   updated_at = (strftime('%s', 'now') * 1000)
               WHERE id = OLD.box_id;
               
               UPDATE card_boxes 
               SET cards_count = cards_count + 1,
                   updated_at = (strftime('%s', 'now') * 1000)
               WHERE id = NEW.box_id;
             END",
            [],
        )?;

        // 卡片全文搜索同步 - 插入
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS cards_fts_insert 
             AFTER INSERT ON cards
             FOR EACH ROW
             BEGIN
               INSERT INTO cards_fts(card_id, title, content, preview) 
               VALUES (NEW.id, NEW.title, NEW.content, NEW.preview);
             END",
            [],
        )?;

        // 卡片全文搜索同步 - 更新
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS cards_fts_update 
             AFTER UPDATE ON cards
             FOR EACH ROW
             BEGIN
               UPDATE cards_fts 
               SET title = NEW.title, content = NEW.content, preview = NEW.preview 
               WHERE card_id = NEW.id;
             END",
            [],
        )?;

        // 卡片全文搜索同步 - 删除
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS cards_fts_delete 
             AFTER DELETE ON cards
             FOR EACH ROW
             BEGIN
               DELETE FROM cards_fts WHERE card_id = OLD.id;
             END",
            [],
        )?;

        println!("✅ 已创建卡片盒表结构");
        Ok(())
    }
    
    
    fn create_other_tables(&self, conn: &Connection) -> Result<()> {
        
        // 创建标签表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                color TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // 创建页面标签关联表（适用于新的知识库系统）
        conn.execute(
            "CREATE TABLE IF NOT EXISTS page_tags (
                page_id TEXT NOT NULL,
                tag_id INTEGER NOT NULL,
                PRIMARY KEY (page_id, tag_id),
                FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // 创建时光记条目表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS timeline_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                content TEXT NOT NULL,
                weather TEXT,
                mood TEXT,
                timestamp BIGINT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // 创建页面链接关系表（适用于新的知识库系统）
        conn.execute(
            "CREATE TABLE IF NOT EXISTS page_relations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_page_id TEXT NOT NULL,
                target_page_id TEXT NOT NULL,
                relation_type TEXT DEFAULT 'link',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (source_page_id) REFERENCES pages(id) ON DELETE CASCADE,
                FOREIGN KEY (target_page_id) REFERENCES pages(id) ON DELETE CASCADE,
                UNIQUE(source_page_id, target_page_id)
            )",
            [],
        )?;
        
        // 创建AI对话表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS ai_conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                provider TEXT NOT NULL CHECK(provider IN ('deepseek', 'claude')),
                model TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // 创建AI消息表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS ai_messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
                content TEXT NOT NULL,
                provider TEXT,
                model TEXT,
                error INTEGER DEFAULT 0,
                timestamp BIGINT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // 创建密码设置表（存储盐值等安全配置）
        conn.execute(
            "CREATE TABLE IF NOT EXISTS password_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                master_password_salt TEXT NOT NULL,
                test_encrypted_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // 数据库迁移：检查并添加缺失的列
        // 检查 password_settings 表是否有 test_encrypted_data 列
        let column_exists = conn.query_row(
            "PRAGMA table_info(password_settings)",
            [],
            |_| Ok(true),
        ).is_ok() && {
            let mut stmt = conn.prepare("PRAGMA table_info(password_settings)")?;
            let column_iter = stmt.query_map([], |row| {
                let column_name: String = row.get(1)?;
                Ok(column_name)
            })?;
            
            let mut has_test_data_column = false;
            for column in column_iter {
                if let Ok(name) = column {
                    if name == "test_encrypted_data" {
                        has_test_data_column = true;
                        break;
                    }
                }
            }
            has_test_data_column
        };
        
        // 如果缺少 test_encrypted_data 列，则添加它
        if !column_exists {
            conn.execute(
                "ALTER TABLE password_settings ADD COLUMN test_encrypted_data TEXT",
                [],
            )?;
        }
        
        // 创建密码分类表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS password_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                icon TEXT DEFAULT '🔐',
                color TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        // 创建密码条目表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS password_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                username TEXT,
                password_encrypted TEXT NOT NULL,
                url TEXT,
                notes TEXT,
                -- 服务器相关字段
                ip TEXT,
                -- 数据库相关字段
                db_type TEXT,
                db_ip TEXT,
                db_username TEXT,
                -- 应用相关字段
                app_name TEXT,
                category_id INTEGER,
                tags TEXT,
                is_favorite INTEGER DEFAULT 0,
                last_used_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES password_categories(id) ON DELETE SET NULL
            )",
            [],
        )?;
        
        // 密码表字段迁移：添加新的专用字段
        // 检查并添加缺失的列
        let add_column_if_not_exists = |column_name: &str, column_def: &str| -> Result<(), rusqlite::Error> {
            // 先检查列是否存在
            let mut exists = false;
            let mut stmt = conn.prepare("PRAGMA table_info(password_entries)")?;
            let rows = stmt.query_map([], |row| {
                let name: String = row.get(1)?;
                Ok(name)
            })?;
            
            for row_result in rows {
                if let Ok(name) = row_result {
                    if name == column_name {
                        exists = true;
                        break;
                    }
                }
            }
            
            if !exists {
                println!("Adding column {} to password_entries table", column_name);
                conn.execute(&format!("ALTER TABLE password_entries ADD COLUMN {}", column_def), [])?;
            }
            Ok(())
        };
        
        // 添加新字段
        add_column_if_not_exists("ip", "ip TEXT")?;
        add_column_if_not_exists("db_type", "db_type TEXT")?;
        add_column_if_not_exists("db_ip", "db_ip TEXT")?;
        add_column_if_not_exists("db_username", "db_username TEXT")?;
        add_column_if_not_exists("app_name", "app_name TEXT")?;
        
        // 密码分类迁移：精简为4个核心分类
        // 首先检查是否需要迁移（如果存在旧分类则进行清理）
        let old_categories_exist: i32 = conn.query_row(
            "SELECT COUNT(*) FROM password_categories WHERE name IN ('邮箱', '社交媒体', '金融理财', '其他', '网站账号')",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        if old_categories_exist > 0 {
            println!("Found old categories, performing migration to 4 core categories...");
            
            // 先将所有密码条目的分类设置为NULL（未分类状态）
            conn.execute("UPDATE password_entries SET category_id = NULL", [])?;
            
            // 删除所有旧分类
            conn.execute("DELETE FROM password_categories", [])?;
        }
        
        // 插入4个核心分类（使用INSERT OR IGNORE确保不重复插入）
        conn.execute_batch(
            "INSERT OR IGNORE INTO password_categories (name, icon, color) VALUES
                ('网站', 'BrowserChrome', '#10B981'),
                ('应用软件', 'AllApplication', '#3B82F6'),
                ('服务器', 'CodeComputer', '#F59E0B'),
                ('数据库', 'DataLock', '#8B5CF6');"
        )?;
        
        if old_categories_exist > 0 {
            println!("Migration completed: Updated to 4 core categories");
        }

        // 创建任务项目表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS task_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT DEFAULT '📋',
                color TEXT,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // 创建任务表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL CHECK(status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
                priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
                due_date TEXT,
                completed_at DATETIME,
                project_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                deleted_at DATETIME,
                FOREIGN KEY (project_id) REFERENCES task_projects(id) ON DELETE SET NULL
            )",
            [],
        )?;

        // 创建习惯表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS habits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT NOT NULL DEFAULT '✅',
                color TEXT NOT NULL DEFAULT '#3B82F6',
                frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
                target_count INTEGER NOT NULL DEFAULT 1,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // 创建习惯记录表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS habit_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                habit_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                completed_count INTEGER NOT NULL DEFAULT 1,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
                UNIQUE(habit_id, date)
            )",
            [],
        )?;


        // 创建AI提供商配置表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS ai_providers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider TEXT NOT NULL UNIQUE,
                api_key TEXT NOT NULL,
                base_url TEXT,
                model TEXT NOT NULL,
                temperature REAL NOT NULL DEFAULT 0.7,
                max_tokens INTEGER NOT NULL DEFAULT 2000,
                system_prompt TEXT,
                enabled INTEGER NOT NULL DEFAULT 1,
                is_current INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CHECK (is_current IN (0, 1)),
                CHECK (enabled IN (0, 1))
            )",
            [],
        )?;

        // 创建AI智能体配置表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS ai_agents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT NOT NULL DEFAULT '🤖',
                system_prompt TEXT NOT NULL,
                temperature REAL NOT NULL DEFAULT 0.7,
                max_tokens INTEGER NOT NULL DEFAULT 2000,
                provider TEXT,
                model TEXT,
                is_builtin INTEGER NOT NULL DEFAULT 0,
                is_current INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                CHECK (is_builtin IN (0, 1)),
                CHECK (is_current IN (0, 1))
            )",
            [],
        )?;

        // 创建索引
        conn.execute_batch(
            "CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_entries(date DESC);
             CREATE INDEX IF NOT EXISTS idx_timeline_datetime ON timeline_entries(date DESC, time DESC);
             CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
             CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at DESC);
             CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON ai_conversations(created_at DESC);
             CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, timestamp);
             CREATE INDEX IF NOT EXISTS idx_ai_messages_timestamp ON ai_messages(timestamp DESC);
             CREATE INDEX IF NOT EXISTS idx_password_entries_title ON password_entries(title);
             CREATE INDEX IF NOT EXISTS idx_password_entries_category ON password_entries(category_id);
             CREATE INDEX IF NOT EXISTS idx_password_entries_created ON password_entries(created_at DESC);
             CREATE INDEX IF NOT EXISTS idx_password_entries_updated ON password_entries(updated_at DESC);
             CREATE INDEX IF NOT EXISTS idx_password_entries_last_used ON password_entries(last_used_at DESC);
             CREATE INDEX IF NOT EXISTS idx_password_entries_favorite ON password_entries(is_favorite);
             CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
             CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
             CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
             CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
             CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
             CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at DESC);
             CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);
             CREATE INDEX IF NOT EXISTS idx_task_projects_name ON task_projects(name);
             CREATE INDEX IF NOT EXISTS idx_ai_providers_provider ON ai_providers(provider);
             CREATE INDEX IF NOT EXISTS idx_ai_providers_enabled ON ai_providers(enabled);
             CREATE INDEX IF NOT EXISTS idx_ai_providers_current ON ai_providers(is_current);
             CREATE INDEX IF NOT EXISTS idx_ai_agents_agent_id ON ai_agents(agent_id);
             CREATE INDEX IF NOT EXISTS idx_ai_agents_builtin ON ai_agents(is_builtin);
             CREATE INDEX IF NOT EXISTS idx_ai_agents_current ON ai_agents(is_current);
             CREATE INDEX IF NOT EXISTS idx_ai_agents_created ON ai_agents(created_at DESC);
             CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);
             CREATE INDEX IF NOT EXISTS idx_habits_frequency ON habits(frequency);
             CREATE INDEX IF NOT EXISTS idx_habits_created ON habits(created_at DESC);
             CREATE INDEX IF NOT EXISTS idx_habits_updated ON habits(updated_at DESC);
             CREATE INDEX IF NOT EXISTS idx_habit_records_habit ON habit_records(habit_id);
             CREATE INDEX IF NOT EXISTS idx_habit_records_date ON habit_records(date DESC);
             CREATE INDEX IF NOT EXISTS idx_habit_records_habit_date ON habit_records(habit_id, date DESC);
             CREATE INDEX IF NOT EXISTS idx_habit_records_created ON habit_records(created_at DESC);"
        )?;
        
        // 旧的 notes 表触发器已删除，使用新的知识库系统
        
        // AI对话表的更新触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_ai_conversations_timestamp 
             AFTER UPDATE ON ai_conversations
             FOR EACH ROW
             BEGIN
                UPDATE ai_conversations SET updated_at = DATETIME('now') WHERE id = NEW.id;
             END",
            [],
        )?;
        
        // 当消息添加到对话时，更新对话的updated_at
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_conversation_on_new_message
             AFTER INSERT ON ai_messages
             FOR EACH ROW
             BEGIN
                UPDATE ai_conversations SET updated_at = DATETIME('now') WHERE id = NEW.conversation_id;
             END",
            [],
        )?;
        
        // 密码条目表的更新触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_password_entries_timestamp 
             AFTER UPDATE ON password_entries
             FOR EACH ROW
             BEGIN
                UPDATE password_entries SET updated_at = DATETIME('now') WHERE id = NEW.id;
             END",
            [],
        )?;
        
        // 任务表的更新触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
             AFTER UPDATE ON tasks
             FOR EACH ROW
             BEGIN
                UPDATE tasks SET updated_at = DATETIME('now') WHERE id = NEW.id;
             END",
            [],
        )?;

        // 习惯表的更新触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_habits_timestamp 
             AFTER UPDATE ON habits
             FOR EACH ROW
             BEGIN
                UPDATE habits SET updated_at = DATETIME('now') WHERE id = NEW.id;
             END",
            [],
        )?;

        // 习惯记录表的更新触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_habit_records_timestamp 
             AFTER UPDATE ON habit_records
             FOR EACH ROW
             BEGIN
                UPDATE habit_records SET updated_at = DATETIME('now') WHERE id = NEW.id;
             END",
            [],
        )?;
        
        // 任务项目表的更新触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_task_projects_timestamp 
             AFTER UPDATE ON task_projects
             FOR EACH ROW
             BEGIN
                UPDATE task_projects SET updated_at = DATETIME('now') WHERE id = NEW.id;
             END",
            [],
        )?;
        

        // AI提供商表的更新触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_ai_providers_timestamp 
             AFTER UPDATE ON ai_providers
             FOR EACH ROW
             BEGIN
                UPDATE ai_providers SET updated_at = DATETIME('now') WHERE id = NEW.id;
             END",
            [],
        )?;

        // AI智能体表的更新触发器
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS update_ai_agents_timestamp 
             AFTER UPDATE ON ai_agents
             FOR EACH ROW
             BEGIN
                UPDATE ai_agents SET updated_at = DATETIME('now') WHERE id = NEW.id;
             END",
            [],
        )?;
        
        Ok(())
    }
    
    // 旧的迁移函数和笔记系统已删除，使用新的知识库系统
    
    // ====== 新的知识库系统 ======
    
    // 生成 UUID
    fn generate_uuid() -> String {
        Uuid::new_v4().to_string()
    }
    
    // 获取当前时间戳
    fn current_timestamp() -> i64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64
    }
    
    // 时光记相关操作
    pub fn create_timeline_entry(
        &self,
        date: &str,
        time: &str,
        content: &str,
        weather: Option<&str>,
        mood: Option<&str>,
        timestamp: Option<i64>,
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        
        let ts = timestamp.unwrap_or_else(|| {
            chrono::Local::now().timestamp_millis()
        });
        
        // 使用本地时间创建 created_at 字段
        let local_datetime = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        conn.execute(
            "INSERT INTO timeline_entries (date, time, content, weather, mood, timestamp, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![date, time, content, weather, mood, ts, local_datetime],
        )?;
        
        Ok(conn.last_insert_rowid())
    }
    
    pub fn get_timeline_entries_by_date(&self, date: &str) -> Result<Vec<TimelineEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, date, time, content, weather, mood, timestamp, created_at 
             FROM timeline_entries 
             WHERE date = ?1 
             ORDER BY timestamp DESC"
        )?;
        
        let entries_iter = stmt.query_map([date], |row| {
            Ok(TimelineEntry {
                id: Some(row.get(0)?),
                date: row.get(1)?,
                time: row.get(2)?,
                content: row.get(3)?,
                weather: row.get(4)?,
                mood: row.get(5)?,
                timestamp: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;
        
        let mut entries = Vec::new();
        for entry in entries_iter {
            entries.push(entry?);
        }
        Ok(entries)
    }
    
    pub fn get_recent_timeline_entries(&self, limit: i32) -> Result<Vec<TimelineEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, date, time, content, weather, mood, timestamp, created_at 
             FROM timeline_entries 
             ORDER BY timestamp DESC 
             LIMIT ?1"
        )?;
        
        let entries_iter = stmt.query_map([limit], |row| {
            Ok(TimelineEntry {
                id: Some(row.get(0)?),
                date: row.get(1)?,
                time: row.get(2)?,
                content: row.get(3)?,
                weather: row.get(4)?,
                mood: row.get(5)?,
                timestamp: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;
        
        let mut entries = Vec::new();
        for entry in entries_iter {
            entries.push(entry?);
        }
        Ok(entries)
    }
    
    pub fn delete_timeline_entry(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM timeline_entries WHERE id = ?1", params![id])?;
        Ok(())
    }
    
    // AI对话相关操作
    pub fn save_ai_conversation(&self, conversation: &AiConversation) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO ai_conversations (id, title, provider, model, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                conversation.id,
                conversation.title,
                conversation.provider,
                conversation.model,
                conversation.created_at,
                conversation.updated_at
            ],
        )?;
        Ok(())
    }
    
    pub fn save_ai_message(&self, message: &AiMessage) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO ai_messages (id, conversation_id, role, content, provider, model, error, timestamp, created_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                message.id,
                message.conversation_id,
                message.role,
                message.content,
                message.provider,
                message.model,
                if message.error { 1 } else { 0 },
                message.timestamp,
                message.created_at
            ],
        )?;
        Ok(())
    }
    
    pub fn get_ai_conversations(&self, limit: Option<i32>) -> Result<Vec<AiConversation>> {
        let conn = self.conn.lock().unwrap();
        let sql = if let Some(limit) = limit {
            format!(
                "SELECT id, title, provider, model, created_at, updated_at 
                 FROM ai_conversations 
                 ORDER BY updated_at DESC 
                 LIMIT {}", 
                limit
            )
        } else {
            "SELECT id, title, provider, model, created_at, updated_at 
             FROM ai_conversations 
             ORDER BY updated_at DESC".to_string()
        };
        
        let mut stmt = conn.prepare(&sql)?;
        let conversations_iter = stmt.query_map([], |row| {
            Ok(AiConversation {
                id: row.get(0)?,
                title: row.get(1)?,
                provider: row.get(2)?,
                model: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;
        
        let mut conversations = Vec::new();
        for conversation in conversations_iter {
            conversations.push(conversation?);
        }
        Ok(conversations)
    }
    
    pub fn get_ai_messages(&self, conversation_id: &str) -> Result<Vec<AiMessage>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, conversation_id, role, content, provider, model, error, timestamp, created_at 
             FROM ai_messages 
             WHERE conversation_id = ?1 
             ORDER BY timestamp ASC"
        )?;
        
        let messages_iter = stmt.query_map([conversation_id], |row| {
            Ok(AiMessage {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                provider: row.get(4)?,
                model: row.get(5)?,
                error: row.get::<_, i32>(6)? != 0,
                timestamp: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;
        
        let mut messages = Vec::new();
        for message in messages_iter {
            messages.push(message?);
        }
        Ok(messages)
    }
    
    pub fn delete_ai_conversation(&self, conversation_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM ai_conversations WHERE id = ?1",
            params![conversation_id],
        )?;
        Ok(())
    }
    
    pub fn update_ai_conversation_title(&self, conversation_id: &str, title: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE ai_conversations SET title = ?1, updated_at = DATETIME('now') WHERE id = ?2",
            params![title, conversation_id],
        )?;
        Ok(())
    }
    
    pub fn search_ai_conversations(&self, query: &str, limit: Option<i32>) -> Result<Vec<AiConversation>> {
        let conn = self.conn.lock().unwrap();
        let sql = if let Some(limit) = limit {
            format!(
                "SELECT DISTINCT c.id, c.title, c.provider, c.model, c.created_at, c.updated_at
                 FROM ai_conversations c
                 LEFT JOIN ai_messages m ON c.id = m.conversation_id
                 WHERE c.title LIKE '%{}%' OR m.content LIKE '%{}%'
                 ORDER BY c.updated_at DESC 
                 LIMIT {}", 
                query, query, limit
            )
        } else {
            format!(
                "SELECT DISTINCT c.id, c.title, c.provider, c.model, c.created_at, c.updated_at
                 FROM ai_conversations c
                 LEFT JOIN ai_messages m ON c.id = m.conversation_id
                 WHERE c.title LIKE '%{}%' OR m.content LIKE '%{}%'
                 ORDER BY c.updated_at DESC", 
                query, query
            )
        };
        
        let mut stmt = conn.prepare(&sql)?;
        let conversations_iter = stmt.query_map([], |row| {
            Ok(AiConversation {
                id: row.get(0)?,
                title: row.get(1)?,
                provider: row.get(2)?,
                model: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;
        
        let mut conversations = Vec::new();
        for conversation in conversations_iter {
            conversations.push(conversation?);
        }
        Ok(conversations)
    }
    
    pub fn cleanup_old_ai_conversations(&self, days_to_keep: i32) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        let cutoff_date = format!("datetime('now', '-{} days')", days_to_keep);
        let count = conn.execute(
            &format!("DELETE FROM ai_conversations WHERE updated_at < {}", cutoff_date),
            [],
        )?;
        Ok(count)
    }

    // AI提供商配置相关方法
    pub fn save_ai_provider(&self, provider: &AiProvider) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // 如果设置为当前提供商，先清除其他提供商的当前状态
        if provider.is_current == 1 {
            conn.execute(
                "UPDATE ai_providers SET is_current = 0 WHERE provider != ?1",
                params![provider.provider],
            )?;
        }
        
        conn.execute(
            "INSERT OR REPLACE INTO ai_providers 
             (id, provider, api_key, base_url, model, temperature, max_tokens, system_prompt, enabled, is_current) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                provider.id,
                provider.provider,
                provider.api_key,
                provider.base_url,
                provider.model,
                provider.temperature,
                provider.max_tokens,
                provider.system_prompt,
                provider.enabled,
                provider.is_current
            ],
        )?;
        
        Ok(())
    }

    pub fn get_ai_providers(&self) -> Result<Vec<AiProvider>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, provider, api_key, base_url, model, temperature, max_tokens, system_prompt, enabled, is_current, created_at, updated_at 
             FROM ai_providers 
             ORDER BY provider"
        )?;
        
        let providers_iter = stmt.query_map([], |row| {
            Ok(AiProvider {
                id: row.get(0)?,
                provider: row.get(1)?,
                api_key: row.get(2)?,
                base_url: row.get(3)?,
                model: row.get(4)?,
                temperature: row.get(5)?,
                max_tokens: row.get(6)?,
                system_prompt: row.get(7)?,
                enabled: row.get(8)?,
                is_current: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;

        let mut providers = Vec::new();
        for provider in providers_iter {
            providers.push(provider?);
        }
        
        Ok(providers)
    }

    pub fn get_ai_provider(&self, provider_name: &str) -> Result<Option<AiProvider>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, provider, api_key, base_url, model, temperature, max_tokens, system_prompt, enabled, is_current, created_at, updated_at 
             FROM ai_providers 
             WHERE provider = ?1"
        )?;
        
        let result = stmt.query_row([provider_name], |row| {
            Ok(AiProvider {
                id: row.get(0)?,
                provider: row.get(1)?,
                api_key: row.get(2)?,
                base_url: row.get(3)?,
                model: row.get(4)?,
                temperature: row.get(5)?,
                max_tokens: row.get(6)?,
                system_prompt: row.get(7)?,
                enabled: row.get(8)?,
                is_current: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        });

        match result {
            Ok(provider) => Ok(Some(provider)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn delete_ai_provider(&self, provider_name: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM ai_providers WHERE provider = ?1",
            params![provider_name],
        )?;
        Ok(())
    }

    pub fn set_current_ai_provider(&self, provider_name: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // 先清除所有提供商的当前状态
        conn.execute("UPDATE ai_providers SET is_current = 0", [])?;
        
        // 设置指定提供商为当前
        conn.execute(
            "UPDATE ai_providers SET is_current = 1 WHERE provider = ?1",
            params![provider_name],
        )?;
        
        Ok(())
    }

    // AI智能体配置相关方法
    pub fn save_ai_agent(&self, agent: &AiAgent) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // 如果设置为当前智能体，先清除其他智能体的当前状态
        if agent.is_current == 1 {
            conn.execute(
                "UPDATE ai_agents SET is_current = 0 WHERE agent_id != ?1",
                params![agent.agent_id],
            )?;
        }
        
        conn.execute(
            "INSERT OR REPLACE INTO ai_agents 
             (id, agent_id, name, description, icon, system_prompt, temperature, max_tokens, provider, model, is_builtin, is_current) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                agent.id,
                agent.agent_id,
                agent.name,
                agent.description,
                agent.icon,
                agent.system_prompt,
                agent.temperature,
                agent.max_tokens,
                agent.provider,
                agent.model,
                agent.is_builtin,
                agent.is_current
            ],
        )?;
        
        Ok(())
    }

    pub fn get_ai_agents(&self) -> Result<Vec<AiAgent>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, agent_id, name, description, icon, system_prompt, temperature, max_tokens, provider, model, is_builtin, is_current, created_at, updated_at 
             FROM ai_agents 
             ORDER BY is_builtin DESC, created_at ASC"
        )?;
        
        let agents_iter = stmt.query_map([], |row| {
            Ok(AiAgent {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                icon: row.get(4)?,
                system_prompt: row.get(5)?,
                temperature: row.get(6)?,
                max_tokens: row.get(7)?,
                provider: row.get(8)?,
                model: row.get(9)?,
                is_builtin: row.get(10)?,
                is_current: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;

        let mut agents = Vec::new();
        for agent in agents_iter {
            agents.push(agent?);
        }
        
        Ok(agents)
    }

    pub fn get_ai_agent(&self, agent_id: &str) -> Result<Option<AiAgent>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, agent_id, name, description, icon, system_prompt, temperature, max_tokens, provider, model, is_builtin, is_current, created_at, updated_at 
             FROM ai_agents 
             WHERE agent_id = ?1"
        )?;
        
        let result = stmt.query_row([agent_id], |row| {
            Ok(AiAgent {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                icon: row.get(4)?,
                system_prompt: row.get(5)?,
                temperature: row.get(6)?,
                max_tokens: row.get(7)?,
                provider: row.get(8)?,
                model: row.get(9)?,
                is_builtin: row.get(10)?,
                is_current: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        });

        match result {
            Ok(agent) => Ok(Some(agent)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    pub fn delete_ai_agent(&self, agent_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // 不能删除内置智能体
        let is_builtin: i32 = conn.query_row(
            "SELECT is_builtin FROM ai_agents WHERE agent_id = ?1",
            params![agent_id],
            |row| row.get(0),
        )?;
        
        if is_builtin == 1 {
            return Err(rusqlite::Error::InvalidColumnType(0, "Cannot delete builtin agent".to_string(), rusqlite::types::Type::Text));
        }
        
        conn.execute(
            "DELETE FROM ai_agents WHERE agent_id = ?1",
            params![agent_id],
        )?;
        Ok(())
    }

    pub fn set_current_ai_agent(&self, agent_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // 先清除所有智能体的当前状态
        conn.execute("UPDATE ai_agents SET is_current = 0", [])?;
        
        // 设置指定智能体为当前
        conn.execute(
            "UPDATE ai_agents SET is_current = 1 WHERE agent_id = ?1",
            params![agent_id],
        )?;
        
        Ok(())
    }
    
    // 创建知识库
    pub fn create_knowledge_base(&self, name: &str, icon: &str, description: Option<&str>) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = Self::generate_uuid();
        let now = Self::current_timestamp();
        
        conn.execute(
            "INSERT INTO knowledge_bases (id, name, icon, description, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, name, icon, description, now, now],
        )?;
        
        Ok(id)
    }

    // 获取所有知识库
    pub fn get_knowledge_bases(&self) -> Result<Vec<KnowledgeBase>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, description, created_at, updated_at 
             FROM knowledge_bases 
             ORDER BY created_at DESC"
        )?;

        let kb_iter = stmt.query_map([], |row| {
            Ok(KnowledgeBase {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                description: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;

        let mut knowledge_bases = Vec::new();
        for kb in kb_iter {
            knowledge_bases.push(kb?);
        }
        Ok(knowledge_bases)
    }

    // 删除知识库
    pub fn delete_knowledge_base(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // 先删除所有关联的页面（包括已标记删除的）
        // 这会通过级联删除自动删除相关的 blocks、resources、page_versions 等
        conn.execute(
            "DELETE FROM pages WHERE kb_id = ?1",
            params![id],
        )?;
        
        // 然后删除知识库
        conn.execute(
            "DELETE FROM knowledge_bases WHERE id = ?1",
            params![id],
        )?;
        
        Ok(())
    }
    
    // 创建页面
    pub fn create_page(&self, kb_id: &str, title: &str, parent_id: Option<&str>) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = Self::generate_uuid();
        let now = Self::current_timestamp();
        
        // 计算排序顺序
        let sort_order = if let Some(parent) = parent_id {
            // 子页面：获取最大排序号 + 1
            conn.query_row(
                "SELECT COALESCE(MAX(sort_order), 0) + 1.0 FROM pages WHERE parent_id = ?1",
                params![parent],
                |row| row.get::<_, f64>(0)
            )?
        } else {
            // 根页面：获取最大排序号 + 1
            conn.query_row(
                "SELECT COALESCE(MAX(sort_order), 0) + 1.0 FROM pages WHERE kb_id = ?1 AND parent_id IS NULL",
                params![kb_id],
                |row| row.get::<_, f64>(0)
            )?
        };
        
        conn.execute(
            "INSERT INTO pages (id, kb_id, title, parent_id, sort_order, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![id, kb_id, title, parent_id, sort_order, now, now],
        )?;
        
        Ok(id)
    }
    
    // 获取页面树
    #[allow(dead_code)]
    pub fn get_page_tree(&self, kb_id: &str) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "WITH RECURSIVE page_tree AS (
                SELECT id, kb_id, title, parent_id, sort_order, is_deleted, created_at, updated_at
                FROM pages 
                WHERE kb_id = ?1 AND parent_id IS NULL AND is_deleted = 0
                
                UNION ALL
                
                SELECT p.id, p.kb_id, p.title, p.parent_id, p.sort_order, p.is_deleted, p.created_at, p.updated_at
                FROM pages p
                INNER JOIN page_tree pt ON p.parent_id = pt.id
                WHERE p.is_deleted = 0
            )
            SELECT * FROM page_tree ORDER BY sort_order"
        )?;

        let page_iter = stmt.query_map([kb_id], |row| {
            Ok(Page {
                id: row.get(0)?,
                kb_id: row.get(1)?,
                title: row.get(2)?,
                content: None,
                parent_id: row.get(3)?,
                sort_order: row.get(4)?,
                is_deleted: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut pages = Vec::new();
        for page in page_iter {
            pages.push(page?);
        }
        Ok(pages)
    }
    
    // 创建块
    pub fn create_block(&self, page_id: &str, block_type: &str, content: &str, data: &str, parent_id: Option<&str>) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = Self::generate_uuid();
        let now = Self::current_timestamp();
        
        // 计算排序顺序
        let sort_order = if let Some(parent) = parent_id {
            conn.query_row(
                "SELECT COALESCE(MAX(sort_order), 0) + 1.0 FROM blocks WHERE parent_id = ?1",
                params![parent],
                |row| row.get::<_, f64>(0)
            )?
        } else {
            conn.query_row(
                "SELECT COALESCE(MAX(sort_order), 0) + 1.0 FROM blocks WHERE page_id = ?1 AND parent_id IS NULL",
                params![page_id],
                |row| row.get::<_, f64>(0)
            )?
        };
        
        conn.execute(
            "INSERT INTO blocks (id, page_id, type, content, data, parent_id, sort_order, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, page_id, block_type, content, data, parent_id, sort_order, now, now],
        )?;
        
        // 更新搜索索引
        conn.execute(
            "INSERT INTO search_index (id, type, title, content) VALUES (?1, 'block', '', ?2)",
            params![id, content],
        )?;
        
        Ok(id)
    }
    
    // 获取页面的所有块
    #[allow(dead_code)]
    pub fn get_page_blocks(&self, page_id: &str) -> Result<Vec<Block>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, page_id, type, content, data, parent_id, sort_order, created_at, updated_at 
             FROM blocks 
             WHERE page_id = ?1 
             ORDER BY sort_order"
        )?;

        let block_iter = stmt.query_map([page_id], |row| {
            Ok(Block {
                id: row.get(0)?,
                page_id: row.get(1)?,
                r#type: row.get(2)?,
                content: row.get(3)?,
                data: row.get(4)?,
                parent_id: row.get(5)?,
                sort_order: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut blocks = Vec::new();
        for block in block_iter {
            blocks.push(block?);
        }
        Ok(blocks)
    }
    
    // 搜索内容
    #[allow(dead_code)]
    pub fn search_content(&self, kb_id: &str, query: &str) -> Result<Vec<serde_json::Value>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT si.id, si.type, si.title, snippet(search_index, 3, '<b>', '</b>', '...', 32) as snippet
             FROM search_index si
             WHERE search_index MATCH ?1
             AND (
                 si.type = 'page' OR 
                 si.id IN (SELECT b.id FROM blocks b JOIN pages p ON b.page_id = p.id WHERE p.kb_id = ?2)
             )
             ORDER BY rank
             LIMIT 20"
        )?;

        let result_iter = stmt.query_map(params![query, kb_id], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "type": row.get::<_, String>(1)?,
                "title": row.get::<_, Option<String>>(2)?,
                "snippet": row.get::<_, String>(3)?
            }))
        })?;

        let mut results = Vec::new();
        for result in result_iter {
            results.push(result?);
        }
        Ok(results)
    }
    
    // 获取数据库统计信息
    pub fn get_stats(&self) -> Result<serde_json::Value> {
        let conn = self.conn.lock().unwrap();
        
        // 统计知识库相关表的记录数
        let kb_count: i32 = conn.query_row("SELECT COUNT(*) FROM knowledge_bases", [], |row| row.get(0))?;
        let page_count: i32 = conn.query_row("SELECT COUNT(*) FROM pages", [], |row| row.get(0))?;
        let block_count: i32 = conn.query_row("SELECT COUNT(*) FROM blocks", [], |row| row.get(0))?;
        
        // 统计标签数
        let tag_count: i32 = conn.query_row("SELECT COUNT(*) FROM tags", [], |row| row.get(0))?;
        
        // 统计时光记数
        let timeline_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM timeline_entries",
            [],
            |row| row.get(0),
        )?;
        
        // 直接获取数据库路径，避免死锁
        let db_path = conn.query_row("PRAGMA database_list", [], |row| {
            row.get::<_, String>(2)
        }).unwrap_or_else(|_| String::from("未知"));
        
        Ok(serde_json::json!({
            "knowledge_bases": kb_count,
            "pages": page_count,
            "blocks": block_count,
            "tags": tag_count,
            "timeline_entries": timeline_count,
            "database_path": db_path
        }))
    }
    
    pub fn get_db_path(&self) -> String {
        // 返回数据库路径供前端显示
        if let Ok(conn) = self.conn.lock() {
            if let Ok(path) = conn.query_row("PRAGMA database_list", [], |row| {
                row.get::<_, String>(2)
            }) {
                return path;
            }
        }
        String::from("未知")
    }
    
    

    // ===== Task Management CRUD 操作 =====

    // Task CRUD operations
    pub fn create_task(
        &self, 
        title: &str, 
        description: Option<&str>, 
        status: &str, 
        priority: &str,
        due_date: Option<&str>,
        project_id: Option<i64>
    ) -> Result<i64> {
        println!("[Database] create_task called with:");
        println!("  title: {}", title);
        println!("  description: {:?}", description);
        println!("  status: {}", status);
        println!("  priority: {}", priority);
        println!("  due_date: {:?}", due_date);
        println!("  due_date is_some: {}", due_date.is_some());
        println!("  due_date is_empty: {}", due_date.map_or(false, |s| s.is_empty()));
        println!("  project_id: {:?}", project_id);
        
        let conn = self.conn.lock().unwrap();
        let sql = "INSERT INTO tasks (title, description, status, priority, due_date, project_id)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6)";
        println!("[Database] Executing SQL: {}", sql);
        println!("[Database] With params: [{}, {:?}, {}, {}, {:?}, {:?}]", 
                 title, description, status, priority, due_date, project_id);
        
        let result = conn.execute(sql, params![title, description, status, priority, due_date, project_id]);
        
        match result {
            Ok(rows_affected) => {
                let id = conn.last_insert_rowid();
                println!("[Database] create_task success: {} rows affected, id: {}", rows_affected, id);
                Ok(id)
            },
            Err(e) => {
                println!("[Database] create_task SQL error: {}", e);
                Err(e.into())
            }
        }
    }

    pub fn get_all_tasks(&self) -> Result<Vec<Task>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, status, priority, due_date, completed_at, project_id, 
                    created_at, updated_at, deleted_at
             FROM tasks 
             WHERE deleted_at IS NULL 
             ORDER BY created_at DESC"
        )?;

        let task_iter = stmt.query_map([], |row| {
            Ok(Task {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                completed_at: row.get(6)?,
                project_id: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                deleted_at: row.get(10)?,
            })
        })?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task?);
        }
        Ok(tasks)
    }

    pub fn get_tasks_by_status(&self, status: &str) -> Result<Vec<Task>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, status, priority, due_date, completed_at, project_id, 
                    created_at, updated_at, deleted_at
             FROM tasks 
             WHERE status = ?1 AND deleted_at IS NULL 
             ORDER BY created_at DESC"
        )?;

        let task_iter = stmt.query_map(params![status], |row| {
            Ok(Task {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                completed_at: row.get(6)?,
                project_id: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                deleted_at: row.get(10)?,
            })
        })?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task?);
        }
        Ok(tasks)
    }

    pub fn get_tasks_by_project(&self, project_id: i64) -> Result<Vec<Task>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, status, priority, due_date, completed_at, project_id, 
                    created_at, updated_at, deleted_at
             FROM tasks 
             WHERE project_id = ?1 AND deleted_at IS NULL 
             ORDER BY created_at DESC"
        )?;

        let task_iter = stmt.query_map(params![project_id], |row| {
            Ok(Task {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                completed_at: row.get(6)?,
                project_id: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                deleted_at: row.get(10)?,
            })
        })?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task?);
        }
        Ok(tasks)
    }

    pub fn get_tasks_by_date_range(&self, start_date: Option<&str>, end_date: Option<&str>) -> Result<Vec<Task>> {
        let conn = self.conn.lock().unwrap();
        let (query, params): (&str, Vec<&str>) = match (start_date, end_date) {
            (Some(start), Some(end)) => (
                "SELECT id, title, description, status, priority, due_date, completed_at, project_id, 
                        created_at, updated_at, deleted_at
                 FROM tasks 
                 WHERE due_date >= ?1 AND due_date <= ?2 AND deleted_at IS NULL 
                 ORDER BY due_date ASC",
                vec![start, end]
            ),
            (Some(start), None) => (
                "SELECT id, title, description, status, priority, due_date, completed_at, project_id, 
                        created_at, updated_at, deleted_at
                 FROM tasks 
                 WHERE due_date >= ?1 AND deleted_at IS NULL 
                 ORDER BY due_date ASC",
                vec![start]
            ),
            (None, Some(end)) => (
                "SELECT id, title, description, status, priority, due_date, completed_at, project_id, 
                        created_at, updated_at, deleted_at
                 FROM tasks 
                 WHERE due_date <= ?1 AND deleted_at IS NULL 
                 ORDER BY due_date ASC",
                vec![end]
            ),
            (None, None) => {
                return self.get_all_tasks();
            }
        };

        let mut stmt = conn.prepare(query)?;
        let task_iter = stmt.query_map(rusqlite::params_from_iter(params), |row| {
            Ok(Task {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                completed_at: row.get(6)?,
                project_id: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                deleted_at: row.get(10)?,
            })
        })?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task?);
        }
        Ok(tasks)
    }

    pub fn update_task(
        &self, 
        id: i64, 
        title: Option<&str>, 
        description: Option<&str>, 
        status: Option<&str>, 
        priority: Option<&str>,
        due_date: Option<&str>,
        completed_at: Option<&str>,
        project_id: Option<i64>
    ) -> Result<()> {
        println!("[Database] update_task called with:");
        println!("  id: {}", id);
        println!("  title: {:?}", title);
        println!("  description: {:?}", description);
        println!("  status: {:?}", status);
        println!("  priority: {:?}", priority);
        println!("  due_date: {:?}", due_date);
        println!("  due_date is_some: {}", due_date.is_some());
        println!("  due_date is_empty: {}", due_date.map_or(false, |s| s.is_empty()));
        println!("  completed_at: {:?}", completed_at);
        println!("  project_id: {:?}", project_id);
        
        let conn = self.conn.lock().unwrap();
        
        // Build dynamic update query
        let mut updates = Vec::new();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        // Add fields to update if provided
        if let Some(title_val) = title {
            println!("[Database] Adding title update: {}", title_val);
            updates.push("title = ?");
            params.push(Box::new(title_val.to_string()));
        }
        if let Some(desc_val) = description {
            println!("[Database] Adding description update: {:?}", desc_val);
            updates.push("description = ?");
            params.push(Box::new(desc_val.to_string()));
        }
        if let Some(status_val) = status {
            println!("[Database] Adding status update: {}", status_val);
            updates.push("status = ?");
            params.push(Box::new(status_val.to_string()));
        }
        if let Some(priority_val) = priority {
            println!("[Database] Adding priority update: {}", priority_val);
            updates.push("priority = ?");
            params.push(Box::new(priority_val.to_string()));
        }
        
        // Handle due_date specially - we need to distinguish between:
        // 1. None = don't update (field not provided)
        // 2. Some("") = clear the field (set to NULL)
        // 3. Some(value) = set to value
        if due_date.is_some() {
            let due_val = due_date.unwrap();
            println!("[Database] Processing due_date update: '{}'", due_val);
            println!("[Database] due_date is_empty: {}", due_val.is_empty());
            
            updates.push("due_date = ?");
            if due_val.is_empty() {
                println!("[Database] Setting due_date to NULL (empty string)");
                params.push(Box::new(None::<String>)); // Set to NULL
            } else {
                println!("[Database] Setting due_date to: '{}'", due_val);
                params.push(Box::new(due_val.to_string()));
            }
        } else {
            println!("[Database] due_date is None, not updating");
        }
        
        if let Some(completed_val) = completed_at {
            println!("[Database] Adding completed_at update: {}", completed_val);
            updates.push("completed_at = ?");
            if completed_val.is_empty() {
                params.push(Box::new(None::<String>)); // Set to NULL
            } else {
                params.push(Box::new(completed_val.to_string()));
            }
        }
        if project_id.is_some() {
            println!("[Database] Adding project_id update: {:?}", project_id);
            updates.push("project_id = ?");
            params.push(Box::new(project_id));
        }
        
        // Always update the updated_at timestamp
        updates.push("updated_at = DATETIME('now')");
        
        // Add the id parameter for WHERE clause
        params.push(Box::new(id));
        
        println!("[Database] Update fields: {:?}", updates);
        println!("[Database] Params count: {}", params.len());
        
        // Execute the update if we have fields to update
        if updates.len() > 1 { // > 1 because we always have updated_at
            let query = format!("UPDATE tasks SET {} WHERE id = ?", updates.join(", "));
            println!("[Database] Executing SQL: {}", query);
            
            // Convert Vec<Box<dyn ToSql>> to Vec<&dyn ToSql>
            let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
            
            let result = conn.execute(&query, param_refs.as_slice());
            
            match &result {
                Ok(rows_affected) => println!("[Database] update_task success: {} rows affected", rows_affected),
                Err(e) => println!("[Database] update_task SQL error: {}", e),
            }
            
            result?;
        } else {
            println!("[Database] No fields to update (only timestamp)");
        }
        
        println!("[Database] update_task completed successfully");
        Ok(())
    }

    pub fn delete_task(&self, id: i64, soft: bool) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        if soft {
            conn.execute(
                "UPDATE tasks SET deleted_at = DATETIME('now') WHERE id = ?1",
                params![id],
            )?;
        } else {
            conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
        }
        Ok(())
    }

    pub fn search_tasks(&self, query: &str) -> Result<Vec<Task>> {
        let conn = self.conn.lock().unwrap();
        let search_pattern = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, title, description, status, priority, due_date, completed_at, project_id, 
                    created_at, updated_at, deleted_at
             FROM tasks 
             WHERE (title LIKE ?1 OR description LIKE ?1) AND deleted_at IS NULL 
             ORDER BY 
                CASE WHEN title LIKE ?1 THEN 1 ELSE 2 END,
                created_at DESC"
        )?;

        let task_iter = stmt.query_map(params![search_pattern], |row| {
            Ok(Task {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                completed_at: row.get(6)?,
                project_id: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                deleted_at: row.get(10)?,
            })
        })?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task?);
        }
        Ok(tasks)
    }

    // TaskProject CRUD operations
    pub fn create_task_project(
        &self, 
        name: &str, 
        icon: &str, 
        color: Option<&str>, 
        description: Option<&str>
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO task_projects (name, icon, color, description)
             VALUES (?1, ?2, ?3, ?4)",
            params![name, icon, color, description],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_all_task_projects(&self) -> Result<Vec<TaskProject>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, color, description, created_at, updated_at
             FROM task_projects 
             ORDER BY created_at DESC"
        )?;

        let project_iter = stmt.query_map([], |row| {
            Ok(TaskProject {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        let mut projects = Vec::new();
        for project in project_iter {
            projects.push(project?);
        }
        Ok(projects)
    }

    pub fn update_task_project(
        &self, 
        id: i64, 
        name: Option<&str>, 
        icon: Option<&str>, 
        color: Option<&str>, 
        description: Option<&str>
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        if let Some(name_val) = name {
            conn.execute("UPDATE task_projects SET name = ?1 WHERE id = ?2", params![name_val, id])?;
        }
        if let Some(icon_val) = icon {
            conn.execute("UPDATE task_projects SET icon = ?1 WHERE id = ?2", params![icon_val, id])?;
        }
        if let Some(color_val) = color {
            conn.execute("UPDATE task_projects SET color = ?1 WHERE id = ?2", params![color_val, id])?;
        }
        if let Some(desc_val) = description {
            conn.execute("UPDATE task_projects SET description = ?1 WHERE id = ?2", params![desc_val, id])?;
        }
        
        Ok(())
    }

    pub fn delete_task_project(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // First, set project_id to NULL for all tasks in this project
        conn.execute(
            "UPDATE tasks SET project_id = NULL WHERE project_id = ?1",
            params![id],
        )?;
        
        // Then delete the project
        conn.execute("DELETE FROM task_projects WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_task_project_by_id(&self, id: i64) -> Result<Option<TaskProject>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, color, description, created_at, updated_at
             FROM task_projects 
             WHERE id = ?1"
        )?;

        let mut project_iter = stmt.query_map(params![id], |row| {
            Ok(TaskProject {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                description: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        match project_iter.next() {
            Some(project) => Ok(Some(project?)),
            None => Ok(None),
        }
    }

    pub fn get_task_project_stats(&self, project_id: i64) -> Result<(i32, i32, i32)> {
        let conn = self.conn.lock().unwrap();
        
        // 获取项目的总任务数
        let total_tasks: i32 = conn.query_row(
            "SELECT COUNT(*) FROM tasks WHERE project_id = ?1 AND deleted_at IS NULL",
            params![project_id],
            |row| row.get(0),
        )?;
        
        // 获取已完成任务数
        let completed_tasks: i32 = conn.query_row(
            "SELECT COUNT(*) FROM tasks WHERE project_id = ?1 AND status = 'completed' AND deleted_at IS NULL",
            params![project_id],
            |row| row.get(0),
        )?;
        
        // 获取逾期任务数
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let overdue_tasks: i32 = conn.query_row(
            "SELECT COUNT(*) FROM tasks WHERE project_id = ?1 AND due_date < ?2 AND status != 'completed' AND deleted_at IS NULL",
            params![project_id, today],
            |row| row.get(0),
        )?;
        
        Ok((total_tasks, completed_tasks, overdue_tasks))
    }

    // ===== 习惯管理方法 =====

    pub fn create_habit(
        &self,
        name: &str,
        description: Option<&str>,
        icon: &str,
        color: &str,
        frequency: &str,
        target_count: i64,
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        
        // 使用本地时间创建 created_at 和 updated_at 字段
        let local_datetime = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        conn.execute(
            "INSERT INTO habits (name, description, icon, color, frequency, target_count, is_active, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8)",
            params![name, description, icon, color, frequency, target_count, local_datetime, local_datetime],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_habits(&self) -> Result<Vec<Habit>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, frequency, target_count, is_active, created_at, updated_at
             FROM habits
             ORDER BY created_at DESC"
        )?;

        let habit_iter = stmt.query_map([], |row| {
            Ok(Habit {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                frequency: row.get(5)?,
                target_count: row.get(6)?,
                is_active: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut habits = Vec::new();
        for habit in habit_iter {
            habits.push(habit?);
        }
        Ok(habits)
    }

    pub fn get_habit_by_id(&self, id: i64) -> Result<Option<Habit>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, frequency, target_count, is_active, created_at, updated_at
             FROM habits
             WHERE id = ?1"
        )?;

        let mut habit_iter = stmt.query_map(params![id], |row| {
            Ok(Habit {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                frequency: row.get(5)?,
                target_count: row.get(6)?,
                is_active: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        match habit_iter.next() {
            Some(habit) => Ok(Some(habit?)),
            None => Ok(None),
        }
    }

    pub fn update_habit(
        &self,
        id: i64,
        name: &str,
        description: Option<&str>,
        icon: &str,
        color: &str,
        frequency: &str,
        target_count: i64,
        is_active: bool,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE habits 
             SET name = ?1, description = ?2, icon = ?3, color = ?4, frequency = ?5, 
                 target_count = ?6, is_active = ?7
             WHERE id = ?8",
            params![name, description, icon, color, frequency, target_count, is_active, id],
        )?;
        Ok(())
    }

    pub fn delete_habit(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM habits WHERE id = ?1", params![id])?;
        Ok(())
    }

    // ===== 习惯记录管理方法 =====

    pub fn record_habit_completion(
        &self,
        habit_id: i64,
        date: &str,
        completed_count: i64,
        notes: Option<&str>,
    ) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        
        // 使用本地时间创建 created_at 和 updated_at 字段
        let local_datetime = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        
        conn.execute(
            "INSERT OR REPLACE INTO habit_records (habit_id, date, completed_count, notes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![habit_id, date, completed_count, notes, local_datetime, local_datetime],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_habit_records(&self, habit_id: Option<i64>, start_date: Option<&str>, end_date: Option<&str>) -> Result<Vec<HabitRecord>> {
        let conn = self.conn.lock().unwrap();
        
        let mut query = String::from(
            "SELECT id, habit_id, date, completed_count, notes, created_at, updated_at
             FROM habit_records"
        );
        let mut conditions = Vec::new();
        let mut params = Vec::new();

        if let Some(hid) = habit_id {
            conditions.push("habit_id = ?");
            params.push(hid.to_string());
        }

        if let Some(start) = start_date {
            conditions.push("date >= ?");
            params.push(start.to_string());
        }

        if let Some(end) = end_date {
            conditions.push("date <= ?");
            params.push(end.to_string());
        }

        if !conditions.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&conditions.join(" AND "));
        }

        query.push_str(" ORDER BY date DESC");

        let mut stmt = conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p as &dyn rusqlite::ToSql).collect();
        
        let record_iter = stmt.query_map(&param_refs[..], |row| {
            Ok(HabitRecord {
                id: Some(row.get(0)?),
                habit_id: row.get(1)?,
                date: row.get(2)?,
                completed_count: row.get(3)?,
                notes: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        let mut records = Vec::new();
        for record in record_iter {
            records.push(record?);
        }
        Ok(records)
    }

    pub fn delete_habit_record(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM habit_records WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn delete_habit_record_by_habit_date(&self, habit_id: i64, date: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM habit_records WHERE habit_id = ?1 AND date = ?2",
            params![habit_id, date]
        )?;
        Ok(())
    }

    pub fn get_habit_stats(&self, habit_id: i64) -> Result<(i64, i64, i64, i64, f64)> {
        let conn = self.conn.lock().unwrap();
        
        // 简化版本：先返回基础统计，避免复杂的日期计算
        let completed_days: i64 = conn.query_row(
            "SELECT COUNT(*) FROM habit_records WHERE habit_id = ?1",
            params![habit_id],
            |row| row.get(0),
        ).unwrap_or(0);

        // 修正总天数计算 - 使用日期差异，但确保至少为1
        let total_days: i64 = conn.query_row(
            "SELECT MAX(1, CAST(ROUND(JULIANDAY('now') - JULIANDAY(DATE(created_at))) + 1) AS INTEGER))
             FROM habits WHERE id = ?1",
            params![habit_id],
            |row| row.get(0),
        ).unwrap_or(1);

        // 简化连续天数计算
        let current_streak = if completed_days > 0 { 
            // 检查今天是否有记录
            let today_completed: i64 = conn.query_row(
                "SELECT COUNT(*) FROM habit_records 
                 WHERE habit_id = ?1 AND date = date('now')",
                params![habit_id],
                |row| row.get(0),
            ).unwrap_or(0);
            
            if today_completed > 0 { 1 } else { 0 }
        } else { 
            0 
        };

        let longest_streak = current_streak; // 暂时简化为当前连续天数

        // 修正完成率计算 - 确保不超过100%
        let completion_rate = if total_days > 0 {
            let rate = (completed_days as f64 / total_days as f64) * 100.0;
            // 限制在0-100%之间
            rate.min(100.0).max(0.0)
        } else {
            0.0
        };

        Ok((total_days, completed_days, current_streak, longest_streak, completion_rate))
    }

    #[allow(dead_code)]
    fn get_habit_current_streak(&self, habit_id: i64) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT date FROM habit_records 
             WHERE habit_id = ?1 
             ORDER BY date DESC"
        )?;

        let dates: Vec<String> = stmt.query_map(params![habit_id], |row| {
            Ok(row.get::<_, String>(0)?)
        })?.collect::<Result<Vec<_>, _>>()?;

        let mut streak = 0;
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        let mut current_date = chrono::NaiveDate::parse_from_str(&today, "%Y-%m-%d")
            .map_err(|_| rusqlite::Error::InvalidColumnType(0, "date".to_string(), rusqlite::types::Type::Text))?;

        for date_str in dates {
            let record_date = chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
                .map_err(|_| rusqlite::Error::InvalidColumnType(0, "date".to_string(), rusqlite::types::Type::Text))?;
            
            if record_date == current_date {
                streak += 1;
                current_date = current_date.pred_opt().unwrap_or(current_date);
            } else if record_date == current_date.pred_opt().unwrap_or(current_date) {
                streak += 1;
                current_date = record_date.pred_opt().unwrap_or(record_date);
            } else {
                break;
            }
        }

        Ok(streak)
    }

    #[allow(dead_code)]
    fn get_habit_longest_streak(&self, habit_id: i64) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT date FROM habit_records 
             WHERE habit_id = ?1 
             ORDER BY date ASC"
        )?;

        let dates: Vec<String> = stmt.query_map(params![habit_id], |row| {
            Ok(row.get::<_, String>(0)?)
        })?.collect::<Result<Vec<_>, _>>()?;

        let mut longest_streak = 0;
        let mut current_streak = 0;
        let mut prev_date: Option<chrono::NaiveDate> = None;

        for date_str in dates {
            let record_date = chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
                .map_err(|_| rusqlite::Error::InvalidColumnType(0, "date".to_string(), rusqlite::types::Type::Text))?;
            
            if let Some(prev) = prev_date {
                if record_date == prev.succ_opt().unwrap_or(prev) {
                    current_streak += 1;
                } else {
                    longest_streak = longest_streak.max(current_streak);
                    current_streak = 1;
                }
            } else {
                current_streak = 1;
            }
            
            prev_date = Some(record_date);
        }

        longest_streak = longest_streak.max(current_streak);
        Ok(longest_streak)
    }

    // ===== 缺失的方法 =====

    // 更新知识库
    pub fn update_knowledge_base(&self, id: &str, name: Option<&str>, icon: Option<&str>, description: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Self::current_timestamp();
        
        if let Some(name) = name {
            conn.execute("UPDATE knowledge_bases SET name = ?1, updated_at = ?2 WHERE id = ?3", params![name, now, id])?;
        }
        if let Some(icon) = icon {
            conn.execute("UPDATE knowledge_bases SET icon = ?1, updated_at = ?2 WHERE id = ?3", params![icon, now, id])?;
        }
        if let Some(description) = description {
            conn.execute("UPDATE knowledge_bases SET description = ?1, updated_at = ?2 WHERE id = ?3", params![description, now, id])?;
        }
        
        Ok(())
    }

    // 搜索知识库
    pub fn search_knowledge_bases(&self, query: &str) -> Result<Vec<KnowledgeBase>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, description, created_at, updated_at 
             FROM knowledge_bases 
             WHERE name LIKE ?1 OR description LIKE ?1
             ORDER BY updated_at DESC"
        )?;

        let kb_iter = stmt.query_map([format!("%{}%", query)], |row| {
            Ok(KnowledgeBase {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                description: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;

        let mut knowledge_bases = Vec::new();
        for kb in kb_iter {
            knowledge_bases.push(kb?);
        }
        Ok(knowledge_bases)
    }

    // 获取页面列表
    pub fn get_pages(&self, kb_id: &str, parent_id: Option<&str>) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, kb_id, title, content, parent_id, sort_order, is_deleted, created_at, updated_at 
             FROM pages 
             WHERE kb_id = ?1 AND (parent_id = ?2 OR (?2 IS NULL AND parent_id IS NULL))
             AND is_deleted = 0
             ORDER BY sort_order"
        )?;

        let page_iter = stmt.query_map(params![kb_id, parent_id], |row| {
            Ok(Page {
                id: row.get(0)?,
                kb_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get::<_, Option<String>>(3)?,
                parent_id: row.get(4)?,
                sort_order: row.get(5)?,
                is_deleted: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut pages = Vec::new();
        for page in page_iter {
            pages.push(page?);
        }
        Ok(pages)
    }

    // 获取知识库的所有页面（用于构建树结构）
    pub fn get_all_pages(&self, kb_id: &str) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, kb_id, title, parent_id, sort_order, is_deleted, created_at, updated_at 
             FROM pages 
             WHERE kb_id = ?1 AND is_deleted = 0
             ORDER BY sort_order"
        )?;

        let page_iter = stmt.query_map([kb_id], |row| {
            Ok(Page {
                id: row.get(0)?,
                kb_id: row.get(1)?,
                title: row.get(2)?,
                content: None,
                parent_id: row.get(3)?,
                sort_order: row.get(4)?,
                is_deleted: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut pages = Vec::new();
        for page in page_iter {
            pages.push(page?);
        }
        Ok(pages)
    }

    // 根据ID获取页面
    pub fn get_page_by_id(&self, id: &str) -> Result<Option<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, kb_id, title, parent_id, sort_order, is_deleted, created_at, updated_at 
             FROM pages WHERE id = ?1"
        )?;

        let result = stmt.query_row([id], |row| {
            Ok(Page {
                id: row.get(0)?,
                kb_id: row.get(1)?,
                title: row.get(2)?,
                content: None,
                parent_id: row.get(3)?,
                sort_order: row.get(4)?,
                is_deleted: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        });

        match result {
            Ok(page) => Ok(Some(page)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    // 更新页面
    pub fn update_page(&self, id: &str, title: Option<&str>, parent_id: Option<&str>, order_index: Option<i64>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Self::current_timestamp();
        
        if let Some(title) = title {
            conn.execute("UPDATE pages SET title = ?1, updated_at = ?2 WHERE id = ?3", params![title, now, id])?;
        }
        if let Some(parent_id) = parent_id {
            conn.execute("UPDATE pages SET parent_id = ?1, updated_at = ?2 WHERE id = ?3", params![parent_id, now, id])?;
        }
        if let Some(order_index) = order_index {
            conn.execute("UPDATE pages SET sort_order = ?1, updated_at = ?2 WHERE id = ?3", params![order_index, now, id])?;
        }
        
        Ok(())
    }

    // 删除页面（级联删除子页面）
    pub fn delete_page(&self, id: &str) -> Result<()> {
        // 先获取子页面，然后释放连接锁
        let child_pages = {
            let conn = self.conn.lock().unwrap();
            let mut stmt = conn.prepare(
                "SELECT id, kb_id, title, parent_id, sort_order, is_deleted, created_at, updated_at 
                 FROM pages 
                 WHERE parent_id = ?1 AND is_deleted = 0"
            )?;

            let page_iter = stmt.query_map([id], |row| {
                Ok(Page {
                    id: row.get(0)?,
                    kb_id: row.get(1)?,
                    title: row.get(2)?,
                    content: None,
                    parent_id: row.get(3)?,
                    sort_order: row.get(4)?,
                    is_deleted: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?;

            let mut pages = Vec::new();
            for page in page_iter {
                pages.push(page?);
            }
            pages
        }; // 连接锁在这里释放
        
        // 递归删除子页面
        for child in child_pages {
            self.delete_page(&child.id)?;
        }
        
        // 删除当前页面和相关的块
        {
            let conn = self.conn.lock().unwrap();
            let now = Self::current_timestamp();
            
            // 删除当前页面
            conn.execute("UPDATE pages SET is_deleted = 1, updated_at = ?1 WHERE id = ?2", params![now, id])?;
            
            // 删除相关的块
            conn.execute("UPDATE blocks SET is_deleted = 1, updated_at = ?1 WHERE page_id = ?2", params![now, id])?;
        }
        
        Ok(())
    }

    // 获取子页面
    #[allow(dead_code)]
    fn get_child_pages(&self, parent_id: &str) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, kb_id, title, parent_id, sort_order, is_deleted, created_at, updated_at 
             FROM pages 
             WHERE parent_id = ?1 AND is_deleted = 0"
        )?;

        let page_iter = stmt.query_map([parent_id], |row| {
            Ok(Page {
                id: row.get(0)?,
                kb_id: row.get(1)?,
                title: row.get(2)?,
                content: None,
                parent_id: row.get(3)?,
                sort_order: row.get(4)?,
                is_deleted: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut pages = Vec::new();
        for page in page_iter {
            pages.push(page?);
        }
        Ok(pages)
    }

    // 搜索页面（支持标题和内容）
    pub fn search_pages(&self, kb_id: &str, query: &str) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        // 搜索页面标题和内容（通过块数据）
        let mut stmt = conn.prepare(
            "SELECT DISTINCT p.id, p.kb_id, p.title, p.parent_id, p.sort_order, p.is_deleted, p.created_at, p.updated_at 
             FROM pages p
             LEFT JOIN blocks b ON p.id = b.page_id
             WHERE p.kb_id = ?1 
                AND p.is_deleted = 0
                AND (p.title LIKE ?2 OR b.content LIKE ?2)
             ORDER BY p.updated_at DESC"
        )?;

        let page_iter = stmt.query_map(params![kb_id, format!("%{}%", query)], |row| {
            Ok(Page {
                id: row.get(0)?,
                kb_id: row.get(1)?,
                title: row.get(2)?,
                content: None,
                parent_id: row.get(3)?,
                sort_order: row.get(4)?,
                is_deleted: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut pages = Vec::new();
        for page in page_iter {
            pages.push(page?);
        }
        Ok(pages)
    }

    // 移动页面
    pub fn move_page(&self, page_id: &str, new_parent_id: Option<&str>, new_order_index: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Self::current_timestamp();
        
        conn.execute(
            "UPDATE pages SET parent_id = ?1, sort_order = ?2, updated_at = ?3 WHERE id = ?4",
            params![new_parent_id, new_order_index as f64, now, page_id]
        )?;
        
        Ok(())
    }

    // 获取页面面包屑
    pub fn get_page_breadcrumb(&self, page_id: &str) -> Result<Vec<Page>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "WITH RECURSIVE breadcrumb(id, kb_id, title, parent_id, sort_order, is_deleted, created_at, updated_at, level) AS (
                SELECT id, kb_id, title, parent_id, sort_order, is_deleted, created_at, updated_at, 0 as level
                FROM pages WHERE id = ?1
                UNION ALL
                SELECT p.id, p.kb_id, p.title, p.parent_id, p.sort_order, p.is_deleted, p.created_at, p.updated_at, b.level + 1
                FROM pages p JOIN breadcrumb b ON p.id = b.parent_id
            )
            SELECT id, kb_id, title, parent_id, sort_order, is_deleted, created_at, updated_at 
            FROM breadcrumb 
            ORDER BY level DESC"
        )?;

        let page_iter = stmt.query_map([page_id], |row| {
            Ok(Page {
                id: row.get(0)?,
                kb_id: row.get(1)?,
                title: row.get(2)?,
                content: None,
                parent_id: row.get(3)?,
                sort_order: row.get(4)?,
                is_deleted: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut pages = Vec::new();
        for page in page_iter {
            pages.push(page?);
        }
        Ok(pages)
    }

    // 获取块列表
    pub fn get_blocks(&self, page_id: &str, parent_id: Option<&str>) -> Result<Vec<Block>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, page_id, type, content, data, parent_id, sort_order, created_at, updated_at 
             FROM blocks 
             WHERE page_id = ?1 AND (parent_id = ?2 OR (?2 IS NULL AND parent_id IS NULL))
             ORDER BY sort_order"
        )?;

        let block_iter = stmt.query_map(params![page_id, parent_id], |row| {
            Ok(Block {
                id: row.get(0)?,
                page_id: row.get(1)?,
                r#type: row.get(2)?,
                content: row.get(3)?,
                data: row.get(4)?,
                parent_id: row.get(5)?,
                sort_order: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut blocks = Vec::new();
        for block in block_iter {
            blocks.push(block?);
        }
        Ok(blocks)
    }

    // 根据ID获取块
    pub fn get_block_by_id(&self, id: &str) -> Result<Option<Block>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, page_id, type, content, data, parent_id, sort_order, created_at, updated_at 
             FROM blocks WHERE id = ?1"
        )?;

        let result = stmt.query_row([id], |row| {
            Ok(Block {
                id: row.get(0)?,
                page_id: row.get(1)?,
                r#type: row.get(2)?,
                content: row.get(3)?,
                data: row.get(4)?,
                parent_id: row.get(5)?,
                sort_order: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        });

        match result {
            Ok(block) => Ok(Some(block)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    // 更新块
    pub fn update_block(&self, id: &str, content: Option<&str>, parent_id: Option<&str>, order_index: Option<i64>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Self::current_timestamp();
        
        if let Some(content) = content {
            conn.execute("UPDATE blocks SET content = ?1, updated_at = ?2 WHERE id = ?3", params![content, now, id])?;
            // 更新搜索索引
            conn.execute("UPDATE search_index SET content = ?1 WHERE id = ?2", params![content, id])?;
        }
        if let Some(parent_id) = parent_id {
            conn.execute("UPDATE blocks SET parent_id = ?1, updated_at = ?2 WHERE id = ?3", params![parent_id, now, id])?;
        }
        if let Some(order_index) = order_index {
            conn.execute("UPDATE blocks SET sort_order = ?1, updated_at = ?2 WHERE id = ?3", params![order_index, now, id])?;
        }
        
        Ok(())
    }

    // 删除块
    pub fn delete_block(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        conn.execute("DELETE FROM blocks WHERE id = ?1", params![id])?;
        conn.execute("DELETE FROM search_index WHERE id = ?1", params![id])?;
        
        Ok(())
    }

    // 搜索块
    pub fn search_blocks(&self, page_id: &str, query: &str) -> Result<Vec<Block>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, page_id, type, content, data, parent_id, sort_order, created_at, updated_at 
             FROM blocks 
             WHERE page_id = ?1 AND content LIKE ?2
             ORDER BY sort_order"
        )?;

        let block_iter = stmt.query_map(params![page_id, format!("%{}%", query)], |row| {
            Ok(Block {
                id: row.get(0)?,
                page_id: row.get(1)?,
                r#type: row.get(2)?,
                content: row.get(3)?,
                data: row.get(4)?,
                parent_id: row.get(5)?,
                sort_order: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut blocks = Vec::new();
        for block in block_iter {
            blocks.push(block?);
        }
        Ok(blocks)
    }

    // 移动块
    pub fn move_block(&self, block_id: &str, new_parent_id: Option<&str>, new_order_index: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Self::current_timestamp();
        
        conn.execute(
            "UPDATE blocks SET parent_id = ?1, sort_order = ?2, updated_at = ?3 WHERE id = ?4",
            params![new_parent_id, new_order_index as f64, now, block_id]
        )?;
        
        Ok(())
    }

    // Editor.js 相关方法
    #[allow(dead_code)]
    pub fn save_page_content(&self, page_id: &str, content: &str, version: Option<i32>) -> Result<String, String> {
        self.with_connection(|conn| {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64;

            // 更新页面内容
            let rows_affected = conn.execute(
                "UPDATE pages SET content = ?1, updated_at = ?2 WHERE id = ?3",
                params![content, now, page_id],
            )?;

            if rows_affected == 0 {
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }

            // 如果需要版本管理，保存版本历史
            if let Some(v) = version {
                let version_id = uuid::Uuid::new_v4().to_string();
                let _ = conn.execute(
                    "INSERT INTO page_versions (id, page_id, content, version, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![version_id, page_id, content, v, now],
                );
            }

            Ok("Content saved successfully".to_string())
        })
    }

    #[allow(dead_code)]
    pub fn get_page_content(&self, page_id: &str) -> Result<String, String> {
        self.with_connection(|conn| {
            let mut stmt = conn.prepare("SELECT content FROM pages WHERE id = ?1 AND is_deleted = 0")?;

            let content: Option<String> = stmt.query_row(params![page_id], |row| {
                Ok(row.get::<_, Option<String>>(0)?)
            })?;

            Ok(content.unwrap_or_else(|| {
                // 返回默认的 Editor.js 空文档格式
                r#"{"time":0,"blocks":[],"version":"2.30.8"}"#.to_string()
            }))
        })
    }
}