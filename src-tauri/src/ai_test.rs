use serde::{Deserialize, Serialize};
use reqwest;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiTestRequest {
    pub provider: String,
    pub base_url: String,
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiTestResult {
    pub success: bool,
    pub message: String,
    pub latency: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ClaudeMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<ClaudeMessage>,
}

#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    id: Option<String>,
    content: Option<serde_json::Value>,
}

#[tauri::command]
pub async fn test_ai_connection(request: AiTestRequest) -> Result<AiTestResult, String> {
    let start_time = std::time::Instant::now();
    
    match request.provider.as_str() {
        "claude" => test_claude_connection(request, start_time).await,
        "deepseek" => test_deepseek_connection(request, start_time).await,
        _ => Ok(AiTestResult {
            success: false,
            message: "不支持的 AI 提供商".to_string(),
            latency: None,
        })
    }
}

async fn test_claude_connection(request: AiTestRequest, start_time: std::time::Instant) -> Result<AiTestResult, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;
    let url = format!("{}/v1/messages", request.base_url);
    
    let test_request = ClaudeRequest {
        model: request.model,
        max_tokens: 10,
        messages: vec![ClaudeMessage {
            role: "user".to_string(),
            content: "Hi".to_string(),
        }],
    };
    
    let mut headers = HashMap::new();
    headers.insert("Content-Type", "application/json");
    headers.insert("x-api-key", &request.api_key);
    headers.insert("anthropic-version", "2023-06-01");
    
    match client
        .post(&url)
        .json(&test_request)
        .header("Content-Type", "application/json")
        .header("x-api-key", &request.api_key)
        .header("anthropic-version", "2023-06-01")
        .send()
        .await
    {
        Ok(response) => {
            let latency = start_time.elapsed().as_millis() as u64;
            
            if response.status().is_success() {
                match response.json::<ClaudeResponse>().await {
                    Ok(claude_response) => {
                        if claude_response.id.is_some() || claude_response.content.is_some() {
                            Ok(AiTestResult {
                                success: true,
                                message: format!("连接成功！延迟: {}ms，Claude API 响应正常", latency),
                                latency: Some(latency),
                            })
                        } else {
                            Ok(AiTestResult {
                                success: false,
                                message: "连接成功但响应格式异常".to_string(),
                                latency: Some(latency),
                            })
                        }
                    }
                    Err(e) => Ok(AiTestResult {
                        success: false,
                        message: format!("响应解析失败: {}", e),
                        latency: Some(latency),
                    })
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                Ok(AiTestResult {
                    success: false,
                    message: format!("HTTP {}: {}", status, error_text),
                    latency: Some(latency),
                })
            }
        }
        Err(e) => {
            let latency = start_time.elapsed().as_millis() as u64;
            let error_message = if e.is_timeout() {
                "请求超时，请检查网络连接".to_string()
            } else if e.is_connect() {
                "连接失败，请检查 API 地址".to_string()
            } else {
                format!("网络错误: {}", e)
            };
            
            Ok(AiTestResult {
                success: false,
                message: error_message,
                latency: Some(latency),
            })
        }
    }
}

async fn test_deepseek_connection(request: AiTestRequest, start_time: std::time::Instant) -> Result<AiTestResult, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;
    let url = format!("{}/chat/completions", request.base_url);
    
    let test_request = serde_json::json!({
        "model": request.model,
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "Hi"}],
        "temperature": 0.1
    });
    
    match client
        .post(&url)
        .json(&test_request)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", request.api_key))
        .send()
        .await
    {
        Ok(response) => {
            let latency = start_time.elapsed().as_millis() as u64;
            
            if response.status().is_success() {
                match response.json::<serde_json::Value>().await {
                    Ok(json_response) => {
                        if json_response.get("choices").is_some() || json_response.get("id").is_some() {
                            Ok(AiTestResult {
                                success: true,
                                message: format!("连接成功！延迟: {}ms，DeepSeek API 响应正常", latency),
                                latency: Some(latency),
                            })
                        } else {
                            Ok(AiTestResult {
                                success: false,
                                message: "连接成功但响应格式异常".to_string(),
                                latency: Some(latency),
                            })
                        }
                    }
                    Err(e) => Ok(AiTestResult {
                        success: false,
                        message: format!("响应解析失败: {}", e),
                        latency: Some(latency),
                    })
                }
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                Ok(AiTestResult {
                    success: false,
                    message: format!("HTTP {}: {}", status, error_text),
                    latency: Some(latency),
                })
            }
        }
        Err(e) => {
            let latency = start_time.elapsed().as_millis() as u64;
            let error_message = if e.is_timeout() {
                "请求超时，请检查网络连接".to_string()
            } else if e.is_connect() {
                "连接失败，请检查 API 地址".to_string()
            } else {
                format!("网络错误: {}", e)
            };
            
            Ok(AiTestResult {
                success: false,
                message: error_message,
                latency: Some(latency),
            })
        }
    }
}