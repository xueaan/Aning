use crate::database::{Database, TimelineEntry, Task, TaskProject, KnowledgeBase, Page, Block, Habit, HabitRecord, AiProvider, AiAgent};
use serde_json::Value;
use std::sync::Arc;
use tauri::{State, Manager};

// 初始化数据库
#[tauri::command]
pub async fn db_init(db: State<'_, Arc<Database>>) -> Result<Value, String> {
    db.get_stats().map_err(|e| e.to_string())
}

// 获取数据库路径
#[tauri::command]
pub async fn get_db_path(db: State<'_, Arc<Database>>) -> Result<String, String> {
    Ok(db.get_db_path())
}

// 获取数据库统计信息
#[tauri::command]
pub async fn get_db_stats(db: State<'_, Arc<Database>>) -> Result<Value, String> {
    db.get_stats().map_err(|e| e.to_string())
}

// ===== 知识库相关命令 =====

#[tauri::command]
pub async fn create_knowledge_base(
    db: State<'_, Arc<Database>>,
    name: String,
    icon: Option<String>,
    description: Option<String>,
) -> Result<String, String> {
    db.create_knowledge_base(&name, &icon.unwrap_or_else(|| "📚".to_string()), description.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_knowledge_bases(
    db: State<'_, Arc<Database>>,
) -> Result<Vec<KnowledgeBase>, String> {
    db.get_knowledge_bases()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_knowledge_base(
    db: State<'_, Arc<Database>>,
    id: String,
    name: Option<String>,
    icon: Option<String>,
    description: Option<String>,
) -> Result<(), String> {
    db.update_knowledge_base(&id, name.as_deref(), icon.as_deref(), description.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_knowledge_base(
    db: State<'_, Arc<Database>>,
    id: String,
) -> Result<(), String> {
    db.delete_knowledge_base(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_knowledge_bases(
    db: State<'_, Arc<Database>>,
    query: String,
) -> Result<Vec<KnowledgeBase>, String> {
    db.search_knowledge_bases(&query)
        .map_err(|e| e.to_string())
}

// ===== 页面相关命令 =====

#[tauri::command]
pub async fn create_page(
    db: State<'_, Arc<Database>>,
    knowledge_base_id: String,
    title: String,
    parent_id: Option<String>,
    _order_index: Option<i64>,
) -> Result<String, String> {
    db.create_page(&knowledge_base_id, &title, parent_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_pages(
    db: State<'_, Arc<Database>>,
    knowledge_base_id: String,
    parent_id: Option<String>,
) -> Result<Vec<Page>, String> {
    db.get_pages(&knowledge_base_id, parent_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_pages(
    db: State<'_, Arc<Database>>,
    knowledge_base_id: String,
) -> Result<Vec<Page>, String> {
    db.get_all_pages(&knowledge_base_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_page_by_id(
    db: State<'_, Arc<Database>>,
    id: String,
) -> Result<Option<Page>, String> {
    db.get_page_by_id(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_page(
    db: State<'_, Arc<Database>>,
    id: String,
    title: Option<String>,
    parent_id: Option<String>,
    order_index: Option<i64>,
) -> Result<(), String> {
    db.update_page(&id, title.as_deref(), parent_id.as_deref(), order_index)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_page(
    db: State<'_, Arc<Database>>,
    id: String,
) -> Result<(), String> {
    db.delete_page(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_pages(
    db: State<'_, Arc<Database>>,
    knowledge_base_id: String,
    query: String,
) -> Result<Vec<Page>, String> {
    db.search_pages(&knowledge_base_id, &query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_page(
    db: State<'_, Arc<Database>>,
    page_id: String,
    new_parent_id: Option<String>,
    new_order_index: i64,
) -> Result<(), String> {
    db.move_page(&page_id, new_parent_id.as_deref(), new_order_index)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_page_breadcrumb(
    db: State<'_, Arc<Database>>,
    page_id: String,
) -> Result<Vec<Page>, String> {
    db.get_page_breadcrumb(&page_id)
        .map_err(|e| e.to_string())
}

// ===== 块相关命令 =====

#[tauri::command]
pub async fn create_block(
    db: State<'_, Arc<Database>>,
    page_id: String,
    block_type: String,
    content: String,
    parent_id: Option<String>,
    _order_index: Option<i64>,
) -> Result<String, String> {
    db.create_block(&page_id, &block_type, &content, "", parent_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_blocks(
    db: State<'_, Arc<Database>>,
    page_id: String,
    parent_id: Option<String>,
) -> Result<Vec<Block>, String> {
    db.get_blocks(&page_id, parent_id.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_block_by_id(
    db: State<'_, Arc<Database>>,
    id: String,
) -> Result<Option<Block>, String> {
    db.get_block_by_id(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_block(
    db: State<'_, Arc<Database>>,
    id: String,
    content: Option<String>,
    parent_id: Option<String>,
    order_index: Option<i64>,
) -> Result<(), String> {
    db.update_block(&id, content.as_deref(), parent_id.as_deref(), order_index)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_block(
    db: State<'_, Arc<Database>>,
    id: String,
) -> Result<(), String> {
    db.delete_block(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_blocks(
    db: State<'_, Arc<Database>>,
    page_id: String,
    query: String,
) -> Result<Vec<Block>, String> {
    db.search_blocks(&page_id, &query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn move_block(
    db: State<'_, Arc<Database>>,
    block_id: String,
    new_parent_id: Option<String>,
    new_order_index: i64,
) -> Result<(), String> {
    db.move_block(&block_id, new_parent_id.as_deref(), new_order_index)
        .map_err(|e| e.to_string())
}

// ===== 时光记相关命令 =====

#[tauri::command]
pub async fn create_timeline_entry(
    db: State<'_, Arc<Database>>,
    date: String,
    time: String,
    content: String,
    weather: Option<String>,
    mood: Option<String>,
    timestamp: Option<i64>,
) -> Result<i64, String> {
    db.create_timeline_entry(
        &date,
        &time,
        &content,
        weather.as_deref(),
        mood.as_deref(),
        timestamp,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_timeline_by_date(
    db: State<'_, Arc<Database>>,
    date: String,
) -> Result<Vec<TimelineEntry>, String> {
    db.get_timeline_entries_by_date(&date)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_timeline(
    db: State<'_, Arc<Database>>,
    limit: i32,
) -> Result<Vec<TimelineEntry>, String> {
    db.get_recent_timeline_entries(limit)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn db_delete_timeline_entry(
    db: State<'_, Arc<Database>>,
    id: i64,
) -> Result<(), String> {
    db.delete_timeline_entry(id).map_err(|e| e.to_string())
}


// ===== 数据迁移命令 =====

#[tauri::command]
pub async fn migrate_markdown_to_db(
    app_handle: tauri::AppHandle,
    db: State<'_, Arc<Database>>,
) -> Result<String, String> {
    use std::fs;
    
    // 获取时光记目录
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let timeline_dir = app_dir.join("timeline");
    
    if !timeline_dir.exists() {
        return Ok("没有找到需要迁移的数据".to_string());
    }
    
    let mut migrated_count = 0;
    
    // 读取所有 markdown 文件
    if let Ok(entries) = fs::read_dir(timeline_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Some(file_name) = entry.file_name().to_str() {
                    if file_name.ends_with(".md") {
                        // 解析文件名获取日期
                        let date = file_name.trim_end_matches(".md");
                        
                        // 读取文件内容
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            // 解析 markdown 内容
                            let lines: Vec<&str> = content.lines().collect();
                            let mut in_front_matter = false;
                            let mut weather: Option<String> = None;
                            let mut mood: Option<String> = None;
                            let mut current_time: Option<String> = None;
                            let mut current_content = String::new();
                            
                            for line in lines {
                                if line == "---" {
                                    in_front_matter = !in_front_matter;
                                    continue;
                                }
                                
                                if in_front_matter {
                                    if line.starts_with("weather:") {
                                        weather = Some(line.replace("weather:", "").trim().to_string());
                                    } else if line.starts_with("mood:") {
                                        mood = Some(line.replace("mood:", "").trim().to_string());
                                    }
                                } else if line.starts_with("## ") {
                                    // 保存之前的条目
                                    if let Some(time) = &current_time {
                                        if !current_content.trim().is_empty() {
                                            let _ = db.create_timeline_entry(
                                                date,
                                                time,
                                                &current_content.trim(),
                                                weather.as_deref(),
                                                mood.as_deref(),
                                                None,
                                            );
                                            migrated_count += 1;
                                        }
                                    }
                                    
                                    // 开始新条目
                                    current_time = Some(line.replace("## ", "").trim().to_string());
                                    current_content.clear();
                                } else if !line.trim().is_empty() {
                                    if !current_content.is_empty() {
                                        current_content.push('\n');
                                    }
                                    current_content.push_str(line);
                                }
                            }
                            
                            // 保存最后一个条目
                            if let Some(time) = &current_time {
                                if !current_content.trim().is_empty() {
                                    let _ = db.create_timeline_entry(
                                        date,
                                        time,
                                        &current_content.trim(),
                                        weather.as_deref(),
                                        mood.as_deref(),
                                        None,
                                    );
                                    migrated_count += 1;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    Ok(format!("成功迁移 {} 条时光记到数据库", migrated_count))
}



// ===== TaskBox 任务管理命令 =====

// Task commands
#[tauri::command]
pub async fn create_task(
    db: State<'_, Arc<Database>>,
    title: String,
    description: Option<String>,
    status: String,
    priority: String,
    deadline: Option<String>,
    project: Option<i64>,
) -> Result<i64, String> {
    println!("[Commands] create_task called with:");
    println!("  title: {}", title);
    println!("  description: {:?}", description);
    println!("  status: {}", status);
    println!("  priority: {}", priority);
    println!("  deadline: {:?}", deadline);
    println!("  deadline is_some: {}", deadline.is_some());
    println!("  deadline is_empty: {}", deadline.as_ref().map_or(false, |s| s.is_empty()));
    println!("  project: {:?}", project);
    
    let result = db.create_task(
        &title,
        description.as_deref(),
        &status,
        &priority,
        deadline.as_deref(),
        project,
    );
    
    match &result {
        Ok(id) => println!("[Commands] create_task success, id: {}", id),
        Err(e) => println!("[Commands] create_task error: {}", e),
    }
    
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_tasks(db: State<'_, Arc<Database>>) -> Result<Vec<Task>, String> {
    db.get_all_tasks().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tasks_by_status(
    db: State<'_, Arc<Database>>,
    status: String,
) -> Result<Vec<Task>, String> {
    db.get_tasks_by_status(&status).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tasks_by_project(
    db: State<'_, Arc<Database>>,
    project_id: i64,
) -> Result<Vec<Task>, String> {
    db.get_tasks_by_project(project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tasks_by_date_range(
    db: State<'_, Arc<Database>>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<Vec<Task>, String> {
    db.get_tasks_by_date_range(start_date.as_deref(), end_date.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task(
    db: State<'_, Arc<Database>>,
    id: i64,
    title: Option<String>,
    description: Option<String>,
    status: Option<String>,
    priority: Option<String>,
    deadline: Option<String>,
    completed_at: Option<String>,
    project: Option<i64>,
) -> Result<(), String> {
    println!("[Commands] update_task called with:");
    println!("  id: {}", id);
    println!("  title: {:?}", title);
    println!("  description: {:?}", description);
    println!("  status: {:?}", status);
    println!("  priority: {:?}", priority);
    println!("  deadline: {:?}", deadline);
    println!("  deadline is_some: {}", deadline.is_some());
    println!("  deadline is_empty: {}", deadline.as_ref().map_or(false, |s| s.is_empty()));
    println!("  completed_at: {:?}", completed_at);
    println!("  project: {:?}", project);
    
    let result = db.update_task(
        id,
        title.as_deref(),
        description.as_deref(),
        status.as_deref(),
        priority.as_deref(),
        deadline.as_deref(),
        completed_at.as_deref(),
        project,
    );
    
    match &result {
        Ok(_) => println!("[Commands] update_task success"),
        Err(e) => println!("[Commands] update_task error: {}", e),
    }
    
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task(
    db: State<'_, Arc<Database>>,
    id: i64,
    soft: Option<bool>,
) -> Result<(), String> {
    db.delete_task(id, soft.unwrap_or(true)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_tasks(
    db: State<'_, Arc<Database>>,
    query: String,
) -> Result<Vec<Task>, String> {
    db.search_tasks(&query).map_err(|e| e.to_string())
}

// TaskProject commands
#[tauri::command]
pub async fn create_task_project(
    db: State<'_, Arc<Database>>,
    name: String,
    icon: String,
    color: Option<String>,
    description: Option<String>,
) -> Result<i64, String> {
    db.create_task_project(&name, &icon, color.as_deref(), description.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_task_projects(db: State<'_, Arc<Database>>) -> Result<Vec<TaskProject>, String> {
    db.get_all_task_projects().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_task_project(
    db: State<'_, Arc<Database>>,
    id: i64,
    name: Option<String>,
    icon: Option<String>,
    color: Option<String>,
    description: Option<String>,
) -> Result<(), String> {
    db.update_task_project(
        id,
        name.as_deref(),
        icon.as_deref(),
        color.as_deref(),
        description.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_task_project(
    db: State<'_, Arc<Database>>,
    id: i64,
) -> Result<(), String> {
    db.delete_task_project(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task_project_by_id(
    db: State<'_, Arc<Database>>,
    id: i64,
) -> Result<Option<TaskProject>, String> {
    db.get_task_project_by_id(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_task_project_stats(
    db: State<'_, Arc<Database>>,
    project_id: i64,
) -> Result<(i32, i32, i32), String> {
    db.get_task_project_stats(project_id).map_err(|e| e.to_string())
}



// ===== 习惯相关命令 =====

#[tauri::command]
pub async fn create_habit(
    db: State<'_, Arc<Database>>,
    name: String,
    description: Option<String>,
    icon: String,
    color: String,
    frequency: String,
    target_count: i64,
) -> Result<i64, String> {
    db.create_habit(
        &name,
        description.as_deref(),
        &icon,
        &color,
        &frequency,
        target_count,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_habits(db: State<'_, Arc<Database>>) -> Result<Vec<Habit>, String> {
    db.get_habits().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_habit_by_id(
    db: State<'_, Arc<Database>>,
    id: i64,
) -> Result<Option<Habit>, String> {
    db.get_habit_by_id(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_habit(
    db: State<'_, Arc<Database>>,
    id: i64,
    name: String,
    description: Option<String>,
    icon: String,
    color: String,
    frequency: String,
    target_count: i64,
    is_active: bool,
) -> Result<(), String> {
    db.update_habit(
        id,
        &name,
        description.as_deref(),
        &icon,
        &color,
        &frequency,
        target_count,
        is_active,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_habit(
    db: State<'_, Arc<Database>>,
    id: i64,
) -> Result<(), String> {
    db.delete_habit(id).map_err(|e| e.to_string())
}

// ===== 习惯记录相关命令 =====

#[tauri::command]
pub async fn record_habit_completion(
    db: State<'_, Arc<Database>>,
    habit_id: i64,
    date: String,
    completed_count: i64,
    notes: Option<String>,
) -> Result<i64, String> {
    db.record_habit_completion(habit_id, &date, completed_count, notes.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_habit_records(
    db: State<'_, Arc<Database>>,
    habit_id: Option<i64>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<Vec<HabitRecord>, String> {
    db.get_habit_records(
        habit_id,
        start_date.as_deref(),
        end_date.as_deref(),
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_habit_record(
    db: State<'_, Arc<Database>>,
    id: i64,
) -> Result<(), String> {
    db.delete_habit_record(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn undo_habit_completion(
    db: State<'_, Arc<Database>>,
    habit_id: i64,
    date: String,
) -> Result<(), String> {
    db.delete_habit_record_by_habit_date(habit_id, &date)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_habit_stats(
    db: State<'_, Arc<Database>>,
    habit_id: i64,
) -> Result<(i64, i64, i64, i64, f64), String> {
    db.get_habit_stats(habit_id).map_err(|e| e.to_string())
}

// ===== AI配置相关命令 =====

// AI提供商配置命令
#[tauri::command]
pub async fn save_ai_provider(
    db: State<'_, Arc<Database>>,
    provider: AiProvider,
) -> Result<(), String> {
    db.save_ai_provider(&provider).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ai_providers(db: State<'_, Arc<Database>>) -> Result<Vec<AiProvider>, String> {
    db.get_ai_providers().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ai_provider(
    db: State<'_, Arc<Database>>,
    provider_name: String,
) -> Result<Option<AiProvider>, String> {
    db.get_ai_provider(&provider_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_ai_provider(
    db: State<'_, Arc<Database>>,
    provider_name: String,
) -> Result<(), String> {
    db.delete_ai_provider(&provider_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_current_ai_provider(
    db: State<'_, Arc<Database>>,
    provider_name: String,
) -> Result<(), String> {
    db.set_current_ai_provider(&provider_name).map_err(|e| e.to_string())
}

// AI智能体配置命令
#[tauri::command]
pub async fn save_ai_agent(
    db: State<'_, Arc<Database>>,
    agent: AiAgent,
) -> Result<(), String> {
    db.save_ai_agent(&agent).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ai_agents(db: State<'_, Arc<Database>>) -> Result<Vec<AiAgent>, String> {
    db.get_ai_agents().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ai_agent(
    db: State<'_, Arc<Database>>,
    agent_id: String,
) -> Result<Option<AiAgent>, String> {
    db.get_ai_agent(&agent_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_ai_agent(
    db: State<'_, Arc<Database>>,
    agent_id: String,
) -> Result<(), String> {
    db.delete_ai_agent(&agent_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_current_ai_agent(
    db: State<'_, Arc<Database>>,
    agent_id: String,
) -> Result<(), String> {
    db.set_current_ai_agent(&agent_id).map_err(|e| e.to_string())
}

// 数据清理命令
#[tauri::command]
pub async fn cleanup_unnamed_pages(
    db: State<'_, Arc<Database>>
) -> Result<u32, String> {
    db.cleanup_unnamed_pages().map_err(|e| e.to_string())
}