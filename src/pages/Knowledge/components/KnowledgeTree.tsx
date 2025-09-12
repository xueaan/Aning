import React, { useState } from 'react';
import { useKnowledgeStore } from '@/stores';
import { FolderOpen, Trash2, FileText, Plus, FolderMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KnowledgeBase } from '@/types';
import { EditKnowledgeBaseModal } from '@/components/modals/EditKnowledgeBaseModal';
import { CreateKnowledgeBaseModal } from '@/components/modals/CreateKnowledgeBaseModal';
import { KnowledgeBaseContextMenu } from '@/components/menus/KnowledgeBaseContextMenu';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';

interface KnowledgeTreeProps {
  className?: string;
  onSelect?: (pageId: string) => void;
  selectedId?: string | null;
  searchQuery?: string;
}

export const KnowledgeTree: React.FC<KnowledgeTreeProps> = ({
  className = '',
  onSelect,
  selectedId,
  searchQuery: externalSearchQuery
}) => {
  const {
    currentKnowledgeBase,
    pages,
    pageTree,
    expandedIds,
    toggleExpansion,
    create,
    delete: deletePage,
    update,
    deleteKnowledgeBase,
    loadKnowledgeBases,
    searchQuery
  } = useKnowledgeStore();

  const [expandedKnowledgeBases, setExpandedKnowledgeBases] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 编辑知识库相关状态
  const [editingKnowledgeBase, setEditingKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // 右键菜单相关状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    knowledgeBase: KnowledgeBase | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    knowledgeBase: null
  });

  // 删除确认相关状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    knowledgeBase: KnowledgeBase | null;
  }>({
    isOpen: false,
    knowledgeBase: null
  });
  const [isDeletingKnowledgeBase, setIsDeletingKnowledgeBase] = useState(false);

  // 删除页面确认状态  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 创建知识库相关状态
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 创建新页面
  const handleCreate = async (parentId?: string) => {
    if (!currentKnowledgeBase) return;

    try {
      const newId = await create('未命名页面', parentId);

      // 确保知识库展开显示页面
      if (!expandedKnowledgeBases.has(currentKnowledgeBase.id)) {
        const newExpanded = new Set(expandedKnowledgeBases);
        newExpanded.add(currentKnowledgeBase.id);
        setExpandedKnowledgeBases(newExpanded);
      }

      if (newId && onSelect) {
        onSelect(newId);
      }
    } catch (error) {
      console.error('创建页面失败:', error);
    }
  };

  // 编辑知识库
  const handleEditKnowledgeBase = (kb: KnowledgeBase) => {
    setEditingKnowledgeBase(kb);
    setShowEditModal(true);
  };

  // 显示删除确认对话框
  const handleDeleteKnowledgeBase = (kb: KnowledgeBase) => {
    setDeleteConfirm({
      isOpen: true,
      knowledgeBase: kb
    });
  };

  // 确认删除知识库
  const handleConfirmDeleteKnowledgeBase = async () => {
    if (!deleteConfirm.knowledgeBase) return;

    setIsDeletingKnowledgeBase(true);
    try {
      await deleteKnowledgeBase(deleteConfirm.knowledgeBase.id);
      setDeleteConfirm({
        isOpen: false,
        knowledgeBase: null
      });
    } catch (error) {
      console.error('删除知识库失败:', error);
    } finally {
      setIsDeletingKnowledgeBase(false);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setDeleteConfirm({
      isOpen: false,
      knowledgeBase: null
    });
  };

  // 处理删除页面
  const handleDelete = (pageId: string, pageTitle: string) => {
    setDeleteTarget({ id: pageId, title: pageTitle });
    setShowDeleteConfirm(true);
  };

  // 确认删除页面
  const handleConfirmDeletePage = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deletePage(deleteTarget.id);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('删除页面失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 关闭编辑弹窗
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingKnowledgeBase(null);
  };

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // 刷新数据
  const handleRefresh = async () => {
    try {
      await loadKnowledgeBases();
    } catch (error) {
      console.error('刷新失败:', error);
    }
  };

  // 导出知识库 (待实现)
  const handleExportKnowledgeBase = (_kb: KnowledgeBase) => {
    // TODO: 实现导出功能
    alert('导出功能开发中...');
  };

  // 复制知识库 (待实现)
  const handleDuplicateKnowledgeBase = (_kb: KnowledgeBase) => {
    // TODO: 实现复制功能
    alert('复制功能开发中...');
  };

  // 知识库设置 (待实现)
  const handleKnowledgeBaseSettings = (_kb: KnowledgeBase) => {
    // TODO: 实现设置功能
    alert('设置功能开发中...');
  };

  // 递归渲染页面树节点
  const renderNode = (node: any, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const paddingLeft = level * 20; // 每层缩进20px

    return (
      <div key={node.id} 
        className="space-y-2">
        <div className={cn(
          'flex items-center justify-between group px-2 py-1.5 mx-0.5 my-0.5 rounded text-sm text-white/80 hover:bg-white/8 hover:text-white/95 transition-all cursor-pointer',
          selectedId === node.id && 'bg-blue-500/15 text-blue-200 border-l-2 border-blue-500 pl-1.5'
        )} style={{ marginLeft: paddingLeft }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* 文件夹/文件图标 - 点击打开页面 */}
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mr-1.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                // 始终选择页面
                onSelect?.(node.id);
                // 如果有子节点，也切换展开/折叠状态
                if (hasChildren) {
                  toggleExpansion(node.id);
                }
              }}
            >
              {hasChildren ? (
                <FolderMinus className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            {editingId === node.id ? (
              <input 
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={async () => {
                  if (editingTitle.trim() && editingTitle !== node.title) {
                    try {
                      await update(node.id, editingTitle.trim());
                    } catch (error) {
                      console.error('重命名页面失败:', error);
                    }
                  }
                  setEditingId(null);
                  setEditingTitle('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                    setEditingTitle('');
                  }
                }}
                className="text-sm w-[160px] px-2 py-1 rounded-md bg-white/10 dark:bg-gray-900/20 backdrop-filter backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-gray-700/30 theme-text-primary focus:outline-none focus:bg-white/20 dark:focus:bg-gray-900/40 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all duration-200 shadow-lg shadow-black/5 dark:shadow-black/20"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-2 flex-1"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingId(node.id);
                  setEditingTitle(node.title);
                }}
              >
                <span className="text-sm font-semibold theme-text-primary truncate cursor-text">
                  {node.title}
                </span>
                {hasChildren && (
                  <span className="text-xs font-medium theme-text-accent theme-bg-accent/15 px-2 py-1 rounded-md">
                    {node.children.length}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="theme-knowledge-actions">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCreate(node.id);
              }}
              className="theme-knowledge-action-btn theme-knowledge-glow"
              title="创建子页面"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(node.id, node.title);
              }}
              className="theme-knowledge-action-btn hover:!bg-red-500/80 hover:!border-red-400"
              title="删除页面"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {/* 递归渲染子节点 */}
        {hasChildren && isExpanded && (
          <div className="space-y-2 pl-2">
            {node.children.map((childNode: any) =>
              renderNode(childNode, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // 过滤页面（根据搜索查询）
  const getFilteredTree = () => {
    if (!currentKnowledgeBase) return [];

    const currentSearchQuery = externalSearchQuery || searchQuery;

    if (currentSearchQuery.trim()) {
      // 搜索模式：显示扁平化的匹配结果
      return pages.filter(page =>
        page.kb_id === currentKnowledgeBase.id && page.title.toLowerCase().includes(currentSearchQuery.toLowerCase())
      );
    }

    // 正常模式：显示树状结构
    return pageTree;
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* 页面列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {currentKnowledgeBase ? (
            (externalSearchQuery || searchQuery).trim() ? (
              // 搜索模式：显示匹配的页面（扁平化）
              <div className="space-y-2">
                {getFilteredTree().map((page: any) => (
                  <div 
                    key={page.id}
                    className={cn(
                      'flex items-center px-2 py-1.5 mx-0.5 my-0.5 rounded text-sm text-white/80 hover:bg-white/8 hover:text-white/95 transition-all cursor-pointer group',
                      selectedId === page.id && 'bg-blue-500/15 text-blue-200 border-l-2 border-blue-500 pl-1.5'
                    )}
                    onClick={() => onSelect?.(page.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 mr-1.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-sm font-semibold theme-text-primary truncate">
                        {page.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 正常模式：显示树状结构
              getFilteredTree().map((node: any) => renderNode(node, 0))
            )
          ) : (
            <div className="px-3 py-12 text-center theme-text-secondary">
              <FolderOpen className="w-8 h-8 mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-2">请选择知识库</p>
              <p className="text-xs opacity-75">在顶部选择一个知识库开始管理页面</p>
            </div>
          )}

          {currentKnowledgeBase && getFilteredTree().length === 0 && !(externalSearchQuery || searchQuery).trim() && (
            <div className="px-3 py-8 text-center theme-text-secondary">
              <p className="text-sm mb-2">暂无页面</p>
              <button 
                onClick={() => handleCreate()}
                className="theme-text-accent hover:theme-text-accent-hover text-sm"
              >
                创建第一个页面
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 编辑知识库弹窗 */}
      <EditKnowledgeBaseModal 
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        knowledgeBase={editingKnowledgeBase}
      />

      {/* 右键菜单 */}
      <KnowledgeBaseContextMenu 
        isVisible={contextMenu.visible}
        position={contextMenu.position}
        knowledgeBase={contextMenu.knowledgeBase}
        onClose={handleCloseContextMenu}
        onEdit={handleEditKnowledgeBase}
        onDelete={handleDeleteKnowledgeBase}
        onCreate={handleCreate}
        onExport={handleExportKnowledgeBase}
        onDuplicate={handleDuplicateKnowledgeBase}
        onSettings={handleKnowledgeBaseSettings}
        onRefresh={handleRefresh}
      />

      {/* 删除知识库确认对话框 */}
      <ConfirmDeleteModal 
        isOpen={deleteConfirm.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDeleteKnowledgeBase}
        title="删除知识库"
        itemName={deleteConfirm.knowledgeBase?.name || ''}
        isLoading={isDeletingKnowledgeBase}
      />

      {/* 删除页面确认对话框 */}
      <ConfirmDeleteModal 
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDeletePage}
        title="删除页面"
        itemName={deleteTarget?.title || ''}
        isLoading={isDeleting}
      />

      {/* 创建知识库弹窗 */}
      <CreateKnowledgeBaseModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};