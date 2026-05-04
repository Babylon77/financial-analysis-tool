/**
 * Multi-Asset Monte Carlo simulation utility for investment projections.
 * This model simulates stocks, bonds, and inflation as separate but correlated asset classes.
 * ALL returns in the engine are REAL (above inflation). Document this clearly.
 */

import { calculateGlidepath } from './calculations/advancedStrategies';

// Core financial parameters for major asset classes and economic factors
// All means are ARITHMETIC (not geometric/CAGR). The log-normal drift formula converts to geometric.
// Sources: Ibbotson SBBI 1926-2024, real (inflation-adjusted) returns.
export const ASSET_CLASS_PARAMS = {
  stocks: {
    mean: 0.09,   // 9% real arithmetic mean → ~7% CAGR after volatility drag
    stdDev: 0.18, // Annualized volatility of real equity returns
  },
  bonds: {
    meanReal: 0.025, // 2.5% real arithmetic mean for intermediate-term bonds
    stdDev: 0.07,
    inflationSensitivity: -0.5,
  },
  inflation: {
    mean: 0.03,
    stdDev: 0.04,
  },
};

export const CORRELATIONS = {
  stock_bond: -0.2,
};

// meanReturn = expected real CAGR (geometric mean) for each allocation.
// Derived from: portfolio arithmetic mean minus 0.5 * portfolio variance.
export const RISK_PROFILES = {
  conservative: { stocks: 0.30, bonds: 0.70, meanReturn: 4.0,  worstYear: -22, bestYear: 28,  maxDrawdown: -35 },
  balanced:     { stocks: 0.60, bonds: 0.40, meanReturn: 5.5,  worstYear: -33, bestYear: 38,  maxDrawdown: -45 },
  growth:       { stocks: 0.80, bonds: 0.20, meanReturn: 6.5,  worstYear: -42, bestYear: 48,  maxDrawdown: -52 },
  aggressive:   { stocks: 1.00, bonds: 0.00, meanReturn: 7.0,  worstYear: -50, bestYear: 55,  maxDrawdown: -60 },
};

// Historical validation benchmarks, kept for reference
export const HISTORICAL_VALIDATION = {
  minLongTermPortfolioReturn: -0.01, // Prevent unrealistic long-term negative real returns
  maxDrawdown: -0.60, // Cap drawdowns at a level similar to the worst historical crashes
};

/**
 * Generate a random number from a standard normal distribution
 * using the Box-Muller transform.
 * @returns {number} A random number from the standard normal distribution.
 */
const generateStandardNormal = () => {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
};

/**
 * Runs a single investment simulation path with correlated assets.
 * @param {Object} params - The simulation parameters.
 * @returns {Object} The results of the single simulation path.
 */
const runSimulationPath = ({
  initialInvestment,
  years,
  annualContribution,
  savingsGrowthRate,
  allocation,
  inflationMean,
  glidepath = null,
  spendingShocks = null,
}) => {
  // Destructure parameters for stocks, bonds, and inflation
  const { stocks: stockParams, bonds: bondParams, inflation: inflationDefaults } = ASSET_CLASS_PARAMS;
  // Allow caller to override the inflation mean; fall back to the default
  const inflationParams = {
    ...inflationDefaults,
    mean: inflationMean != null ? inflationMean : inflationDefaults.mean,
  };
  const { stock_bond: stockBondCorrelation } = CORRELATIONS;
  
  // Calculate log-normal drift for equities
  const stockDrift = Math.log(1 + stockParams.mean) - 0.5 * Math.pow(stockParams.stdDev, 2);

  // Initialize arrays to track portfolio values and returns
  const nominalYearlyValues = [initialInvestment];
  const realYearlyValues = [initialInvestment];
  const yearlyReturns = [];
  
  // State variables for the simulation loop
  let currentNominalValue = initialInvestment;
  let peakValue = initialInvestment;
  let maxDrawdown = 0;
  let cumulativeInflation = 1.0; // Track path-specific cumulative inflation
  
  // Behavioral model state variables (driven by equity performance)
  let inBullMarket = true;
  let yearsInCurrentMarket = 0;
  const bullMarketLength = Math.floor(4 + Math.random() * 4); // 4-7 years
  const bearMarketLength = Math.floor(1 + Math.random() * 2); // 1-2 years
  let consecutiveNegativeEquityYears = 0;
  
  for (let year = 1; year <= years; year++) {
    // 1. SIMULATE ECONOMIC CONDITIONS FOR THE YEAR
    // Generate independent random numbers for each factor
    const zStock = generateStandardNormal();
    const zBondInd = generateStandardNormal();
    const zInflation = generateStandardNormal();

    // Create correlated random number for bonds
    const zBond = stockBondCorrelation * zStock + Math.sqrt(1 - stockBondCorrelation ** 2) * zBondInd;

    // Simulate inflation for the year using Ornstein-Uhlenbeck mean-reversion process
    const lastInflation = year > 1 ? yearlyReturns[year - 2]?.inflation || inflationParams.mean : inflationParams.mean;
    // O-U: inflation_t = lastInflation + 0.25*(mean - lastInflation) + sigma*z
    const currentInflation = Math.max(-0.02,
      lastInflation + 0.25 * (inflationParams.mean - lastInflation) + inflationParams.stdDev * zInflation
    );
    cumulativeInflation *= (1 + currentInflation); // Update the cumulative inflation factor

    // 2. SIMULATE ASSET RETURNS
    // Use a simplified behavioral model based on equity market cycles
    yearsInCurrentMarket++;
    if (inBullMarket && yearsInCurrentMarket > bullMarketLength) {
      inBullMarket = false;
      yearsInCurrentMarket = 1;
    } else if (!inBullMarket && yearsInCurrentMarket > bearMarketLength) {
      inBullMarket = true;
      yearsInCurrentMarket = 1;
    }
    
    // Equities drive the behavioral cycle - much smaller adjustments
    const regimeAdjustment = inBullMarket ? 0.005 : -0.005; // Reduced from ±2% to ±0.5%
    let stockReturnDrift = stockDrift + regimeAdjustment;
    let stockReturn;

    // Generate base stock return using log-normal distribution
    stockReturn = Math.exp(stockReturnDrift + stockParams.stdDev * zStock) - 1;

    // --- MINIMAL BEHAVIORAL ADJUSTMENTS ---

    // Prevent unrealistic consecutive crashes (but don't artificially boost returns)
    if (consecutiveNegativeEquityYears > 2 && stockReturn < -0.20) {
      stockReturn = -0.05 - Math.random() * 0.10; // Small loss instead of severe loss
      consecutiveNegativeEquityYears = 0;
    }
    
    // Update behavioral trackers
    if (stockReturn < -0.15) {
      consecutiveNegativeEquityYears++;
    } else {
      consecutiveNegativeEquityYears = 0;
    }
    // Cap extreme single-year returns to historical bounds
    stockReturn = Math.max(-0.50, Math.min(0.60, stockReturn));

    // Bond return is purely REAL (no inflation added to drift), consistent with stock returns
    const expectedBondReturn = bondParams.meanReal;
    const bondDrift = Math.log(1 + expectedBondReturn) - 0.5 * bondParams.stdDev ** 2;
    let bondReturn = Math.exp(bondDrift + bondParams.stdDev * zBond) - 1;

    // Adjust for inflation surprise (unexpected inflation hurts real bond returns)
    const inflationSurprise = currentInflation - inflationParams.mean;
    bondReturn += inflationSurprise * bondParams.inflationSensitivity;
    bondReturn = Math.max(-0.20, Math.min(0.30, bondReturn));

    // 3. CALCULATE PORTFOLIO RETURN (on existing balance only)
    let stockPct = allocation.stocks;
    let bondPct = allocation.bonds;
    if (glidepath && year >= (glidepath.retirementYear || 0)) {
      const glideYear = year - (glidepath.retirementYear || 0);
      stockPct = calculateGlidepath({
        startStockPct: glidepath.startStockPct,
        endStockPct: glidepath.endStockPct,
        glidepathYears: glidepath.glidepathYears,
        currentYear: glideYear,
      });
      bondPct = 1 - stockPct;
    }
    const portfolioReturn = (stockReturn * stockPct) + (bondReturn * bondPct);

    // Apply investment returns to current portfolio value
    currentNominalValue *= (1 + portfolioReturn);

    // Subtract any spending shocks for this year
    currentNominalValue -= (spendingShocks?.[year] || 0);

    // THEN add annual contribution at the END of the year (growing over time)
    // This ensures contributions don't affect the return calculation
    if (annualContribution > 0) {
      const growingContribution = annualContribution * Math.pow(1 + savingsGrowthRate, year - 1);
      currentNominalValue += growingContribution;
    }
    
    // Store this year's results
    yearlyReturns.push({ portfolio: portfolioReturn, stock: stockReturn, bond: bondReturn, inflation: currentInflation });
    // Calculate real (inflation-adjusted) value using the path's dynamic cumulative inflation
    const realValue = currentNominalValue / cumulativeInflation;

    // Update drawdown
    peakValue = Math.max(peakValue, currentNominalValue);
    maxDrawdown = Math.min(maxDrawdown, (currentNominalValue - peakValue) / peakValue);
    
    nominalYearlyValues.push(currentNominalValue);
    realYearlyValues.push(realValue);
  }
  
  // Final calculations for the path
  const finalNominalValue = nominalYearlyValues[years];
  const finalRealValue = realYearlyValues[years];
  
  // Calculate CAGR based on investment returns only (excluding contribution effects)
  // Since both stock and bond returns are REAL, this is a true real CAGR
  const totalPortfolioReturn = yearlyReturns.reduce((product, yearData) => product * (1 + yearData.portfolio), 1);
  const realCAGR = Math.pow(totalPortfolioReturn, 1 / years) - 1;

  // Nominal CAGR uses the input inflation mean, not this path's random inflation
  const nominalCAGR = (1 + realCAGR) * (1 + inflationParams.mean) - 1;

  // Apply a guardrail for long-term returns to prevent unrealistic scenarios
  if (years >= 20 && realCAGR < HISTORICAL_VALIDATION.minLongTermPortfolioReturn) {
    const adjustmentFactor = Math.pow(1 + HISTORICAL_VALIDATION.minLongTermPortfolioReturn, years) / Math.pow(1 + realCAGR, years);
    return {
      finalNominalValue: finalNominalValue * adjustmentFactor,
      finalRealValue: finalRealValue * adjustmentFactor,
      nominalCAGR: nominalCAGR, // Keep original for analysis
      realCAGR: HISTORICAL_VALIDATION.minLongTermPortfolioReturn,
      wasAdjusted: true,
      maxDrawdown, // Track actual path drawdown (not floored by historical validation)
      nominalYearlyValues,
      realYearlyValues,
      yearlyReturns: yearlyReturns.map(r => r.portfolio),
    };
  }
  
  return {
    finalNominalValue,
    finalRealValue,
    nominalCAGR,
    realCAGR,
    wasAdjusted: false,
    maxDrawdown, // Track actual path drawdown (not floored by historical validation)
    nominalYearlyValues,
    realYearlyValues,
    yearlyReturns: yearlyReturns.map(r => r.portfolio),
  };
};

/**
 * Runs a complete Monte Carlo simulation with multiple paths.
 * @param {Object} params - The simulation parameters.
 * @returns {Object} The aggregated simulation results.
 */
export const runMonteCarloSimulation = ({
  initialInvestment = 100000,
  years = 30,
  annualContribution = 0,
  savingsGrowthRate = 0,
  riskProfile = 'balanced',
  numberOfSimulations = 10000,
  inflationRate, // Used as the mean for stochastic inflation (O-U process center)
  startingAge = 25, // Starting age for time series display
  glidepath = null, // { startStockPct, endStockPct, glidepathYears, retirementYear }
  spendingShocks = null, // Array of per-year shock amounts indexed by year
}) => {
  // Get the asset allocation for the selected risk profile
  const allocation = RISK_PROFILES[riskProfile];
  if (!allocation) {
    throw new Error(`Invalid risk profile: ${riskProfile}`);
  }

  // Use inflationRate as the inflation mean if provided, otherwise engine default (~3%)
  const inflationMean = inflationRate != null ? inflationRate : undefined;

  const allSimulations = [];
  for (let i = 0; i < numberOfSimulations; i++) {
    const path = runSimulationPath({
      initialInvestment,
      years,
      annualContribution,
      savingsGrowthRate,
      allocation,
      inflationMean,
      glidepath,
      spendingShocks,
    });
    allSimulations.push(path);
  }

  // --- AGGREGATE RESULTS ---
  const nominalFinalValueSorted = [...allSimulations].sort((a, b) => a.finalNominalValue - b.finalNominalValue);
  const drawdownSorted = [...allSimulations].sort((a, b) => a.maxDrawdown - b.maxDrawdown);
  
  // Calculate percentile paths
  const p1Index = Math.max(0, Math.floor(numberOfSimulations * 0.01) - 1);
  const p10Index = Math.max(0, Math.floor(numberOfSimulations * 0.1) - 1);
  const p25Index = Math.max(0, Math.floor(numberOfSimulations * 0.25) - 1);
  const medianIndex = Math.floor(numberOfSimulations / 2);
  const p75Index = Math.min(numberOfSimulations - 1, Math.floor(numberOfSimulations * 0.75));
  const p90Index = Math.min(numberOfSimulations - 1, Math.floor(numberOfSimulations * 0.9));
  const p99Index = Math.min(numberOfSimulations - 1, Math.floor(numberOfSimulations * 0.99));

  const p1Case = nominalFinalValueSorted[p1Index];
  const p10Case = nominalFinalValueSorted[p10Index];
  const p25Case = nominalFinalValueSorted[p25Index];
  const medianCase = nominalFinalValueSorted[medianIndex];
  const p75Case = nominalFinalValueSorted[p75Index];
  const p90Case = nominalFinalValueSorted[p90Index];
  const p99Case = nominalFinalValueSorted[p99Index];
  const worstAbsoluteCase = nominalFinalValueSorted[0];

  // Aggregate statistics
  const avgAnnualReturn = allSimulations.reduce((sum, s) => sum + (s.yearlyReturns.reduce((a, b) => a + b, 0) / s.yearlyReturns.length), 0) / numberOfSimulations;
  const avgMaxDrawdown = allSimulations.reduce((sum, s) => sum + s.maxDrawdown, 0) / numberOfSimulations;
  
  // Collect a sample of paths for background visualization
  const allPaths = [];
  const maxPathsToStore = Math.min(500, numberOfSimulations);
  const pathStep = Math.max(1, Math.floor(numberOfSimulations / maxPathsToStore));
  for (let i = 0; i < numberOfSimulations; i += pathStep) {
    allPaths.push(allSimulations[i].realYearlyValues);
  }
  
  // Generate time series data for the median case for charts
  const timeSeriesData = [];
  for (let year = 0; year <= years; year++) {
    timeSeriesData.push({
      year: year,
      portfolioValue: medianCase.realYearlyValues[year] || 0,
      age: startingAge + year,
    });
  }

  // --- PREPARE FINAL RESULTS OBJECT ---
  return {
    medianPath: medianCase.realYearlyValues,
    worstPath: p1Case.realYearlyValues,
    bestPath: p99Case.realYearlyValues,
    optimisticPath: p90Case.realYearlyValues,
    
    nominalMedianPath: medianCase.nominalYearlyValues,
    nominalWorstPath: p1Case.nominalYearlyValues,
    nominalBestPath: p99Case.nominalYearlyValues,
    
    worstDrawdownPath: drawdownSorted[0].nominalYearlyValues,
    allPaths,
    timeSeriesData,
    
    yearlyReturns: {
      worst: p1Case.yearlyReturns,
      absoluteWorst: worstAbsoluteCase.yearlyReturns,
      p1: p1Case.yearlyReturns,
      p10: p10Case.yearlyReturns,
      median: medianCase.yearlyReturns,
      p90: p90Case.yearlyReturns,
      optimistic: p90Case.yearlyReturns,
      p99: p99Case.yearlyReturns,
      best: p99Case.yearlyReturns,
    },
    
    finalValues: {
      median: medianCase.finalRealValue,
      worst: p1Case.finalRealValue,
      absoluteWorst: worstAbsoluteCase.finalRealValue,
      optimistic: p90Case.finalRealValue,
      best: p99Case.finalRealValue,
    },
    
    nominalFinalValues: {
      median: medianCase.finalNominalValue,
      worst: p1Case.finalNominalValue,
      optimistic: p90Case.finalNominalValue,
      best: p99Case.finalNominalValue,
    },
    
    drawdowns: {
      average: avgMaxDrawdown,
      worst: drawdownSorted[0].maxDrawdown,
    },
    
    percentiles: {
      p1: p1Case.finalRealValue,
      p10: p10Case.finalRealValue,
      p25: p25Case.finalRealValue,
      p50: medianCase.finalRealValue,
      p75: p75Case.finalRealValue,
      p90: p90Case.finalRealValue,
      p99: p99Case.finalRealValue,
    },
    
    medianCAGR: medianCase.realCAGR,
    nominalMedianCAGR: medianCase.nominalCAGR,
    avgAnnualReturn: avgAnnualReturn,
  };
};

/**
 * Generates correlated return sequences using the full regime/correlation model.
 * Lightweight version of runSimulationPath — produces only yearly portfolio returns,
 * skipping portfolio value tracking, contributions, and drawdown calculation.
 * Includes: bull/bear regimes, stock-bond correlation, O-U inflation, inflation surprise on bonds.
 */
export function generateCorrelatedSequences({ years, riskProfile = 'balanced', inflationMean, numSims = 500 }) {
  const allocation = RISK_PROFILES[riskProfile];
  if (!allocation) throw new Error(`Invalid risk profile: ${riskProfile}`);

  const { stocks: stockParams, bonds: bondParams, inflation: inflationDefaults } = ASSET_CLASS_PARAMS;
  const inflationParams = { ...inflationDefaults, mean: inflationMean != null ? inflationMean : inflationDefaults.mean };
  const { stock_bond: stockBondCorrelation } = CORRELATIONS;
  const stockDrift = Math.log(1 + stockParams.mean) - 0.5 * stockParams.stdDev ** 2;
  const bondDrift = Math.log(1 + bondParams.meanReal) - 0.5 * bondParams.stdDev ** 2;

  const allPaths = [];

  for (let s = 0; s < numSims; s++) {
    const returns = [];
    let inBullMarket = true;
    let yearsInCurrentMarket = 0;
    const bullLen = Math.floor(4 + Math.random() * 4);
    const bearLen = Math.floor(1 + Math.random() * 2);
    let consecutiveNeg = 0;
    let lastInflation = inflationParams.mean;

    for (let y = 0; y < years; y++) {
      const zStock = generateStandardNormal();
      const zBondInd = generateStandardNormal();
      const zInflation = generateStandardNormal();
      const zBond = stockBondCorrelation * zStock + Math.sqrt(1 - stockBondCorrelation ** 2) * zBondInd;

      const currentInflation = Math.max(-0.02,
        lastInflation + 0.25 * (inflationParams.mean - lastInflation) + inflationParams.stdDev * zInflation
      );
      lastInflation = currentInflation;

      yearsInCurrentMarket++;
      if (inBullMarket && yearsInCurrentMarket > bullLen) { inBullMarket = false; yearsInCurrentMarket = 1; }
      else if (!inBullMarket && yearsInCurrentMarket > bearLen) { inBullMarket = true; yearsInCurrentMarket = 1; }

      const regimeAdj = inBullMarket ? 0.005 : -0.005;
      let stockReturn = Math.exp((stockDrift + regimeAdj) + stockParams.stdDev * zStock) - 1;

      if (consecutiveNeg > 2 && stockReturn < -0.20) { stockReturn = -0.05 - Math.random() * 0.10; consecutiveNeg = 0; }
      if (stockReturn < -0.15) consecutiveNeg++; else consecutiveNeg = 0;
      stockReturn = Math.max(-0.50, Math.min(0.60, stockReturn));

      let bondReturn = Math.exp(bondDrift + bondParams.stdDev * zBond) - 1;
      bondReturn += (currentInflation - inflationParams.mean) * bondParams.inflationSensitivity;
      bondReturn = Math.max(-0.20, Math.min(0.30, bondReturn));

      returns.push(stockReturn * allocation.stocks + bondReturn * (1 - allocation.stocks));
    }
    allPaths.push(returns);
  }

  const endValues = allPaths.map((path, idx) => {
    let val = 1;
    for (const r of path) val *= (1 + r);
    return { idx, val };
  });
  endValues.sort((a, b) => a.val - b.val);

  const pick = (pct) => allPaths[endValues[Math.floor(pct * numSims / 100)].idx];

  return {
    pessimistic: pick(10),
    median: pick(50),
    optimistic: pick(90),
    allPaths,
  };
} 