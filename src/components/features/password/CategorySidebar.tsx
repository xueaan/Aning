import React from 'react';
import { usePasswordStore } from '@/stores';
import { getIconComponent } from '@/constants/commonIcons';

export const CategorySidebar: React.FC = () => {
  const {
    categories,
    selectedCategory,
    entries,
    selectCategory,
    clearSearch
  } = usePasswordStore();

  // 获取分类下的条目数量
  const getCategoryCount = (categoryId?: number) => {
    if (!categoryId) return 0;
    return entries.filter(entry => entry.category_id === categoryId).length;
  };

  return (
    <div className="h-full bg-bg-primary flex flex-col">
      {/* 简洁头部 */}
      <div className="p-6 pb-4">
        <h2 className="text-lg font-semibold text-text-primary">
          分类管理
        </h2>
      </div>
      <div className="flex-1 px-4 pb-6">
        <div className="space-y-2">
          {categories.map((category) => (
            <button 
              key={category.id} 
              onClick={() => {
                selectCategory(category);
                clearSearch();
              }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all duration-200 ${selectedCategory?.id === category.id
                ? 'theme-bg-accent theme-text-on-accent shadow-lg shadow-accent/25 scale-[1.02]'
                : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary hover:scale-[1.01]'
              }`}
            >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: selectedCategory?.id === category.id
                ? 'rgba(255,255,255,0.2)'
                : `${category.color}15`,
              color: selectedCategory?.id === category.id
                ? 'white'
                : category.color
            }}
          >
            {React.createElement(getIconComponent(category.icon), {
              theme: 'outline',
              size: 20,
              fill: 'currentColor',
              strokeWidth: 2
            })}
          </div>
          <div className="flex-1">
            <div className="font-medium text-base">
              {category.name}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${selectedCategory?.id === category.id
                ? 'theme-bg-secondary/20 theme-text-on-accent'
                : 'bg-bg-tertiary text-text-tertiary'
              }`}
          >
            {getCategoryCount(category.id)}
          </div>
        </button>
          ))}
      </div>
    </div>
    </div>
  );
};











