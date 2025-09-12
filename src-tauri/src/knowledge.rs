use crate::database::{Database, PageVersion, Attachment};
use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct SavePageRequest {
    pub page_id: String,
    pub content: String,
    pub version: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadAttachmentRequest {
    pub page_id: String,
    pub block_id: String,
    pub file_data: String, // base64 encoded
    pub file_name: String,
}

#[tauri::command]
#[allow(dead_code)]
pub async fn save_page_content(
    page_id: String,
    content: String,
    version: Option<i32>,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    db.save_page_content(&page_id, &content, version)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(dead_code)]
pub async fn get_page_content(
    page_id: String,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    db.get_page_content(&page_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(dead_code)]
pub async fn upload_attachment(
    page_id: String,
    _block_id: String,
    _file_data: String,
    file_name: String,
    _app_handle: tauri::AppHandle,
    _db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    // 暂时返回一个简单的 URL，实际实现可以后续补充
    Ok(format!("attachment://{}/{}", page_id, file_name))
}

#[tauri::command]
#[allow(dead_code)]
pub async fn get_page_versions(
    _page_id: String,
    _db: State<'_, Arc<Database>>,
) -> Result<Vec<PageVersion>, String> {
    // 暂时返回空数组，实际实现可以后续补充
    Ok(vec![])
}

#[tauri::command]
#[allow(dead_code)]
pub async fn get_page_attachments(
    _page_id: String,
    _db: State<'_, Arc<Database>>,
) -> Result<Vec<Attachment>, String> {
    // 暂时返回空数组，实际实现可以后续补充
    Ok(vec![])
}

// Context dialogue system APIs

#[derive(Debug, Serialize, Deserialize)]
pub struct PageSearchResult {
    pub id: String,
    pub title: String,
    pub content: Option<String>,
    pub kb_id: String,
    pub kb_name: String,
    pub parent_id: Option<String>,
    pub parent_title: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub score: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskSearchResult {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub project_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub score: Option<f64>,
}

#[tauri::command]
pub async fn search_knowledge_pages(
    query: String,
    kb_id: Option<String>,
    limit: Option<i64>,
    include_content: Option<bool>,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<PageSearchResult>, String> {
    let limit = limit.unwrap_or(10);
    let include_content = include_content.unwrap_or(true);
    
    db.with_connection(|conn| {
        let mut sql = String::from("
            SELECT 
                p.id, p.title, p.content, p.kb_id, kb.name as kb_name,
                p.parent_id, parent.title as parent_title,
                p.created_at, p.updated_at
            FROM pages p
            LEFT JOIN knowledge_bases kb ON p.kb_id = kb.id
            LEFT JOIN pages parent ON p.parent_id = parent.id
            WHERE p.is_deleted = 0
        ");
        
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(kb_id) = &kb_id {
            sql.push_str(" AND p.kb_id = ?");
            params.push(Box::new(kb_id.clone()));
        }
        
        if !query.trim().is_empty() {
            sql.push_str(" AND (p.title LIKE ? OR p.content LIKE ?)");
            let search_pattern = format!("%{}%", query);
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern));
        }
        
        sql.push_str(" ORDER BY p.updated_at DESC LIMIT ?");
        params.push(Box::new(limit));
        
        let mut stmt = conn.prepare(&sql)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        
        let rows = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(PageSearchResult {
                id: row.get(0)?,
                title: row.get(1)?,
                content: if include_content { row.get(2)? } else { None },
                kb_id: row.get(3)?,
                kb_name: row.get(4)?,
                parent_id: row.get(5)?,
                parent_title: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                score: Some(1.0), // 简单设置为1.0，实际可以根据匹配度计算
            })
        })?;
        
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_pages(
    limit: Option<i64>,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<PageSearchResult>, String> {
    let limit = limit.unwrap_or(10);
    
    db.with_connection(|conn| {
        let mut stmt = conn.prepare("
            SELECT 
                p.id, p.title, p.content, p.kb_id, kb.name as kb_name,
                p.parent_id, parent.title as parent_title,
                p.created_at, p.updated_at
            FROM pages p
            LEFT JOIN knowledge_bases kb ON p.kb_id = kb.id
            LEFT JOIN pages parent ON p.parent_id = parent.id
            WHERE p.is_deleted = 0
            ORDER BY p.updated_at DESC
            LIMIT ?
        ")?;
        
        let rows = stmt.query_map([limit], |row| {
            Ok(PageSearchResult {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                kb_id: row.get(3)?,
                kb_name: row.get(4)?,
                parent_id: row.get(5)?,
                parent_title: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                score: None,
            })
        })?;
        
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_pending_tasks(
    limit: Option<i64>,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<TaskSearchResult>, String> {
    let limit = limit.unwrap_or(10);
    
    db.with_connection(|conn| {
        let mut stmt = conn.prepare("
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, t.due_date,
                tp.name as project_name, t.created_at, t.updated_at
            FROM tasks t
            LEFT JOIN task_projects tp ON t.project_id = tp.id
            WHERE t.deleted_at IS NULL 
                AND t.status IN ('pending', 'in_progress')
            ORDER BY 
                CASE t.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END,
                t.due_date ASC NULLS LAST,
                t.created_at DESC
            LIMIT ?
        ")?;
        
        let rows = stmt.query_map([limit], |row| {
            let id: i64 = row.get(0)?;
            Ok(TaskSearchResult {
                id,
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                project_name: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                score: None,
            })
        })?;
        
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_page_content_for_context(
    page_id: String,
    db: State<'_, Arc<Database>>,
) -> Result<PageSearchResult, String> {
    db.with_connection(|conn| {
        let mut stmt = conn.prepare("
            SELECT 
                p.id, p.title, p.content, p.kb_id, kb.name as kb_name,
                p.parent_id, parent.title as parent_title,
                p.created_at, p.updated_at
            FROM pages p
            LEFT JOIN knowledge_bases kb ON p.kb_id = kb.id
            LEFT JOIN pages parent ON p.parent_id = parent.id
            WHERE p.id = ? AND p.is_deleted = 0
        ")?;
        
        let result = stmt.query_row([&page_id], |row| {
            Ok(PageSearchResult {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                kb_id: row.get(3)?,
                kb_name: row.get(4)?,
                parent_id: row.get(5)?,
                parent_title: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                score: None,
            })
        })?;
        
        Ok(result)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task_content_for_context(
    task_id: i64,
    db: State<'_, Arc<Database>>,
) -> Result<TaskSearchResult, String> {
    db.with_connection(|conn| {
        let mut stmt = conn.prepare("
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, t.due_date,
                tp.name as project_name, t.created_at, t.updated_at
            FROM tasks t
            LEFT JOIN task_projects tp ON t.project_id = tp.id
            WHERE t.id = ? AND t.deleted_at IS NULL
        ")?;
        
        let result = stmt.query_row([task_id], |row| {
            let id: i64 = row.get(0)?;
            Ok(TaskSearchResult {
                id,
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                project_name: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                score: None,
            })
        })?;
        
        Ok(result)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tasks_by_filter(
    filter: String,
    db: State<'_, Arc<Database>>,
) -> Result<Vec<TaskSearchResult>, String> {
    // 先检查筛选条件是否支持
    if !matches!(filter.as_str(), "today" | "week" | "pending" | "high" | "completed") {
        return Err(format!("不支持的筛选条件: {}", filter));
    }

    db.with_connection(|conn| {
        let where_clause = match filter.as_str() {
            "today" => {
                // 今日到期的任务
                "AND DATE(t.due_date) = DATE('now', 'localtime')"
            },
            "week" => {
                // 本周内的任务
                "AND t.due_date BETWEEN DATE('now', 'localtime', 'weekday 0', '-6 days') AND DATE('now', 'localtime', 'weekday 0')"
            },
            "pending" => {
                // 所有待办任务
                "AND t.status IN ('todo', 'in_progress')"
            },
            "high" => {
                // 高优先级任务
                "AND t.priority IN ('high', 'urgent')"
            },
            "completed" => {
                // 最近完成的任务
                "AND t.status = 'completed' AND t.updated_at >= DATE('now', 'localtime', '-7 days')"
            },
            _ => "" // 这种情况不会发生，因为前面已经检查了
        };

        let sql = format!("
            SELECT 
                t.id, t.title, t.description, t.status, t.priority, t.due_date,
                tp.name as project_name, t.created_at, t.updated_at
            FROM tasks t
            LEFT JOIN task_projects tp ON t.project_id = tp.id
            WHERE t.deleted_at IS NULL {}
            ORDER BY 
                CASE t.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END,
                t.due_date ASC NULLS LAST,
                t.updated_at DESC
            LIMIT 20
        ", where_clause);

        let mut stmt = conn.prepare(&sql)?;
        
        let rows = stmt.query_map([], |row| {
            let id: i64 = row.get(0)?;
            Ok(TaskSearchResult {
                id,
                title: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                priority: row.get(4)?,
                due_date: row.get(5)?,
                project_name: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                score: None,
            })
        })?;
        
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }).map_err(|e| e.to_string())
}