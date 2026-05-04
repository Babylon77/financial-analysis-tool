import React from 'react';
import { Link } from 'react-router-dom';

const modules = [
  {
    to: '/real-estate',
    label: 'Real Estate',
    description: 'Analyze investment properties. Fix & flip, long-term rental, and short-term rental strategies with MODA scoring.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    status: 'ONLINE',
  },
  {
    to: '/financial-planning',
    label: 'Financial Planning',
    description: 'Monte Carlo simulation, tax-optimized accumulation, spend-down strategies, and advanced retirement analysis.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    status: 'ONLINE',
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-terminal-bg bg-terminal-grid bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div
            className="mx-auto -mb-4 max-w-md sm:max-w-lg"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at center, black 40%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse 70% 70% at center, black 40%, transparent 100%)',
            }}
          >
            <img
              src={`${process.env.PUBLIC_URL}/Ultronic_Icon.png`}
              alt="Ultronic Terminal"
              className="w-full h-auto"
            />
          </div>
          <div className="mt-6 font-mono text-sm text-txt-secondary">
            <span className="text-terminal-dim-green">&gt;</span> Financial analysis &bull; Monte Carlo simulation &bull; Tax optimization
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {modules.map((mod) => (
            <Link
              key={mod.label}
              to={mod.to}
              className="terminal-card p-5 group transition-all duration-200 cursor-pointer hover:border-surface-border-light hover:shadow-glow-green-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5 text-terminal-green group-hover:crt-glow">
                  {mod.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-terminal-green">
                      {mod.label}
                    </h3>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border text-terminal-dim-green border-terminal-dark-green">
                      {mod.status}
                    </span>
                  </div>
                  <p className="text-xs text-txt-secondary leading-relaxed">
                    {mod.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="font-mono text-xs text-txt-muted cursor-blink">
            System ready
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
