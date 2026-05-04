import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { migrateState } from '../utils/stateMigration';

const FinancialPlanContext = createContext(null);

const STORAGE_KEY = 'financialPlanState_v2';

const OLD_STORAGE_KEYS = {
  CONFIG: 'assetAllocationData',
  COMPLETE: 'assetAllocationComplete',
  SCENARIO: 'retirementScenarioData',
  HEATMAP: 'heatmapData',
  HEATMAP_AGE: 'selectedHeatmapAge',
  MC_SCENARIO: 'monteCarloScenario',
  USER_PROFILE: 'userProfile',
};

function loadJSON(key, fallback) {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export const DEFAULT_PROFILE = {
  filingStatus: 'married_filing_jointly',
  spouse1: { name: 'Spouse 1', currentAge: 45, retirementAge: 65 },
  spouse2: { name: 'Spouse 2', currentAge: 46, retirementAge: 65 },
  lifeExpectancy: 90,
  dependents: 0,
  income: 120000,
  annualSpending: 80000,
  annualSavings: 50000,
  savingsGrowthRate: 3.0,
  accounts: { trad401k: 0, roth401k: 0, tradIRA: 0, rothIRA: 0, hsa: 0, taxable: 0 },
  matchPctOfSalary: 6,
  matchRate: 50,
  hsaEligible: true,
  ss1: 2800,
  ss2: 1400,
  pension1: { startAge: 65, annualAmount: 0 },
  pension2: { startAge: 67, annualAmount: 0 },
};

export const DEFAULT_CONFIG = {
  initialInvestment: 4200000,
  years: 30,
  annualContribution: 50000,
  savingsGrowthRate: 3.0,
  riskProfile: 'balanced',
  numberOfSimulations: 10000,
  inflationRate: 2.5,
};

export const DEFAULT_DRAWDOWN_PHASES = [
  { startAge: 65, endAge: 75, annualAmount: 200000, description: 'Early retirement phase' },
  { startAge: 75, endAge: 85, annualAmount: 160000, description: 'Reduced expenses' },
  { startAge: 85, endAge: 90, annualAmount: 100000, description: 'Late retirement + Social Security' },
];

function buildInitialState() {
  // Try new storage key first
  const v2State = loadJSON(STORAGE_KEY, null);
  if (v2State && v2State.profile) {
    return {
      profile: v2State.profile,
      simulationConfig: v2State.simulationConfig || { ...DEFAULT_CONFIG },
      simulationResults: v2State.simulationResults || null,
      drawdownPhases: v2State.drawdownPhases || [...DEFAULT_DRAWDOWN_PHASES],
      heatmapData: v2State.heatmapData || [],
      selectedHeatmapAge: v2State.selectedHeatmapAge || 62,
      monteCarloScenario: v2State.monteCarloScenario || 'median',
    };
  }

  // Fall back to old storage keys and migrate
  const oldConfig = loadJSON(OLD_STORAGE_KEYS.CONFIG, DEFAULT_CONFIG);
  const oldComplete = loadJSON(OLD_STORAGE_KEYS.COMPLETE, null);
  const oldUserProfile = loadJSON(OLD_STORAGE_KEYS.USER_PROFILE, null);
  const oldScenario = loadJSON(OLD_STORAGE_KEYS.SCENARIO, null);
  const oldHeatmap = loadJSON(OLD_STORAGE_KEYS.HEATMAP, []);
  const oldHeatmapAge = parseInt(sessionStorage.getItem(OLD_STORAGE_KEYS.HEATMAP_AGE) || '62', 10);
  const oldMcScenario = sessionStorage.getItem(OLD_STORAGE_KEYS.MC_SCENARIO) || 'median';

  if (oldUserProfile || oldScenario) {
    const migrated = migrateState({
      userProfile: oldUserProfile,
      retirementScenario: oldScenario,
      simulationConfig: oldConfig,
      simulationResults: oldComplete?.simulationResults || null,
      heatmapData: oldHeatmap,
      selectedHeatmapAge: oldHeatmapAge,
      monteCarloScenario: oldMcScenario,
    });
    // Clean up old keys
    Object.values(OLD_STORAGE_KEYS).forEach(k => sessionStorage.removeItem(k));
    return {
      profile: migrated.profile,
      simulationConfig: migrated.simulationConfig || DEFAULT_CONFIG,
      simulationResults: migrated.simulationResults,
      drawdownPhases: migrated.drawdownPhases || [...DEFAULT_DRAWDOWN_PHASES],
      heatmapData: migrated.heatmapData,
      selectedHeatmapAge: migrated.selectedHeatmapAge,
      monteCarloScenario: migrated.monteCarloScenario,
    };
  }

  return {
    profile: { ...DEFAULT_PROFILE },
    simulationConfig: { ...DEFAULT_CONFIG },
    simulationResults: null,
    drawdownPhases: [...DEFAULT_DRAWDOWN_PHASES],
    heatmapData: [],
    selectedHeatmapAge: 62,
    monteCarloScenario: 'median',
    spendDownAnalysis: null,
  };
}

function financialPlanReducer(state, action) {
  switch (action.type) {
    case 'SET_PROFILE': {
      const payload = action.payload;
      const newProfile = { ...state.profile };
      const nestedKeys = ['spouse1', 'spouse2', 'accounts', 'pension1', 'pension2'];
      for (const key of Object.keys(payload)) {
        if (nestedKeys.includes(key) && typeof payload[key] === 'object' && payload[key] !== null) {
          newProfile[key] = { ...state.profile[key], ...payload[key] };
        } else {
          newProfile[key] = payload[key];
        }
      }
      const newState = { ...state, profile: newProfile };
      if (payload.annualSavings !== undefined && payload.annualSavings !== state.simulationConfig.annualContribution) {
        newState.simulationConfig = { ...newState.simulationConfig, annualContribution: payload.annualSavings };
      }
      if (payload.savingsGrowthRate !== undefined && payload.savingsGrowthRate !== state.simulationConfig.savingsGrowthRate) {
        newState.simulationConfig = { ...newState.simulationConfig, savingsGrowthRate: payload.savingsGrowthRate };
      }
      return newState;
    }

    case 'SET_PROFILE_ACCOUNTS':
      return {
        ...state,
        profile: {
          ...state.profile,
          accounts: { ...state.profile.accounts, ...action.payload },
        },
      };

    case 'SET_SIMULATION_CONFIG': {
      const newState = { ...state, simulationConfig: { ...state.simulationConfig, ...action.payload } };
      if (action.payload.annualContribution !== undefined && action.payload.annualContribution !== state.profile.annualSavings) {
        newState.profile = { ...newState.profile, annualSavings: action.payload.annualContribution };
      }
      if (action.payload.savingsGrowthRate !== undefined && action.payload.savingsGrowthRate !== state.profile.savingsGrowthRate) {
        newState.profile = { ...newState.profile, savingsGrowthRate: action.payload.savingsGrowthRate };
      }
      return newState;
    }

    case 'SET_SIMULATION_RESULTS':
      return { ...state, simulationResults: action.payload };

    case 'SET_DRAWDOWN_PHASES':
      return { ...state, drawdownPhases: action.payload };

    case 'SET_HEATMAP_DATA':
      return { ...state, heatmapData: action.payload };

    case 'SET_HEATMAP_AGE':
      return { ...state, selectedHeatmapAge: action.payload };

    case 'SET_MC_SCENARIO':
      return { ...state, monteCarloScenario: action.payload };

    case 'SET_SPEND_DOWN_ANALYSIS':
      return { ...state, spendDownAnalysis: action.payload };

    case 'SYNC_FROM_SIMULATION': {
      const { config, results } = action.payload;
      return {
        ...state,
        simulationConfig: config,
        simulationResults: results,
      };
    }

    case 'LOAD_ALL': {
      const loaded = action.payload;
      if (loaded.userProfile || loaded.retirementScenario) {
        const migrated = migrateState(loaded);
        return { ...state, ...migrated };
      }
      return {
        ...state,
        profile: loaded.profile || state.profile,
        simulationConfig: loaded.simulationConfig || state.simulationConfig,
        simulationResults: loaded.simulationResults ?? state.simulationResults,
        drawdownPhases: loaded.drawdownPhases || state.drawdownPhases,
        heatmapData: loaded.heatmapData || state.heatmapData,
        selectedHeatmapAge: loaded.selectedHeatmapAge ?? state.selectedHeatmapAge,
        monteCarloScenario: loaded.monteCarloScenario || state.monteCarloScenario,
      };
    }

    default:
      return state;
  }
}

export function FinancialPlanProvider({ children }) {
  const [state, dispatch] = useReducer(financialPlanReducer, null, buildInitialState);
  const debounceRef = useRef(null);
  const cloudSyncRef = useRef(null);
  const hasLoadedFromCloud = useRef(false);
  const { isAuthenticated, loadFinancialData, saveFinancialData } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || hasLoadedFromCloud.current) return;
    hasLoadedFromCloud.current = true;

    loadFinancialData().then((cloudData) => {
      if (cloudData) {
        dispatch({ type: 'LOAD_ALL', payload: cloudData });
      }
    }).catch(() => {});
  }, [isAuthenticated, loadFinancialData]);

  useEffect(() => {
    if (!isAuthenticated) hasLoadedFromCloud.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          profile: state.profile,
          simulationConfig: state.simulationConfig,
          simulationResults: state.simulationResults,
          drawdownPhases: state.drawdownPhases,
          selectedHeatmapAge: state.selectedHeatmapAge,
          monteCarloScenario: state.monteCarloScenario,
        }));
      } catch {
        // sessionStorage quota exceeded — non-critical
      }
    }, 300);

    if (isAuthenticated && hasLoadedFromCloud.current) {
      if (cloudSyncRef.current) clearTimeout(cloudSyncRef.current);
      cloudSyncRef.current = setTimeout(() => {
        const payload = {
          profile: state.profile,
          simulationConfig: state.simulationConfig,
          simulationResults: state.simulationResults,
          drawdownPhases: state.drawdownPhases,
          selectedHeatmapAge: state.selectedHeatmapAge,
          monteCarloScenario: state.monteCarloScenario,
        };
        saveFinancialData(payload).catch(() => {});
      }, 5000);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (cloudSyncRef.current) clearTimeout(cloudSyncRef.current);
    };
  }, [state, isAuthenticated, saveFinancialData]);

  const contextValue = React.useMemo(() => ({ state, dispatch }), [state]);

  return (
    <FinancialPlanContext.Provider value={contextValue}>
      {children}
    </FinancialPlanContext.Provider>
  );
}

export function useFinancialPlan() {
  const context = useContext(FinancialPlanContext);
  if (!context) {
    throw new Error('useFinancialPlan must be used within a FinancialPlanProvider');
  }
  return context;
}
