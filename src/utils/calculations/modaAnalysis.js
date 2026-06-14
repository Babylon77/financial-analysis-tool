export function calculateModaScores({
  annualizedROI,
  holdingPeriod,
  ltrTotalROIAnnualized,
  annualCashFlow,
  downPayment,
  renovationCost,
  strTotalROIAnnualized,
  annualStrCashFlow,
  objectiveWeights,
}) {
  const totalWeight = Object.values(objectiveWeights).reduce((sum, w) => sum + w, 0);
  const normalizedWeights = {};
  Object.entries(objectiveWeights).forEach(([key, value]) => {
    normalizedWeights[key] = (value / totalWeight) * 100;
  });

  const initialInvestment = downPayment + renovationCost;

  // Score every strategy's ROI and cash flow on a SINGLE common scale so the
  // comparison is genuinely apples-to-apples. Per-strategy divisors previously
  // baked in a hidden bias (favoring LTR). Anchors: 30% annualized ROI = 10/10;
  // 25% cash-on-cash = 10/10.
  const roiScore = (annualizedRoiPct) => Math.min(10, Math.max(0, annualizedRoiPct / 3));
  const cashFlowScore = (annualCash) => {
    if (!(initialInvestment > 0)) return 0; // guard divide-by-zero -> NaN
    const cashOnCashPct = (annualCash / initialInvestment) * 100;
    return Math.min(10, Math.max(0, cashOnCashPct / 2.5));
  };

  const scores = {
    flip: {
      roi: roiScore(annualizedROI),
      cashFlow: 0, // flips have no ongoing cash flow
      risk: Math.max(0, 10 - (holdingPeriod / 1.2)),
      workload: 3,
    },
    ltr: {
      roi: roiScore(ltrTotalROIAnnualized),
      cashFlow: cashFlowScore(annualCashFlow),
      risk: 7,
      workload: 7,
    },
    str: {
      roi: roiScore(strTotalROIAnnualized),
      cashFlow: cashFlowScore(annualStrCashFlow),
      risk: 4,
      workload: 2,
    },
  };

  const weightedScores = { flip: 0, ltr: 0, str: 0 };

  Object.entries(scores).forEach(([strategy, strategyScores]) => {
    Object.entries(strategyScores).forEach(([objective, score]) => {
      weightedScores[strategy] += (score * normalizedWeights[objective]) / 100;
    });
  });

  return { scores, weightedScores };
}

export function getRecommendedStrategy(weightedScores) {
  // Seed with -Infinity so the genuine maximum wins even if every weighted
  // score is negative (otherwise an all-negative set silently returns 'ltr').
  return Object.entries(weightedScores)
    .reduce((best, [strategy, score]) => (score > best.score ? { strategy, score } : best), { strategy: 'ltr', score: -Infinity })
    .strategy;
}
