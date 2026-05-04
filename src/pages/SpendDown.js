import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatNumberInput } from '../utils/formatters';
import {
  fixedDollarWithdrawal, percentOfPortfolio, guytonKlinger, bucketStrategy,
  variablePercentageWithdrawal, rmdBasedWithdrawal, vanguardDynamicSpending,
  WITHDRAWAL_STRATEGY_LABELS, calculateSafeWithdrawalRate,
} from '../utils/calculations/withdrawalStrategies';
import { calculateFederalIncomeTax, calculateMarginalRateOnNextDollar, calculateSocialSecurityTax } from '../utils/calculations/taxEngine';
import { optimizeAnnualConversion, analyzeRothLadder } from '../utils/calculations/rothConversion';
import { analyzeClaimingAges, calculateBreakEven, getFullRetirementAge } from '../utils/calculations/socialSecurity';
import { MEDICARE_IRMAA, STANDARD_DEDUCTION, RMD_TABLE } from '../utils/constants/taxConstants';
import { useFinancialPlan } from '../context/FinancialPlanContext';
import { RISK_PROFILES, generateCorrelatedSequences } from '../utils/monteCarloSimulation';
import InfoButton from '../components/common/InfoButton';

const CHART_GREEN = '#00ff41';
const CHART_CYAN = '#00d4ff';
const CHART_AMBER = '#ffb000';
const CHART_RED = '#ff073a';
const CHART_PURPLE = '#9945ff';
const CHART_CORAL = '#ff6b6b';
const CHART_TEAL = '#20c997';
const GRID_STROKE = 'rgba(0,255,65,0.1)';
const TICK_STYLE = { fill: '#8b949e', fontSize: 11 };
const TOOLTIP_STYLE = { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#e6edf3' };

const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
  { value: 'married_filing_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];

const RISK_PROFILE_OPTIONS = [
  { value: 'conservative', label: 'Conservative (30/70)' },
  { value: 'balanced', label: 'Balanced (60/40)' },
  { value: 'growth', label: 'Growth (80/20)' },
  { value: 'aggressive', label: 'Aggressive (100/0)' },
];


let _analysisCache = null;

function parseNum(v) {
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function computeSurvivalAnalysis({ retSequences, projectedPortfolio, spending, retYears, ages, mcMeanReturn, incomeByYear }) {
  if (retSequences.length < 50) return null;
  const numPaths = retSequences.length;
  const pv = projectedPortfolio;
  const yr = retYears;

  function runAllPaths(strategyRunner) {
    let survived = 0;
    const allMinWd = [];
    const allTotalWd = [];
    for (const seq of retSequences) {
      const results = strategyRunner(seq);
      const endBalance = results[results.length - 1]?.portfolioEnd ?? 0;
      const withdrawals = results.map(r => r.withdrawal);
      const minWd = Math.min(...withdrawals);
      const totalWd = withdrawals.reduce((s, w) => s + w, 0);
      if (endBalance > 0) survived++;
      allMinWd.push(endBalance > 0 ? minWd : 0);
      allTotalWd.push(totalWd);
    }
    allMinWd.sort((a, b) => a - b);
    allTotalWd.sort((a, b) => a - b);
    return {
      successRate: survived / numPaths,
      p10MinWithdrawal: allMinWd[Math.floor(numPaths * 0.10)],
      medianTotalSpending: allTotalWd[Math.floor(numPaths * 0.50)],
    };
  }

  function findMaxSafe(strategyFactory, lo, hi, successTest) {
    const test = successTest || ((results) => (results[results.length - 1]?.portfolioEnd ?? 0) > 0);
    for (let i = 0; i < 15; i++) {
      const mid = (lo + hi) / 2;
      const runner = strategyFactory(mid);
      let survived = 0;
      for (const seq of retSequences) {
        if (test(runner(seq))) survived++;
      }
      if (survived / numPaths >= 0.95) lo = mid; else hi = mid;
    }
    return lo;
  }

  const iby = incomeByYear;
  const strategies = [
    {
      label: WITHDRAWAL_STRATEGY_LABELS.fixed,
      run: (seq) => fixedDollarWithdrawal({ portfolioValue: pv, annualWithdrawal: spending, inflationRate: 0, years: yr, returnSequence: seq, incomeByYear: iby }),
      factory: (amt) => (seq) => fixedDollarWithdrawal({ portfolioValue: pv, annualWithdrawal: amt, inflationRate: 0, years: yr, returnSequence: seq, incomeByYear: iby }),
      searchRange: [0, pv * 0.10],
      toAnnual: (v) => v,
    },
    {
      label: WITHDRAWAL_STRATEGY_LABELS.guyton_klinger,
      run: (seq) => guytonKlinger({ portfolioValue: pv, initialWithdrawal: spending, inflationRate: 0, years: yr, returnSequence: seq, incomeByYear: iby }),
      factory: (amt) => (seq) => guytonKlinger({ portfolioValue: pv, initialWithdrawal: amt, inflationRate: 0, years: yr, returnSequence: seq, incomeByYear: iby }),
      searchRange: [0, pv * 0.10],
      toAnnual: (v) => v,
    },
    {
      label: WITHDRAWAL_STRATEGY_LABELS.bucket,
      run: (seq) => bucketStrategy({ portfolioValue: pv, annualWithdrawal: spending, inflationRate: 0, years: yr, returnSequence: seq, incomeByYear: iby }).withdrawalSchedule,
      factory: (amt) => (seq) => bucketStrategy({ portfolioValue: pv, annualWithdrawal: amt, inflationRate: 0, years: yr, returnSequence: seq, incomeByYear: iby }).withdrawalSchedule,
      searchRange: [0, pv * 0.10],
      toAnnual: (v) => v,
    },
    {
      label: WITHDRAWAL_STRATEGY_LABELS.percent,
      run: (seq) => percentOfPortfolio({ portfolioValue: pv, withdrawalRate: spending / pv, years: yr, returnSequence: seq, incomeByYear: iby }),
      factory: (rate) => (seq) => percentOfPortfolio({ portfolioValue: pv, withdrawalRate: rate, years: yr, returnSequence: seq, incomeByYear: iby }),
      searchRange: [0, 0.12],
      toAnnual: (rate) => pv * rate,
      isRate: true,
      spendingFloorTest: true,
    },
    {
      label: WITHDRAWAL_STRATEGY_LABELS.vanguard_dynamic,
      run: (seq) => vanguardDynamicSpending({ portfolioValue: pv, withdrawalRate: spending / pv, ceilingPct: 0.05, floorPct: 0.025, inflationRate: 0, years: yr, returnSequence: seq, incomeByYear: iby }),
      factory: (rate) => (seq) => vanguardDynamicSpending({ portfolioValue: pv, withdrawalRate: rate, ceilingPct: 0.05, floorPct: 0.025, inflationRate: 0, years: yr, returnSequence: seq, incomeByYear: iby }),
      searchRange: [0, 0.12],
      toAnnual: (rate) => pv * rate,
      isRate: true,
    },
    {
      label: WITHDRAWAL_STRATEGY_LABELS.vpw,
      run: (seq) => variablePercentageWithdrawal({ portfolioValue: pv, currentAge: ages.retirement, lifeExpectancy: ages.life, realReturn: mcMeanReturn, returnSequence: seq, incomeByYear: iby }),
      factory: null,
      neverDepletes: true,
    },
    {
      label: WITHDRAWAL_STRATEGY_LABELS.rmd_based,
      run: (seq) => rmdBasedWithdrawal({ portfolioValue: pv, startAge: ages.retirement, endAge: ages.life, returnSequence: seq, incomeByYear: iby }),
      factory: null,
      neverDepletes: true,
    },
  ];

  const results = strategies.map(s => {
    const atCurrent = runAllPaths(s.run);
    let maxSafeAnnual = null;
    let maxSafeRate = null;
    if (s.factory) {
      let successTest = null;
      if (s.spendingFloorTest) {
        successTest = (res) => {
          const initialWd = res[0]?.withdrawal ?? 0;
          if (initialWd <= 0) return true;
          return res.every(r => r.withdrawal >= initialWd * 0.5);
        };
      }
      const maxParam = findMaxSafe(s.factory, s.searchRange[0], s.searchRange[1], successTest);
      maxSafeAnnual = s.toAnnual(maxParam);
      maxSafeRate = maxSafeAnnual / pv;
    }
    return {
      label: s.label,
      successRate: atCurrent.successRate,
      p10MinWithdrawal: atCurrent.p10MinWithdrawal,
      medianTotalSpending: atCurrent.medianTotalSpending,
      maxSafeAnnual,
      maxSafeRate,
      neverDepletes: s.neverDepletes || false,
    };
  });

  const swrCurve = calculateSafeWithdrawalRate({
    portfolioValue: pv,
    years: yr,
    successRate: 0.95,
    returnSequences: retSequences,
    incomeByYear: iby,
  });

  return { strategies: results, swrCurve, numSims: numPaths };
}

function SectionHeading({ children }) {
  return (
    <h2 className="font-display font-bold text-terminal-green crt-glow uppercase tracking-wider text-lg mb-4 mt-10 border-b border-terminal-dark-green pb-2">
      {children}
    </h2>
  );
}

function InputField({ label, value, onChange, prefix, className = '' }) {
  const isMoney = prefix === '$';
  const displayVal = isMoney && value ? formatNumberInput(value) : value;

  const handleChange = (raw) => {
    if (isMoney) {
      const clean = raw.replace(/[^\d]/g, '');
      onChange(clean || '0');
    } else {
      onChange(raw);
    }
  };

  return (
    <div className={className}>
      <label className="block text-txt-secondary text-xs uppercase tracking-wider mb-1 font-mono">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-txt-muted text-sm">{prefix}</span>}
        <input
          type="text"
          inputMode={isMoney ? 'numeric' : undefined}
          value={displayVal}
          onChange={e => handleChange(e.target.value)}
          className={`terminal-input w-full ${prefix ? 'pl-6' : ''}`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-txt-secondary text-xs uppercase tracking-wider mb-1 font-mono">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="terminal-input w-full">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-surface-border">
            {columns.map((col, i) => (
              <th key={i} className="text-left text-terminal-amber uppercase text-xs tracking-wider py-2 px-3">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-surface-border/30 hover:bg-surface-elevated/40">
              {columns.map((col, ci) => (
                <td key={ci} className={`py-1.5 px-3 ${col.className || 'text-txt-primary'}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE} className="rounded p-2 text-xs font-mono">
      <p className="text-txt-secondary mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function SpendDown() {
  const { state: planState, dispatch } = useFinancialPlan();
  const profile = planState.profile;
  const [cachedResults, setCachedResults] = useState(() => _analysisCache ?? planState.spendDownAnalysis);
  const [computing, setComputing] = useState(false);
  const analysisRun = cachedResults != null;

  const updateProfile = useCallback((updates) => {
    dispatch({ type: 'SET_PROFILE', payload: updates });
  }, [dispatch]);

  const updateAccount = useCallback((key, val) => {
    dispatch({ type: 'SET_PROFILE_ACCOUNTS', payload: { [key]: parseNum(val) } });
  }, [dispatch]);

  const ages = useMemo(() => ({
    current: profile.spouse1.currentAge,
    retirement: profile.spouse1.retirementAge,
    spouse2Current: profile.spouse2?.currentAge || profile.spouse1.currentAge,
    life: profile.lifeExpectancy,
  }), [profile.spouse1.currentAge, profile.spouse1.retirementAge, profile.spouse2?.currentAge, profile.lifeExpectancy]);

  const totalPension = (profile.pension1?.annualAmount || 0) + (profile.pension2?.annualAmount || 0);

  const accounts = profile.accounts;

  const totalPortfolio = useMemo(() => Object.values(accounts).reduce((s, v) => s + v, 0), [accounts]);
  const traditionalTotal = useMemo(() => accounts.trad401k + accounts.tradIRA, [accounts]);
  const spending = profile.annualSpending;
  const retYears = useMemo(() => Math.max(1, ages.life - ages.retirement), [ages]);
  const fullYears = useMemo(() => Math.max(1, ages.life - ages.current), [ages]);
  const retirementOffset = useMemo(() => Math.max(0, ages.retirement - ages.current), [ages]);

  const riskProfile = planState.simulationConfig?.riskProfile || 'balanced';
  const riskParams = RISK_PROFILES[riskProfile] || RISK_PROFILES.balanced;
  const mcMeanReturn = planState.simulationResults?.medianCAGR || (riskParams.meanReturn / 100);


  const projectedPortfolio = useMemo(() => {
    const yearsToRetire = Math.max(0, ages.retirement - ages.current);
    if (yearsToRetire === 0) return totalPortfolio;
    let balance = totalPortfolio;
    for (let y = 0; y < yearsToRetire; y++) {
      balance = (balance + profile.annualSavings) * (1 + mcMeanReturn);
    }
    return Math.round(balance);
  }, [totalPortfolio, ages, profile.annualSavings, mcMeanReturn]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const birthYear = useMemo(() => new Date().getFullYear() - ages.current, [ages.current]);
  const ssClaimingAge = useMemo(() => getFullRetirementAge(birthYear), [birthYear]);

  const getIncomeForAge = useCallback((age) => {
    if (age < ages.retirement) return profile.income;
    if (age < ssClaimingAge) return totalPension;
    // Using FRA benefit amount directly; claiming-age adjustments are handled
    // in the Social Security Optimizer section, not the income model
    return totalPension + profile.ss1 * 12 + profile.ss2 * 12;
  }, [ages.retirement, ssClaimingAge, profile.income, totalPension, profile.ss1, profile.ss2]);

  const withdrawalPhases = useMemo(() => {
    const phases = [];
    const ssAge = Math.ceil(ssClaimingAge);
    const rmdAge = (birthYear >= 1960) ? 75 : 73;

    if (ages.retirement < 60) {
      phases.push({
        label: 'Early Retirement (Pre-59½)',
        ageRange: `Age ${ages.retirement} – 59`,
        active: ages.current >= ages.retirement && ages.current < 60,
        steps: [
          'Draw from taxable brokerage accounts (no penalty)',
          'Use Roth IRA contributions (not earnings) penalty-free',
          'Aggressively convert Traditional → Roth while income is low',
          'Avoid Traditional/401(k) withdrawals (10% early withdrawal penalty)',
        ],
      });
    }

    if (ages.retirement <= 66) {
      phases.push({
        label: 'Pre–Social Security',
        ageRange: `Age ${Math.max(ages.retirement, 60)} – ${ssAge - 1}`,
        active: ages.current >= 60 && ages.current < ssAge,
        steps: [
          'Begin Traditional IRA/401(k) withdrawals (penalty-free after 59½)',
          'Continue Roth conversions to fill low tax brackets',
          'Minimize taxable income to reduce future RMDs',
          'Consider delaying Social Security for higher benefit',
        ],
      });
    }

    phases.push({
      label: 'Social Security + Withdrawal Phase',
      ageRange: `Age ${ssAge} – ${rmdAge - 1}`,
      active: ages.current >= ssAge && ages.current < rmdAge,
      steps: [
        'Begin Social Security benefits (up to 85% may be taxable)',
        'Coordinate withdrawals to manage SS taxation thresholds',
        'Continue strategic Roth conversions if bracket space allows',
        'Draw from taxable accounts to let tax-advantaged accounts grow',
      ],
    });

    phases.push({
      label: 'RMD Phase',
      ageRange: `Age ${rmdAge}+`,
      active: ages.current >= rmdAge,
      steps: [
        'Take Required Minimum Distributions from Traditional accounts',
        'RMDs are taxable ordinary income — plan bracket impact',
        'Use Roth for additional spending (tax-free, no RMDs)',
        'Consider QCDs (Qualified Charitable Distributions) to offset RMD tax',
      ],
    });

    return phases;
  }, [ages, ssClaimingAge, birthYear]);

  const inflationRate = planState.simulationConfig?.inflationRate;
  const inflationMean = inflationRate != null ? inflationRate / 100 : undefined;

  const mcSequencesFull = cachedResults?.mcSequencesFull ?? null;

  const inputsChanged = analysisRun && (
    cachedResults?.inputs?.riskProfile !== riskProfile ||
    cachedResults?.inputs?.spending !== spending ||
    cachedResults?.inputs?.totalPortfolio !== totalPortfolio ||
    cachedResults?.inputs?.retYears !== retYears ||
    cachedResults?.inputs?.fullYears !== fullYears
  );

  const incomeByYear = useMemo(() => {
    const schedule = [];
    for (let y = 0; y < retYears; y++) {
      const age = ages.retirement + y;
      let income = 0;
      if (age >= (profile.pension1?.startAge || 999)) income += (profile.pension1?.annualAmount || 0);
      if (age >= (profile.pension2?.startAge || 999)) income += (profile.pension2?.annualAmount || 0);
      if (age >= Math.ceil(ssClaimingAge)) income += (profile.ss1 || 0) * 12;
      if (age >= Math.ceil(ssClaimingAge)) income += (profile.ss2 || 0) * 12;
      schedule.push(income);
    }
    return schedule;
  }, [retYears, ages.retirement, profile.pension1, profile.pension2, profile.ss1, profile.ss2, ssClaimingAge]);

  const avgRetirementIncome = useMemo(() => {
    if (incomeByYear.length === 0) return 0;
    return incomeByYear.reduce((s, v) => s + v, 0) / incomeByYear.length;
  }, [incomeByYear]);

  const handleRunAnalysis = useCallback(() => {
    setComputing(true);
    setTimeout(() => {
      const mcSeqs = generateCorrelatedSequences({
        years: fullYears,
        riskProfile,
        inflationMean,
        numSims: 1000,
      });
      const pv = (() => {
        const yearsToRetire = Math.max(0, ages.retirement - ages.current);
        if (yearsToRetire === 0) return totalPortfolio;
        let bal = totalPortfolio;
        for (let y = 0; y < yearsToRetire; y++) bal = (bal + profile.annualSavings) * (1 + mcMeanReturn);
        return Math.round(bal);
      })();
      const retSeqs = mcSeqs.allPaths.map(p => p.slice(retirementOffset));
      const survival = computeSurvivalAnalysis({
        retSequences: retSeqs,
        projectedPortfolio: pv,
        spending,
        retYears,
        ages,
        mcMeanReturn,
        incomeByYear,
      });
      const results = {
        mcSequencesFull: mcSeqs,
        survivalAnalysis: survival,
        inputs: { riskProfile, spending, totalPortfolio, retYears, fullYears },
      };
      _analysisCache = results;
      setCachedResults(results);
      dispatch({ type: 'SET_SPEND_DOWN_ANALYSIS', payload: results });
      setComputing(false);
    }, 50);
  }, [fullYears, riskProfile, inflationMean, ages, retirementOffset, spending, retYears, totalPortfolio, profile.annualSavings, mcMeanReturn, incomeByYear]);

  // Slice to retirement-onward for withdrawal strategies
  const mcSequences = useMemo(() => {
    if (!mcSequencesFull) return null;
    return {
      pessimistic: mcSequencesFull.pessimistic.slice(retirementOffset),
      median: mcSequencesFull.median.slice(retirementOffset),
      optimistic: mcSequencesFull.optimistic.slice(retirementOffset),
    };
  }, [mcSequencesFull, retirementOffset]);

  // ── Section 2: Withdrawal Strategies (with MC return sequences) ──
  // MC engine produces real returns (above inflation), so inflationRate: 0 keeps
  // withdrawal amounts in today's dollars — no double-counting inflation.
  const strategyResults = useMemo(() => {
    if (!analysisRun || projectedPortfolio <= 0) return null;
    const medianReturns = mcSequences?.median || null;

    const iby = incomeByYear;
    const fixed = fixedDollarWithdrawal({ portfolioValue: projectedPortfolio, annualWithdrawal: spending, inflationRate: 0, years: retYears, returnSequence: medianReturns, incomeByYear: iby });
    const pct = percentOfPortfolio({ portfolioValue: projectedPortfolio, withdrawalRate: 0.04, years: retYears, returnSequence: medianReturns, incomeByYear: iby });
    const gk = guytonKlinger({ portfolioValue: projectedPortfolio, initialWithdrawal: spending, inflationRate: 0, years: retYears, returnSequence: medianReturns, incomeByYear: iby });
    const bucket = bucketStrategy({ portfolioValue: projectedPortfolio, annualWithdrawal: spending, inflationRate: 0, years: retYears, returnSequence: medianReturns, incomeByYear: iby }).withdrawalSchedule;
    const vpw = variablePercentageWithdrawal({ portfolioValue: projectedPortfolio, currentAge: ages.retirement, lifeExpectancy: ages.life, floor: 0, ceiling: Infinity, realReturn: mcMeanReturn, returnSequence: medianReturns, incomeByYear: iby });
    const rmd = rmdBasedWithdrawal({ portfolioValue: projectedPortfolio, startAge: ages.retirement, endAge: ages.life, returnSequence: medianReturns, incomeByYear: iby });
    const vanguard = vanguardDynamicSpending({ portfolioValue: projectedPortfolio, withdrawalRate: 0.04, ceilingPct: 0.05, floorPct: 0.025, inflationRate: 0, years: retYears, returnSequence: medianReturns, incomeByYear: iby });

    const fixedPess = fixedDollarWithdrawal({ portfolioValue: projectedPortfolio, annualWithdrawal: spending, inflationRate: 0, years: retYears, returnSequence: mcSequences?.pessimistic, incomeByYear: iby });
    const fixedOpt = fixedDollarWithdrawal({ portfolioValue: projectedPortfolio, annualWithdrawal: spending, inflationRate: 0, years: retYears, returnSequence: mcSequences?.optimistic, incomeByYear: iby });

    const maxLen = retYears;
    const chartData = Array.from({ length: maxLen }, (_, i) => ({
      year: i,
      age: ages.retirement + i,
      [WITHDRAWAL_STRATEGY_LABELS.fixed]: fixed[i]?.portfolioEnd || 0,
      [WITHDRAWAL_STRATEGY_LABELS.percent]: pct[i]?.portfolioEnd || 0,
      [WITHDRAWAL_STRATEGY_LABELS.guyton_klinger]: gk[i]?.portfolioEnd || 0,
      [WITHDRAWAL_STRATEGY_LABELS.bucket]: bucket[i]?.portfolioEnd || 0,
      [WITHDRAWAL_STRATEGY_LABELS.vpw]: vpw[i]?.portfolioEnd || 0,
      [WITHDRAWAL_STRATEGY_LABELS.rmd_based]: rmd[i]?.portfolioEnd || 0,
      [WITHDRAWAL_STRATEGY_LABELS.vanguard_dynamic]: vanguard[i]?.portfolioEnd || 0,
      'Pessimistic (10th %)': fixedPess[i]?.portfolioEnd || 0,
      'Optimistic (90th %)': fixedOpt[i]?.portfolioEnd || 0,
    }));

    const summarize = (label, data, depletesByDesign = false) => ({
      label,
      initialWd: data[0]?.withdrawal || 0,
      yr10Wd: data[Math.min(9, data.length - 1)]?.withdrawal || 0,
      yr20Wd: data[Math.min(19, data.length - 1)]?.withdrawal || 0,
      finalBalance: data[data.length - 1]?.portfolioEnd || 0,
      maxRate: Math.max(...data.map(d => d.withdrawalRate || 0)),
      depletesByDesign,
    });

    return {
      chartData,
      table: [
        summarize(WITHDRAWAL_STRATEGY_LABELS.fixed, fixed),
        summarize(WITHDRAWAL_STRATEGY_LABELS.percent, pct),
        summarize(WITHDRAWAL_STRATEGY_LABELS.guyton_klinger, gk),
        summarize(WITHDRAWAL_STRATEGY_LABELS.bucket, bucket),
        summarize(WITHDRAWAL_STRATEGY_LABELS.vpw, vpw, true),
        summarize(WITHDRAWAL_STRATEGY_LABELS.rmd_based, rmd),
        summarize(WITHDRAWAL_STRATEGY_LABELS.vanguard_dynamic, vanguard),
      ],
    };
  }, [analysisRun, projectedPortfolio, spending, retYears, ages.retirement, ages.life, mcSequences, mcMeanReturn, incomeByYear]);

  const survivalAnalysis = cachedResults?.survivalAnalysis ?? null;

  // ── Section 3: RMD Projections ──
  const rmdData = useMemo(() => {
    if (!analysisRun || traditionalTotal <= 0) return [];
    const rows = [];
    const startAge = Math.max(73, ages.current);
    const yearsToGrow = startAge - ages.current;
    const fullReturnSeq = mcSequencesFull?.median;
    let balance = traditionalTotal;
    for (let y = 0; y < yearsToGrow; y++) {
      const r = fullReturnSeq ? fullReturnSeq[y] : mcMeanReturn;
      balance *= (1 + r);
    }

    for (let age = startAge; age <= ages.life; age++) {
      const distPeriod = RMD_TABLE[age] || 2.0;
      const rmdAmount = age >= 73 ? balance / distPeriod : 0;
      const pctOfBalance = balance > 0 ? rmdAmount / balance : 0;
      rows.push({ age, balance, rmdAmount, pctOfBalance });
      const yIdx = age - ages.current;
      const r = fullReturnSeq && yIdx < fullReturnSeq.length ? fullReturnSeq[yIdx] : mcMeanReturn;
      balance = (balance - rmdAmount) * (1 + r);
      if (balance < 0) balance = 0;
    }
    return rows;
  }, [analysisRun, traditionalTotal, ages, mcSequencesFull, mcMeanReturn]);

  // ── Section 4: Roth Conversion Ladder ──
  const rothLadderData = useMemo(() => {
    if (!analysisRun || traditionalTotal <= 0) return null;
    const earlyRetirementIncome = getIncomeForAge(ages.retirement);
    const conversionInfo = optimizeAnnualConversion({
      traditionalBalance: traditionalTotal,
      currentOrdinaryIncome: earlyRetirementIncome,
      filingStatus: profile.filingStatus,
    });
    const ladder = analyzeRothLadder({
      traditionalBalance: traditionalTotal,
      currentAge: ages.current,
      retirementAge: ages.retirement,
      endAge: ages.life,
      filingStatus: profile.filingStatus,
      getIncomeForAge,
      realReturnRate: mcMeanReturn,
      birthYear,
    });
    const chartData = ladder.schedule.map(r => ({
      age: r.age,
      Traditional: r.traditionalBalance,
      Roth: r.rothBalance,
    }));
    return { conversionInfo, ladder, chartData };
  }, [analysisRun, traditionalTotal, ages, profile.filingStatus, getIncomeForAge, mcMeanReturn, birthYear]);

  // ── Section 5: Social Security Optimizer ──
  const ssData = useMemo(() => {
    if (!analysisRun) return null;
    const benefit1 = profile.ss1;
    const benefit2 = profile.ss2;
    const spouse1BirthYear = birthYear;
    const spouse2BirthYear = new Date().getFullYear() - ages.spouse2Current;
    const spouse1 = benefit1 > 0 ? analyzeClaimingAges({ benefitAtFRA: benefit1, currentAge: ages.current, lifeExpectancy: ages.life, birthYear: spouse1BirthYear }) : null;
    const spouse2 = benefit2 > 0 ? analyzeClaimingAges({ benefitAtFRA: benefit2, currentAge: ages.spouse2Current, lifeExpectancy: ages.life, birthYear: spouse2BirthYear }) : null;
    const breakEven62v67 = benefit1 > 0 ? calculateBreakEven({ benefitAtFRA: benefit1, earlyAge: 62, lateAge: 67, birthYear: spouse1BirthYear }) : null;
    const breakEven67v70 = benefit1 > 0 ? calculateBreakEven({ benefitAtFRA: benefit1, earlyAge: 67, lateAge: 70, birthYear: spouse1BirthYear }) : null;
    return { spouse1, spouse2, breakEven62v67, breakEven67v70 };
  }, [analysisRun, profile.ss1, profile.ss2, ages, birthYear]);

  // ── Section 6: Tax Bracket Management ──
  const taxData = useMemo(() => {
    if (!analysisRun) return null;
    const ssAnnual = profile.ss1 * 12 + profile.ss2 * 12;
    const guaranteedIncome = ssAnnual + totalPension;
    // Estimate taxable withdrawals needed to cover spending gap
    const withdrawalFromDeferred = Math.max(0, spending - guaranteedIncome);
    // Only 0-85% of SS is taxable per IRS provisional income rules
    const ssResult = calculateSocialSecurityTax({
      ssaBenefit: ssAnnual,
      otherIncome: totalPension + withdrawalFromDeferred,
      filingStatus: profile.filingStatus,
    });
    const taxableSS = ssResult.taxableAmount;
    const retirementIncome = taxableSS + totalPension + withdrawalFromDeferred;
    const marginalInfo = calculateMarginalRateOnNextDollar({ currentOrdinaryIncome: retirementIncome, filingStatus: profile.filingStatus });
    const taxResult = calculateFederalIncomeTax({ ordinaryIncome: retirementIncome, filingStatus: profile.filingStatus });
    const stdDed = typeof STANDARD_DEDUCTION[profile.filingStatus] === 'number'
      ? STANDARD_DEDUCTION[profile.filingStatus]
      : STANDARD_DEDUCTION[profile.filingStatus]?.amount || 29200;
    const bracketFloor = marginalInfo.bracketFloor || 0;
    const bracketCeiling = marginalInfo.bracketCeiling === Infinity ? bracketFloor + 200000 : marginalInfo.bracketCeiling;
    const bracketWidth = bracketCeiling - bracketFloor;
    const filledAmount = Math.max(0, retirementIncome - bracketFloor);
    const bracketFillPct = bracketWidth > 0 ? Math.min(1, filledAmount / bracketWidth) : 0;
    const conversionSpace = marginalInfo.remainingInBracket === Infinity ? null : marginalInfo.remainingInBracket;

    const irmaaBrackets = MEDICARE_IRMAA[profile.filingStatus] || MEDICARE_IRMAA.married_filing_jointly;
    let irmaaWarning = null;
    for (let i = 1; i < irmaaBrackets.length; i++) {
      const threshold = irmaaBrackets[i].min;
      if (retirementIncome >= threshold * 0.9 && retirementIncome < threshold) {
        irmaaWarning = { threshold, surcharge: irmaaBrackets[i].surcharge, distance: threshold - retirementIncome };
        break;
      }
      if (retirementIncome >= threshold) {
        irmaaWarning = { threshold, surcharge: irmaaBrackets[i].surcharge, active: true };
        break;
      }
    }

    return { retirementIncome, ssAnnual, taxableSS, totalPension, withdrawalFromDeferred, marginalInfo, taxResult, bracketFillPct, conversionSpace, irmaaWarning, bracketFloor, bracketCeiling, stdDed };
  }, [analysisRun, profile.ss1, profile.ss2, totalPension, spending, profile.filingStatus]);

  // ── Render ──
  return (
    <div className="min-h-screen bg-terminal-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-terminal-green crt-glow uppercase tracking-wider text-center mb-8">
          Spend-Down Planner
        </h1>

        {/* Section 1: Retirement Profile */}
        <div className="terminal-card p-5 mb-6">
          <h2 className="font-display font-bold text-terminal-amber uppercase tracking-wider text-sm mb-4">
            Retirement Profile
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <InputField label="Current Age" value={profile.spouse1.currentAge} onChange={v => updateProfile({ spouse1: { currentAge: parseNum(v) } })} />
            <InputField label="Retirement Age" value={profile.spouse1.retirementAge} onChange={v => updateProfile({ spouse1: { retirementAge: parseNum(v) } })} />
            <InputField label={<>Life Expectancy<InfoButton text="Plan to at least age 90-95. Running out of money at 88 is worse than leaving extra at 95. Use SSA actuarial tables or add 5-10 years to average life expectancy for safety margin." /></>} value={profile.lifeExpectancy} onChange={v => updateProfile({ lifeExpectancy: parseNum(v) })} />
            <SelectField label="Filing Status" value={profile.filingStatus} onChange={v => updateProfile({ filingStatus: v })} options={FILING_STATUSES} />
            <SelectField label={<>Portfolio Allocation<InfoButton text="Your stock/bond mix determines expected returns and volatility. Conservative (30/70) has lower returns but smaller drawdowns. Aggressive (100/0) has higher expected returns but can drop 50%+ in a crash. Most retirees use 40-60% stocks." /></>} value={riskProfile} onChange={v => dispatch({ type: 'SET_SIMULATION_CONFIG', payload: { riskProfile: v } })} options={RISK_PROFILE_OPTIONS} />
            <InputField label={<>Annual Retirement Spending<InfoButton text="Your target annual spending in today's dollars. This is the amount each withdrawal strategy tries to deliver. Include housing, food, healthcare, travel, and discretionary spending. Exclude Social Security and pension income — those are modeled separately as an income bridge." /></>} value={profile.annualSpending} onChange={v => updateProfile({ annualSpending: parseNum(v) })} prefix="$" />
            <InputField label={<>SS Benefit at FRA (Spouse 1)<InfoButton text="Your monthly Social Security benefit at Full Retirement Age (FRA), typically 67. Find this on your SSA statement at ssa.gov/myaccount. Claiming early (62) reduces it ~30%; delaying to 70 increases it ~24%. The optimizer below analyzes all claiming ages." /></>} value={profile.ss1} onChange={v => updateProfile({ ss1: parseNum(v) })} prefix="$" />
            <InputField label={<>SS Benefit at FRA (Spouse 2)<InfoButton text="Spouse 2's monthly benefit at Full Retirement Age. If Spouse 2 has limited work history, they may be eligible for a spousal benefit (up to 50% of the higher earner's FRA benefit)." /></>} value={profile.ss2} onChange={v => updateProfile({ ss2: parseNum(v) })} prefix="$" />
            <InputField label="Pension Income (Annual)" value={profile.pension1?.annualAmount || 0} onChange={v => updateProfile({ pension1: { annualAmount: parseNum(v) } })} prefix="$" />
          </div>

          <h3 className="font-display font-bold text-terminal-cyan uppercase tracking-wider text-xs mt-6 mb-3">
            Account Balances
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <InputField label="Traditional 401(k)" value={accounts.trad401k} onChange={v => updateAccount('trad401k', v)} prefix="$" />
            <InputField label="Traditional IRA" value={accounts.tradIRA} onChange={v => updateAccount('tradIRA', v)} prefix="$" />
            <InputField label="Roth IRA" value={accounts.rothIRA} onChange={v => updateAccount('rothIRA', v)} prefix="$" />
            <InputField label="Roth 401(k)" value={accounts.roth401k} onChange={v => updateAccount('roth401k', v)} prefix="$" />
            <InputField label="HSA" value={accounts.hsa} onChange={v => updateAccount('hsa', v)} prefix="$" />
            <InputField label="Taxable" value={accounts.taxable} onChange={v => updateAccount('taxable', v)} prefix="$" />
          </div>

          <div className="flex items-center justify-between mt-6 flex-wrap gap-2">
            <div className="text-txt-secondary font-mono text-sm">
              <span>Current Portfolio: <span className="text-terminal-green font-bold">{formatCurrency(totalPortfolio)}</span></span>
              {ages.retirement > ages.current && (
                <span className="ml-3">
                  → Projected at {ages.retirement}: <span className="text-terminal-cyan font-bold">{formatCurrency(projectedPortfolio)}</span>
                </span>
              )}
            </div>
            <button onClick={handleRunAnalysis} disabled={computing} className="glow-btn glow-btn-green disabled:opacity-50">
              {computing ? 'Computing...' : analysisRun ? 'Re-run Analysis' : 'Run Analysis'}
            </button>
          </div>
          {inputsChanged && (
            <div className="mt-3 rounded p-2 border border-terminal-amber bg-amber-900/10">
              <p className="text-terminal-amber text-xs font-mono">
                Inputs have changed since last analysis. Re-run for updated results.
              </p>
            </div>
          )}
        </div>

        {computing && (
          <div className="terminal-card p-8 mb-6 text-center">
            <div className="inline-block w-6 h-6 border-2 border-terminal-green border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-terminal-green font-mono text-sm">Running 1,000 Monte Carlo simulations across 7 strategies...</p>
            <p className="text-txt-muted font-mono text-xs mt-1">This may take a few seconds</p>
          </div>
        )}

        {analysisRun && !computing && (
          <>
            {/* Section 2: Withdrawal Strategy Comparison */}
            <SectionHeading>Withdrawal Strategy Comparison</SectionHeading>
            {strategyResults && (
              <div className="terminal-card p-5 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Portfolio at Retirement<InfoButton text="Your projected total portfolio value at your retirement age, based on current balances growing at your expected return rate with annual savings contributions." /></p>
                    <p className="text-terminal-green text-lg font-bold font-mono">{formatCurrency(projectedPortfolio)}</p>
                  </div>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Annual Spending</p>
                    <p className="text-txt-primary text-lg font-bold font-mono">{formatCurrency(spending)}</p>
                  </div>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Initial Withdrawal Rate<InfoButton text="Your annual spending divided by portfolio value. The classic '4% rule' (Bengen 1994) found that a 4% initial rate survived 30 years in all historical periods. Longer retirements or higher equity allocations may need lower rates." /></p>
                    <p className={`text-lg font-bold font-mono ${spending / projectedPortfolio > 0.04 ? 'text-terminal-amber' : 'text-terminal-green'}`}>
                      {((spending / projectedPortfolio) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Retirement Span</p>
                    <p className="text-terminal-cyan text-lg font-bold font-mono">{retYears} years</p>
                  </div>
                </div>

                {avgRetirementIncome > 0 && (
                  <div className="mb-6 rounded border border-terminal-dark-green bg-terminal-dark-green/5 p-4">
                    <h4 className="text-terminal-green text-xs font-mono uppercase tracking-wider font-bold mb-2">Income Bridge Factored In<InfoButton text="The income bridge models how Social Security and pension income reduce the amount you need to withdraw from your portfolio each year. Before these income sources start, your portfolio bears the full spending load. After they kick in, portfolio withdrawals drop significantly, extending portfolio longevity." wide /></h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      {(profile.ss1 > 0 || profile.ss2 > 0) && (
                        <div>
                          <span className="text-txt-muted">Social Security:</span>
                          <span className="text-terminal-cyan ml-1">
                            {formatCurrency((profile.ss1 + profile.ss2) * 12)}/yr
                          </span>
                          <span className="text-txt-muted ml-1">from age {Math.ceil(ssClaimingAge)}</span>
                        </div>
                      )}
                      {totalPension > 0 && (
                        <div>
                          <span className="text-txt-muted">Pensions:</span>
                          <span className="text-terminal-cyan ml-1">{formatCurrency(totalPension)}/yr</span>
                          <span className="text-txt-muted ml-1">from age {Math.min(profile.pension1?.startAge || 99, profile.pension2?.startAge || 99)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-txt-muted">Avg portfolio draw needed:</span>
                        <span className="text-terminal-amber ml-1">{formatCurrency(Math.max(spending - avgRetirementIncome, 0))}/yr</span>
                      </div>
                    </div>
                    <p className="text-txt-muted text-[10px] mt-2">
                      Strategies reduce portfolio withdrawals by income for each year. Bridge years (age {ages.retirement}–{Math.ceil(ssClaimingAge) - 1}) draw more heavily from portfolio.
                    </p>
                  </div>
                )}

                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={strategyResults.chartData}>
                      <CartesianGrid stroke={GRID_STROKE} />
                      <XAxis dataKey="age" tick={TICK_STYLE} label={{ value: 'Age', position: 'insideBottom', offset: -2, fill: '#8b949e' }} />
                      <YAxis tick={TICK_STYLE} tickFormatter={v => formatCurrency(v, { compact: true })} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                      <Line type="monotone" dataKey="Pessimistic (10th %)" stroke="#ff073a" dot={false} strokeWidth={1} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="Optimistic (90th %)" stroke="#00cc33" dot={false} strokeWidth={1} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey={WITHDRAWAL_STRATEGY_LABELS.fixed} stroke={CHART_GREEN} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey={WITHDRAWAL_STRATEGY_LABELS.percent} stroke={CHART_CYAN} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey={WITHDRAWAL_STRATEGY_LABELS.guyton_klinger} stroke={CHART_AMBER} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey={WITHDRAWAL_STRATEGY_LABELS.bucket} stroke={CHART_RED} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey={WITHDRAWAL_STRATEGY_LABELS.vpw} stroke={CHART_PURPLE} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey={WITHDRAWAL_STRATEGY_LABELS.rmd_based} stroke={CHART_CORAL} dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey={WITHDRAWAL_STRATEGY_LABELS.vanguard_dynamic} stroke={CHART_TEAL} dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mb-4 p-3 rounded border border-surface-border bg-surface-elevated/30">
                  <h4 className="text-terminal-amber text-xs font-mono uppercase tracking-wider font-bold mb-2">Strategy Guide</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-mono text-txt-secondary">
                    <p><span className="text-terminal-green font-bold">Fixed Dollar</span> — Withdraw a set amount each year regardless of market performance. Simple and predictable, but rigid.</p>
                    <p><span className="text-terminal-green font-bold">Percent of Portfolio</span> — Withdraw a fixed percentage of your current balance. Spending adjusts with market, so you never fully deplete.</p>
                    <p><span className="text-terminal-green font-bold">Guardrails (Guyton-Klinger)</span> — Start with a target amount, then apply rules: skip inflation raises after down years, cut 10% if rate exceeds ceiling, raise 10% if below floor.</p>
                    <p><span className="text-terminal-green font-bold">Bucket Strategy</span> — Split portfolio into cash (1-2yr), income (3-7yr), and growth (8+yr) buckets. Spend from cash while growth bucket recovers from downturns.</p>
                    <p><span className="text-terminal-green font-bold">Variable Percentage (VPW)</span> — Actuarial formula that adjusts withdrawal rate based on remaining life expectancy. Spends more early, less later. Never depletes by design.</p>
                    <p><span className="text-terminal-green font-bold">RMD-Based</span> — Follows IRS Required Minimum Distribution divisor tables. Withdrawals increase as a percentage of portfolio with age. Mandatory from Traditional accounts at 73+.</p>
                    <p><span className="text-terminal-green font-bold">Vanguard Dynamic</span> — Targets a fixed percentage but applies floor (-2.5%) and ceiling (+5%) limits to year-over-year changes. Smooths spending volatility.</p>
                  </div>
                </div>
                <DataTable
                  columns={[
                    { label: 'Strategy', key: 'label', className: 'text-terminal-green font-bold' },
                    { label: 'Year-1 Withdrawal', render: r => formatCurrency(r.initialWd) },
                    { label: 'Year-10 Withdrawal', render: r => formatCurrency(r.yr10Wd) },
                    { label: 'Year-20 Withdrawal', render: r => formatCurrency(r.yr20Wd) },
                    { label: 'Final Balance', render: r => (
                      r.depletesByDesign && r.finalBalance <= 0
                        ? <span className="text-txt-muted italic">$0 (by design)</span>
                        : <span className={r.finalBalance <= 0 ? 'text-terminal-red' : 'text-terminal-green'}>
                            {formatCurrency(r.finalBalance)}
                          </span>
                    )},
                    { label: 'Max Rate', render: r => (
                      r.depletesByDesign
                        ? <span className="text-txt-muted italic">N/A</span>
                        : <span className={r.maxRate > 0.06 ? 'text-terminal-amber' : 'text-txt-primary'}>
                            {(r.maxRate * 100).toFixed(1)}%
                          </span>
                    )},
                  ]}
                  rows={strategyResults.table}
                />
              </div>
            )}

            {/* Strategy Survival Analysis */}
            {survivalAnalysis && (
              <div className="terminal-card p-5 mb-6">
                <h3 className="font-display font-bold text-terminal-green crt-glow uppercase tracking-wider text-base mb-4">
                  Strategy Survival Analysis
                </h3>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="bg-surface-elevated rounded px-3 py-1.5">
                    <span className="text-txt-muted text-xs font-mono">Allocation: </span>
                    <span className="text-terminal-cyan text-xs font-mono font-bold">{Math.round(riskParams.stocks * 100)}/{Math.round((1 - riskParams.stocks) * 100)} Stocks/Bonds</span>
                  </div>
                  <div className="bg-surface-elevated rounded px-3 py-1.5">
                    <span className="text-txt-muted text-xs font-mono">Retirement Span: </span>
                    <span className="text-terminal-cyan text-xs font-mono font-bold">{retYears} years (age {ages.retirement}–{ages.life})</span>
                  </div>
                  <div className="bg-surface-elevated rounded px-3 py-1.5">
                    <span className="text-txt-muted text-xs font-mono">Expected Real CAGR: </span>
                    <span className="text-terminal-cyan text-xs font-mono font-bold">{riskParams.meanReturn.toFixed(1)}%</span>
                  </div>
                  <div className="bg-surface-elevated rounded px-3 py-1.5">
                    <span className="text-txt-muted text-xs font-mono">Simulations: </span>
                    <span className="text-terminal-cyan text-xs font-mono font-bold">{survivalAnalysis.numSims.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-txt-secondary text-xs mb-4 font-mono">
                  Correlated multi-asset model with bull/bear regime switching, stock-bond correlation, and stochastic inflation.
                  Longer retirements require lower withdrawal rates — the classic 4% rule was calibrated for 30-year spans.
                </p>

                {/* Max Safe Spending Comparison */}
                <h4 className="font-display font-semibold text-terminal-amber uppercase tracking-wider text-sm mb-3">
                  Maximum Safe Spending by Strategy (95% Success)<InfoButton text="The highest initial annual spending where your portfolio survives your full retirement in at least 95% of the 1,000 Monte Carlo simulations. Higher is better. Adaptive strategies (Guardrails, Vanguard) typically allow higher safe rates because they cut spending during downturns." wide />
                </h4>
                <p className="text-txt-secondary text-xs mb-3 font-mono">
                  The highest initial spending where at least 95% of simulations survive your full retirement.
                  Adaptive strategies cut withdrawals during downturns. Fixed % uses a spending-floor test (withdrawals never drop below 50% of initial).
                </p>
                <DataTable
                  columns={[
                    { label: 'Strategy', key: 'label', className: 'text-terminal-green font-bold' },
                    { label: 'Safe Rate', render: r =>
                      r.maxSafeRate != null
                        ? <span className="text-terminal-cyan">{(r.maxSafeRate * 100).toFixed(2)}%</span>
                        : <span className="text-txt-muted italic">Formula-driven</span>
                    },
                    { label: 'Annual Amount', render: r =>
                      r.maxSafeAnnual != null
                        ? <span className="text-terminal-green">{formatCurrency(r.maxSafeAnnual)}</span>
                        : <span className="text-txt-muted">—</span>
                    },
                    { label: 'Monthly Amount', render: r =>
                      r.maxSafeAnnual != null
                        ? formatCurrency(r.maxSafeAnnual / 12)
                        : <span className="text-txt-muted">—</span>
                    },
                  ]}
                  rows={survivalAnalysis.strategies.filter(s => s.maxSafeRate != null).sort((a, b) => b.maxSafeRate - a.maxSafeRate)}
                />

                {/* At Current Spending */}
                <h4 className="font-display font-semibold text-terminal-amber uppercase tracking-wider text-sm mb-3 mt-6">
                  At Your Current Spending ({formatCurrency(spending)}/yr &mdash; {((spending / projectedPortfolio) * 100).toFixed(1)}%)
                </h4>
                <DataTable
                  columns={[
                    { label: 'Strategy', key: 'label', className: 'text-terminal-green font-bold' },
                    { label: <>Survival Rate<InfoButton text="Percentage of simulations where your portfolio lasted your entire retirement. 95%+ is the gold standard. Below 80% is risky." /></>, render: r => (
                      <span className={r.successRate >= 0.95 ? 'text-terminal-green' : r.successRate >= 0.80 ? 'text-terminal-amber' : 'text-terminal-red'}>
                        {r.neverDepletes ? '100%' : (r.successRate * 100).toFixed(1) + '%'}
                      </span>
                    )},
                    { label: <>Worst-Case Floor<InfoButton text="The minimum annual withdrawal in the 10th-percentile scenario (bad luck). For adaptive strategies, this shows how low spending could drop in a prolonged downturn. Red if below 50% of your target." /></>, render: r => (
                      <span className={r.p10MinWithdrawal < spending * 0.5 ? 'text-terminal-red' : 'text-txt-primary'}>
                        {formatCurrency(r.p10MinWithdrawal)}
                      </span>
                    ), className: 'text-txt-primary' },
                    { label: <>Median Lifetime Total<InfoButton text="Total amount withdrawn over your full retirement in the median (50th percentile) simulation. Higher means more total spending power, but compare with survival rate — some strategies spend more but risk depletion." wide /></>, render: r => formatCurrency(r.medianTotalSpending) },
                  ]}
                  rows={survivalAnalysis.strategies}
                />

                {/* Success Rate Curve */}
                <h4 className="font-display font-semibold text-terminal-amber uppercase tracking-wider text-sm mb-3 mt-6">
                  Fixed-Dollar Success Rate Curve<InfoButton text="Shows the survival probability at every withdrawal rate for the fixed-dollar strategy. The curve drops steeply around the safe withdrawal rate. Find where it crosses 95% to see the maximum safe rate for your retirement span and allocation." wide />
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={survivalAnalysis.swrCurve.testedRates.map(r => ({
                      rate: (r.rate * 100).toFixed(1) + '%',
                      rateNum: r.rate,
                      success: Math.round(r.successPct * 100),
                    }))}>
                      <CartesianGrid stroke={GRID_STROKE} />
                      <XAxis dataKey="rate" tick={TICK_STYLE} />
                      <YAxis tick={TICK_STYLE} domain={[0, 100]} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={TOOLTIP_STYLE} className="rounded p-2 text-xs font-mono">
                            <p className="text-txt-secondary">Rate: {d.rate} ({formatCurrency(projectedPortfolio * d.rateNum)}/yr)</p>
                            <p style={{ color: d.success >= 95 ? CHART_GREEN : d.success >= 80 ? CHART_AMBER : CHART_RED }}>
                              Survival: {d.success}%
                            </p>
                          </div>
                        );
                      }} />
                      <Area type="monotone" dataKey="success" stroke={CHART_GREEN} fill={CHART_GREEN} fillOpacity={0.15} strokeWidth={2} name="Survival %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Withdrawal Ordering Guide */}
            <SectionHeading>Withdrawal Sequence Strategy</SectionHeading>
            <div className="terminal-card p-5 mb-6">
              <p className="text-txt-secondary font-mono text-xs mb-4">
                Recommended account withdrawal order based on your profile. Optimizes for tax efficiency and penalty avoidance.
              </p>
              <div className="space-y-4">
                {withdrawalPhases.map((phase, i) => (
                  <div key={i} className={`rounded p-4 border ${phase.active ? 'border-terminal-green bg-terminal-dark-green/10' : 'border-surface-border bg-surface-elevated/50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full border border-terminal-amber flex items-center justify-center text-terminal-amber text-xs font-mono font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <h4 className="text-terminal-green font-mono font-bold text-sm">{phase.label}</h4>
                        <p className="text-txt-muted text-xs font-mono">{phase.ageRange}</p>
                      </div>
                    </div>
                    <div className="ml-11 space-y-1">
                      {phase.steps.map((step, j) => (
                        <p key={j} className="text-txt-secondary text-xs font-mono">
                          <span className="text-terminal-cyan mr-2">&#9656;</span>{step}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: RMD Projections */}
            <SectionHeading>Required Minimum Distributions<InfoButton text="The IRS requires you to withdraw a minimum amount from Traditional 401(k) and IRA accounts starting at age 73 (75 if born after 1960). The amount is calculated by dividing your account balance by a life expectancy divisor from IRS tables. RMDs are taxed as ordinary income and can push you into higher brackets or trigger IRMAA surcharges." wide /></SectionHeading>
            {rmdData.length > 0 ? (
              <div className="terminal-card p-5 mb-6">
                <p className="text-txt-secondary text-xs font-mono mb-3">
                  Based on Traditional 401(k) + IRA balance of {formatCurrency(traditionalTotal)} growing at {(mcMeanReturn * 100).toFixed(1)}% ({riskProfile}) return with MC variance.
                </p>
                <div className="max-h-96 overflow-y-auto">
                  <DataTable
                    columns={[
                      { label: 'Age', key: 'age', className: 'text-terminal-cyan' },
                      { label: 'Account Balance (Start)', render: r => formatCurrency(r.balance) },
                      { label: 'RMD Amount', render: r => <span className="text-terminal-amber">{formatCurrency(r.rmdAmount)}</span> },
                      { label: 'RMD % of Balance', render: r => `${(r.pctOfBalance * 100).toFixed(2)}%` },
                    ]}
                    rows={rmdData}
                  />
                </div>
              </div>
            ) : (
              <div className="terminal-card p-5 mb-6">
                <p className="text-txt-muted font-mono text-sm">No traditional account balances to project RMDs.</p>
              </div>
            )}

            {/* Section 4: Roth Conversion Ladder */}
            <SectionHeading>Roth Conversion Ladder<InfoButton text="A strategy to move money from Traditional (pre-tax) accounts to Roth (tax-free) accounts over several years. You pay income tax on each conversion, but future growth and withdrawals are tax-free. Best done in low-income years (early retirement, before SS starts) to fill low tax brackets. Reduces future RMDs and can lower lifetime taxes." wide /></SectionHeading>
            {rothLadderData ? (
              <div className="terminal-card p-5 mb-6">
                <p className="text-txt-secondary text-xs font-mono mb-4">
                  Conversion analysis uses income-by-age model: working income pre-retirement, pension-only during gap years ({ages.retirement}–{Math.ceil(ssClaimingAge)}), full SS+pension after {Math.ceil(ssClaimingAge)}.
                  {ages.retirement < 60 && <span className="text-terminal-green"> Early retirement gap years are prime Roth conversion windows.</span>}
                </p>
                <div className={`grid grid-cols-1 sm:grid-cols-3 ${rothLadderData.ladder.totalIrmaaImpact > 0 ? 'lg:grid-cols-4' : ''} gap-4 mb-6`}>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Marginal Rate at Retirement<InfoButton text="The tax rate on your next dollar of income at retirement. Roth conversions are most valuable when your current marginal rate is lower than your expected future rate." /></p>
                    <p className="text-terminal-amber text-xl font-bold font-mono">
                      {(rothLadderData.conversionInfo.currentMarginalRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Optimal Annual Conversion<InfoButton text="The amount to convert each year to fill your current tax bracket without jumping to the next one. Converts enough to minimize lifetime taxes while staying below IRMAA thresholds." /></p>
                    <p className="text-terminal-green text-xl font-bold font-mono">
                      {formatCurrency(rothLadderData.conversionInfo.optimalConversion)}
                    </p>
                  </div>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Tax on Conversion</p>
                    <p className="text-terminal-red text-xl font-bold font-mono">
                      {formatCurrency(rothLadderData.conversionInfo.taxOnConversion)}
                    </p>
                  </div>
                  {rothLadderData.ladder.totalIrmaaImpact > 0 && (
                    <div className="bg-surface-elevated rounded p-3 border border-terminal-amber/30">
                      <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Total IRMAA Impact<InfoButton text="IRMAA (Income-Related Monthly Adjustment Amount) is a Medicare surcharge for higher earners. If Roth conversions push your MAGI above certain thresholds, you'll pay extra for Medicare Part B and D premiums. This shows the total surcharge cost across all conversion years." wide /></p>
                      <p className="text-terminal-amber text-xl font-bold font-mono">
                        {formatCurrency(rothLadderData.ladder.totalIrmaaImpact)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="h-72 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rothLadderData.chartData}>
                      <CartesianGrid stroke={GRID_STROKE} />
                      <XAxis dataKey="age" tick={TICK_STYLE} />
                      <YAxis tick={TICK_STYLE} tickFormatter={v => formatCurrency(v, { compact: true })} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
                      <Area type="monotone" dataKey="Traditional" stackId="1" stroke={CHART_AMBER} fill="rgba(255,176,0,0.2)" />
                      <Area type="monotone" dataKey="Roth" stackId="1" stroke={CHART_GREEN} fill="rgba(0,255,65,0.15)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <DataTable
                    columns={[
                      { label: 'Age', render: r => r.age, className: 'text-terminal-cyan' },
                      { label: 'Conversion', render: r => formatCurrency(r.conversion) },
                      { label: 'Tax Paid', render: r => <span className="text-terminal-red">{formatCurrency(r.taxOnConversion)}</span> },
                      { label: 'RMD', render: r => r.rmdAmount > 0 ? <span className="text-terminal-amber">{formatCurrency(r.rmdAmount)}</span> : <span className="text-txt-muted">—</span> },
                      { label: 'Traditional Balance', render: r => formatCurrency(r.traditionalBalance) },
                      { label: 'Roth Balance', render: r => (
                        <span className="text-terminal-green">{formatCurrency(r.rothBalance)}</span>
                      )},
                      { label: <>Penalty-Free Roth<InfoButton text="Roth conversions have a 5-year waiting period before earnings can be withdrawn tax/penalty-free. This column shows how much of your Roth balance is past the 5-year window and fully accessible. Roth contributions (not conversions) are always accessible." /></>, render: r => formatCurrency(r.penaltyFreeRothBalance) },
                      { label: 'IRMAA Impact', render: r => (
                        <span className={r.estimatedIrmaaImpact > 0 ? 'text-terminal-amber font-bold' : 'text-txt-muted'}>
                          {r.estimatedIrmaaImpact > 0 ? formatCurrency(r.estimatedIrmaaImpact) : '—'}
                        </span>
                      )},
                    ]}
                    rows={rothLadderData.ladder.schedule}
                  />
                </div>
              </div>
            ) : (
              <div className="terminal-card p-5 mb-6">
                <p className="text-txt-muted font-mono text-sm">No traditional account balances for Roth conversion analysis.</p>
              </div>
            )}

            {/* Section 5: Social Security Optimizer */}
            <SectionHeading>Social Security Optimizer<InfoButton text="Analyzes the trade-off between claiming early (smaller monthly check, more years of payments) vs. delaying (larger check, fewer years). The optimal age depends on life expectancy, tax situation, and other income sources. The break-even age shows when the larger delayed benefit catches up in total lifetime payouts." wide /></SectionHeading>
            {ssData && (ssData.spouse1 || ssData.spouse2) ? (
              <div className="terminal-card p-5 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[
                    { label: 'Spouse 1', data: ssData.spouse1 },
                    { label: 'Spouse 2', data: ssData.spouse2 },
                  ].filter(s => s.data).map(({ label, data }) => (
                    <div key={label}>
                      <h3 className="text-terminal-cyan font-mono font-bold text-sm uppercase tracking-wider mb-3">
                        {label}
                      </h3>
                      <p className="text-txt-secondary text-xs font-mono mb-2">
                        Optimal claiming age:{' '}
                        <span className="text-terminal-green font-bold">{data.optimalAge}</span>
                      </p>
                      <div className="h-52 mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.scenarios}>
                            <CartesianGrid stroke={GRID_STROKE} />
                            <XAxis
                              dataKey="claimingAge"
                              tick={TICK_STYLE}
                              label={{ value: 'Claiming Age', position: 'insideBottom', offset: -2, fill: '#8b949e' }}
                            />
                            <YAxis tick={TICK_STYLE} tickFormatter={v => formatCurrency(v, { compact: true })} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="nominalLifetimeTotal" name="Lifetime Benefit">
                              {data.scenarios.map((entry, i) => (
                                <rect key={i} fill={entry.claimingAge === data.optimalAge ? CHART_GREEN : CHART_CYAN} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <DataTable
                        columns={[
                          { label: 'Age', render: r => (
                            <span className={r.claimingAge === data.optimalAge ? 'text-terminal-green font-bold' : ''}>
                              {r.claimingAge}
                            </span>
                          )},
                          { label: 'Monthly Benefit', render: r => formatCurrency(r.monthlyBenefit) },
                          { label: 'Lifetime Total', render: r => formatCurrency(r.nominalLifetimeTotal, { compact: true }) },
                        ]}
                        rows={data.scenarios}
                      />
                    </div>
                  ))}
                </div>

                {ssData.breakEven62v67 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-surface-elevated rounded p-3">
                      <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Break-Even: 62 vs 67<InfoButton text="The age at which total lifetime benefits from claiming at 67 surpass total benefits from claiming at 62. If you live past this age, delaying was the better choice." /></p>
                      <p className="text-terminal-amber text-lg font-bold font-mono">
                        {ssData.breakEven62v67.breakEvenAge ? `Age ${ssData.breakEven62v67.breakEvenAge}` : 'Never'}
                      </p>
                    </div>
                    {ssData.breakEven67v70 && (
                      <div className="bg-surface-elevated rounded p-3">
                        <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Break-Even: 67 vs 70</p>
                        <p className="text-terminal-amber text-lg font-bold font-mono">
                          {ssData.breakEven67v70.breakEvenAge ? `Age ${ssData.breakEven67v70.breakEvenAge}` : 'Never'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="terminal-card p-5 mb-6">
                <p className="text-txt-muted font-mono text-sm">Enter Social Security benefits to see claiming analysis.</p>
              </div>
            )}

            {/* Section 6: Tax Bracket Management */}
            <SectionHeading>Tax Bracket Management<InfoButton text="Shows your estimated tax situation in retirement. Income sources (SS, pension, withdrawals) stack up to fill tax brackets. Understanding your marginal rate helps optimize Roth conversions, withdrawal sequencing, and charitable giving." wide /></SectionHeading>
            {taxData && (
              <div className="terminal-card p-5 mb-6">
                <p className="text-txt-muted text-xs font-mono mb-4">
                  Taxable SS: {formatCurrency(taxData.taxableSS)} <span className="text-txt-muted">(of {formatCurrency(taxData.ssAnnual)} total)</span>
                  {taxData.totalPension > 0 && <> + Pension: {formatCurrency(taxData.totalPension)}</>}
                  {taxData.withdrawalFromDeferred > 0 && <> + Est. Withdrawals: {formatCurrency(taxData.withdrawalFromDeferred)}</>}
                  {' '}= {formatCurrency(taxData.retirementIncome)}/yr taxable
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Est. Retirement Income</p>
                    <p className="text-txt-primary text-lg font-bold font-mono">{formatCurrency(taxData.retirementIncome)}</p>
                  </div>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Marginal Bracket<InfoButton text="The tax rate on your next dollar of income. This is NOT your overall tax rate — it's the rate on additional income (like a Roth conversion or extra withdrawal). Key for deciding whether to convert, harvest gains, or defer income." /></p>
                    <p className="text-terminal-amber text-lg font-bold font-mono">
                      {(taxData.marginalInfo.marginalRate * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Effective Rate<InfoButton text="Your total federal tax divided by total income. This is your actual average tax rate across all brackets. Typically much lower than your marginal rate because lower brackets are taxed at lower rates first." /></p>
                    <p className="text-terminal-cyan text-lg font-bold font-mono">
                      {(taxData.taxResult.effectiveRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-surface-elevated rounded p-3">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">Federal Tax</p>
                    <p className="text-terminal-red text-lg font-bold font-mono">{formatCurrency(taxData.taxResult.tax)}</p>
                  </div>
                </div>

                {/* Bracket Fill Meter */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-mono text-txt-secondary mb-1">
                    <span>{formatCurrency(taxData.bracketFloor)}</span>
                    <span className="text-terminal-amber">
                      {(taxData.marginalInfo.marginalRate * 100).toFixed(0)}% Bracket
                    </span>
                    <span>
                      {taxData.marginalInfo.bracketCeiling === Infinity ? 'No Limit' : formatCurrency(taxData.bracketCeiling)}
                    </span>
                  </div>
                  <div className="w-full h-5 bg-surface-elevated rounded overflow-hidden border border-surface-border">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${Math.min(100, taxData.bracketFillPct * 100)}%`,
                        background: taxData.bracketFillPct > 0.85
                          ? 'linear-gradient(90deg, #ffb000, #ff073a)'
                          : 'linear-gradient(90deg, #00ff41, #00d4ff)',
                      }}
                    />
                  </div>
                  <p className="text-xs font-mono text-txt-muted mt-1">
                    {(taxData.bracketFillPct * 100).toFixed(0)}% filled
                  </p>
                </div>

                {taxData.conversionSpace !== null && (
                  <div className="bg-surface-elevated rounded p-3 mb-4">
                    <p className="text-txt-secondary text-xs uppercase tracking-wider font-mono">
                      Roth Conversion Space (to Next Bracket)<InfoButton text="How much additional income (via Roth conversions) you can add before jumping to the next tax bracket. Fill this space with conversions to optimize your tax bracket utilization without paying higher marginal rates." />
                    </p>
                    <p className="text-terminal-green text-xl font-bold font-mono">
                      {formatCurrency(taxData.conversionSpace)}
                    </p>
                  </div>
                )}

                {taxData.irmaaWarning && (
                  <div className={`rounded p-3 border ${
                    taxData.irmaaWarning.active
                      ? 'border-terminal-red bg-red-900/10'
                      : 'border-terminal-amber bg-amber-900/10'
                  }`}>
                    <p className={`text-xs uppercase tracking-wider font-mono font-bold ${
                      taxData.irmaaWarning.active ? 'text-terminal-red' : 'text-terminal-amber'
                    }`}>
                      {taxData.irmaaWarning.active ? 'IRMAA Surcharge Active' : 'IRMAA Threshold Warning'}
                    </p>
                    <p className="text-txt-primary text-sm font-mono mt-1">
                      {taxData.irmaaWarning.active
                        ? `Income exceeds ${formatCurrency(taxData.irmaaWarning.threshold)} threshold. Monthly Medicare surcharge: ${formatCurrency(taxData.irmaaWarning.surcharge, { decimals: 2 })}/mo.`
                        : `Income is within ${formatCurrency(taxData.irmaaWarning.distance)} of the ${formatCurrency(taxData.irmaaWarning.threshold)} IRMAA threshold. Surcharge would be ${formatCurrency(taxData.irmaaWarning.surcharge, { decimals: 2 })}/mo.`
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
