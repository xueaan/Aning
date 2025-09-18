import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
// import { DragHandle } from '@tiptap/extension-drag-handle'; // Temporarily disabled due to RangeError
import { Mention } from '@tiptap/extension-mention';
import { Mathematics } from '@tiptap/extension-mathematics';

// 导入自定义扩展
import { BlockNode } from './BlockNode';
import { SlashCommand } from './SlashCommand';
import { UniqueID } from './UniqueID';
import { NotionDragDrop } from './NotionDragDrop';

interface ExtensionOptions {
  placeholder?: string;
  onSlashCommand?: (pos: { top: number; left: number }) => void;
  onCloseSlashCommand?: () => void;
}

export function getNotionExtensions(options: ExtensionOptions = {}) {
  return [
    // 核心扩展
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'notion-heading',
        },
      },
      paragraph: {
        HTMLAttributes: {
          class: 'notion-paragraph',
        },
      },
      bulletList: {
        HTMLAttributes: {
          class: 'notion-bullet-list',
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: 'notion-ordered-list',
        },
      },
      listItem: {
        HTMLAttributes: {
          class: 'notion-list-item',
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: 'notion-blockquote',
        },
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'notion-code-block',
        },
      },
      code: {
        HTMLAttributes: {
          class: 'notion-inline-code',
        },
      },
      horizontalRule: {
        HTMLAttributes: {
          class: 'notion-divider',
        },
      },
      dropcursor: {
        color: 'rgba(var(--accent), 0.5)',
        width: 4,
      },
    }),

    // 占位符
    Placeholder.configure({
      placeholder: options.placeholder || '输入 "/" 查看命令...',
      showOnlyWhenEditable: true,
      includeChildren: true,
      emptyEditorClass: 'is-editor-empty',
      emptyNodeClass: 'is-empty',
    }),

    // 链接
    Link.configure({
      HTMLAttributes: {
        class: 'notion-link',
      },
      openOnClick: false,
      linkOnPaste: true,
    }),

    // 图片
    Image.configure({
      HTMLAttributes: {
        class: 'notion-image',
      },
      inline: false,
      allowBase64: true,
    }),

    // 任务列表
    TaskList.configure({
      itemTypeName: 'taskItem',
      HTMLAttributes: {
        class: 'notion-task-list',
      },
    }),

    TaskItem.configure({
      HTMLAttributes: {
        class: 'notion-task-item',
      },
      nested: true,
    }),

    // 文本样式
    Underline,
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
      HTMLAttributes: {
        class: 'notion-highlight',
      },
    }),

    // 文本对齐
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right'],
    }),

    // 表格
    Table.configure({
      HTMLAttributes: {
        class: 'notion-table',
      },
      resizable: true,
      handleWidth: 5,
      cellMinWidth: 100,
      lastColumnResizable: true,
      allowTableNodeSelection: true,
    }),

    TableRow.configure({
      HTMLAttributes: {
        class: 'notion-table-row',
      },
    }),

    TableHeader.configure({
      HTMLAttributes: {
        class: 'notion-table-header',
      },
    }),

    TableCell.configure({
      HTMLAttributes: {
        class: 'notion-table-cell',
      },
    }),

    // @ 提及
    Mention.configure({
      HTMLAttributes: {
        class: 'notion-mention',
      },
      renderHTML({ node }) {
        return [
          'span',
          {
            class: 'notion-mention',
            'data-id': node.attrs.id,
          },
          `@${node.attrs.label ?? node.attrs.id}`,
        ];
      },
      suggestion: {
        char: '@',
        startOfLine: false,
        items: ({ query }) => {
          // 示例用户列表，实际使用时应该从 store 或 API 获取
          return [
            { id: '1', label: '张三' },
            { id: '2', label: '李四' },
            { id: '3', label: '王五' },
          ].filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase())
          );
        },
      },
    }),

    // 数学公式
    Mathematics.configure({
      katexOptions: {
        throwOnError: false,
      },
    }),

    // Notion 特有功能
    UniqueID,
    BlockNode,
    SlashCommand.configure({
      onSlashCommand: options.onSlashCommand,
      onCloseSlashCommand: options.onCloseSlashCommand,
    }),
    NotionDragDrop,

    // 拖拽手柄 - 临时禁用，使用 NotionDragDrop 替代
    // DragHandle.configure({...}), // Disabled due to RangeError in modal context
  ];
}