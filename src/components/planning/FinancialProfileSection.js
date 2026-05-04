import React, { useCallback, useMemo } from 'react';
import { useFinancialPlan } from '../../context/FinancialPlanContext';
import MoneyInput from '../MoneyInput';
import { formatCurrency } from '../../utils/formatters';
import SectionNextStep from './SectionNextStep';

const FILING_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
  { value: 'married_filing_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];

function SectionCard({ title, children }) {
  return (
    <div className="terminal-card p-6 mb-6">
      <h3 className="font-display font-bold text-terminal-amber uppercase tracking-wider text-sm mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

export default function FinancialProfileSection() {
  const { state, dispatch } = useFinancialPlan();
  const profile = state.profile;

  const isMarried = profile.filingStatus === 'married_filing_jointly' ||
    profile.filingStatus === 'married_filing_separately';

  const update = useCallback((payload) => {
    dispatch({ type: 'SET_PROFILE', payload });
  }, [dispatch]);

  const updateAccounts = useCallback((payload) => {
    dispatch({ type: 'SET_PROFILE_ACCOUNTS', payload });
  }, [dispatch]);

  const totalNetWorth = useMemo(
    () => Object.values(profile.accounts).reduce((s, v) => s + v, 0),
    [profile.accounts]
  );

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-terminal-green crt-glow uppercase tracking-wider">
          Financial Profile
        </h2>
        <p className="text-txt-secondary font-mono text-sm mt-2">
          Your baseline inputs — used across all analysis sections
        </p>
      </div>

      {/* Personal Information */}
      <SectionCard title="Personal Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Filing Status</Label>
            <select
              className="terminal-input w-full"
              value={profile.filingStatus}
              onChange={e => update({ filingStatus: e.target.value })}
            >
              {FILING_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Life Expectancy</Label>
            <input
              type="number"
              className="terminal-input w-full"
              value={profile.lifeExpectancy}
              onChange={e => update({ lifeExpectancy: parseInt(e.target.value) || 90 })}
            />
          </div>
          <div>
            <Label>Dependents</Label>
            <input
              type="number"
              className="terminal-input w-full"
              value={profile.dependents}
              onChange={e => update({ dependents: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>
        </div>

        {/* Spouse 1 */}
        <div className="bg-surface-elevated rounded-lg p-4 border border-surface-border mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-terminal-dark-green flex items-center justify-center">
              <span className="text-terminal-green text-xs font-bold font-mono">S1</span>
            </div>
            <input
              type="text"
              className="terminal-input flex-1 max-w-xs"
              value={profile.spouse1.name}
              onChange={e => update({ spouse1: { name: e.target.value } })}
              placeholder="Spouse 1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Current Age</Label>
              <input
                type="number"
                className="terminal-input w-full"
                value={profile.spouse1.currentAge}
                onChange={e => update({ spouse1: { currentAge: parseInt(e.target.value) || 0 } })}
              />
            </div>
            <div>
              <Label>Target Retirement Age</Label>
              <input
                type="number"
                className="terminal-input w-full"
                value={profile.spouse1.retirementAge}
                onChange={e => update({ spouse1: { retirementAge: parseInt(e.target.value) || 0 } })}
              />
            </div>
          </div>
        </div>

        {/* Spouse 2 (conditional) */}
        {isMarried && (
          <div className="bg-surface-elevated rounded-lg p-4 border border-surface-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-terminal-dark-green flex items-center justify-center">
                <span className="text-terminal-cyan text-xs font-bold font-mono">S2</span>
              </div>
              <input
                type="text"
                className="terminal-input flex-1 max-w-xs"
                value={profile.spouse2.name}
                onChange={e => update({ spouse2: { name: e.target.value } })}
                placeholder="Spouse 2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Age</Label>
                <input
                  type="number"
                  className="terminal-input w-full"
                  value={profile.spouse2.currentAge}
                  onChange={e => update({ spouse2: { currentAge: parseInt(e.target.value) || 0 } })}
                />
              </div>
              <div>
                <Label>Target Retirement Age</Label>
                <input
                  type="number"
                  className="terminal-input w-full"
                  value={profile.spouse2.retirementAge}
                  onChange={e => update({ spouse2: { retirementAge: parseInt(e.target.value) || 0 } })}
                />
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Income & Employment */}
      <SectionCard title="Income &amp; Employment">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Annual Gross Income</Label>
            <MoneyInput
              value={profile.income}
              onValueChange={v => update({ income: v })}
            />
          </div>
          <div>
            <Label>Annual Savings</Label>
            <MoneyInput
              value={profile.annualSavings}
              onValueChange={v => update({ annualSavings: v })}
            />
          </div>
          <div>
            <Label>Annual Spending</Label>
            <MoneyInput
              value={profile.annualSpending}
              onValueChange={v => update({ annualSpending: v })}
            />
          </div>
          <div>
            <Label>Savings Growth Rate (%/yr)</Label>
            <input
              type="number"
              step="0.1"
              className="terminal-input w-full"
              value={profile.savingsGrowthRate}
              onChange={e => update({ savingsGrowthRate: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-txt-muted mt-1">Annual increase above inflation</p>
          </div>
          <div>
            <Label>Employer Match (% of salary)</Label>
            <div className="relative">
              <input
                type="number"
                className="terminal-input w-full pr-7"
                value={profile.matchPctOfSalary}
                onChange={e => update({ matchPctOfSalary: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted">%</span>
            </div>
          </div>
          <div>
            <Label>Match Rate</Label>
            <div className="relative">
              <input
                type="number"
                className="terminal-input w-full pr-7"
                value={profile.matchRate}
                onChange={e => update({ matchRate: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted">%</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-txt-secondary text-xs font-mono uppercase tracking-wide cursor-pointer">
            <input
              type="checkbox"
              checked={profile.hsaEligible}
              onChange={e => update({ hsaEligible: e.target.checked })}
              className="accent-green-500 w-4 h-4"
            />
            HSA Eligible (HDHP enrolled)
          </label>
        </div>
      </SectionCard>

      {/* Account Balances */}
      <SectionCard title="Account Balances">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {[
            { key: 'trad401k', label: 'Traditional 401(k)' },
            { key: 'roth401k', label: 'Roth 401(k)' },
            { key: 'tradIRA', label: 'Traditional IRA' },
            { key: 'rothIRA', label: 'Roth IRA' },
            { key: 'hsa', label: 'HSA' },
            { key: 'taxable', label: 'Taxable Brokerage' },
          ].map(({ key, label }) => (
            <div key={key}>
              <Label>{label}</Label>
              <MoneyInput
                value={profile.accounts[key] || ''}
                onValueChange={v => updateAccounts({ [key]: v })}
              />
            </div>
          ))}
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-txt-secondary text-xs font-mono uppercase">Total Net Worth</span>
            <span className="text-terminal-green font-mono font-bold text-lg">
              {formatCurrency(totalNetWorth)}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Benefits & Income Streams */}
      <SectionCard title="Benefits &amp; Income Streams">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>SS Benefit at FRA — {profile.spouse1.name}</Label>
            <MoneyInput
              value={profile.ss1}
              onValueChange={v => update({ ss1: v })}
            />
            <p className="text-xs text-txt-muted mt-1">Monthly amount at full retirement age</p>
          </div>
          {isMarried && (
            <div>
              <Label>SS Benefit at FRA — {profile.spouse2.name}</Label>
              <MoneyInput
                value={profile.ss2}
                onValueChange={v => update({ ss2: v })}
              />
              <p className="text-xs text-txt-muted mt-1">Monthly amount at full retirement age</p>
            </div>
          )}
          <div>
            <Label>Pension — {profile.spouse1.name} (Annual)</Label>
            <MoneyInput
              value={profile.pension1?.annualAmount || 0}
              onValueChange={v => update({ pension1: { annualAmount: v } })}
            />
          </div>
          {isMarried && (
            <div>
              <Label>Pension — {profile.spouse2.name} (Annual)</Label>
              <MoneyInput
                value={profile.pension2?.annualAmount || 0}
                onValueChange={v => update({ pension2: { annualAmount: v } })}
              />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionNextStep currentPath="profile" />
    </div>
  );
}
