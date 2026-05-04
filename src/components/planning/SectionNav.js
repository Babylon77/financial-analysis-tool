import React from 'react';
import { NavLink } from 'react-router-dom';

const SECTIONS = [
  { path: 'profile', label: 'Financial Profile', icon: '01' },
  { path: 'accumulate', label: 'Accumulate', icon: '02' },
  { path: 'spend-down', label: 'Spend Down', icon: '03' },
  { path: 'advanced', label: 'Retirement Analysis', icon: '04' },
  { path: 'reports', label: 'Reports', icon: '05' },
];

export default function SectionNav({ completionStatus = {} }) {
  return (
    <nav className="space-y-1">
      {SECTIONS.map((section) => {
        const isComplete = completionStatus[section.path];
        return (
          <NavLink
            key={section.path}
            to={section.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                isActive
                  ? 'bg-terminal-dark-green/20 text-terminal-green border border-terminal-dark-green'
                  : 'text-txt-secondary hover:text-terminal-dim-green hover:bg-surface-elevated border border-transparent'
              }`
            }
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px]">
              {isComplete ? '✓' : section.icon}
            </span>
            <span className="truncate">{section.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export { SECTIONS };
