import React, { useState, useEffect } from 'react';
import { useHomeStore } from '@/stores/homeStore';
import { open } from '@tauri-apps/plugin-shell';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

export const Home: React.FC = () => {
  // const appStore = useAppStore(); // Unused for now
  const {
    shortcuts,
    addShortcut,
    updateShortcut,
    deleteShortcut
  } = useHomeStore();

  // State declarations - 所有状态声明
  const [searchQuery, setSearchQuery] = useState('');
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', url: '' });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ title: '', url: '' });
  const [searchEngineIndex, setSearchEngineIndex] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 计算时间进度的工具函数
  const getTimeProgress = () => {
    const now = new Date();

    // 计算今日进度 (0-100%)
    const todayMs = now.getHours() * 60 * 60 * 1000 +
      now.getMinutes() * 60 * 1000 +
      now.getSeconds() * 1000;
    const totalDayMs = 24 * 60 * 60 * 1000;
    const dayProgress = Math.floor((todayMs / totalDayMs) * 100);

    // 计算本周进度 (0-100%)
    const dayOfWeek = now.getDay(); // 0=周日, 1=周一...6=周六
    const mondayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 转换为周一=0, 周二=1...周日=6
    const weekProgress = Math.floor(((mondayOfWeek + dayProgress / 100) / 7) * 100);

    // 计算本年进度 (0-100%)  
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const yearProgress = Math.floor(((now.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime())) * 100);

    return {
      day: { progress: dayProgress, remaining: 100 - dayProgress },
      week: { progress: weekProgress, remaining: 100 - weekProgress },
      year: { progress: yearProgress, remaining: 100 - yearProgress }
    };
  };

  // 时间进度显示组件
  const ProgressDisplay = () => {
    const progress = getTimeProgress();

    return (
      <div className="space-y-4">
        {/* 三个垂直进度条 */}
        <div className="flex justify-center items-end gap-6 h-32">
          {/* 今日进度 */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-medium mb-2 theme-text-secondary">今日</div>
            <div className="relative w-8 h-24 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-blue-600 transition-all duration-1000 ease-out rounded-full"
                style={{ height: `${progress.day.progress}%` }}
              />
            </div>
            <div className="text-xs font-medium mt-2 theme-text-primary">
              {progress.day.progress}%
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs font-medium mb-2 theme-text-secondary">本周</div>
            <div className="relative w-8 h-24 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-green-400 to-green-600 transition-all duration-1000 ease-out rounded-full"
                style={{ height: `${progress.week.progress}%` }}
              />
            </div>
            <div className="text-xs font-medium mt-2 theme-text-primary">
              {progress.week.progress}%
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs font-medium mb-2 theme-text-secondary">本年</div>
            <div className="relative w-8 h-24 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-purple-400 to-purple-600 transition-all duration-1000 ease-out rounded-full"
                style={{ height: `${progress.year.progress}%` }}
              />
            </div>
            <div className="text-xs font-medium mt-2 theme-text-primary">
              {progress.year.progress}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 搜索引擎配置
  const searchEngines = [
    {
      name: '百度',
      url: 'https://www.baidu.com/s?wd=',
      placeholder: '百度一下',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm7 0c.83 0 1.5.67 1.5 1.5S16.33 11 15.5 11 14 10.33 14 9.5 14.67 8 15.5 8zm-3.5 6c-1.48 0-2.75-.81-3.45-2H6.88c.8 2.05 2.79 3.5 5.12 3.5s4.32-1.45 5.12-3.5h-1.67c-.7 1.19-1.97 2-3.45 2z" />
        </svg>
      )
    },
    {
      name: 'Google',
      url: 'https://www.google.com/search?q=',
      placeholder: '搜索 Google',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H1.84v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H1.84C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )
    },
    {
      name: 'Bing',
      url: 'https://www.bing.com/search?q=',
      placeholder: '搜索 Bing',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.71 3v11.29l4.51 2.7L17 14.07V9.5l-4.93-1.85L10.22 6.8 5.71 3zm4.08 13.54l-2.51-1.5V6.96l2.51.94v8.64zm2.93-1.8l2.93 1.1V10.5l-2.93 1.1v3.14z" />
        </svg>
      )
    }
  ];

  const currentEngine = searchEngines[searchEngineIndex];

  // 显示 toast 消息
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // URL 标准化函数
  const normalizeUrl = (url: string): string => {
    if (!url) return '';
    // 移除空格
    const cleanUrl = url.trim();
    // 如果没有协议前缀，添加 https://
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return 'https://' + cleanUrl;
    }
    return cleanUrl;
  };

  // 实时时间更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 格式化日期和时间的工具函数
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日${weekday}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 智能问候语
  const getGreeting = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) {
      return { text: '早上好！', emoji: '🌅' };
    } else if (hour >= 12 && hour < 18) {
      return { text: '下午好！', emoji: '☀️' };
    } else if (hour >= 18 && hour < 22) {
      return { text: '晚上好！', emoji: '🌙' };
    } else {
      return { text: '深夜了！', emoji: '🌃' };
    }
  };

  // 处理搜索
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const fullSearchUrl = currentEngine.url + encodeURIComponent(searchQuery);
      await open(fullSearchUrl);
      setSearchQuery(''); // 清空搜索框
    }
  };

  // 切换搜索引擎
  const switchSearchEngine = () => {
    setSearchEngineIndex((prev) => (prev + 1) % searchEngines.length);
  };

  // 编辑快捷方式
  const handleEdit = (id: string) => {
    const shortcut = shortcuts.find(s => s.id === id);

    if (shortcut) {
      const formData = {
        title: shortcut.title || '',
        url: shortcut.url || ''
      };
      setEditFormData(formData);
      setEditingShortcut(id);
    } else {
      console.error('Shortcut not found for editing:', id);
    }
  };

  // 保存编辑
  const handleSaveEdit = () => {

    if (editingShortcut && editFormData.title && editFormData.url) {
      updateShortcut(editingShortcut, editFormData);

      setEditingShortcut(null);
      setEditFormData({ title: '', url: '' });
      showToast('快捷方式更新成功', 'success');
    }
  };

  // 删除快捷方式
  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  // 获取要删除的快捷方式名称
  const getDeleteTargetName = () => {
    if (!deleteTargetId) return '';
    const shortcut = shortcuts.find(s => s.id === deleteTargetId);
    return shortcut?.title || '快捷方式';
  };

  // 确认删除快捷方式
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    try {
      deleteShortcut(deleteTargetId);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error('Failed to delete shortcut:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 添加新快捷方式
  const handleAdd = () => {
    if (newShortcut.title && newShortcut.url) {
      addShortcut(newShortcut);

      // 验证添加结果
      setTimeout(() => {
        // Add validation logic here if needed
      }, 100);

      setNewShortcut({ title: '', url: '' });
      setShowAddDialog(false);
      showToast('快捷方式添加成功', 'success');
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 内容区 */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-16 pb-8 px-8">
        {/* 时间和天气显示 */}
        <div className="w-full max-w-4xl mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* 左侧：时间和问候语 */}
            <div className="text-center py-12 px-8 rounded-2xl flex flex-col justify-center min-h-[200px] feather-glass-deco">
              <div className="text-sm mb-3 theme-text-tertiary">
                {formatDate(currentTime)}
              </div>

              <div className="text-5xl lg:text-7xl font-light mb-4 theme-text-primary leading-tight">
                {formatTime(currentTime)}
              </div>

              <div className="text-xl lg:text-2xl flex items-center justify-center gap-3 theme-text-primary">
                <span className="text-2xl lg:text-3xl">{getGreeting(currentTime).emoji}</span>
                <span>{getGreeting(currentTime).text}</span>
              </div>
            </div>
            <div className="py-8 px-6 rounded-2xl text-center flex flex-col justify-center min-h-[200px] feather-glass-deco">
              <ProgressDisplay />
            </div>
          </div>
        </div>

        {/* 搜索区域 */}
        <div className="w-full max-w-4xl mb-12">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center overflow-hidden rounded-2xl feather-glass-deco">
              {/* 搜索引擎切换按钮 */}
              <button type="button"
                onClick={switchSearchEngine} 
                className="px-4 py-3.5 font-bold text-sm border-r theme-text-primary theme-border-primary/40 transition-all hover:bg-white/10"
                title={`当前：${currentEngine.name}\n点击切换`}>
                {currentEngine.icon}
              </button>
              <input 
                type="text"
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={currentEngine.placeholder}
                autoFocus
                className="flex-1 px-5 py-3.5 bg-transparent outline-none text-base theme-text-primary placeholder:theme-text-tertiary"
              />

              {/* 搜索按钮 */}
              <button 
                type="submit"
                className="px-5 py-3.5 transition-all hover:bg-white/10 group theme-text-primary">
                <Search size={22} className="transition-transform group-hover:scale-110" />
              </button>
            </div>
          </form>
        </div>

        {/* 快捷方式网格 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 max-w-4xl w-full">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.id} className={`relative group ${editingShortcut === shortcut.id ? 'col-span-3 md:col-span-2' : ''}`}>
              {editingShortcut === shortcut.id ? (
                // 编辑模式
                <div className="p-4 rounded-2xl feather-glass-panel">
                  {/* 标题输入区域 */}
                  <div className="mb-2">
                    <input 
                      type="text"
                      value={editFormData.title} 
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full text-center text-sm py-2.5 px-4 rounded-lg bg-transparent outline-none theme-text-primary placeholder:theme-text-tertiary feather-glass-content"
                      style={{ border: '1px solid rgba(var(--border-primary), 0.2)' }}
                      placeholder="网站名称"
                    />
                  </div>
                  <div className="mb-4">
                    <input 
                      type="text"
                      value={editFormData.url} 
                      onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                      className="w-full text-center text-sm py-2.5 px-4 rounded-lg bg-transparent outline-none theme-text-primary placeholder:theme-text-tertiary feather-glass-content"
                      style={{ border: '1px solid rgba(var(--border-primary), 0.2)' }}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleSaveEdit} 
                      className="flex-1 py-2.5 px-4 text-sm font-medium rounded-xl theme-text-on-accent transition-all hover:scale-105 feather-glass-content">
                      ✓ 保存
                    </button>
                    <button 
                      onClick={() => {
                        setEditingShortcut(null);
                        setEditFormData({ title: '', url: '' });
                      }}
                      className="flex-1 py-2.5 px-4 text-sm font-medium rounded-xl theme-text-secondary transition-all hover:scale-105 feather-glass-deco">
                      ✕ 取消
                    </button>
                  </div>
                </div>
              ) : (
                // 正常显示模式
                <div className="relative">
                  <div 
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (!shortcut.url) {
                        console.error('Shortcut URL is empty:', shortcut);
                        showToast('错误：快捷方式URL为空!', 'error');
                        return;
                      }
                      try {
                        const normalizedUrl = normalizeUrl(shortcut.url);
                        await open(normalizedUrl);
                        showToast(`正在打开 ${shortcut.title}`, 'success');
                      } catch (error) {
                        console.error('Tauri open() failed:', error);
                        try {
                          const normalizedUrl = normalizeUrl(shortcut.url);
                          window.open(normalizedUrl, '_blank');
                          showToast(`正在打开 ${shortcut.title} (备用方式)`, 'success');
                        } catch (backupError) {
                          console.error('window.open also failed:', backupError);
                          showToast(`无法打开链接: ${shortcut.url}`, 'error');
                        }
                      }
                    }}
                    className="block p-4 cursor-pointer select-none rounded-2xl transition-all hover:scale-105 feather-glass-deco w-full">
                    <div className="text-sm text-center theme-text-primary font-medium">
                      {shortcut.title}
                    </div>
                  </div>
                  {/* 悬停时显示的操作按钮 */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(shortcut.id);
                      }}
                      className="w-6 h-6 rounded-lg feather-glass-content hover:theme-bg-accent transition-colors theme-text-primary flex items-center justify-center"
                      title="编辑">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(shortcut.id);
                      }}
                      className="w-6 h-6 rounded-lg feather-glass-content hover:bg-red-500/20 transition-colors text-red-400 flex items-center justify-center"
                      title="删除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 添加按钮/添加表单 */}
          <div className={`relative group ${showAddDialog ? 'col-span-3 md:col-span-2' : ''}`}>
            {showAddDialog ? (
              // 添加模式
              <div className="p-4 rounded-2xl feather-glass-panel">
                {/* 标题输入区域 */}
                <div className="mb-2">
                  <input 
                    type="text"
                    value={newShortcut.title} 
                    onChange={(e) => setNewShortcut({ ...newShortcut, title: e.target.value })}
                    className="w-full text-center text-sm py-2.5 px-4 rounded-lg bg-transparent outline-none theme-text-primary placeholder:theme-text-tertiary feather-glass-content"
                    style={{ border: '1px solid rgba(var(--border-primary), 0.2)' }}
                    placeholder="网站名称"
                  />
                </div>
                <div className="mb-4">
                  <input 
                    type="text"
                    value={newShortcut.url} 
                    onChange={(e) => setNewShortcut({ ...newShortcut, url: e.target.value })}
                    className="w-full text-center text-sm py-2.5 px-4 rounded-lg bg-transparent outline-none theme-text-primary placeholder:theme-text-tertiary feather-glass-content"
                    style={{ border: '1px solid rgba(var(--border-primary), 0.2)' }}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleAdd} 
                    className="flex-1 py-2.5 px-4 text-sm font-medium rounded-xl theme-text-on-accent transition-all hover:scale-105 feather-glass-content">
                    ✓ 保存
                  </button>
                  <button 
                    onClick={() => {
                      setShowAddDialog(false);
                      setNewShortcut({ title: '', url: '' });
                    }}
                    className="flex-1 py-2.5 px-4 text-sm font-medium rounded-xl theme-text-secondary transition-all hover:scale-105 feather-glass-deco">
                    ✕ 取消
                  </button>
                </div>
              </div>
            ) : (
              // 添加按钮
              <button 
                onClick={() => setShowAddDialog(true)}
                className="block p-4 cursor-pointer select-none rounded-2xl transition-all hover:scale-105 feather-glass-deco w-full">
                <div className="text-sm text-center theme-text-primary font-medium">
                  ＋ 添加
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 删除确认弹窗 */}
        <ConfirmDeleteModal 
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          title="删除快捷方式"
          itemName={getDeleteTargetName()}
          isLoading={isDeleting}
        />

        {/* Toast 消息 */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all transform ${
            toast.type === 'success' ? 'status-success' :
            toast.type === 'error' ? 'status-error' :
            'status-info'
          } theme-text-on-accent`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};