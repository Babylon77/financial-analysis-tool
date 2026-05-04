/**
 * Enhanced Monte Carlo simulation with multi-account tracking,
 * tax drag modeling, and sequence-of-returns risk analysis.
 *
 * This augments the base monteCarloSimulation.js — the original engine
 * remains for the Asset Allocation Planner. This enhanced version powers
 * the Accumulation and Spend-Down planners.
 */

import { ASSET_CLASS_PARAMS, CORRELATIONS, RISK_PROFILES } from './monteCarloSimulation';
import { calculateFederalIncomeTax, calculateCapitalGainsTax, calculateRMD } from './calculations/taxEngine';

// ── Account Types ──

export const ACCOUNT_TYPES = {
  TRADITIONAL_401K: 'traditional401k',
  TRADITIONAL_IRA: 'traditionalIRA',
  ROTH_401K: 'roth401k',
  ROTH_IRA: 'rothIRA',
  HSA: 'hsa',
  TAXABLE: 'taxable',
};

const TAX_DEFERRED = [ACCOUNT_TYPES.TRADITIONAL_401K, ACCOUNT_TYPES.TRADITIONAL_IRA];
const TAX_FREE = [ACCOUNT_TYPES.ROTH_401K, ACCOUNT_TYPES.ROTH_IRA, ACCOUNT_TYPES.HSA];
const TAXABLE = [ACCOUNT_TYPES.TAXABLE];

// ── Random Number Generation ──

const generateStandardNormal = () => {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
};

// ── Generate Correlated Returns for One Year ──

function generateYearlyReturns(allocation, prevInflation) {
  const { stocks: stockParams, bonds: bondParams, inflation: inflationParams } = ASSET_CLASS_PARAMS;
  const { stock_bond: stockBondCorrelation } = CORRELATIONS;

  const zStock = generateStandardNormal();
  const zBondInd = generateStandardNormal();
  const zInflation = generateStandardNormal();
  const zBond = stockBondCorrelation * zStock + Math.sqrt(1 - stockBondCorrelation ** 2) * zBondInd;

  const inflationMeanReversion = (inflationParams.mean - prevInflation) * 0.25;
  const currentInflation = inflationParams.mean + inflationParams.stdDev * zInflation + inflationMeanReversion;

  const stockDrift = Math.log(1 + stockParams.mean) - 0.5 * Math.pow(stockParams.stdDev, 2);
  let stockReturn = Math.exp(stockDrift + stockParams.stdDev * zStock) - 1;

  // Crash modeling
  if (Math.random() < 0.008) {
    stockReturn = -0.25 - Math.random() * 0.15;
  }
  stockReturn = Math.max(-0.50, stockReturn);

  const expectedBondReturn = bondParams.meanReal + currentInflation;
  const bondDrift = Math.log(1 + expectedBondReturn) - 0.5 * bondParams.stdDev ** 2;
  let bondReturn = Math.exp(bondDrift + bondParams.stdDev * zBond) - 1;
  const inflationSurprise = currentInflation - inflationParams.mean;
  bondReturn += inflationSurprise * bondParams.inflationSensitivity;

  const portfolioReturn = (stockReturn * allocation.stocks) + (bondReturn * allocation.bonds);

  return { stockReturn, bondReturn, portfolioReturn, inflation: currentInflation };
}

// ── Tax Drag by Account Type ──

function applyTaxDrag(accountType, grossReturn, filingStatus) {
  if (TAX_FREE.includes(accountType)) return grossReturn;
  if (TAX_DEFERRED.includes(accountType)) return grossReturn; // tax deferred until withdrawal

  // Taxable accounts: annual tax on dividends, interest, and realized gains
  const dividendYield = 0.018;
  const turnoverRate = 0.10;
  const realizedGainRate = Math.max(0, grossReturn) * turnoverRate;

  const dividendTax = calculateCapitalGainsTax({
    longTermGains: dividendYield,
    ordinaryIncome: 0,
    filingStatus,
  }).tax;

  const gainTax = calculateCapitalGainsTax({
    longTermGains: realizedGainRate,
    ordinaryIncome: 0,
    filingStatus,
  }).tax;

  return grossReturn - dividendTax - gainTax;
}

// ── Single Enhanced Simulation Path ──

function runEnhancedPath({
  accounts,
  years,
  annualContributions,
  savingsGrowthRate,
  allocation,
  filingStatus,
  withdrawalPlan,
  rothConversions,
  currentAge,
}) {
  // Deep clone accounts
  let balances = {};
  for (const type of Object.values(ACCOUNT_TYPES)) {
    balances[type] = accounts[type] || 0;
  }

  const yearlySnapshots = [{ ...balances, total: totalBalance(balances), age: currentAge }];
  const yearlyReturns = [];
  let cumulativeInflation = 1.0;
  let prevInflation = ASSET_CLASS_PARAMS.inflation.mean;
  let portfolioRuined = false;
  let ruinYear = null;

  for (let year = 1; year <= years; year++) {
    const age = currentAge + year;
    const { stockReturn, bondReturn, portfolioReturn, inflation } = generateYearlyReturns(allocation, prevInflation);
    prevInflation = inflation;
    cumulativeInflation *= (1 + inflation);

    // Apply growth to each account (with tax drag for taxable)
    for (const type of Object.values(ACCOUNT_TYPES)) {
      if (balances[type] <= 0) continue;
      const effectiveReturn = applyTaxDrag(type, portfolioReturn, filingStatus);
      balances[type] *= (1 + effectiveReturn);
    }

    // Annual contributions (growing over time)
    if (annualContributions && !withdrawalPlan) {
      const growthFactor = Math.pow(1 + savingsGrowthRate, year - 1);
      for (const [type, amount] of Object.entries(annualContributions)) {
        if (amount > 0) {
          balances[type] = (balances[type] || 0) + amount * growthFactor;
        }
      }
    }

    // RMD (for ages 73+)
    if (age >= 73) {
      for (const type of TAX_DEFERRED) {
        if (balances[type] > 0) {
          const { rmdAmount } = calculateRMD({ accountBalance: balances[type], age });
          balances[type] -= rmdAmount;
        }
      }
    }

    // Roth conversions
    if (rothConversions && rothConversions[year]) {
      const conversionAmount = Math.min(rothConversions[year], balances[ACCOUNT_TYPES.TRADITIONAL_IRA] || 0);
      if (conversionAmount > 0) {
        balances[ACCOUNT_TYPES.TRADITIONAL_IRA] -= conversionAmount;
        balances[ACCOUNT_TYPES.ROTH_IRA] += conversionAmount;
      }
    }

    // Withdrawals (spend-down phase)
    if (withdrawalPlan && withdrawalPlan[year]) {
      let remaining = withdrawalPlan[year];

      // Tax-efficient withdrawal order: taxable first, then tax-deferred, then Roth
      const withdrawalOrder = [
        ...TAXABLE,
        ACCOUNT_TYPES.HSA,
        ...TAX_DEFERRED,
        ...TAX_FREE.filter(t => t !== ACCOUNT_TYPES.HSA),
      ];

      for (const type of withdrawalOrder) {
        if (remaining <= 0) break;
        const withdrawn = Math.min(remaining, balances[type] || 0);
        balances[type] -= withdrawn;
        remaining -= withdrawn;
      }

      if (remaining > 0 && !portfolioRuined) {
        portfolioRuined = true;
        ruinYear = year;
      }
    }

    const total = totalBalance(balances);
    yearlySnapshots.push({ ...balances, total, age });
    yearlyReturns.push(portfolioReturn);
  }

  const finalTotal = totalBalance(balances);
  const realFinalTotal = finalTotal / cumulativeInflation;

  // CAGR calculation
  const initialTotal = totalBalance(accounts);
  const totalReturn = yearlyReturns.reduce((prod, r) => prod * (1 + r), 1);
  const cagr = Math.pow(totalReturn, 1 / years) - 1;

  return {
    yearlySnapshots,
    yearlyReturns,
    finalTotal,
    realFinalTotal,
    cagr,
    portfolioRuined,
    ruinYear,
    accountBreakdown: { ...balances },
  };
}

function totalBalance(accounts) {
  return Object.values(accounts).reduce((sum, v) => sum + (v || 0), 0);
}

// ── Main Enhanced Simulation Runner ──

export function runEnhancedMonteCarloSimulation({
  accounts = {},
  years = 30,
  annualContributions = null,
  savingsGrowthRate = 0,
  riskProfile = 'balanced',
  numberOfSimulations = 5000,
  filingStatus = 'married_filing_jointly',
  withdrawalPlan = null,
  rothConversions = null,
  currentAge = 45,
}) {
  const allocation = RISK_PROFILES[riskProfile];
  if (!allocation) throw new Error(`Invalid risk profile: ${riskProfile}`);

  const allPaths = [];
  for (let i = 0; i < numberOfSimulations; i++) {
    allPaths.push(runEnhancedPath({
      accounts,
      years,
      annualContributions,
      savingsGrowthRate,
      allocation,
      filingStatus,
      withdrawalPlan,
      rothConversions,
      currentAge,
    }));
  }

  // Sort by final total
  allPaths.sort((a, b) => a.finalTotal - b.finalTotal);

  const idx = (pct) => Math.max(0, Math.min(numberOfSimulations - 1, Math.floor(numberOfSimulations * pct)));

  const p1 = allPaths[idx(0.01)];
  const p10 = allPaths[idx(0.10)];
  const p25 = allPaths[idx(0.25)];
  const median = allPaths[idx(0.50)];
  const p75 = allPaths[idx(0.75)];
  const p90 = allPaths[idx(0.90)];
  const p99 = allPaths[idx(0.99)];

  // Probability of ruin
  const ruinedPaths = allPaths.filter(p => p.portfolioRuined);
  const probabilityOfRuin = ruinedPaths.length / numberOfSimulations;

  // Safe withdrawal rates at various confidence levels
  const safeWithdrawalRates = withdrawalPlan
    ? calculateSafeRates(allPaths, numberOfSimulations)
    : null;

  // Average CAGR
  const avgCagr = allPaths.reduce((sum, p) => sum + p.cagr, 0) / numberOfSimulations;

  // Time series for median path (account-level detail)
  const medianTimeSeries = median.yearlySnapshots.map((snap, i) => ({
    year: i,
    age: snap.age,
    total: snap.total,
    traditional401k: snap[ACCOUNT_TYPES.TRADITIONAL_401K] || 0,
    traditionalIRA: snap[ACCOUNT_TYPES.TRADITIONAL_IRA] || 0,
    roth401k: snap[ACCOUNT_TYPES.ROTH_401K] || 0,
    rothIRA: snap[ACCOUNT_TYPES.ROTH_IRA] || 0,
    hsa: snap[ACCOUNT_TYPES.HSA] || 0,
    taxable: snap[ACCOUNT_TYPES.TAXABLE] || 0,
  }));

  // Sample paths for fan chart
  const samplePaths = [];
  const maxSample = Math.min(200, numberOfSimulations);
  const step = Math.max(1, Math.floor(numberOfSimulations / maxSample));
  for (let i = 0; i < numberOfSimulations; i += step) {
    samplePaths.push(allPaths[i].yearlySnapshots.map(s => s.total));
  }

  return {
    percentiles: {
      p1: p1.finalTotal,
      p10: p10.finalTotal,
      p25: p25.finalTotal,
      p50: median.finalTotal,
      p75: p75.finalTotal,
      p90: p90.finalTotal,
      p99: p99.finalTotal,
    },
    realPercentiles: {
      p1: p1.realFinalTotal,
      p10: p10.realFinalTotal,
      p25: p25.realFinalTotal,
      p50: median.realFinalTotal,
      p75: p75.realFinalTotal,
      p90: p90.realFinalTotal,
      p99: p99.realFinalTotal,
    },
    medianPath: median.yearlySnapshots.map(s => s.total),
    medianTimeSeries,
    medianAccountBreakdown: median.accountBreakdown,
    samplePaths,

    probabilityOfRuin,
    ruinStatistics: {
      count: ruinedPaths.length,
      total: numberOfSimulations,
      medianRuinYear: ruinedPaths.length > 0
        ? ruinedPaths.sort((a, b) => a.ruinYear - b.ruinYear)[Math.floor(ruinedPaths.length / 2)].ruinYear
        : null,
    },
    safeWithdrawalRates,

    avgCagr,
    medianCagr: median.cagr,

    yearlyReturns: {
      p1: p1.yearlyReturns,
      p10: p10.yearlyReturns,
      median: median.yearlyReturns,
      p90: p90.yearlyReturns,
      p99: p99.yearlyReturns,
    },
  };
}

// ── Safe Withdrawal Rate Calculator ──

function calculateSafeRates(sortedPaths, total) {
  const confidenceLevels = [0.80, 0.85, 0.90, 0.95, 0.99];
  const rates = {};

  for (const level of confidenceLevels) {
    const successNeeded = Math.ceil(total * level);
    const successCount = sortedPaths.filter(p => !p.portfolioRuined).length;
    rates[`${Math.round(level * 100)}pct`] = successCount >= successNeeded;
  }

  return rates;
}

// ── Sequence-of-Returns Risk Analysis ──

export function analyzeSequenceRisk({
  accounts,
  annualWithdrawal,
  years = 30,
  riskProfile = 'balanced',
  numberOfSimulations = 5000,
  filingStatus = 'married_filing_jointly',
  currentAge = 65,
}) {
  // Build a flat withdrawal plan
  const withdrawalPlan = {};
  for (let y = 1; y <= years; y++) {
    withdrawalPlan[y] = annualWithdrawal;
  }

  const results = runEnhancedMonteCarloSimulation({
    accounts,
    years,
    riskProfile,
    numberOfSimulations,
    filingStatus,
    withdrawalPlan,
    currentAge,
  });

  // Test multiple withdrawal rates
  const rateTests = [];
  for (let rate = 0.02; rate <= 0.08; rate += 0.005) {
    const totalStart = Object.values(accounts).reduce((s, v) => s + (v || 0), 0);
    const annualAmount = totalStart * rate;
    const testPlan = {};
    for (let y = 1; y <= years; y++) testPlan[y] = annualAmount;

    const testResult = runEnhancedMonteCarloSimulation({
      accounts,
      years,
      riskProfile,
      numberOfSimulations: Math.min(2000, numberOfSimulations),
      filingStatus,
      withdrawalPlan: testPlan,
      currentAge,
    });

    rateTests.push({
      rate: Math.round(rate * 1000) / 10,
      probabilityOfRuin: testResult.probabilityOfRuin,
      successRate: 1 - testResult.probabilityOfRuin,
      medianFinalValue: testResult.percentiles.p50,
    });
  }

  return {
    baselineResults: results,
    rateTests,
    safeRate95: findSafeRate(rateTests, 0.95),
    safeRate90: findSafeRate(rateTests, 0.90),
    safeRate80: findSafeRate(rateTests, 0.80),
  };
}

function findSafeRate(rateTests, targetSuccess) {
  for (let i = rateTests.length - 1; i >= 0; i--) {
    if (rateTests[i].successRate >= targetSuccess) return rateTests[i].rate;
  }
  return rateTests[0]?.rate || 0;
}
