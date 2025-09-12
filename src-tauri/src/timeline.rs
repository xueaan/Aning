use std::fs;
use std::path::PathBuf;
use chrono::{Datelike, NaiveDate};
use tauri::{AppHandle, Manager};

/// 获取时光记存储目录
fn get_timeline_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let timeline_dir = app_dir.join("timeline");
    
    // 确保目录存在
    if !timeline_dir.exists() {
        fs::create_dir_all(&timeline_dir)
            .map_err(|e| format!("Failed to create timeline directory: {}", e))?;
    }
    
    Ok(timeline_dir)
}

/// 获取某天的笔记内容和元数据
#[tauri::command]
pub async fn get_daily_note(app_handle: AppHandle, date: String) -> Result<String, String> {
    let timeline_dir = get_timeline_dir(&app_handle)?;
    let file_path = timeline_dir.join(format!("{}.md", date));
    
    if file_path.exists() {
        fs::read_to_string(file_path)
            .map_err(|e| format!("Failed to read file: {}", e))
    } else {
        // 文件不存在，返回空内容
        Ok(String::new())
    }
}

/// 追加内容到某天的笔记
#[tauri::command]
pub async fn append_to_daily(
    app_handle: AppHandle, 
    date: String, 
    content: String,
    weather: Option<String>,
    mood: Option<String>
) -> Result<(), String> {
    let timeline_dir = get_timeline_dir(&app_handle)?;
    let file_path = timeline_dir.join(format!("{}.md", date));
    
    // 如果文件不存在，创建带有 front matter 的新文件
    if !file_path.exists() {
        let weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        
        // 解析日期以获取星期几
        let naive_date = NaiveDate::parse_from_str(&date, "%Y-%m-%d")
            .map_err(|e| format!("Failed to parse date: {}", e))?;
        let weekday = weekdays[naive_date.weekday().num_days_from_sunday() as usize];
        
        let mut header = format!("---\ndate: {}\nday: {}\n", date, weekday);
        
        // 添加天气和心情
        if let Some(w) = weather {
            header.push_str(&format!("weather: {}\n", w));
        }
        if let Some(m) = mood {
            header.push_str(&format!("mood: {}\n", m));
        }
        
        header.push_str("---\n");
        
        fs::write(&file_path, header)
            .map_err(|e| format!("Failed to create file: {}", e))?;
    }
    
    // 追加内容
    use std::fs::OpenOptions;
    use std::io::Write;
    
    let mut file = OpenOptions::new()
        .append(true)
        .open(&file_path)
        .map_err(|e| format!("Failed to open file: {}", e))?;
    
    file.write_all(content.as_bytes())
        .map_err(|e| format!("Failed to write to file: {}", e))?;
    
    Ok(())
}

/// 获取所有日期列表
#[tauri::command]
pub async fn get_timeline_dates(app_handle: AppHandle) -> Result<Vec<String>, String> {
    let timeline_dir = get_timeline_dir(&app_handle)?;
    
    let mut dates = Vec::new();
    
    if let Ok(entries) = fs::read_dir(timeline_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if let Some(file_name) = entry.file_name().to_str() {
                    if file_name.ends_with(".md") {
                        let date = file_name.trim_end_matches(".md");
                        dates.push(date.to_string());
                    }
                }
            }
        }
    }
    
    // 按日期降序排序
    dates.sort_by(|a, b| b.cmp(a));
    
    Ok(dates)
}

/// 更新某天的天气和心情
#[tauri::command]
pub async fn update_daily_metadata(
    app_handle: AppHandle,
    date: String,
    weather: Option<String>,
    mood: Option<String>
) -> Result<(), String> {
    let timeline_dir = get_timeline_dir(&app_handle)?;
    let file_path = timeline_dir.join(format!("{}.md", date));
    
    if !file_path.exists() {
        // 如果文件不存在，创建新文件
        let weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
        let naive_date = NaiveDate::parse_from_str(&date, "%Y-%m-%d")
            .map_err(|e| format!("Failed to parse date: {}", e))?;
        let weekday = weekdays[naive_date.weekday().num_days_from_sunday() as usize];
        
        let mut header = format!("---\ndate: {}\nday: {}\n", date, weekday);
        if let Some(w) = weather {
            header.push_str(&format!("weather: {}\n", w));
        }
        if let Some(m) = mood {
            header.push_str(&format!("mood: {}\n", m));
        }
        header.push_str("---\n");
        
        fs::write(&file_path, header)
            .map_err(|e| format!("Failed to create file: {}", e))?;
    } else {
        // 读取现有文件并更新 frontmatter
        let content = fs::read_to_string(&file_path)
            .map_err(|e| format!("Failed to read file: {}", e))?;
        
        let lines: Vec<&str> = content.lines().collect();
        let mut new_lines = Vec::new();
        let mut in_front_matter = false;
        let mut front_matter_end = false;
        let mut has_weather = false;
        let mut has_mood = false;
        
        for (i, line) in lines.iter().enumerate() {
            if line == &"---" && i == 0 {
                in_front_matter = true;
                new_lines.push(line.to_string());
                continue;
            }
            
            if line == &"---" && in_front_matter && !front_matter_end {
                // 在 frontmatter 结束前添加缺失的字段
                if !has_weather && weather.is_some() {
                    new_lines.push(format!("weather: {}", weather.as_ref().unwrap()));
                }
                if !has_mood && mood.is_some() {
                    new_lines.push(format!("mood: {}", mood.as_ref().unwrap()));
                }
                front_matter_end = true;
                new_lines.push(line.to_string());
                continue;
            }
            
            if in_front_matter && !front_matter_end {
                // 在 frontmatter 中更新或跳过天气和心情
                if line.starts_with("weather:") {
                    has_weather = true;
                    if let Some(w) = &weather {
                        new_lines.push(format!("weather: {}", w));
                    } else {
                        new_lines.push(line.to_string());
                    }
                } else if line.starts_with("mood:") {
                    has_mood = true;
                    if let Some(m) = &mood {
                        new_lines.push(format!("mood: {}", m));
                    } else {
                        new_lines.push(line.to_string());
                    }
                } else {
                    new_lines.push(line.to_string());
                }
            } else {
                new_lines.push(line.to_string());
            }
        }
        
        // 写回文件
        let new_content = new_lines.join("\n");
        fs::write(&file_path, new_content)
            .map_err(|e| format!("Failed to write file: {}", e))?;
    }
    
    Ok(())
}

/// 删除某天指定时间的条目
#[tauri::command]
pub async fn delete_timeline_entry(app_handle: AppHandle, date: String, time: String) -> Result<(), String> {
    let timeline_dir = get_timeline_dir(&app_handle)?;
    let file_path = timeline_dir.join(format!("{}.md", date));
    
    if !file_path.exists() {
        return Err("File not found".to_string());
    }
    
    // 读取文件内容
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let lines: Vec<&str> = content.lines().collect();
    let mut new_lines = Vec::new();
    let mut skip_until_next_header = false;
    let mut in_front_matter = false;
    
    let target_header = format!("## {}", time);
    
    for line in lines {
        // 处理 front matter
        if line.starts_with("---") {
            in_front_matter = !in_front_matter;
            new_lines.push(line);
            continue;
        }
        
        if in_front_matter {
            new_lines.push(line);
            continue;
        }
        
        // 检测目标时间标题
        if line == target_header {
            skip_until_next_header = true;
            continue;
        }
        
        // 检测新的时间标题
        if line.starts_with("## ") && skip_until_next_header {
            skip_until_next_header = false;
        }
        
        // 如果不在跳过状态，添加到新内容
        if !skip_until_next_header {
            new_lines.push(line);
        }
    }
    
    // 写回文件
    let new_content = new_lines.join("\n");
    fs::write(&file_path, new_content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(())
}