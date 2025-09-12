use crate::database::{Database, AiConversation, AiMessage};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveConversationRequest {
    pub id: String,
    pub title: String,
    pub provider: String,
    pub model: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveMessageRequest {
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
pub struct ConversationListResponse {
    pub conversations: Vec<AiConversation>,
    pub total: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConversationDetailResponse {
    pub conversation: AiConversation,
    pub messages: Vec<AiMessage>,
}

#[tauri::command]
pub async fn save_ai_conversation(
    request: SaveConversationRequest,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    let conversation = AiConversation {
        id: request.id,
        title: request.title,
        provider: request.provider,
        model: request.model,
        created_at: request.created_at,
        updated_at: request.updated_at,
    };
    
    db.save_ai_conversation(&conversation)
        .map_err(|e| format!("Failed to save conversation: {}", e))
}

#[tauri::command]
pub async fn save_ai_message(
    request: SaveMessageRequest,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    let message = AiMessage {
        id: request.id,
        conversation_id: request.conversation_id,
        role: request.role,
        content: request.content,
        provider: request.provider,
        model: request.model,
        error: request.error,
        timestamp: request.timestamp,
        created_at: request.created_at,
    };
    
    db.save_ai_message(&message)
        .map_err(|e| format!("Failed to save message: {}", e))
}

#[tauri::command]
pub async fn get_ai_conversations(
    limit: Option<i32>,
    db: State<'_, Arc<Database>>,
) -> Result<ConversationListResponse, String> {
    let conversations = db.get_ai_conversations(limit)
        .map_err(|e| format!("Failed to get conversations: {}", e))?;
    
    let total = conversations.len();
    
    Ok(ConversationListResponse {
        conversations,
        total,
    })
}

#[tauri::command]
pub async fn get_ai_conversation_detail(
    conversation_id: String,
    db: State<'_, Arc<Database>>,
) -> Result<Option<ConversationDetailResponse>, String> {
    // 获取对话信息
    let conversations = db.get_ai_conversations(None)
        .map_err(|e| format!("Failed to get conversations: {}", e))?;
    
    let conversation = conversations.into_iter()
        .find(|c| c.id == conversation_id);
    
    if let Some(conversation) = conversation {
        // 获取消息列表
        let messages = db.get_ai_messages(&conversation_id)
            .map_err(|e| format!("Failed to get messages: {}", e))?;
        
        Ok(Some(ConversationDetailResponse {
            conversation,
            messages,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn delete_ai_conversation(
    conversation_id: String,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    db.delete_ai_conversation(&conversation_id)
        .map_err(|e| format!("Failed to delete conversation: {}", e))
}

#[tauri::command]
pub async fn update_ai_conversation_title(
    conversation_id: String,
    title: String,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    db.update_ai_conversation_title(&conversation_id, &title)
        .map_err(|e| format!("Failed to update conversation title: {}", e))
}

#[tauri::command]
pub async fn search_ai_conversations(
    query: String,
    limit: Option<i32>,
    db: State<'_, Arc<Database>>,
) -> Result<ConversationListResponse, String> {
    let conversations = db.search_ai_conversations(&query, limit)
        .map_err(|e| format!("Failed to search conversations: {}", e))?;
    
    let total = conversations.len();
    
    Ok(ConversationListResponse {
        conversations,
        total,
    })
}

#[tauri::command]
pub async fn cleanup_old_ai_conversations(
    days_to_keep: Option<i32>,
    db: State<'_, Arc<Database>>,
) -> Result<usize, String> {
    let days = days_to_keep.unwrap_or(30);
    db.cleanup_old_ai_conversations(days)
        .map_err(|e| format!("Failed to cleanup old conversations: {}", e))
}

// 批量保存对话和消息的便利方法
#[tauri::command]
pub async fn sync_ai_conversation_with_messages(
    conversation: SaveConversationRequest,
    messages: Vec<SaveMessageRequest>,
    db: State<'_, Arc<Database>>,
) -> Result<(), String> {
    // 保存对话
    save_ai_conversation(conversation, db.clone()).await?;
    
    // 保存所有消息
    for message in messages {
        save_ai_message(message, db.clone()).await?;
    }
    
    Ok(())
}