import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HabitWithStats } from '@/types';
import { CheckCircle2, Edit2, Trash2, MoreHorizontal, Flame } from 'lucide-react';
import { getIconComponent } from '@/constants/commonIcons';

interface HabitCardProps {
  habit: HabitWithStats;
  onComplete: (habitId: number) => void;
  onUndo?: (habitId: number) => void;
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (habitId: number) => void;
  showActions?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onComplete,
  onUndo,
  onEdit,
  onDelete,
  showActions = true
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCompleted = !!habit.today_record;
  const streak = habit.stats?.current_streak || 0;
  const completionRate = habit.stats?.completion_rate || 0;

  const [isAnimating, setIsAnimating] = useState(false);

  // 监听外部点击，关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleComplete = async () => {
    if (!isCompleted && !isAnimating) {
      setIsAnimating(true);
      try {
        await onComplete(habit.id!);
      } catch (error) {
        console.error('打卡失败:', error);
      } finally {
        setTimeout(() => {
          setIsAnimating(false);
        }, 600);
      }
    }
  };

  const handleUndo = async () => {
    if (isCompleted && onUndo && !isAnimating) {
      setIsAnimating(true);
      try {
        await onUndo(habit.id!);
      } catch (error) {
        console.error('撤销失败:', error);
      } finally {
        setTimeout(() => setIsAnimating(false), 400);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl p-6 transition-all hover:shadow-lg duration-500 relative feather-glass-deco ${isCompleted ? 'ring-2 ring-green-500/20' : ''}`}
      style={{
        transform: 'translateZ(0)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* 习惯图标 */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${isCompleted
              ? 'bg-green-500/20 theme-text-success shadow-lg shadow-green-500/25'
              : 'opacity-80'
            }`}
            style={{
              backgroundColor: isCompleted ? undefined : habit.color + '20',
              color: isCompleted ? undefined : habit.color
            }}
          >
            {isCompleted ? <CheckCircle2 size={16} /> : React.createElement(getIconComponent(habit.icon), {
              theme: 'outline',
              size: 20,
              fill: 'currentColor',
              strokeWidth: 2
            })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-medium transition-colors ${isCompleted ? 'theme-text-success' : 'theme-text-primary'
                }`}>
                {habit.name}
              </h3>
              {streak > 0 && (
                <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full text-xs">
                  <Flame size={16} />
                  {streak}
                </div>
              )}
            </div>

            {habit.description && (
              <p className={`text-sm mb-2 transition-colors ${isCompleted ? 'theme-text-success/80' : 'theme-text-secondary'
                }`}>
                {habit.description}
              </p>
            )}

            <div className="flex items-center gap-4">
              <span className="text-xs theme-text-secondary">
                连续 {streak} 天
              </span>
              <span className="text-xs theme-text-secondary">
                完成率 {completionRate}%
              </span>
              <div className="w-16 h-1.5 theme-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 完成状态 */}
          {isCompleted ? (
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                className="flex items-center gap-2 theme-text-success"
              >
                <motion.div
                  animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle2 size={16} />
                </motion.div>
                <span className="text-sm font-medium">已完成</span>
              </motion.div>
              {onUndo && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  onClick={handleUndo}
                  disabled={isAnimating}
                  className={`px-3 py-1.5 rounded-md text-xs border transition-all duration-300 ${
                    isAnimating
                      ? 'theme-text-secondary/50 cursor-not-allowed theme-bg-secondary/50 theme-border/50'
                      : 'theme-text-secondary hover:theme-text-error hover:theme-bg-error/10 hover:theme-border-error/30 theme-bg-primary/90 theme-border hover:shadow-sm'
                  }`}
                  title="撤销打卡"
                >
                  {isAnimating ? '处理中...' : '撤销'}
                </motion.button>
              )}
            </div>
          ) : (
            <motion.button
              onClick={handleComplete}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 min-w-[80px] theme-text-accent feather-glass-deco transition-all duration-300 hover:shadow-md ${
                isAnimating ? 'opacity-80' : 'hover:scale-105'
              }`}
              disabled={isAnimating}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={isAnimating ? {
                  scale: [1, 1.15, 1],
                  opacity: [1, 0.8, 1]
                } : {}}
                transition={{
                  duration: 0.4,
                  ease: "easeInOut"
                }}
              >
                <CheckCircle2 size={16} />
              </motion.div>
              <span className={`transition-opacity duration-300 ${isAnimating ? 'opacity-70' : 'opacity-100'
              }`}>
                {isAnimating ? '打卡中...' : '完成'}
              </span>
            </motion.button>
          )}

          {/* 操作菜单 */}
          {showActions && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full transition-colors flex items-center justify-center shadow-sm feather-glass-deco"
              >
                <MoreHorizontal size={16} 
                  className="theme-text-secondary hover:theme-text-primary" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-32 rounded-lg shadow-xl z-[9999] feather-glass-deco"
                  >
                    <button
                      onClick={() => {
                        onEdit(habit);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm theme-text-secondary hover:theme-text-primary hover:theme-bg-primary/50 transition-colors flex items-center gap-2 rounded-t-lg"
                    >
                      <Edit2 size={16} />
                      编辑
                    </button>
                    <div className="h-px theme-border-primary" />
                    <button
                      onClick={() => {
                        onDelete(habit.id!);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm theme-text-error hover:theme-bg-error/10 transition-colors flex items-center gap-2 rounded-b-lg"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};