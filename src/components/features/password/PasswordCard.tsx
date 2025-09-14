import React, { useState } from 'react';
import { usePasswordStore } from '@/stores';
import {
  PasswordEntryDisplay
} from '@/types/password';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Check, Trash2, UserCheck, Lock, Pencil } from 'lucide-react';

interface PasswordCardProps {
  entry: PasswordEntryDisplay;
  onSelect: (entry?: PasswordEntryDisplay) => void;
  isSelected: boolean;
}

export const PasswordCard: React.FC<PasswordCardProps> = ({
  entry,
  onSelect,
  isSelected
}) => {
  const [decryptedPassword, setDecryptedPassword] = useState<string>('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopiedUsername, setIsCopiedUsername] = useState(false);
  const [isCopiedPassword, setIsCopiedPassword] = useState(false);

  const {
    getDecryptedPassword,
    setIsEditing,
    deleteEntry
  } = usePasswordStore();

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

  // 打开URL
  const handleOpenUrl = () => {
    if (entry.url) {
      window.open(entry.url.startsWith('http') ? entry.url : `https://${entry.url}`, '_blank');
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

  // 获取域名显示
  const getDomainFromUrl = (url?: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // 获取用户名（支持所有类型）
  const getUsername = () => {
    return entry.username || entry.db_username || '';
  };

  // 卡片视图 - 极简清晰设计
  return (
    <div className={`group relative p-6 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg feather-glass-deco ${isSelected
          ? 'ring-2 ring-accent/30 scale-[1.02]'
          : 'hover:scale-[1.01]'
        }`}
      onClick={() => onSelect(entry)}
    >
      {/* 右上角按钮组  */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* 删除按钮  */}
        <button onClick={handleDelete}
          className="w-7 h-7 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-200 hover:scale-105 feather-glass-deco text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          title="删除密码"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      {entry.is_favorite && (
        <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <Check size={16} />
        </div>
      )}
      
      <div className="mb-8 mt-2">
        <h3 className="text-xl font-medium theme-text-primary mb-4 truncate leading-tight">
          {entry.title}
        </h3>
        <div className="space-y-3">
      {getUsername() && (
        <div className="flex items-center gap-2">
          <span className="text-xs theme-text-tertiary uppercase tracking-wide font-medium">用户</span>
          <span className="text-sm theme-text-secondary truncate">{getUsername()}</span>
        </div>
      )}
      {entry.url && (
        <div className="flex items-center gap-2">
          <span className="text-xs theme-text-tertiary uppercase tracking-wide font-medium">网站</span>
          <span className="text-sm text-blue-600 dark:text-blue-400 truncate cursor-pointer hover:underline"
            onClick={handleOpenUrl}
          >
            {getDomainFromUrl(entry.url)}
          </span>
        </div>
      )}
      {(entry.app_name || entry.ip || entry.db_type) && (
        <div className="flex items-center gap-2">
          <span className="text-xs theme-text-tertiary uppercase tracking-wide font-medium">
            {entry.app_name ? '应用' : entry.ip ? '服务器' : '数据库'}
          </span>
          <span className="text-sm theme-text-secondary truncate">
            {entry.app_name || entry.ip || entry.db_type}
          </span>
        </div>
      )}
      </div>
    </div>
      
      <div className="flex items-center gap-2">
        {getUsername() && (
          <button onClick={(e) => {
          e.stopPropagation();
          copyToClipboard(getUsername(), 'username');
        }}
        className={`flex-1 h-10 rounded-lg transition-all hover:scale-105 flex items-center justify-center feather-glass-deco ${
          isCopiedUsername
            ? 'theme-text-success'
            : 'theme-text-secondary hover:theme-text-primary'
        }`}
        title={isCopiedUsername ? "已复制" : "复制用户名"}
      >
        {isCopiedUsername ? (
          <Check size={16} strokeWidth={2} />
        ) : (
          <UserCheck size={16} strokeWidth={2} />
        )}
      </button>
        )}
        <button onClick={(e) => {
            e.stopPropagation();
            handleCopyPassword();
          }}
          disabled={isLoadingPassword}
          className={`flex-1 h-10 rounded-lg transition-all hover:scale-105 flex items-center justify-center feather-glass-deco ${
            isCopiedPassword
              ? 'theme-text-success'
              : 'theme-text-accent'
          }`}
          title={isCopiedPassword ? "已复制" : "复制密码"}
        >
          {isLoadingPassword ? (
            <div className="animate-spin w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
          ) : isCopiedPassword ? (
            <Check size={16} strokeWidth={2} />
          ) : (
            <Lock size={16} strokeWidth={2} />
          )}
        </button>
        <button onClick={handleEdit}
            className="flex-1 h-10 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary flex items-center justify-center feather-glass-deco"
          title="编辑"
        >
          <Pencil size={18} />
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












