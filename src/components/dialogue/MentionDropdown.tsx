import React, { useEffect, useRef } from 'react';
import { ChevronRight, Clock, Search } from 'lucide-react';
import { SuggestionGroups, MentionSuggestion, SuggestionGroup } from '@/types/dialogue';

interface MentionDropdownProps {
  suggestions: SuggestionGroups;
  selectedIndex: number;
  onSelect: (value: string, displayText?: string) => void;
  onClose: () => void;
  className?: string;
  maxHeight?: number;
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onClose: _onClose,
  className = '',
  maxHeight = 320,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // 滚动到选中项
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // 处理点击
  const handleItemClick = (suggestion: MentionSuggestion) => {
    onSelect(suggestion.value, suggestion.label);
  };

  // 渲染建议项
  const renderSuggestionItem = (
    suggestion: MentionSuggestion & { groupType: string; groupTitle: string },
    index: number,
    isSelected: boolean
  ) => {
    return (
      <button
        key={`${suggestion.groupType}-${suggestion.value}-${index}`}
        ref={isSelected ? selectedItemRef : undefined}
        onClick={() => handleItemClick(suggestion)}
        className={`w-full px-3 py-2 text-left hover:theme-bg-secondary/50 transition-colors flex items-center ${
          isSelected
            ? 'theme-bg-accent/20 theme-text-accent border-l-2 theme-border-accent'
            : 'theme-text-primary'
        }`}
      >
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {/* 标题 */}
          <div
            className={`font-medium text-sm truncate ${
              isSelected ? 'theme-text-accent' : 'theme-text-primary'
            }`}
          >
            {suggestion.label}
          </div>
          {suggestion.preview && (
            <div className="text-xs theme-text-secondary truncate mt-0.5">{suggestion.preview}</div>
          )}

          {/* 元数据标签 */}
          {suggestion.metadata && (
            <div className="flex items-center gap-2 mt-1">
              {/* 知识库名称 */}
              {suggestion.metadata.kb_name && (
                <span className="text-xs px-1.5 py-0.5 theme-bg-accent/20 theme-text-accent rounded">
                  {suggestion.metadata.kb_name}
                </span>
              )}

              {/* 任务状态 */}
              {suggestion.metadata.status && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    suggestion.metadata.status === 'completed'
                      ? 'theme-bg-success/20 theme-success'
                      : suggestion.metadata.status === 'in_progress'
                        ? 'theme-bg-warning/20 theme-warning'
                        : 'theme-bg-secondary theme-text-secondary'
                  }`}
                >
                  {suggestion.metadata.status}
                </span>
              )}

              {/* 优先级 */}
              {suggestion.metadata.priority && suggestion.metadata.priority !== 'low' && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    suggestion.metadata.priority === 'urgent'
                      ? 'theme-bg-error/20 theme-error'
                      : 'theme-bg-warning/20 theme-warning'
                  }`}
                >
                  {suggestion.metadata.priority}
                </span>
              )}

              {/* 截止日期 */}
              {suggestion.metadata.due_date && (
                <span className="text-xs theme-text-secondary flex items-center gap-1">
                  <Clock size={16} />
                  {suggestion.metadata.due_date}
                </span>
              )}

              {/* Token数量 */}
              {suggestion.metadata.tokens && suggestion.metadata.tokens > 100 && (
                <span className="text-xs theme-text-secondary">~{suggestion.metadata.tokens}t</span>
              )}
            </div>
          )}
        </div>
        {isSelected && <ChevronRight size={14} className="theme-text-accent flex-shrink-0" />}
      </button>
    );
  };

  // 渲染分组标题
  const renderGroupHeader = (group: SuggestionGroup, isFirst: boolean) => {
    if (group.items.length === 0) return null;

    return (
      <div
        className={`px-3 py-2 theme-bg-secondary/30 border-b theme-border ${
          !isFirst ? 'border-t theme-border' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium theme-text-primary uppercase tracking-wide">
            {group.title}
          </span>
          <span className="text-xs theme-text-secondary">({group.items.length})</span>
        </div>
      </div>
    );
  };

  if (suggestions.total === 0) {
    return (
      <div className={`theme-border rounded-xl shadow-lg ${className}`}>
        <div className="p-4 text-center theme-text-secondary">
          <Search size={24} className="mx-auto mb-2 opacity-50" />
          <div className="text-sm">未找到匹配的内容</div>
          <div className="text-xs mt-1">尝试输入不同的关键词</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className={`theme-border rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      {/* 头部信息 */}
      <div className="px-3 py-2 theme-bg-secondary/40 border-b theme-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium theme-text-primary">
            找到 {suggestions.total} 个结果
          </span>
          <div className="flex items-center gap-2 text-xs theme-text-secondary">
            <span>↑↓ 选择</span>
            <span>Enter 确认</span>
            <span>Esc 关闭</span>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: maxHeight - 60 }}>
        {suggestions.groups.map((group, groupIndex) => {
          if (group.items.length === 0) return null;

          // 计算当前组在扁平化列表中的起始索引
          let startIndex = 0;
          for (let i = 0; i < groupIndex; i++) {
            startIndex += suggestions.groups[i].items.length;
          }

          return (
            <div key={group.type}>
              {/* 组标题 */}
              {renderGroupHeader(group, groupIndex === 0)}

              {/* 组项目 */}
              <div>
                {group.items.map((item, itemIndex) => {
                  const globalIndex = startIndex + itemIndex;
                  const isSelected = globalIndex === selectedIndex;
                  const suggestionWithGroup = {
                    ...item,
                    groupType: group.type,
                    groupTitle: group.title,
                  };

                  return renderSuggestionItem(suggestionWithGroup, globalIndex, isSelected);
                })}
              </div>
            </div>
          );
        })}
      </div>
      {suggestions.hasMore && (
        <div className="px-3 py-2 theme-bg-secondary/30 border-t theme-border text-center">
          <span className="text-xs theme-text-secondary">还有更多结果...</span>
        </div>
      )}
    </div>
  );
};
