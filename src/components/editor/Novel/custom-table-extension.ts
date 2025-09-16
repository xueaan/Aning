import { Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Fragment } from '@tiptap/pm/model';
import { columnResizing, tableEditing } from 'prosemirror-tables';

// 精简的表格节点扩展 - 依赖 prosemirror-tables
export const AnningTable = Node.create({
  name: 'table',
  group: 'block',
  content: 'tableRow+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'table' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'table',
      {
        class: 'anning-table prosemirror-table',
        ...HTMLAttributes,
      },
      ['tbody', 0],
    ];
  },

  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = false } = {}) =>
        ({ tr, dispatch, state }) => {
          try {
            const { schema, selection } = state;
            const tableType = schema.nodes.table;
            const rowType = schema.nodes.tableRow;
            const cellType = schema.nodes.tableCell;
            const headerType = schema.nodes.tableHeader || cellType;
            const paragraphType = schema.nodes.paragraph;

            if (!tableType || !rowType || !cellType) {
              return false;
            }

            const rowNodes: any[] = [];
            for (let i = 0; i < rows; i++) {
              const cellNodes: any[] = [];
              for (let j = 0; j < cols; j++) {
                const isHeader = withHeaderRow && i === 0;
                const type = isHeader ? headerType : cellType;
                const content = paragraphType ? Fragment.from(paragraphType.create()) : undefined;
                const cell = (content
                  ? type.createAndFill({}, content as any)
                  : type.createAndFill()) as any;
                if (!cell) return false;
                cellNodes.push(cell);
              }
              const row = rowType.createAndFill({}, Fragment.from(cellNodes));
              if (!row) return false;
              rowNodes.push(row);
            }

            const tableNode = tableType.createChecked({}, Fragment.from(rowNodes));

            if (dispatch && tableNode) {
              const trNew = tr
                .replaceRangeWith(selection.from, selection.to, tableNode)
                .scrollIntoView();
              dispatch(trNew);
              return true;
            }
          } catch (error) {
            console.error('插入表格失败:', error);
          }

          return false;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      columnResizing({
        handleWidth: 5,
        cellMinWidth: 50,
      }),
      tableEditing(),
      new Plugin({
        key: new PluginKey('anningTablePlugin'),
        view() {
          return {
            update: () => {
              // 预留：表格编辑时的辅助逻辑
            },
          };
        },
      }),
    ];
  },
});

// 表格行扩展
export const AnningTableRow = Node.create({
  name: 'tableRow',
  content: '(tableCell | tableHeader)*',

  parseHTML() {
    return [{ tag: 'tr' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'tr',
      {
        class: 'anning-table-row',
        ...HTMLAttributes,
      },
      0,
    ];
  },
});

// 单元格扩展
export const AnningTableCell = Node.create({
  name: 'tableCell',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'td' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'td',
      {
        class: 'anning-table-cell',
        ...HTMLAttributes,
      },
      0,
    ];
  },
});

// 表头单元格扩展
export const AnningTableHeader = Node.create({
  name: 'tableHeader',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'th' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'th',
      {
        class: 'anning-table-header',
        ...HTMLAttributes,
      },
      0,
    ];
  },
});

// 聚合导出
export const anningTableExtensions = [
  AnningTable,
  AnningTableRow,
  AnningTableCell,
  AnningTableHeader,
];

