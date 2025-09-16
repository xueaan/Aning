import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import { useTypewriter } from '@/hooks/useTypewriter';
import { copyText } from '@/utils/copy';

interface TypewriterMessageProps {
  /** 要显示的文本内容 */
  content: string;
  /** 是否启用打字效果 */
  enableTypewriter?: boolean;
  /** 打字速度 (毫秒/字符) */
  speed?: number;
  /** 是否为错误消息 */
  isError?: boolean;
  /** 额外的CSS类名 */
  className?: string;
  /** 打字完成回调 */
  onComplete?: () => void;
}

/**
 * 支持打字效果的Markdown消息组件
 * 结合了useTypewriter Hook和ReactMarkdown，提供流畅的打字体验和美观的样式
 */
export const TypewriterMessage: React.FC<TypewriterMessageProps> = ({
  content,
  enableTypewriter = true,
  speed = 30,
  isError = false,
  className = '',
  onComplete,
}) => {
  const [showCursor, setShowCursor] = useState(false);
  const [isContentCopied, setIsContentCopied] = useState(false);
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set());

  // 稳定哈希：为代码块生成可复用的 ID，避免每次渲染随机导致状态失效
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36);
  };

  // 复制到剪贴板的通用函数
  const copyToClipboard = async (content: string, type: 'content' | 'code', blockId?: string) => {
    try {
      const ok = await copyText(content);
      if (!ok) return;

      if (type === 'content') {
        setIsContentCopied(true);
        setTimeout(() => setIsContentCopied(false), 2000);
      } else if (type === 'code' && blockId) {
        setCopiedBlocks((prev) => new Set([...prev, blockId]));
        setTimeout(() => {
          setCopiedBlocks((prev) => {
            const newSet = new Set(prev);
            newSet.delete(blockId);
            return newSet;
          });
        }, 2000);
      }
    } catch (_error) {
      // 这里可以添加错误提示
    }
  };

  const { displayedText, isTyping, skipTyping } = useTypewriter(content, {
    speed,
    autoStart: true,
    enabled: enableTypewriter && !isError, // 错误消息不使用打字效果
    onComplete: () => {
      setShowCursor(false);
      onComplete?.();
    },
  });

  // 管理光标显示状态
  useEffect(() => {
    if (isTyping) {
      setShowCursor(true);
    } else {
      // 打字完成后延迟隐藏光标
      const timer = setTimeout(() => setShowCursor(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  // 点击跳过打字动画
  const handleClick = () => {
    if (isTyping) {
      skipTyping();
    }
  };

  // 光标组件
  const Cursor = () => (
    <span
      className={`inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse ${showCursor ? 'opacity-100' : 'opacity-0'}`}
    />
  );

  // 错误消息直接显示，不使用markdown渲染
  if (isError) {
    return (
      <div className={`text-sm whitespace-pre-wrap leading-relaxed ${className}`}>{content}</div>
    );
  }

  const finalText = enableTypewriter ? displayedText : content;

  return (
    <div
      className={`relative group ${isTyping ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      title={isTyping ? '点击跳过打字动画' : undefined}
    >
      {/* 整体内容复制按钮 */}
      {!isTyping && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(content, 'content');
          }}
          className={`absolute -top-2 -right-2 z-20 p-1.5 rounded-lg transition-all duration-200
                    opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95
                    ${
                      isContentCopied
                        ? 'theme-bg-success/20 theme-text-success opacity-100'
                        : 'theme-bg-primary/90 theme-text-secondary hover:theme-text-accent hover:theme-bg-secondary theme-border/20 shadow-lg backdrop-blur-sm'
                    }`}
          title={isContentCopied ? '已复制' : '复制回复内容'}
          aria-label={isContentCopied ? '已复制回复内容' : '复制回复内容到剪贴板'}
        >
          {isContentCopied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      )}
      <div
        className={`prose prose-sm max-w-none
                      prose-p:my-2
                      prose-headings:font-semibold
                      prose-ul:my-2
                      prose-ol:my-2
                      prose-li:my-0.5
                      prose-pre:my-3
                      prose-code:text-sm
                      prose-blockquote:my-3
                      ${className || 'theme-text-primary'}`}
        style={{ maxWidth: 'none' }}
      >
        <ReactMarkdown
          components={{
            // 简化的代码块样式，使用原生元素确保布局一致性
            code: ({ node: _node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');

              if (!inline && match) {
                const codeContent = String(children).replace(/\n$/, '');
                const blockId = `code-${hashString(codeContent)}`;
                const isCopied = copiedBlocks.has(blockId);
                // const _language = match[1]; // Commented out - not used
                return (
                  <div
                    className="relative group"
                    style={{
                      border: 'none',
                      outline: 'none',
                      margin: '0.5rem 0',
                    }}
                  >
                    {/* 强制热重载更新 */}
                    <pre
                      className="overflow-x-auto rounded-xl font-mono text-sm leading-tight py-4 px-4 pr-12 shadow-sm code-block-scroll !border-none theme-text-primary theme-bg-tertiary"
                      style={{
                        fontFamily:
                          "'JetBrains Mono', 'Fira', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                        boxShadow: '0 2px 8px rgba(var(--bg-overlay), 0.1)',
                        border: 'none',
                        borderStyle: 'none',
                        borderWidth: '0',
                        borderBottom: 'none',
                        margin: '0',
                        outline: 'none',
                      }}
                    >
                      <code
                        className="block whitespace-pre theme-text-primary"
                        style={{
                          fontSize: '0.9em',
                          lineHeight: '1.6',
                        }}
                      >
                        {codeContent}
                      </code>
                    </pre>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copyToClipboard(codeContent, 'code', blockId);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 z-10
                                opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95
                                backdrop-blur-sm shadow-sm focus:outline-none !border-none
                                ${
                                  isCopied
                                    ? 'theme-bg-success/20 theme-text-success'
                                    : 'theme-bg-primary/90 theme-text-secondary hover:theme-text-accent hover:theme-bg-secondary/90'
                                }`}
                      title={isCopied ? '已复制' : '复制代码'}
                      aria-label={isCopied ? '已复制代码' : '复制代码到剪贴板'}
                      style={{
                        border: 'none',
                        outline: 'none',
                      }}
                    >
                      {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                );
              }

              return (
                <code
                  className="font-mono text-sm rounded-md px-1.5 py-0.5 transition-colors theme-bg-tertiary/70 theme-text-accent"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira', 'SF Mono', Consolas, monospace",
                    fontSize: '0.875em',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // 移除单独的pre处理，让code组件处理代码块
            // 增强的表格样式
            table: ({ children, ...props }) => (
              <div className="!w-full !max-w-none overflow-x-auto my-4 rounded-lg border theme-border-primary/20">
                <table className="!w-full !max-w-none border-collapse" {...props}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th
                className="border-b-2 theme-border-primary/30 theme-bg-secondary/60 px-4 py-3 text-left font-semibold theme-text-primary"
                {...props}
              >
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td
                className="border-b theme-border-primary/15 px-4 py-3 theme-text-primary"
                {...props}
              >
                {children}
              </td>
            ),
            // 增强的链接样式
            a: ({ children, href, ...props }) => (
              <a
                href={href}
                className="theme-text-accent hover:theme-text-accent underline decoration-current/30 hover:decoration-current underline-offset-2 transition-all duration-200"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
          }}
        >
          {finalText}
        </ReactMarkdown>
        {enableTypewriter && <Cursor />}
      </div>
      {isTyping && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="theme-bg-primary/90 theme-text-secondary text-xs px-2 py-1 rounded-md border theme-border-primary/20 shadow-lg backdrop-blur-sm animate-pulse">
            点击跳过
          </div>
        </div>
      )}
    </div>
  );
};

