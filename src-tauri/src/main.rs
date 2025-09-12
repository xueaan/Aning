// Cross-platform configuration
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod timeline;
mod database;
mod commands;
mod ai_test;
mod ai_chat;
mod ai_commands;
mod crypto;
mod password_commands;
mod knowledge;
mod cardbox_commands;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WindowEvent,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // 数据库初始化
            match database::Database::new(&app.handle()) {
                Ok(db) => {
                    let db = std::sync::Arc::new(db);
                    app.manage(db);
                }
                Err(e) => {
                    eprintln!("数据库初始化失败: {}", e);
                    return Err(e.into());
                }
            }
            
            // 菜单和托盘
            
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "隐藏", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "显示", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&show, &hide, &quit])?;
            
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;
            
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            timeline::get_daily_note,
            timeline::append_to_daily,
            timeline::get_timeline_dates,
            timeline::delete_timeline_entry,
            timeline::update_daily_metadata,
            // 数据库命令
            commands::db_init,
            commands::get_db_path,
            commands::get_db_stats,
            commands::create_timeline_entry,
            commands::get_timeline_by_date,
            commands::get_recent_timeline,
            commands::db_delete_timeline_entry,
            commands::migrate_markdown_to_db,
            // 知识库命令
            commands::create_knowledge_base,
            commands::get_knowledge_bases,
            commands::update_knowledge_base,
            commands::delete_knowledge_base,
            commands::search_knowledge_bases,
            // 页面命令
            commands::create_page,
            commands::get_pages,
            commands::get_all_pages,
            commands::get_page_by_id,
            commands::update_page,
            commands::delete_page,
            commands::search_pages,
            commands::move_page,
            commands::get_page_breadcrumb,
            // 块命令
            commands::create_block,
            commands::get_blocks,
            commands::get_block_by_id,
            commands::update_block,
            commands::delete_block,
            commands::search_blocks,
            commands::move_block,
            // AI 测试命令
            ai_test::test_ai_connection,
            // AI 聊天命令
            ai_chat::send_ai_chat,
            ai_chat::send_ai_chat_stream,
            // AI 对话管理命令
            ai_commands::save_ai_conversation,
            ai_commands::save_ai_message,
            ai_commands::get_ai_conversations,
            ai_commands::get_ai_conversation_detail,
            ai_commands::delete_ai_conversation,
            ai_commands::update_ai_conversation_title,
            ai_commands::search_ai_conversations,
            ai_commands::cleanup_old_ai_conversations,
            ai_commands::sync_ai_conversation_with_messages,
            // 密码管理命令
            password_commands::get_password_categories,
            password_commands::create_password_category,
            password_commands::update_password_category,
            password_commands::delete_password_category,
            password_commands::get_password_entries,
            password_commands::get_password_entries_by_category,
            password_commands::create_password_entry,
            password_commands::update_password_entry,
            password_commands::delete_password_entry,
            password_commands::get_decrypted_password,
            password_commands::search_password_entries,
            password_commands::generate_password,
            password_commands::check_password_strength,
            password_commands::get_favorite_password_entries,
            password_commands::test_password_connection,
            // 卡片盒命令
            cardbox_commands::get_card_boxes,
            cardbox_commands::create_card_box,
            cardbox_commands::update_card_box,
            cardbox_commands::delete_card_box,
            cardbox_commands::get_cards,
            cardbox_commands::create_card,
            cardbox_commands::update_card,
            cardbox_commands::delete_card,
            cardbox_commands::move_card,
            cardbox_commands::search_cards,
            // TaskBox 任务管理命令
            commands::create_task,
            commands::get_all_tasks,
            commands::get_tasks_by_status,
            commands::get_tasks_by_project,
            commands::get_tasks_by_date_range,
            commands::update_task,
            commands::delete_task,
            commands::search_tasks,
            commands::create_task_project,
            commands::get_all_task_projects,
            commands::update_task_project,
            commands::delete_task_project,
            commands::get_task_project_by_id,
            commands::get_task_project_stats,
            // 习惯相关命令
            commands::create_habit,
            commands::get_habits,
            commands::get_habit_by_id,
            commands::update_habit,
            commands::delete_habit,
            commands::record_habit_completion,
            commands::get_habit_records,
            commands::delete_habit_record,
            commands::undo_habit_completion,
            commands::get_habit_stats,
            // AI配置相关命令
            commands::save_ai_provider,
            commands::get_ai_providers,
            commands::get_ai_provider,
            commands::delete_ai_provider,
            commands::set_current_ai_provider,
            commands::save_ai_agent,
            commands::get_ai_agents,
            commands::get_ai_agent,
            commands::delete_ai_agent,
            commands::set_current_ai_agent,
            // Novel 知识库命令暂时注释，待数据库修复后启用
            // knowledge::save_page_content,
            // knowledge::get_page_content,
            // knowledge::upload_attachment,
            // knowledge::get_page_versions,
            // knowledge::get_page_attachments,
            // Context dialogue system commands
            knowledge::search_knowledge_pages,
            knowledge::get_recent_pages,
            knowledge::get_pending_tasks,
            knowledge::get_tasks_by_filter,
            knowledge::get_page_content_for_context,
            knowledge::get_task_content_for_context,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}