import { Extension } from '@tiptap/core';
import { Fragment } from '@tiptap/pm/model';

// Overrides/ensures insertTable respects rows/cols/withHeaderRow
export const TableInsertFix = Extension.create({
  name: 'table-insert-fix',

  addCommands() {
    return {
      insertTable:
        ({ rows = 3, cols = 3, withHeaderRow = false } = {}) =>
        ({ state, tr, dispatch }) => {
          const { schema, selection } = state;
          const tableType = schema.nodes.table;
          const rowType = schema.nodes.tableRow;
          const cellType = schema.nodes.tableCell;
          const headerType = schema.nodes.tableHeader || cellType;
          const paragraphType = schema.nodes.paragraph;

          if (!tableType || !rowType || !cellType) return false;

          try {
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
              const row = rowType.createChecked({}, Fragment.from(cellNodes));
              rowNodes.push(row);
            }

            const tableNode = tableType.createChecked({}, Fragment.from(rowNodes));
            if (dispatch) {
              dispatch(tr.replaceRangeWith(selection.from, selection.to, tableNode).scrollIntoView());
            }
            return true;
          } catch (e) {
            console.error('[TableInsertFix] insertTable failed:', e);
            return false;
          }
        },
    };
  },
});

export default TableInsertFix;

