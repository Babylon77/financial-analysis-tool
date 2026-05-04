/* eslint-disable no-restricted-globals */

// Web Worker for running Monte Carlo simulations off the main thread.
// CRA doesn't support ES module workers, so this is a self-contained
// copy of the core simulation logic. The public API mirrors
// enhancedMonteCarloSimulation.runEnhancedMonteCarloSimulation.

const ASSET_CLASS_PARAMS = {
  stocks: { mean: 0.095, stdDev: 0.18 },
  bonds: { meanReal: 0.015, stdDev: 0.07, inflationSensitivity: -0.5 },
  inflation: { mean: 0.03, stdDev: 0.04 },
};

const CORRELATIONS = { stock_bond: -0.2 };

const RISK_PROFILES = {
  conservative: { stocks: 0.40, bonds: 0.60 },
  balanced:     { stocks: 0.60, bonds: 0.40 },
  growth:       { stocks: 0.80, bonds: 0.20 },
  aggressive:   { stocks: 1.00, bonds: 0.00 },
};

const ACCOUNT_TYPES = {
  TRADITIONAL_401K: 'traditional401k',
  TRADITIONAL_IRA: 'traditionalIRA',
  ROTH_401K: 'roth401k',
  ROTH_IRA: 'rothIRA',
  HSA: 'hsa',
  TAXABLE: 'taxable',
};

const TAX_DEFERRED = [ACCOUNT_TYPES.TRADITIONAL_401K, ACCOUNT_TYPES.TRADITIONAL_IRA];
const TAX_FREE = [ACCOUNT_TYPES.ROTH_401K, ACCOUNT_TYPES.ROTH_IRA, ACCOUNT_TYPES.HSA];
const TAXABLE_ACCTS = [ACCOUNT_TYPES.TAXABLE];

// Simplified RMD table (Uniform Lifetime)
const RMD_TABLE = {
  73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
  81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7,
  89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
};

function generateStandardNormal() {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function generateYearlyReturns(allocation, prevInflation) {
  const { stocks: sp, bonds: bp, inflation: ip } = ASSET_CLASS_PARAMS;
  const zStock = generateStandardNormal();
  const zBondInd = generateStandardNormal();
  const zInflation = generateStandardNormal();
  const zBond = CORRELATIONS.stock_bond * zStock + Math.sqrt(1 - CORRELATIONS.stock_bond ** 2) * zBondInd;

  const inflation = ip.mean + ip.stdDev * zInflation + (ip.mean - prevInflation) * 0.25;
  const stockDrift = Math.log(1 + sp.mean) - 0.5 * sp.stdDev ** 2;
  let stockReturn = Math.exp(stockDrift + sp.stdDev * zStock) - 1;
  if (Math.random() < 0.008) stockReturn = -0.25 - Math.random() * 0.15;
  stockReturn = Math.max(-0.50, stockReturn);

  const bondDrift = Math.log(1 + bp.meanReal + inflation) - 0.5 * bp.stdDev ** 2;
  let bondReturn = Math.exp(bondDrift + bp.stdDev * zBond) - 1;
  bondReturn += (inflation - ip.mean) * bp.inflationSensitivity;

  const portfolioReturn = stockReturn * allocation.stocks + bondReturn * allocation.bonds;
  return { portfolioReturn, inflation };
}

function applyTaxDrag(type, grossReturn) {
  if (!TAXABLE_ACCTS.includes(type)) return grossReturn;
  const dividendTax = 0.018 * 0.15; // ~15% on dividends
  const turnoverTax = Math.max(0, grossReturn) * 0.10 * 0.15; // ~15% on 10% turnover
  return grossReturn - dividendTax - turnoverTax;
}

function totalBalance(accounts) {
  return Object.values(accounts).reduce((s, v) => s + (v || 0), 0);
}

function runPath({ accounts, years, annualContributions, savingsGrowthRate, allocation, withdrawalPlan, rothConversions, currentAge }) {
  const balances = {};
  for (const type of Object.values(ACCOUNT_TYPES)) balances[type] = accounts[type] || 0;

  const snapshots = [totalBalance(balances)];
  const returns = [];
  let cumulativeInflation = 1.0;
  let prevInflation = ASSET_CLASS_PARAMS.inflation.mean;
  let ruined = false;
  let ruinYear = null;

  for (let year = 1; year <= years; year++) {
    const age = currentAge + year;
    const { portfolioReturn, inflation } = generateYearlyReturns(allocation, prevInflation);
    prevInflation = inflation;
    cumulativeInflation *= (1 + inflation);

    for (const type of Object.values(ACCOUNT_TYPES)) {
      if (balances[type] <= 0) continue;
      balances[type] *= (1 + applyTaxDrag(type, portfolioReturn));
    }

    if (annualContributions && !withdrawalPlan) {
      const gf = Math.pow(1 + savingsGrowthRate, year - 1);
      for (const [type, amt] of Object.entries(annualContributions)) {
        if (amt > 0) balances[type] = (balances[type] || 0) + amt * gf;
      }
    }

    if (age >= 73) {
      for (const type of TAX_DEFERRED) {
        if (balances[type] > 0) {
          const period = RMD_TABLE[Math.min(age, 95)] || 8.9;
          balances[type] -= balances[type] / period;
        }
      }
    }

    if (rothConversions && rothConversions[year]) {
      const conv = Math.min(rothConversions[year], balances[ACCOUNT_TYPES.TRADITIONAL_IRA] || 0);
      if (conv > 0) {
        balances[ACCOUNT_TYPES.TRADITIONAL_IRA] -= conv;
        balances[ACCOUNT_TYPES.ROTH_IRA] += conv;
      }
    }

    if (withdrawalPlan && withdrawalPlan[year]) {
      let remaining = withdrawalPlan[year];
      const order = [...TAXABLE_ACCTS, ACCOUNT_TYPES.HSA, ...TAX_DEFERRED, ...TAX_FREE.filter(t => t !== ACCOUNT_TYPES.HSA)];
      for (const type of order) {
        if (remaining <= 0) break;
        const w = Math.min(remaining, balances[type] || 0);
        balances[type] -= w;
        remaining -= w;
      }
      if (remaining > 0 && !ruined) { ruined = true; ruinYear = year; }
    }

    snapshots.push(totalBalance(balances));
    returns.push(portfolioReturn);
  }

  const finalTotal = totalBalance(balances);
  const totalReturn = returns.reduce((p, r) => p * (1 + r), 1);
  const cagr = Math.pow(totalReturn, 1 / years) - 1;

  return { snapshots, returns, finalTotal, realFinalTotal: finalTotal / cumulativeInflation, cagr, ruined, ruinYear };
}

function runSimulation(params) {
  const {
    accounts = {}, years = 30, annualContributions = null, savingsGrowthRate = 0,
    riskProfile = 'balanced', numberOfSimulations = 5000, withdrawalPlan = null,
    rothConversions = null, currentAge = 45,
  } = params;

  const allocation = RISK_PROFILES[riskProfile];
  if (!allocation) throw new Error(`Invalid risk profile: ${riskProfile}`);

  const allPaths = [];
  for (let i = 0; i < numberOfSimulations; i++) {
    allPaths.push(runPath({
      accounts, years, annualContributions, savingsGrowthRate, allocation,
      withdrawalPlan, rothConversions, currentAge,
    }));
  }

  allPaths.sort((a, b) => a.finalTotal - b.finalTotal);
  const idx = (pct) => Math.max(0, Math.min(numberOfSimulations - 1, Math.floor(numberOfSimulations * pct)));

  const ruined = allPaths.filter(p => p.ruined);

  const samplePaths = [];
  const step = Math.max(1, Math.floor(numberOfSimulations / Math.min(200, numberOfSimulations)));
  for (let i = 0; i < numberOfSimulations; i += step) samplePaths.push(allPaths[i].snapshots);

  return {
    percentiles: {
      p1: allPaths[idx(0.01)].finalTotal,
      p10: allPaths[idx(0.10)].finalTotal,
      p25: allPaths[idx(0.25)].finalTotal,
      p50: allPaths[idx(0.50)].finalTotal,
      p75: allPaths[idx(0.75)].finalTotal,
      p90: allPaths[idx(0.90)].finalTotal,
      p99: allPaths[idx(0.99)].finalTotal,
    },
    realPercentiles: {
      p1: allPaths[idx(0.01)].realFinalTotal,
      p10: allPaths[idx(0.10)].realFinalTotal,
      p25: allPaths[idx(0.25)].realFinalTotal,
      p50: allPaths[idx(0.50)].realFinalTotal,
      p75: allPaths[idx(0.75)].realFinalTotal,
      p90: allPaths[idx(0.90)].realFinalTotal,
      p99: allPaths[idx(0.99)].realFinalTotal,
    },
    medianPath: allPaths[idx(0.50)].snapshots,
    samplePaths,
    probabilityOfRuin: ruined.length / numberOfSimulations,
    ruinStatistics: {
      count: ruined.length,
      total: numberOfSimulations,
      medianRuinYear: ruined.length > 0 ? ruined.sort((a, b) => a.ruinYear - b.ruinYear)[Math.floor(ruined.length / 2)].ruinYear : null,
    },
    avgCagr: allPaths.reduce((s, p) => s + p.cagr, 0) / numberOfSimulations,
    medianCagr: allPaths[idx(0.50)].cagr,
    yearlyReturns: {
      p1: allPaths[idx(0.01)].returns,
      p10: allPaths[idx(0.10)].returns,
      median: allPaths[idx(0.50)].returns,
      p90: allPaths[idx(0.90)].returns,
      p99: allPaths[idx(0.99)].returns,
    },
  };
}

// Worker message handler
self.onmessage = function(e) {
  try {
    const result = runSimulation(e.data);
    self.postMessage({ type: 'result', data: result });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};
