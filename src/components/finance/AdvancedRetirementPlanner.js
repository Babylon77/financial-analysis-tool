import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine
} from 'recharts';
import { runMonteCarloSimulation, RISK_PROFILES, ASSET_CLASS_PARAMS, CORRELATIONS } from '../../utils/monteCarloSimulation';
import { formatCurrency } from '../../utils/formatters';
import { RMD_TABLE } from '../../utils/constants/taxConstants';
import MoneyInput from '../MoneyInput';
import { useFinancialPlan, DEFAULT_DRAWDOWN_PHASES } from '../../context/FinancialPlanContext';
import InfoButton from '../common/InfoButton';

const SPEND_DOWN_STRATEGIES = [
  { value: 'phases', label: 'Fixed Phases (Custom)' },
  { value: 'fixed', label: 'Fixed Dollar' },
  { value: 'percent', label: 'Percent of Portfolio (4%)' },
  { value: 'guardrails', label: 'Guardrails (Guyton-Klinger)' },
  { value: 'vpw', label: 'Variable Percentage (VPW)' },
  { value: 'rmd', label: 'RMD-Based' },
  { value: 'vanguard', label: 'Vanguard Dynamic' },
];

function SelectField({ label, value, onChange, children, hint }) {
  return (
    <div>
      <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">{label}</label>
      <select value={value} onChange={onChange} className="terminal-input w-full">{children}</select>
      {hint && <p className="text-xs text-txt-muted mt-1">{hint}</p>}
    </div>
  );
}

function NumberField({ label, value, onChange, hint, disabled, step }) {
  return (
    <div>
      <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`terminal-input w-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {hint && <p className="text-xs text-txt-muted mt-1">{hint}</p>}
    </div>
  );
}

function MoneyField({ label, value, onValueChange }) {
  return (
    <div>
      <label className="block text-txt-secondary text-xs font-mono uppercase tracking-wide mb-1">{label}</label>
      <MoneyInput value={value} onValueChange={onValueChange} />
    </div>
  );
}

function MetricBox({ label, value, color = 'terminal-cyan' }) {
  return (
    <div className="bg-surface-elevated rounded p-3 border border-surface-border">
      <p className="text-txt-muted text-[10px] uppercase tracking-wider font-mono">{label}</p>
      <p className={`text-${color} text-sm font-bold font-mono`}>{value}</p>
    </div>
  );
}

function heatmapColor(value, min, max) {
  if (max <= min) return 'rgb(107, 114, 128)';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (value <= 0) return 'rgb(220, 38, 38)';
  if (t < 0.25) {
    const p = t / 0.25;
    return `rgb(${Math.round(220 - 40 * p)}, ${Math.round(38 + 87 * p)}, ${Math.round(38 - 2 * p)})`;
  }
  if (t < 0.5) {
    const p = (t - 0.25) / 0.25;
    return `rgb(${Math.round(180 + 54 * p)}, ${Math.round(125 + 51 * p)}, ${Math.round(36 - 36 * p)})`;
  }
  if (t < 0.75) {
    const p = (t - 0.5) / 0.25;
    return `rgb(${Math.round(234 - 102 * p)}, ${Math.round(176 - 12 * p)}, ${Math.round(0 + 22 * p)})`;
  }
  const p = (t - 0.75) / 0.25;
  return `rgb(${Math.round(132 - 98 * p)}, ${Math.round(164 + 33 * p)}, ${Math.round(22 + 43 * p)})`;
}

const AdvancedRetirementPlanner = () => {
  const { state: planState, dispatch } = useFinancialPlan();

  const [scenarioData, setScenarioData] = useState(() => {
    const p = planState.profile;
    const totalNetWorth = Object.values(p.accounts).reduce((s, v) => s + v, 0);
    return {
      spouse1CurrentAge: p.spouse1.currentAge,
      spouse1RetirementAge: p.spouse1.retirementAge,
      spouse1Name: p.spouse1.name,
      spouse2CurrentAge: p.spouse2?.currentAge || p.spouse1.currentAge,
      spouse2RetirementAge: p.spouse2?.retirementAge || p.spouse1.retirementAge,
      spouse2Name: p.spouse2?.name || 'Spouse 2',
      currentNetWorth: totalNetWorth || planState.simulationConfig.initialInvestment,
      annualSavings: p.annualSavings,
      savingsGrowthRate: p.savingsGrowthRate,
      drawdownPhases: planState.drawdownPhases || [...DEFAULT_DRAWDOWN_PHASES],
    };
  });

  const riskProfile = planState.simulationConfig.riskProfile || 'balanced';
  const mcResults = planState.simulationResults;
  const expectedReturn = mcResults?.medianCAGR
    ? parseFloat((mcResults.medianCAGR * 100).toFixed(2))
    : (RISK_PROFILES[riskProfile]?.meanReturn || 7.0);

  const [heatmapData, setHeatmapData] = useState(() => planState.heatmapData);
  const [selectedHeatmapAge, setSelectedHeatmapAge] = useState(() => planState.selectedHeatmapAge);
  const [isCalculating, setIsCalculating] = useState(false);
  const [monteCarloScenario, setMonteCarloScenario] = useState(() => planState.monteCarloScenario);
  const [isRerunningMC, setIsRerunningMC] = useState(false);
  const [showDrawdown, setShowDrawdown] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [spendStrategy, setSpendStrategy] = useState('phases');

  useEffect(() => {
    dispatch({ type: 'SET_PROFILE', payload: {
      spouse1: { name: scenarioData.spouse1Name, currentAge: scenarioData.spouse1CurrentAge, retirementAge: scenarioData.spouse1RetirementAge },
      spouse2: { name: scenarioData.spouse2Name, currentAge: scenarioData.spouse2CurrentAge, retirementAge: scenarioData.spouse2RetirementAge },
      annualSavings: scenarioData.annualSavings,
      savingsGrowthRate: scenarioData.savingsGrowthRate,
    }});
    dispatch({ type: 'SET_DRAWDOWN_PHASES', payload: scenarioData.drawdownPhases });
  }, [scenarioData, dispatch]);

  useEffect(() => { dispatch({ type: 'SET_HEATMAP_DATA', payload: heatmapData }); }, [heatmapData, dispatch]);
  useEffect(() => { dispatch({ type: 'SET_HEATMAP_AGE', payload: selectedHeatmapAge }); }, [selectedHeatmapAge, dispatch]);
  useEffect(() => { dispatch({ type: 'SET_MC_SCENARIO', payload: monteCarloScenario }); }, [monteCarloScenario, dispatch]);

  const handleInput = useCallback((field, value) => {
    setScenarioData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'spouse1RetirementAge' || field === 'spouse2RetirementAge') {
        const laterAge = Math.max(
          field === 'spouse1RetirementAge' ? value : prev.spouse1RetirementAge,
          field === 'spouse2RetirementAge' ? value : prev.spouse2RetirementAge
        );
        const phases = [...next.drawdownPhases];
        if (phases.length > 0) phases[0] = { ...phases[0], startAge: laterAge };
        next.drawdownPhases = phases;
      }
      return next;
    });
  }, []);

  const handleDrawdownChange = useCallback((index, field, value) => {
    setScenarioData(prev => {
      const phases = [...prev.drawdownPhases];
      phases[index] = { ...phases[index], [field]: value };
      if (field === 'endAge' && index < phases.length - 1) {
        phases[index + 1] = { ...phases[index + 1], startAge: value };
      }
      if (field === 'startAge' && index > 0) {
        phases[index - 1] = { ...phases[index - 1], endAge: value };
      }
      return { ...prev, drawdownPhases: phases };
    });
  }, []);

  useEffect(() => {
    setScenarioData(prev => {
      const phases = [...prev.drawdownPhases];
      if (phases.length > 0) {
        phases[0] = { ...phases[0], endAge: selectedHeatmapAge };
        if (phases.length > 1) phases[1] = { ...phases[1], startAge: selectedHeatmapAge };
      }
      return { ...prev, drawdownPhases: phases };
    });
  }, [selectedHeatmapAge]);

  const getTheoreticalCAGR = useCallback((scenario) => {
    const profile = RISK_PROFILES[riskProfile] || RISK_PROFILES['balanced'];
    const { stocks: sp, bonds: bp } = ASSET_CLASS_PARAMS;
    const portMean = profile.stocks * sp.mean + profile.bonds * bp.meanReal;
    const portVar = (profile.stocks * sp.stdDev) ** 2 + (profile.bonds * bp.stdDev) ** 2 +
      2 * profile.stocks * profile.bonds * CORRELATIONS.stock_bond * sp.stdDev * bp.stdDev;
    const geoMean = portMean - 0.5 * portVar;
    const currentAge = Math.min(scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge);
    const years = Math.max(1, selectedHeatmapAge - currentAge);
    const cagrVol = Math.sqrt(portVar) / Math.sqrt(years);
    const z = { best: 2.33, optimistic: 1.28, median: 0, pessimistic: -1.28, worst: -2.33 };
    return geoMean + (z[scenario] || 0) * cagrVol;
  }, [riskProfile, scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge, selectedHeatmapAge]);

  const getScenarioReturn = useCallback((scenario) => {
    return getTheoreticalCAGR(scenario);
  }, [getTheoreticalCAGR]);

  const getScenarioReturnSequence = useCallback((scenario, numYears) => {
    const targetCAGR = getTheoreticalCAGR(scenario);
    const medianReturns = mcResults?.yearlyReturns?.median;

    if (!medianReturns || medianReturns.length === 0) {
      return new Array(numYears).fill(targetCAGR);
    }

    const medianCAGR = Math.pow(
      medianReturns.reduce((prod, r) => prod * (1 + r), 1),
      1 / medianReturns.length
    ) - 1;

    const scaleFactor = (1 + targetCAGR) / (1 + medianCAGR);

    return Array.from({ length: numYears }, (_, i) => {
      const baseReturn = medianReturns[i % medianReturns.length];
      return (1 + baseReturn) * scaleFactor - 1;
    });
  }, [mcResults, getTheoreticalCAGR]);

  const annualSpending = planState.profile.annualSpending || 80000;
  const withdrawalRate = 0.04;

  const computeWithdrawal = useCallback((strategy, { portfolioValue, age, retirementAge, lifeExpectancy, yearInRetirement, prevWithdrawal, prevReturn }) => {
    if (portfolioValue <= 0) return 0;
    switch (strategy) {
      case 'fixed':
        return annualSpending;
      case 'percent':
        return portfolioValue * withdrawalRate;
      case 'guardrails': {
        let wd = yearInRetirement === 0 ? annualSpending : (prevWithdrawal || annualSpending);
        if (yearInRetirement > 0 && prevReturn < 0) {
          // Skip inflation raise after down year (returns are real, so no raise = flat)
        }
        const rate = wd / portfolioValue;
        const upper = withdrawalRate * 1.2;
        const lower = withdrawalRate * 0.8;
        if (rate > upper && yearInRetirement > 0) wd *= 0.9;
        else if (rate < lower && yearInRetirement > 0) wd *= 1.1;
        return Math.min(wd, portfolioValue);
      }
      case 'vpw': {
        const remaining = Math.max(1, lifeExpectancy - age);
        const realReturn = (RISK_PROFILES[riskProfile]?.meanReturn || 5.5) / 100;
        if (realReturn === 0) return portfolioValue / remaining;
        const rate = realReturn / (1 - Math.pow(1 + realReturn, -remaining));
        return portfolioValue * rate;
      }
      case 'rmd': {
        const divisor = RMD_TABLE[age] || Math.max(1, lifeExpectancy - age);
        return portfolioValue / divisor;
      }
      case 'vanguard': {
        const target = portfolioValue * withdrawalRate;
        if (yearInRetirement === 0) return target;
        const ceiling = (prevWithdrawal || annualSpending) * 1.05;
        const floor = (prevWithdrawal || annualSpending) * 0.975;
        return Math.max(floor, Math.min(ceiling, target));
      }
      default:
        return annualSpending;
    }
  }, [annualSpending, riskProfile]);

  const lifeExpectancy = planState.profile.lifeExpectancy || 90;

  const calculateScenario = useCallback((s1RetAge, s2RetAge) => {
    const currentAge = Math.min(scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge);
    const totalYears = selectedHeatmapAge - currentAge;
    if (totalYears <= 0) return { portfolioValue: scenarioData.currentNetWorth, isViable: true };

    const r = getScenarioReturn(monteCarloScenario);
    let portfolio = scenarioData.currentNetWorth;
    const laterRet = Math.max(s1RetAge, s2RetAge);
    let prevWithdrawal = annualSpending;
    let yearInRetirement = -1;

    for (let year = 1; year <= totalYears; year++) {
      const age = currentAge + year;
      let savings = scenarioData.annualSavings * Math.pow(1 + scenarioData.savingsGrowthRate / 100, year - 1);
      const s1Retired = age >= s1RetAge;
      const s2Retired = age >= s2RetAge;
      if (s1Retired && s2Retired) savings = 0;
      else if (s1Retired || s2Retired) savings *= 0.5;

      let net = savings;
      if (s1Retired && s2Retired) {
        if (spendStrategy === 'phases') {
          let hasPhaseSpending = false;
          scenarioData.drawdownPhases.forEach(phase => {
            if (age >= laterRet && age >= phase.startAge && age <= phase.endAge) {
              net -= phase.annualAmount;
              hasPhaseSpending = true;
            }
          });
          if (!hasPhaseSpending) net -= annualSpending;
        } else {
          yearInRetirement++;
          const wd = computeWithdrawal(spendStrategy, {
            portfolioValue: portfolio, age, retirementAge: laterRet,
            lifeExpectancy, yearInRetirement, prevWithdrawal, prevReturn: r,
          });
          net -= wd;
          prevWithdrawal = wd;
        }
      }

      portfolio = portfolio * (1 + r) + net;
    }

    return { portfolioValue: portfolio, isViable: portfolio > 0 };
  }, [scenarioData, selectedHeatmapAge, monteCarloScenario, getScenarioReturn, annualSpending, spendStrategy, computeWithdrawal, lifeExpectancy]);

  const generateHeatmap = useCallback(() => {
    setIsCalculating(true);
    setTimeout(() => {
      const s1Min = scenarioData.spouse1CurrentAge;
      const s2Min = scenarioData.spouse2CurrentAge;
      const s1Max = Math.min(s1Min + 24, 75);
      const s2Max = Math.min(s2Min + 24, 75);
      const s1Ages = [];
      const s2Ages = [];
      for (let a = s1Min; a <= s1Max; a += 2) s1Ages.push(a);
      for (let a = s2Min; a <= s2Max; a += 2) s2Ages.push(a);
      const s1 = s1Ages.slice(0, 13);
      const s2 = s2Ages.slice(0, 13);

      const results = [];
      s1.forEach(age1 => {
        s2.forEach(age2 => {
          const { portfolioValue, isViable } = calculateScenario(age1, age2);
          results.push({
            spouse1RetirementAge: age1,
            spouse2RetirementAge: age2,
            portfolioValue,
            isViable,
          });
        });
      });
      setHeatmapData(results);
      setIsCalculating(false);
    }, 50);
  }, [scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge, calculateScenario]);

  useEffect(() => {
    if (scenarioData.currentNetWorth <= 0) return;
    const t = setTimeout(generateHeatmap, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scenarioData.spouse1CurrentAge, scenarioData.spouse1RetirementAge,
    scenarioData.spouse2CurrentAge, scenarioData.spouse2RetirementAge,
    scenarioData.currentNetWorth, scenarioData.annualSavings,
    scenarioData.savingsGrowthRate, scenarioData.drawdownPhases,
    selectedHeatmapAge, monteCarloScenario, expectedReturn, spendStrategy,
  ]);

  const rerunMonteCarlo = useCallback(() => {
    setIsRerunningMC(true);
    setTimeout(() => {
      try {
        const config = planState.simulationConfig;
        const currentAge = Math.min(scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge);
        const years = selectedHeatmapAge - currentAge;
        const inflationRate = config.inflationRate > 1 ? config.inflationRate / 100 : config.inflationRate || 0.025;
        const results = runMonteCarloSimulation({
          initialInvestment: scenarioData.currentNetWorth,
          years,
          annualContribution: scenarioData.annualSavings,
          savingsGrowthRate: scenarioData.savingsGrowthRate / 100,
          riskProfile: config.riskProfile || 'balanced',
          numberOfSimulations: config.numberOfSimulations || 10000,
          inflationRate,
        });
        dispatch({
          type: 'SYNC_FROM_SIMULATION',
          payload: {
            config: { ...config, initialInvestment: scenarioData.currentNetWorth, years, annualContribution: scenarioData.annualSavings },
            results,
          },
        });
        setHeatmapData([]);
      } catch (e) {
        console.error('Monte Carlo error:', e);
      } finally {
        setIsRerunningMC(false);
      }
    }, 100);
  }, [planState.simulationConfig, scenarioData, selectedHeatmapAge, dispatch]);

  const timeSeriesData = useMemo(() => {
    const currentAge = Math.min(scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge);
    const years = selectedHeatmapAge - currentAge;
    if (years <= 0) return [];

    const scenarios = ['best', 'optimistic', 'median', 'pessimistic', 'worst'];
    const returnSequences = {};
    scenarios.forEach(sc => { returnSequences[sc] = getScenarioReturnSequence(sc, years); });
    const laterRet = Math.max(scenarioData.spouse1RetirementAge, scenarioData.spouse2RetirementAge);

    const data = [{ age: currentAge, year: 0, best: scenarioData.currentNetWorth, optimistic: scenarioData.currentNetWorth, median: scenarioData.currentNetWorth, pessimistic: scenarioData.currentNetWorth, worst: scenarioData.currentNetWorth }];

    const prevWd = {};
    const retYears = {};
    scenarios.forEach(sc => { prevWd[sc] = annualSpending; retYears[sc] = -1; });

    for (let year = 1; year <= years; year++) {
      const age = currentAge + year;
      const s1Ret = age >= scenarioData.spouse1RetirementAge;
      const s2Ret = age >= scenarioData.spouse2RetirementAge;
      let savings = scenarioData.annualSavings * Math.pow(1 + scenarioData.savingsGrowthRate / 100, year - 1);
      if (s1Ret && s2Ret) savings = 0;
      else if (s1Ret || s2Ret) savings *= 0.5;

      const prev = data[year - 1];
      const row = { age, year };
      scenarios.forEach(sc => {
        const portfolioValue = prev[sc];
        const r = returnSequences[sc][year - 1];
        let net = savings;

        if (s1Ret && s2Ret) {
          if (spendStrategy === 'phases') {
            let hasPhaseSpending = false;
            scenarioData.drawdownPhases.forEach(phase => {
              if (age >= laterRet && age >= phase.startAge && age <= phase.endAge) {
                net -= phase.annualAmount;
                hasPhaseSpending = true;
              }
            });
            if (!hasPhaseSpending) net -= annualSpending;
          } else {
            retYears[sc]++;
            const wd = computeWithdrawal(spendStrategy, {
              portfolioValue, age, retirementAge: laterRet,
              lifeExpectancy, yearInRetirement: retYears[sc],
              prevWithdrawal: prevWd[sc], prevReturn: r,
            });
            net -= wd;
            prevWd[sc] = wd;
          }
        }

        row[sc] = portfolioValue * (1 + r) + net;
      });
      data.push(row);
    }
    return data;
  }, [scenarioData, selectedHeatmapAge, getScenarioReturnSequence, annualSpending, spendStrategy, computeWithdrawal, lifeExpectancy]);

  const heatmapGrid = useMemo(() => {
    if (heatmapData.length === 0) return null;
    const s1Ages = [...new Set(heatmapData.map(d => d.spouse1RetirementAge))].sort((a, b) => a - b);
    const s2Ages = [...new Set(heatmapData.map(d => d.spouse2RetirementAge))].sort((a, b) => a - b);
    const values = heatmapData.map(d => d.portfolioValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const lookup = {};
    heatmapData.forEach(d => { lookup[`${d.spouse1RetirementAge}-${d.spouse2RetirementAge}`] = d; });
    return { s1Ages, s2Ages, min, max, lookup, cols: s2Ages.length };
  }, [heatmapData]);

  const currentScenarioResult = useMemo(() => {
    return calculateScenario(scenarioData.spouse1RetirementAge, scenarioData.spouse2RetirementAge);
  }, [calculateScenario, scenarioData.spouse1RetirementAge, scenarioData.spouse2RetirementAge]);

  const laterRetAge = Math.max(scenarioData.spouse1RetirementAge, scenarioData.spouse2RetirementAge);
  const yearsToRetirement = laterRetAge - Math.min(scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge);

  return (
    <div className="max-w-full mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-terminal-green crt-glow uppercase tracking-wider">
          Retirement Analysis
        </h2>
        <p className="text-txt-secondary font-mono text-sm mt-2">
          Dual-spouse scenario modeling with Monte Carlo projections
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricBox label="Current Portfolio" value={formatCurrency(scenarioData.currentNetWorth, { compact: true })} color="terminal-green" />
        <MetricBox
          label={`Projected at ${selectedHeatmapAge}`}
          value={formatCurrency(currentScenarioResult.portfolioValue, { compact: true })}
          color={currentScenarioResult.isViable ? 'terminal-green' : 'terminal-red'}
        />
        <MetricBox label="Expected Return" value={`${expectedReturn.toFixed(1)}% real`} />
        <MetricBox
          label="MC Model"
          value={mcResults ? `${riskProfile} (${monteCarloScenario})` : 'No simulation'}
          color={mcResults ? 'terminal-cyan' : 'terminal-amber'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT: Inputs */}
        <div className="xl:col-span-4 space-y-4">

          {/* Spouse Ages */}
          <div className="terminal-card p-5">
            <h3 className="font-display font-bold text-terminal-amber uppercase tracking-wider text-xs mb-4">
              Retirement Timing
            </h3>
            <div className="space-y-4">
              <div className="bg-surface-elevated rounded p-3 border border-surface-border">
                <p className="text-terminal-cyan text-xs font-mono font-bold mb-2">{scenarioData.spouse1Name}</p>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Current Age" value={scenarioData.spouse1CurrentAge}
                    onChange={e => handleInput('spouse1CurrentAge', parseInt(e.target.value))} />
                  <NumberField label="Retirement Age" value={scenarioData.spouse1RetirementAge}
                    onChange={e => handleInput('spouse1RetirementAge', parseInt(e.target.value))} />
                </div>
              </div>
              <div className="bg-surface-elevated rounded p-3 border border-surface-border">
                <p className="text-terminal-cyan text-xs font-mono font-bold mb-2">{scenarioData.spouse2Name}</p>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Current Age" value={scenarioData.spouse2CurrentAge}
                    onChange={e => handleInput('spouse2CurrentAge', parseInt(e.target.value))} />
                  <NumberField label="Retirement Age" value={scenarioData.spouse2RetirementAge}
                    onChange={e => handleInput('spouse2RetirementAge', parseInt(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Inputs */}
          <div className="terminal-card p-5">
            <h3 className="font-display font-bold text-terminal-amber uppercase tracking-wider text-xs mb-4">
              Financial Position
            </h3>
            <div className="space-y-3">
              <MoneyField label="Current Net Worth" value={scenarioData.currentNetWorth}
                onValueChange={v => handleInput('currentNetWorth', v)} />
              <MoneyField label="Annual Savings" value={scenarioData.annualSavings}
                onValueChange={v => handleInput('annualSavings', v)} />
              <NumberField label="Savings Growth Rate (%/yr)" value={scenarioData.savingsGrowthRate} step="0.1"
                onChange={e => handleInput('savingsGrowthRate', parseFloat(e.target.value))} />
            </div>
          </div>

          {/* Analysis Controls */}
          <div className="terminal-card p-5">
            <h3 className="font-display font-bold text-terminal-amber uppercase tracking-wider text-xs mb-4">
              Analysis Settings
            </h3>
            <div className="space-y-3">
              <NumberField label="Analysis Age" value={selectedHeatmapAge}
                onChange={e => setSelectedHeatmapAge(parseInt(e.target.value))}
                hint={`Portfolio snapshot at age ${selectedHeatmapAge} (${selectedHeatmapAge - Math.min(scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge)} years)`} />
              <SelectField label="Monte Carlo Scenario" value={monteCarloScenario}
                onChange={e => setMonteCarloScenario(e.target.value)}
                hint={mcResults ? 'Linked to simulation results' : 'Run Monte Carlo for full analysis'}>
                <option value="best">Best Case (Top 1%)</option>
                <option value="optimistic">Optimistic (90th %ile)</option>
                <option value="median">Median (50th %ile)</option>
                <option value="pessimistic">Pessimistic (10th %ile)</option>
                <option value="worst">Worst Case (1st %ile)</option>
              </SelectField>
              <SelectField label={<>Spend-Down Strategy<InfoButton text="How withdrawals are calculated after both spouses retire. 'Fixed Phases' uses the custom phases below. Other strategies dynamically adjust withdrawals based on portfolio value, age, or market conditions. See the Spend-Down Planner for detailed comparisons." wide /></>} value={spendStrategy}
                onChange={e => setSpendStrategy(e.target.value)}
                hint={spendStrategy === 'phases' ? 'Using custom drawdown phases below' : `Target: ${formatCurrency(annualSpending)}/yr`}>
                {SPEND_DOWN_STRATEGIES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </SelectField>
              <button
                onClick={rerunMonteCarlo}
                disabled={isRerunningMC}
                className="w-full glow-btn glow-btn-green px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider disabled:opacity-50"
              >
                {isRerunningMC ? 'Running Simulation...' : 'Rerun Monte Carlo'}
              </button>
            </div>
          </div>

          {/* Drawdown Phases - Collapsible (only for phases strategy) */}
          {spendStrategy === 'phases' && <div className="terminal-card p-5">
            <button
              onClick={() => setShowDrawdown(!showDrawdown)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-display font-bold text-terminal-amber uppercase tracking-wider text-xs">
                Drawdown Phases ({scenarioData.drawdownPhases.length})
              </h3>
              <span className="text-terminal-amber text-xs font-mono">{showDrawdown ? '[-]' : '[+]'}</span>
            </button>

            {showDrawdown && (
              <div className="mt-4 space-y-3">
                <p className="text-txt-muted text-xs font-mono">
                  Phase 1 starts at later retirement ({laterRetAge}), ends at analysis age ({selectedHeatmapAge}).
                </p>
                {scenarioData.drawdownPhases.map((phase, i) => (
                  <div key={i} className="bg-surface-elevated rounded p-3 border border-surface-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-terminal-cyan font-bold">Phase {i + 1}</span>
                      {scenarioData.drawdownPhases.length > 1 && (
                        <button
                          onClick={() => setScenarioData(prev => ({ ...prev, drawdownPhases: prev.drawdownPhases.filter((_, j) => j !== i) }))}
                          className="text-terminal-red text-xs font-mono hover:underline"
                        >
                          [remove]
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumberField label="Start Age" value={phase.startAge} disabled={i === 0}
                        onChange={e => handleDrawdownChange(i, 'startAge', parseInt(e.target.value))} />
                      <NumberField label="End Age" value={phase.endAge}
                        onChange={e => handleDrawdownChange(i, 'endAge', parseInt(e.target.value))} />
                    </div>
                    <MoneyField label="Annual Amount" value={phase.annualAmount}
                      onValueChange={v => handleDrawdownChange(i, 'annualAmount', v)} />
                    <input
                      type="text"
                      value={phase.description}
                      onChange={e => handleDrawdownChange(i, 'description', e.target.value)}
                      className="terminal-input w-full text-xs"
                      placeholder="Description"
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const last = scenarioData.drawdownPhases[scenarioData.drawdownPhases.length - 1];
                    setScenarioData(prev => ({
                      ...prev,
                      drawdownPhases: [...prev.drawdownPhases, {
                        startAge: last?.endAge || selectedHeatmapAge,
                        endAge: Math.min((last?.endAge || selectedHeatmapAge) + 5, 95),
                        annualAmount: 100000,
                        description: 'New phase',
                      }],
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-surface-border text-terminal-green text-xs font-mono uppercase tracking-wider hover:border-terminal-dark-green transition-colors"
                >
                  + Add Phase
                </button>
              </div>
            )}
          </div>}
        </div>

        {/* RIGHT: Charts + Heatmap */}
        <div className="xl:col-span-8 space-y-6">

          {/* Portfolio Fan Chart */}
          {timeSeriesData.length > 0 && (
            <div className="terminal-card p-5">
              <h3 className="font-display font-bold text-terminal-green uppercase tracking-wider text-xs mb-4">
                Portfolio Projection — Age {Math.min(scenarioData.spouse1CurrentAge, scenarioData.spouse2CurrentAge)} to {selectedHeatmapAge}
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.08)" />
                    <XAxis dataKey="age" stroke="#6b7280" tick={{ fontSize: 11, fill: '#8b949e' }}
                      label={{ value: 'Age', position: 'insideBottom', offset: -2, style: { fill: '#8b949e', fontSize: 11 } }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 11, fill: '#8b949e' }}
                      tickFormatter={v => formatCurrency(v, { decimals: 0, compact: true })}
                      width={65} />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value, { compact: true }), name]}
                      labelFormatter={age => `Age ${age}`}
                      contentStyle={{ backgroundColor: '#161b22', border: '1px solid #1a3a1a', borderRadius: '6px', fontSize: 11, color: '#c9d1d9' }}
                    />
                    {yearsToRetirement > 0 && (
                      <ReferenceLine x={laterRetAge} stroke="#ffb000" strokeDasharray="5 5"
                        label={{ value: 'Retirement', position: 'top', fill: '#ffb000', fontSize: 10 }} />
                    )}
                    <Line type="monotone" dataKey="best" stroke="#00ff41" strokeWidth={1} strokeDasharray="6 3" dot={false} name="Best (99th %)" />
                    <Line type="monotone" dataKey="optimistic" stroke="#00cc33" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Optimistic (90th %)" />
                    <Line type="monotone" dataKey="median" stroke="#00d4ff" strokeWidth={2.5} dot={false} name="Median (50th %)" />
                    <Line type="monotone" dataKey="pessimistic" stroke="#ffb000" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Pessimistic (10th %)" />
                    <Line type="monotone" dataKey="worst" stroke="#ff073a" strokeWidth={1} strokeDasharray="6 3" dot={false} name="Worst (1st %)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Heatmap */}
          <div className="terminal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-terminal-green uppercase tracking-wider text-xs">
                  Retirement Timing Heatmap
                </h3>
                <p className="text-txt-muted text-xs font-mono mt-1">
                  Portfolio value at age {selectedHeatmapAge} by retirement age combination
                </p>
              </div>
              <button
                onClick={generateHeatmap}
                disabled={isCalculating}
                className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-terminal-amber text-xs font-mono uppercase tracking-wider hover:border-terminal-amber transition-colors disabled:opacity-50"
              >
                {isCalculating ? 'Computing...' : 'Refresh'}
              </button>
            </div>

            {heatmapGrid ? (
              <div>
                {/* Axis: Spouse 2 (columns) */}
                <div className="flex items-end mb-1">
                  <div className="flex-shrink-0" style={{ width: 52 }} />
                  <div className="flex-1 text-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-txt-secondary">
                      {scenarioData.spouse2Name} Retirement Age →
                    </span>
                  </div>
                </div>

                <div className="flex">
                  {/* Y-axis label + row labels */}
                  <div className="flex-shrink-0 flex flex-col" style={{ width: 52 }}>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-txt-secondary text-right pr-2 mb-1" style={{ height: 20 }}>
                      {scenarioData.spouse1Name} ↓
                    </div>
                    {/* Column header spacer */}
                    <div style={{ height: 18 }} />
                    {heatmapGrid.s1Ages.map(age => (
                      <div key={age} className="flex items-center justify-end pr-2" style={{ height: 36 }}>
                        <span className={`text-xs font-mono ${age === scenarioData.spouse1RetirementAge ? 'text-terminal-green font-bold' : 'text-txt-secondary'}`}>{age}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="flex-1 overflow-x-auto">
                    {/* Column headers */}
                    <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${heatmapGrid.cols}, minmax(0, 1fr))`, height: 18 }}>
                      {heatmapGrid.s2Ages.map(age => (
                        <div key={age} className="flex items-center justify-center">
                          <span className={`text-[10px] font-mono ${age === scenarioData.spouse2RetirementAge ? 'text-terminal-green font-bold' : 'text-txt-secondary'}`}>{age}</span>
                        </div>
                      ))}
                    </div>
                    {/* Cells */}
                    {heatmapGrid.s1Ages.map(s1Age => (
                      <div key={s1Age} className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${heatmapGrid.cols}, minmax(0, 1fr))`, height: 36 }}>
                        {heatmapGrid.s2Ages.map(s2Age => {
                          const cell = heatmapGrid.lookup[`${s1Age}-${s2Age}`];
                          if (!cell) return <div key={s2Age} />;
                          const isSelected = s1Age === scenarioData.spouse1RetirementAge && s2Age === scenarioData.spouse2RetirementAge;
                          const isHovered = hoveredCell === `${s1Age}-${s2Age}`;
                          return (
                            <div
                              key={s2Age}
                              className={`flex items-center justify-center rounded cursor-pointer transition-all text-white font-mono text-[10px] font-bold ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-surface-primary' : ''} ${isHovered ? 'scale-110 z-10' : ''}`}
                              style={{ backgroundColor: heatmapColor(cell.portfolioValue, heatmapGrid.min, heatmapGrid.max) }}
                              onMouseEnter={() => setHoveredCell(`${s1Age}-${s2Age}`)}
                              onMouseLeave={() => setHoveredCell(null)}
                              title={`${scenarioData.spouse1Name}: ${s1Age}, ${scenarioData.spouse2Name}: ${s2Age}\n${formatCurrency(cell.portfolioValue)}`}
                            >
                              {formatCurrency(cell.portfolioValue, { decimals: 0, compact: true })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hover tooltip */}
                {hoveredCell && heatmapGrid.lookup[hoveredCell] && (
                  <div className="mt-3 bg-surface-elevated rounded p-3 border border-surface-border">
                    <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-txt-muted uppercase text-[10px]">{scenarioData.spouse1Name} retires</span>
                        <p className="text-terminal-cyan font-bold">{heatmapGrid.lookup[hoveredCell].spouse1RetirementAge}</p>
                      </div>
                      <div>
                        <span className="text-txt-muted uppercase text-[10px]">{scenarioData.spouse2Name} retires</span>
                        <p className="text-terminal-cyan font-bold">{heatmapGrid.lookup[hoveredCell].spouse2RetirementAge}</p>
                      </div>
                      <div>
                        <span className="text-txt-muted uppercase text-[10px]">Portfolio at {selectedHeatmapAge}</span>
                        <p className={`font-bold ${heatmapGrid.lookup[hoveredCell].isViable ? 'text-terminal-green' : 'text-terminal-red'}`}>
                          {formatCurrency(heatmapGrid.lookup[hoveredCell].portfolioValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Color scale legend */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-txt-muted uppercase">Low</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden flex">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: heatmapColor(heatmapGrid.min + (heatmapGrid.max - heatmapGrid.min) * (i / 19), heatmapGrid.min, heatmapGrid.max) }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-txt-muted uppercase">High</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-txt-muted mt-1 px-8">
                  <span>{formatCurrency(heatmapGrid.min, { compact: true })}</span>
                  <span>{formatCurrency(heatmapGrid.max, { compact: true })}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                {isCalculating ? (
                  <>
                    <div className="text-terminal-green text-sm font-mono crt-glow mb-2">Computing heatmap...</div>
                    <p className="text-xs text-txt-muted font-mono">Evaluating retirement timing scenarios</p>
                  </>
                ) : (
                  <>
                    <div className="text-terminal-green text-lg font-mono crt-glow mb-2">[ AWAITING DATA ]</div>
                    <p className="text-xs text-txt-muted font-mono">Enter financial data above to generate heatmap</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedRetirementPlanner;
