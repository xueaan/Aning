use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;
use crate::database::Database;

// 数据模型定义
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CardBox {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub cards_count: i32,
    pub sort_order: f64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Card {
    pub id: String,
    pub box_id: String,
    pub title: String,
    pub content: Option<String>,
    pub preview: Option<String>,
    pub color: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: bool,
    pub is_archived: bool,
    pub sort_order: f64,
    pub created_at: i64,
    pub updated_at: i64,
}

// 用于更新的结构体
#[derive(Debug, Serialize, Deserialize)]
pub struct CardBoxUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CardUpdate {
    pub title: Option<String>,
    pub content: Option<String>,
    pub preview: Option<String>,
    pub color: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: Option<bool>,
    pub is_archived: Option<bool>,
    pub sort_order: Option<f64>,
}

// 工具函数 - HTML转预览文本
fn generate_preview_from_html(html: &str) -> String {
    // 简单的HTML标签移除和文本提取
    let text = html
        .replace("<p>", "")
        .replace("</p>", "\n")
        .replace("<h1>", "")
        .replace("</h1>", "\n")
        .replace("<h2>", "")
        .replace("</h2>", "\n")
        .replace("<h3>", "")
        .replace("</h3>", "\n")
        .replace("<li>", "• ")
        .replace("</li>", "\n")
        .replace("<ul>", "")
        .replace("</ul>", "")
        .replace("<ol>", "")
        .replace("</ol>", "")
        .replace("<br>", "\n")
        .replace("&nbsp;", " ");
    
    // 移除其他HTML标签
    let clean_text = match regex::Regex::new(r"<[^>]*>") {
        Ok(re) => re.replace_all(&text, "").to_string(),
        Err(_) => text,
    };
    
    // 清理多余空白和换行
    let lines: Vec<&str> = clean_text
        .lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .take(5) // 最多5行预览
        .collect();
    
    lines.join("\n")
}

// Tauri 命令实现

#[tauri::command]
pub async fn get_card_boxes(database: State<'_, Arc<Database>>) -> Result<Vec<CardBox>, String> {
    database.with_connection(|conn| {
        let mut stmt = conn
            .prepare("SELECT id, name, description, color, icon, cards_count, sort_order, created_at, updated_at FROM card_boxes ORDER BY sort_order, created_at DESC")?;
        
        let boxes: Result<Vec<CardBox>, _> = stmt
            .query_map([], |row| {
                Ok(CardBox {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    color: row.get(3)?,
                    icon: row.get(4)?,
                    cards_count: row.get(5)?,
                    sort_order: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            })?
            .collect();
        
        boxes
    }).map_err(|e| format!("Query failed: {}", e))
}

#[tauri::command]
pub async fn create_card_box(
    database: State<'_, Arc<Database>>,
    name: String,
    description: Option<String>,
    color: Option<String>,
    icon: Option<String>,
) -> Result<CardBox, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    let sort_order = now as f64;
    
    database.with_connection(|conn| {
        conn.execute(
            "INSERT INTO card_boxes (id, name, description, color, icon, cards_count, sort_order, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, ?7, ?8)",
            params![id, name, description, color, icon, sort_order, now, now],
        )?;
        
        Ok(CardBox {
            id,
            name,
            description,
            color,
            icon,
            cards_count: 0,
            sort_order,
            created_at: now,
            updated_at: now,
        })
    }).map_err(|e| format!("Create failed: {}", e))
}

#[tauri::command]
pub async fn update_card_box(
    database: State<'_, Arc<Database>>,
    id: String,
    updates: CardBoxUpdate,
) -> Result<(), String> {
    database.with_connection(|conn| {
        let now = chrono::Utc::now().timestamp_millis();
        
        if let Some(name) = updates.name {
            conn.execute("UPDATE card_boxes SET name = ?, updated_at = ? WHERE id = ?", params![name, now, id])?;
        }
        if let Some(description) = updates.description {
            conn.execute("UPDATE card_boxes SET description = ?, updated_at = ? WHERE id = ?", params![description, now, id])?;
        }
        if let Some(color) = updates.color {
            conn.execute("UPDATE card_boxes SET color = ?, updated_at = ? WHERE id = ?", params![color, now, id])?;
        }
        if let Some(icon) = updates.icon {
            conn.execute("UPDATE card_boxes SET icon = ?, updated_at = ? WHERE id = ?", params![icon, now, id])?;
        }
        if let Some(sort_order) = updates.sort_order {
            conn.execute("UPDATE card_boxes SET sort_order = ?, updated_at = ? WHERE id = ?", params![sort_order, now, id])?;
        }
        
        Ok(())
    }).map_err(|e| format!("Update failed: {}", e))
}

#[tauri::command]
pub async fn delete_card_box(database: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    database.with_connection(|conn| {
        // 检查是否有卡片
        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM cards WHERE box_id = ?", params![id], |row| {
                row.get(0)
            })?;
        
        if count > 0 {
            return Err(rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_CONSTRAINT),
                Some("无法删除非空的卡片盒".to_string())
            ));
        }
        
        conn.execute("DELETE FROM card_boxes WHERE id = ?", params![id])?;
        Ok(())
    }).map_err(|e| format!("Delete failed: {}", e))
}

#[tauri::command]
pub async fn get_cards(database: State<'_, Arc<Database>>, box_id: Option<String>) -> Result<Vec<Card>, String> {
    database.with_connection(|conn| {
        let (sql, params): (String, Vec<String>) = match box_id {
            Some(id) => (
                "SELECT id, box_id, title, content, preview, color, tags, is_pinned, is_archived, sort_order, created_at, updated_at 
                 FROM cards WHERE box_id = ? AND is_archived = 0 ORDER BY is_pinned DESC, sort_order, created_at DESC".to_string(),
                vec![id]
            ),
            None => (
                "SELECT id, box_id, title, content, preview, color, tags, is_pinned, is_archived, sort_order, created_at, updated_at 
                 FROM cards WHERE is_archived = 0 ORDER BY is_pinned DESC, sort_order, created_at DESC".to_string(),
                vec![]
            ),
        };
        
        let mut stmt = conn.prepare(&sql)?;
        
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p as &dyn rusqlite::ToSql).collect();
        
        let cards: Result<Vec<Card>, _> = stmt
            .query_map(param_refs.as_slice(), |row| {
                let tags_str: Option<String> = row.get(6)?;
                let tags = tags_str.and_then(|s| serde_json::from_str(&s).ok());
                
                Ok(Card {
                    id: row.get(0)?,
                    box_id: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    preview: row.get(4)?,
                    color: row.get(5)?,
                    tags,
                    is_pinned: row.get::<_, i32>(7)? != 0,
                    is_archived: row.get::<_, i32>(8)? != 0,
                    sort_order: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            })?
            .collect();
        
        cards
    }).map_err(|e| format!("Query failed: {}", e))
}

#[tauri::command]
pub async fn get_card_by_id(database: State<'_, Arc<Database>>, card_id: String) -> Result<Option<Card>, String> {
    database.with_connection(|conn| {
        let sql = "SELECT id, box_id, title, content, preview, color, tags, is_pinned, is_archived, sort_order, created_at, updated_at
                   FROM cards WHERE id = ?";

        let result = conn.query_row(sql, params![card_id], |row| {
            let tags_str: Option<String> = row.get(6)?;
            let tags = tags_str.and_then(|s| serde_json::from_str(&s).ok());

            Ok(Card {
                id: row.get(0)?,
                box_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                preview: row.get(4)?,
                color: row.get(5)?,
                tags,
                is_pinned: row.get::<_, i32>(7)? != 0,
                is_archived: row.get::<_, i32>(8)? != 0,
                sort_order: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        });

        match result {
            Ok(card) => Ok(Some(card)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e)
        }
    }).map_err(|e| format!("Database operation failed: {}", e))
}

#[tauri::command]
pub async fn create_card(
    database: State<'_, Arc<Database>>,
    box_id: String,
    title: String,
    content: String,
) -> Result<Card, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    let preview = generate_preview_from_html(&content);
    let sort_order = now as f64;
    
    database.with_connection(|conn| {
        conn.execute(
            "INSERT INTO cards (id, box_id, title, content, preview, color, tags, is_pinned, is_archived, sort_order, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![id, box_id, title, content, preview, None::<String>, None::<String>, 0, 0, sort_order, now, now],
        )?;
        
        Ok(Card {
            id,
            box_id: box_id,
            title,
            content: Some(content),
            preview: Some(preview),
            color: None,
            tags: None,
            is_pinned: false,
            is_archived: false,
            sort_order,
            created_at: now,
            updated_at: now,
        })
    }).map_err(|e| format!("Insert failed: {}", e))
}

#[tauri::command]
pub async fn update_card(
    database: State<'_, Arc<Database>>,
    id: String,
    updates: CardUpdate,
) -> Result<(), String> {
    database.with_connection(|conn| {
        let now = chrono::Utc::now().timestamp_millis();
        
        if let Some(title) = updates.title {
            conn.execute("UPDATE cards SET title = ?, updated_at = ? WHERE id = ?", params![title, now, id])?;
        }
        if let Some(content) = updates.content {
            let preview = generate_preview_from_html(&content);
            conn.execute("UPDATE cards SET content = ?, preview = ?, updated_at = ? WHERE id = ?", params![content, preview, now, id])?;
        }
        if let Some(color) = updates.color {
            conn.execute("UPDATE cards SET color = ?, updated_at = ? WHERE id = ?", params![color, now, id])?;
        }
        if let Some(tags) = updates.tags {
            let tags_json = serde_json::to_string(&tags).unwrap_or_default();
            conn.execute("UPDATE cards SET tags = ?, updated_at = ? WHERE id = ?", params![tags_json, now, id])?;
        }
        if let Some(is_pinned) = updates.is_pinned {
            conn.execute("UPDATE cards SET is_pinned = ?, updated_at = ? WHERE id = ?", params![is_pinned as i32, now, id])?;
        }
        if let Some(is_archived) = updates.is_archived {
            conn.execute("UPDATE cards SET is_archived = ?, updated_at = ? WHERE id = ?", params![is_archived as i32, now, id])?;
        }
        if let Some(sort_order) = updates.sort_order {
            conn.execute("UPDATE cards SET sort_order = ?, updated_at = ? WHERE id = ?", params![sort_order, now, id])?;
        }
        
        Ok(())
    }).map_err(|e| format!("Update failed: {}", e))
}

#[tauri::command]
pub async fn delete_card(database: State<'_, Arc<Database>>, id: String) -> Result<(), String> {
    database.with_connection(|conn| {
        conn.execute("DELETE FROM cards WHERE id = ?", params![id])?;
        Ok(())
    }).map_err(|e| format!("Delete failed: {}", e))
}

#[tauri::command]
pub async fn move_card(
    database: State<'_, Arc<Database>>,
    card_id: String,
    target_box_id: String,
) -> Result<(), String> {
    database.with_connection(|conn| {
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "UPDATE cards SET box_id = ?, updated_at = ? WHERE id = ?",
            params![target_box_id, now, card_id],
        )?;
        Ok(())
    }).map_err(|e| format!("Move failed: {}", e))
}

#[tauri::command]
pub async fn search_cards(database: State<'_, Arc<Database>>, query: String) -> Result<Vec<Card>, String> {
    database.with_connection(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT c.id, c.box_id, c.title, c.content, c.preview, c.color, c.tags, c.is_pinned, c.is_archived, c.sort_order, c.created_at, c.updated_at 
                 FROM cards c 
                 JOIN cards_fts fts ON c.id = fts.card_id 
                 WHERE cards_fts MATCH ? AND c.is_archived = 0 
                 ORDER BY c.is_pinned DESC, c.updated_at DESC"
            )?;
        
        let cards: Result<Vec<Card>, _> = stmt
            .query_map(params![query], |row| {
                let tags_str: Option<String> = row.get(6)?;
                let tags = tags_str.and_then(|s| serde_json::from_str(&s).ok());
                
                Ok(Card {
                    id: row.get(0)?,
                    box_id: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    preview: row.get(4)?,
                    color: row.get(5)?,
                    tags,
                    is_pinned: row.get::<_, i32>(7)? != 0,
                    is_archived: row.get::<_, i32>(8)? != 0,
                    sort_order: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            })?
            .collect();
        
        cards
    }).map_err(|e| format!("Search failed: {}", e))
}

