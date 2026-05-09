import React from 'react';
import { formatCurrency, formatPercent } from '../../hooks/useResultsAnalysis';

const getQualityColor = (quality) => {
  switch (quality) {
    case 'Excellent': return 'bg-surface-elevated text-terminal-green';
    case 'Good': return 'bg-surface-elevated text-terminal-cyan';
    case 'Fair': return 'bg-surface-elevated text-terminal-amber';
    case 'Poor': return 'bg-surface-elevated text-terminal-red';
    default: return 'bg-surface-elevated text-txt-primary';
  }
};

export default function ResultsDashboard({ analysis, recommendedStrategy, strategyLabels }) {
  return (
    <>
      {/* Dashboard Header */}
      <div className="bg-surface-elevated rounded-lg p-6 mb-6 border border-terminal-green">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-terminal-green">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-1">Property</h3>
            <p className="text-3xl font-bold">${formatCurrency(analysis.purchasePrice)}</p>
            <p className="text-sm opacity-80">Purchase Price</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-1">Best Strategy</h3>
            <p className="text-2xl font-bold">{strategyLabels[recommendedStrategy]}</p>
            <p className="text-sm opacity-80">Based on your priorities</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-1">Highest Annualized ROI</h3>
            <p className="text-3xl font-bold">{formatPercent(Math.max(analysis.annualizedROI, analysis.ltrTotalROIAnnualized, analysis.strTotalROIAnnualized))}%</p>
            <p className="text-sm opacity-80">Best strategy, annualized</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-1">5-Year Profit</h3>
            <p className="text-3xl font-bold">${formatCurrency(Math.max(analysis.netProfit, analysis.rentalProfit, analysis.strTotalProfit))}</p>
            <p className="text-sm opacity-80">Maximum Strategy</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Purchase & Renovation */}
        <div className="bg-surface-primary rounded-lg p-4">
          <h4 className="text-lg font-semibold text-txt-primary mb-3">Purchase & Renovation</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-txt-muted">Purchase Price</span>
              <span className="font-medium">${formatCurrency(analysis.purchasePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Down Payment</span>
              <span className="font-medium">${formatCurrency(analysis.downPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Renovation Cost</span>
              <span className="font-medium">${formatCurrency(analysis.renovationCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Loan Amount</span>
              <span className="font-medium">${formatCurrency(analysis.loanAmount)}</span>
            </div>
          </div>
        </div>

        {/* ARV & Projected Value */}
        <div className="bg-surface-primary rounded-lg p-4">
          <h4 className="text-lg font-semibold text-txt-primary mb-3">ARV & Projected Value</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-txt-muted">Expected Selling Price</span>
              <span className="font-medium">${formatCurrency(analysis.expectedSellingPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">ARV-to-Purchase</span>
              <span className="font-medium">{formatPercent(analysis.arvToPurchaseRatio * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Renovation-to-ARV</span>
              <span className="font-medium">{formatPercent(analysis.renovationToArvRatio)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-txt-muted">Net Profit (Flip)</span>
              <span className="font-medium">${formatCurrency(analysis.netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Deal Assessment */}
        <div className="bg-surface-primary rounded-lg p-4">
          <h4 className="text-lg font-semibold text-txt-primary mb-3">Deal Assessment</h4>
          <div className="mb-3">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getQualityColor(analysis.dealQuality)}`}>
              {analysis.dealQuality} Deal
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-txt-muted">Flip ROI (holding period)</span>
                <span className="font-medium">{formatPercent(analysis.roi)}%</span>
              </div>
              <div className="w-full bg-surface-elevated rounded-full h-2">
                <div
                  className="bg-terminal-cyan h-2 rounded-full"
                  style={{ width: `${Math.min(Math.max(analysis.roi, 0), 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-txt-muted">ARV Ratio</span>
                <span className="font-medium">{formatPercent(analysis.arvToPurchaseRatio * 100)}%</span>
              </div>
              <div className="w-full bg-surface-elevated rounded-full h-2">
                <div
                  className="bg-terminal-cyan h-2 rounded-full"
                  style={{ width: `${Math.min(Math.max((analysis.arvToPurchaseRatio - 1) * 200, 0), 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-txt-muted">Reno-to-ARV</span>
                <span className="font-medium">{formatPercent(analysis.renovationToArvRatio)}%</span>
              </div>
              <div className="w-full bg-surface-elevated rounded-full h-2">
                <div
                  className="bg-terminal-green h-2 rounded-full"
                  style={{ width: `${Math.min(Math.max(100 - analysis.renovationToArvRatio * 2, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Industry Standards */}
        <div className="bg-surface-primary rounded-lg p-4">
          <h4 className="text-lg font-semibold text-txt-primary mb-3">Industry Standards</h4>
          <div className="space-y-2">
            <div className={`p-2 rounded ${getQualityColor('Excellent')}`}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Excellent</span>
                <span>ROI &ge; 30%, ARV &ge; 1.3x, Reno &le; 20%</span>
              </div>
            </div>
            <div className={`p-2 rounded ${getQualityColor('Good')}`}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Good</span>
                <span>ROI &ge; 20%, ARV &ge; 1.2x, Reno &le; 25%</span>
              </div>
            </div>
            <div className={`p-2 rounded ${getQualityColor('Fair')}`}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Fair</span>
                <span>ROI &ge; 10%, ARV &ge; 1.1x, Reno &le; 30%</span>
              </div>
            </div>
            <div className={`p-2 rounded ${getQualityColor('Poor')}`}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Poor</span>
                <span>Below Fair thresholds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
