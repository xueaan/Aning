import MarkdownIt from 'markdown-it';

// 初始化 markdown-it,
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true});

/**
 * 检测文本是否包含 Markdown 语法
 */
export function isMarkdown(text: string): boolean {
  if (!text || text.length === 0) return false;
  
  // 检测常见的 Markdown 模式
  const patterns = [
    /^#{1,6}\s+.+$/m,        // 标题 # ## ### 等
    /^[-*+]\s+.+$/m,         // 无序列表
    /^\d+\.\s+.+$/m,         // 有序列表
    /^>\s+.+$/m,             // 引用
    /\*\*.+\*\*/,            // 加粗
    /\*.+\*/,                // 斜体
    /\[.+\]\(.+\)/,          // 链接
    /`[^`]+`/,               // 行内代码
    /^```[\s\S]*?```$/m,     // 代码块
    /^---+$/m,               // 分隔线
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * 将 Markdown 文本转换为 HTML
 */
export function parseMarkdownToHTML(markdown: string): string {
  try {
    // 使用 markdown-it 解析
    const html = md.render(markdown);

    // 不要过度清理，保留段落和标题结构
    const cleanHtml = html
      .trim()
      .replace(/\n+/g, ' ') // 将换行替换为空格
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
    return cleanHtml;
  } catch (error) {
    console.error('Markdown 解析失败:', error);
    return markdown; // 如果解析失败，返回原文本
  }
}

/**
 * 处理粘贴事件的主函数
 */
export function handleMarkdownPaste(
  _view: any, 
  event: ClipboardEvent, 
  editor: any
): boolean {
  const text = event.clipboardData?.getData('text/plain');

  if (!text || !isMarkdown(text)) {
    return false; // 不是 Markdown，使用默认处理
  }

  try {
    // 阻止默认粘贴行为
    event.preventDefault();
    
    // 解析 Markdown 为 HTML,
    const html = parseMarkdownToHTML(text);

    // 插入解析后的内容
    editor.commands.insertContent(html);
    
    return true; // 已处理
  } catch (error) {
    console.error('Failed to process Markdown paste:', error);
    return false; // 处理失败，使用默认行为
  }
}

/**
 * 高级 Markdown 检测
 * 检测更复杂的 Markdown 模式
 */
export function isAdvancedMarkdown(text: string): boolean {
  const lines = text.split('\n');
  let markdownScore = 0;
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // 标题
    if (/^#{1,6}\s/.test(trimmedLine)) markdownScore += 3;
    
    // 列表
    if (/^[-*+]\s/.test(trimmedLine) || /^\d+\.\s/.test(trimmedLine)) markdownScore += 2;
    
    // 引用
    if (/^>\s/.test(trimmedLine)) markdownScore += 2;
    
    // 加粗/斜体
    if (/\*\*.+\*\*/.test(trimmedLine) || /\*.+\*/.test(trimmedLine)) markdownScore += 1;
    
    // 链接
    if (/\[.+\]\(.+\)/.test(trimmedLine)) markdownScore += 2;
    
    // 行内代码
    if (/`[^`]+`/.test(trimmedLine)) markdownScore += 1;
    
    // 代码块
    if (/^```/.test(trimmedLine)) markdownScore += 3;
  });
  
  // 如果 Markdown 特征分数超过阈值，认为是 Markdown,
  return markdownScore >= 2;
}




