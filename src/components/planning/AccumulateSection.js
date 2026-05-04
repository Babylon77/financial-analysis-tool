import React from 'react';
import MonteCarloSimulator from '../MonteCarloSimulator';
import Accumulate from '../../pages/Accumulate';
import SectionNextStep from './SectionNextStep';

export default function AccumulateSection() {
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-terminal-green crt-glow uppercase tracking-wider">
          Wealth Accumulation
        </h2>
        <p className="text-txt-secondary font-mono text-sm mt-2">
          Simulate growth, optimize contributions, and project wealth to retirement
        </p>
      </div>

      <MonteCarloSimulator />
      <Accumulate embedded />

      <SectionNextStep currentPath="accumulate" />
    </div>
  );
}
