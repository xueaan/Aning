use serde::{Deserialize, Serialize};
use reqwest;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiChatMessage {
    pub role: String,
    pub content: String,
    pub images: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiChatRequest {
    pub provider: String,
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub messages: Vec<AiChatMessage>,
    pub temperature: f32,
    pub max_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiChatResponse {
    pub success: bool,
    pub content: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiStreamChunk {
    pub request_id: String,
    pub content: String,
    pub finished: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiStreamRequest {
    pub request_id: String,
    pub provider: String,
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub messages: Vec<AiChatMessage>,
    pub temperature: f32,
    pub max_tokens: u32,
}

#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    content: Option<Vec<ClaudeContent>>,
    #[allow(dead_code)]
    id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ClaudeContent {
    #[serde(rename = "type")]
    content_type: String,
    text: String,
}

#[derive(Debug, Deserialize)]
struct ClaudeStreamResponse {
    #[serde(rename = "type")]
    type_: String,
    delta: Option<ClaudeStreamDelta>,
}

#[derive(Debug, Deserialize)]
struct ClaudeStreamDelta {
    text: Option<String>,
}

// 从 base64 数据URL中提取MIME类型
fn get_image_mime_type(data_url: &str) -> String {
    if data_url.starts_with("data:") {
        if let Some(end) = data_url.find(";base64,") {
            let mime_part = &data_url[5..end]; // 跳过 "data:" 部分
            return mime_part.to_string();
        }
    }
    "image/jpeg".to_string() // 默认类型
}

// 从 base64 数据URL中提取纯base64数据
fn extract_base64_data(data_url: &str) -> String {
    if let Some(start) = data_url.find(";base64,") {
        return data_url[start + 8..].to_string(); // 跳过 ";base64," 部分
    }
    data_url.to_string() // 如果不是标准格式，返回原始数据
}

#[derive(Debug, Deserialize)]
struct DeepSeekResponse {
    choices: Option<Vec<DeepSeekChoice>>,
    #[allow(dead_code)]
    id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeepSeekChoice {
    message: Option<DeepSeekMessage>,
    delta: Option<DeepSeekDelta>,
    #[allow(dead_code)]
    finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DeepSeekMessage {
    #[allow(dead_code)]
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct DeepSeekDelta {
    #[allow(dead_code)]
    role: Option<String>,
    content: Option<String>,
}

#[tauri::command]
pub async fn send_ai_chat(request: AiChatRequest) -> Result<AiChatResponse, String> {
    let start_time = std::time::Instant::now();
    
    match request.provider.as_str() {
        "claude" => send_claude_chat(request, start_time).await,
        "deepseek" => send_deepseek_chat(request, start_time).await,
        _ => Ok(AiChatResponse {
            success: false,
            content: None,
            message: Some("不支持的 AI 提供商".to_string()),
        })
    }
}

#[tauri::command]
pub async fn send_ai_chat_stream(app_handle: AppHandle, request: AiStreamRequest) -> Result<(), String> {
    let request_id = request.request_id.clone();

    println!("🚀 [Tauri命令] send_ai_chat_stream 开始执行");
    println!("   request_id: {}", request_id);
    println!("   provider: {}", request.provider);
    println!("   model: {}", request.model);
    println!("   base_url: {}", request.base_url);
    println!("   messages_count: {}", request.messages.len());
    println!("   temperature: {}", request.temperature);
    println!("   max_tokens: {}", request.max_tokens);

    match request.provider.as_str() {
        "deepseek" => {
            if let Err(e) = send_deepseek_chat_stream(app_handle.clone(), request).await {
                // 发送错误事件
                let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                    request_id,
                    content: String::new(),
                    finished: true,
                    error: Some(e),
                });
            }
        },
        "claude" => {
            if let Err(e) = send_claude_chat_stream(app_handle.clone(), request).await {
                // 发送错误事件
                let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                    request_id,
                    content: String::new(),
                    finished: true,
                    error: Some(e),
                });
            }
        },
        _ => {
            let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                request_id,
                content: String::new(),
                finished: true,
                error: Some("不支持的 AI 提供商".to_string()),
            });
        }
    }
    
    Ok(())
}

async fn send_claude_chat(request: AiChatRequest, start_time: std::time::Instant) -> Result<AiChatResponse, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;
    let url = format!("{}/v1/messages", request.base_url);
    
    // 构建 Claude API 请求
    let claude_messages: Vec<serde_json::Value> = request.messages
        .iter()
        .map(|msg| {
            if let Some(images) = &msg.images {
                if !images.is_empty() {
                    // 构建多模态内容
                    let mut content_array: Vec<serde_json::Value> = images
                        .iter()
                        .map(|image| serde_json::json!({
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": get_image_mime_type(image),
                                "data": extract_base64_data(image)
                            }
                        }))
                        .collect();
                    
                    // 如果有文字内容，添加到数组中
                    if !msg.content.trim().is_empty() {
                        content_array.push(serde_json::json!({
                            "type": "text",
                            "text": msg.content
                        }));
                    }
                    
                    serde_json::json!({
                        "role": msg.role,
                        "content": content_array
                    })
                } else {
                    serde_json::json!({
                        "role": msg.role,
                        "content": msg.content
                    })
                }
            } else {
                serde_json::json!({
                    "role": msg.role,
                    "content": msg.content
                })
            }
        })
        .collect();
    
    let claude_request = serde_json::json!({
        "model": request.model,
        "max_tokens": request.max_tokens,
        "messages": claude_messages,
        "temperature": request.temperature
    });
    
    match client
        .post(&url)
        .json(&claude_request)
        .header("Content-Type", "application/json")
        .header("x-api-key", &request.api_key)
        .header("anthropic-version", "2023-06-01")
        .send()
        .await
    {
        Ok(response) => {
            let latency = start_time.elapsed().as_millis() as u64;
            let status = response.status();
            
            if status.is_success() {
                match response.json::<ClaudeResponse>().await {
                    Ok(claude_response) => {
                        if let Some(content_array) = claude_response.content {
                            if let Some(first_content) = content_array.first() {
                                if first_content.content_type == "text" {
                                    return Ok(AiChatResponse {
                                        success: true,
                                        content: Some(first_content.text.clone()),
                                        message: Some(format!("响应成功，延迟: {}ms", latency)),
                                    });
                                }
                            }
                        }
                        
                        Ok(AiChatResponse {
                            success: false,
                            content: None,
                            message: Some("响应格式异常".to_string()),
                        })
                    }
                    Err(e) => Ok(AiChatResponse {
                        success: false,
                        content: None,
                        message: Some(format!("响应解析失败: {}", e)),
                    })
                }
            } else {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                Ok(AiChatResponse {
                    success: false,
                    content: None,
                    message: Some(format!("HTTP {}: {}", status, error_text)),
                })
            }
        }
        Err(e) => {
            let error_message = if e.is_timeout() {
                "请求超时，请检查网络连接".to_string()
            } else if e.is_connect() {
                "连接失败，请检查 API 地址".to_string()
            } else {
                format!("网络错误: {}", e)
            };
            
            Ok(AiChatResponse {
                success: false,
                content: None,
                message: Some(error_message),
            })
        }
    }
}

async fn send_claude_chat_stream(app_handle: AppHandle, request: AiStreamRequest) -> Result<(), String> {
    println!("🔵 [Claude] send_claude_chat_stream 开始执行");
    println!("   request_id: {}", request.request_id);
    println!("   base_url: {}", request.base_url);
    println!("   model: {}", request.model);
    println!("   messages_count: {}", request.messages.len());
    println!("   max_tokens: {}", request.max_tokens);
    println!("   temperature: {}", request.temperature);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .build()
        .map_err(|e| {
            let error = format!("创建HTTP客户端失败: {}", e);
            println!("❌ [Claude] {}", error);
            error
        })?;

    let url = format!("{}/v1/messages", request.base_url);
    println!("🌐 [Claude] 请求URL: {}", url);
    let request_id = request.request_id.clone();
    
    // 构建 Claude API 请求 - 分离 system 消息
    let mut system_message: Option<String> = None;
    let mut claude_messages: Vec<serde_json::Value> = Vec::new();

    for msg in &request.messages {
        if msg.role == "system" {
            // 提取 system 消息作为顶级参数
            system_message = Some(msg.content.clone());
            println!("🔧 [Claude] 提取system消息: {}", msg.content);
        } else {
            // 处理非 system 消息
            if let Some(images) = &msg.images {
                if !images.is_empty() {
                    // 构建多模态内容
                    let mut content_array: Vec<serde_json::Value> = images
                        .iter()
                        .map(|image| serde_json::json!({
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": get_image_mime_type(image),
                                "data": extract_base64_data(image)
                            }
                        }))
                        .collect();

                    // 如果有文字内容，添加到数组中
                    if !msg.content.trim().is_empty() {
                        content_array.push(serde_json::json!({
                            "type": "text",
                            "text": msg.content
                        }));
                    }

                    claude_messages.push(serde_json::json!({
                        "role": msg.role,
                        "content": content_array
                    }));
                } else {
                    claude_messages.push(serde_json::json!({
                        "role": msg.role,
                        "content": msg.content
                    }));
                }
            } else {
                claude_messages.push(serde_json::json!({
                    "role": msg.role,
                    "content": msg.content
                }));
            }
        }
    }

    // 构建请求体，system 消息作为顶级参数
    let mut claude_request = serde_json::json!({
        "model": request.model,
        "max_tokens": request.max_tokens,
        "messages": claude_messages,
        "temperature": request.temperature,
        "stream": true
    });

    // 如果有 system 消息，添加为顶级参数
    if let Some(system_content) = system_message {
        claude_request["system"] = serde_json::Value::String(system_content);
        println!("✅ [Claude] 已将system消息设置为顶级参数");
    }

    println!("📝 [Claude] 构建请求体完成");
    println!("   请求体大小: {} bytes", serde_json::to_string(&claude_request).unwrap_or_default().len());
    println!("   API密钥前缀: {}...", &request.api_key.chars().take(8).collect::<String>());

    println!("🚀 [Claude] 开始发送HTTP请求");
    let response = client
        .post(&url)
        .json(&claude_request)
        .header("Content-Type", "application/json")
        .header("x-api-key", &request.api_key)
        .header("anthropic-version", "2023-06-01")
        .send()
        .await
        .map_err(|e| {
            let error = format!("请求发送失败: {}", e);
            println!("❌ [Claude] {}", error);
            error
        })?;

    println!("📡 [Claude] 收到HTTP响应");
    println!("   状态码: {}", response.status());
    println!("   响应头: {:?}", response.headers());

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        let error = format!("HTTP {}: {}", status, error_text);
        println!("❌ [Claude] 请求失败: {}", error);
        return Err(error);
    }

    // 处理流式响应
    println!("📡 [Claude] 开始处理流式响应");
    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut chunk_count = 0;
    let mut total_content = String::new();

    while let Some(chunk) = stream.next().await {
        chunk_count += 1;
        match chunk {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes);
                println!("📦 [Claude] 收到第{}个数据块, 大小: {} bytes", chunk_count, bytes.len());
                println!("📦 [Claude] 原始数据内容: {:?}", text);
                buffer.push_str(&text);

                // 处理完整的行
                while let Some(line_end) = buffer.find('\n') {
                    let line = buffer[..line_end].trim().to_string();
                    buffer.drain(0..=line_end);

                    println!("🔍 [Claude] 处理行: {:?}", line);

                    if line.starts_with("event: error") {
                        println!("❌ [Claude] 检测到错误事件");
                        continue;
                    } else if line.starts_with("data: ") {
                        let data = &line[6..]; // 移除"data: "前缀

                        // 检查是否是错误数据
                        if data.contains("\"error\":") {
                            println!("❌ [Claude] 检测到错误数据: {}", data);
                            // 解析错误信息并发送给前端
                            if let Ok(error_data) = serde_json::from_str::<serde_json::Value>(data) {
                                let error_msg = error_data.get("error")
                                    .and_then(|e| e.as_str())
                                    .unwrap_or("Claude API错误");
                                let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                                    request_id: request_id.clone(),
                                    content: String::new(),
                                    finished: true,
                                    error: Some(error_msg.to_string()),
                                });
                                return Ok(());
                            }
                        }

                        if data == "[DONE]" {
                            // 发送完成事件
                            let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                                request_id: request_id.clone(),
                                content: String::new(),
                                finished: true,
                                error: None,
                            });
                            return Ok(());
                        }
                        
                        // 解析JSON数据并发送chunk
                        if let Ok(chunk_response) = serde_json::from_str::<ClaudeStreamResponse>(data) {
                            println!("🔄 [Claude] 解析JSON成功, 类型: {}", chunk_response.type_);
                            if chunk_response.type_ == "content_block_delta" {
                                if let Some(delta) = chunk_response.delta {
                                    if let Some(text) = delta.text {
                                        println!("💬 [Claude] 发送内容块: {:?}", text);
                                        total_content.push_str(&text);
                                        // 发送内容chunk
                                        let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                                            request_id: request_id.clone(),
                                            content: text,
                                            finished: false,
                                            error: None,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                return Err(format!("流式读取错误: {}", e));
            }
        }
    }
    
    // 如果没有收到[DONE]信号，发送完成事件
    let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
        request_id,
        content: String::new(),
        finished: true,
        error: None,
    });
    
    Ok(())
}

async fn send_deepseek_chat_stream(app_handle: AppHandle, request: AiStreamRequest) -> Result<(), String> {
    println!("🤖 [DeepSeek] send_deepseek_chat_stream 开始执行");
    println!("   request_id: {}", request.request_id);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;

    let url = format!("{}/chat/completions", request.base_url);
    let request_id = request.request_id.clone();

    println!("🌐 [DeepSeek] API URL: {}", url);
    
    // 检查是否有图片 - DeepSeek不支持图片
    for msg in &request.messages {
        if let Some(images) = &msg.images {
            if !images.is_empty() {
                let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                    request_id: request_id.clone(),
                    content: String::new(),
                    finished: true,
                    error: Some("DeepSeek 模型暂不支持图片输入，请使用 Claude 模型".to_string())
                });
                return Ok(());
            }
        }
    }
    
    // 构建 DeepSeek API 请求
    let deepseek_messages: Vec<serde_json::Value> = request.messages
        .iter()
        .map(|msg| serde_json::json!({
            "role": msg.role,
            "content": msg.content
        }))
        .collect();
    
    let deepseek_request = serde_json::json!({
        "model": request.model,
        "messages": deepseek_messages,
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "stream": true
    });
    
    let response = client
        .post(&url)
        .json(&deepseek_request)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", request.api_key))
        .send()
        .await
        .map_err(|e| format!("请求发送失败: {}", e))?;
        
    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("HTTP {}: {}", status, error_text));
    }
    
    // 处理流式响应
    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    
    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes);
                buffer.push_str(&text);
                
                // 处理完整的行
                while let Some(line_end) = buffer.find('\n') {
                    let line = buffer[..line_end].trim().to_string();
                    buffer.drain(0..=line_end);
                    
                    if line.starts_with("data: ") {
                        let data = &line[6..]; // 移除"data: "前缀
                        
                        if data == "[DONE]" {
                            // 发送完成事件
                            let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                                request_id: request_id.clone(),
                                content: String::new(),
                                finished: true,
                                error: None,
                            });
                            return Ok(());
                        }
                        
                        // 解析JSON数据并发送chunk
                        if let Ok(chunk_response) = serde_json::from_str::<DeepSeekResponse>(data) {
                            if let Some(choices) = chunk_response.choices {
                                if let Some(choice) = choices.first() {
                                    if let Some(delta) = &choice.delta {
                                        if let Some(content) = &delta.content {
                                            // 发送内容chunk
                                            let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
                                                request_id: request_id.clone(),
                                                content: content.clone(),
                                                finished: false,
                                                error: None,
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                return Err(format!("流式读取错误: {}", e));
            }
        }
    }
    
    // 如果没有收到[DONE]信号，发送完成事件
    let _ = app_handle.emit("ai-stream-chunk", AiStreamChunk {
        request_id,
        content: String::new(),
        finished: true,
        error: None,
    });
    
    Ok(())
}

async fn send_deepseek_chat(request: AiChatRequest, start_time: std::time::Instant) -> Result<AiChatResponse, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;
    let url = format!("{}/chat/completions", request.base_url);
    
    // 检查是否有图片 - DeepSeek不支持图片
    for msg in &request.messages {
        if let Some(images) = &msg.images {
            if !images.is_empty() {
                return Err("DeepSeek 模型暂不支持图片输入，请使用 Claude 模型".to_string());
            }
        }
    }
    
    // 构建 DeepSeek API 请求
    let deepseek_messages: Vec<serde_json::Value> = request.messages
        .iter()
        .map(|msg| serde_json::json!({
            "role": msg.role,
            "content": msg.content
        }))
        .collect();
    
    let deepseek_request = serde_json::json!({
        "model": request.model,
        "messages": deepseek_messages,
        "temperature": request.temperature,
        "max_tokens": request.max_tokens,
        "stream": false
    });
    
    match client
        .post(&url)
        .json(&deepseek_request)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", request.api_key))
        .send()
        .await
    {
        Ok(response) => {
            let latency = start_time.elapsed().as_millis() as u64;
            let status = response.status();
            
            if status.is_success() {
                match response.json::<DeepSeekResponse>().await {
                    Ok(deepseek_response) => {
                        if let Some(choices) = deepseek_response.choices {
                            if let Some(choice) = choices.first() {
                                if let Some(message) = &choice.message {
                                    return Ok(AiChatResponse {
                                        success: true,
                                        content: Some(message.content.clone()),
                                        message: Some(format!("响应成功，延迟: {}ms", latency)),
                                    });
                                }
                            }
                        }
                        
                        Ok(AiChatResponse {
                            success: false,
                            content: None,
                            message: Some("响应格式异常".to_string()),
                        })
                    }
                    Err(e) => Ok(AiChatResponse {
                        success: false,
                        content: None,
                        message: Some(format!("响应解析失败: {}", e)),
                    })
                }
            } else {
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                Ok(AiChatResponse {
                    success: false,
                    content: None,
                    message: Some(format!("HTTP {}: {}", status, error_text)),
                })
            }
        }
        Err(e) => {
            let error_message = if e.is_timeout() {
                "请求超时，请检查网络连接".to_string()
            } else if e.is_connect() {
                "连接失败，请检查 API 地址".to_string()
            } else {
                format!("网络错误: {}", e)
            };
            
            Ok(AiChatResponse {
                success: false,
                content: None,
                message: Some(error_message),
            })
        }
    }
}