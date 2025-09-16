import { useState } from 'react';
import { PasswordEntry, Category } from '@/types/password';

export const usePasswordFormValidation = (categories: Category[]) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (formData: PasswordEntry): boolean => {
    const newErrors: Record<string, string> = {};
    const selectedCategory = categories.find((c) => c.id === formData.category_id);

    if (!formData.title?.trim()) {
      newErrors.title = '标题不能为空';
    }

    if (!formData.category_id) {
      newErrors.category_id = '请选择分类';
    }

    if (!formData.password?.trim()) {
      newErrors.password = '密码不能为空';
    }

    // 根据分类验证特定字段
    if (selectedCategory) {
      switch (selectedCategory.name) {
        case '网站':
          if (!formData.url?.trim()) {
            newErrors.url = '网站地址不能为空';
          }
          if (!formData.username?.trim()) {
            newErrors.username = '账号不能为空';
          }
          break;
        case '应用软件':
          if (!formData.app_name?.trim()) {
            newErrors.app_name = '应用名称不能为空';
          }
          if (!formData.username?.trim()) {
            newErrors.username = '账号不能为空';
          }
          break;
        case '服务器':
          if (!formData.ip?.trim()) {
            newErrors.ip = '服务器IP不能为空';
          }
          if (!formData.username?.trim()) {
            newErrors.username = '账号不能为空';
          }
          break;
        case '数据库':
          if (!formData.db_type?.trim()) {
            newErrors.db_type = '数据库类型不能为空';
          }
          if (!formData.db_ip?.trim()) {
            newErrors.db_ip = '数据库IP不能为空';
          }
          if (!formData.db_username?.trim()) {
            newErrors.db_username = '数据库用户名不能为空';
          }
          break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
  };

  const setSubmitError = (error: string) => {
    setErrors((prev) => ({ ...prev, submit: error }));
  };

  return {
    errors,
    validateForm,
    clearErrors,
    setSubmitError,
  };
};
