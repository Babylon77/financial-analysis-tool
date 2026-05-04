import React from 'react';
import { formatCurrency, formatPercent } from '../../hooks/useResultsAnalysis';

function FlipAnalysis({ analysis, formData }) {
  const {
    purchasePrice, downPayment, loanAmount, monthlyPayment,
    renovationCost, monthlyExpenses, holdingPeriod, totalHoldingCosts,
    expectedSellingPrice, sellingCosts, totalInvestment, netProfit,
    roi, annualizedROI,
  } = analysis;

  return (
    <div className="mb-8 border border-surface-border rounded-lg bg-surface-primary overflow-hidden">
      <div className="bg-surface-elevated border-b border-surface-border px-6 py-4">
        <h2 className="text-xl font-semibold text-terminal-cyan">Fix & Flip Strategy Detailed Analysis</h2>
        <p className="text-sm text-terminal-cyan">Complete breakdown of investment returns and cash flow</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Financial Summary */}
          <div className="bg-surface-primary border rounded-lg p-5">
            <h3 className="text-lg font-medium text-txt-primary mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Purchase Price</span>
                <span className="font-medium">${formatCurrency(purchasePrice)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Down Payment</span>
                <span className="font-medium">${formatCurrency(downPayment)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Loan Amount</span>
                <span className="font-medium">${formatCurrency(loanAmount)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Interest Rate</span>
                <span className="font-medium">{formData.interestRate}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Monthly Payment</span>
                <span className="font-medium">${formatCurrency(monthlyPayment)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Renovation Cost</span>
                <span className="font-medium">${formatCurrency(renovationCost)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Monthly Expenses</span>
                <span className="font-medium">${formatCurrency(monthlyExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Timeline</span>
                <span className="font-medium">{holdingPeriod} months</span>
              </div>
              <div className="flex justify-between items-center font-medium text-txt-primary">
                <span>Total Holding Costs</span>
                <span>${formatCurrency(totalHoldingCosts)}</span>
              </div>
            </div>
          </div>

          {/* Profit Calculation */}
          <div className="bg-surface-primary border rounded-lg p-5">
            <h3 className="text-lg font-medium text-txt-primary mb-4">Profit Calculation</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">After Repair Value (ARV)</span>
                <span className="font-medium">${formatCurrency(expectedSellingPrice)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Selling Costs ({formData.sellingCosts}%)</span>
                <span className="font-medium">-${formatCurrency(sellingCosts)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Purchase Price</span>
                <span className="font-medium">-${formatCurrency(purchasePrice)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Renovation Cost</span>
                <span className="font-medium">-${formatCurrency(renovationCost)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Holding Costs</span>
                <span className="font-medium">-${formatCurrency(totalHoldingCosts)}</span>
              </div>
              <div className="flex justify-between items-center font-medium text-terminal-green pt-2">
                <span>Net Profit</span>
                <span>${formatCurrency(netProfit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="bg-surface-primary border rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-txt-primary mb-4">Key Performance Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-cyan mb-1">Total Investment</p>
              <p className="text-2xl font-bold text-terminal-cyan">${formatCurrency(totalInvestment)}</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-green mb-1">Net Profit</p>
              <p className="text-2xl font-bold text-terminal-green">${formatCurrency(netProfit)}</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-cyan mb-1">Return on Investment</p>
              <p className="text-2xl font-bold text-terminal-cyan">{formatPercent(roi)}%</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-amber mb-1">Annualized ROI</p>
              <p className="text-2xl font-bold text-terminal-amber">{formatPercent(annualizedROI)}%</p>
            </div>
          </div>
        </div>

        {/* Understanding the Math */}
        <div className="bg-surface-primary border rounded-lg p-5">
          <h3 className="text-lg font-medium text-txt-primary mb-4">Understanding the Math</h3>

          <div className="space-y-4 text-sm text-txt-secondary">
            <p>
              <strong className="text-txt-primary">Total Investment:</strong> The sum of your initial cash investment (down payment), renovation costs, and holding costs during the renovation period.
            </p>
            <div className="bg-surface-elevated p-3 rounded">
              <code>Total Investment = Down Payment + Renovation Cost + Holding Costs</code><br />
              <code>Total Investment = ${formatCurrency(downPayment)} + ${formatCurrency(renovationCost)} + ${formatCurrency(totalHoldingCosts)} = ${formatCurrency(totalInvestment)}</code>
            </div>

            <p>
              <strong className="text-txt-primary">Net Profit:</strong> The difference between your selling price (minus selling costs) and all expenses (purchase price, renovation, and holding costs).
            </p>
            <div className="bg-surface-elevated p-3 rounded">
              <code>Net Profit = ARV - Selling Costs - Purchase Price - Renovation Cost - Holding Costs</code><br />
              <code>Net Profit = ${formatCurrency(expectedSellingPrice)} - ${formatCurrency(sellingCosts)} - ${formatCurrency(purchasePrice)} - ${formatCurrency(renovationCost)} - ${formatCurrency(totalHoldingCosts)} = ${formatCurrency(netProfit)}</code>
            </div>

            <p>
              <strong className="text-txt-primary">Return on Investment (ROI):</strong> The percentage return on your total investment.
            </p>
            <div className="bg-surface-elevated p-3 rounded">
              <code>ROI = (Net Profit / Total Investment) x 100%</code><br />
              <code>ROI = (${formatCurrency(netProfit)} / ${formatCurrency(totalInvestment)}) x 100% = {formatPercent(roi)}%</code>
            </div>

            <p>
              <strong className="text-txt-primary">Annualized ROI:</strong> The ROI converted to an annual rate, accounting for the holding period.
            </p>
            <div className="bg-surface-elevated p-3 rounded">
              <code>Annualized ROI = (ROI / Holding Period in Months) x 12</code><br />
              <code>Annualized ROI = ({formatPercent(roi)}% / {holdingPeriod}) x 12 = {formatPercent(annualizedROI)}%</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlipAnalysis;
