use crate::database::{Database, PasswordCategory};
use crate::crypto::CryptoService;
use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

// 密码管理相关的数据传输对象
#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordCategoryDto {
    pub id: Option<i64>,
    pub name: String,
    pub icon: String,
    pub color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordEntryDto {
    pub id: Option<i64>,
    pub title: String,
    pub username: Option<String>,
    pub password: String,  // 前端传来的明文密码
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
    pub tags: Option<Vec<String>>,
    pub is_favorite: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordEntryResponse {
    pub id: Option<i64>,
    pub title: String,
    pub username: Option<String>,
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
    pub tags: Option<Vec<String>>,
    pub is_favorite: bool,
    pub last_used_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MasterPasswordRequest {
    pub password: String,
    pub salt: Option<String>,  // base64编码的盐值
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordGeneratorOptions {
    pub length: usize,
    pub include_uppercase: bool,
    pub include_lowercase: bool,
    pub include_numbers: bool,
    pub include_symbols: bool,
}

// 密码分类相关命令
#[tauri::command]
pub async fn get_password_categories(database: State<'_, Arc<Database>>) -> Result<Vec<PasswordCategory>, String> {
    database.with_connection(|conn| {
        let mut stmt = conn.prepare("SELECT id, name, icon, color, created_at FROM password_categories ORDER BY name")?;
        
        let category_iter = stmt.query_map([], |row| {
            Ok(PasswordCategory {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;
        
        let mut categories = Vec::new();
        for category in category_iter {
            categories.push(category?);
        }
        
        Ok(categories)
    })
}

#[tauri::command]
pub async fn create_password_category(
    database: State<'_, Arc<Database>>, 
    name: String, 
    icon: String, 
    color: Option<String>
) -> Result<i64, String> {
    database.with_connection(|conn| {
        conn.execute(
            "INSERT INTO password_categories (name, icon, color) VALUES (?1, ?2, ?3)",
            params![name, icon, color],
        )?;
        
        Ok(conn.last_insert_rowid())
    })
}

#[tauri::command]
pub async fn update_password_category(
    database: State<'_, Arc<Database>>, 
    id: i64, 
    name: String, 
    icon: String, 
    color: Option<String>
) -> Result<(), String> {
    database.with_connection(|conn| {
        conn.execute(
            "UPDATE password_categories SET name = ?1, icon = ?2, color = ?3 WHERE id = ?4",
            params![name, icon, color, id],
        )?;
        
        Ok(())
    })
}

#[tauri::command]
pub async fn delete_password_category(database: State<'_, Arc<Database>>, id: i64) -> Result<(), String> {
    database.with_connection(|conn| {
        conn.execute(
            "DELETE FROM password_categories WHERE id = ?1",
            params![id],
        )?;
        
        Ok(())
    })
}

// 密码条目相关命令
#[tauri::command]
pub async fn get_password_entries(database: State<'_, Arc<Database>>) -> Result<Vec<PasswordEntryResponse>, String> {
    database.with_connection(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, title, username, url, notes, ip, db_type, db_ip, db_username, app_name, 
             category_id, tags, is_favorite, last_used_at, created_at, updated_at 
             FROM password_entries ORDER BY created_at DESC"
        )?;
            
        let entry_iter = stmt.query_map([], |row| {
            let tags_json: Option<String> = row.get(11)?;
            let tags = tags_json.and_then(|json| serde_json::from_str::<Vec<String>>(&json).ok());
            
            Ok(PasswordEntryResponse {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                username: row.get(2)?,
                url: row.get(3)?,
                notes: row.get(4)?,
                ip: row.get(5)?,
                db_type: row.get(6)?,
                db_ip: row.get(7)?,
                db_username: row.get(8)?,
                app_name: row.get(9)?,
                category_id: row.get(10)?,
                tags,
                is_favorite: row.get::<_, i32>(12)? == 1,
                last_used_at: row.get(13)?,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })?;
        
        let mut entries = Vec::new();
        for entry in entry_iter {
            entries.push(entry?);
        }
        
        Ok(entries)
    })
}

#[tauri::command]
pub async fn get_password_entries_by_category(
    database: State<'_, Arc<Database>>, 
    category_id: i64
) -> Result<Vec<PasswordEntryResponse>, String> {
    database.with_connection(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, title, username, url, notes, ip, db_type, db_ip, db_username, app_name, 
             category_id, tags, is_favorite, last_used_at, created_at, updated_at 
             FROM password_entries WHERE category_id = ?1 ORDER BY created_at DESC"
        )?;
            
        let entry_iter = stmt.query_map([category_id], |row| {
            let tags_json: Option<String> = row.get(11)?;
            let tags = tags_json.and_then(|json| serde_json::from_str::<Vec<String>>(&json).ok());
            
            Ok(PasswordEntryResponse {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                username: row.get(2)?,
                url: row.get(3)?,
                notes: row.get(4)?,
                ip: row.get(5)?,
                db_type: row.get(6)?,
                db_ip: row.get(7)?,
                db_username: row.get(8)?,
                app_name: row.get(9)?,
                category_id: row.get(10)?,
                tags,
                is_favorite: row.get::<_, i32>(12)? == 1,
                last_used_at: row.get(13)?,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })?;
        
        let mut entries = Vec::new();
        for entry in entry_iter {
            entries.push(entry?);
        }
        
        Ok(entries)
    })
}

#[tauri::command]
pub async fn create_password_entry(
    database: State<'_, Arc<Database>>,
    entry: PasswordEntryDto
) -> Result<i64, String> {
    // 直接存储明文密码（不加密）
    let stored_password = entry.password;
    
    let tags_json = entry.tags.map(|tags| serde_json::to_string(&tags).unwrap_or_default());
    
    database.with_connection(|conn| {
        conn.execute(
            "INSERT INTO password_entries 
             (title, username, password_encrypted, url, notes, ip, db_type, db_ip, db_username, app_name, category_id, tags, is_favorite) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                entry.title,
                entry.username,
                stored_password,
                entry.url,
                entry.notes,
                entry.ip,
                entry.db_type,
                entry.db_ip,
                entry.db_username,
                entry.app_name,
                entry.category_id,
                tags_json,
                if entry.is_favorite { 1 } else { 0 }
            ],
        )?;
        
        Ok(conn.last_insert_rowid())
    })
}

#[tauri::command]
pub async fn update_password_entry(
    database: State<'_, Arc<Database>>,
    id: i64,
    entry: PasswordEntryDto
) -> Result<(), String> {
    // 直接存储明文密码（不加密）
    let stored_password = entry.password;
    
    let tags_json = entry.tags.map(|tags| serde_json::to_string(&tags).unwrap_or_default());
    
    database.with_connection(|conn| {
        conn.execute(
            "UPDATE password_entries 
             SET title = ?1, username = ?2, password_encrypted = ?3, url = ?4, 
                 notes = ?5, ip = ?6, db_type = ?7, db_ip = ?8, db_username = ?9, app_name = ?10,
                 category_id = ?11, tags = ?12, is_favorite = ?13
             WHERE id = ?14",
            params![
                entry.title,
                entry.username,
                stored_password,
                entry.url,
                entry.notes,
                entry.ip,
                entry.db_type,
                entry.db_ip,
                entry.db_username,
                entry.app_name,
                entry.category_id,
                tags_json,
                if entry.is_favorite { 1 } else { 0 },
                id
            ],
        )?;
        
        Ok(())
    })
}

#[tauri::command]
pub async fn delete_password_entry(database: State<'_, Arc<Database>>, id: i64) -> Result<(), String> {
    database.with_connection(|conn| {
        conn.execute(
            "DELETE FROM password_entries WHERE id = ?1",
            params![id],
        )?;
        
        Ok(())
    })
}

#[tauri::command]
pub async fn get_decrypted_password(
    database: State<'_, Arc<Database>>,
    entry_id: i64
) -> Result<String, String> {
    let plaintext_password = database.with_connection(|conn| {
        let password: String = conn.query_row(
            "SELECT password_encrypted FROM password_entries WHERE id = ?1",
            params![entry_id],
            |row| row.get(0),
        )?;
        
        // 更新最后使用时间
        let _ = conn.execute(
            "UPDATE password_entries SET last_used_at = DATETIME('now') WHERE id = ?1",
            params![entry_id],
        );
        
        Ok(password)
    })?;
    
    Ok(plaintext_password)
}

#[tauri::command]
pub async fn search_password_entries(
    database: State<'_, Arc<Database>>, 
    query: String
) -> Result<Vec<PasswordEntryResponse>, String> {
    database.with_connection(|conn| {
        let search_pattern = format!("%{}%", query);
        
        let mut stmt = conn.prepare(
            "SELECT id, title, username, url, notes, ip, db_type, db_ip, db_username, app_name, 
             category_id, tags, is_favorite, last_used_at, created_at, updated_at 
             FROM password_entries 
             WHERE title LIKE ?1 OR username LIKE ?1 OR url LIKE ?1 OR notes LIKE ?1 OR ip LIKE ?1 OR db_type LIKE ?1 OR db_ip LIKE ?1 OR db_username LIKE ?1 OR app_name LIKE ?1
             ORDER BY title"
        )?;
            
        let entry_iter = stmt.query_map([search_pattern], |row| {
            let tags_json: Option<String> = row.get(11)?;
            let tags = tags_json.and_then(|json| serde_json::from_str::<Vec<String>>(&json).ok());
            
            Ok(PasswordEntryResponse {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                username: row.get(2)?,
                url: row.get(3)?,
                notes: row.get(4)?,
                ip: row.get(5)?,
                db_type: row.get(6)?,
                db_ip: row.get(7)?,
                db_username: row.get(8)?,
                app_name: row.get(9)?,
                category_id: row.get(10)?,
                tags,
                is_favorite: row.get::<_, i32>(12)? == 1,
                last_used_at: row.get(13)?,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })?;
        
        let mut entries = Vec::new();
        for entry in entry_iter {
            entries.push(entry?);
        }
        
        Ok(entries)
    })
}

// 测试命令
#[tauri::command]
pub async fn test_password_connection() -> Result<String, String> {
    println!("TEST: password connection test called");
    Ok("Password system is working".to_string())
}



#[tauri::command]
pub async fn generate_password(options: PasswordGeneratorOptions) -> Result<String, String> {
    Ok(CryptoService::generate_password(
        options.length,
        options.include_uppercase,
        options.include_lowercase,
        options.include_numbers,
        options.include_symbols,
    ))
}

#[tauri::command]
pub async fn check_password_strength(password: String) -> Result<u8, String> {
    Ok(CryptoService::check_password_strength(&password))
}

#[tauri::command]
pub async fn get_favorite_password_entries(
    database: State<'_, Arc<Database>>
) -> Result<Vec<PasswordEntryResponse>, String> {
    database.with_connection(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, title, username, url, notes, ip, db_type, db_ip, db_username, app_name, 
             category_id, tags, is_favorite, last_used_at, created_at, updated_at 
             FROM password_entries WHERE is_favorite = 1 ORDER BY last_used_at DESC"
        )?;
            
        let entry_iter = stmt.query_map([], |row| {
            let tags_json: Option<String> = row.get(11)?;
            let tags = tags_json.and_then(|json| serde_json::from_str::<Vec<String>>(&json).ok());
            
            Ok(PasswordEntryResponse {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                username: row.get(2)?,
                url: row.get(3)?,
                notes: row.get(4)?,
                ip: row.get(5)?,
                db_type: row.get(6)?,
                db_ip: row.get(7)?,
                db_username: row.get(8)?,
                app_name: row.get(9)?,
                category_id: row.get(10)?,
                tags,
                is_favorite: row.get::<_, i32>(12)? == 1,
                last_used_at: row.get(13)?,
                created_at: row.get(14)?,
                updated_at: row.get(15)?,
            })
        })?;
        
        let mut entries = Vec::new();
        for entry in entry_iter {
            entries.push(entry?);
        }
        
        Ok(entries)
    })
}