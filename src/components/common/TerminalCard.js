import React from 'react';

const TerminalCard = ({
  children,
  title,
  subtitle,
  accent = 'green',
  scanlines = false,
  className = '',
  headerRight,
}) => {
  const accentColors = {
    green: {
      border: 'border-surface-border hover:border-surface-border-light',
      title: 'text-terminal-green crt-glow',
      glow: 'shadow-glow-green-sm',
    },
    amber: {
      border: 'border-terminal-amber-dim hover:border-terminal-amber',
      title: 'text-terminal-amber',
      glow: 'shadow-glow-amber',
    },
    red: {
      border: 'border-terminal-red-dim hover:border-terminal-red',
      title: 'text-terminal-red',
      glow: 'shadow-glow-red',
    },
    cyan: {
      border: 'border-terminal-cyan-dim hover:border-terminal-cyan',
      title: 'text-terminal-cyan',
      glow: 'shadow-glow-cyan',
    },
  };

  const colors = accentColors[accent] || accentColors.green;

  return (
    <div
      className={`
        bg-surface-primary ${colors.border} border rounded
        transition-all duration-200 ${scanlines ? 'scanlines' : ''}
        ${className}
      `}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <div>
            {title && (
              <h3 className={`font-display text-sm font-semibold uppercase tracking-wider ${colors.title}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-txt-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default TerminalCard;
