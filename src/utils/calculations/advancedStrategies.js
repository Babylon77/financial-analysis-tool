import { CAPITAL_GAINS_BRACKETS, STANDARD_DEDUCTION } from '../constants/taxConstants';

// ============================================================================
// 1. Bond Tent / Rising Equity Glidepath
// ============================================================================

export function calculateGlidepath({
  startStockPct = 0.30,
  endStockPct = 0.70,
  glidepathYears = 15,
  currentYear = 0,
}) {
  if (currentYear >= glidepathYears) return endStockPct;
  const progress = currentYear / glidepathYears;
  return startStockPct + (endStockPct - startStockPct) * progress;
}

// ============================================================================
// 2. Tax-Gain Harvesting Calculator
// ============================================================================

export function calculateTaxGainHarvestingOpportunity({
  ordinaryIncome,
  filingStatus = 'married_filing_jointly',
}) {
  const standardDed = typeof STANDARD_DEDUCTION[filingStatus] === 'object'
    ? STANDARD_DEDUCTION[filingStatus].amount
    : STANDARD_DEDUCTION[filingStatus];
  const taxableIncome = Math.max(0, ordinaryIncome - standardDed);
  const zeroRateCeiling = CAPITAL_GAINS_BRACKETS[filingStatus][0].max;
  const harvestableGains = Math.max(0, zeroRateCeiling - taxableIncome);

  return {
    harvestableGains,
    zeroRateCeiling,
    currentTaxableIncome: taxableIncome,
    marginalCapGainsRate: 0,
  };
}

// ============================================================================
// 3. Spending Shock Simulator
// ============================================================================

const DEFAULT_SHOCKS = [
  { label: 'Healthcare emergency', probability: 0.02, minCost: 30000, maxCost: 150000, minAge: 50, maxAge: 95 },
  { label: 'Home repair/replacement', probability: 0.03, minCost: 15000, maxCost: 80000, minAge: 40, maxAge: 90 },
  { label: 'Family support', probability: 0.01, minCost: 20000, maxCost: 50000, minAge: 45, maxAge: 80 },
  { label: 'Long-term care (annual)', probability: 0.005, minCost: 80000, maxCost: 300000, minAge: 75, maxAge: 95 },
];

export function generateSpendingShocks(years, shockConfig = DEFAULT_SHOCKS) {
  const result = [];

  for (let year = 0; year < years; year++) {
    const shocks = [];

    for (const shock of shockConfig) {
      if (Math.random() < shock.probability) {
        const cost = shock.minCost + Math.random() * (shock.maxCost - shock.minCost);
        shocks.push({ label: shock.label, cost });
      }
    }

    result.push({ year, shocks });
  }

  return result;
}

export function applySpendingShocksToProjection(yearlyData, shockEvents) {
  return yearlyData.map((yearEntry) => {
    const shockYear = shockEvents.find((s) => s.year === yearEntry.year);
    if (!shockYear || shockYear.shocks.length === 0) return yearEntry;

    const totalShockCost = shockYear.shocks.reduce((sum, s) => sum + s.cost, 0);
    return {
      ...yearEntry,
      portfolioEnd: yearEntry.portfolioEnd - totalShockCost,
    };
  });
}

// ============================================================================
// 4. Part-Time Income Model
// ============================================================================

export function modelPartTimeIncome({
  startAge,
  endAge,
  annualIncome,
  growthRate = 0.02,
}) {
  return function getIncome(age) {
    if (age < startAge || age > endAge) return 0;
    const yearsWorked = age - startAge;
    return annualIncome * Math.pow(1 + growthRate, yearsWorked);
  };
}

// ============================================================================
// 5. Pension COLA vs Non-COLA
// ============================================================================

export function projectPensionIncome({
  annualAmount,
  startAge,
  hasCOLA = false,
  colaRate = 0.02,
  currentAge,
  endAge = 95,
}) {
  const result = [];

  for (let age = startAge; age <= endAge; age++) {
    const yearsFromStart = age - startAge;
    const income = hasCOLA
      ? annualAmount * Math.pow(1 + colaRate, yearsFromStart)
      : annualAmount;
    result.push({ age, income });
  }

  return result;
}
