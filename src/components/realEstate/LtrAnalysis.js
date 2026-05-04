import React from 'react';
import { formatCurrency, formatPercent } from '../../hooks/useResultsAnalysis';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const PIE_COLORS = ['#00ff41', '#00d4ff', '#ffb000', '#ff073a', '#00ff41', '#00d4ff', '#ffb000'];

function LtrAnalysis({ analysis, formData }) {
  const {
    purchasePrice, downPayment, loanAmount, monthlyPayment,
    renovationCost, effectiveAnnualRent, propertyTaxAnnual,
    insuranceAnnual, maintenanceAnnual, utilitiesAnnual,
    capexAnnual, propertyManagementFee, totalAnnualExpenses,
    annualCashFlow, ltrCashOnCashReturn, monthlyRent, vacancyRate,
    monthlyCashFlow, appreciationProfit, loanPaydown,
  } = analysis;

  const expenseData = [
    { name: 'Property Tax', value: propertyTaxAnnual },
    { name: 'Insurance', value: insuranceAnnual },
    { name: 'Maintenance', value: maintenanceAnnual },
    { name: 'Utilities', value: utilitiesAnnual },
    { name: 'CapEx', value: capexAnnual },
    { name: 'Management', value: propertyManagementFee },
    { name: 'Mortgage', value: monthlyPayment * 12 },
  ];

  return (
    <div className="mb-8 border border-surface-border rounded-lg bg-surface-primary overflow-hidden">
      <div className="bg-surface-elevated border-b border-surface-border px-6 py-4">
        <h2 className="text-xl font-semibold text-terminal-green">Long-Term Rental Strategy Detailed Analysis</h2>
        <p className="text-sm text-terminal-green">Complete breakdown of rental income, expenses, and long-term returns</p>
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
                <span className="text-txt-secondary">Monthly Rent (effective)</span>
                <span className="font-medium">${formatCurrency(effectiveAnnualRent / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Mortgage Payment</span>
                <span className="font-medium">-${formatCurrency(monthlyPayment)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Property Tax</span>
                <span className="font-medium">-${formatCurrency(propertyTaxAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Insurance</span>
                <span className="font-medium">-${formatCurrency(insuranceAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Maintenance</span>
                <span className="font-medium">-${formatCurrency(maintenanceAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Utilities</span>
                <span className="font-medium">-${formatCurrency(utilitiesAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Management Fee ({formData.propertyManagementFee || 10}%)</span>
                <span className="font-medium">-${formatCurrency(propertyManagementFee / 12)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Capital Reserves</span>
                <span className="font-medium">-${formatCurrency(capexAnnual / 12)}</span>
              </div>
              <div className="flex justify-between items-center font-medium text-terminal-green">
                <span>Monthly Cash Flow</span>
                <span>${formatCurrency(annualCashFlow / 12)}</span>
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
                <span className="text-txt-secondary">Monthly Rent</span>
                <span className="font-medium">${formatCurrency(monthlyRent)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Vacancy Rate</span>
                <span className="font-medium">{vacancyRate}%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Effective Annual Rent</span>
                <span className="font-medium">${formatCurrency(effectiveAnnualRent)}</span>
              </div>
              <div className="flex justify-between items-center font-medium text-terminal-green pt-2 border-t border-surface-border">
                <span>Total Annual Revenue</span>
                <span>${formatCurrency(effectiveAnnualRent)}</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-txt-primary mb-2">Occupancy Distribution</h4>
              <div className="flex h-8 rounded-lg overflow-hidden">
                <div
                  className="bg-terminal-green"
                  style={{ width: `${100 - vacancyRate}%` }}
                  title={`Occupied: ${100 - vacancyRate}%`}
                ></div>
                <div
                  className="bg-surface-elevated"
                  style={{ width: `${vacancyRate}%` }}
                  title={`Vacant: ${vacancyRate}%`}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-terminal-green">Occupied: {Math.round(365 * (100 - vacancyRate) / 100)} days</span>
                <span className="text-txt-muted">Vacant: {Math.round(365 * vacancyRate / 100)} days</span>
              </div>
            </div>
          </div>

          {/* Annual Expense Breakdown */}
          <div className="bg-surface-primary border rounded-lg p-5">
            <h3 className="text-lg font-medium text-txt-primary mb-4">Annual Expense Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Property Tax</span>
                <span className="font-medium">-${formatCurrency(propertyTaxAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Insurance</span>
                <span className="font-medium">-${formatCurrency(insuranceAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Maintenance</span>
                <span className="font-medium">-${formatCurrency(maintenanceAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Utilities</span>
                <span className="font-medium">-${formatCurrency(utilitiesAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Capital Expenditures</span>
                <span className="font-medium">-${formatCurrency(capexAnnual)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Management Fee ({formData.propertyManagementFee || 10}%)</span>
                <span className="font-medium">-${formatCurrency(propertyManagementFee)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-surface-border">
                <span className="text-txt-secondary">Mortgage Payments</span>
                <span className="font-medium">-${formatCurrency(monthlyPayment * 12)}</span>
              </div>
              <div className="flex justify-between items-center font-medium text-terminal-red">
                <span>Total Annual Expenses</span>
                <span>-${formatCurrency(totalAnnualExpenses + monthlyPayment * 12)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center font-medium text-terminal-green pt-2 border-t border-surface-border">
                <span>Annual Net Cash Flow</span>
                <span>${formatCurrency(annualCashFlow)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-txt-secondary pt-1">
                <span>Monthly Average</span>
                <span>${formatCurrency(annualCashFlow / 12)}/month</span>
              </div>
            </div>
          </div>
        </div>

        {/* LTR Expense Distribution Chart */}
        <div className="bg-surface-primary border rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-txt-primary mb-4">LTR Expense Distribution</h3>
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
              <p className="text-2xl font-bold text-terminal-amber">${formatCurrency(annualCashFlow / 12)}/mo</p>
              <p className="text-sm text-terminal-amber">${formatCurrency(annualCashFlow)}/yr</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-green mb-1">Cash-on-Cash Return</p>
              <p className="text-2xl font-bold text-terminal-green">{formatPercent(ltrCashOnCashReturn)}%</p>
              <p className="text-sm text-terminal-green">Annual return on investment</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-cyan mb-1">Vacancy Rate</p>
              <p className="text-2xl font-bold text-terminal-cyan">{vacancyRate}%</p>
              <p className="text-sm text-terminal-cyan">{Math.round(365 * vacancyRate / 100)} days/year</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-4 text-center">
              <p className="text-sm text-terminal-amber mb-1">Monthly Rent</p>
              <p className="text-2xl font-bold text-terminal-amber">${formatCurrency(monthlyRent)}</p>
              <p className="text-sm text-terminal-amber">gross monthly</p>
            </div>
          </div>
        </div>

        {/* 5-Year Return Projection */}
        <div className="bg-surface-primary border rounded-lg p-5 mb-6">
          <h3 className="text-lg font-medium text-txt-primary mb-4">5-Year Return Projection</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-border">
              <thead className="bg-surface-elevated">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider">Component</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider">Calculation</th>
                </tr>
              </thead>
              <tbody className="bg-surface-primary divide-y divide-surface-border">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-primary">Cash Flow (5 years)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-terminal-green">${formatCurrency(monthlyCashFlow * 12 * 5)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-muted">${formatCurrency(monthlyCashFlow)} x 12 months x 5 years</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-primary">Appreciation ({formData.annualAppreciation || 3}% annually)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-terminal-green">${formatCurrency(appreciationProfit)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-muted">${formatCurrency(purchasePrice)} x (1 + {formData.annualAppreciation || 3}%)^5 - ${formatCurrency(purchasePrice)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-primary">Loan Principal Paydown</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-terminal-green">${formatCurrency(loanPaydown)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-muted">Reduction in loan balance over 5 years</td>
                </tr>
                <tr className="bg-surface-elevated">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-txt-primary">Total Return</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-terminal-green">${formatCurrency(monthlyCashFlow * 12 * 5 + appreciationProfit + loanPaydown)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-muted">Sum of all components</td>
                </tr>
                <tr className="bg-surface-elevated">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-txt-primary">Total ROI (Annualized)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-terminal-green">{formatPercent(((monthlyCashFlow * 12 * 5 + appreciationProfit + loanPaydown) / (downPayment + renovationCost)) / 5 * 100)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-muted">Annual return on ${formatCurrency(downPayment + renovationCost)} investment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LtrAnalysis;
