import React, { useState, useMemo, useEffect } from 'react';
import { runMonteCarloSimulation, RISK_PROFILES } from '../utils/monteCarloSimulation';
import MonteCarloChart from './MonteCarloChart';
import MonteCarloResults from './MonteCarloResults';
import SavingsGrowthChart from './SavingsGrowthChart';
import MoneyInput from './MoneyInput';
import { formatCurrency } from '../utils/formatters';
import { useFinancialPlan, DEFAULT_CONFIG } from '../context/FinancialPlanContext';

const MonteCarloSimulator = ({ initialInvestment = 4200000 }) => {
  const { state: planState, dispatch } = useFinancialPlan();

  const profileTotal = useMemo(() =>
    Object.values(planState.profile.accounts).reduce((s, v) => s + v, 0),
    [planState.profile.accounts]
  );

  const [configValues, setConfigValues] = useState(() => {
    const config = { ...planState.simulationConfig };
    if (config.initialInvestment === DEFAULT_CONFIG.initialInvestment && profileTotal > 0) {
      config.initialInvestment = profileTotal;
    }
    return config;
  });
  const [simulationResults, setSimulationResults] = useState(planState.simulationResults);
  const [isLoading, setIsLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(!!planState.simulationResults);

  const profileSavings = planState.profile.annualSavings;
  const profileYears = Math.max(1, planState.profile.spouse1.retirementAge - planState.profile.spouse1.currentAge);

  useEffect(() => {
    const updates = {};
    if (profileTotal > 0 && profileTotal !== configValues.initialInvestment) {
      updates.initialInvestment = profileTotal;
    }
    if (profileSavings > 0 && profileSavings !== configValues.annualContribution) {
      updates.annualContribution = profileSavings;
    }
    if (profileYears > 0 && profileYears !== configValues.years) {
      updates.years = profileYears;
    }
    if (Object.keys(updates).length > 0) {
      setConfigValues(prev => ({ ...prev, ...updates }));
      dispatch({ type: 'SET_SIMULATION_CONFIG', payload: updates });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileTotal, profileSavings, profileYears]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const numericFields = ['initialInvestment', 'years', 'annualContribution', 'numberOfSimulations',
         'inflationRate', 'savingsGrowthRate'];
    const newValue = numericFields.includes(name) ? (parseFloat(value) || 0) : value;
    const updated = { ...configValues, [name]: newValue };
    setConfigValues(updated);
    dispatch({ type: 'SET_SIMULATION_CONFIG', payload: { [name]: newValue } });
  };

  const runSimulation = () => {
    setIsLoading(true);

    setTimeout(() => {
      try {
        // Use profile age if available, otherwise default to 25
        const startingAge = planState?.profile?.spouse1?.currentAge || 25;

        const results = runMonteCarloSimulation({
          initialInvestment: configValues.initialInvestment,
          years: configValues.years,
          annualContribution: configValues.annualContribution,
          savingsGrowthRate: configValues.savingsGrowthRate / 100,
          riskProfile: configValues.riskProfile,
          numberOfSimulations: configValues.numberOfSimulations,
          inflationRate: configValues.inflationRate / 100,
          startingAge,
        });

        setSimulationResults(results);
        setShowValidation(true);
        dispatch({ type: 'SET_SIMULATION_CONFIG', payload: { ...configValues } });
        dispatch({ type: 'SYNC_FROM_SIMULATION', payload: { config: configValues, results } });
      } catch (error) {
        console.error("Error running simulation:", error);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  };

  const getProfileDescription = (profile) => {
    const p = RISK_PROFILES[profile];
    if (!p) return '';
    return `${p.stocks * 100}% stocks / ${p.bonds * 100}% bonds`;
  };

  return (
    <div className="terminal-card p-6 mb-6">
      <h2 className="text-lg font-display font-semibold text-terminal-green uppercase tracking-wider crt-glow mb-4">Investment Projection Simulator</h2>
      <p className="text-txt-secondary mb-6">
        This Monte Carlo simulation models potential investment outcomes based on historical market data
        and economic cycles. It includes realistic bull/bear market cycles and incorporates extreme events like market crashes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Initial Investment
            </label>
            <MoneyInput
              name="initialInvestment"
              value={configValues.initialInvestment}
              onChange={handleInputChange}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Annual Contribution
            </label>
            <MoneyInput
              name="annualContribution"
              value={configValues.annualContribution}
              onChange={handleInputChange}
            />
            <p className="mt-1 text-xs text-txt-muted">
              Starting annual contribution amount
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Savings Growth Rate (% per year)
            </label>
            <input
              type="number"
              name="savingsGrowthRate"
              value={configValues.savingsGrowthRate}
              onChange={handleInputChange}
              className="terminal-input block w-full sm:text-sm rounded-md"
              placeholder="3.0"
              step="0.1"
              min="0"
              max="15"
            />
            <p className="mt-1 text-xs text-txt-muted">
              Annual increase in savings rate above inflation (career progression, raises, etc.)
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Time Horizon (Years to Retirement)
            </label>
            <input
              type="number"
              name="years"
              value={configValues.years}
              onChange={handleInputChange}
              className="terminal-input block w-full sm:text-sm rounded-md"
              placeholder="30"
              min="1"
              max="50"
            />
            <p className="mt-1 text-xs text-txt-muted">
              Age {planState.profile.spouse1.currentAge} → {planState.profile.spouse1.retirementAge} ({profileYears} years from profile)
            </p>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Risk Profile
            </label>
            <select
              name="riskProfile"
              value={configValues.riskProfile}
              onChange={handleInputChange}
              className="terminal-input bg-surface-elevated text-terminal-green mt-1 block w-full pl-3 pr-10 py-2 text-base sm:text-sm rounded-md"
            >
              {Object.keys(RISK_PROFILES).map(profile => (
                <option key={profile} value={profile}>
                  {profile.charAt(0).toUpperCase() + profile.slice(1)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-txt-muted">
              {getProfileDescription(configValues.riskProfile)}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Expected Inflation Rate (%)
            </label>
            <input
              type="number"
              name="inflationRate"
              value={configValues.inflationRate}
              onChange={handleInputChange}
              className="terminal-input block w-full sm:text-sm rounded-md"
              placeholder="3.0"
              step="0.1"
              min="0"
              max="10"
            />
            <p className="mt-1 text-xs text-txt-muted">
              Mean for stochastic inflation model (O-U process). Historical average ~3%.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-txt-secondary mb-1">
              Number of Simulations
            </label>
            <input
              type="number"
              name="numberOfSimulations"
              value={configValues.numberOfSimulations}
              onChange={handleInputChange}
              className="terminal-input block w-full sm:text-sm rounded-md"
              placeholder="10000"
              step="1000"
              min="1000"
              max="50000"
            />
            <p className="mt-1 text-xs text-txt-muted">
              More simulations = more stable results. 10,000+ recommended for reliable percentiles.
            </p>
          </div>

          <div className="mt-4 bg-surface-elevated border border-surface-border p-3 rounded-lg text-xs text-txt-primary">
            <h4 className="font-medium text-terminal-cyan mb-1">Expected Real Return (Above Inflation)</h4>
            <p>
              <strong>{RISK_PROFILES[configValues.riskProfile].meanReturn}%</strong> real annual average for {configValues.riskProfile} portfolio
              <br/>
              <span className="text-terminal-cyan">Range: {RISK_PROFILES[configValues.riskProfile].worstYear}% to {RISK_PROFILES[configValues.riskProfile].bestYear}% in a single year</span>
              <br/>
              <span className="text-terminal-cyan">Historical max drawdown: {RISK_PROFILES[configValues.riskProfile].maxDrawdown}%</span>
              <br/>
              <span className="text-terminal-amber font-medium">All returns are real (inflation-adjusted). Inflation simulated stochastically (mean {configValues.inflationRate}%).</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={runSimulation}
          disabled={isLoading}
          className="glow-btn glow-btn-green px-8 py-3 text-sm font-mono rounded disabled:opacity-50"
        >
          {isLoading ? 'Running Simulation...' : 'Run Simulation'}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-80 bg-surface-elevated rounded-lg border border-surface-border">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terminal-green mx-auto mb-4"></div>
            <p className="text-txt-secondary">Running {configValues.numberOfSimulations.toLocaleString()} simulations...</p>
          </div>
        </div>
      )}

      {!isLoading && simulationResults && (
        <div className="mt-4">
          <MonteCarloChart
            simulationData={simulationResults}
          />

          <div className="mt-6">
            <MonteCarloResults simulationData={simulationResults} />
          </div>

          <div className="mt-6">
            <SavingsGrowthChart
              timeSeriesData={simulationResults.timeSeriesData}
              initialSavings={configValues.annualContribution}
              savingsGrowthRate={configValues.savingsGrowthRate}
              spouse1RetirementAge={configValues.years + (planState?.profile?.spouse1?.currentAge || 25)}
              spouse2RetirementAge={configValues.years + (planState?.profile?.spouse2?.currentAge || 25)}
              spouse1Age={planState?.profile?.spouse1?.currentAge || 25}
              spouse2Age={planState?.profile?.spouse2?.currentAge || 25}
            />
          </div>

          {showValidation && (
            <div className="mt-6 bg-surface-elevated border border-terminal-dark-green p-4 rounded-lg">
              <h3 className="text-lg font-display font-semibold text-terminal-green mb-2">Model Validation</h3>
              <div className="text-sm">
                <p className="text-txt-primary mb-2">This simulation has been calibrated to match historical performance:</p>
                <ul className="list-disc pl-5 space-y-1 text-txt-primary">
                  <li>
                    <strong>Expected Real Return:</strong> {RISK_PROFILES[configValues.riskProfile].meanReturn}% |
                    <strong> Simulated Real CAGR:</strong> <span className="data-cell">{(simulationResults.medianCAGR * 100).toFixed(2)}%</span>
                  </li>
                  <li>
                    <strong>Historical drawdowns:</strong> {Math.abs(RISK_PROFILES[configValues.riskProfile].maxDrawdown)}% |
                    <strong> Simulated:</strong> <span className="data-cell">{Math.abs((simulationResults.drawdowns.worst * 100).toFixed(1))}%</span>
                  </li>
                  <li>
                    The model correctly simulates market regimes (bull/bear markets) and extreme events like the 2008 crisis.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-6 bg-surface-elevated border border-surface-border p-4 rounded-lg">
            <h3 className="text-lg font-display font-semibold text-terminal-green mb-2">Simulation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-txt-primary">
                  <span className="font-medium">Initial Investment:</span> {' '}
                  <span className="font-bold data-cell">{formatCurrency(configValues.initialInvestment)}</span>
                </p>
                <p className="text-xs text-txt-secondary">
                  With {configValues.annualContribution > 0 ? formatCurrency(configValues.annualContribution) + ' annual contribution' : 'no annual contributions'}
                </p>
              </div>

              <div>
                <p className="text-sm text-txt-primary">
                  <span className="font-medium">Median Final Value:</span> {' '}
                  <span className="font-bold data-cell">{formatCurrency(simulationResults.finalValues.median)}</span>
                </p>
                <p className="text-xs text-txt-secondary">
                  After {configValues.years} years (inflation-adjusted)
                </p>
              </div>

              <div>
                <p className="text-sm text-txt-primary">
                  <span className="font-medium">Risk Profile:</span> {' '}
                  <span className="font-bold capitalize">{configValues.riskProfile}</span>
                </p>
                <p className="text-xs text-txt-secondary">
                  Historical range: {RISK_PROFILES[configValues.riskProfile].worstYear}% to {RISK_PROFILES[configValues.riskProfile].bestYear}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-txt-muted">
        <p>DISCLAIMER: This simulation is for educational purposes only and does not constitute financial advice.
        Past performance does not guarantee future results. The simulation uses historical data patterns but actual
        future market conditions may differ significantly.</p>
      </div>
    </div>
  );
};

export default MonteCarloSimulator;