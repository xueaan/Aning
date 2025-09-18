import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Image,
  Table,
  MessageSquare,
  FileText,
  ToggleLeft,
  Calculator,
  Link,
  Hash,
} from 'lucide-react';

interface SlashCommandMenuProps {
  editor: Editor;
  position: { top: number; left: number };
  onClose: () => void;
  isInModal?: boolean;
}

interface CommandItem {
  title: string;
  description: string;
  icon: any;
  category: 'basic' | 'media' | 'embed' | 'advanced';
  searchTerms?: string[];
  command: (editor: Editor) => void;
}

const commandItems: CommandItem[] = [
  // 基础块
  {
    title: '文本',
    description: '普通段落文本',
    icon: Type,
    category: 'basic',
    searchTerms: ['text', 'paragraph', '文本', '段落'],
    command: (editor) => {
      editor.chain().focus().setNode('paragraph').run();
    },
  },
  {
    title: '标题 1',
    description: '大标题',
    icon: Heading1,
    category: 'basic',
    searchTerms: ['h1', 'heading', 'title', '标题'],
    command: (editor) => {
      editor.chain().focus().setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: '标题 2',
    description: '中等标题',
    icon: Heading2,
    category: 'basic',
    searchTerms: ['h2', 'heading', '标题'],
    command: (editor) => {
      editor.chain().focus().setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: '标题 3',
    description: '小标题',
    icon: Heading3,
    category: 'basic',
    searchTerms: ['h3', 'heading', '标题'],
    command: (editor) => {
      editor.chain().focus().setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: '页面',
    description: '嵌入子页面',
    icon: FileText,
    category: 'basic',
    searchTerms: ['page', 'subpage', '页面'],
    command: (editor) => {
      // TODO: 实现页面嵌入
      editor.chain().focus().insertContent('<p>📄 子页面</p>').run();
    },
  },
  {
    title: '待办列表',
    description: '带复选框的任务列表',
    icon: CheckSquare,
    category: 'basic',
    searchTerms: ['todo', 'task', 'checkbox', '任务', '待办'],
    command: (editor) => {
      editor.chain().focus().toggleTaskList().run();
    },
  },
  {
    title: '项目列表',
    description: '无序列表',
    icon: List,
    category: 'basic',
    searchTerms: ['bullet', 'unordered', 'list', '列表'],
    command: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: '编号列表',
    description: '有序列表',
    icon: ListOrdered,
    category: 'basic',
    searchTerms: ['numbered', 'ordered', 'list', '列表'],
    command: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: '折叠列表',
    description: '可以折叠和展开的内容',
    icon: ToggleLeft,
    category: 'basic',
    searchTerms: ['toggle', 'collapse', '折叠'],
    command: (editor) => {
      // TODO: 实现折叠列表
      editor.chain().focus().insertContent('<details><summary>折叠标题</summary><p>折叠内容...</p></details>').run();
    },
  },
  {
    title: '引用',
    description: '引用块',
    icon: Quote,
    category: 'basic',
    searchTerms: ['blockquote', 'quote', '引用'],
    command: (editor) => {
      editor.chain().focus().toggleNode('blockquote', 'paragraph').run();
    },
  },
  {
    title: '分割线',
    description: '水平分割线',
    icon: Minus,
    category: 'basic',
    searchTerms: ['divider', 'horizontal', 'rule', 'hr', '分割'],
    command: (editor) => {
      editor.chain().focus().insertContent('<hr>').run();
    },
  },
  {
    title: '提示框',
    description: '带图标的信息提示',
    icon: MessageSquare,
    category: 'basic',
    searchTerms: ['callout', 'info', 'note', '提示'],
    command: (editor) => {
      editor.chain().focus().insertContent({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '💡 ',
          },
          {
            type: 'text',
            text: '提示内容...',
          },
        ],
      }).run();
    },
  },

  // 媒体
  {
    title: '图片',
    description: '上传或嵌入图片',
    icon: Image,
    category: 'media',
    searchTerms: ['image', 'photo', 'picture', '图片', '照片'],
    command: (editor) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const src = event.target?.result as string;
            editor.chain().focus().setImage({ src }).run();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    },
  },
  {
    title: '表格',
    description: '插入表格',
    icon: Table,
    category: 'media',
    searchTerms: ['table', '表格'],
    command: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: '代码',
    description: '代码块',
    icon: Code,
    category: 'media',
    searchTerms: ['code', 'codeblock', '代码'],
    command: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    },
  },
  {
    title: '数学公式',
    description: 'LaTeX 数学公式',
    icon: Calculator,
    category: 'media',
    searchTerms: ['math', 'latex', 'equation', '数学', '公式'],
    command: (editor) => {
      editor.chain().focus().insertContent({
        type: 'mathematics',
        attrs: {
          latex: 'x^2 + y^2 = z^2',
        },
      }).run();
    },
  },

  // 嵌入
  {
    title: '链接',
    description: '网页链接',
    icon: Link,
    category: 'embed',
    searchTerms: ['link', 'url', '链接'],
    command: (editor) => {
      const url = prompt('请输入链接地址:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    },
  },

  // 高级
  {
    title: '目录',
    description: '页面目录',
    icon: Hash,
    category: 'advanced',
    searchTerms: ['toc', 'table of contents', '目录'],
    command: (editor) => {
      // TODO: 实现目录
      editor.chain().focus().insertContent('<p>[目录]</p>').run();
    },
  },
];

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  editor,
  position,
  onClose,
  isInModal = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory] = useState<string>('all');
  const menuRef = useRef<HTMLDivElement>(null);

  // 过滤命令
  const filteredItems = commandItems.filter((item) => {
    const matchesSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.searchTerms?.some(term => term.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // 按类别分组（目前未使用，但保留以便后续需要）
  // const groupedItems = filteredItems.reduce((groups, item) => {
  //   const category = item.category;
  //   if (!groups[category]) {
  //     groups[category] = [];
  //   }
  //   groups[category].push(item);
  //   return groups;
  // }, {} as Record<string, CommandItem[]>);

  // 执行命令
  const executeCommand = useCallback((item: CommandItem) => {
    // 删除斜杠
    const { from } = editor.state.selection;
    editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();

    // 执行命令
    item.command(editor);

    // 关闭菜单
    onClose();
  }, [editor, onClose]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((index) => (index + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((index) => (index - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          executeCommand(filteredItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, executeCommand, onClose]);

  // 监听编辑器输入
  useEffect(() => {
    const handleUpdate = () => {
      const { state } = editor;
      const { from } = state.selection;
      const text = state.doc.textBetween(Math.max(0, from - 20), from);
      const match = text.match(/\/(\S*)$/);

      if (match) {
        setSearch(match[1]);
      } else {
        onClose();
      }
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, onClose]);

  return (
    <div
      ref={menuRef}
      className="notion-slash-menu feather-glass-modal"
      style={{
        position: isInModal ? 'absolute' : 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: isInModal ? 10001 : 10000,
      }}
    >
      {/* 搜索框 */}
      {search && (
        <div className="notion-slash-header">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索命令..."
            className="notion-slash-search"
            autoFocus
          />
        </div>
      )}

      <div className="notion-slash-content">
        {/* 基础块 - 横向布局 */}
        <div className="notion-slash-section">
          <div className="notion-slash-section-title">基础</div>
          <div className="notion-slash-grid">
            {commandItems
              .filter(item => item.category === 'basic' &&
                (!search || item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.searchTerms?.some(term => term.toLowerCase().includes(search.toLowerCase())))
              )
              .map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    className={`notion-slash-grid-item ${
                      index === selectedIndex ? 'notion-slash-item-selected' : ''
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => executeCommand(item)}
                  >
                    <Icon size={20} />
                    <span>{item.title}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* 媒体 - 横向布局 */}
        {(!search || commandItems.some(item => item.category === 'media' &&
          (item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.searchTerms?.some(term => term.toLowerCase().includes(search.toLowerCase()))))) && (
          <div className="notion-slash-section">
            <div className="notion-slash-section-title">媒体</div>
            <div className="notion-slash-grid">
              {commandItems
                .filter(item => item.category === 'media' &&
                  (!search || item.title.toLowerCase().includes(search.toLowerCase()) ||
                  item.searchTerms?.some(term => term.toLowerCase().includes(search.toLowerCase())))
                )
                .map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      className={`notion-slash-grid-item ${
                        commandItems.filter(i => i.category === 'basic').length + index === selectedIndex ? 'notion-slash-item-selected' : ''
                      }`}
                      onMouseEnter={() => setSelectedIndex(commandItems.filter(i => i.category === 'basic').length + index)}
                      onClick={() => executeCommand(item)}
                    >
                      <Icon size={20} />
                      <span>{item.title}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="notion-slash-empty">
            没有找到匹配的命令
          </div>
        )}
      </div>
    </div>
  );
};