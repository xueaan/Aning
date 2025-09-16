import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordFormFieldsProps {
  formData: any;
  onFieldChange: (field: string, value: string) => void;
  onPasswordGenerate: (password: string) => void;
  errors: Record<string, string>;
}

export const PasswordFormFields: React.FC<PasswordFormFieldsProps> = ({
  formData,
  onFieldChange,
  onPasswordGenerate,
  errors,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      {/* 标题字段 */}
      <div>
        <label className="block text-sm font-medium theme-text-primary mb-2">标题 *</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => onFieldChange('title', e.target.value)}
          placeholder="输入密码标题"
          className={cn(
            'w-full px-4 py-3 rounded-lg theme-input',
            errors.title && 'border-red-400'
          )}
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* 用户名字段 */}
      <div>
        <label className="block text-sm font-medium theme-text-primary mb-2">用户名/邮箱</label>
        <input
          type="text"
          value={formData.username || ''}
          onChange={(e) => onFieldChange('username', e.target.value)}
          placeholder="输入用户名或邮箱"
          className="w-full px-4 py-3 rounded-lg theme-input"
        />
      </div>

      {/* 密码字段 */}
      <div>
        <label className="block text-sm font-medium theme-text-primary mb-2">密码 *</label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted"
            size={18}
          />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password || ''}
            onChange={(e) => onFieldChange('password', e.target.value)}
            placeholder="输入或生成密码"
            className={cn(
              'w-full pl-10 pr-20 py-3 rounded-lg theme-input',
              errors.password && 'border-red-400'
            )}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:theme-bg-secondary rounded"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              type="button"
              onClick={() => {
                // 这里应该调用密码生成器
                const newPassword = Math.random().toString(36).slice(2, 14);
                onPasswordGenerate(newPassword);
              }}
              className="p-1 hover:theme-bg-secondary rounded"
              title="生成密码"
            >
              <Key size={16} />
            </button>
          </div>
        </div>
        {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
      </div>

      {/* URL字段 */}
      <div>
        <label className="block text-sm font-medium theme-text-primary mb-2">网站地址</label>
        <input
          type="url"
          value={formData.url || ''}
          onChange={(e) => onFieldChange('url', e.target.value)}
          placeholder="https://example.com"
          className="w-full px-4 py-3 rounded-lg theme-input"
        />
      </div>

      {/* 备注字段 */}
      <div>
        <label className="block text-sm font-medium theme-text-primary mb-2">备注</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="添加备注信息..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg theme-input resize-none"
        />
      </div>
    </div>
  );
};
