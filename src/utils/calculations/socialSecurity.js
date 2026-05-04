import { SOCIAL_SECURITY_TAX } from '../constants/taxConstants';

// ── Constants ──

const EARLIEST_CLAIMING_AGE = 62;
const LATEST_CLAIMING_AGE = 70;

// Worker early reduction rates
const EARLY_REDUCTION_RATE_FIRST_36 = 5 / 900; // per month (~6.67%/yr)
const EARLY_REDUCTION_RATE_AFTER_36 = 5 / 1200; // per month (~5%/yr)

// Spousal early reduction rates (different from worker)
const SPOUSAL_REDUCTION_RATE_FIRST_36 = 25 / 3600; // per month (~8.33%/yr)
const SPOUSAL_REDUCTION_RATE_AFTER_36 = 5 / 1200;  // per month (~5%/yr)

// Delayed retirement credits: 8% per year after FRA (for birth year 1943+)
const DELAYED_CREDIT_ANNUAL = 0.08;

// ── Full Retirement Age by Birth Year ──

export function getFullRetirementAge(birthYear) {
  if (!birthYear || birthYear >= 1960) return 67;
  if (birthYear <= 1937) return 65;
  if (birthYear <= 1954) return 66;
  // 1955-1959: 66 + 2 months per year
  const monthsOver66 = (birthYear - 1954) * 2;
  return 66 + monthsOver66 / 12;
}

// ── Benefit Adjustment by Claiming Age ──

export function adjustBenefitForClaimingAge(benefitAtFRA, claimingAge, birthYear) {
  if (claimingAge < EARLIEST_CLAIMING_AGE) return 0;
  if (claimingAge > LATEST_CLAIMING_AGE) claimingAge = LATEST_CLAIMING_AGE;

  const fra = getFullRetirementAge(birthYear);
  const monthsFromFRA = Math.round((claimingAge - fra) * 12);

  if (monthsFromFRA < 0) {
    const earlyMonths = Math.abs(monthsFromFRA);
    const first36 = Math.min(earlyMonths, 36);
    const beyond36 = Math.max(0, earlyMonths - 36);
    const reduction = first36 * EARLY_REDUCTION_RATE_FIRST_36 + beyond36 * EARLY_REDUCTION_RATE_AFTER_36;
    return benefitAtFRA * (1 - reduction);
  }

  if (monthsFromFRA > 0) {
    const delayedYears = monthsFromFRA / 12;
    return benefitAtFRA * (1 + delayedYears * DELAYED_CREDIT_ANNUAL);
  }

  return benefitAtFRA;
}

// ── Claiming Age Analysis ──

export function analyzeClaimingAges({
  benefitAtFRA,
  currentAge,
  lifeExpectancy = 90,
  discountRate = 0.02,
  cola = SOCIAL_SECURITY_TAX.costOfLivingAdjustment || 0.032,
  birthYear,
}) {
  // Build ages at 6-month intervals from 62 to 70
  const ages = [];
  for (let ageX10 = EARLIEST_CLAIMING_AGE * 10; ageX10 <= LATEST_CLAIMING_AGE * 10; ageX10 += 5) {
    ages.push(ageX10 / 10);
  }

  const results = ages.map(claimingAge => {
    const monthlyBenefit = adjustBenefitForClaimingAge(benefitAtFRA, claimingAge, birthYear);
    const annualBenefit = monthlyBenefit * 12;
    let nominalLifetimeTotal = 0;
    let pvLifetimeTotal = 0;
    const yearlyBenefits = [];

    for (let age = claimingAge; age <= lifeExpectancy; age++) {
      const yearsFromClaim = age - claimingAge;
      const yearsFromNow = age - currentAge;
      const adjustedBenefit = annualBenefit * Math.pow(1 + cola, yearsFromClaim);
      const pv = adjustedBenefit / Math.pow(1 + discountRate, yearsFromNow);

      nominalLifetimeTotal += adjustedBenefit;
      pvLifetimeTotal += pv;
      yearlyBenefits.push({ age, annualBenefit: adjustedBenefit, presentValue: pv });
    }

    return {
      claimingAge,
      monthlyBenefit,
      annualBenefit,
      nominalLifetimeTotal,
      pvLifetimeTotal,
      yearlyBenefits,
      yearsCollecting: Math.max(0, lifeExpectancy - claimingAge),
    };
  });

  const optimal = results.reduce((best, r) => r.pvLifetimeTotal > best.pvLifetimeTotal ? r : best, results[0]);

  return {
    scenarios: results,
    optimalAge: optimal.claimingAge,
    optimalPV: optimal.pvLifetimeTotal,
  };
}

// ── Break-Even Between Two Claiming Ages ──

export function calculateBreakEven({
  benefitAtFRA,
  earlyAge,
  lateAge,
  cola = SOCIAL_SECURITY_TAX.costOfLivingAdjustment || 0.032,
  birthYear,
}) {
  const earlyAnnual = adjustBenefitForClaimingAge(benefitAtFRA, earlyAge, birthYear) * 12;
  const lateAnnual = adjustBenefitForClaimingAge(benefitAtFRA, lateAge, birthYear) * 12;

  let earlyCumulative = 0;
  let lateCumulative = 0;

  for (let age = earlyAge; age <= 100; age++) {
    const yearsFromEarly = age - earlyAge;
    const yearsFromLate = age - lateAge;

    earlyCumulative += earlyAnnual * Math.pow(1 + cola, yearsFromEarly);
    if (age >= lateAge) {
      lateCumulative += lateAnnual * Math.pow(1 + cola, yearsFromLate);
    }

    if (lateCumulative >= earlyCumulative && age >= lateAge) {
      return { breakEvenAge: age, earlyCumulative, lateCumulative };
    }
  }

  return { breakEvenAge: null, neverBreaksEven: true };
}

// ── Earnings Test ──

export function calculateEarningsTest({ claimingAge, earnedIncome, birthYear, fra = 67 }) {
  const effectiveFRA = birthYear ? getFullRetirementAge(birthYear) : fra;
  if (claimingAge >= effectiveFRA) return { reduction: 0, withheld: 0 };
  const yearOfFRA = (claimingAge === Math.floor(effectiveFRA));
  const exempt2024 = yearOfFRA ? 59520 : 22320;
  const reductionRate = yearOfFRA ? 1 / 3 : 1 / 2;
  const excess = Math.max(0, earnedIncome - exempt2024);
  const withheld = excess * reductionRate;
  return { reduction: withheld, withheld, exemptAmount: exempt2024, excess };
}

// ── Spousal Benefits ──

export function calculateSpousalBenefit({
  workerBenefitAtFRA,
  spouseOwnBenefitAtFRA,
  spouseClaimingAge,
  birthYear,
}) {
  const fra = getFullRetirementAge(birthYear);
  const maxSpousal = workerBenefitAtFRA * 0.5;
  const ownAdjusted = adjustBenefitForClaimingAge(spouseOwnBenefitAtFRA, spouseClaimingAge, birthYear);

  // Spouse gets the higher of their own benefit or the spousal benefit
  if (ownAdjusted >= maxSpousal) {
    return { monthlyBenefit: ownAdjusted, source: 'own', spousalTopUp: 0 };
  }

  let spousalAdjusted = maxSpousal;
  if (spouseClaimingAge < fra) {
    const earlyMonths = Math.round((fra - spouseClaimingAge) * 12);
    const first36 = Math.min(earlyMonths, 36);
    const beyond36 = Math.max(0, earlyMonths - 36);
    const reduction = first36 * SPOUSAL_REDUCTION_RATE_FIRST_36 + beyond36 * SPOUSAL_REDUCTION_RATE_AFTER_36;
    spousalAdjusted = maxSpousal * (1 - reduction);
  }

  return {
    monthlyBenefit: Math.max(ownAdjusted, spousalAdjusted),
    source: spousalAdjusted > ownAdjusted ? 'spousal' : 'own',
    spousalTopUp: Math.max(0, spousalAdjusted - ownAdjusted),
  };
}

// ── Survivor Benefits ──

export function calculateSurvivorBenefit({
  deceasedBenefitAtFRA,
  survivorAge,
  survivorFRA,
  birthYear,
}) {
  const fra = survivorFRA || getFullRetirementAge(birthYear);
  const earliestSurvivor = 60;

  if (survivorAge < earliestSurvivor) return { monthlyBenefit: 0, reductionPercent: 1.0 };
  if (survivorAge >= fra) return { monthlyBenefit: deceasedBenefitAtFRA, reductionPercent: 0 };

  // Linear reduction from 71.5% at 60 to 100% at FRA
  const monthsEarly = (fra - survivorAge) * 12;
  const maxMonthsEarly = (fra - earliestSurvivor) * 12;
  const minPercent = 0.715;
  const reductionPerMonth = (1 - minPercent) / maxMonthsEarly;
  const percent = 1 - monthsEarly * reductionPerMonth;

  return {
    monthlyBenefit: deceasedBenefitAtFRA * percent,
    reductionPercent: 1 - percent,
  };
}

// ── Combined Household Strategy Optimizer ──

export function optimizeHouseholdClaiming({
  spouse1BenefitAtFRA,
  spouse2BenefitAtFRA,
  spouse1CurrentAge,
  spouse2CurrentAge,
  lifeExpectancy1 = 88,
  lifeExpectancy2 = 90,
  discountRate = 0.02,
  spouse1BirthYear,
  spouse2BirthYear,
}) {
  let bestPV = -Infinity;
  let bestStrategy = null;
  const strategies = [];

  // Determine the higher and lower earner for spousal benefit check
  const spouse1IsHigher = spouse1BenefitAtFRA >= spouse2BenefitAtFRA;

  for (let age1 = EARLIEST_CLAIMING_AGE; age1 <= LATEST_CLAIMING_AGE; age1++) {
    for (let age2 = EARLIEST_CLAIMING_AGE; age2 <= LATEST_CLAIMING_AGE; age2++) {
      let annual1 = adjustBenefitForClaimingAge(spouse1BenefitAtFRA, age1, spouse1BirthYear) * 12;
      let annual2 = adjustBenefitForClaimingAge(spouse2BenefitAtFRA, age2, spouse2BirthYear) * 12;

      // Check spousal benefit for the lower earner
      if (spouse1IsHigher) {
        const spousalResult = calculateSpousalBenefit({
          workerBenefitAtFRA: spouse1BenefitAtFRA,
          spouseOwnBenefitAtFRA: spouse2BenefitAtFRA,
          spouseClaimingAge: age2,
          birthYear: spouse2BirthYear,
        });
        if (spousalResult.source === 'spousal') {
          annual2 = spousalResult.monthlyBenefit * 12;
        }
      } else {
        const spousalResult = calculateSpousalBenefit({
          workerBenefitAtFRA: spouse2BenefitAtFRA,
          spouseOwnBenefitAtFRA: spouse1BenefitAtFRA,
          spouseClaimingAge: age1,
          birthYear: spouse1BirthYear,
        });
        if (spousalResult.source === 'spousal') {
          annual1 = spousalResult.monthlyBenefit * 12;
        }
      }

      let totalPV = 0;
      const maxAge = Math.max(lifeExpectancy1 - spouse1CurrentAge, lifeExpectancy2 - spouse2CurrentAge) + Math.max(spouse1CurrentAge, spouse2CurrentAge);

      for (let year = Math.max(spouse1CurrentAge, spouse2CurrentAge); year <= maxAge; year++) {
        const s1Age = year - (Math.max(spouse1CurrentAge, spouse2CurrentAge) - spouse1CurrentAge);
        const s2Age = year - (Math.max(spouse1CurrentAge, spouse2CurrentAge) - spouse2CurrentAge);
        const yearsFromNow = year - Math.max(spouse1CurrentAge, spouse2CurrentAge);

        let benefit = 0;
        const s1Alive = s1Age <= lifeExpectancy1;
        const s2Alive = s2Age <= lifeExpectancy2;

        if (s1Alive && s1Age >= age1) benefit += annual1;
        if (s2Alive && s2Age >= age2) benefit += annual2;

        // Survivor benefit: surviving spouse gets the higher of their own or deceased's
        if (!s1Alive && s2Alive && s2Age >= age2) {
          benefit = Math.max(annual2, annual1);
        }
        if (!s2Alive && s1Alive && s1Age >= age1) {
          benefit = Math.max(annual1, annual2);
        }

        totalPV += benefit / Math.pow(1 + discountRate, yearsFromNow);
      }

      const strategy = {
        spouse1ClaimingAge: age1,
        spouse2ClaimingAge: age2,
        spouse1MonthlyBenefit: annual1 / 12,
        spouse2MonthlyBenefit: annual2 / 12,
        combinedMonthlyBenefit: (annual1 + annual2) / 12,
        householdPV: totalPV,
      };

      strategies.push(strategy);

      if (totalPV > bestPV) {
        bestPV = totalPV;
        bestStrategy = strategy;
      }
    }
  }

  return {
    optimal: bestStrategy,
    allStrategies: strategies,
    strategySummary: strategies
      .sort((a, b) => b.householdPV - a.householdPV)
      .slice(0, 10),
  };
}
