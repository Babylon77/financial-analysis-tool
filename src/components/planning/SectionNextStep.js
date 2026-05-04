import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SECTIONS } from './SectionNav';

export default function SectionNextStep({ currentPath }) {
  const navigate = useNavigate();
  const currentIndex = SECTIONS.findIndex(s => s.path === currentPath);
  const next = SECTIONS[currentIndex + 1];

  if (!next) return null;

  return (
    <div className="mt-8 pt-6 border-t border-surface-border flex justify-end">
      <button
        onClick={() => navigate(`/financial-planning/${next.path}`)}
        className="glow-btn glow-btn-green px-6 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-2"
      >
        Continue to {next.label}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
