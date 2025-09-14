# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 项目概述

**Anning (安宁)** - 基于 Tauri + React 构建的本地优先个人知识管理平台，采用现代化毛玻璃美学设计，集成AI对话、知识库管理、思维导图、密码管理等核心功能。

**核心特色**: Feather-Glass 毛玻璃美学 • AI 智能对话 • 模块化知识库 • 可视化思维板 • 安全密码管理 • 时光记录系统

## 🏗️ 架构概览

### 技术栈
- **前端**: React 18 + TypeScript 5.6 + Zustand + TailwindCSS + Tiptap
- **后端**: Tauri 2.0 + Rust + SQLite + AES-GCM 加密
- **UI系统**: Feather-Glass 毛玻璃样式体系 (4级透明度分层)
- **编辑器**: Tiptap 3.x + Novel.sh + 表格/图片/拖拽支持

### 项目结构
```
src/
├── components/        # 组件层 (按功能域组织)
│   ├── core/         # 核心布局 (Sidebar, MainContent)
│   ├── pages/        # 页面级组件
│   ├── features/     # 业务特性组件 (password/, etc)
│   ├── modules/      # 复合模块 (dialogue/, etc)
│   ├── common/       # 通用组件 (Toast, ThemePicker)
│   ├── ui/           # 基础UI组件 (Button, Modal, Icon)
│   └── editor/       # 编辑器组件 (Novel/, LineEditor/)
├── stores/           # Zustand 状态管理 (18个分模块Store)
│   ├── knowledge/    # 知识库子模块stores
│   ├── appStore.ts   # 全局应用状态
│   ├── dialogueContextStore.ts  # 对话上下文
│   └── ...          # 其他业务域stores
├── services/         # 业务逻辑服务
│   ├── database/     # 数据库服务层 (Repository模式)
│   ├── api/          # API调用层 (模块化API)
│   └── ai/           # AI服务
├── pages/            # 页面路由组件
│   ├── Knowledge/    # 知识库模块 (KnowledgeLayout, BlockEditor)
│   ├── Home.tsx      # 首页 (快捷方式, 搜索, 壁纸)
│   └── ...          # Timeline, TaskBox, Habit等
└── styles/           # 样式系统
    ├── theme.css     # 主题变量和工具类
    └── feather-glass.css  # 毛玻璃样式体系
```

## 🔍 快速索引

### 📚 架构文档
- **完整架构**: `memory/ARCHITECTURE-2025-09-14-系统架构完整文档.md`
- **毛玻璃系统**: `memory/FEATHER-GLASS-样式使用梳理.md`
- **主题重构**: `memory/THEME-2025-09-03-01-主题系统重构.md`

### ⚡ 常用命令
```bash
pnpm tauri dev       # 启动开发环境 (前后端同时启动)
tsc --noEmit         # TypeScript 类型检查 (必须通过)
cd src-tauri && cargo test    # Rust 后端测试
pnpm tauri build     # 应用构建打包
```

## 🎨 开发规范

### 🎭 UI/样式原则

#### Feather-Glass 毛玻璃样式系统 (强制使用)
**4级透明度分层设计** - 严格按用途选择合适样式类：

```css
/* Level 1: 装饰级 - 最常用 (43.7%) */
.feather-glass-deco        /* 卡片、图标容器、装饰元素 */

/* Level 2: 面板级 - 结构性 (6.5%) */
.feather-glass-panel       /* 侧边栏、工具栏、导航面板 */

/* Level 3: 内容级 - 重要内容 (11.8%) */
.feather-glass-content     /* 表单输入、重要信息展示 */

/* Level 4: 弹出级 - 最高优先级 (11.8%) */
.feather-glass-modal       /* 弹出框、模态框、下拉菜单 */
.feather-glass-dropdown    /* 下拉选择器 (88% 不透明度) */
```

#### 样式使用规则
- ✅ **装饰性元素优先使用** `feather-glass-deco`
- ✅ **重要内容使用** `feather-glass-content` 确保可读性
- ✅ **模态框组合使用** `feather-glass-modal-backdrop` + `feather-glass-modal`
- ❌ **禁止硬编码颜色** - 必须使用CSS变量 `rgba(var(--bg-primary), alpha)`
- ❌ **禁止忽略深色模式** - 所有样式必须支持主题切换

### 🧩 组件开发原则

#### 组件分类和命名
```typescript
// 1. 页面级组件 - 大写PascalCase
export const KnowledgeLayout: React.FC<Props> = () => { }

// 2. 业务组件 - 功能域前缀
export const PasswordCard: React.FC<Props> = () => { }
export const DialogueRoom: React.FC<Props> = () => { }

// 3. 基础UI组件 - 通用名称
export const Button: React.FC<ButtonProps> = () => { }
export const Modal: React.FC<ModalProps> = () => { }
```

#### 组件结构规范
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/stores';

interface ComponentProps {
  // 必需属性
  id: string;
  title: string;
  // 可选属性
  className?: string;
  onUpdate?: (data: Data) => void;
}

export const ComponentName: React.FC<ComponentProps> = ({
  id,
  title,
  className = '',
  onUpdate
}) => {
  // 1. Hooks 调用
  const [state, setState] = useState(initialState);
  const { data, actions } = useStore();

  // 2. 副作用
  useEffect(() => {
    // 初始化逻辑
  }, []);

  // 3. 事件处理函数
  const handleSubmit = useCallback(async () => {
    try {
      await actions.submit(data);
      onUpdate?.(data);
    } catch (error) {
      console.error('操作失败:', error);
    }
  }, [data, actions, onUpdate]);

  // 4. 渲染逻辑
  return (
    <div className={`feather-glass-deco ${className}`}>
      {/* 组件内容 */}
    </div>
  );
};
```

### 🗂️ 状态管理规范 (Zustand)

#### Store 设计模式
```typescript
interface BusinessStore {
  // 1. 状态数据 - 扁平化设计
  items: Item[];
  currentItem: Item | null;
  isLoading: boolean;
  error: string | null;

  // 2. 异步操作 - 统一async/await模式
  fetchItems: () => Promise<void>;
  createItem: (data: CreateItemRequest) => Promise<Item>;
  updateItem: (id: string, data: UpdateItemRequest) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // 3. 同步操作 - 状态更新
  setCurrentItem: (item: Item | null) => void;
  clearError: () => void;

  // 4. 计算属性 - derived state
  sortedItems: Item[];
  getItemById: (id: string) => Item | undefined;
}

export const useBusinessStore = create<BusinessStore>((set, get) => ({
  // 初始状态
  items: [],
  currentItem: null,
  isLoading: false,
  error: null,

  // 异步操作实现
  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await API.getItems();
      set({ items, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // 计算属性实现
  get sortedItems() {
    return get().items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
}));
```

#### Store 命名约定
- **业务域Store**: `use{Domain}Store` (如 `useKnowledgeStore`)
- **子模块Store**: `use{Domain}{Module}Store` (如 `useKnowledgeBaseStore`)
- **通用Store**: `use{Function}Store` (如 `useToastStore`, `useDialogStore`)

### 🔗 前后端通信规范

#### Tauri Command 调用模式
```typescript
// 1. API服务层封装
class DatabaseAPI {
  static async createItem(data: CreateItemRequest): Promise<Item> {
    try {
      return await invoke<Item>('create_item', { data });
    } catch (error) {
      console.error('创建失败:', error);
      throw new Error(`创建失败: ${error}`);
    }
  }
}

// 2. Store中使用
const createItem = async (data: CreateItemRequest) => {
  set({ isLoading: true });
  try {
    const newItem = await DatabaseAPI.createItem(data);
    set(state => ({
      items: [...state.items, newItem],
      isLoading: false
    }));
  } catch (error) {
    set({ error: String(error), isLoading: false });
    throw error; // 重新抛出供UI组件处理
  }
};
```

#### 错误处理规范
```typescript
// 全局错误处理Hook
export const useErrorHandler = () => {
  const showToast = useToastStore(state => state.showToast);

  return useCallback((error: unknown, context = '操作') => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${context}失败:`, error);

    showToast({
      type: 'error',
      title: `${context}失败`,
      message: message.replace(/^[^:]*:\s*/, ''), // 清理错误前缀
      duration: 5000,
    });
  }, [showToast]);
};

// 组件中使用
const handleSubmit = async () => {
  const handleError = useErrorHandler();

  try {
    await submitAction();
  } catch (error) {
    handleError(error, '保存数据');
  }
};
```

## 🧠 记忆系统协议 (Memory System Protocol)

**这是最重要的部分。请严格遵守此协议。**

### 核心原则
1. **记忆库位置**: 所有历史决策、实现细节归档在 `/memory/` 文件夹
2. **记忆单元**: 每个 `.md` 文件代表一个已完成的独立任务或知识点
3. **文件格式**: `TASK-日期-XX-任务摘要.md` 或 `XXX-知识点.md`
4. **frontmatter**: 必须包含 YAML frontmatter (id, date, summary, keywords)

### 🔄 标准工作流程
1. **接收任务** → 解析关键词和技术需求
2. **搜索记忆** → 在 `/memory/` 中全文搜索相关历史 (必须步骤!)
3. **理解背景** → 仔细阅读相关记忆文件，了解历史决策
4. **制定方案** → 基于历史经验和项目一致性制定技术方案
5. **执行实现** → 严格遵循既定的技术选型和代码风格
6. **记录结果** → 创建或更新记忆文件，记录实现细节

### ⚠️ 重要规则
- **禁止盲目开发**: 未搜索记忆库不得开始任务
- **保持一致性**: 技术选型必须与项目历史保持一致
- **及时记录**: 每个任务完成后立即更新记忆库
- **架构优先**: 重大变更必须先查阅架构文档

### 📋 技术决策检查清单

#### 开发前必检项目
- [ ] 是否搜索了相关历史记忆？
- [ ] 是否查阅了架构文档？
- [ ] 组件放置位置是否符合目录结构规范？
- [ ] 是否使用了正确的 Feather-Glass 样式类？
- [ ] 是否支持浅色/深色主题？
- [ ] State管理是否选择了合适的Store？
- [ ] 前后端通信是否遵循Tauri Command模式？

#### 代码提交前必检项目
- [ ] TypeScript 类型检查是否通过？(`tsc --noEmit`)
- [ ] 是否遵循了组件命名和结构规范？
- [ ] 是否添加了适当的错误处理？
- [ ] 是否更新了相关的记忆文档？
- [ ] 复杂功能是否添加了使用示例？

### 📝 任务记录模板

```markdown
---
id: task-yyyy-mm-dd-xx
date: YYYY-MM-DD
summary: 简洁的任务描述 (不超过50字)
keywords: [关键词1, 关键词2, 技术栈, 组件名]
---

# 任务标题

## 🎯 任务目标
明确的任务目标和预期结果

## 🔧 技术方案
具体的实现方案和技术选型理由

## 📋 实现细节
关键代码片段和实现要点

## ✅ 验证结果
功能测试和效果验证

## 🔄 相关影响
对其他模块的影响和注意事项

## 📚 参考资料
相关文档和参考链接
```

## 🤝 协作规则

### 分工协作原则
- **前端重构**: UI组件、样式系统、状态管理优化
- **后端优化**: Rust命令、数据库查询、性能优化
- **功能开发**: 可按模块分工 (Knowledge、Dialogue、Password等)
- **问题反馈**: 发现问题及时沟通，提供复现步骤

### 代码质量要求
- **类型安全**: 所有TypeScript代码必须通过严格类型检查
- **组件复用**: 优先使用现有组件，避免重复造轮子
- **性能考虑**: 大列表使用虚拟化，图片懒加载，适当缓存
- **用户体验**: 加载状态、错误提示、操作反馈必须完整

---

**🎯 核心理念**:

1. **记忆优先** - 先搜索历史记忆，理解项目背景和既有决策
2. **架构指导** - 严格按照项目架构规范进行开发
3. **一致性保证** - 技术选型、代码风格、UI设计必须保持一致
4. **质量导向** - 代码质量和用户体验优于开发速度

**开发前必读**: `memory/ARCHITECTURE-2025-09-14-系统架构完整文档.md`

---

*本指南随项目演进持续更新，确保开发规范的时效性和准确性。*