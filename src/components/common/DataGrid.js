import React from 'react';

const DataGrid = ({ items, columns = 1, className = '' }) => {
  return (
    <div
      className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-1'} ${className}`}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-1.5 px-2 rounded bg-surface-elevated"
        >
          <span className="text-xs text-txt-secondary uppercase tracking-wide">
            {item.label}
          </span>
          <span
            className={`
              data-cell text-sm font-medium
              ${item.color === 'red' ? 'text-terminal-red' :
                item.color === 'amber' ? 'text-terminal-amber' :
                item.color === 'cyan' ? 'text-terminal-cyan' :
                'text-terminal-green'}
            `}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DataGrid;
