import {
  FEDERAL_TAX_BRACKETS,
  STANDARD_DEDUCTION,
  RMD_TABLE,
  MEDICARE_IRMAA,
} from '../constants/taxConstants';
import { calculateFederalIncomeTax } from './taxEngine';

// ── IRMAA Impact Estimate ──

function estimateIrmaaImpact(magi, filingStatus) {
  const brackets = MEDICARE_IRMAA[filingStatus] || MEDICARE_IRMAA.married_filing_jointly;
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (magi >= brackets[i].min) {
      return brackets[i].surcharge * 12; // annual surcharge
    }
  }
  return 0;
}

// ── Roth Conversion Ladder Analysis ──

export function analyzeRothLadder({
  traditionalBalance,
  currentAge,
  retirementAge,
  endAge = 90,
  annualConversion = null,
  filingStatus = 'married_filing_jointly',
  otherOrdinaryIncome = 0,
  getIncomeForAge = null,
  inflationRate = 0.03,
  realReturnRate = 0.06,
  birthYear,
  existingRothContributions = 0,
}) {
  const years = endAge - currentAge;
  const results = [];
  const conversionHistory = [];

  let tradBalance = traditionalBalance;
  let rothBalance = 0;
  let totalTaxPaid = 0;
  let totalIrmaaImpact = 0;

  const rmdStartAge = (birthYear && birthYear >= 1960) ? 75 : 73;
  const currentYear = new Date().getFullYear();

  for (let year = 0; year < years; year++) {
    const age = currentAge + year;
    const calendarYear = currentYear + year;

    const inflationFactor = Math.pow(1 + inflationRate, year);
    const income = getIncomeForAge
      ? getIncomeForAge(age) * inflationFactor
      : otherOrdinaryIncome * inflationFactor;

    // RMD handling: required distributions cannot be converted
    let rmdAmount = 0;
    if (age >= rmdStartAge && tradBalance > 0) {
      const divisor = RMD_TABLE[age] || 2.0;
      rmdAmount = tradBalance / divisor;
      tradBalance -= rmdAmount;
    }

    let conversion = 0;
    if (tradBalance > 0) {
      if (annualConversion !== null) {
        conversion = Math.min(annualConversion, tradBalance);
      } else {
        const optimized = optimizeAnnualConversion({
          traditionalBalance: tradBalance,
          currentOrdinaryIncome: income + rmdAmount,
          filingStatus,
        });
        conversion = optimized.optimalConversion;
      }
    }

    // RMD is taxable income but not a conversion
    const totalTaxableIncome = income + rmdAmount + conversion;

    const taxResult = calculateFederalIncomeTax({
      ordinaryIncome: totalTaxableIncome,
      filingStatus,
    });

    const taxOnConversion = conversion > 0
      ? taxResult.tax - calculateFederalIncomeTax({ ordinaryIncome: income + rmdAmount, filingStatus }).tax
      : 0;

    totalTaxPaid += taxOnConversion;

    // IRMAA impact (affects premiums 2 years later)
    const estimatedIrmaaImpact = estimateIrmaaImpact(totalTaxableIncome, filingStatus);
    totalIrmaaImpact += estimatedIrmaaImpact;

    // Track conversion history for 5-year rule
    if (conversion > 0) {
      conversionHistory.push({ year: calendarYear, amount: conversion });
    }

    // Calculate penalty-free Roth balance (conversions older than 5 years)
    const penaltyFreeConverted = conversionHistory
      .filter(c => calendarYear - c.year >= 5)
      .reduce((sum, c) => sum + c.amount, 0);
    const totalPenaltyFreeBalance = penaltyFreeConverted + existingRothContributions;

    tradBalance = (tradBalance - conversion) * (1 + realReturnRate);
    rothBalance = (rothBalance + conversion) * (1 + realReturnRate);

    results.push({
      year,
      age,
      conversion,
      rmdAmount,
      taxOnConversion,
      traditionalBalance: tradBalance,
      rothBalance,
      totalBalance: tradBalance + rothBalance,
      cumulativeTaxPaid: totalTaxPaid,
      marginalRate: taxResult.marginalRate,
      penaltyFreeRothBalance: penaltyFreeConverted,
      totalPenaltyFreeBalance,
      estimatedIrmaaImpact,
    });
  }

  return {
    schedule: results,
    totalConversions: results.reduce((s, r) => s + r.conversion, 0),
    totalTaxPaid,
    totalIrmaaImpact,
    finalTraditionalBalance: tradBalance,
    finalRothBalance: rothBalance,
    finalTotalBalance: tradBalance + rothBalance,
  };
}

// ── Optimal Single-Year Conversion (Fill the Bracket) ──

export function optimizeAnnualConversion({
  traditionalBalance,
  currentOrdinaryIncome,
  filingStatus = 'married_filing_jointly',
  targetTopBracket = null,
}) {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  const dedEntry = STANDARD_DEDUCTION[filingStatus];
  const standardDeduction = typeof dedEntry === 'object' ? (dedEntry.amount || 0) : (dedEntry || 0);
  const taxableIncome = Math.max(0, currentOrdinaryIncome - standardDeduction);

  let currentBracketIndex = 0;
  for (let i = 0; i < brackets.length; i++) {
    if (taxableIncome >= brackets[i].min) currentBracketIndex = i;
  }

  let targetIndex = currentBracketIndex;
  if (targetTopBracket !== null) {
    const idx = brackets.findIndex(b => b.rate >= targetTopBracket);
    if (idx >= 0) targetIndex = idx;
  } else if (currentBracketIndex <= 1) {
    // Default: fill through 12% bracket for low-income years (standard FIRE strategy)
    const idx12 = brackets.findIndex(b => b.rate > 0.12);
    if (idx12 > 0) targetIndex = idx12 - 1;
  }

  const targetBracket = brackets[targetIndex];
  const bracketCeiling = targetBracket.max === Infinity
    ? taxableIncome + 100000
    : targetBracket.max;

  // Remaining space in gross-income terms: accounts for unused standard deduction
  const grossCeiling = bracketCeiling + standardDeduction;
  const remainingSpace = Math.max(0, grossCeiling - currentOrdinaryIncome);
  const optimalConversion = Math.min(remainingSpace, traditionalBalance);

  const taxResult = calculateFederalIncomeTax({
    ordinaryIncome: currentOrdinaryIncome + optimalConversion,
    filingStatus,
  });
  const baseTax = calculateFederalIncomeTax({
    ordinaryIncome: currentOrdinaryIncome,
    filingStatus,
  });

  return {
    optimalConversion,
    taxOnConversion: taxResult.tax - baseTax.tax,
    newMarginalRate: taxResult.marginalRate,
    remainingBracketSpace: remainingSpace - optimalConversion,
    currentMarginalRate: baseTax.marginalRate,
    targetBracketRate: targetBracket.rate,
  };
}

// ── Pro-Rata Rule Calculator ──

export function calculateProRata({
  traditionalIRABalance,
  nonDeductibleBasis,
  conversionAmount,
}) {
  const totalIRABalance = traditionalIRABalance;
  if (totalIRABalance <= 0) return { taxableAmount: 0, nonTaxableAmount: 0, proRataPercent: 0 };

  const taxablePercent = 1 - (nonDeductibleBasis / totalIRABalance);
  const taxableAmount = conversionAmount * taxablePercent;
  const nonTaxableAmount = conversionAmount * (1 - taxablePercent);

  return {
    taxableAmount,
    nonTaxableAmount,
    proRataPercent: taxablePercent,
    remainingBasis: Math.max(0, nonDeductibleBasis - nonTaxableAmount),
  };
}

// ── Break-Even Analysis ──

export function calculateConversionBreakEven({
  conversionAmount,
  taxRate,
  futureWithdrawalRate,
  realReturnRate = 0.06,
}) {
  if (taxRate >= futureWithdrawalRate) return { breakEvenYears: Infinity, neverBreaksEven: true };

  const taxPaidNow = conversionAmount * taxRate;
  const taxSavedPerYear = conversionAmount * futureWithdrawalRate - conversionAmount * taxRate;

  if (taxSavedPerYear <= 0) return { breakEvenYears: Infinity, neverBreaksEven: true };

  // After-tax growth comparison: Roth grows fully tax-free vs traditional grows tax-deferred
  // but is taxed on withdrawal. Find when Roth advantage covers upfront tax cost.
  const afterTaxRoth = conversionAmount - taxPaidNow;
  let rothValue = afterTaxRoth;
  let tradValue = conversionAmount;
  let years = 0;

  while (years < 50) {
    years++;
    rothValue *= (1 + realReturnRate);
    tradValue *= (1 + realReturnRate);
    const tradAfterTax = tradValue * (1 - futureWithdrawalRate);
    if (rothValue >= tradAfterTax) {
      return { breakEvenYears: years, neverBreaksEven: false };
    }
  }

  return { breakEvenYears: Infinity, neverBreaksEven: true };
}

// ── Multi-Year Comparison ──

export function compareConversionScenarios({
  traditionalBalance,
  currentAge,
  retirementAge,
  endAge = 90,
  filingStatus = 'married_filing_jointly',
  otherOrdinaryIncome = 0,
  inflationRate = 0.03,
  realReturnRate = 0.06,
  scenarios = ['none', 'fill_bracket', 'aggressive'],
  birthYear,
  existingRothContributions = 0,
}) {
  const results = {};

  for (const scenario of scenarios) {
    let annualConversion;
    if (scenario === 'none') {
      annualConversion = 0;
    } else if (scenario === 'fill_bracket') {
      annualConversion = null; // auto-optimize
    } else if (scenario === 'aggressive') {
      const yearsToRetirement = retirementAge - currentAge;
      annualConversion = yearsToRetirement > 0 ? traditionalBalance / yearsToRetirement : 0;
    } else if (typeof scenario === 'number') {
      annualConversion = scenario;
    }

    results[scenario] = analyzeRothLadder({
      traditionalBalance,
      currentAge,
      retirementAge,
      endAge,
      annualConversion,
      filingStatus,
      otherOrdinaryIncome,
      inflationRate,
      realReturnRate,
      birthYear,
      existingRothContributions,
    });
  }

  return results;
}
