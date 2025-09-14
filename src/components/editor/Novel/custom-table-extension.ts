import { Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import {
  columnResizing,
  tableEditing
} from 'prosemirror-tables'

// 简化的表格节点扩展 - 基于 prosemirror-tables
export const AnningTable = Node.create({
  name: 'table',
  group: 'block',
  content: 'tableRow+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'table' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['table', {
      class: 'anning-table prosemirror-table',
      ...HTMLAttributes
    }, ['tbody', 0]]
  },

  addCommands() {
    return {
      insertTable: ({ rows = 3, cols = 3, withHeaderRow = false } = {}) => ({ tr, dispatch, state }) => {
        try {
          // 简单创建表格的HTML结构
          const tableHTML = document.createElement('table')
          tableHTML.className = 'anning-table prosemirror-table'

          const tbody = document.createElement('tbody')

          for (let i = 0; i < rows; i++) {
            const row = document.createElement('tr')
            row.className = 'anning-table-row'

            for (let j = 0; j < cols; j++) {
              const cell = document.createElement(withHeaderRow && i === 0 ? 'th' : 'td')
              cell.className = withHeaderRow && i === 0 ? 'anning-table-header' : 'anning-table-cell'
              const p = document.createElement('p')
              cell.appendChild(p)
              row.appendChild(cell)
            }

            tbody.appendChild(row)
          }

          tableHTML.appendChild(tbody)

          // 使用insertContent插入表格
          if (dispatch) {
            // 直接插入HTML内容
            const { from } = state.selection
            const tableNode = state.schema.nodes.table.createAndFill()
            if (tableNode) {
              const transaction = tr.replaceWith(from, from, tableNode)
              dispatch(transaction)
            }
            return true
          }
        } catch (error) {
          console.error('表格插入失败:', error)
        }

        return false
      }
    }
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
              // 表格插件更新逻辑
            }
          }
        }
      })
    ]
  }
})

// 表格行扩展
export const AnningTableRow = Node.create({
  name: 'tableRow',
  content: '(tableCell | tableHeader)*',

  parseHTML() {
    return [{ tag: 'tr' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['tr', {
      class: 'anning-table-row',
      ...HTMLAttributes
    }, 0]
  },
})

// 表格单元格扩展
export const AnningTableCell = Node.create({
  name: 'tableCell',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'td' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['td', {
      class: 'anning-table-cell',
      ...HTMLAttributes
    }, 0]
  },
})

// 表格头部单元格扩展
export const AnningTableHeader = Node.create({
  name: 'tableHeader',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'th' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['th', {
      class: 'anning-table-header',
      ...HTMLAttributes
    }, 0]
  },
})

// 导出所有表格相关扩展
export const anningTableExtensions = [
  AnningTable,
  AnningTableRow,
  AnningTableCell,
  AnningTableHeader,
]