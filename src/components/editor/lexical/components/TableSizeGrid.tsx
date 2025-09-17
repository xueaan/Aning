/* @ts-nocheck */
import React from 'react';

export const TableSizeGrid: React.FC<{
  maxRows?: number;
  maxCols?: number;
  onSelect: (rows: number, cols: number) => void;
}> = ({ maxRows = 5, maxCols = 6, onSelect }) => {
  const cells = [] as React.ReactNode[];
  for (let r = 1; r <= maxRows; r++) {
    const row = [] as React.ReactNode[];
    for (let c = 1; c <= maxCols; c++) {
      row.push(
        <button
          key={`${r}x${c}`}
          className="w-6 h-6 border theme-border-primary hover:theme-bg-primary/40"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(r, c)}
        />
      );
    }
    cells.push(
      <div key={`r-${r}`} className="flex">
        {row}
      </div>
    );
  }
  return <div className="p-2 rounded-md feather-glass-panel inline-block">{cells}</div>;
};

export default TableSizeGrid;

