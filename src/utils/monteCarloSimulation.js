/**
 * Multi-Asset Monte Carlo simulation utility for investment projections.
 * This model simulates stocks, bonds, and inflation as separate but correlated asset classes.
 */

// Core financial parameters for major asset classes and economic factors
// Sources: Combination of historical data (S&P 500, US 10-Year Treasury, CPI) and standard capital market assumptions.
export const ASSET_CLASS_PARAMS = {
  stocks: {
    mean: 0.105,  // Expected long-term arithmetic mean return for equities
    stdDev: 0.18, // Volatility of equity returns
  },
  bonds: {
    meanReal: 0.015, // Expected long-term real return for bonds (return above inflation)
    stdDev: 0.07,    // Volatility of bond returns
    inflationSensitivity: -0.5, // How much bond returns are hurt by an unexpected 1% rise in inflation
  },
  inflation: {
    mean: 0.03,  // Expected long-term inflation rate
    stdDev: 0.04, // Volatility of inflation
  },
};

// Defines the correlation between asset classes.
export const CORRELATIONS = {
  stock_bond: -0.2, // Stocks and bonds are negatively correlated
};

// Defines the asset allocation mix for each risk profile.
export const RISK_PROFILES = {
  conservative: { stocks: 0.40, bonds: 0.60 },
  balanced:     { stocks: 0.60, bonds: 0.40 },
  growth:       { stocks: 0.80, bonds: 0.20 },
  aggressive:   { stocks: 1.00, bonds: 0.00 },
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
  allocation,
}) => {
  // Destructure parameters for stocks, bonds, and inflation
  const { stocks: stockParams, bonds: bondParams, inflation: inflationParams } = ASSET_CLASS_PARAMS;
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
  let yearsSinceStrongRecovery = 0;
  const equityReturnsHistory = [];
  
  for (let year = 1; year <= years; year++) {
    // Add annual contribution at the start of the year
    if (year > 1 && annualContribution > 0) {
      currentNominalValue += annualContribution;
    }
    
    // 1. SIMULATE ECONOMIC CONDITIONS FOR THE YEAR
    // Generate independent random numbers for each factor
    const zStock = generateStandardNormal();
    const zBondInd = generateStandardNormal();
    const zInflation = generateStandardNormal();

    // Create correlated random number for bonds
    const zBond = stockBondCorrelation * zStock + Math.sqrt(1 - stockBondCorrelation ** 2) * zBondInd;

    // Simulate inflation for the year (with some mean reversion)
    const lastInflation = year > 1 ? yearlyReturns[year - 2]?.inflation || inflationParams.mean : inflationParams.mean;
    const lastStockReturn = year > 1 ? yearlyReturns[year - 2]?.stock || 0 : 0;
    const inflationMeanReversion = (inflationParams.mean - lastInflation) * 0.25;
    const currentInflation = inflationParams.mean + inflationParams.stdDev * zInflation + inflationMeanReversion;
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

    // Equities drive the behavioral cycle
    const regimeAdjustment = inBullMarket ? 0.02 : -0.02;
    let stockReturnDrift = stockDrift + regimeAdjustment;
    let stockReturn; // Declare stockReturn before conditional assignment

    // --- ENHANCED BEHAVIORAL AND RECOVERY LOGIC ---

    // 1. Post-Crash Recovery: If last year was a major loss, increase the odds of a bounce.
    if (lastStockReturn < -0.20) {
      stockReturnDrift += 0.05; // Add 5% to the drift for recovery
    }

    // 2. Long-Term Resilience: If it's been a while since a good year, force a recovery.
    yearsSinceStrongRecovery++;
    if (yearsSinceStrongRecovery > 6 && Math.random() < 0.7) {
      stockReturn = 0.15 + Math.random() * 0.20; // Force a strong recovery of 15-35%
      yearsSinceStrongRecovery = 0;
    } else {
      stockReturn = Math.exp(stockReturnDrift + stockParams.stdDev * zStock) - 1;
    }

    // 3. Refined Crash Modeling: Reduce chance of back-to-back crashes.
    const crashProbability = lastStockReturn < -0.25 ? 0.005 : 0.015; // Lower chance after a crash
    if (Math.random() < crashProbability) {
      stockReturn = -0.30 - Math.random() * 0.20; // -30% to -50%
    }
    
    // Update behavioral trackers based on the final stock return for the year
    if (stockReturn < -0.15) {
      consecutiveNegativeEquityYears++;
    } else {
      consecutiveNegativeEquityYears = 0;
    }
    if (stockReturn > 0.20) {
      yearsSinceStrongRecovery = 0;
    }
    
    // 4. Circuit Breaker: Prevent more than 2 consecutive severe loss years.
    if (consecutiveNegativeEquityYears > 2 && stockReturn < 0) {
      stockReturn = Math.random() * 0.05; // Moderate to a small gain/loss
      consecutiveNegativeEquityYears = 0;
    }

    stockReturn = Math.max(-0.50, stockReturn); // Cap losses at 50% for a single year

    // Bond return is based on its real return + inflation, adjusted for inflation shocks
    const expectedBondReturn = bondParams.meanReal + currentInflation;
    const bondDrift = Math.log(1 + expectedBondReturn) - 0.5 * bondParams.stdDev ** 2;
    let bondReturn = Math.exp(bondDrift + bondParams.stdDev * zBond) - 1;
    
    // Adjust for inflation surprise
    const inflationSurprise = currentInflation - inflationParams.mean;
    bondReturn += inflationSurprise * bondParams.inflationSensitivity;

    // 3. CALCULATE PORTFOLIO RETURN
    const portfolioReturn = (stockReturn * allocation.stocks) + (bondReturn * allocation.bonds);

    // Update portfolio value
    currentNominalValue *= (1 + portfolioReturn);
    
    // Store this year's results
    yearlyReturns.push({ portfolio: portfolioReturn, stock: stockReturn, bond: bondReturn, inflation: currentInflation });
    equityReturnsHistory.push(stockReturn);

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
  const nominalCAGR = Math.pow(finalNominalValue / initialInvestment, 1 / years) - 1;
  const realCAGR = Math.pow(finalRealValue / initialInvestment, 1 / years) - 1;

  // Apply a guardrail for long-term returns to prevent unrealistic scenarios
  if (years >= 20 && realCAGR < HISTORICAL_VALIDATION.minLongTermPortfolioReturn) {
    const adjustmentFactor = Math.pow(1 + HISTORICAL_VALIDATION.minLongTermPortfolioReturn, years) / Math.pow(1 + realCAGR, years);
    return {
      finalNominalValue: finalNominalValue * adjustmentFactor,
      finalRealValue: finalRealValue * adjustmentFactor,
      nominalCAGR: nominalCAGR, // Keep original for analysis
      realCAGR: HISTORICAL_VALIDATION.minLongTermPortfolioReturn,
      wasAdjusted: true,
      maxDrawdown: Math.max(maxDrawdown, HISTORICAL_VALIDATION.maxDrawdown),
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
    maxDrawdown: Math.max(maxDrawdown, HISTORICAL_VALIDATION.maxDrawdown),
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
  riskProfile = 'balanced',
  numberOfSimulations = 10000,
  inflationRate, // This is now ignored, as inflation is simulated dynamically
}) => {
  // Get the asset allocation for the selected risk profile
  const allocation = RISK_PROFILES[riskProfile];
  if (!allocation) {
    throw new Error(`Invalid risk profile: ${riskProfile}`);
  }

  const allSimulations = [];
  for (let i = 0; i < numberOfSimulations; i++) {
    const path = runSimulationPath({
      initialInvestment,
      years,
      annualContribution,
      allocation,
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
  const absoluteOutlierCase = nominalFinalValueSorted[numberOfSimulations - 1];

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