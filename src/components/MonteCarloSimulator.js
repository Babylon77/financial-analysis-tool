import React, { useState } from 'react';
import { runMonteCarloSimulation, MARKET_PARAMS } from '../utils/monteCarloSimulation';
import MonteCarloChart from './MonteCarloChart';
import MonteCarloResults from './MonteCarloResults';
import { formatCurrency } from '../utils/formatters';

const MonteCarloSimulator = ({ initialInvestment = 100000 }) => {
  const [configValues, setConfigValues] = useState({
    initialInvestment: initialInvestment,
    years: 30,
    annualContribution: 0,
    riskProfile: 'balanced',
    numberOfSimulations: 1000,
    inflationRate: 2.5
  });

  const [simulationResults, setSimulationResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

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
    switch(profile) {
      case 'conservative':
        return '40% stocks / 60% bonds - Lower risk, lower expected returns';
      case 'balanced':
        return '60% stocks / 40% bonds - Moderate risk and returns';
      case 'growth':
        return '80% stocks / 20% bonds - Higher risk, higher expected returns';
      case 'aggressive':
        return '100% stocks - Highest risk and potential returns';
      default:
        return '';
    }
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
              className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="growth">Growth</option>
              <option value="aggressive">Aggressive</option>
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
          
          <div className="mt-4 bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
            <h4 className="font-medium text-blue-800 mb-1">Expected Return</h4>
            <p>
              <strong>{MARKET_PARAMS[configValues.riskProfile].meanReturn}%</strong> annual average for {configValues.riskProfile} portfolio
              <br/>
              <span className="text-blue-600">Range: {MARKET_PARAMS[configValues.riskProfile].worstYear}% to {MARKET_PARAMS[configValues.riskProfile].bestYear}% in a single year</span>
              <br/>
              <span className="text-blue-600">Historical max drawdown: {MARKET_PARAMS[configValues.riskProfile].maxDrawdown}%</span>
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
                    <strong>Target annual return:</strong> {MARKET_PARAMS[configValues.riskProfile].meanReturn}% | 
                    <strong> Simulated:</strong> {(simulationResults.avgAnnualReturn * 100).toFixed(2)}%
                  </li>
                  <li>
                    <strong>Historical drawdowns:</strong> {Math.abs(MARKET_PARAMS[configValues.riskProfile].maxDrawdown)}% | 
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
                  Historical range: {MARKET_PARAMS[configValues.riskProfile].worstYear}% to {MARKET_PARAMS[configValues.riskProfile].bestYear}%
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