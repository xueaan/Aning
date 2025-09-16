import React, { useState, FC } from 'react';
import { useTaskBoxStore } from '@/stores';
import { useDialogStore } from '@/stores/dialogStore';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ProjectModal } from '@/components/modules/taskbox/taskbox/ProjectModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { TaskProject } from '@/types';
import { getIconComponent } from '@/constants/commonIcons';

export const ProjectProgress: FC = () => {
  const { projects, createProject, updateProject, deleteProject, getProjectStats } =
    useTaskBoxStore();

  const { show: showDialog } = useDialogStore();

  // Modal 状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TaskProject | null>(null);

  // 打开创建项目弹窗
  const handleCreateProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  // 打开编辑项目弹窗
  const handleEditProject = (project: TaskProject) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  // 确认保存项目
  const handleConfirmProject = async (data: {
    name: string;
    icon: string;
    description?: string;
  }) => {
    if (editingProject) {
      // 编辑项目
      await updateProject(editingProject.id!, {
        name: data.name,
        icon: data.icon,
        description: data.description,
      });
    } else {
      // 创建项目
      await createProject({
        name: data.name,
        icon: data.icon,
        description: data.description,
      });
    }
  };

  // 打开删除确认对话框
  const handleDeleteProject = (projectId: number, projectName: string) => {
    showDialog({
      title: '删除项目',
      message: `确定要删除项目 "${projectName}" 吗？此操作将同时删除项目中的所有任务，且无法撤销。`,
      confirmText: '删除',
      cancelText: '取消',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteProject(projectId);
        } catch (error) {
          console.error('Failed to delete project:', error);
        }
      },
      onCancel: () => {},
    });
  };

  return (
    <div className="rounded-xl p-4 md:p-6 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-lg font-semibold theme-text-primary">项目进度</h3>
        <button
          onClick={handleCreateProject}
          className="flex items-center gap-2 px-3 py-1.5 theme-bg-accent theme-text-on-accent rounded-lg hover:theme-bg-accent-hover transition-colors text-sm"
        >
          <Plus size={16} />
          新建项目
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <div className="theme-text-secondary mb-3">📁</div>
          <p className="text-sm theme-text-secondary mb-4">还没有创建任何项目</p>
          <button
            onClick={handleCreateProject}
            className="theme-text-accent hover: theme-text-accent-hover text-sm font-medium"
          >
            创建第一个项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 , lg:grid-cols-3,xl:grid-cols-4 gap-4">
          {projects.map((project) => {
            if (!project.id) return null;
            const stats = getProjectStats(project.id);
            const progress =
              stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

            return (
              <div key={project.id} className="group rounded-xl p-4 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {project.icon?.length === 1 ? (
                        // 如果是单个字符（emoji），直接显示
                        <span className="text-2xl">{project.icon}</span>
                      ) : (
                        // 如果是图标名称，渲染对应的图标组件
                        React.createElement(getIconComponent(project.icon || 'Folder'), {
                          theme: 'outline',
                          size: 24,
                          fill: 'currentColor',
                          strokeWidth: 2,
                          className: 'theme-text-secondary',
                        })
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold theme-text-primary">{project.name}</h4>
                      <p className="text-xs theme-text-secondary">
                        {stats.completed}/{stats.total} 个任务已完成
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="p-1.5 theme-text-tertiary hover: text-blue-600  hover:bg-blue-50, dark:hover:bg-blue-900/20 rounded-md transition-all duration-200"
                      title="编辑项目"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => project.id && handleDeleteProject(project.id, project.name)}
                      className="p-1.5 theme-text-tertiary hover: text-red-600  hover:bg-red-50, dark:hover:bg-red-900/20 rounded-md transition-all duration-200"
                      title="删除项目"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 theme-bg-tertiary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress === 100
                          ? 'bg-green-500'
                          : progress > 50
                            ? 'bg-blue-500'
                            : 'bg-orange-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold theme-text-primary min-w-12">
                    {progress}%
                  </span>
                </div>
                {/* Task Stats */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 theme-text-secondary">
                    <span>
                      进行中: <span className="font-medium">{stats.inProgress}</span>
                    </span>
                    <span>
                      待开始: <span className="font-medium">{stats.pending}</span>
                    </span>
                    {stats.overdue > 0 && (
                      <span className="text-red-600 font-medium">逾期: {stats.overdue}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmProject}
        project={editingProject}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};
