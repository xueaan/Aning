import React, { useState } from 'react';
import { usePasswordStore } from '@/stores';
import { PasswordEntryDisplay } from '@/types/password';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Check, Trash2, UserCheck, Lock, Pencil } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

interface PasswordCardProps {
  entry: PasswordEntryDisplay;
  onSelect: (entry?: PasswordEntryDisplay) => void;
  isSelected: boolean;
}

export const PasswordCard: React.FC<PasswordCardProps> = ({ entry, onSelect, isSelected }) => {
  const [decryptedPassword, setDecryptedPassword] = useState<string>('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopiedUsername, setIsCopiedUsername] = useState(false);
  const [isCopiedPassword, setIsCopiedPassword] = useState(false);

  const { getDecryptedPassword, setIsEditing, deleteEntry } = usePasswordStore();

  // 复制到剪贴板
  const copyToClipboard = async (text: string, type: 'username' | 'password' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);

      // 显示复制成功反馈
      if (type === 'username') {
        setIsCopiedUsername(true);
        setTimeout(() => setIsCopiedUsername(false), 2000);
      } else if (type === 'password') {
        setIsCopiedPassword(true);
        setTimeout(() => setIsCopiedPassword(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // 复制密码
  const handleCopyPassword = async () => {
    if (decryptedPassword) {
      await copyToClipboard(decryptedPassword, 'password');
    } else {
      setIsLoadingPassword(true);
      try {
        const password = await getDecryptedPassword(entry.id!);
        setDecryptedPassword(password);
        await copyToClipboard(password, 'password');
      } catch (error) {
        console.error('Failed to decrypt password:', error);
      } finally {
        setIsLoadingPassword(false);
      }
    }
  };

  // 打开URL（改进的URL处理）
  const handleOpenUrl = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到父元素

    if (entry.url) {
      let targetUrl = entry.url;

      // 如果URL没有协议前缀，添加http://或https://
      if (!targetUrl.match(/^https?:\/\//)) {
        // 检查是否是IP地址或localhost
        const isLocalhost =
          targetUrl.startsWith('localhost') ||
          targetUrl.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

        // 对于本地地址使用http，其他使用https
        targetUrl = isLocalhost ? `http://${targetUrl}` : `https://${targetUrl}`;
      }

      console.log('Opening URL:', targetUrl); // 调试日志

      try {
        // 使用 Tauri 的 open 函数打开 URL
        await open(targetUrl);
      } catch (error) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  // 编辑
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true, entry);
  };

  // 删除
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!entry.id) return;

    setIsDeleting(true);
    try {
      await deleteEntry(entry.id);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 获取URL显示（显示更完整的信息）
  const getDomainFromUrl = (url?: string) => {
    if (!url) return '';

    // 如果是IP地址格式（包含端口），直接返回
    const ipPortPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/;
    if (ipPortPattern.test(url)) {
      return url;
    }

    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(fullUrl);

      // 构建显示的URL
      let displayUrl = urlObj.hostname;

      // 如果有非标准端口，包含端口号
      if (
        urlObj.port &&
        !(
          (urlObj.protocol === 'http:' && urlObj.port === '80') ||
          (urlObj.protocol === 'https:' && urlObj.port === '443')
        )
      ) {
        displayUrl += ':' + urlObj.port;
      }

      // 如果有路径（不只是根路径），包含路径
      if (urlObj.pathname && urlObj.pathname !== '/') {
        // 限制路径长度，避免显示过长
        const path =
          urlObj.pathname.length > 20 ? urlObj.pathname.substring(0, 20) + '...' : urlObj.pathname;
        displayUrl += path;
      }

      return displayUrl;
    } catch {
      // 如果解析失败，返回原始URL
      return url;
    }
  };

  // 获取用户名（支持所有类型）
  const getUsername = () => {
    return entry.username || entry.db_username || '';
  };

  // 卡片视图 - 紧凑设计
  return (
    <div
      className={`group relative p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md feather-glass-deco ${
        isSelected ? 'ring-2 ring-accent/30 scale-[1.01]' : 'hover:scale-[1.005]'
      }`}
      onClick={() => onSelect(entry)}
    >
      {/* 右上角按钮组  */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        {/* 删除按钮  */}
        <button
          onClick={handleDelete}
          className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 feather-glass-deco text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          title="删除密码"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {entry.is_favorite && (
        <div className="absolute top-3 left-3 w-5 h-5 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <Check size={12} />
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-base font-medium theme-text-primary mb-2 truncate leading-tight">
          {entry.title}
        </h3>
        <div className="space-y-1">
          {getUsername() && (
            <div className="flex items-center gap-2">
              <span className="text-xs theme-text-tertiary">用户</span>
              <span className="text-xs theme-text-secondary truncate">{getUsername()}</span>
            </div>
          )}
          {entry.url && (
            <div className="flex items-center gap-2">
              <span className="text-xs theme-text-tertiary">网站</span>
              <button
                className="text-xs text-blue-600 dark:text-blue-400 truncate cursor-pointer hover:underline text-left"
                onClick={handleOpenUrl}
                title={entry.url} // 添加tooltip显示完整URL
                type="button"
              >
                {getDomainFromUrl(entry.url)}
              </button>
            </div>
          )}
          {(entry.app_name || entry.ip || entry.db_type) && (
            <div className="flex items-center gap-2">
              <span className="text-xs theme-text-tertiary">
                {entry.app_name ? '应用' : entry.ip ? '服务器' : '数据库'}
              </span>
              <span className="text-xs theme-text-secondary truncate">
                {entry.app_name || entry.ip || entry.db_type}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        {getUsername() && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(getUsername(), 'username');
            }}
            className={`flex-1 h-8 rounded-md transition-all hover:scale-105 flex items-center justify-center feather-glass-deco ${
              isCopiedUsername
                ? 'theme-text-success'
                : 'theme-text-secondary hover:theme-text-primary'
            }`}
            title={isCopiedUsername ? '已复制' : '复制用户名'}
          >
            {isCopiedUsername ? (
              <Check size={14} strokeWidth={2} />
            ) : (
              <UserCheck size={14} strokeWidth={2} />
            )}
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopyPassword();
          }}
          disabled={isLoadingPassword}
          className={`flex-1 h-8 rounded-md transition-all hover:scale-105 flex items-center justify-center feather-glass-deco ${
            isCopiedPassword ? 'theme-text-success' : 'theme-text-accent'
          }`}
          title={isCopiedPassword ? '已复制' : '复制密码'}
        >
          {isLoadingPassword ? (
            <div className="animate-spin w-3 h-3 border-2 border-current/30 border-t-current rounded-full" />
          ) : isCopiedPassword ? (
            <Check size={14} strokeWidth={2} />
          ) : (
            <Lock size={14} strokeWidth={2} />
          )}
        </button>
        <button
          onClick={handleEdit}
          className="flex-1 h-8 rounded-md transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary flex items-center justify-center feather-glass-deco"
          title="编辑"
        >
          <Pencil size={14} />
        </button>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="删除密码"
        message={`确定要删除密码 "${entry.title}" 吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
