import React, { useState, useEffect } from 'react';
import { usePasswordStore } from '@/stores';
import { PasswordEntry } from '@/types/password';
import { PasswordGenerator } from './PasswordGenerator';
import { X, ChevronDown, Lock, Eye, EyeOff, Key, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIconComponent } from '@/constants/commonIcons';

// 自定义下拉选择组件接口
interface CustomSelectProps {
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string; icon?: React.ReactNode }[];
  error?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  icon,
  value,
  onChange,
  placeholder,
  options,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted z-10">
          {icon}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full text-left flex items-center justify-between px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary feather-glass-deco',
          icon && 'pl-10',
          error ? 'border border-red-400/40' : 'border border-white/20'
        )}
      >
        <div className={cn(
          'flex items-center gap-2',
          selectedOption ? 'theme-text-primary' : 'theme-text-tertiary'
        )}>
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={16}
          className={cn('transition-transform duration-200 theme-text-muted', 
            isOpen && 'rotate-180'
          )}
        />
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto feather-glass-deco">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-3 text-left transition-all hover:scale-[1.01] theme-text-primary first:rounded-t-lg last:rounded-b-lg',
                  option.value === value ? 'theme-bg-accent/20' : 'hover:theme-bg-secondary/50'
                )}
              >
                <div className="flex items-center gap-2">
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const PasswordForm: React.FC = () => {
  const {
    isCreating,
    isEditing,
    editingEntry,
    categories,
    createEntry,
    updateEntry,
    setIsCreating,
    setIsEditing,
    getDecryptedPassword,
    checkPasswordStrength
  } = usePasswordStore();

  // 表单状态
  const [formData, setFormData] = useState<PasswordEntry>({
    title: '',
    username: '',
    password: '',
    url: '',
    ip: '',
    db_type: '',
    db_ip: '',
    db_username: '',
    app_name: '',
    category_id: undefined,
    is_favorite: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化表单数据
  useEffect(() => {
    if (isEditing && editingEntry) {
      const editData = {
        id: editingEntry.id,
        title: editingEntry.title || '',
        username: editingEntry.username || '',
        password: '',
        url: editingEntry.url || '',
        ip: editingEntry.ip || '',
        db_type: editingEntry.db_type || '',
        db_ip: editingEntry.db_ip || '',
        db_username: editingEntry.db_username || '',
        app_name: editingEntry.app_name || '',
        category_id: (() => {
          if (editingEntry.category_id && categories.find(c => c.id === editingEntry.category_id)) {
            return editingEntry.category_id;
          }
          if (editingEntry.url) return categories.find(c => c.name === '网站')?.id;
          if (editingEntry.app_name) return categories.find(c => c.name === '应用软件')?.id;
          if (editingEntry.ip) return categories.find(c => c.name === '服务器')?.id;
          if (editingEntry.db_type) return categories.find(c => c.name === '数据库')?.id;
          return categories.length > 0 ? categories[0].id : undefined;
        })(),
        is_favorite: false
      };
      setFormData(editData);

      // 异步获取现有密码
      if (editingEntry.id) {
        getDecryptedPassword(editingEntry.id).then(password => {
          if (password) {
            setFormData(prev => ({ ...prev, password }));
          }
        }).catch(error => {
          console.error('Failed to load existing password:', error);
        });
      }
    } else if (isCreating) {
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        ip: '',
        db_type: '',
        db_ip: '',
        db_username: '',
        app_name: '',
        category_id: undefined,
        is_favorite: false
      });
    }
  }, [isCreating, isEditing, editingEntry, categories, getDecryptedPassword]);

  // 检查密码强度
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password).then(strength => {
        setPasswordStrength(strength);
      });
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password, checkPasswordStrength]);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const selectedCategory = categories.find(c => c.id === formData.category_id);

    if (!formData.title.trim()) {
      newErrors.title = '请输入标题';
    }

    if (!formData.category_id) {
      newErrors.category_id = '请选择分类';
    }

    if (!formData.password?.trim()) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 4) {
      newErrors.password = '密码长度至少4位';
    }

    // 根据分类验证特定字段
    if (selectedCategory) {
      if (selectedCategory.name === '网站') {
        if (!formData.url?.trim()) {
          newErrors.url = '请输入网站地址';
        } else if (!isValidUrl(formData.url)) {
          newErrors.url = '请输入有效的URL';
        }
        if (!formData.username?.trim()) {
          newErrors.username = '请输入账号';
        }
      } else if (selectedCategory.name === '应用软件') {
        if (!formData.app_name?.trim()) {
          newErrors.app_name = '请输入应用名称';
        }
        if (!formData.username?.trim()) {
          newErrors.username = '请输入账号';
        }
      } else if (selectedCategory.name === '服务器') {
        if (!formData.ip?.trim()) {
          newErrors.ip = '请输入服务器IP';
        }
        if (!formData.username?.trim()) {
          newErrors.username = '请输入账号';
        }
      } else if (selectedCategory.name === '数据库') {
        if (!formData.db_type?.trim()) {
          newErrors.db_type = '请输入数据库类型';
        }
        if (!formData.db_ip?.trim()) {
          newErrors.db_ip = '请输入数据库IP';
        }
        if (!formData.db_username?.trim()) {
          newErrors.db_username = '请输入数据库账号';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // URL验证
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  // 更新表单字段
  const updateField = (field: keyof PasswordEntry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 获取当前选中的分类
  const selectedCategory = categories.find(c => c.id === formData.category_id);

  // 从生成器选择密码
  const handlePasswordSelect = (password: string) => {
    updateField('password', password);
    setShowGenerator(false);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isCreating) {
        await createEntry(formData);
      } else if (isEditing && editingEntry?.id) {
        await updateEntry(editingEntry.id, formData);
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save entry:', error);
      setErrors({ submit: '保存失败，请重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 关闭表单
  const handleClose = () => {
    setIsCreating(false);
    setIsEditing(false);
    setFormData({
      title: '',
      username: '',
      password: '',
      url: '',
      ip: '',
      db_type: '',
      db_ip: '',
      db_username: '',
      app_name: '',
      category_id: undefined,
      is_favorite: false
    });
    setShowPassword(false);
    setShowGenerator(false);
    setPasswordStrength(null);
    setErrors({});
  };

  // 如果不是创建或编辑状态，不渲染
  if (!isCreating && !isEditing) {
    return null;
  }

  return (
    <div className="feather-glass-modal-backdrop" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="feather-glass-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-medium theme-text-primary flex items-center gap-2">
            <Lock size={20} 
            className="theme-text-secondary" />
            {isCreating ? '添加密码' : '编辑密码'}
          </h2>
          <button onClick={handleClose}
            className="p-1.5 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary feather-glass-deco"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} 
          className="p-4 space-y-4">
          {/* 分类和标题 - 并排布局 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 分类选择 */}
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                分类 *
              </label>
              <CustomSelect icon={<Key size={16} />}
                value={formData.category_id?.toString() || ''} onChange={(value) => updateField('category_id', value ? parseInt(value) : undefined)}
                placeholder="选择分类"
                options={categories.map(category => {
                  const IconComponent = getIconComponent(category.icon);
                  return {
                    value: category.id!.toString(),
                    label: category.name,
                    icon: React.createElement(IconComponent, {
                      size: 16,
                      style: { color: category.color }
                    })
                  };
                })}
                error={!!errors.category_id}
              />
              {errors.category_id && <p className="mt-1 text-sm theme-text-error">{errors.category_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                标题 *
              </label>
              <input type="text"
                value={formData.title} onChange={(e) => updateField('title', e.target.value)}
                placeholder={
                  selectedCategory?.name === '网站' ? '例如: Gmail、GitHub' :
                  selectedCategory?.name === '应用软件' ? '例如: 微信、钉钉' :
                  selectedCategory?.name === '服务器' ? '例如: 阿里云服务器' :
                  selectedCategory?.name === '数据库' ? '例如: MySQL生产库' :
                  '输入标题'
                }
            className={cn(
                  'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                  errors.title ? 'border border-red-400/40' : 'border border-white/20'
                )}
              />
              {errors.title && <p className="mt-1 text-xs theme-text-error">{errors.title}</p>}
            </div>
          </div>
          {selectedCategory?.name === '网站' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">网站地址 *</label>
                <input
                  type="text"
                  value={formData.url || ''}
                  onChange={(e) => updateField('url', e.target.value)}
                  placeholder="https://example.com"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                    errors.url ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                />
                {errors.url && <p className="mt-1 text-sm theme-text-error">{errors.url}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">账号 *</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => updateField('username', e.target.value)}
                  placeholder="用户名或邮箱"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                    errors.username ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                />
                {errors.username && <p className="mt-1 text-sm theme-text-error">{errors.username}</p>}
              </div>
            </div>
          )}

          {selectedCategory?.name === '应用软件' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">应用名称 *</label>
                <input type="text"
                  value={formData.app_name || ''} onChange={(e) => updateField('app_name', e.target.value)}
                  placeholder="微信、钉钉、QQ等"
                  
            className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                    errors.app_name ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                />
                {errors.app_name && <p className="mt-1 text-sm theme-text-error">{errors.app_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">账号 *</label>
                <input type="text"
                  value={formData.username || ''} onChange={(e) => updateField('username', e.target.value)}
                  placeholder="账号名或手机号"
                  
            className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                    errors.username ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                />
                {errors.username && <p className="mt-1 text-sm theme-text-error">{errors.username}</p>}
              </div>
            </div>
          )}

          {selectedCategory?.name === '服务器' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">服务器IP *</label>
                <input
                  type="text"
                  value={formData.ip || ''}
                  onChange={(e) => updateField('ip', e.target.value)}
                  placeholder="192.168.1.1"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                    errors.ip ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                />
                {errors.ip && <p className="mt-1 text-sm theme-text-error">{errors.ip}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">账号 *</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => updateField('username', e.target.value)}
                  placeholder="root、admin等"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                    errors.username ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                />
                {errors.username && <p className="mt-1 text-sm theme-text-error">{errors.username}</p>}
              </div>
            </div>
          )}

          {selectedCategory?.name === '数据库' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">数据库类型 *</label>
                <select
                  value={formData.db_type || ''}
                  onChange={(e) => updateField('db_type', e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary feather-glass-deco',
                    errors.db_type ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                >
                  <option value="">选择数据库类型</option>
                  <option value="MySQL">MySQL</option>
                  <option value="PostgreSQL">PostgreSQL</option>
                  <option value="Oracle">Oracle</option>
                  <option value="SQL Server">SQL Server</option>
                  <option value="MongoDB">MongoDB</option>
                  <option value="Redis">Redis</option>
                </select>
                {errors.db_type && <p className="mt-1 text-sm theme-text-error">{errors.db_type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium theme-text-secondary mb-2">数据库IP *</label>
                <input
                  type="text"
                  value={formData.db_ip || ''}
                  onChange={(e) => updateField('db_ip', e.target.value)}
                  placeholder="192.168.1.100"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                    errors.db_ip ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                />
                {errors.db_ip && <p className="mt-1 text-sm theme-text-error">{errors.db_ip}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium theme-text-secondary mb-2">数据库账号 *</label>
                <input
                  type="text"
                  value={formData.db_username || ''}
                  onChange={(e) => updateField('db_username', e.target.value)}
                  placeholder="数据库用户名"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                    errors.db_username ? 'border border-red-400/40' : 'border border-white/20'
                  )}
                />
                {errors.db_username && <p className="mt-1 text-sm theme-text-error">{errors.db_username}</p>}
              </div>
            </div>
          )}

          {/* 密码 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium theme-text-secondary">
                密码 *
              </label>
              <button type="button"
                onClick={() => setShowGenerator(!showGenerator)}
            className="text-sm theme-text-accent hover:theme-text-accent-hover flex items-center gap-1"
              >
                <Key size={16} />
                {showGenerator ? '隐藏生成器' : '密码生成器'}
              </button>
            </div>
            
            <div className="relative">
              <Lock size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 theme-text-tertiary" />
              <input type={showPassword ? 'text' : 'password'} value={formData.password}
                onChange={(e) => updateField('password', e.target.value)} placeholder="输入密码"
                
            className={cn(
                  'w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                  errors.password ? 'border border-red-400/40' : 'border border-white/20'
                )}
              />
              <button type="button"
                onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 theme-text-tertiary hover:theme-text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {errors.password && <p className="mt-1 text-sm theme-text-error">{errors.password}</p>}

            {/* 密码强度指示器 */}
            {passwordStrength && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="theme-text-secondary">密码强度:</span>
                  <span className={cn(
                    'font-medium',
                    passwordStrength.level === 'weak' && 'theme-text-error',
                    passwordStrength.level === 'fair' && 'text-yellow-500',
                    passwordStrength.level === 'good' && 'theme-text-accent',
                    passwordStrength.level === 'strong' && 'theme-text-success'
                  )}>
                    {passwordStrength.level === 'weak' && '弱'}
                    {passwordStrength.level === 'fair' && '一般'}
                    {passwordStrength.level === 'good' && '良好'}
                    {passwordStrength.level === 'strong' && '强'}
                  </span>
                </div>
                <div className="w-full theme-bg-tertiary rounded-full h-1.5">
                  <div className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      passwordStrength.level === 'weak' && 'status-error',
                      passwordStrength.level === 'fair' && 'bg-yellow-500',
                      passwordStrength.level === 'good' && 'theme-bg-accent',
                      passwordStrength.level === 'strong' && 'status-success'
                    )} style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          {showGenerator && (
            <div className="border theme-border rounded-lg max-h-[400px] overflow-y-auto">
              <PasswordGenerator onPasswordSelect={handlePasswordSelect} />
            </div>
          )}

          {/* 错误提示 */}
          {errors.submit && (
            <div className="p-3 theme-bg-error/10 border theme-border-error/50 rounded-lg">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            <button type="button"
              onClick={handleClose}
            className="px-6 py-3 rounded-lg transition-all hover:scale-[1.02] theme-text-secondary feather-glass-deco"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button type="submit"
              disabled={isSubmitting}
            className="flex-1 px-6 py-3 theme-button-primary rounded-lg transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isCreating ? '创建' : '保存'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};








