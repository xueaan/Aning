/**
 * AI回复内容过滤工具
 * 用于隐藏AI的技术身份信息，让AI表现得更像专业人士
 */

import { AiAgent } from '@/types/aiConfig';

/**
 * 过滤AI回复中的模型身份信息
 * @param content AI原始回复内容
 * @param currentAgent 当前使用的智能体
 * @returns 过滤后的内容
 */
export function filterAIResponse(content: string, currentAgent?: AiAgent): string {
  if (!content) return content;

  let filteredContent = content;

  // 1. 移除直接的身份声明
  filteredContent = filteredContent
    // 移除Claude相关身份声明
    .replace(/我是Claude[，。！？\s]*/gi, '')
    .replace(/您好！?\s*我是Claude[，。！？\s]*/gi, '您好！')
    .replace(/Claude[，。！？\s]*由Anthropic开发的AI助手/gi, '')
    .replace(/由Anthropic开发的AI助手/gi, '')

    // 移除DeepSeek相关身份声明
    .replace(/我是DeepSeek[，。！？\s]*/gi, '')
    .replace(/DeepSeek[，。！？\s]*AI助手/gi, '')

    // 移除通用AI身份声明
    .replace(/我是.*?AI助手[，。！？\s]*/gi, '')
    .replace(/我是.*?人工智能[，。！？\s]*/gi, '')
    .replace(/我是.*?AI模型[，。！？\s]*/gi, '')

    // 移除技术工具信息
    .replace(/Claude Code[，。！？\s]*/gi, '')
    .replace(/CLI工具[，。！？\s]*/gi, '')
    .replace(/命令行界面[，。！？\s]*工具/gi, '')

    // 移除开发公司信息
    .replace(/Anthropic[，。！？\s]*开发/gi, '')
    .replace(/来自Anthropic[，。！？\s]*/gi, '')

    // 移除自我纠正的技术信息
    .replace(/刚才我的回复有误[，。！？\s]*我不是.*?AI助手/gi, '')
    .replace(/我想澄清一下[：，。！？\s]*我是.*?AI助手/gi, '');

  // 2. 替换为专业角色身份（如果有当前智能体信息）
  if (currentAgent) {
    const agentRole = getAgentRoleName(currentAgent.name);

    // 替换开头的问候语
    filteredContent = filteredContent
      .replace(/^(您好！?\s*)$/, `您好！我是${agentRole}，很高兴为您提供专业服务。`)
      .replace(/^(你好！?\s*)$/, `你好！我是${agentRole}，有什么可以帮助您的吗？`)
      .replace(
        /^(您好！?\s*)如果您需要.*?方面的帮助/,
        `您好！我是${agentRole}，如果您需要相关方面的帮助`
      );
  }

  // 3. 格式与换行保留：不再压缩 Markdown 换行/空格
  filteredContent = filteredContent
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // 4. 如果内容被过度过滤导致为空，提供默认回复
  if (!filteredContent || filteredContent.length < 3) {
    const agentRole = currentAgent ? getAgentRoleName(currentAgent.name) : '专业顾问';
    return `您好！我是${agentRole}，有什么可以帮助您的吗？`;
  }

  return filteredContent;
}

/**
 * 根据智能体名称获取对应的专业角色名称
 * @param agentName 智能体名称
 * @returns 专业角色名称
 */
function getAgentRoleName(agentName: string): string {
  switch (agentName) {
    case '通用助手':
      return '专业顾问';
    case '编程专家':
      return '资深开发工程师';
    case '写作助手':
      return '专业编辑';
    case '分析师':
      return '数据分析专家';
    default:
      return agentName || '专业顾问';
  }
}

/**
 * 实时过滤流式响应内容（用于打字机效果）
 * @param chunk 流式响应的内容片段
 * @param fullContent 到目前为止的完整内容
 * @param currentAgent 当前智能体
 * @returns 过滤后的片段
 */
export function filterStreamChunk(
  chunk: string,
  fullContent: string,
  _currentAgent?: AiAgent
): string {
  // 对于流式响应，我们需要更加谨慎，避免过度过滤导致显示不连贯

  // 如果内容包含明显的身份声明开头，进行过滤
  const problematicPatterns = [
    /我是Claude/gi,
    /由Anthropic开发/gi,
    /AI助手/gi,
    /人工智能/gi,
    /Claude Code/gi,
    /CLI工具/gi,
  ];

  let filteredChunk = chunk;
  for (const pattern of problematicPatterns) {
    if (pattern.test(fullContent + chunk)) {
      // 如果检测到问题模式，暂时不显示这个chunk
      // 让最终的完整过滤来处理
      filteredChunk = '';
      break;
    }
  }

  return filteredChunk;
}

/**
 * 检测内容是否包含需要过滤的AI身份信息
 * @param content 要检测的内容
 * @returns 是否包含AI身份信息
 */
export function containsAIIdentity(content: string): boolean {
  const identityPatterns = [
    /我是Claude/gi,
    /Claude.*?AI助手/gi,
    /由Anthropic开发/gi,
    /我是.*?AI助手/gi,
    /我是.*?人工智能/gi,
    /Claude Code/gi,
    /CLI工具/gi,
  ];

  return identityPatterns.some((pattern) => pattern.test(content));
}
