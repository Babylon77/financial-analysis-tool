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

  const scores = {
    flip: {
      roi: Math.min(10, annualizedROI / 5),
      cashFlow: 0,
      risk: Math.max(0, 10 - (holdingPeriod / 1.2)),
      workload: 8,
    },
    ltr: {
      roi: Math.min(10, ltrTotalROIAnnualized / 2),
      cashFlow: Math.min(10, annualCashFlow / initialInvestment * 20),
      risk: 7,
      workload: 5,
    },
    str: {
      roi: Math.min(10, strTotalROIAnnualized / 3),
      cashFlow: Math.min(10, annualStrCashFlow / initialInvestment * 15),
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
  return Object.entries(weightedScores)
    .reduce((best, [strategy, score]) => (score > best.score ? { strategy, score } : best), { strategy: 'ltr', score: 0 })
    .strategy;
}
