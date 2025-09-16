import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PasswordEntry, Category } from '@/types/password';

interface CategoryFieldsProps {
  category: Category;
  formData: PasswordEntry;
  errors: Record<string, string>;
  updateField: (field: keyof PasswordEntry, value: any) => void;
}

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  type?: string;
  formatType?: 'url' | 'ip' | 'default';
}> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  type = 'text',
  formatType = 'default',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // URL格式化和验证
  const formatUrl = (input: string): string => {
    if (!input) return input;

    // 移除多余的空格
    input = input.trim();

    // 如果用户输入了完整的协议，保留它
    if (input.match(/^https?:\/\//)) {
      return input;
    }

    // 对于IP地址或localhost，使用http
    if (input.match(/^(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?/)) {
      return input; // 不自动添加协议，让用户明确指定
    }

    return input;
  };

  // IP格式验证提示
  const getIpHint = (input: string): string | null => {
    if (!input) return null;

    // 基本的IP格式检查
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    const ipWithPortPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/;

    if (ipPattern.test(input) || ipWithPortPattern.test(input)) {
      const parts = input.split(':')[0].split('.');
      const invalidParts = parts.filter((part) => parseInt(part) > 255);
      if (invalidParts.length > 0) {
        return 'IP地址每段应在0-255之间';
      }
    }

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (formatType === 'url' && !isFocused) {
      newValue = formatUrl(newValue);
    }

    onChange(newValue);
  };

  const hint = formatType === 'ip' ? getIpHint(value) : null;

  return (
    <div>
      <label className="block text-sm font-medium theme-text-secondary mb-2">
        {label} {required && '*'}
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (formatType === 'url') {
            onChange(formatUrl(value));
          }
        }}
        placeholder={placeholder}
        className={cn(
          'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
          error ? 'border border-red-400/40' : 'border border-white/20'
        )}
      />
      {error && <p className="mt-1 text-xs theme-text-error">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{hint}</p>}
      {formatType === 'url' && value && !value.match(/^https?:\/\//) && !error && (
        <p className="mt-1 text-xs theme-text-tertiary">
          提示：保存时将自动添加 http:// 或 https://
        </p>
      )}
    </div>
  );
};

export const CategoryFields: React.FC<CategoryFieldsProps> = ({
  category,
  formData,
  errors,
  updateField,
}) => {
  if (category.name === '网站') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="网站地址"
          value={formData.url || ''}
          onChange={(value) => updateField('url', value)}
          placeholder="example.com 或 10.63.5.106:7080"
          error={errors.url}
          required
          formatType="url"
        />
        <InputField
          label="账号"
          value={formData.username || ''}
          onChange={(value) => updateField('username', value)}
          placeholder="用户名或邮箱"
          error={errors.username}
          required
        />
      </div>
    );
  }

  if (category.name === '应用软件') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="应用名称"
          value={formData.app_name || ''}
          onChange={(value) => updateField('app_name', value)}
          placeholder="微信、钉钉、QQ等"
          error={errors.app_name}
          required
        />
        <InputField
          label="账号"
          value={formData.username || ''}
          onChange={(value) => updateField('username', value)}
          placeholder="账号名或手机号"
          error={errors.username}
          required
        />
      </div>
    );
  }

  if (category.name === '服务器') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="服务器IP"
          value={formData.ip || ''}
          onChange={(value) => updateField('ip', value)}
          placeholder="192.168.1.1 或 192.168.1.1:22"
          error={errors.ip}
          required
          formatType="ip"
        />
        <InputField
          label="账号"
          value={formData.username || ''}
          onChange={(value) => updateField('username', value)}
          placeholder="root、admin等"
          error={errors.username}
          required
        />
      </div>
    );
  }

  if (category.name === '数据库') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="数据库类型"
          value={formData.db_type || ''}
          onChange={(value) => updateField('db_type', value)}
          placeholder="MySQL、PostgreSQL等"
          error={errors.db_type}
          required
        />
        <InputField
          label="数据库IP"
          value={formData.db_ip || ''}
          onChange={(value) => updateField('db_ip', value)}
          placeholder="192.168.1.100 或 localhost:3306"
          error={errors.db_ip}
          required
          formatType="ip"
        />
        <InputField
          label="数据库用户名"
          value={formData.db_username || ''}
          onChange={(value) => updateField('db_username', value)}
          placeholder="root、postgres等"
          error={errors.db_username}
          required
        />
      </div>
    );
  }

  // 其他类型或默认情况
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputField
        label="账号"
        value={formData.username || ''}
        onChange={(value) => updateField('username', value)}
        placeholder="用户名"
        error={errors.username}
      />
    </div>
  );
};
