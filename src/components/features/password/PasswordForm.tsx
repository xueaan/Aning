import React from 'react';
import { usePasswordStore } from '@/stores';
import { PasswordGenerator } from './PasswordGenerator';
import { CustomSelect } from './components/CustomSelect';
import { CategoryFields } from './components/CategoryFields';
import { PasswordStrengthIndicator } from './components/PasswordStrengthIndicator';
import { usePasswordFormState } from './hooks/usePasswordFormState';
import { usePasswordFormValidation } from './hooks/usePasswordFormValidation';
import { X, Lock, Eye, EyeOff, Key, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIconComponent } from '@/constants/commonIcons';

export const PasswordForm: React.FC = () => {
  const {
    isCreating,
    isEditing,
    editingEntry,
    categories,
    createEntry,
    updateEntry,
    setIsCreating,
    setIsEditing
  } = usePasswordStore();

  // 使用自定义 hooks
  const {
    formData,
    showPassword,
    setShowPassword,
    showGenerator,
    setShowGenerator,
    passwordStrength,
    isSubmitting,
    setIsSubmitting,
    updateField
  } = usePasswordFormState({ isCreating, isEditing, editingEntry: editingEntry || null, categories });

  const {
    errors,
    validateForm,
    setSubmitError
  } = usePasswordFormValidation(categories);

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  // 事件处理函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && editingEntry) {
        await updateEntry(editingEntry.id!, formData);
      } else {
        await createEntry(formData);
      }
      handleClose();
    } catch (error: any) {
      console.error('保存失败:', error);
      setSubmitError(error.message || '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCreating(false);
    setIsEditing(false);
    setShowPassword(false);
    setShowGenerator(false);
  };

  const handlePasswordSelect = (password: string) => {
    updateField('password', password);
    setShowGenerator(false);
  };

  if (!isCreating && !isEditing) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="theme-bg-primary backdrop-blur-md border theme-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b theme-border">
          <div className="flex items-center gap-3">
            <div className="p-2 theme-bg-accent/20 rounded-lg">
              <Lock size={20} className="theme-text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold theme-text-primary">
                {isCreating ? '添加密码' : '编辑密码'}
              </h2>
              <p className="text-sm theme-text-secondary">
                {isCreating ? '创建新的密码条目' : '修改现有密码信息'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:theme-bg-tertiary theme-text-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">分类 *</label>
              <CustomSelect
                icon={<Key size={16} />}
                value={formData.category_id?.toString() || ''}
                onChange={(value) => updateField('category_id', value ? Number(value) : undefined)}
                placeholder="选择分类"
                options={categories.map(category => ({
                  value: category.id?.toString() || '',
                  label: category.name,
                  icon: getIconComponent(category.icon || 'folder')
                }))}
                error={!!errors.category_id}
              />
              {errors.category_id && <p className="mt-1 text-xs theme-text-error">{errors.category_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                {selectedCategory?.name === '网站' ? '网站名称' : 
                 selectedCategory?.name === '应用软件' ? '软件名称' :
                 selectedCategory?.name === '服务器' ? '服务器名称' :
                 selectedCategory?.name === '数据库' ? '数据库名称' :
                 '输入标题'} *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder={
                  selectedCategory?.name === '网站' ? '网站名称' : 
                  selectedCategory?.name === '应用软件' ? '软件名称' :
                  selectedCategory?.name === '服务器' ? '服务器名称' :
                  selectedCategory?.name === '数据库' ? '数据库名称' :
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

          {/* Category-specific fields */}
          {selectedCategory && (
            <CategoryFields
              category={selectedCategory}
              formData={formData}
              errors={errors}
              updateField={updateField}
            />
          )}

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium theme-text-secondary">密码 *</label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-xs theme-text-accent hover:theme-text-accent/80 transition-colors flex items-center gap-1"
              >
                <Key size={12} />
                {showGenerator ? '隐藏生成器' : '密码生成器'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="输入密码"
                className={cn(
                  'w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco',
                  errors.password ? 'border border-red-400/40' : 'border border-white/20'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 theme-text-muted hover:theme-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs theme-text-error">{errors.password}</p>}

            {/* Password Strength Indicator */}
            {passwordStrength && (
              <div className="mt-2">
                <PasswordStrengthIndicator strength={passwordStrength} />
              </div>
            )}
          </div>

          {/* Password Generator */}
          {showGenerator && (
            <div className="border theme-border rounded-lg max-h-[400px] overflow-y-auto">
              <PasswordGenerator onPasswordSelect={handlePasswordSelect} />
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 theme-bg-error/10 border theme-border-error/50 rounded-lg">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={handleClose}
              className="px-6 py-3 rounded-lg transition-all hover:scale-[1.02] theme-text-secondary feather-glass-deco"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button 
              type="submit"
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