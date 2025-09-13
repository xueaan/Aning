import React from 'react';
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
}> = ({ label, value, onChange, placeholder, error, required = false, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium theme-text-secondary mb-2">
      {label} {required && '*'}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
        error ? 'border border-red-400/40' : 'border border-white/20'
      )}
    />
    {error && <p className="mt-1 text-xs theme-text-error">{error}</p>}
  </div>
);

export const CategoryFields: React.FC<CategoryFieldsProps> = ({
  category,
  formData,
  errors,
  updateField
}) => {
  if (category.name === '网站') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="网站地址"
          value={formData.url || ''}
          onChange={(value) => updateField('url', value)}
          placeholder="https://example.com"
          error={errors.url}
          required
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
          placeholder="192.168.1.1"
          error={errors.ip}
          required
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
          placeholder="192.168.1.100"
          error={errors.db_ip}
          required
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