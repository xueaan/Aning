import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Habit, HabitFrequency } from '@/types';
import { CheckCircle2 } from 'lucide-react';
import { X } from 'lucide-react';
import { IconPicker } from '@/components/common/IconPicker';
import { convertEmojiToIcon } from '@/constants/commonIcons';

interface HabitFormProps {
  habit?: Habit;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) => void;
}

const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' }
];

export const HabitForm: React.FC<HabitFormProps> = ({
  habit,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
    frequency: 'daily' as HabitFrequency,
    target_count: 1,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 当编辑习惯时，填充表单数据
  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        description: habit.description || '',
        icon: habit.icon?.length === 1 ? convertEmojiToIcon(habit.icon) : habit.icon,
        color: '#3b82f6',
        frequency: habit.frequency,
        target_count: habit.target_count || 1,
        is_active: habit.is_active
      });
    } else {
      resetForm();
    }
    setErrors({});
  }, [habit, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#3b82f6',
      frequency: 'daily',
      target_count: 1,
      is_active: true
    });
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入习惯名称';
    }

    if (formData.target_count < 1) {
      newErrors.target_count = '目标次数至少为1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('保存习惯失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="feather-glass-modal-backdrop" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="feather-glass-modal w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-medium theme-text-primary">
            {habit ? '编辑习惯' : '创建习惯'}
          </h2>
          <button onClick={handleClose}
            className="p-1.5 rounded-lg transition-all hover:scale-105 theme-text-secondary hover:theme-text-primary feather-glass-deco"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 习惯名称 */}
          <div>
            <input type="text"
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="输入习惯名称..."
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary feather-glass-deco"
              required
              maxLength={50}
              autoFocus
            />
            {errors.name && (
              <p className="theme-text-error text-xs mt-2">{errors.name}</p>
            )}
          </div>
          
          <div>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="简要描述这个习惯的意义和目标..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary placeholder:theme-text-tertiary resize-none feather-glass-deco"
              maxLength={200}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium theme-text-secondary mb-2">
              选择图标
            </label>
            <div className="rounded-lg p-3 feather-glass-deco">
              <IconPicker 
                selectedIcon={formData.icon} 
                onIconSelect={(iconName) => setFormData({ ...formData, icon: iconName })}
                mode="inline"
                size="sm"
                showSearch={false}
                maxHeight="max-h-40"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                频率
              </label>
              <select 
                value={formData.frequency} 
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as HabitFrequency })}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary feather-glass-deco"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq.value} value={freq.value} className="theme-bg-primary theme-text-primary">
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-secondary mb-2">
                目标次数
              </label>
              <input type="number"
                min="1"
                max="99"
                value={formData.target_count} 
                onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:theme-ring-accent transition-all theme-text-primary feather-glass-deco"
              />
              {errors.target_count && (
                <p className="theme-text-error text-xs mt-1">{errors.target_count}</p>
              )}
            </div>
          </div>
          
          {/* 激活状态 */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium theme-text-primary">
              激活习惯
            </label>
            <button type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30 ${formData.is_active ? 'theme-bg-accent' : 'theme-bg-secondary'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          {/* 按钮组 */}
          <div className="flex gap-3 pt-2">
            <button type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-lg transition-all hover:scale-[1.02] theme-text-secondary feather-glass-deco"
              disabled={isLoading}
            >
              取消
            </button>
            <button type="submit"
              className="flex-1 px-4 py-3 theme-button-primary rounded-lg transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                '保存中...'
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {habit ? '保存更改' : '创建'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};