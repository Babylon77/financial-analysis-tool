import { DEFAULT_PROFILE, DEFAULT_DRAWDOWN_PHASES } from '../context/FinancialPlanContext';

export function migrateState(oldState) {
  if (!oldState) return null;
  if (oldState.profile && !oldState.userProfile) return oldState;

  const up = oldState.userProfile || {};
  const rs = oldState.retirementScenario || {};
  const sc = oldState.simulationConfig || {};

  return {
    profile: {
      filingStatus: up.filingStatus || DEFAULT_PROFILE.filingStatus,
      spouse1: {
        name: rs.spouse1Name || 'Spouse 1',
        currentAge: rs.spouse1CurrentAge || up.currentAge || DEFAULT_PROFILE.spouse1.currentAge,
        retirementAge: rs.spouse1RetirementAge || up.retirementAge || DEFAULT_PROFILE.spouse1.retirementAge,
      },
      spouse2: {
        name: rs.spouse2Name || 'Spouse 2',
        currentAge: rs.spouse2CurrentAge || up.currentAge || DEFAULT_PROFILE.spouse2.currentAge,
        retirementAge: rs.spouse2RetirementAge || up.retirementAge || DEFAULT_PROFILE.spouse2.retirementAge,
      },
      lifeExpectancy: rs.endAge || up.lifeExpectancy || DEFAULT_PROFILE.lifeExpectancy,
      dependents: up.dependents || 0,
      income: up.income || DEFAULT_PROFILE.income,
      annualSpending: up.annualSpending || DEFAULT_PROFILE.annualSpending,
      annualSavings: rs.annualSavings || sc.annualContribution || DEFAULT_PROFILE.annualSavings,
      savingsGrowthRate: rs.savingsGrowthRate || sc.savingsGrowthRate || DEFAULT_PROFILE.savingsGrowthRate,
      accounts: up.accounts || { ...DEFAULT_PROFILE.accounts },
      matchPctOfSalary: up.matchPctOfSalary ?? DEFAULT_PROFILE.matchPctOfSalary,
      matchRate: up.matchRate ?? DEFAULT_PROFILE.matchRate,
      hsaEligible: up.hsaEligible ?? DEFAULT_PROFILE.hsaEligible,
      ss1: up.ss1 || DEFAULT_PROFILE.ss1,
      ss2: up.ss2 || DEFAULT_PROFILE.ss2,
      pension1: rs.spouse1Pension || { startAge: 65, annualAmount: up.pension || 0 },
      pension2: rs.spouse2Pension || { startAge: 67, annualAmount: 0 },
    },
    simulationConfig: oldState.simulationConfig || {},
    simulationResults: oldState.simulationResults || null,
    drawdownPhases: rs.drawdownPhases || [...DEFAULT_DRAWDOWN_PHASES],
    heatmapData: oldState.heatmapData || [],
    selectedHeatmapAge: oldState.selectedHeatmapAge || 62,
    monteCarloScenario: oldState.monteCarloScenario || 'median',
  };
}
