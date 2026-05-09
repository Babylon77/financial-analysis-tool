import React from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';

const ResultRow = ({ label, value, isPercentage = false, highlight = false }) => (
  <div className={`flex justify-between py-2 ${highlight ? 'font-semibold' : ''}`}>
    <span className="text-txt-primary">{label}</span>
    <span className={`data-cell ${highlight ? 'text-terminal-green' : 'text-txt-primary'}`}>
      {isPercentage ? formatPercent(value) : formatCurrency(value)}
    </span>
  </div>
);

const MonteCarloResults = ({ simulationData }) => {
  if (!simulationData) return null;

  const {
    finalValues,
    nominalFinalValues,
    percentiles,
    medianCAGR,
    nominalMedianCAGR,
    avgAnnualReturn,
    drawdowns
  } = simulationData;

  const inflationImpact = Math.max(0, ((nominalFinalValues.median - finalValues.median) / nominalFinalValues.median) * 100);

  return (
    <div className="bg-surface-primary p-6 rounded-lg border border-surface-border">
      <h3 className="text-xl font-display font-semibold mb-4 text-terminal-green">Simulation Results</h3>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-surface-elevated p-4 rounded-lg border border-surface-border">
            <h4 className="font-medium font-display text-txt-primary mb-1">Median Outcome</h4>
            <p className="text-2xl font-bold text-terminal-green data-cell">{formatCurrency(percentiles.p50)}</p>
            <p className="text-sm text-txt-secondary">50th Percentile (After Inflation)</p>
          </div>
          <div className="bg-surface-elevated p-4 rounded-lg border border-surface-border">
            <h4 className="font-medium font-display text-txt-primary mb-1">Real Annual Return</h4>
            <p className="text-2xl font-bold text-terminal-green data-cell">{formatPercent(medianCAGR)}</p>
            <p className="text-sm text-txt-secondary">Inflation-Adjusted CAGR</p>
          </div>
          <div className="bg-surface-elevated p-4 rounded-lg border border-surface-border">
            <h4 className="font-medium font-display text-txt-primary mb-1">Nominal Annual Return</h4>
            <p className="text-2xl font-bold text-terminal-amber data-cell">{formatPercent(nominalMedianCAGR)}</p>
            <p className="text-sm text-txt-secondary">Before Inflation Adjustment</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium font-display text-txt-primary mb-3">Projected Outcomes (Inflation Adjusted)</h4>
        <div className="overflow-hidden bg-surface-elevated rounded-lg border border-surface-border">
          <div className="px-4 py-5 sm:p-6">
            <div className="mt-5">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="px-4 py-2 bg-surface-primary rounded-lg overflow-hidden border border-surface-border">
                  <dt className="text-sm font-medium text-txt-secondary truncate">Optimistic</dt>
                  <dd className="mt-1 text-xl font-semibold text-terminal-green data-cell">{formatCurrency(percentiles.p90)}</dd>
                  <dd className="text-xs text-txt-secondary">90th Percentile</dd>
                </div>
                <div className="px-4 py-2 bg-surface-primary rounded-lg overflow-hidden border border-surface-border">
                  <dt className="text-sm font-medium text-txt-secondary truncate">Most Likely</dt>
                  <dd className="mt-1 text-xl font-semibold text-terminal-green data-cell">{formatCurrency(percentiles.p50)}</dd>
                  <dd className="text-xs text-txt-secondary">50th Percentile</dd>
                </div>
                <div className="px-4 py-2 bg-surface-primary rounded-lg overflow-hidden border border-surface-border">
                  <dt className="text-sm font-medium text-txt-secondary truncate">Conservative</dt>
                  <dd className="mt-1 text-xl font-semibold text-terminal-amber data-cell">{formatCurrency(percentiles.p10)}</dd>
                  <dd className="text-xs text-txt-secondary">10th Percentile</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium font-display text-txt-primary mb-3">Risk Analysis</h4>
        <div className="bg-surface-elevated p-4 rounded-lg mb-4 border border-surface-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-terminal-red">Maximum Drawdown</h5>
              <p className="text-2xl font-bold text-terminal-red data-cell">{formatPercent(drawdowns.worst)}</p>
              <p className="text-xs text-terminal-red">Worst case temporary loss</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-terminal-red">Average Drawdown</h5>
              <p className="text-2xl font-bold text-terminal-red data-cell">{formatPercent(drawdowns.average)}</p>
              <p className="text-xs text-terminal-red">Typical maximum decline</p>
            </div>
          </div>
          <p className="text-xs text-txt-primary mt-2">
            Drawdowns represent temporary declines from peak values. These typically recover over time,
            but require patience and discipline to avoid selling at market bottoms.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium font-display text-txt-primary mb-3">Inflation Impact</h4>
        <div className="bg-surface-elevated p-4 rounded-lg mb-4 border border-surface-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-terminal-amber">Nominal Value (Before Inflation)</h5>
              <p className="text-2xl font-bold text-terminal-amber data-cell">{formatCurrency(nominalFinalValues.median)}</p>
              <p className="text-xs text-txt-secondary">Not adjusted for inflation</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-terminal-amber">Real Value (After Inflation)</h5>
              <p className="text-2xl font-bold text-terminal-amber data-cell">{formatCurrency(finalValues.median)}</p>
              <p className="text-xs text-txt-secondary">Adjusted for inflation</p>
            </div>
          </div>
          <p className="text-xs text-txt-primary mt-2">
            Inflation reduces purchasing power by approximately {inflationImpact.toFixed(1)}% over this time period.
            All projections account for this loss in purchasing power.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium font-display text-txt-primary mb-3">Detailed Percentile Breakdown</h4>
        <div className="border-t border-b border-surface-border divide-y divide-surface-border">
          <ResultRow
            label="Optimistic Case (90th Percentile)"
            value={percentiles.p90}
            highlight={false}
          />
          <ResultRow
            label="Upper Middle Case (75th Percentile)"
            value={percentiles.p75}
          />
          <ResultRow
            label="Median (50th Percentile)"
            value={percentiles.p50}
            highlight={true}
          />
          <ResultRow
            label="Lower Middle Case (25th Percentile)"
            value={percentiles.p25}
          />
          <ResultRow
            label="Pessimistic Case (10th Percentile)"
            value={percentiles.p10}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-surface-primary border border-surface-border p-4 rounded-lg">
          <h4 className="font-medium font-display text-txt-primary mb-2">Real Annual Growth</h4>
          <p className="text-2xl font-bold text-terminal-green data-cell">{formatPercent(medianCAGR)}</p>
          <p className="text-sm text-txt-secondary">Inflation-Adjusted (CAGR)</p>
        </div>
        <div className="bg-surface-primary border border-surface-border p-4 rounded-lg">
          <h4 className="font-medium font-display text-txt-primary mb-2">Nominal Annual Growth</h4>
          <p className="text-2xl font-bold text-terminal-green data-cell">{formatPercent(nominalMedianCAGR)}</p>
          <p className="text-sm text-txt-secondary">Before Inflation (CAGR)</p>
        </div>
        <div className="bg-surface-primary border border-surface-border p-4 rounded-lg">
          <h4 className="font-medium font-display text-txt-primary mb-2">Average Annual Return</h4>
          <p className="text-2xl font-bold text-terminal-cyan data-cell">{formatPercent(avgAnnualReturn)}</p>
          <p className="text-sm text-txt-secondary">Arithmetic mean return</p>
        </div>
      </div>

      <div className="text-sm text-txt-muted italic mt-6 p-3 bg-surface-elevated rounded-lg border border-surface-border">
        <p className="mb-1">* Results reflect a realistic model incorporating bull/bear market cycles, drawdowns, and extreme events.</p>
        <p className="mb-1">* The model accounts for market regimes and serial correlation in returns to simulate real market behavior.</p>
        <p>* Past performance is not indicative of future results. This analysis is for educational purposes only.</p>
      </div>
    </div>
  );
};

export default MonteCarloResults;