import React, { useState } from 'react';

interface TableSizeSelectorProps {
  onSelect: (rows: number, cols: number) => void;
  onClose: () => void;
}

export const TableSizeSelector: React.FC<TableSizeSelectorProps> = ({ onSelect, onClose }) => {
  const [hoveredRow, setHoveredRow] = useState(-1);
  const [hoveredCol, setHoveredCol] = useState(-1);
  const maxRows = 6;
  const maxCols = 6;

  const handleCellClick = (row: number, col: number) => {
    onSelect(row + 1, col + 1);
    onClose();
  };

  const handleCellHover = (row: number, col: number) => {
    setHoveredRow(row);
    setHoveredCol(col);
  };

  return (
    <div
      className="absolute z-50 p-3 theme-glass-card rounded-xl"
      style={{
        background: 'rgba(var(--bg-secondary), 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(var(--border-primary), 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="text-sm theme-text-secondary mb-2 text-center font-medium">
        {hoveredRow >= 0 && hoveredCol >= 0
          ? `${hoveredRow + 1} × ${hoveredCol + 1} 表格`
          : '选择表格大小'}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px',
          padding: '4px',
          width: 'fit-content',
        }}
      >
        {Array.from({ length: maxRows * maxCols }).map((_, index) => {
          const row = Math.floor(index / maxCols);
          const col = index % maxCols;
          return (
            <div
              key={`${row}-${col}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                background:
                  row <= hoveredRow && col <= hoveredCol
                    ? 'rgba(var(--color-accent), 0.8)'
                    : 'rgba(var(--bg-tertiary), 0.5)',
                border:
                  row <= hoveredRow && col <= hoveredCol
                    ? '1px solid rgba(var(--color-accent), 1)'
                    : '1px solid rgba(var(--border-primary), 0.2)',
                transform: row <= hoveredRow && col <= hoveredCol ? 'scale(1.05)' : 'scale(1)',
              }}
              onClick={() => handleCellClick(row, col)}
              onMouseEnter={() => handleCellHover(row, col)}
            />
          );
        })}
      </div>
      <div className="mt-2 text-xs theme-text-tertiary text-center">点击选择表格大小</div>
    </div>
  );
};
