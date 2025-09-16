import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKnowledgeOperations } from '@/stores';
import { X, FolderOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetParentId?: string) => void;
  sourceId: string;
  mode: 'move' | 'copy';
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sourceId,
  mode,
}) => {
  // Store references removed - themeMode cleanup
  const { pageTree, pages } = useKnowledgeOperations();
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const source = pages.find((p) => p.id === sourceId);

  useEffect(() => {
    if (isOpen) {
      setSelectedParentId(undefined);
      setExpandedIds(new Set());
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(selectedParentId);
    onClose();
  };

  const toggleExpand = (pageId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedIds(newExpanded);
  };

  const isDescendant = (pageId: string, ancestorId: string): boolean => {
    const page = pages.find((p) => p.id === pageId);
    if (!page || !page.parent_id) return false;
    if (page.parent_id === ancestorId) return true;
    return isDescendant(page.parent_id, ancestorId);
  };

  const renderNode = (page: any, level: number = 0) => {
    const isExpanded = expandedIds.has(page.id);
    const hasChildren = page.children && page.children.length > 0;
    const isSelected = selectedParentId === page.id;
    const isSource = page.id === sourceId;

    // 移动时不能选择自己或自己的子页面
    const isDisabled = mode === 'move' && (isSource || isDescendant(page.id, sourceId));

    return (
      <div key={page.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isDisabled
              ? 'opacity-50 cursor-not-allowed'
              : isSelected
                ? 'theme-bg-accent theme-text-on-accent'
                : 'hover:theme-bg-secondary/20'
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => {
            if (!isDisabled) {
              setSelectedParentId(isSelected ? undefined : page.id);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(page.id);
              }}
              className="p-0.5 rounded hover:bg-black/10"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <FileText size={16} />
          <span className="text-sm truncate flex-1">{page.title || '无标题'}</span>
        </div>

        {hasChildren && isExpanded && (
          <div>{page.children.map((child: any) => renderNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-[500px] max-h-[600px] flex flex-col rounded-xl shadow-2xl bg-bg-primary/90 backdrop-blur-md border border-border-primary/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-border-primary/20">
            <div>
              <h3 className="text-lg font-medium theme-text-primary">
                {mode === 'move' ? '移动页面' : '复制页面'}
              </h3>
              <p className="text-sm mt-1 theme-text-secondary">
                {mode === 'move' ? '移动' : '复制'} "{source?.title || '无标题'}" 到：
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary/20"
            >
              <X size={16} />
            </button>
          </div>

          {/* 页面树 */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-2 transition-colors ${
                selectedParentId === undefined
                  ? 'theme-bg-accent theme-text-on-accent'
                  : 'hover:theme-bg-secondary/20'
              }`}
              onClick={() => setSelectedParentId(undefined)}
            >
              <FolderOpen size={16} />
              <span className="text-sm font-medium">根级页面</span>
            </div>

            <div className="space-y-1">{pageTree.map((page) => renderNode(page))}</div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-border-primary/20">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium transition-colors theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary/20"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg font-medium transition-colors theme-bg-accent theme-text-on-accent hover:theme-bg-accent-hover"
            >
              确认{mode === 'move' ? '移动' : '复制'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
