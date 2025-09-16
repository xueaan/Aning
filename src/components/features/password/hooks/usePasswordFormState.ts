import { useState, useEffect } from 'react';
import { PasswordEntry, PasswordEntryDisplay, Category } from '@/types/password';
import { usePasswordStore } from '@/stores';

interface UsePasswordFormStateProps {
  isCreating: boolean;
  isEditing: boolean;
  editingEntry: PasswordEntryDisplay | null;
  categories: Category[];
}

export const usePasswordFormState = ({
  isCreating,
  isEditing,
  editingEntry,
  categories,
}: UsePasswordFormStateProps) => {
  const { getDecryptedPassword, checkPasswordStrength } = usePasswordStore();

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
    is_favorite: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          if (
            editingEntry.category_id &&
            categories.find((c) => c.id === editingEntry.category_id)
          ) {
            return editingEntry.category_id;
          }
          if (editingEntry.url) return categories.find((c) => c.name === '网站')?.id;
          if (editingEntry.app_name) return categories.find((c) => c.name === '应用软件')?.id;
          if (editingEntry.ip) return categories.find((c) => c.name === '服务器')?.id;
          if (editingEntry.db_type) return categories.find((c) => c.name === '数据库')?.id;
          return categories.length > 0 ? categories[0].id : undefined;
        })(),
        is_favorite: false,
      };
      setFormData(editData);

      // 异步获取现有密码
      if (editingEntry.id) {
        getDecryptedPassword(editingEntry.id)
          .then((password) => {
            if (password) {
              setFormData((prev) => ({ ...prev, password }));
            }
          })
          .catch((error) => {
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
        is_favorite: false,
      });
    }
  }, [isCreating, isEditing, editingEntry, categories, getDecryptedPassword]);

  // 检查密码强度
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password).then((strength) => {
        setPasswordStrength(strength);
      });
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password, checkPasswordStrength]);

  const updateField = (field: keyof PasswordEntry, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    showGenerator,
    setShowGenerator,
    passwordStrength,
    isSubmitting,
    setIsSubmitting,
    updateField,
  };
};
