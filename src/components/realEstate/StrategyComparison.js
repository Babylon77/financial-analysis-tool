import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { formatCurrency, formatPercent } from '../../hooks/useResultsAnalysis';
import { STRATEGY_LABELS } from '../../utils/constants/realEstateConstants';

const COLORS = ['#00ff41', '#00d4ff', '#ffb000'];

export default function StrategyComparison({ analysis, selectedStrategy, recommendedStrategy, formData }) {
  const {
    annualizedROI, ltrTotalROIAnnualized, strTotalROIAnnualized,
    purchasePrice, downPayment, loanAmount, renovationCost, holdingPeriod,
    monthlyExpenses, totalHoldingCosts, expectedSellingPrice,
    sellingCosts, totalInvestment, netProfit, roi,
    monthlyRent, annualCashFlow, ltrCashOnCashReturn, capRate, vacancyRate,
    nightlyRate, occupancyRate, annualStrRevenue, annualStrCashFlow, strCashOnCashReturn,
    investmentBreakdown,
  } = analysis;

  return (
    <>
      {/* Recommendation Banner */}
      <div className="bg-surface-elevated border-l-4 border-green-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-terminal-green" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-terminal-green">Recommended Strategy: {STRATEGY_LABELS[recommendedStrategy]}</h3>
            <div className="mt-2 text-sm text-terminal-green">
              <p>Based on your priorities and property details, {STRATEGY_LABELS[recommendedStrategy].toLowerCase()} appears to be the best exit strategy for this investment.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Normalized Strategy Comparison */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-txt-primary mb-4">Normalized Strategy Comparison</h2>
        <div className="bg-surface-elevated border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-terminal-cyan">
            <strong>Total ROI</strong> includes all returns: cash flow + appreciation + principal paydown (for rentals). This allows true apples-to-apples comparison across strategies.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fix & Flip */}
          <div className={`bg-surface-primary p-4 rounded-lg border-l-4 border-terminal-green ${selectedStrategy === 'flip' || selectedStrategy === 'all' ? '' : 'opacity-50'}`}>
            <h3 className="text-lg font-medium text-txt-primary mb-2 flex items-center">
              <span className="w-3 h-3 bg-terminal-green rounded-full mr-2"></span>
              Fix & Flip
            </h3>
            <dl className="space-y-2">
              <MetricRow label="Total ROI (Annualized)" value={`${formatPercent(annualizedROI)}%`} />
              <MetricRow label="Monthly Cash Flow" value="$0" />
              <MetricRow label="Net Profit" value={`$${formatCurrency(netProfit)}`} />
              <MetricRow label="Timeline" value={`${holdingPeriod} months`} />
              <MetricRow label="Risk Level" value="Medium" />
              <MetricRow label="Workload" value="Medium" />
              <MetricRow label="Liquidity" value="High" />
            </dl>
          </div>

          {/* Long-Term Rental */}
          <div className={`bg-surface-primary p-4 rounded-lg border-l-4 border-terminal-cyan ${selectedStrategy === 'ltr' || selectedStrategy === 'all' ? '' : 'opacity-50'}`}>
            <h3 className="text-lg font-medium text-txt-primary mb-2 flex items-center">
              <span className="w-3 h-3 bg-terminal-cyan rounded-full mr-2"></span>
              Long-Term Rental
            </h3>
            <dl className="space-y-2">
              <MetricRow label="Total ROI (Annualized)" value={`${formatPercent(ltrTotalROIAnnualized)}%`} className="text-terminal-green" />
              <MetricRow label="Monthly Rent" value={`$${formatCurrency(monthlyRent)}`} />
              <MetricRow label="Monthly Cash Flow" value={`$${formatCurrency(annualCashFlow / 12)}`} />
              <MetricRow label="Cash-on-Cash Return" value={`${formatPercent(ltrCashOnCashReturn)}%`} />
              <MetricRow label="Cap Rate" value={`${formatPercent(capRate)}%`} />
              <MetricRow label="Vacancy Rate" value={`${vacancyRate}%`} />
              <MetricRow label="Risk Level" value="Low" className="text-terminal-green" />
              <MetricRow label="Workload" value="Medium" className="text-terminal-green" />
            </dl>
          </div>

          {/* Short-Term Rental */}
          <div className={`bg-surface-primary p-4 rounded-lg border-l-4 border-terminal-amber ${selectedStrategy === 'str' || selectedStrategy === 'all' ? '' : 'opacity-50'}`}>
            <h3 className="text-lg font-medium text-txt-primary mb-2 flex items-center">
              <span className="w-3 h-3 bg-terminal-amber rounded-full mr-2"></span>
              Short-Term Rental
            </h3>
            <dl className="space-y-2">
              <MetricRow label="Total ROI (Annualized)" value={`${formatPercent(strTotalROIAnnualized)}%`} className="text-terminal-amber" />
              <MetricRow label="Nightly Rate" value={`$${formatCurrency(nightlyRate)}`} />
              <MetricRow label="Occupancy Rate" value={`${occupancyRate}%`} />
              <MetricRow label="Monthly Revenue" value={`$${formatCurrency(annualStrRevenue / 12)}`} />
              <MetricRow label="Monthly Cash Flow" value={`$${formatCurrency(annualStrCashFlow / 12)}`} />
              <MetricRow label="Cash-on-Cash Return" value={`${formatPercent(strCashOnCashReturn)}%`} />
              <MetricRow label="Risk Level" value="High" className="text-terminal-red" />
              <MetricRow label="Workload" value="High" className="text-terminal-red" />
            </dl>
          </div>
        </div>
      </div>

      {/* Investment Breakdown Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-txt-primary mb-4">Investment Breakdown</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={investmentBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#00ff41"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {investmentBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-txt-primary mb-4">Detailed Analysis</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DetailCard title="Purchase Details">
              <MetricRow label="Purchase Price" value={`$${formatCurrency(purchasePrice)}`} />
              <MetricRow label="Down Payment" value={`$${formatCurrency(downPayment)}`} />
              <MetricRow label="Loan Amount" value={`$${formatCurrency(loanAmount)}`} />
            </DetailCard>

            <DetailCard title="Renovation Details">
              <MetricRow label="Renovation Cost" value={`$${formatCurrency(renovationCost)}`} />
              <MetricRow label="Holding Period" value={`${holdingPeriod} months`} />
              <MetricRow label="Monthly Expenses" value={`$${formatCurrency(monthlyExpenses)}`} />
            </DetailCard>

            <DetailCard title="Selling Details">
              <MetricRow label="Expected Selling Price" value={`$${formatCurrency(expectedSellingPrice)}`} />
              <MetricRow label="Selling Costs" value={`$${formatCurrency(sellingCosts)}`} />
              <MetricRow label="Total Holding Costs" value={`$${formatCurrency(totalHoldingCosts)}`} />
            </DetailCard>

            <DetailCard title="Investment Summary">
              <MetricRow label="Total Investment" value={`$${formatCurrency(totalInvestment)}`} />
              <MetricRow label="Net Profit" value={`$${formatCurrency(netProfit)}`} />
              <MetricRow label="ROI" value={`${formatPercent(roi)}%`} />
            </DetailCard>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-txt-primary mb-4">Property Details</h2>
        <div className="bg-surface-primary p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg font-medium text-txt-primary mb-2">Purchase</h3>
              <dl className="space-y-1">
                <MetricRow label="Purchase Price:" value={`$${formatCurrency(purchasePrice)}`} />
                <MetricRow label={`Down Payment (${formData.downPaymentPercent}%):`} value={`$${formatCurrency(downPayment)}`} />
                <MetricRow label="Loan Amount:" value={`$${formatCurrency(loanAmount)}`} />
                <MetricRow label="Interest Rate:" value={`${formData.interestRate}%`} />
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium text-txt-primary mb-2">Renovation</h3>
              <dl className="space-y-1">
                <MetricRow label="Renovation Cost:" value={`$${formatCurrency(renovationCost)}`} />
                <MetricRow label="Timeline:" value={`${holdingPeriod} months`} />
                <MetricRow label="Monthly Expenses:" value={`$${formatCurrency(monthlyExpenses)}`} />
                <MetricRow label="Total Holding Costs:" value={`$${formatCurrency(totalHoldingCosts)}`} />
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium text-txt-primary mb-2">Exit</h3>
              <dl className="space-y-1">
                <MetricRow label="After Repair Value:" value={`$${formatCurrency(expectedSellingPrice)}`} />
                <MetricRow label={`Selling Costs (${formData.sellingCosts}%):`} value={`$${formatCurrency(sellingCosts)}`} />
                <MetricRow label="Monthly Rent:" value={`$${formatCurrency(monthlyRent)}`} />
                <MetricRow label="Nightly Rate:" value={`$${formatCurrency(nightlyRate)}`} />
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricRow({ label, value, className = '' }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sm text-txt-muted">{label}</dt>
      <dd className={`text-sm font-medium ${className || 'text-txt-primary'}`}>{value}</dd>
    </div>
  );
}

function DetailCard({ title, children }) {
  return (
    <div className="bg-surface-primary p-4 rounded-lg">
      <h3 className="text-sm font-medium text-txt-muted">{title}</h3>
      <dl className="mt-2 space-y-2">{children}</dl>
    </div>
  );
}
