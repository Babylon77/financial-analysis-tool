import { RMD_TABLE } from '../constants/taxConstants';

export const WITHDRAWAL_STRATEGY_LABELS = {
  fixed: 'Fixed Dollar (Inflation-Adjusted)',
  percent: 'Percent of Portfolio',
  guyton_klinger: 'Guardrails (Guyton-Klinger)',
  bucket: 'Bucket Strategy',
  vpw: 'Variable Percentage (VPW)',
  rmd_based: 'RMD-Based',
  vanguard_dynamic: 'Vanguard Dynamic Spending',
};

const DEFAULT_PORTFOLIO_RETURN = 0.06;

function getReturn(returnSequence, year) {
  if (returnSequence && returnSequence.length > 0) {
    return returnSequence[Math.min(year, returnSequence.length - 1)];
  }
  return DEFAULT_PORTFOLIO_RETURN;
}

export function getSpendingMultiplier(age, curveType = 'flat') {
  if (curveType === 'flat') return 1.0;
  // Blanchett spending smile: high early, dip in 70s, rise in 80s+ for healthcare
  if (age < 65) return 1.0;
  if (age < 70) return 1.0 - 0.02 * (age - 65); // gradual decline
  if (age < 80) return 0.85 + 0.005 * (age - 70); // bottoms at 0.85, slowly rises
  return 0.90 + 0.015 * (age - 80); // healthcare costs accelerate
}

export function fixedDollarWithdrawal({ portfolioValue, annualWithdrawal, inflationRate = 0.03, years, returnSequence, spendingCurve, startAge, incomeByYear }) {
  const results = [];
  let balance = portfolioValue;

  for (let y = 0; y < years; y++) {
    const portfolioStart = balance;
    let targetSpending = annualWithdrawal * Math.pow(1 + inflationRate, y);

    if (spendingCurve && startAge != null) {
      targetSpending *= getSpendingMultiplier(startAge + y, spendingCurve);
    }

    if (balance <= 0) {
      const income = incomeByYear?.[y] || 0;
      results.push({ year: y, withdrawal: income, portfolioStart: 0, portfolioEnd: 0, withdrawalRate: 0 });
      continue;
    }

    const income = incomeByYear?.[y] || 0;
    const portfolioDraw = Math.max(targetSpending - income, 0);
    const actualDraw = Math.min(portfolioDraw, balance);
    balance -= actualDraw;
    balance *= (1 + getReturn(returnSequence, y));
    const portfolioEnd = Math.max(balance, 0);
    balance = portfolioEnd;

    results.push({
      year: y,
      withdrawal: actualDraw + income,
      portfolioStart,
      portfolioEnd,
      withdrawalRate: portfolioStart > 0 ? actualDraw / portfolioStart : 0,
    });
  }

  return results;
}

export function percentOfPortfolio({ portfolioValue, withdrawalRate = 0.04, years, floor = 0, ceiling = Infinity, returnSequence, incomeByYear }) {
  const results = [];
  let balance = portfolioValue;

  for (let y = 0; y < years; y++) {
    const portfolioStart = balance;
    const income = incomeByYear?.[y] || 0;

    if (balance <= 0) {
      results.push({ year: y, withdrawal: income, portfolioStart: 0, portfolioEnd: 0, withdrawalRate: 0 });
      continue;
    }

    let withdrawal = balance * withdrawalRate;
    withdrawal = Math.max(withdrawal, floor);
    withdrawal = Math.min(withdrawal, ceiling);
    withdrawal = Math.min(withdrawal, balance);

    balance -= withdrawal;
    balance *= (1 + getReturn(returnSequence, y));
    const portfolioEnd = Math.max(balance, 0);
    balance = portfolioEnd;

    results.push({
      year: y,
      withdrawal: withdrawal + income,
      portfolioStart,
      portfolioEnd,
      withdrawalRate: portfolioStart > 0 ? withdrawal / portfolioStart : 0,
    });
  }

  return results;
}

export function guytonKlinger({ portfolioValue, initialWithdrawal, inflationRate = 0.03, years, guardrailWidth = 0.20, returnSequence, spendingCurve, startAge, incomeByYear }) {
  const results = [];
  let balance = portfolioValue;
  let withdrawal = initialWithdrawal;
  const initialRate = initialWithdrawal / portfolioValue;
  const floorWithdrawal = initialWithdrawal * 0.80;
  let previousBalance = portfolioValue;
  let previousReturn = 0;

  for (let y = 0; y < years; y++) {
    const portfolioStart = balance;
    const income = incomeByYear?.[y] || 0;

    if (balance <= 0) {
      results.push({
        year: y, withdrawal: income, portfolioStart: 0, portfolioEnd: 0,
        withdrawalRate: 0, ruleApplied: 'none',
      });
      continue;
    }

    let ruleApplied = 'none';

    if (y > 0) {
      let adjustedWithdrawal = withdrawal;
      if (previousReturn >= 0) {
        adjustedWithdrawal = withdrawal * (1 + inflationRate);
        ruleApplied = 'inflation';
      } else {
        ruleApplied = 'inflation_skipped';
      }

      const currentRate = adjustedWithdrawal / portfolioStart;

      if (currentRate > initialRate * (1 + guardrailWidth)) {
        adjustedWithdrawal *= 0.90;
        ruleApplied = 'ceiling';
      } else if (currentRate < initialRate * (1 - guardrailWidth)) {
        if (portfolioStart >= previousBalance) {
          adjustedWithdrawal *= 1.10;
          ruleApplied = 'prosperity';
        }
      }

      withdrawal = Math.max(adjustedWithdrawal, floorWithdrawal);
    }

    let targetSpending = withdrawal;
    if (spendingCurve && startAge != null) {
      targetSpending *= getSpendingMultiplier(startAge + y, spendingCurve);
    }

    const portfolioDraw = Math.min(Math.max(targetSpending - income, 0), balance);

    previousBalance = portfolioStart;

    balance -= portfolioDraw;
    const yearReturn = getReturn(returnSequence, y);
    previousReturn = yearReturn;
    balance *= (1 + yearReturn);
    const portfolioEnd = Math.max(balance, 0);
    balance = portfolioEnd;

    results.push({
      year: y,
      withdrawal: portfolioDraw + income,
      portfolioStart,
      portfolioEnd,
      withdrawalRate: portfolioStart > 0 ? portfolioDraw / portfolioStart : 0,
      ruleApplied,
    });
  }

  return results;
}

const DEFAULT_BUCKETS = [
  { name: 'Cash', years: 2, allocation: 0, expectedReturn: 0.02 },
  { name: 'Income', years: 5, allocation: 0, expectedReturn: 0.04 },
  { name: 'Growth', years: Infinity, allocation: 0, expectedReturn: 0.08 },
];

export function bucketStrategy({ portfolioValue, annualWithdrawal, inflationRate = 0.03, years, buckets, returnSequence, spendingCurve, startAge, incomeByYear }) {
  const b = (buckets || DEFAULT_BUCKETS).map(bucket => ({ ...bucket }));

  // Allocate portfolio into buckets based on years of withdrawals needed
  let remaining = portfolioValue;
  for (let i = 0; i < b.length; i++) {
    if (i < b.length - 1) {
      const bucketNeed = annualWithdrawal * b[i].years;
      b[i].allocation = Math.min(bucketNeed, remaining);
      remaining -= b[i].allocation;
    } else {
      // Last bucket gets the rest
      b[i].allocation = Math.max(remaining, 0);
    }
  }

  let bucketValues = b.map(bucket => bucket.allocation);
  const withdrawalSchedule = [];
  const bucketTimeline = [
    { year: 0, buckets: b.map((bucket, i) => ({ name: bucket.name, value: bucketValues[i] })) },
  ];

  for (let y = 0; y < years; y++) {
    const totalValue = bucketValues.reduce((sum, v) => sum + v, 0);
    let targetSpending = annualWithdrawal * Math.pow(1 + inflationRate, y);

    if (spendingCurve && startAge != null) {
      targetSpending *= getSpendingMultiplier(startAge + y, spendingCurve);
    }

    const income = incomeByYear?.[y] || 0;

    if (totalValue <= 0) {
      withdrawalSchedule.push({
        year: y, withdrawal: income, portfolioStart: 0, portfolioEnd: 0, withdrawalRate: 0,
      });
      bucketTimeline.push({
        year: y + 1,
        buckets: b.map(bucket => ({ name: bucket.name, value: 0 })),
      });
      continue;
    }

    const portfolioNeed = Math.max(targetSpending - income, 0);
    const withdrawal = Math.min(portfolioNeed, totalValue);

    // Withdraw from cash bucket first
    let toWithdraw = withdrawal;
    for (let i = 0; i < bucketValues.length && toWithdraw > 0; i++) {
      const taken = Math.min(toWithdraw, bucketValues[i]);
      bucketValues[i] -= taken;
      toWithdraw -= taken;
    }

    // Grow each bucket — bucket-appropriate MC return scaling
    const mcReturn = getReturn(returnSequence, y);
    for (let i = 0; i < bucketValues.length; i++) {
      let bucketReturn;
      if (i === 0) { // Cash: stable, ignore MC volatility
        bucketReturn = b[i].expectedReturn;
      } else if (i === b.length - 1) { // Growth: use MC return directly (equity-like)
        bucketReturn = returnSequence ? mcReturn : b[i].expectedReturn;
      } else { // Income: blend of expected and MC
        const blend = 0.3;
        bucketReturn = returnSequence ? b[i].expectedReturn + blend * (mcReturn - b[i].expectedReturn) : b[i].expectedReturn;
      }
      bucketValues[i] *= (1 + bucketReturn);
    }

    // Refill: move from growth -> income, income -> cash to maintain targets
    const targetCash = Math.max(annualWithdrawal * b[0].years - bucketValues[0], 0);
    const refillFromIncome = Math.min(targetCash, bucketValues.length > 1 ? bucketValues[1] : 0);
    if (bucketValues.length > 1) {
      bucketValues[1] -= refillFromIncome;
      bucketValues[0] += refillFromIncome;
    }

    if (bucketValues.length > 2) {
      const targetIncome = Math.max(annualWithdrawal * b[1].years - bucketValues[1], 0);
      const refillFromGrowth = Math.min(targetIncome, bucketValues[2]);
      bucketValues[2] -= refillFromGrowth;
      bucketValues[1] += refillFromGrowth;
    }

    const portfolioEnd = bucketValues.reduce((sum, v) => sum + v, 0);

    withdrawalSchedule.push({
      year: y,
      withdrawal: withdrawal + income,
      portfolioStart: totalValue,
      portfolioEnd: Math.max(portfolioEnd, 0),
      withdrawalRate: totalValue > 0 ? withdrawal / totalValue : 0,
    });

    bucketTimeline.push({
      year: y + 1,
      buckets: b.map((bucket, i) => ({ name: bucket.name, value: Math.max(bucketValues[i], 0) })),
    });
  }

  return { withdrawalSchedule, bucketTimeline };
}

export function generateReturnSequence(years, meanReturn = 0.06, stdDev = 0.12) {
  const sequence = [];
  const drift = Math.log(1 + meanReturn) - 0.5 * stdDev * stdDev;
  for (let y = 0; y < years; y++) {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    sequence.push(Math.exp(drift + stdDev * z) - 1);
  }
  return sequence;
}

export function generatePercentileSequences(years, meanReturn = 0.06, stdDev = 0.12, numSims = 500) {
  const allPaths = [];
  for (let s = 0; s < numSims; s++) {
    allPaths.push(generateReturnSequence(years, meanReturn, stdDev));
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
  };
}

export function calculateSafeWithdrawalRate({ portfolioValue, years, successRate = 0.95, returnSequences, incomeByYear }) {
  const testedRates = [];

  const testPoints = [0.01, 0.02, 0.03, 0.035, 0.04, 0.045, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10];
  for (const rate of testPoints) {
    const pct = simulateSuccessRate(portfolioValue, rate, years, returnSequences, 0, incomeByYear);
    testedRates.push({ rate, successPct: pct });
  }

  let lo = 0;
  let hi = 0.10;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const pct = simulateSuccessRate(portfolioValue, mid, years, returnSequences, 0, incomeByYear);
    if (pct >= successRate) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return {
    safeRate: Math.round(lo * 10000) / 10000,
    testedRates,
  };
}

function simulateSuccessRate(portfolioValue, rate, years, returnSequences, realSpendingGrowth = 0, incomeByYear) {
  let successes = 0;

  for (const sequence of returnSequences) {
    let balance = portfolioValue;
    const baseTotalSpending = portfolioValue * rate;
    let survived = true;

    for (let y = 0; y < years && y < sequence.length; y++) {
      const totalSpending = baseTotalSpending * Math.pow(1 + realSpendingGrowth, y);
      const income = incomeByYear?.[y] || 0;
      const portfolioDraw = Math.max(totalSpending - income, 0);
      balance -= portfolioDraw;
      if (balance <= 0) {
        survived = false;
        break;
      }
      balance *= (1 + sequence[y]);
    }

    if (survived) successes++;
  }

  return successes / returnSequences.length;
}

export function variablePercentageWithdrawal({ portfolioValue, currentAge, lifeExpectancy = 95, floor = 0, ceiling = Infinity, realReturn = 0.05, returnSequence, incomeByYear }) {
  const results = [];
  let balance = portfolioValue;
  const totalYears = lifeExpectancy - currentAge;

  for (let y = 0; y < totalYears; y++) {
    const portfolioStart = balance;
    const remainingYears = lifeExpectancy - (currentAge + y);
    const income = incomeByYear?.[y] || 0;

    if (balance <= 0 || remainingYears <= 0) {
      results.push({ year: y, withdrawal: income, portfolioStart: Math.max(portfolioStart, 0), portfolioEnd: Math.max(balance, 0), withdrawalRate: 0 });
      continue;
    }

    let vpwRate;
    if (realReturn === 0) {
      vpwRate = 1 / remainingYears;
    } else {
      vpwRate = realReturn / (1 - Math.pow(1 + realReturn, -remainingYears));
    }

    let withdrawal = balance * vpwRate;
    withdrawal = Math.min(ceiling, Math.max(floor, withdrawal));
    withdrawal = Math.min(withdrawal, balance);

    balance -= withdrawal;
    const yearReturn = getReturn(returnSequence, y);
    balance *= (1 + yearReturn);
    const portfolioEnd = Math.max(balance, 0);
    balance = portfolioEnd;

    results.push({
      year: y,
      withdrawal: withdrawal + income,
      portfolioStart,
      portfolioEnd,
      withdrawalRate: portfolioStart > 0 ? withdrawal / portfolioStart : 0,
    });
  }

  return results;
}

export function rmdBasedWithdrawal({ portfolioValue, startAge, endAge = 95, returnSequence, incomeByYear }) {
  const results = [];
  let balance = portfolioValue;
  const years = endAge - startAge;

  for (let y = 0; y < years; y++) {
    const portfolioStart = balance;
    const income = incomeByYear?.[y] || 0;

    if (balance <= 0) {
      results.push({ year: y, withdrawal: income, portfolioStart: 0, portfolioEnd: 0, withdrawalRate: 0 });
      continue;
    }

    const age = startAge + y;
    const divisor = RMD_TABLE[age] != null ? RMD_TABLE[age] : (endAge - age);
    const withdrawal = Math.min(balance / divisor, balance);

    balance -= withdrawal;
    balance *= (1 + getReturn(returnSequence, y));
    const portfolioEnd = Math.max(balance, 0);
    balance = portfolioEnd;

    results.push({
      year: y,
      withdrawal: withdrawal + income,
      portfolioStart,
      portfolioEnd,
      withdrawalRate: portfolioStart > 0 ? withdrawal / portfolioStart : 0,
    });
  }

  return results;
}

export function vanguardDynamicSpending({ portfolioValue, withdrawalRate = 0.04, ceilingPct = 0.05, floorPct = 0.025, inflationRate = 0, years, returnSequence, incomeByYear }) {
  const results = [];
  let balance = portfolioValue;
  let prevWithdrawal = null;

  for (let y = 0; y < years; y++) {
    const portfolioStart = balance;
    const income = incomeByYear?.[y] || 0;

    if (balance <= 0) {
      results.push({ year: y, withdrawal: income, portfolioStart: 0, portfolioEnd: 0, withdrawalRate: 0 });
      continue;
    }

    let withdrawal;
    if (y === 0) {
      withdrawal = portfolioValue * withdrawalRate;
    } else {
      const target = balance * withdrawalRate;
      withdrawal = Math.min(
        prevWithdrawal * (1 + ceilingPct),
        Math.max(prevWithdrawal * (1 - floorPct), target)
      );
    }

    withdrawal = Math.min(withdrawal, balance);
    prevWithdrawal = withdrawal;

    balance -= withdrawal;
    balance *= (1 + getReturn(returnSequence, y));
    const portfolioEnd = Math.max(balance, 0);
    balance = portfolioEnd;

    results.push({
      year: y,
      withdrawal: withdrawal + income,
      portfolioStart,
      portfolioEnd,
      withdrawalRate: portfolioStart > 0 ? withdrawal / portfolioStart : 0,
    });
  }

  return results;
}
