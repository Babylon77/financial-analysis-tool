import {
  FEDERAL_TAX_BRACKETS,
  CAPITAL_GAINS_BRACKETS,
  NIIT_THRESHOLD,
  SOCIAL_SECURITY_TAX,
  MEDICARE_IRMAA,
  MEDICARE_IRMAA_PART_D,
  RMD_TABLE,
  JOINT_LIFE_TABLE,
  STANDARD_DEDUCTION,
  STATE_TAX_RATES,
} from '../constants/taxConstants.js';

// Helper: resolve STANDARD_DEDUCTION entry which may be a plain number or { amount, additional }
function getStandardDeductionAmount(filingStatus) {
  const entry = STANDARD_DEDUCTION[filingStatus] || STANDARD_DEDUCTION.married_filing_jointly;
  if (typeof entry === 'number') return entry;
  return entry.amount || 0;
}

function getAdditionalStandardDeduction(filingStatus) {
  const entry = STANDARD_DEDUCTION[filingStatus] || STANDARD_DEDUCTION.married_filing_jointly;
  if (typeof entry === 'object' && entry.additional != null) return entry.additional;
  return 0;
}

export function calculateFederalIncomeTax({
  ordinaryIncome,
  filingStatus = 'married_filing_jointly',
  deductions = 0,
  age = null,
  spouseAge = null,
}) {
  if (!ordinaryIncome || ordinaryIncome <= 0) {
    return { taxableIncome: 0, tax: 0, effectiveRate: 0, marginalRate: 0, bracketBreakdown: [] };
  }

  let standardDed = getStandardDeductionAmount(filingStatus);

  // Age 65+ additional standard deduction
  if (age != null && age >= 65) {
    standardDed += getAdditionalStandardDeduction(filingStatus);
  }
  if (spouseAge != null && spouseAge >= 65) {
    // Second additional deduction for spouse (only applies to married statuses)
    if (filingStatus === 'married_filing_jointly' || filingStatus === 'married_filing_separately') {
      standardDed += getAdditionalStandardDeduction(filingStatus);
    }
  }

  const totalDeductions = standardDed + Math.max(0, deductions);
  const taxableIncome = Math.max(0, ordinaryIncome - totalDeductions);

  const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS.married_filing_jointly;
  let tax = 0;
  let marginalRate = 0;
  const bracketBreakdown = [];

  for (let i = 0; i < brackets.length; i++) {
    const { rate, min, max } = brackets[i];
    if (taxableIncome <= min) break;

    const ceiling = max === Infinity ? taxableIncome : Math.min(max, taxableIncome);
    const taxableInBracket = ceiling - min;
    const bracketTax = taxableInBracket * rate;

    bracketBreakdown.push({ rate, rangeMin: min, rangeMax: max, taxableAmount: taxableInBracket, tax: bracketTax });
    tax += bracketTax;
    marginalRate = rate;
  }

  const effectiveRate = taxableIncome > 0 ? tax / taxableIncome : 0;

  return { taxableIncome, tax, effectiveRate, marginalRate, bracketBreakdown };
}

export function calculateCapitalGainsTax({
  longTermGains,
  shortTermGains = 0,
  ordinaryIncome,
  filingStatus = 'married_filing_jointly',
  qualifiedDividends = 0,
  // Additional investment income for NIIT that is already counted elsewhere
  // (e.g., STG already included in ordinaryIncome by calculateTotalTax)
  additionalNiitInvestmentIncome = 0,
}) {
  const safeOrdinary = Math.max(0, ordinaryIncome || 0);
  const safeLTG = Math.max(0, longTermGains || 0);
  const safeSTG = Math.max(0, shortTermGains || 0);
  const safeQDiv = Math.max(0, qualifiedDividends || 0);
  const safeAdditionalNiit = Math.max(0, additionalNiitInvestmentIncome || 0);

  if (safeLTG === 0 && safeSTG === 0 && safeQDiv === 0 && safeAdditionalNiit === 0) {
    return { tax: 0, longTermTax: 0, shortTermTax: 0, niitTax: 0, qualifiedDividendTax: 0, effectiveRate: 0 };
  }

  // Short-term gains taxed as ordinary income
  const shortTermResult = safeSTG > 0
    ? calculateFederalIncomeTax({ ordinaryIncome: safeOrdinary + safeSTG, filingStatus })
    : calculateFederalIncomeTax({ ordinaryIncome: safeOrdinary, filingStatus });
  const baseResult = calculateFederalIncomeTax({ ordinaryIncome: safeOrdinary, filingStatus });
  const shortTermTax = shortTermResult.tax - baseResult.tax;

  // Long-term gains + qualified dividends stacked on top of ordinary income at LTCG rates
  const standardDed = getStandardDeductionAmount(filingStatus);
  const taxableOrdinary = Math.max(0, safeOrdinary - standardDed);
  const cgBrackets = CAPITAL_GAINS_BRACKETS[filingStatus] || CAPITAL_GAINS_BRACKETS.married_filing_jointly;

  // Combined LTCG-rate income: long-term gains + qualified dividends
  const ltcgRateIncome = safeLTG + safeQDiv;
  let longTermAndDivTax = 0;
  let gainsRemaining = ltcgRateIncome;
  let stackPosition = taxableOrdinary;

  for (let i = 0; i < cgBrackets.length && gainsRemaining > 0; i++) {
    const { rate, min, max } = cgBrackets[i];
    const ceiling = max === Infinity ? Infinity : max;

    if (stackPosition >= ceiling) continue;

    const bracketStart = Math.max(stackPosition, min);
    const spaceInBracket = ceiling === Infinity ? gainsRemaining : ceiling - bracketStart;
    const taxableAtRate = Math.min(gainsRemaining, spaceInBracket);

    if (taxableAtRate > 0) {
      longTermAndDivTax += taxableAtRate * rate;
      gainsRemaining -= taxableAtRate;
      stackPosition = bracketStart + taxableAtRate;
    }
  }

  // Apportion tax between LTG and qualified dividends proportionally
  let longTermTax = 0;
  let qualifiedDividendTax = 0;
  if (ltcgRateIncome > 0) {
    longTermTax = longTermAndDivTax * (safeLTG / ltcgRateIncome);
    qualifiedDividendTax = longTermAndDivTax * (safeQDiv / ltcgRateIncome);
  }

  // NIIT: 3.8% on investment income when MAGI exceeds threshold
  // Investment income includes LTG, STG, qualified dividends, and any additional amount
  let niitTax = 0;
  const niitThreshold = NIIT_THRESHOLD[filingStatus] || NIIT_THRESHOLD.married_filing_jointly;
  const investmentIncome = safeLTG + safeSTG + safeQDiv + safeAdditionalNiit;
  const magi = safeOrdinary + safeLTG + safeSTG + safeQDiv + safeAdditionalNiit;
  if (magi > niitThreshold) {
    const excessMagi = magi - niitThreshold;
    niitTax = Math.min(investmentIncome, excessMagi) * 0.038;
  }

  const totalTax = longTermTax + shortTermTax + qualifiedDividendTax + niitTax;
  const totalGains = safeLTG + safeSTG + safeQDiv;
  const effectiveRate = totalGains > 0 ? totalTax / totalGains : 0;

  return { tax: totalTax, longTermTax, shortTermTax, niitTax, qualifiedDividendTax, effectiveRate };
}

export function calculateSocialSecurityTax({
  ssaBenefit,
  otherIncome,
  filingStatus = 'married_filing_jointly',
}) {
  const safeBenefit = Math.max(0, ssaBenefit || 0);
  const safeOther = Math.max(0, otherIncome || 0);

  if (safeBenefit === 0) {
    return { taxableAmount: 0, taxablePercent: 0, provisionalIncome: safeOther };
  }

  const provisionalIncome = safeOther + safeBenefit * 0.5;

  const brackets = SOCIAL_SECURITY_TAX.provisionalIncomeThresholds[filingStatus]
    || SOCIAL_SECURITY_TAX.provisionalIncomeThresholds.married_filing_jointly;

  // Extract lower threshold (from the 50% bracket) and upper threshold (from the 85% bracket)
  let lowerThreshold = Infinity;
  let upperThreshold = Infinity;
  for (const bracket of brackets) {
    if (bracket.taxablePercent === 0.50) {
      lowerThreshold = bracket.min;
    } else if (bracket.taxablePercent === 0.85) {
      upperThreshold = bracket.min;
    }
  }

  // IRS formula for taxable Social Security benefits
  let taxableAmount = 0;
  let taxablePercent = 0;

  if (provisionalIncome <= lowerThreshold) {
    // Below lower threshold: 0% taxable
    taxableAmount = 0;
    taxablePercent = 0;
  } else if (provisionalIncome <= upperThreshold) {
    // Between lower and upper: lesser of 50% of benefits or 50% of excess over lower
    taxableAmount = Math.min(
      0.50 * safeBenefit,
      0.50 * (provisionalIncome - lowerThreshold)
    );
    taxablePercent = safeBenefit > 0 ? taxableAmount / safeBenefit : 0;
  } else {
    // Above upper threshold:
    // lesser of 85% of benefits, or
    // 85% of (provisional - upper) + lesser of (50% of benefits, 50% of (upper - lower))
    const fiftyPercentPortion = Math.min(
      0.50 * safeBenefit,
      0.50 * (upperThreshold - lowerThreshold)
    );
    const eightyFivePercentFormula = 0.85 * (provisionalIncome - upperThreshold) + fiftyPercentPortion;
    taxableAmount = Math.min(
      0.85 * safeBenefit,
      eightyFivePercentFormula
    );
    taxablePercent = safeBenefit > 0 ? taxableAmount / safeBenefit : 0;
  }

  return { taxableAmount, taxablePercent, provisionalIncome };
}

export function calculateMedicareIRMAA({
  magi,
  filingStatus = 'married_filing_jointly',
}) {
  const safeMagi = Math.max(0, magi || 0);
  const partBBrackets = MEDICARE_IRMAA[filingStatus] || MEDICARE_IRMAA.married_filing_jointly;
  const partDBrackets = MEDICARE_IRMAA_PART_D[filingStatus] || MEDICARE_IRMAA_PART_D.married_filing_jointly;
  const standardPremium = MEDICARE_IRMAA.standardPartBPremium;

  // Find Part B surcharge
  let partBSurcharge = 0;
  let tier = 0;
  for (let i = 0; i < partBBrackets.length; i++) {
    if (safeMagi >= partBBrackets[i].min && safeMagi < partBBrackets[i].max) {
      partBSurcharge = partBBrackets[i].surcharge;
      tier = i;
      break;
    }
  }

  // Find Part D surcharge
  let partDSurcharge = 0;
  for (let i = 0; i < partDBrackets.length; i++) {
    if (safeMagi >= partDBrackets[i].min && safeMagi < partDBrackets[i].max) {
      partDSurcharge = partDBrackets[i].surcharge;
      break;
    }
  }

  const monthlyPremium = standardPremium + partBSurcharge;
  const annualPartBSurcharge = partBSurcharge * 12;
  const annualPartDSurcharge = partDSurcharge * 12;
  const annualSurcharge = annualPartBSurcharge + annualPartDSurcharge;

  return {
    monthlyPremium,
    annualSurcharge,
    tier,
    partBSurcharge,
    partDSurcharge,
    annualPartBSurcharge,
    annualPartDSurcharge,
  };
}

export function calculateRMD({ accountBalance, age, spouseAge = null, birthYear = null }) {
  const safeBalance = Math.max(0, accountBalance || 0);

  // Determine RMD starting age based on birth year
  const rmdStartAge = (birthYear != null && birthYear >= 1960) ? 75 : 73;

  if (safeBalance === 0 || !age || age < rmdStartAge) {
    return { rmdAmount: 0, distributionPeriod: 0, rmdStartAge };
  }

  // Use Joint Life Table if spouse is >10 years younger
  let distributionPeriod;
  if (spouseAge && (age - spouseAge) > 10) {
    distributionPeriod = JOINT_LIFE_TABLE[age] || RMD_TABLE[age];
  } else {
    distributionPeriod = RMD_TABLE[age];
  }

  if (!distributionPeriod || distributionPeriod <= 0) {
    // Fallback for very old ages not in table
    distributionPeriod = 1;
  }

  const rmdAmount = safeBalance / distributionPeriod;

  return { rmdAmount, distributionPeriod, rmdStartAge };
}

export function optimizeRothConversion({
  traditionalBalance,
  currentOrdinaryIncome,
  filingStatus = 'married_filing_jointly',
  targetTopBracket = null,
}) {
  const safeBalance = Math.max(0, traditionalBalance || 0);
  const safeIncome = Math.max(0, currentOrdinaryIncome || 0);

  if (safeBalance === 0) {
    return { optimalConversion: 0, taxOnConversion: 0, newMarginalRate: 0, remainingBracketSpace: 0 };
  }

  const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS.married_filing_jointly;
  const standardDed = getStandardDeductionAmount(filingStatus);
  const taxableIncome = Math.max(0, safeIncome - standardDed);

  // Find current bracket index
  let currentBracketIdx = 0;
  for (let i = 0; i < brackets.length; i++) {
    if (taxableIncome >= brackets[i].min) currentBracketIdx = i;
    else break;
  }

  // Find target bracket index
  let targetIdx = currentBracketIdx;
  if (targetTopBracket !== null) {
    const found = brackets.findIndex(b => b.rate === targetTopBracket);
    if (found !== -1) targetIdx = found;
  }

  // Calculate remaining space in the target bracket
  const targetBracket = brackets[targetIdx];
  const bracketCeiling = targetBracket.max === Infinity ? Infinity : targetBracket.max;
  const remainingBracketSpace = bracketCeiling === Infinity
    ? Infinity
    : Math.max(0, bracketCeiling - taxableIncome);

  // Optimal conversion fills up to the top of the target bracket
  const optimalConversion = Math.min(safeBalance, remainingBracketSpace === Infinity ? safeBalance : remainingBracketSpace);

  // Calculate tax on the conversion
  const preConversionTax = calculateFederalIncomeTax({ ordinaryIncome: safeIncome, filingStatus });
  const postConversionTax = calculateFederalIncomeTax({ ordinaryIncome: safeIncome + optimalConversion, filingStatus });
  const taxOnConversion = postConversionTax.tax - preConversionTax.tax;
  const newMarginalRate = postConversionTax.marginalRate;

  return {
    optimalConversion,
    taxOnConversion,
    newMarginalRate,
    remainingBracketSpace: remainingBracketSpace === Infinity ? Infinity : remainingBracketSpace,
  };
}

export function calculateStateTax({
  taxableIncome,
  stateCode,
  filingStatus = 'married_filing_jointly',
}) {
  const safeTaxable = Math.max(0, taxableIncome || 0);
  const stateRate = STATE_TAX_RATES[stateCode] || 0;
  const stateTax = safeTaxable * stateRate;

  return { stateTax, stateRate };
}

export function calculateTotalTax({
  ordinaryIncome,
  longTermGains = 0,
  shortTermGains = 0,
  ssaBenefit = 0,
  filingStatus = 'married_filing_jointly',
  deductions = 0,
  qualifiedDividends = 0,
  stateCode = null,
  age = null,
  spouseAge = null,
}) {
  const safeOrdinary = Math.max(0, ordinaryIncome || 0);
  const safeLTG = Math.max(0, longTermGains || 0);
  const safeSTG = Math.max(0, shortTermGains || 0);
  const safeSS = Math.max(0, ssaBenefit || 0);
  const safeQDiv = Math.max(0, qualifiedDividends || 0);

  // Taxable SS benefits are added to ordinary income
  const ssResult = calculateSocialSecurityTax({
    ssaBenefit: safeSS,
    otherIncome: safeOrdinary + safeLTG + safeSTG + safeQDiv,
    filingStatus,
  });

  const totalOrdinaryIncome = safeOrdinary + ssResult.taxableAmount + safeSTG;

  const federalResult = calculateFederalIncomeTax({
    ordinaryIncome: totalOrdinaryIncome,
    filingStatus,
    deductions,
    age,
    spouseAge,
  });

  // STG is already included in totalOrdinaryIncome, so pass shortTermGains=0 for bracket calc.
  // Pass STG via additionalNiitInvestmentIncome so NIIT correctly includes all investment income.
  const capGainsResult = calculateCapitalGainsTax({
    longTermGains: safeLTG,
    shortTermGains: 0,
    ordinaryIncome: totalOrdinaryIncome,
    filingStatus,
    qualifiedDividends: safeQDiv,
    additionalNiitInvestmentIncome: safeSTG,
  });

  // State tax
  let stateResult = { stateTax: 0, stateRate: 0 };
  if (stateCode) {
    stateResult = calculateStateTax({
      taxableIncome: federalResult.taxableIncome,
      stateCode,
      filingStatus,
    });
  }

  const totalTax = federalResult.tax + capGainsResult.longTermTax + capGainsResult.qualifiedDividendTax + capGainsResult.niitTax + stateResult.stateTax;
  const totalIncome = safeOrdinary + safeLTG + safeSTG + safeSS + safeQDiv;
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;

  return {
    totalTax,
    federalIncomeTax: federalResult.tax,
    capitalGainsTax: capGainsResult.longTermTax + capGainsResult.qualifiedDividendTax + capGainsResult.niitTax,
    stateTax: stateResult.stateTax,
    effectiveRate,
    marginalRate: federalResult.marginalRate,
    breakdown: {
      federal: federalResult,
      capitalGains: capGainsResult,
      socialSecurity: ssResult,
      state: stateResult,
    },
  };
}

export function calculateMarginalRateOnNextDollar({
  currentOrdinaryIncome,
  filingStatus = 'married_filing_jointly',
}) {
  const safeIncome = Math.max(0, currentOrdinaryIncome || 0);
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus] || FEDERAL_TAX_BRACKETS.married_filing_jointly;
  const standardDed = getStandardDeductionAmount(filingStatus);
  const taxableIncome = Math.max(0, safeIncome - standardDed);

  // Income below standard deduction has 0% marginal rate
  if (taxableIncome <= 0) {
    const remainingDeduction = standardDed - safeIncome;
    return {
      marginalRate: 0,
      bracketFloor: 0,
      bracketCeiling: standardDed,
      remainingInBracket: remainingDeduction + (brackets[0]?.max || 0),
    };
  }

  for (let i = 0; i < brackets.length; i++) {
    const { rate, min, max } = brackets[i];
    if (taxableIncome >= min && (max === Infinity || taxableIncome < max)) {
      const ceiling = max === Infinity ? Infinity : max;
      const remainingInBracket = ceiling === Infinity ? Infinity : ceiling - taxableIncome;
      return {
        marginalRate: rate,
        bracketFloor: min + standardDed,
        bracketCeiling: ceiling === Infinity ? Infinity : ceiling + standardDed,
        remainingInBracket,
      };
    }
  }

  // Fallback: top bracket
  const topBracket = brackets[brackets.length - 1];
  return {
    marginalRate: topBracket.rate,
    bracketFloor: topBracket.min + standardDed,
    bracketCeiling: Infinity,
    remainingInBracket: Infinity,
  };
}
