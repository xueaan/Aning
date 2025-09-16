import React, { useEffect, useMemo } from 'react';
import { usePasswordStore, useAppStore } from '@/stores';
import { Shield, Lock } from 'lucide-react';

// 子组件导入
import { PasswordCard } from './PasswordCard';
import { PasswordForm } from './PasswordForm';
import { PasswordList } from './PasswordList';

export const PasswordManager: React.FC = () => {
  useAppStore();
  const {
    // 状态
    entries,
    isLoading,
    error,
    searchQuery,
    selectedEntry,
    isCreating,
    isEditing,

    // 方法
    initializeStore,
    setIsCreating,
    setSelectedEntry,
    getFilteredAndSortedEntries,
    getFavoriteEntries,
    clearError,
  } = usePasswordStore();

  // 初始化
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // 使用 useMemo 优化，只在依赖项变化时重新计算
  // 注意：不要将函数作为依赖项，只依赖实际的数据状态
  const currentEntries = useMemo(() => {
    return getFilteredAndSortedEntries();
  }, [entries, searchQuery]); // 移除函数依赖，只保留数据依赖

  const favoriteEntries = useMemo(() => {
    return getFavoriteEntries();
  }, [entries]); // 移除函数依赖，只保留数据依赖

  return (
    <div className="h-full flex flex-col">
      {/* 主内容区 - 采用笔记页面的居中布局 */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm flex items-center justify-between theme-text-error feather-glass-deco">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="ml-2 p-1 rounded-md transition-all hover:scale-110 theme-text-error/70 hover:theme-text-error feather-glass-deco"
              >
                ×
              </button>
            </div>
          )}

          {/* 主内容 */}
          {isLoading ? (
            <div className="text-center py-8 text-text-tertiary">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>加载中...</p>
            </div>
          ) : currentEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center feather-glass-deco">
                <Shield size={32} className="text-text-muted" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-text-primary">
                {searchQuery ? '没有找到匹配的密码' : '还没有保存任何密码'}
              </h3>
              <p className="text-text-muted">
                {searchQuery ? '请尝试使用不同的搜索关键词' : '点击右下角的 按钮开始管理您的密码'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 收藏的密码 */}
              {!searchQuery && favoriteEntries.length > 0 && (
                <div>
                  <h3 className="text-base font-medium mb-4 theme-text-secondary">⭐ 收藏的密码</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {favoriteEntries.slice(0, 6).map((entry) => (
                      <PasswordCard
                        key={entry.id}
                        entry={entry}
                        onSelect={setSelectedEntry}
                        isSelected={selectedEntry?.id === entry.id}
                      />
                    ))}
                  </div>
                  <div className="mt-6 mb-6 h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
                </div>
              )}

              {/* 所有密码列表 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium theme-text-secondary">
                    {searchQuery ? '搜索结果' : '所有密码'}
                  </h3>
                  <span className="text-sm text-text-tertiary">
                    共 {currentEntries.length} 个条目
                  </span>
                </div>
                <PasswordList
                  entries={currentEntries}
                  selectedEntry={selectedEntry}
                  onSelectEntry={setSelectedEntry}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 浮动操作按钮 - 统一样式 */}
      <button
        onClick={() => setIsCreating(true)}
        className="fixed bottom-6 right-6 w-14 h-14 theme-button-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center group hover:scale-105"
        title="添加密码"
      >
        <Lock
          size={24}
          className="text-white transition-transform group-hover:rotate-12 duration-200"
        />
      </button>

      {/* 密码表单弹窗 */}
      {(isCreating || isEditing) && <PasswordForm />}
    </div>
  );
};
