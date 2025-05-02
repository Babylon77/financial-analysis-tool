import React from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';

const ResultRow = ({ label, value, isPercentage = false, highlight = false }) => (
  <div className={`flex justify-between py-2 ${highlight ? 'font-semibold' : ''}`}>
    <span>{label}</span>
    <span className={highlight ? 'text-blue-600' : ''}>
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

  // Calculate the impact of inflation
  const inflationImpact = ((nominalFinalValues.median - finalValues.median) / nominalFinalValues.median) * 100;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Simulation Results</h3>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-1">Median Outcome</h4>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(percentiles.p50)}</p>
            <p className="text-sm text-gray-500">50th Percentile (After Inflation)</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-1">Real Annual Return</h4>
            <p className="text-2xl font-bold text-green-600">{formatPercent(medianCAGR)}</p>
            <p className="text-sm text-gray-500">Inflation-Adjusted CAGR</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-1">Nominal Annual Return</h4>
            <p className="text-2xl font-bold text-yellow-600">{formatPercent(nominalMedianCAGR)}</p>
            <p className="text-sm text-gray-500">Before Inflation Adjustment</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Projected Outcomes (Inflation Adjusted)</h4>
        <div className="overflow-hidden bg-gray-50 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mt-5">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="px-4 py-2 bg-white shadow rounded-lg overflow-hidden">
                  <dt className="text-sm font-medium text-gray-500 truncate">Optimistic</dt>
                  <dd className="mt-1 text-xl font-semibold text-green-600">{formatCurrency(percentiles.p90)}</dd>
                  <dd className="text-xs text-gray-500">90th Percentile</dd>
                </div>
                <div className="px-4 py-2 bg-white shadow rounded-lg overflow-hidden">
                  <dt className="text-sm font-medium text-gray-500 truncate">Most Likely</dt>
                  <dd className="mt-1 text-xl font-semibold text-blue-600">{formatCurrency(percentiles.p50)}</dd>
                  <dd className="text-xs text-gray-500">50th Percentile</dd>
                </div>
                <div className="px-4 py-2 bg-white shadow rounded-lg overflow-hidden">
                  <dt className="text-sm font-medium text-gray-500 truncate">Conservative</dt>
                  <dd className="mt-1 text-xl font-semibold text-amber-600">{formatCurrency(percentiles.p10)}</dd>
                  <dd className="text-xs text-gray-500">10th Percentile</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Risk Analysis</h4>
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-red-800">Maximum Drawdown</h5>
              <p className="text-2xl font-bold text-red-700">{formatPercent(drawdowns.worst)}</p>
              <p className="text-xs text-red-600">Worst case temporary loss</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-red-800">Average Drawdown</h5>
              <p className="text-2xl font-bold text-red-700">{formatPercent(drawdowns.average)}</p>
              <p className="text-xs text-red-600">Typical maximum decline</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 mt-2">
            Drawdowns represent temporary declines from peak values. These typically recover over time,
            but require patience and discipline to avoid selling at market bottoms.
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Inflation Impact</h4>
        <div className="bg-purple-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-purple-800">Nominal Value (Before Inflation)</h5>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(nominalFinalValues.median)}</p>
              <p className="text-xs text-purple-600">Not adjusted for inflation</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-purple-800">Real Value (After Inflation)</h5>
              <p className="text-2xl font-bold text-purple-700">{formatCurrency(finalValues.median)}</p>
              <p className="text-xs text-purple-600">Adjusted for inflation</p>
            </div>
          </div>
          <p className="text-xs text-gray-700 mt-2">
            Inflation reduces purchasing power by approximately {inflationImpact.toFixed(1)}% over this time period.
            All projections account for this loss in purchasing power.
          </p>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Detailed Percentile Breakdown</h4>
        <div className="border-t border-b divide-y">
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
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Real Annual Growth</h4>
          <p className="text-2xl font-bold text-blue-600">{formatPercent(medianCAGR)}</p>
          <p className="text-sm text-gray-500">Inflation-Adjusted (CAGR)</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Nominal Annual Growth</h4>
          <p className="text-2xl font-bold text-green-600">{formatPercent(nominalMedianCAGR)}</p>
          <p className="text-sm text-gray-500">Before Inflation (CAGR)</p>
        </div>
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Average Annual Return</h4>
          <p className="text-2xl font-bold text-indigo-600">{formatPercent(avgAnnualReturn)}</p>
          <p className="text-sm text-gray-500">Arithmetic mean return</p>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 italic mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="mb-1">* Results reflect a realistic model incorporating bull/bear market cycles, drawdowns, and extreme events.</p>
        <p className="mb-1">* The model accounts for market regimes and serial correlation in returns to simulate real market behavior.</p>
        <p>* Past performance is not indicative of future results. This analysis is for educational purposes only.</p>
      </div>
    </div>
  );
};

export default MonteCarloResults; 