import React, { useMemo, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from 'recharts';
import { CONTRIBUTION_LIMITS, FEDERAL_TAX_BRACKETS, STANDARD_DEDUCTION } from '../utils/constants/taxConstants';
import { formatCurrency } from '../utils/formatters';
import MoneyInput from '../components/MoneyInput';
import { useFinancialPlan } from '../context/FinancialPlanContext';

const COLORS = { green: '#00ff41', cyan: '#00d4ff', amber: '#ffb000', red: '#ff073a' };
const ACCOUNT_COLORS = {
  trad401k: '#00ff41',
  roth401k: '#00d4ff',
  tradIRA: '#ffb000',
  rothIRA: '#ff073a',
  hsa: '#a855f7',
  taxable: '#6366f1',
};

const CHART_THEME = {
  tick: { fill: '#8b949e', fontSize: 11 },
  grid: 'rgba(0,255,65,0.1)',
  tooltip: { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#e6edf3' },
};

const FILING_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
  { value: 'married_filing_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];

function getMarginalRate(income, filingStatus) {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS.single;
  const dedEntry = STANDARD_DEDUCTION[filingStatus] || STANDARD_DEDUCTION.single;
  const deduction = typeof dedEntry === 'object' ? (dedEntry.amount || 0) : (dedEntry || 0);
  const taxable = Math.max(0, income - deduction);
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxable > brackets[i].min) return brackets[i].rate;
  }
  return brackets[0].rate;
}

function ProgressBar({ used, limit, color = COLORS.green }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div className="w-full bg-surface-primary rounded h-3 overflow-hidden border border-surface-border">
      <div
        className="h-full rounded transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function Accumulate({ embedded = false }) {
  const { state: planState, dispatch } = useFinancialPlan();
  const profile = planState.profile;

  const balances = profile.accounts;
  const income = profile.income;
  const annualSavings = profile.annualSavings;
  const filingStatus = profile.filingStatus;
  const matchPctOfSalary = profile.matchPctOfSalary;
  const matchRate = profile.matchRate;
  const currentAge = profile.spouse1.currentAge;
  const retirementAge = profile.spouse1.retirementAge;
  const hsaEligible = profile.hsaEligible;

  const updateProfile = useCallback((updates) => {
    dispatch({ type: 'SET_PROFILE', payload: updates });
  }, [dispatch]);

  const setBalance = (key, val) => {
    dispatch({ type: 'SET_PROFILE_ACCOUNTS', payload: { [key]: val } });
  };

  const isCatchUp = currentAge >= 50;
  const isSuperCatchUp = currentAge >= 60 && currentAge <= 63;

  const limits = useMemo(() => {
    const catchUp401k = isSuperCatchUp ? CONTRIBUTION_LIMITS.catchUp401kSuperAge60to63
      : isCatchUp ? CONTRIBUTION_LIMITS.catchUp401k : 0;
    const total401k = CONTRIBUTION_LIMITS.traditional401k + catchUp401k;
    const totalIRA = CONTRIBUTION_LIMITS.traditionalIRA + (isCatchUp ? CONTRIBUTION_LIMITS.catchUpIRA : 0);
    const hsaLimit = hsaEligible
      ? (filingStatus === 'married_filing_jointly' ? CONTRIBUTION_LIMITS.hsa.family : CONTRIBUTION_LIMITS.hsa.single) : 0;
    return { total401k, totalIRA, hsaLimit };
  }, [isCatchUp, isSuperCatchUp, filingStatus, hsaEligible]);

  const waterfall = useMemo(() => {
    const marginalRate = getMarginalRate(income, filingStatus);
    const matchCap = income * (matchPctOfSalary / 100);
    const employerMatchContrib = Math.min(matchCap, limits.total401k);
    const employerMatchAmount = matchCap * (matchRate / 100);
    let remaining = annualSavings || income;
    const steps = [];

    // Step 1: 401(k) up to employer match
    const step1Amount = Math.min(employerMatchContrib, remaining);
    steps.push({ label: '401(k) up to Employer Match', tag: 'Free money', amount: step1Amount,
      matchGain: employerMatchAmount, taxSavings: step1Amount * marginalRate,
      limit: employerMatchContrib, used: step1Amount, color: COLORS.green });
    remaining -= step1Amount;

    // Step 2: HSA (if eligible)
    if (hsaEligible && limits.hsaLimit > 0) {
      const step2Amount = Math.min(limits.hsaLimit, remaining);
      steps.push({ label: 'HSA', tag: 'Triple tax advantage', amount: step2Amount,
        taxSavings: step2Amount * marginalRate, limit: limits.hsaLimit, used: step2Amount, color: COLORS.cyan });
      remaining -= step2Amount;
    }

    // Fix #1: Roth IRA BEFORE 401(k) max (more flexibility, tax-free growth)
    const phaseout = CONTRIBUTION_LIMITS.rothIRAIncomePhaseout[filingStatus];
    let rothLimit = limits.totalIRA;
    if (income > phaseout.start && income < phaseout.end) {
      rothLimit = Math.round(rothLimit * (1 - (income - phaseout.start) / (phaseout.end - phaseout.start)));
    } else if (income >= phaseout.end) { rothLimit = 0; }
    const rothAmount = Math.min(rothLimit > 0 ? rothLimit : limits.totalIRA, remaining);
    steps.push({ label: rothLimit > 0 ? 'Roth IRA' : 'Backdoor Roth IRA',
      tag: rothLimit > 0 ? 'Tax-free growth' : 'Backdoor conversion needed', amount: rothAmount,
      taxSavings: 0, limit: rothLimit > 0 ? rothLimit : limits.totalIRA, used: rothAmount, color: COLORS.red });
    remaining -= rothAmount;

    // Step 4: 401(k) up to annual limit
    const step401kMaxLimit = limits.total401k - step1Amount;
    let step401kMaxAmount = 0;
    if (step401kMaxLimit > 0) {
      step401kMaxAmount = Math.min(step401kMaxLimit, remaining);
      steps.push({ label: '401(k) up to Annual Limit', tag: 'Tax-deferred growth', amount: step401kMaxAmount,
        taxSavings: step401kMaxAmount * marginalRate, limit: step401kMaxLimit, used: step401kMaxAmount, color: COLORS.amber });
      remaining -= step401kMaxAmount;
    }

    // Fix #5: Mega Backdoor Roth (if eligible)
    if (profile.megaBackdoorEligible) {
      const total415cLimit = 70000; // 2025 415(c) limit
      const employeeContrib = step1Amount + step401kMaxAmount;
      const megaLimit = Math.max(0, total415cLimit - employeeContrib - employerMatchAmount);
      const megaAmount = Math.min(megaLimit, remaining);
      if (megaAmount > 0) {
        steps.push({ label: 'Mega Backdoor Roth 401(k)', tag: 'After-tax to Roth conversion',
          amount: megaAmount, taxSavings: 0, limit: megaLimit, used: megaAmount, color: '#a855f7' });
        remaining -= megaAmount;
      }
    }

    steps.push({ label: 'Taxable Brokerage', tag: 'No contribution limits',
      amount: Math.max(remaining, 0), taxSavings: 0, limit: null, used: Math.max(remaining, 0), color: '#6366f1' });

    return { steps, marginalRate, employerMatchAmount };
  }, [income, annualSavings, filingStatus, matchPctOfSalary, matchRate, limits, hsaEligible, profile.megaBackdoorEligible]);

  // Section 3: Tax-advantaged space utilization
  const utilization = useMemo(() => {
    const totalSpace = limits.total401k + limits.totalIRA + limits.hsaLimit;
    const used401k = waterfall.steps
      .filter(s => s.label.includes('401(k)'))
      .reduce((sum, s) => sum + s.amount, 0);
    const usedIRA = waterfall.steps
      .filter(s => s.label.includes('Roth IRA') || s.label.includes('Backdoor'))
      .reduce((sum, s) => sum + s.amount, 0);
    const usedHSA = waterfall.steps
      .filter(s => s.label === 'HSA')
      .reduce((sum, s) => sum + s.amount, 0);
    const totalUsed = used401k + usedIRA + usedHSA;

    return {
      totalSpace,
      totalUsed,
      accounts: [
        { name: '401(k)', used: used401k, limit: limits.total401k, color: COLORS.green },
        { name: 'Roth IRA', used: usedIRA, limit: limits.totalIRA, color: COLORS.red },
        { name: 'HSA', used: usedHSA, limit: limits.hsaLimit, color: COLORS.cyan },
      ],
    };
  }, [limits, waterfall]);

  const utilizationChartData = useMemo(() =>
    utilization.accounts.map(a => ({
      name: a.name,
      Used: a.used,
      Unused: Math.max(0, a.limit - a.used),
    })), [utilization]);

  const mcExpectedReturn = planState.simulationResults?.medianCAGR;

  // Section 5: Projection
  const projectionData = useMemo(() => {
    const years = retirementAge - currentAge;
    if (years <= 0) return [];
    const annualReturn = mcExpectedReturn || 0.07;
    const data = [];
    let b = { ...balances };
    // Base annual contributions (year 0)
    const baseAnnual401k = waterfall.steps
      .filter(s => s.label.includes('401(k)') && !s.label.includes('Mega'))
      .reduce((sum, s) => sum + s.amount, 0);
    const baseMatchAmount = waterfall.steps[0]?.matchGain || 0;
    const baseAnnualIRA = waterfall.steps
      .filter(s => s.label.includes('Roth IRA') || s.label.includes('Backdoor'))
      .reduce((sum, s) => sum + s.amount, 0);
    const baseAnnualHSA = waterfall.steps
      .filter(s => s.label === 'HSA')
      .reduce((sum, s) => sum + s.amount, 0);
    const baseAnnualTaxable = waterfall.steps
      .find(s => s.label === 'Taxable Brokerage')?.amount || 0;
    const baseAnnualMegaBackdoor = waterfall.steps
      .find(s => s.label.includes('Mega'))?.amount || 0;

    // Fix #3: savings growth rate
    const savingsGrowthRate = (profile.savingsGrowthRate || 3) / 100;

    for (let y = 0; y <= years; y++) {
      const total = b.trad401k + b.roth401k + b.tradIRA + b.rothIRA + b.hsa + b.taxable;
      data.push({
        age: currentAge + y,
        'Traditional 401(k)': Math.round(b.trad401k),
        'Roth 401(k)': Math.round(b.roth401k),
        'Traditional IRA': Math.round(b.tradIRA),
        'Roth IRA': Math.round(b.rothIRA),
        HSA: Math.round(b.hsa),
        Taxable: Math.round(b.taxable),
        Total: Math.round(total),
      });
      // Fix #3: Apply savings growth factor to contributions
      const growthFactor = Math.pow(1 + savingsGrowthRate, y);
      const annual401k = baseAnnual401k * growthFactor;
      const matchAmount = baseMatchAmount * growthFactor;
      const annualIRA = baseAnnualIRA * growthFactor;
      const annualHSA = baseAnnualHSA * growthFactor;
      const annualTaxable = baseAnnualTaxable * growthFactor;
      const annualMegaBackdoor = baseAnnualMegaBackdoor * growthFactor;
      // Grow and contribute
      // Fix #2: Employer match 100% to Traditional; employee 401k split 50/50
      b = {
        trad401k: (b.trad401k + annual401k * 0.5 + matchAmount) * (1 + annualReturn),
        roth401k: (b.roth401k + annual401k * 0.5 + annualMegaBackdoor) * (1 + annualReturn),
        tradIRA: b.tradIRA * (1 + annualReturn),
        rothIRA: (b.rothIRA + annualIRA) * (1 + annualReturn),
        hsa: (b.hsa + annualHSA) * (1 + annualReturn),
        taxable: (b.taxable + annualTaxable) * (1 + annualReturn),
      };
    }
    return data;
  }, [balances, currentAge, retirementAge, waterfall, mcExpectedReturn, profile.savingsGrowthRate]);

  const totalTaxSavings = waterfall.steps.reduce((s, st) => s + (st.taxSavings || 0), 0);

  // Fix #6: Coast FIRE indicator
  const coastFIRE = useMemo(() => {
    const annualSpending = profile.annualSpending || 80000;
    const targetAtRetirement = annualSpending * 25;
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const realReturn = mcExpectedReturn || 0.05;
    const coastNumber = targetAtRetirement / Math.pow(1 + realReturn, yearsToRetirement);
    const currentPortfolio = Object.values(balances).reduce((sum, v) => sum + v, 0);
    return {
      coastNumber,
      currentPortfolio,
      targetAtRetirement,
      passed: currentPortfolio >= coastNumber,
    };
  }, [profile.annualSpending, retirementAge, currentAge, mcExpectedReturn, balances]);

  const content = (
    <>
        {/* Section 1: Account Balances & Profile */}
        <div className="terminal-card p-6 mb-6">
          <h2 className="text-lg font-display font-bold text-terminal-amber uppercase tracking-wider mb-4">
            Account Balances &amp; Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { key: 'trad401k', label: 'Traditional 401(k)' },
              { key: 'roth401k', label: 'Roth 401(k)' },
              { key: 'tradIRA', label: 'Traditional IRA' },
              { key: 'rothIRA', label: 'Roth IRA' },
              { key: 'hsa', label: 'HSA' },
              { key: 'taxable', label: 'Taxable Brokerage' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                  {label}
                </label>
                <MoneyInput
                  value={balances[key] || ''}
                  onValueChange={v => setBalance(key, v)}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                Annual Gross Income
              </label>
              <MoneyInput
                value={income || ''}
                onValueChange={v => updateProfile({ income: v })}
              />
            </div>
            <div>
              <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                Annual Savings Target
              </label>
              <MoneyInput
                value={annualSavings || ''}
                onValueChange={v => updateProfile({ annualSavings: v })}
              />
            </div>
            <div>
              <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                Filing Status
              </label>
              <select
                className="terminal-input w-full"
                value={filingStatus}
                onChange={e => updateProfile({ filingStatus: e.target.value })}
              >
                {FILING_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                Current Age
              </label>
              <input
                type="number"
                className="terminal-input w-full"
                value={currentAge}
                onChange={e => updateProfile({ spouse1: { currentAge: parseInt(e.target.value) || 0 } })}
              />
            </div>
            <div>
              <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                Target Retirement Age
              </label>
              <input
                type="number"
                className="terminal-input w-full"
                value={retirementAge}
                onChange={e => updateProfile({ spouse1: { retirementAge: parseInt(e.target.value) || 0 } })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                Employer Matches (% of salary cap)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="terminal-input w-full pr-7"
                  value={matchPctOfSalary}
                  onChange={e => updateProfile({ matchPctOfSalary: parseFloat(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted">%</span>
              </div>
            </div>
            <div>
              <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">
                Match Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="terminal-input w-full pr-7"
                  value={matchRate}
                  onChange={e => updateProfile({ matchRate: parseFloat(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted">%</span>
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-txt-secondary text-xs font-mono uppercase tracking-wide cursor-pointer">
                <input
                  type="checkbox"
                  checked={hsaEligible}
                  onChange={e => updateProfile({ hsaEligible: e.target.checked })}
                  className="accent-green-500 w-4 h-4"
                />
                HSA Eligible (HDHP enrolled)
              </label>
            </div>
          </div>
          <p className="text-txt-muted text-xs font-mono mt-3">
            Employer matches {matchRate}% of your contributions up to {matchPctOfSalary}% of salary
            = {formatCurrency(income * (matchPctOfSalary / 100) * (matchRate / 100))}/yr free money
          </p>
        </div>

        {/* Section 2: Contribution Optimizer */}
        <div className="terminal-card p-6 mb-6">
          <h2 className="text-lg font-display font-bold text-terminal-amber uppercase tracking-wider mb-2">
            Contribution Optimizer
          </h2>
          <p className="text-txt-muted text-xs font-mono mb-4">
            Optimal allocation of {formatCurrency(annualSavings || income)}/yr savings &mdash; marginal rate: {(waterfall.marginalRate * 100).toFixed(0)}%
            &nbsp;|&nbsp; Annual tax savings: <span className="text-terminal-green">{formatCurrency(totalTaxSavings)}</span>
          </p>

          <div className="space-y-4">
            {waterfall.steps.map((step, i) => (
              <div key={i} className="bg-surface-primary border border-surface-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono"
                      style={{ backgroundColor: step.color, color: '#0d1117' }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-txt-primary font-mono font-semibold text-sm">
                        {step.label}
                      </span>
                      <span className="ml-2 text-txt-muted text-xs font-mono italic">
                        {step.tag}
                      </span>
                    </div>
                  </div>
                  <span className="text-terminal-green font-mono font-bold text-sm">
                    {formatCurrency(step.amount)}/yr
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-txt-secondary mb-2">
                  {step.taxSavings > 0 && (
                    <span>Tax savings: <span className="text-terminal-green">{formatCurrency(step.taxSavings)}</span></span>
                  )}
                  {step.matchGain > 0 && (
                    <span>Employer match: <span className="text-terminal-cyan">{formatCurrency(step.matchGain)}</span></span>
                  )}
                  {step.limit != null && (
                    <span>Limit: {formatCurrency(step.limit)}</span>
                  )}
                </div>

                {step.limit != null && (
                  <ProgressBar used={step.used} limit={step.limit} color={step.color} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Tax-Advantaged Space Utilization */}
        <div className="terminal-card p-6 mb-6">
          <h2 className="text-lg font-display font-bold text-terminal-amber uppercase tracking-wider mb-4">
            Tax-Advantaged Space Utilization
          </h2>
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-txt-muted text-xs font-mono uppercase">Total Space</p>
              <p className="text-terminal-cyan font-mono font-bold text-xl">{formatCurrency(utilization.totalSpace)}</p>
            </div>
            <div>
              <p className="text-txt-muted text-xs font-mono uppercase">Utilized</p>
              <p className="text-terminal-green font-mono font-bold text-xl">{formatCurrency(utilization.totalUsed)}</p>
            </div>
            <div>
              <p className="text-txt-muted text-xs font-mono uppercase">Utilization Rate</p>
              <p className="text-terminal-amber font-mono font-bold text-xl">
                {utilization.totalSpace > 0
                  ? `${((utilization.totalUsed / utilization.totalSpace) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationChartData} layout="vertical" barSize={24}>
                <CartesianGrid stroke={CHART_THEME.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={CHART_THEME.tick}
                  tickFormatter={v => formatCurrency(v, { compact: true })}
                  axisLine={{ stroke: '#30363d' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={CHART_THEME.tick}
                  width={80}
                  axisLine={{ stroke: '#30363d' }}
                />
                <Tooltip
                  contentStyle={CHART_THEME.tooltip}
                  formatter={v => formatCurrency(v)}
                  labelStyle={{ color: '#e6edf3' }}
                />
                <Bar dataKey="Used" stackId="a" radius={[0, 0, 0, 0]}>
                  {utilizationChartData.map((entry, idx) => (
                    <Cell key={idx} fill={utilization.accounts[idx]?.color || COLORS.green} />
                  ))}
                </Bar>
                <Bar dataKey="Unused" stackId="a" fill="#21262d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 4: Asset Location Optimizer */}
        <div className="terminal-card p-6 mb-6">
          <h2 className="text-lg font-display font-bold text-terminal-amber uppercase tracking-wider mb-4">
            Asset Location Optimizer
          </h2>
          <p className="text-txt-muted text-xs font-mono mb-4">Place assets in the right account type to minimize lifetime taxes</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Roth Accounts', color: COLORS.green, textClass: 'text-terminal-green',
                desc: 'Tax-free growth — put highest-growth assets here',
                items: ['Individual stocks', 'Small-cap growth funds', 'Aggressive equity ETFs', 'Crypto (if held)'] },
              { title: 'Traditional / Tax-Deferred', color: COLORS.amber, textClass: 'text-terminal-amber',
                desc: 'Defer taxes — put tax-inefficient assets here',
                items: ['Bonds & bond funds', 'REITs', 'High-dividend stocks', 'Actively managed funds'] },
              { title: 'Taxable Brokerage', color: COLORS.cyan, textClass: 'text-terminal-cyan',
                desc: 'Tax-efficient — take advantage of low cap gains rates',
                items: ['Total market index funds', 'Tax-managed funds', 'Municipal bonds', 'Buy-and-hold ETFs'] },
            ].map(({ title, color, textClass, desc, items }) => (
              <div key={title} className="bg-surface-primary border border-surface-border rounded-lg p-4">
                <h3 className={`${textClass} font-mono font-bold text-sm uppercase mb-3 flex items-center gap-2`}>
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
                  {title}
                </h3>
                <p className="text-txt-muted text-xs font-mono mb-2">{desc}</p>
                <ul className="space-y-1">
                  {items.map(a => (
                    <li key={a} className="text-txt-primary text-xs font-mono flex items-center gap-2">
                      <span className={textClass}>&#9654;</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Projection */}
        <div className="terminal-card p-6 mb-6">
          <h2 className="text-lg font-display font-bold text-terminal-amber uppercase tracking-wider mb-2">
            Wealth Projection
          </h2>
          <p className="text-txt-muted text-xs font-mono mb-4">
            Projected growth assuming {mcExpectedReturn ? `${(mcExpectedReturn * 100).toFixed(1)}% MC median` : '7%'} annual return
            {projectionData.length > 0 && (
              <> &mdash; Projected at retirement:{' '}
                <span className="text-terminal-green font-bold">
                  {formatCurrency(projectionData[projectionData.length - 1]?.Total || 0, { compact: true })}
                </span>
              </>
            )}
          </p>
          {projectionData.length > 0 ? (
            <div style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData} margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
                  <CartesianGrid stroke={CHART_THEME.grid} />
                  <XAxis
                    dataKey="age"
                    tick={CHART_THEME.tick}
                    axisLine={{ stroke: '#30363d' }}
                    label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fill: '#8b949e', fontSize: 11 }}
                  />
                  <YAxis
                    tick={CHART_THEME.tick}
                    tickFormatter={v => formatCurrency(v, { compact: true })}
                    axisLine={{ stroke: '#30363d' }}
                  />
                  <Tooltip
                    contentStyle={CHART_THEME.tooltip}
                    formatter={v => formatCurrency(v)}
                    labelFormatter={l => `Age ${l}`}
                    labelStyle={{ color: '#e6edf3' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    iconType="square"
                  />
                  <Area type="monotone" dataKey="Traditional 401(k)" stackId="1" stroke={ACCOUNT_COLORS.trad401k} fill={ACCOUNT_COLORS.trad401k} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Roth 401(k)" stackId="1" stroke={ACCOUNT_COLORS.roth401k} fill={ACCOUNT_COLORS.roth401k} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Traditional IRA" stackId="1" stroke={ACCOUNT_COLORS.tradIRA} fill={ACCOUNT_COLORS.tradIRA} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Roth IRA" stackId="1" stroke={ACCOUNT_COLORS.rothIRA} fill={ACCOUNT_COLORS.rothIRA} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="HSA" stackId="1" stroke={ACCOUNT_COLORS.hsa} fill={ACCOUNT_COLORS.hsa} fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Taxable" stackId="1" stroke={ACCOUNT_COLORS.taxable} fill={ACCOUNT_COLORS.taxable} fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-txt-muted text-sm font-mono text-center py-12">
              Set current age below retirement age to see projections
            </p>
          )}
        </div>

        {/* Section 6: Coast FIRE Indicator */}
        <div className="terminal-card p-6 mb-6">
          <h2 className="text-lg font-display font-bold text-terminal-amber uppercase tracking-wider mb-4">
            Coast FIRE Indicator
          </h2>
          <p className="text-txt-muted text-xs font-mono mb-4">
            The portfolio needed today so it grows to your target with zero additional savings
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-primary border border-surface-border rounded-lg p-4">
              <p className="text-txt-muted text-xs font-mono uppercase mb-1">Coast FIRE Number</p>
              <p className="text-terminal-cyan font-mono font-bold text-xl">{formatCurrency(coastFIRE.coastNumber, { compact: true })}</p>
              <p className="text-txt-muted text-xs font-mono mt-1">Target: {formatCurrency(coastFIRE.targetAtRetirement, { compact: true })} (25x spending)</p>
            </div>
            <div className="bg-surface-primary border border-surface-border rounded-lg p-4">
              <p className="text-txt-muted text-xs font-mono uppercase mb-1">Current Portfolio</p>
              <p className="text-terminal-green font-mono font-bold text-xl">{formatCurrency(coastFIRE.currentPortfolio, { compact: true })}</p>
              <p className="text-txt-muted text-xs font-mono mt-1">
                {coastFIRE.coastNumber > 0
                  ? `${((coastFIRE.currentPortfolio / coastFIRE.coastNumber) * 100).toFixed(1)}% of Coast FIRE`
                  : 'N/A'}
              </p>
            </div>
            <div className={`border rounded-lg p-4 ${coastFIRE.passed ? 'bg-terminal-dark-green border-terminal-green' : 'bg-surface-primary border-surface-border'}`}>
              <p className="text-txt-muted text-xs font-mono uppercase mb-1">Status</p>
              <p className={`font-mono font-bold text-xl ${coastFIRE.passed ? 'text-terminal-green' : 'text-terminal-amber'}`}>
                {coastFIRE.passed ? 'COAST FIRE REACHED' : 'NOT YET'}
              </p>
              <p className="text-txt-muted text-xs font-mono mt-1">
                {coastFIRE.passed
                  ? 'You could stop saving and still hit your target'
                  : `Need ${formatCurrency(Math.max(0, coastFIRE.coastNumber - coastFIRE.currentPortfolio), { compact: true })} more`}
              </p>
            </div>
          </div>
        </div>
    </>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-terminal-bg">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-terminal-green crt-glow uppercase tracking-wider">
            Wealth Accumulation Planner
          </h1>
          <p className="text-txt-secondary font-mono text-sm mt-2">
            Optimize contributions across tax-advantaged accounts
          </p>
        </div>
        {content}
      </div>
    </div>
  );
}
