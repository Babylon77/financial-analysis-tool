import React from 'react';

const STRATEGIES = [
  { key: 'all', label: 'All Strategies' },
  { key: 'flip', label: 'Fix & Flip' },
  { key: 'ltr', label: 'Long-Term Rental' },
  { key: 'str', label: 'Short-Term Rental' },
];

export default function StrategySelector({ selected, onSelect }) {
  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex rounded-md" role="group">
        {STRATEGIES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect(s.key)}
            className={`${
              selected === s.key
                ? 'bg-terminal-dark-green text-terminal-green'
                : 'bg-surface-primary text-txt-primary hover:bg-surface-elevated'
            } px-4 py-2 text-sm font-medium border border-surface-border ${
              i === 0 ? 'rounded-l-lg' : ''
            }${i === STRATEGIES.length - 1 ? 'rounded-r-lg' : ''}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
