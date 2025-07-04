import React, { useState, useEffect } from 'react';
import { runMonteCarloSimulation, RISK_PROFILES } from '../utils/monteCarloSimulation';
import MonteCarloChart from './MonteCarloChart';
import MonteCarloResults from './MonteCarloResults';
import { formatCurrency } from '../utils/formatters';

const MonteCarloSimulator = ({ initialInvestment = 4200000 }) => {
  // Load persisted data from sessionStorage
  const loadPersistedData = () => {
    try {
      const savedData = sessionStorage.getItem('assetAllocationData');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
    return {
    initialInvestment: initialInvestment,
    years: 30,
      annualContribution: 50000,
    riskProfile: 'balanced',
      numberOfSimulations: 10000,
    inflationRate: 2.5
    };
  };

  const [configValues, setConfigValues] = useState(loadPersistedData());

  // Load persisted simulation results
  const loadPersistedResults = () => {
    try {
      const savedData = sessionStorage.getItem('assetAllocationComplete');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        return parsed.simulationResults || null;
      }
    } catch (error) {
      console.error('Error loading persisted results:', error);
    }
    return null;
  };

  const [simulationResults, setSimulationResults] = useState(loadPersistedResults());
  const [isLoading, setIsLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(!!loadPersistedResults());

  // Persist data to sessionStorage whenever configValues change
  useEffect(() => {
    try {
      sessionStorage.setItem('assetAllocationData', JSON.stringify(configValues));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [configValues]);

  // Also persist simulation results for Advanced Retirement Planner
  useEffect(() => {
    if (simulationResults) {
      try {
        const dataToSave = {
          ...configValues,
          simulationResults,
          lastUpdated: Date.now()
        };
        sessionStorage.setItem('assetAllocationComplete', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving simulation results:', error);
      }
    }
  }, [simulationResults, configValues]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric inputs
    if (['initialInvestment', 'years', 'annualContribution', 'numberOfSimulations', 
         'inflationRate'].includes(name)) {
      setConfigValues({
        ...configValues,
        [name]: parseFloat(value) || 0
      });
    } else {
      setConfigValues({
        ...configValues,
        [name]: value
      });
    }
  };

  const runSimulation = () => {
    setIsLoading(true);
    
    // Short timeout to allow UI to update with loading state
    setTimeout(() => {
      try {
        const results = runMonteCarloSimulation({
          initialInvestment: configValues.initialInvestment,
          years: configValues.years,
          annualContribution: configValues.annualContribution,
          riskProfile: configValues.riskProfile,
          numberOfSimulations: configValues.numberOfSimulations,
          inflationRate: configValues.inflationRate / 100
        });
        
        setSimulationResults(results);
        setShowValidation(true);
      } catch (error) {
        console.error("Error running simulation:", error);
        // Could add error state handling here
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Investment Projection Simulator</h2>
      <p className="text-gray-600 mb-6">
        This Monte Carlo simulation models potential investment outcomes based on historical market data 
        and economic cycles. It includes realistic bull/bear market cycles and incorporates extreme events like market crashes.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Investment
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="initialInvestment"
                value={configValues.initialInvestment}
                onChange={handleInputChange}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0"
                min="0"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Contribution
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="annualContribution"
                value={configValues.annualContribution}
                onChange={handleInputChange}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="0"
                min="0"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Amount added to your portfolio annually
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Horizon (Years)
            </label>
            <input
              type="number"
              name="years"
              value={configValues.years}
              onChange={handleInputChange}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="30"
              min="1"
              max="50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Longer time horizons generally reduce investment risk
            </p>
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Profile
            </label>
            <select
              name="riskProfile"
              value={configValues.riskProfile}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {Object.keys(RISK_PROFILES).map(profile => (
                <option key={profile} value={profile}>
                  {profile.charAt(0).toUpperCase() + profile.slice(1)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {getProfileDescription(configValues.riskProfile)}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inflation Rate (%)
            </label>
            <input
              type="number"
              name="inflationRate"
              value={configValues.inflationRate}
              onChange={handleInputChange}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="2.5"
              step="0.1"
              min="0"
              max="10"
            />
            <p className="mt-1 text-xs text-gray-500">
              Historical average is 2-3% annually in the United States
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Simulations
            </label>
            <input
              type="number"
              name="numberOfSimulations"
              value={configValues.numberOfSimulations}
              onChange={handleInputChange}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="10000"
              step="1000"
              min="1000"
              max="50000"
            />
            <p className="mt-1 text-xs text-gray-500">
              More simulations = more stable results. 10,000+ recommended for reliable percentiles.
            </p>
          </div>
          
          <div className="mt-4 bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
            <h4 className="font-medium text-blue-800 mb-1">Expected Return (Real Return Above Inflation)</h4>
            <p>
              <strong>{RISK_PROFILES[configValues.riskProfile].meanReturn}%</strong> annual average for {configValues.riskProfile} portfolio
              <br/>
              <span className="text-blue-600">Range: {RISK_PROFILES[configValues.riskProfile].worstYear}% to {RISK_PROFILES[configValues.riskProfile].bestYear}% in a single year</span>
              <br/>
              <span className="text-blue-600">Historical max drawdown: {RISK_PROFILES[configValues.riskProfile].maxDrawdown}%</span>
              <br/>
              <span className="text-blue-500 font-medium">💡 These returns are inflation-adjusted (real returns). Simulation accounts for {configValues.inflationRate}% inflation.</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mb-6">
        <button
          onClick={runSimulation}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Running Simulation...' : 'Run Simulation'}
        </button>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center h-80 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Running {configValues.numberOfSimulations.toLocaleString()} simulations...</p>
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
          
          {showValidation && (
            <div className="mt-6 bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Model Validation</h3>
              <div className="text-sm">
                <p className="mb-2">This simulation has been calibrated to match historical performance:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>
                    <strong>Target annual return:</strong> {RISK_PROFILES[configValues.riskProfile].meanReturn}% | 
                    <strong> Simulated:</strong> {(simulationResults.avgAnnualReturn * 100).toFixed(2)}%
                  </li>
                  <li>
                    <strong>Historical drawdowns:</strong> {Math.abs(RISK_PROFILES[configValues.riskProfile].maxDrawdown)}% | 
                    <strong> Simulated:</strong> {Math.abs((simulationResults.drawdowns.worst * 100).toFixed(1))}%
                  </li>
                  <li>
                    The model correctly simulates market regimes (bull/bear markets) and extreme events like the 2008 crisis.
                  </li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Simulation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Initial Investment:</span> {' '}
                  <span className="font-bold">{formatCurrency(configValues.initialInvestment)}</span>
                </p>
                <p className="text-xs text-gray-600">
                  With {configValues.annualContribution > 0 ? formatCurrency(configValues.annualContribution) + ' annual contribution' : 'no annual contributions'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Median Final Value:</span> {' '}
                  <span className="font-bold">{formatCurrency(simulationResults.finalValues.median)}</span>
                </p>
                <p className="text-xs text-gray-600">
                  After {configValues.years} years (inflation-adjusted)
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Risk Profile:</span> {' '}
                  <span className="font-bold capitalize">{configValues.riskProfile}</span>
                </p>
                <p className="text-xs text-gray-600">
                  Historical range: {RISK_PROFILES[configValues.riskProfile].worstYear}% to {RISK_PROFILES[configValues.riskProfile].bestYear}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-xs text-gray-500">
        <p>DISCLAIMER: This simulation is for educational purposes only and does not constitute financial advice. 
        Past performance does not guarantee future results. The simulation uses historical data patterns but actual 
        future market conditions may differ significantly.</p>
      </div>
    </div>
  );
};

export default MonteCarloSimulator; 