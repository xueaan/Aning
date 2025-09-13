import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTimelineStore, useAppStore } from '@/stores';
import { X } from 'lucide-react';
import { DatabaseAPI } from '@/services/api/database';
import { DatabaseInitializer } from '@/services/database/initializer';
import { LineEditor } from '@/components/editor/LineEditor';
import { TimelineEntry } from '@/types';
import ReactMarkdown from 'react-markdown';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

// 从 created_at 提取时间部分
const extractTimeFromCreatedAt = (created_at: string): string => {
  // created_at 格式: "2025-08-28 13:58:14"
  return created_at.split(' ')[1]?.substring(0, 5) || created_at;
};

export const Timeline: React.FC = () => {
  const { currentDate, viewMode, entries, setEntries } = useTimelineStore();
  const { theme } = useAppStore();
  const [yesterdayEntries, setYesterdayEntries] = useState<TimelineEntry[]>([]);
  const [tomorrowEntries, setTomorrowEntries] = useState<TimelineEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<any>(null);
  const [editorFocused, setEditorFocused] = useState(false);

  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number; time: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 3日视图的日期
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 获取当前时间 HH:mm (中国时区)
  const getCurrentTime = () => {
    const now = new Date();
    // 确保使用本地时区
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // 加载某天的笔记（只从数据库加载）
  const loadDailyNote = async (date: Date) => {
    setIsLoading(true);
    try {
      // 将数据库操作包装在 requestIdleCallback 或 setTimeout 中
      // 确保不阻塞主渲染线程
      await new Promise<void>((resolve) => {
        const executeLoad = async () => {
          try {
            // 确保数据库已初始化
            await DatabaseInitializer.ensureInitialized();

            const dateStr = formatDate(date);

            // 从数据库加载
            const dbEntries = await DatabaseAPI.getTimelineByDate(dateStr);

            if (dbEntries && dbEntries.length > 0) {
              // 转换数据库条目为Timeline Store格式
              const timelineEntries: TimelineEntry[] = dbEntries.map((entry: any) => ({
                id: entry.id?.toString() || `db-${Date.now()}-${Math.random()}`,
                content: entry.content,
                created_at: entry.created_at
              }));
              setEntries(timelineEntries);
            } else {
              // 没有数据，清空条目
              setEntries([]);
            }

            resolve();
          } catch (error) {
            setEntries([]);
            resolve();
          }
        };

        // 使用 requestIdleCallback 或 setTimeout 延迟执行
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => executeLoad());
        } else {
          setTimeout(() => executeLoad(), 16); // ~1 frame
        }
      });
    } catch (error) {
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 解析 Markdown 内容为时间条目
  const parseContent = (content: string): TimelineEntry[] => {
    if (!content) return [];

    const lines = content.split('\n');
    const entries: TimelineEntry[] = [];
    let currentEntry: TimelineEntry | null = null;
    let inFrontMatter = false;

    for (const line of lines) {
      // 跳过 front matter
      if (line.startsWith('---')) {
        inFrontMatter = !inFrontMatter;
        continue;
      }
      if (inFrontMatter) continue;

      // 检测时间标记(## HH:mm)
      const timeMatch = line.match(/^## (\d{2}:\d{2})/);
      if (timeMatch) {
        if (currentEntry) {
          entries.push(currentEntry);
        }
        currentEntry = {
          id: `temp-${timeMatch[1]}-${Date.now()}`,
          content: '',
          created_at: `2025-01-01 ${timeMatch[1]}:00`
        };
      } else if (currentEntry && line.trim()) {
        // 添加内容到当前条目
        currentEntry.content = (currentEntry.content ? '\n' : '') + line;
      }
    }

    // 添加最后一个条目
    if (currentEntry) {
      entries.push(currentEntry);
    }

    return entries;
  };

  // 手动保存函数（保留用于快捷键）
  const handleSave = async () => {
    if (!inputValue.trim()) {
      alert('请输入内容后再保存');
      return;
    }

    // 添加保存中的状态
    const saveButton = document.querySelector('button[title="Ctrl+Enter"]') as HTMLButtonElement;
    const originalButtonContent = saveButton?.innerHTML || '记录<span class="text-xs opacity-75"></span>';

    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = '保存中...';
    }

    // 设置超时，确保按钮一定会恢复
    const timeoutId = setTimeout(() => {
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonContent;
      }
      alert('保存超时，请重试');
    }, 5000);

    try {
      // 确保数据库已初始化
      await DatabaseInitializer.ensureInitialized();

      const dateStr = formatDate(currentDate);
      const time = getCurrentTime();


      // 保存到SQLite数据库（添加超时）
      await Promise.race([
        DatabaseAPI.createTimelineEntry(
          dateStr,
          time,
          inputValue.trim(),
          undefined,
          undefined
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('数据库保存超时')), 4000)
        )
      ]);

      // 重新加载显示
      await loadDailyNote(currentDate);
      setInputValue('');

      // 重新聚焦输入框
      editorRef.current?.focus();

      // 清除超时
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      alert('保存失败: ' + (error as Error).message);
    } finally {
      // 恢复按钮状态
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.innerHTML = originalButtonContent;
      }
    }
  };

  // 删除条目
  const handleDelete = (entryId: string | number, time: string) => {
    setDeleteTarget({ id: entryId, time });
    setShowDeleteConfirm(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      // 确保ID是数字类型
      const numericId = typeof deleteTarget.id === 'string' ? parseInt(deleteTarget.id, 10) : deleteTarget.id;
      if (isNaN(numericId)) {
        throw new Error('无效的ID格式');
      }

      await DatabaseAPI.deleteTimelineEntry(numericId);

      // 重新加载显示
      await loadDailyNote(currentDate);

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      alert('删除失败: ' + (error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // 处理编辑器聚焦
  const handleEditorFocus = () => {
    setEditorFocused(true);
  };

  // 处理编辑器失焦
  const handleEditorBlur = () => {
    setEditorFocused(false);
  };

  // 加载3日视图数据
  const loadThreeDaysData = async () => {
    if (viewMode === 'three') {
      // 加载昨天的数据
      try {
        const yesterdayStr = formatDate(yesterday);
        const yesterdayContent = await invoke<string>('get_daily_note', { date: yesterdayStr });
        setYesterdayEntries(parseContent(yesterdayContent));
      } catch (error) {
        setYesterdayEntries([]);
      }

      // 加载明天的数据
      try {
        const tomorrowStr = formatDate(tomorrow);
        const tomorrowContent = await invoke<string>('get_daily_note', { date: tomorrowStr });
        setTomorrowEntries(parseContent(tomorrowContent));
      } catch (error) {
        setTomorrowEntries([]);
      }
    }
  };

  // 延迟数据加载，避免阻塞首次绘制
  useEffect(() => {
    // 使用更长的延迟确保UI先渲染，再加载数据
    const timeoutId = setTimeout(() => {
      loadDailyNote(currentDate);
      if (viewMode === 'three') {
        loadThreeDaysData();
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [currentDate, viewMode]);

  return (
    <div className={`h-full flex flex-col`}>
      {/* 时间轴内容区 - 包含输入和展示 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* 输入区域 - 完全融入背景 */}
          <div className="relative mb-8">
            {/* 使用 React.lazy Suspense 延迟加载重量级组件 */}
            <React.Suspense fallback={<div className="bg-transparent border rounded-lg p-4 min-h-[120px] flex items-center text-text-muted">
              记录此刻的想法...
            </div>}>
              <LineEditor
                value={inputValue}
                onChange={setInputValue}
                onSave={handleSave}
                placeholder="记录此刻的想法..."
                minHeight={120}
                height={editorFocused ? 200 : 160}
                theme={theme}
                onFocus={handleEditorFocus}
                onBlur={handleEditorBlur}
                className="bg-transparent border-none outline-none ring-0 focus:ring-0 shadow-none"
              />
            </React.Suspense>
          </div>
          
          {viewMode === 'three' ? (
            // 3日视图
            <div className="grid grid-cols-3 gap-4 h-full">
              {[
                { date: yesterday, entries: yesterdayEntries, label: `${yesterday.getMonth() + 1}月${yesterday.getDate()}日 星期${['日', '一', '二', '三', '四', '五', '六'][yesterday.getDay()]}` },
                { date: currentDate, entries: entries, label: `${currentDate.getMonth() + 1}月${currentDate.getDate()}日 星期${['日', '一', '二', '三', '四', '五', '六'][currentDate.getDay()]}` },
                { date: tomorrow, entries: tomorrowEntries, label: `${tomorrow.getMonth() + 1}月${tomorrow.getDate()}日 星期${['日', '一', '二', '三', '四', '五', '六'][tomorrow.getDay()]}` },
              ].map(({ entries: dayEntries, label }, idx) => (
                <div key={idx}
                  className="rounded-lg overflow-hidden flex flex-col feather-glass-deco">
                  <div className="p-3 border-b border-white/10 bg-transparent backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-text-primary text-center">
                      {label}
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    {dayEntries.length === 0 ? (
                      <div className="text-center text-text-muted py-4 text-xs">
                        暂无记录
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dayEntries.map((entry, index) => (
                          <div key={index}
                            className="opacity-75 hover:opacity-100 border-l-2 border-white/20 pl-3 py-2 rounded-r transition-all hover:shadow-lg hover:border-white/40 feather-glass-deco">
                            <div className="text-xs font-medium mb-1 text-accent px-1.5 py-0.5 rounded bg-white/10">
                              {extractTimeFromCreatedAt(entry.created_at)}
                            </div>
                            <div className="text-xs theme-text-secondary">
                              {entry.content.split('\n')[0].substring(0, 50)}
                              {entry.content.length > 50 && '...'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 单日视图
            <div className="max-w-4xl mx-auto">
              {isLoading ? (
                <div className="text-center text-text-muted py-8">加载中...</div>
              ) : entries.length === 0 ? (
                <div className="text-center text-text-muted py-8">
                  今天还没有记录，开始写点什么吧
                </div>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry, index) => (
                    <div key={index} className="flex gap-4 group">
                      {/* 时间标签 */}
                      <div className="flex items-start justify-center w-16">
                        <div className="text-sm font-medium text-text-primary px-2.5 py-1 rounded-lg feather-glass-deco">
                          {extractTimeFromCreatedAt(entry.created_at)}
                        </div>
                      </div>
                      <div className="flex-1 rounded-lg px-2.5 py-1 mb-4 transition-all relative group hover:shadow-lg feather-glass-deco">
                        <button 
                          onClick={() => handleDelete(entry.id, extractTimeFromCreatedAt(entry.created_at))}
                          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          title="删除">
                          <X size={16} />
                        </button>
                        <div className="text-text-primary text-sm">
                          <ReactMarkdown>
                            {entry.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="删除时光记录"
        itemName={deleteTarget ? `${deleteTarget.time} 的记录` : ''}
        isLoading={isDeleting}
      />
    </div>
  );
};