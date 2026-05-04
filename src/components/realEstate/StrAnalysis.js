import React from 'react';
import { formatCurrency, formatPercent } from '../../hooks/useResultsAnalysis';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const PIE_COLORS = ['#00ff41', '#00d4ff', '#ffb000', '#ff073a', '#00ff41', '#00d4ff', '#ffb000', '#ff073a', '#00d4ff'];

function StrAnalysis({ analysis, formData }) {
  const {
    purchasePrice, downPayment, loanAmount, monthlyPayment,
    renovationCost, annualStrRevenue, nightlyRate, occupancyRate,
    strPropertyTaxAnnual, strInsuranceAnnual, strMaintenanceAnnual,
    strUtilitiesAnnual, strCapexAnnual, strManagementFee,
    totalStrAnnualExpenses, annualStrCashFlow,
    strCashOnCashReturn,
  } = analysis;

  const cleaningCost = (formData.cleaningPerTurn || 100) * Math.ceil(365 * (occupancyRate / 100) / (formData.averageStay || 3));

  const expenseData = [
    { name: 'Property Tax', value: strPropertyTaxAnnual },
    { name: 'Insurance', value: strInsuranceAnnual },
    { name: 'Maintenance', value: strMaintenanceAnnual },
    { name: 'Utilities', value: strUtilitiesAnnual },
    { name: 'CapEx', value: strCapexAnnual },
    { name: 'Management', value: strManagementFee },
    { name: 'Cleaning', value: cleaningCost },
    { name: 'Other', value: (formData.additionalStrExpenses || 250) * 12 },
    { name: 'Mortgage', value: monthlyPayment * 12 },
  ];

  return (
    <div className="mb-8 border border-surface-border rounded-lg bg-surface-primary overflow-hidden">
      <div className="bg-surface-elevated border-b border-surface-border px-6 py-4">
        <h2 className="text-xl font-semibold text-terminal-amber">Short-Term Rental Strategy (Airbnb/VRBO)</h2>
        <p className="text-sm text-terminal-amber">Complete breakdown of vacation rental income, expenses, and returns</p>
      </div>

      <div className="p-6">
        {/* Initial Investment & Monthly Cash Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Initial Investment */}
          <div className="bg-surface-primary border rounded-lg p-5">
            <h3 className="text-lg font-medium text-txt-primary mb-4">Initial Investment</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Purchase Price</span>
                <span className="font-medium">${formatCurrency(purchasePrice)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Down Payment ({formData.downPayment}%)</span>
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
                <span className="text-txt-secondary">Loan Term</span>
                <span className="font-medium">{formData.loanTerm} years</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Monthly Payment</span>
                <span className="font-medium">${formatCurrency(monthlyPayment)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Renovation Cost</span>
                <span className="font-medium">${formatCurrency(renovationCost)}</span>
              </div>
              <div className="flex justify-between items-center font-medium text-txt-primary">
                <span>Total Initial Investment</span>
                <span>${formatCurrency(downPayment + renovationCost)}</span>
              </div>
            </div>
          </div>

          {/* Monthly Cash Flow */}
          <div className="bg-surface-primary border rounded-lg p-5">
            <h3 className="text-lg font-medium text-txt-primary mb-4">Monthly Cash Flow</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Monthly Revenue (avg)</span>
                <span className="font-medium">${formatCurrency(annualStrRevenue / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Mortgage Payment</span>
                <span className="font-medium">-${formatCurrency(monthlyPayment)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Property Tax</span>
                <span className="font-medium">-${formatCurrency(strPropertyTaxAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Insurance (STR)</span>
                <span className="font-medium">-${formatCurrency(strInsuranceAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Maintenance</span>
                <span className="font-medium">-${formatCurrency(strMaintenanceAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Utilities</span>
                <span className="font-medium">-${formatCurrency(strUtilitiesAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Management Fee ({formData.strManagementFee || 20}%)</span>
                <span className="font-medium">-${formatCurrency(strManagementFee / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Other Expenses</span>
                <span className="font-medium">-${formatCurrency(formData.additionalStrExpenses || 250)}</span>
              </div>
              <div className="flex justify-between items-center font-medium text-terminal-green">
                <span>Monthly Cash Flow</span>
                <span>${formatCurrency(annualStrCashFlow / 12)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Annual Revenue and Expense Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Annual Revenue Breakdown */}
          <div className="bg-surface-primary border rounded-lg p-5">
            <h3 className="text-lg font-medium text-txt-primary mb-4">Annual Revenue Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Average Nightly Rate</span>
                <span className="font-medium">${formatCurrency(nightlyRate)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Annual Nights Booked ({occupancyRate}% occupancy)</span>
                <span className="font-medium">{Math.round(365 * occupancyRate / 100)} nights</span>
              </div>
              <div className="flex justify-between items-center font-medium text-terminal-green pt-2 border-t border-surface-border">
                <span>Annual Revenue</span>
                <span>${formatCurrency(annualStrRevenue)}</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-txt-primary mb-2">Occupancy Distribution</h4>
              <div className="flex h-8 rounded-lg overflow-hidden">
                <div
                  className="bg-terminal-green"
                  style={{ width: `${occupancyRate}%` }}
                  title={`Occupied: ${occupancyRate}%`}
                ></div>
                <div
                  className="bg-surface-elevated"
                  style={{ width: `${100 - occupancyRate}%` }}
                  title={`Vacant: ${100 - occupancyRate}%`}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-terminal-green">Occupied: {Math.round(365 * occupancyRate / 100)} nights</span>
                <span className="text-txt-muted">Vacant: {365 - Math.round(365 * occupancyRate / 100)} nights</span>
              </div>
            </div>
          </div>

          {/* Annual Expense Breakdown */}
          <div className="bg-surface-primary border rounded-lg p-5">
            <h3 className="text-lg font-medium text-txt-primary mb-4">Annual Expense Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Property Tax</span>
                <span className="font-medium">-${formatCurrency(strPropertyTaxAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Insurance (STR)</span>
                <span className="font-medium">-${formatCurrency(strInsuranceAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Maintenance</span>
                <span className="font-medium">-${formatCurrency(strMaintenanceAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Utilities</span>
                <span className="font-medium">-${formatCurrency(strUtilitiesAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Capital Expenditures</span>
                <span className="font-medium">-${formatCurrency(strCapexAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Management Fee ({formData.strManagementFee || 20}%)</span>
                <span className="font-medium">-${formatCurrency(strManagementFee)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Cleaning & Turnover</span>
                <span className="font-medium">-${formatCurrency(cleaningCost)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Other Expenses</span>
                <span className="font-medium">-${formatCurrency((formData.additionalStrExpenses || 250) * 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Mortgage Payments</span>
                <span className="font-medium">-${formatCurrency(monthlyPayment * 12)}</span>
              </div>
              <div className="flex justify-between items-center font-medium text-terminal-red">
                <span>Total Annual Expenses</span>
                <span>-${formatCurrency(totalStrAnnualExpenses + monthlyPayment * 12)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center font-medium text-terminal-green pt-2 border-t border-surface-border">
                <span>Annual Net Cash Flow</span>
                <span>${formatCurrency(annualStrCashFlow)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-txt-secondary pt-1">
                <span>Monthly Average</span>
                <span>${formatCurrency(annualStrCashFlow / 12)}/month</span>
              </div>
            </div>
          </div>
        </div>

        {/* STR Expense Distribution Chart */}
        <div className="bg-surface-primary border rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-txt-primary mb-4">STR Expense Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#00ff41"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {PIE_COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value) => [`$${formatCurrency(value)}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="bg-surface-primary border rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-txt-primary mb-4">Key Performance Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-amber mb-1">Cash Flow</p>
              <p className="text-2xl font-bold text-terminal-amber">${formatCurrency(annualStrCashFlow / 12)}/mo</p>
              <p className="text-sm text-terminal-amber">${formatCurrency(annualStrCashFlow)}/yr</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-green mb-1">Cash-on-Cash Return</p>
              <p className="text-2xl font-bold text-terminal-green">{formatPercent(strCashOnCashReturn)}%</p>
              <p className="text-sm text-terminal-green">Annual return on investment</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-cyan mb-1">Occupancy Rate</p>
              <p className="text-2xl font-bold text-terminal-cyan">{occupancyRate}%</p>
              <p className="text-sm text-terminal-cyan">{Math.round(365 * occupancyRate / 100)} nights/year</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-amber mb-1">Average Rate</p>
              <p className="text-2xl font-bold text-terminal-amber">${formatCurrency(nightlyRate)}</p>
              <p className="text-sm text-terminal-amber">per night</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StrAnalysis;
