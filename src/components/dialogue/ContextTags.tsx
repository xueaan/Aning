import React from 'react';
import { X, FileText, CheckSquare, Package, BarChart3 } from 'lucide-react';
import { ContextItem, ContextStats } from '@/types/dialogue';

interface ContextTagsProps {
  contexts: ContextItem[];
  onRemove: (id: string) => void;
  stats: ContextStats;
  maxVisible?: number;
  className?: string;
}

export const ContextTags: React.FC<ContextTagsProps> = ({
  contexts,
  onRemove,
  stats,
  maxVisible = 8,
  className = '',
}) => {
  const visibleContexts = contexts.slice(0, maxVisible);
  const hiddenCount = contexts.length - maxVisible;

  // 获取上下文项的图标
  const getContextIcon = (context: ContextItem) => {
    switch (context.type) {
      case 'knowledge_page':
        return <FileText size={16} />;
      case 'task':
        return <CheckSquare size={16} />;
      case 'task_list':
        return <Package size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  // 获取上下文项的颜色样式
  const getContextStyle = (context: ContextItem) => {
    switch (context.type) {
      case 'knowledge_page':
        return 'theme-bg-accent/20 theme-text-accent theme-border-accent';
      case 'task':
        return context.metadata.priority === 'high' || context.metadata.priority === 'urgent'
          ? 'theme-bg-error/20 theme-error theme-border-error'
          : 'theme-bg-success/20 theme-success theme-border-primary';
      case 'task_list':
        return 'theme-bg-secondary theme-text-primary theme-border-primary';
      default:
        return 'theme-bg-secondary theme-text-secondary theme-border';
    }
  };

  // 获取简短的显示标题
  const getDisplayTitle = (context: ContextItem) => {
    // 如果标题太长，截断显示
    const title = context.title;
    if (title.length <= 20) return title;

    return title.substring(0, 17) + '...';
  };

  // 获取工具提示内容
  const getTooltipContent = (context: ContextItem) => {
    const lines = [
      `标题: ${context.title}`,
      `类型: ${context.type === 'knowledge_page' ? '知识库页面' : context.type === 'task' ? '任务' : '任务列表'}`,
    ];

    if (context.metadata.kb_name) {
      lines.push(`知识库: ${context.metadata.kb_name}`);
    }

    if (context.metadata.status) {
      lines.push(`状态: ${context.metadata.status}`);
    }

    if (context.metadata.priority) {
      lines.push(`优先级: ${context.metadata.priority}`);
    }

    if (context.metadata.due_date) {
      lines.push(`截止日期: ${context.metadata.due_date}`);
    }

    if (context.tokenCount) {
      lines.push(`预计Tokens: ${context.tokenCount}`);
    }

    if (context.metadata.preview) {
      lines.push(`预览: ${context.metadata.preview}`);
    }

    return lines.join('\\n');
  };

  if (contexts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 上下文标签列表 */}
      <div className="flex flex-wrap gap-2">
        {visibleContexts.map((context) => (
          <div
            key={context.id}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 hover:shadow-sm ${getContextStyle(context)}`}
            title={getTooltipContent(context)}
          >
            {/* 图标 */}
            <span className="flex-shrink-0">{getContextIcon(context)}</span>
            <span className="truncate max-w-32">{getDisplayTitle(context)}</span>
            {context.tokenCount && context.tokenCount > 100 && (
              <span className="text-xs px-1.5 py-0.5 theme-bg-tertiary rounded ml-1">
                {context.tokenCount}t
              </span>
            )}

            {/* 移除按钮 */}
            <button
              onClick={() => onRemove(context.id)}
              className="flex-shrink-0 p-0.5 hover:theme-bg-tertiary/50 rounded-full transition-colors"
              title="移除此上下文"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {/* 隐藏项目指示器 */}
        {hiddenCount > 0 && (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium theme-bg-secondary theme-text-secondary border theme-border-primary">
            <span>{hiddenCount} 更多</span>
          </div>
        )}
      </div>

      {/* 统计信息栏 */}
      <div className="flex items-center justify-between p-2 theme-bg-secondary/30 rounded-lg border theme-border">
        <div className="flex items-center gap-4 text-xs theme-text-secondary">
          {/* 项目统计 */}
          <div className="flex items-center gap-1">
            <BarChart3 size={16} />
            <span>{stats.totalItems} 项</span>
          </div>
          {stats.knowledges > 0 && (
            <div className="flex items-center gap-1">
              <FileText size={16} />
              <span>{stats.knowledges} 页面</span>
            </div>
          )}

          {stats.tasks > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare size={16} />
              <span>{stats.tasks} 任务</span>
            </div>
          )}

          {/* Token统计 */}
          {stats.totalTokens > 0 && (
            <div className="flex items-center gap-1">
              <span>约 {stats.totalTokens.toLocaleString()} tokens</span>
            </div>
          )}
        </div>

        {/* 清除所有按钮 */}
        {contexts.length > 1 && (
          <button
            onClick={() => contexts.forEach((ctx) => onRemove(ctx.id))}
            className="text-xs theme-text-secondary hover:theme-text-error transition-colors px-2 py-1 rounded hover:theme-bg-error/10"
            title="清除所有上下文"
          >
            清除所有
          </button>
        )}
      </div>

      {/* Token警告 */}
      {stats.totalTokens > 3000 && (
        <div className="flex items-center gap-2 p-2 theme-bg-warning/10 border theme-border-primary rounded-lg theme-warning text-xs">
          <span className="theme-warning">⚠️</span>
          <span>
            上下文内容较多 ({stats.totalTokens.toLocaleString()}{' '}
            tokens)，可能影响AI响应速度和准确性。 建议精简上下文内容。
          </span>
        </div>
      )}
    </div>
  );
};
