// ============================================================================
// Healthcare Cost Modeling — ACA, Medicare, and Lifetime Projections
// ============================================================================

import { calculateFederalIncomeTax } from './taxEngine';

// ── 2025 Federal Poverty Level (48 contiguous states) ──

const FPL_BASE = {
  1: 15650,
  2: 21150,
  3: 26650,
  4: 32150,
};
const FPL_ADDITIONAL_PERSON = 5500;

function getFPL(householdSize) {
  if (householdSize <= 4) return FPL_BASE[householdSize] || FPL_BASE[2];
  return FPL_BASE[4] + (householdSize - 4) * FPL_ADDITIONAL_PERSON;
}

// ── ACA Premium Cap Schedule (post-IRA, extended through 2025) ──
// Returns the expected contribution percentage of income for a given FPL%

function getExpectedContributionPercent(fplPercent) {
  if (fplPercent < 150) return 0;
  if (fplPercent < 200) {
    // 0% to 2%, linearly interpolated
    return linearInterpolate(fplPercent, 150, 200, 0, 0.02);
  }
  if (fplPercent < 250) {
    return linearInterpolate(fplPercent, 200, 250, 0.02, 0.04);
  }
  if (fplPercent < 300) {
    return linearInterpolate(fplPercent, 250, 300, 0.04, 0.06);
  }
  if (fplPercent < 400) {
    return linearInterpolate(fplPercent, 300, 400, 0.06, 0.085);
  }
  // Above 400% FPL: capped at 8.5% (no cliff thanks to IRA extension)
  return 0.085;
}

function linearInterpolate(value, minX, maxX, minY, maxY) {
  const fraction = (value - minX) / (maxX - minX);
  return minY + fraction * (maxY - minY);
}

// ── Benchmark Premium Estimate ──
// Rough Silver plan estimate based on age; conservative (overestimates slightly)

function estimateBenchmarkPremium(age, householdSize) {
  const basePremium = 500; // ~$500/month for age 40 in moderate-cost area
  const ageFactor = 1.0 + 0.03 * Math.max(0, age - 40);
  let monthlyPremium = basePremium * ageFactor;

  // For a couple (household of 2+), multiply by 2 to cover both adults
  if (householdSize >= 2) {
    monthlyPremium *= 2;
  }

  return monthlyPremium * 12; // annual
}

// ── ACA Subsidy Calculator ──

export function calculateACASubsidy({
  magi,
  householdSize = 2,
  age = 55,
  benchmarkPremium = null,
  year = 2025,
}) {
  const safeMagi = Math.max(0, magi || 0);
  const fpl = getFPL(householdSize);
  const fplPercent = (safeMagi / fpl) * 100;

  const premium = benchmarkPremium !== null
    ? benchmarkPremium
    : estimateBenchmarkPremium(age, householdSize);

  const contributionPercent = getExpectedContributionPercent(fplPercent);
  const expectedContribution = safeMagi * contributionPercent;

  // Subsidy = benchmark premium minus what you're expected to pay
  const subsidy = Math.max(0, premium - expectedContribution);
  const effectivePremium = premium - subsidy;
  const monthlySubsidy = subsidy / 12;

  // Below 100% FPL generally not eligible for ACA subsidies (Medicaid territory),
  // but we still calculate the subsidy in case the state has no Medicaid expansion
  const isSubsidyEligible = fplPercent >= 100 && subsidy > 0;

  return {
    subsidy,
    monthlySubsidy,
    expectedContribution,
    premium,
    effectivePremium,
    fplPercent,
    isSubsidyEligible,
  };
}

// ── ACA / Roth Conversion Tradeoff ──

export function calculateACAConversionTradeoff({
  baseIncome,
  conversionAmount,
  householdSize = 2,
  age = 55,
  filingStatus = 'married_filing_jointly',
  benchmarkPremium = null,
}) {
  const safeBase = Math.max(0, baseIncome || 0);
  const safeConversion = Math.max(0, conversionAmount || 0);

  // Subsidy at base income (without conversion)
  const subsidyWithoutResult = calculateACASubsidy({
    magi: safeBase,
    householdSize,
    age,
    benchmarkPremium,
  });

  // Subsidy with conversion added to MAGI
  const subsidyWithResult = calculateACASubsidy({
    magi: safeBase + safeConversion,
    householdSize,
    age,
    benchmarkPremium,
  });

  const lostSubsidy = subsidyWithoutResult.subsidy - subsidyWithResult.subsidy;

  // Estimate tax on conversion using the tax engine
  const taxWithout = calculateFederalIncomeTax({
    ordinaryIncome: safeBase,
    filingStatus,
  });
  const taxWith = calculateFederalIncomeTax({
    ordinaryIncome: safeBase + safeConversion,
    filingStatus,
  });
  const estimatedTax = taxWith.tax - taxWithout.tax;

  const totalCost = estimatedTax + Math.max(0, lostSubsidy);

  // Net cost per dollar converted
  const netConversionCost = safeConversion > 0 ? totalCost / safeConversion : 0;

  return {
    subsidyWithout: subsidyWithoutResult.subsidy,
    subsidyWith: subsidyWithResult.subsidy,
    lostSubsidy: Math.max(0, lostSubsidy),
    estimatedTax,
    totalCost,
    netConversionCost,
  };
}

// ── IRMAA Surcharge Brackets (2025) ──

const IRMAA_PART_B = {
  married_filing_jointly: [
    { min: 0, max: 206000, surcharge: 0 },
    { min: 206000, max: 258000, surcharge: 70.90 },
    { min: 258000, max: 322000, surcharge: 177.00 },
    { min: 322000, max: 386000, surcharge: 283.50 },
    { min: 386000, max: 750000, surcharge: 390.00 },
    { min: 750000, max: Infinity, surcharge: 420.80 },
  ],
  single: [
    { min: 0, max: 103000, surcharge: 0 },
    { min: 103000, max: 129000, surcharge: 70.90 },
    { min: 129000, max: 161000, surcharge: 177.00 },
    { min: 161000, max: 193000, surcharge: 283.50 },
    { min: 193000, max: 500000, surcharge: 390.00 },
    { min: 500000, max: Infinity, surcharge: 420.80 },
  ],
};

const IRMAA_PART_D = {
  married_filing_jointly: [
    { min: 0, max: 206000, surcharge: 0 },
    { min: 206000, max: 258000, surcharge: 13.70 },
    { min: 258000, max: 322000, surcharge: 35.30 },
    { min: 322000, max: 386000, surcharge: 57.00 },
    { min: 386000, max: 750000, surcharge: 78.60 },
    { min: 750000, max: Infinity, surcharge: 85.80 },
  ],
  single: [
    { min: 0, max: 103000, surcharge: 0 },
    { min: 103000, max: 129000, surcharge: 13.70 },
    { min: 129000, max: 161000, surcharge: 35.30 },
    { min: 161000, max: 193000, surcharge: 57.00 },
    { min: 193000, max: 500000, surcharge: 78.60 },
    { min: 500000, max: Infinity, surcharge: 85.80 },
  ],
};

function getIrmaaSurcharge(magi, filingStatus, bracketTable) {
  const brackets = bracketTable[filingStatus] || bracketTable.married_filing_jointly;
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (magi >= brackets[i].min) {
      return brackets[i].surcharge;
    }
  }
  return 0;
}

// ── Medicare Cost Estimator ──

export function estimateMedicareCosts({
  age,
  magi,
  filingStatus = 'married_filing_jointly',
  hasMedigap = true,
}) {
  const safeAge = Math.max(65, age || 65);
  const safeMagi = Math.max(0, magi || 0);

  // Part B: $185/month base (2025), plus IRMAA surcharge
  const partBBase = 185.00;
  const partBSurcharge = getIrmaaSurcharge(safeMagi, filingStatus, IRMAA_PART_B);
  const partBMonthly = partBBase + partBSurcharge;
  const partB = partBMonthly * 12;

  // Part D: ~$35/month average base, plus IRMAA surcharge
  const partDBase = 35.00;
  const partDSurcharge = getIrmaaSurcharge(safeMagi, filingStatus, IRMAA_PART_D);
  const partDMonthly = partDBase + partDSurcharge;
  const partD = partDMonthly * 12;

  // Medigap Plan G: ~$150/month at 65, rising ~4% per year of age over 65
  let medigap = 0;
  if (hasMedigap) {
    const medigapBase = 150.00;
    const yearsOver65 = safeAge - 65;
    const medigapMonthly = medigapBase * Math.pow(1.04, yearsOver65);
    medigap = medigapMonthly * 12;
  }

  // Out-of-pocket: ~$2,000/year base, rising ~3% per year of age over 65
  const oopBase = 2000;
  const yearsOver65 = safeAge - 65;
  const outOfPocket = oopBase * Math.pow(1.03, yearsOver65);

  const totalAnnual = partB + partD + medigap + outOfPocket;
  const totalMonthly = totalAnnual / 12;

  return {
    partB,
    partD,
    medigap,
    outOfPocket,
    totalAnnual,
    totalMonthly,
  };
}

// ── Healthcare Cost Timeline ──

export function projectHealthcareCosts({
  currentAge,
  retirementAge,
  lifeExpectancy,
  magi,
  householdSize = 2,
  filingStatus = 'married_filing_jointly',
  healthcareInflation = 0.05,
}) {
  const startAge = Math.max(currentAge, retirementAge);
  const endAge = Math.ceil(lifeExpectancy);
  const safeMagi = Math.max(0, magi || 0);
  const timeline = [];

  for (let age = startAge; age <= endAge; age++) {
    const yearsFromStart = age - startAge;
    const inflationFactor = Math.pow(1 + healthcareInflation, yearsFromStart);

    if (age < 65) {
      // Pre-Medicare: ACA marketplace
      const acaResult = calculateACASubsidy({
        magi: safeMagi,
        householdSize,
        age,
      });

      const baseCost = acaResult.effectivePremium;
      // Add estimated out-of-pocket costs (~$3,000/year pre-Medicare)
      const oopEstimate = 3000;
      const annualCost = (baseCost + oopEstimate) * inflationFactor;

      timeline.push({
        age,
        annualCost,
        source: 'ACA',
        details: {
          premium: acaResult.premium * inflationFactor,
          subsidy: acaResult.subsidy * inflationFactor,
          effectivePremium: baseCost * inflationFactor,
          outOfPocket: oopEstimate * inflationFactor,
          fplPercent: acaResult.fplPercent,
        },
      });
    } else {
      // Medicare (65+)
      const medicareResult = estimateMedicareCosts({
        age,
        magi: safeMagi,
        filingStatus,
        hasMedigap: true,
      });

      const annualCost = medicareResult.totalAnnual * inflationFactor;

      timeline.push({
        age,
        annualCost,
        source: 'Medicare',
        details: {
          partB: medicareResult.partB * inflationFactor,
          partD: medicareResult.partD * inflationFactor,
          medigap: medicareResult.medigap * inflationFactor,
          outOfPocket: medicareResult.outOfPocket * inflationFactor,
        },
      });
    }
  }

  return timeline;
}
