use serde::{Deserialize, Serialize};
use scraper::{Html, Selector};
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize)]
pub struct DoubanBookInfo {
    pub title: String,
    pub author: String,
    pub isbn: Option<String>,
    pub publisher: Option<String>,
    pub publish_date: Option<String>,
    pub pages: Option<i32>,
    pub price: Option<String>,
    pub rating: Option<f32>,
    pub rating_count: Option<i32>,
    pub description: Option<String>,
    pub cover_url: Option<String>,
    pub tags: Vec<String>,
}

#[tauri::command]
pub async fn fetch_douban_book(url: String) -> Result<DoubanBookInfo, String> {
    // 验证URL是否为豆瓣图书链接
    if !url.contains("book.douban.com/subject/") {
        return Err("请提供有效的豆瓣图书链接".to_string());
    }

    // 设置请求头，模拟浏览器
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| format!("创建HTTP客户端失败: {}", e))?;

    // 获取页面内容
    let response = client
        .get(&url)
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
        .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
        .send()
        .await
        .map_err(|e| format!("请求豆瓣页面失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("豆瓣返回错误状态码: {}", response.status()));
    }

    let html_content = response
        .text()
        .await
        .map_err(|e| format!("读取页面内容失败: {}", e))?;

    // 提取所有信息（在一个作用域内完成，避免Send问题）
    let book_info = extract_book_info(&html_content);

    // 下载封面图片并转换为base64
    let cover_base64 = if let Some(url) = &book_info.cover_url {
        match download_and_encode_image(&client, url).await {
            Ok(base64) => Some(base64),
            Err(e) => {
                eprintln!("下载封面失败: {}", e);
                None
            }
        }
    } else {
        None
    };

    // 返回带有base64封面的书籍信息
    Ok(DoubanBookInfo {
        cover_url: cover_base64,
        ..book_info
    })
}

// 从HTML中提取书籍信息（同步函数，避免Send问题）
fn extract_book_info(html_content: &str) -> DoubanBookInfo {
    let document = Html::parse_document(html_content);

    // 创建选择器
    // 选择器（含回退，避免 panic）
    fn sel(s: &str) -> Selector { Selector::parse(s).unwrap_or_else(|_| Selector::parse("body").unwrap()) }
    let title_selector = sel("h1 span");
    let info_selector = sel("#info");
    let rating_selector = sel("strong.rating_num");
    let rating_count_selector = sel("a.rating_people span");
    let description_selector = sel("#link-report .intro");
    let cover_selector1 = sel("#mainpic a img");
    let cover_selector2 = sel("a.nbg img");
    let tag_selector = sel(".tag-list a.tag");
    let author_link_selector = sel("#info a[href*='/author/']");
    let author_search_selector = sel("#info a[href*='/search/']");

    // 提取书名
    let title = document
        .select(&title_selector)
        .next()
        .map(|el| el.text().collect::<String>().trim().to_string())
        .unwrap_or_else(|| "未知书名".to_string());

    // 提取图书信息块
    let info_text = document
        .select(&info_selector)
        .next()
        .map(|el| el.text().collect::<String>())
        .unwrap_or_default();

    // 解析作者 - 改进的方法
    let author = {
        // 方法1: 尝试从作者链接获取 (/author/ 格式)
        let author_from_link = document
            .select(&author_link_selector)
            .next()
            .map(|el| el.text().collect::<String>().trim().to_string())
            .filter(|s| !s.is_empty());

        if let Some(author) = author_from_link {
            author
        } else {
            // 方法1.5: 尝试从搜索链接获取 (/search/ 格式) - 这是更常见的格式
            // 在豆瓣页面中，作者通常是第一个 /search/ 链接
            let author_from_search = document
                .select(&author_search_selector)
                .next()  // 获取第一个搜索链接（通常是作者）
                .map(|el| el.text().collect::<String>().trim().to_string())
                .filter(|s| !s.is_empty() && !s.contains("更多"));

            if let Some(author) = author_from_search {
                author
            } else {
            // 方法2: 从info HTML中提取 - 改进版本
            let info_html = document
                .select(&info_selector)
                .next()
                .map(|el| el.html())
                .unwrap_or_default();

            // 尝试多种模式提取作者
            let mut extracted_author = None;

            // 模式1: 查找 "作者:" 标签后的内容
            if extracted_author.is_none() {
                if let Some(pos) = info_html.find("作者:") {
                    let after = &info_html[pos + 6..]; // 跳过 "作者:"

                    // 查找 </span> 标签后的内容
                    if let Some(span_end) = after.find("</span>") {
                        let content = &after[span_end + 7..];

                        // 如果有链接，提取链接文本
                        if let Some(link_start) = content.find("<a") {
                            if let Some(gt_pos) = content[link_start..].find(">") {
                                let text_start = link_start + gt_pos + 1;
                                if let Some(link_end) = content[text_start..].find("</a>") {
                                    let author_text = &content[text_start..text_start + link_end];
                                    let cleaned = author_text.trim()
                                        .replace("&nbsp;", " ")
                                        .replace("&amp;", "&")
                                        .trim()
                                        .to_string();
                                    if !cleaned.is_empty() && !cleaned.contains('<') {
                                        extracted_author = Some(cleaned);
                                    }
                                }
                            }
                        }

                        // 如果没有链接，直接提取文本
                        if extracted_author.is_none() {
                            if let Some(next_tag) = content.find('<') {
                                let text = &content[..next_tag];
                                let cleaned = text.trim()
                                    .replace("&nbsp;", " ")
                                    .replace("&amp;", "&")
                                    .trim()
                                    .to_string();
                                if !cleaned.is_empty() && !cleaned.contains('\n') {
                                    extracted_author = Some(cleaned);
                                }
                            }
                        }
                    }
                }
            }

            // 模式2: 查找 class="pl" 的作者标签
            if extracted_author.is_none() {
                if let Some(pos) = info_html.find(r#"<span class="pl">作者"#) {
                    let after = &info_html[pos..];
                    if let Some(span_end) = after.find("</span>") {
                        let content = &after[span_end + 7..];

                        // 提取到下一个 <br/> 或 <span 之前的内容
                        let end_pos = content.find("<br")
                            .or_else(|| content.find("<span"))
                            .unwrap_or(content.len());

                        let author_area = &content[..end_pos];

                        // 清理HTML标签和实体
                        let cleaned = author_area
                            .split("<a")
                            .skip(1)
                            .next()
                            .and_then(|s| s.split('>').nth(1))
                            .and_then(|s| s.split("</a>").next())
                            .map(|s| s.trim().to_string())
                            .unwrap_or_else(|| {
                                author_area.trim()
                                    .replace("&nbsp;", " ")
                                    .replace("&amp;", "&")
                                    .trim()
                                    .to_string()
                            });

                        if !cleaned.is_empty() && !cleaned.contains('<') {
                            extracted_author = Some(cleaned);
                        }
                    }
                }
            }

            // 返回找到的作者或使用fallback
            extracted_author.unwrap_or_else(|| {
                // 方法3: 使用简单的文本提取
                extract_info_field(&info_text, "作者:")
                    .or_else(|| extract_info_field(&info_text, "作者"))
                    .unwrap_or_else(|| "未知作者".to_string())
            })
            }
        }
    };

    // 解析ISBN
    let isbn = extract_info_field(&info_text, "ISBN:");

    // 解析出版社
    let publisher = extract_info_field(&info_text, "出版社:");

    // 解析出版日期
    let publish_date = extract_info_field(&info_text, "出版年:");

    // 解析页数
    let pages = extract_info_field(&info_text, "页数:")
        .and_then(|s| s.trim().parse::<i32>().ok());

    // 解析定价
    let price = extract_info_field(&info_text, "定价:");

    // 提取评分
    let rating = document
        .select(&rating_selector)
        .next()
        .and_then(|el| el.text().collect::<String>().trim().parse::<f32>().ok());

    // 提取评分人数
    let rating_count = document
        .select(&rating_count_selector)
        .next()
        .and_then(|el| {
            el.text()
                .collect::<String>()
                .trim()
                .replace("人评价", "")
                .parse::<i32>()
                .ok()
        });

    // 提取简介
    let description = document
        .select(&description_selector)
        .next()
        .map(|el| {
            el.text()
                .collect::<String>()
                .trim()
                .replace("\n", " ")
                .replace("  ", " ")
                .to_string()
        });

    // 提取封面图片URL
    let cover_url = document
        .select(&cover_selector1)
        .next()
        .and_then(|el| el.value().attr("src"))
        .or_else(|| {
            document
                .select(&cover_selector2)
                .next()
                .and_then(|el| el.value().attr("src"))
        })
        .map(|s| s.to_string());

    // 提取标签
    let tags: Vec<String> = document
        .select(&tag_selector)
        .map(|el| el.text().collect::<String>().trim().to_string())
        .filter(|s| !s.is_empty())
        .take(10) // 限制最多10个标签
        .collect();

    DoubanBookInfo {
        title,
        author,
        isbn,
        publisher,
        publish_date,
        pages,
        price,
        rating,
        rating_count,
        description,
        cover_url,
        tags,
    }
}

// 辅助函数：从信息文本中提取字段
fn extract_info_field(text: &str, field_name: &str) -> Option<String> {
    text.split('\n')
        .find(|line| line.contains(field_name))
        .and_then(|line| {
            let parts: Vec<&str> = line.split(field_name).collect();
            if parts.len() > 1 {
                let value = parts[1]
                    .split('\n')
                    .next()
                    .unwrap_or("")
                    .trim()
                    .to_string();
                if !value.is_empty() {
                    Some(value)
                } else {
                    None
                }
            } else {
                None
            }
        })
}

// 下载图片并转换为base64
async fn download_and_encode_image(client: &reqwest::Client, url: &str) -> Result<String, String> {
    // 下载图片
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("下载图片失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("图片下载返回错误状态码: {}", response.status()));
    }

    // 获取图片数据
    let image_bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取图片数据失败: {}", e))?;

    // 检测图片类型（简单判断）
    let mime_type = if image_bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        "image/jpeg"
    } else if image_bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        "image/png"
    } else if image_bytes.starts_with(b"GIF") {
        "image/gif"
    } else {
        "image/jpeg" // 默认
    };

    // 转换为base64
    let base64_string = general_purpose::STANDARD.encode(&image_bytes);

    // 返回完整的data URL
    Ok(format!("data:{};base64,{}", mime_type, base64_string))
}
