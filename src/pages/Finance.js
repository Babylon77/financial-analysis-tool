import React, { useState } from 'react';
import MonteCarloSimulator from '../components/MonteCarloSimulator';
import AdvancedRetirementPlanner from '../components/finance/AdvancedRetirementPlanner';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('allocation');

  return (
    <div className="min-h-screen bg-terminal-bg">
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-bold text-terminal-green crt-glow sm:text-3xl mb-6 uppercase tracking-wider">
            Financial Planning Tools
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-surface-border mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('allocation')}
              className={`${
                activeTab === 'allocation'
                  ? 'border-terminal-green text-terminal-green'
                  : 'border-transparent text-txt-secondary hover:text-terminal-dim-green hover:border-terminal-dark-green'
              } whitespace-nowrap py-4 px-1 border-b-2 font-mono font-medium text-xs uppercase tracking-wider`}
            >
              Asset Allocation Planner
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`${
                activeTab === 'advanced'
                  ? 'border-terminal-green text-terminal-green'
                  : 'border-transparent text-txt-secondary hover:text-terminal-dim-green hover:border-terminal-dark-green'
              } whitespace-nowrap py-4 px-1 border-b-2 font-mono font-medium text-xs uppercase tracking-wider`}
            >
              Advanced Retirement Planning
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'allocation' && <MonteCarloSimulator initialInvestment={4200000} />}
          {activeTab === 'advanced' && <AdvancedRetirementPlanner setActiveTab={setActiveTab} />}
        </div>
      </div>
    </div>
  );
};

export default Finance;
