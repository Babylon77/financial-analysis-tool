import React, { useState } from 'react';
import SectionNav from './SectionNav';

export default function PlanningHubSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <aside className="lg:w-56 xl:w-64 lg:flex-shrink-0 bg-surface-primary border-b lg:border-b-0 lg:border-r border-surface-border">
      {/* Mobile toggle */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3">
        <span className="font-display font-bold text-terminal-green text-xs uppercase tracking-wider">
          Sections
        </span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-txt-secondary hover:text-terminal-green p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden px-4 pb-3" onClick={() => setMobileOpen(false)}>
          <SectionNav />
        </div>
      )}

      {/* Desktop nav */}
      <div className="hidden lg:block sticky top-0 p-4">
        <h2 className="font-display font-bold text-terminal-green crt-glow uppercase tracking-wider text-xs mb-4 px-3">
          Financial Planning
        </h2>
        <SectionNav />
      </div>
    </aside>
  );
}
