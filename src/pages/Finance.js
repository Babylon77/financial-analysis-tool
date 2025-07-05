import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import MonteCarloSimulator from '../components/MonteCarloSimulator';
import { runMonteCarloSimulation } from '../utils/monteCarloSimulation';
import { formatCurrency, formatPercent } from '../utils/formatters';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('allocation');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
            Financial Planning Tools
          </h1>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('allocation')}
              className={`${
                activeTab === 'allocation'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Asset Allocation Planner
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`${
                activeTab === 'advanced'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Advanced Retirement Planning
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'allocation' && <MonteCarloSimulator initialInvestment={4200000} />}
          {activeTab === 'advanced' && <AdvancedRetirementPlanner setActiveTab={setActiveTab} />}
        </div>
      </div>
    </div>
  );
};

// Advanced Retirement Planner Component
const AdvancedRetirementPlanner = ({ setActiveTab }) => {
  // Load data from Asset Allocation Planner
  const loadAssetAllocationData = () => {
    try {
      const savedData = sessionStorage.getItem('assetAllocationComplete');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const simulationResults = parsed.simulationResults;
        
        // Debug logging to see exact data structure and return calculation
        console.log('🔍 Asset Allocation Data Debug:', {
          rawData: parsed,
          simulationParams: {
            initialInvestment: parsed.initialInvestment,
            years: parsed.years,
            annualContribution: parsed.annualContribution,
            riskProfile: parsed.riskProfile,
            numberOfSimulations: parsed.numberOfSimulations,
            inflationRate: parsed.inflationRate
          },
          simulationResultsKeys: simulationResults ? Object.keys(simulationResults) : null,
          returnCalculation: {
            arithmeticMean: simulationResults?.avgAnnualReturn ? (simulationResults.avgAnnualReturn * 100).toFixed(2) + '%' : 'N/A',
            geometricMean_CAGR: simulationResults?.medianCAGR ? (simulationResults.medianCAGR * 100).toFixed(2) + '%' : 'N/A',
            usingForExpectedReturn: simulationResults?.medianCAGR ? 'Geometric Mean (CAGR)' : 'Arithmetic Mean (fallback)'
          },
          hasYearlyReturns: !!(simulationResults?.yearlyReturns),
          yearlyReturnsKeys: simulationResults?.yearlyReturns ? Object.keys(simulationResults.yearlyReturns) : null
        });
        
        return {
          currentNetWorth: parsed.initialInvestment || 4200000,
          annualSavings: parsed.annualContribution || 50000,
          expectedReturn: simulationResults?.medianCAGR ? 
            parseFloat((simulationResults.medianCAGR * 100).toFixed(2)) :
            (simulationResults?.avgAnnualReturn ? parseFloat((simulationResults.avgAnnualReturn * 100).toFixed(2)) : 7),
          riskProfile: parsed.riskProfile || 'balanced',
          monteCarloResults: simulationResults,
          // Store original simulation parameters for comparison
          originalParams: {
            initialInvestment: parsed.initialInvestment,
            years: parsed.years,
            annualContribution: parsed.annualContribution,
            riskProfile: parsed.riskProfile,
            numberOfSimulations: parsed.numberOfSimulations,
            inflationRate: parsed.inflationRate
          }
        };
      }
    } catch (error) {
      console.error('Error loading asset allocation data:', error);
    }
    // Get target return from MARKET_PARAMS for the risk profile  
    const getRiskProfileReturn = (profile) => {
      const riskProfiles = {
        'conservative': 7.0,
        'balanced': 8.5, 
        'growth': 9.5,
        'aggressive': 10.5
      };
      return riskProfiles[profile] || 7.0;
    };
    
    return {
      currentNetWorth: 4200000,
      annualSavings: 50000,
      expectedReturn: getRiskProfileReturn('balanced'),
      riskProfile: 'balanced',
      monteCarloResults: null,
      originalParams: null
    };
  };

  const [assetData, setAssetData] = useState(() => loadAssetAllocationData());

  // Load persisted retirement scenario data
  const loadPersistedScenarioData = () => {
    try {
      const savedData = sessionStorage.getItem('retirementScenarioData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Merge with asset allocation data for financial position
        return {
          ...parsed,
          currentNetWorth: assetData.currentNetWorth,
          annualSavings: assetData.annualSavings,
          expectedReturn: assetData.expectedReturn,
          riskProfile: assetData.riskProfile,
        };
      }
    } catch (error) {
      console.error('Error loading persisted scenario data:', error);
    }
    
    // Calculate initial drawdown phases based on retirement ages and analysis age
    const spouse1RetAge = 48;
    const spouse2RetAge = 48;
    const laterRetirementAge = Math.max(spouse1RetAge, spouse2RetAge);
    
    // Get heatmap age from sessionStorage or use default
    let heatmapAge = 62;
    try {
      const saved = sessionStorage.getItem('selectedHeatmapAge');
      heatmapAge = saved ? parseInt(saved) : 62;
    } catch {
      heatmapAge = 62;
    }
    
    // Return defaults with your specific values
    return {
      // Spouse 1 - Your defaults
      spouse1CurrentAge: 45,
      spouse1RetirementAge: spouse1RetAge,
      spouse1Name: 'Spouse 1',
      
      // Spouse 2 - Your defaults
      spouse2CurrentAge: 46,
      spouse2RetirementAge: spouse2RetAge,
      spouse2Name: 'Spouse 2',
      
      // Current Financial Position (from Asset Allocation Planner)
      currentNetWorth: assetData.currentNetWorth,
      annualSavings: assetData.annualSavings,
      savingsGrowthRate: 3,
      expectedReturn: assetData.expectedReturn,
      riskProfile: assetData.riskProfile,
      
      // Drawdown Scenarios - Automatically linked to retirement ages and analysis age
      drawdownPhases: [
        { startAge: laterRetirementAge, endAge: heatmapAge, annualAmount: 200000, description: 'Early retirement phase' },
        { startAge: heatmapAge, endAge: 75, annualAmount: 160000, description: 'Reduced expenses' },
        { startAge: 75, endAge: 90, annualAmount: 100000, description: 'Late retirement + Social Security' }
      ],
      
      // Additional Income Sources
      spouse1Pension: { startAge: 65, annualAmount: 30000 },
      spouse2Pension: { startAge: 67, annualAmount: 25000 },
      spouse1SocialSecurity: { startAge: 67, annualAmount: 35000 },
      spouse2SocialSecurity: { startAge: 67, annualAmount: 32000 },
      
      endAge: 90
    };
  };

  const [scenarioData, setScenarioData] = useState(loadPersistedScenarioData());

  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedHeatmapAge, setSelectedHeatmapAge] = useState(() => {
    try {
      const saved = sessionStorage.getItem('selectedHeatmapAge');
      return saved ? parseInt(saved) : 62;
    } catch {
      return 62;
    }
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [monteCarloScenario, setMonteCarloScenario] = useState(() => {
    try {
      const saved = sessionStorage.getItem('monteCarloScenario');
      return saved || 'median';
    } catch {
      return 'median';
    }
  }); // 'best', 'optimistic', 'median', 'pessimistic', 'worst'
  const [isRerunningMonteCarlo, setIsRerunningMonteCarlo] = useState(false);

  // Persist scenario data whenever it changes
  useEffect(() => {
    try {
      const dataToSave = {
        ...scenarioData,
        lastUpdated: Date.now()
      };
      sessionStorage.setItem('retirementScenarioData', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving scenario data:', error);
    }
  }, [scenarioData]);

  // Load and persist heatmap data
  useEffect(() => {
    const saved = sessionStorage.getItem('heatmapData');
    if (saved) {
      try {
        setHeatmapData(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading heatmap data:', e);
      }
    }
  }, []);
  
  useEffect(() => {
    if (heatmapData.length > 0) {
      sessionStorage.setItem('heatmapData', JSON.stringify(heatmapData));
    }
  }, [heatmapData]);

  // Persist heatmap settings
  
  useEffect(() => {
    sessionStorage.setItem('selectedHeatmapAge', selectedHeatmapAge.toString());
  }, [selectedHeatmapAge]);
  
  useEffect(() => {
    sessionStorage.setItem('monteCarloScenario', monteCarloScenario);
  }, [monteCarloScenario]);

  // ---------------------------
  // Auto-regenerate heatmap when key inputs change
  // ---------------------------
  useEffect(() => {
    if (!assetData.monteCarloResults || scenarioData.currentNetWorth <= 0) return;

    const timeoutId = setTimeout(() => {
      generateHeatmap();
    }, 300); // slight debounce to avoid rapid recalculation

    return () => clearTimeout(timeoutId);
  }, [
    assetData,
    scenarioData.spouse1CurrentAge,
    scenarioData.spouse1RetirementAge,
    scenarioData.spouse2CurrentAge,
    scenarioData.spouse2RetirementAge,
    scenarioData.currentNetWorth,
    scenarioData.annualSavings,
    scenarioData.expectedReturn,
    scenarioData.drawdownPhases,
    selectedHeatmapAge,
    monteCarloScenario
  ]);

  // Automatically update first drawdown phase end age when analysis age changes
  useEffect(() => {
    setScenarioData(prev => {
      const updatedDrawdownPhases = [...prev.drawdownPhases];
      if (updatedDrawdownPhases.length > 0) {
        // Update first phase end age to match analysis age
        updatedDrawdownPhases[0] = {
          ...updatedDrawdownPhases[0],
          endAge: selectedHeatmapAge
        };
        
        // Update second phase start age to match (if it exists)
        if (updatedDrawdownPhases.length > 1) {
          updatedDrawdownPhases[1] = {
            ...updatedDrawdownPhases[1],
            startAge: selectedHeatmapAge
          };
        }
      }
      
      return {
      ...prev,
        drawdownPhases: updatedDrawdownPhases
      };
    });
  }, [selectedHeatmapAge]);

  const handleInputChange = (field, value) => {
    const updatedScenarioData = {
      ...scenarioData,
      [field]: value
    };
    
    // If retirement ages change, automatically update drawdown phases
    if (field === 'spouse1RetirementAge' || field === 'spouse2RetirementAge') {
      const spouse1RetAge = field === 'spouse1RetirementAge' ? value : scenarioData.spouse1RetirementAge;
      const spouse2RetAge = field === 'spouse2RetirementAge' ? value : scenarioData.spouse2RetirementAge;
      const laterRetirementAge = Math.max(spouse1RetAge, spouse2RetAge);
      
      // Update the first drawdown phase to start at the later retirement age
      const updatedDrawdownPhases = [...updatedScenarioData.drawdownPhases];
      if (updatedDrawdownPhases.length > 0) {
        updatedDrawdownPhases[0] = {
          ...updatedDrawdownPhases[0],
          startAge: laterRetirementAge
        };
      }
      
      updatedScenarioData.drawdownPhases = updatedDrawdownPhases;
    }
    
    setScenarioData(updatedScenarioData);
  };

  const handleDrawdownChange = (index, field, value) => {
    const newDrawdownPhases = [...scenarioData.drawdownPhases];
    newDrawdownPhases[index] = { ...newDrawdownPhases[index], [field]: value };
    
    // If we're changing an endAge, automatically update the next phase's startAge
    if (field === 'endAge' && index < newDrawdownPhases.length - 1) {
      newDrawdownPhases[index + 1] = {
        ...newDrawdownPhases[index + 1],
        startAge: value
      };
    }
    
    // If we're changing a startAge (except the first one), update the previous phase's endAge
    if (field === 'startAge' && index > 0) {
      newDrawdownPhases[index - 1] = {
        ...newDrawdownPhases[index - 1],
        endAge: value
      };
    }
    
    setScenarioData(prev => ({
      ...prev,
      drawdownPhases: newDrawdownPhases
    }));
  };

  const addDrawdownPhase = () => {
    const existingPhases = scenarioData.drawdownPhases;
    const lastPhase = existingPhases[existingPhases.length - 1];
    
    // New phase starts where the last phase ends
    const newPhase = {
      startAge: lastPhase ? lastPhase.endAge : selectedHeatmapAge,
      endAge: lastPhase ? Math.min(lastPhase.endAge + 5, 90) : selectedHeatmapAge + 5,
      annualAmount: 100000,
      description: 'New phase'
    };
    
    setScenarioData(prev => ({
      ...prev,
      drawdownPhases: [...prev.drawdownPhases, newPhase]
    }));
  };

  const removeDrawdownPhase = (index) => {
    const newDrawdownPhases = scenarioData.drawdownPhases.filter((_, i) => i !== index);
    setScenarioData(prev => ({
      ...prev,
      drawdownPhases: newDrawdownPhases
    }));
  };

  // Rerun Monte Carlo simulation with current asset allocation parameters
  const rerunMonteCarloSimulation = () => {
    setIsRerunningMonteCarlo(true);
    // Use a timeout to allow the UI to update and show the loading spinner
    setTimeout(() => {
        const { currentNetWorth, riskProfile, endAge, spouse1CurrentAge } = scenarioData;
        if (!currentNetWorth) {
            console.error("Cannot run simulation without current net worth.");
            setIsRerunningMonteCarlo(false);
            return;
        }
        const years = endAge - spouse1CurrentAge;

        // For the main simulation, we assume contributions continue until the selected retirement age
        const { spouse1RetirementAge, spouse2RetirementAge, annualSavings } = scenarioData;
        const spouse1ContributionYears = spouse1RetirementAge - spouse1CurrentAge;
        const spouse2ContributionYears = spouse2RetirementAge - scenarioData.spouse2CurrentAge;
        
        const annualContributions = Array.from({ length: years }, (_, i) => {
            let contribution = 0;
            if (i < spouse1ContributionYears) contribution += annualSavings / 2;
            if (i < spouse2ContributionYears) contribution += annualSavings / 2;
            return contribution;
        });

        const results = runMonteCarloSimulation({
            initialInvestment: currentNetWorth,
            years: years,
            annualContributions: annualContributions,
            riskProfile: riskProfile,
            numberOfSimulations: 5000, // Use a reasonable number for performance
        });
        
        // Update assetData with the new results
        setAssetData(prev => ({ ...prev, monteCarloResults: results }));
        setIsRerunningMonteCarlo(false);
    }, 100);
  };

  // Main calculation function for both time series and heatmap
  const calculateRetirementScenario = (spouse1RetAge, spouse2RetAge) => {
    const {
      spouse1CurrentAge,
      spouse2CurrentAge,
      currentNetWorth,
      annualSavings,
      riskProfile,
      endAge
    } = scenarioData;

    const years = endAge - Math.min(spouse1CurrentAge, spouse2CurrentAge);
    
    // Generate the dynamic contributions array
    const spouse1ContributionYears = spouse1RetAge - spouse1CurrentAge;
    const spouse2ContributionYears = spouse2RetAge - spouse2CurrentAge;

    const annualContributions = Array.from({ length: years }, (_, i) => {
        const currentYearAbsolute = Math.min(spouse1CurrentAge, spouse2CurrentAge) + i;
        let contribution = 0;
        if (currentYearAbsolute < spouse1RetAge) {
            contribution += annualSavings / 2; // Assuming savings are split
        }
        if (currentYearAbsolute < spouse2RetAge) {
            contribution += annualSavings / 2;
        }
        return contribution;
    });
    
    // Run the simulation with dynamic contributions
    const simulationResults = runMonteCarloSimulation({
      initialInvestment: currentNetWorth,
      years,
      annualContributions,
      riskProfile,
      numberOfSimulations: 2000, // Lower number for heatmap performance
    });

    return simulationResults;
  };

  // Generate heatmap data
  function generateHeatmap() {
    setIsCalculating(true);
    
    setTimeout(() => { // Add small delay for UI responsiveness
      const heatmapResults = [];
      const spouse1Ages = [];
      const spouse2Ages = [];
      
      // Generate more focused age ranges around current situation
      // Spouse 1: current age to current age + 25 years (more realistic range)
      for (let age = scenarioData.spouse1CurrentAge; age <= Math.min(scenarioData.spouse1CurrentAge + 25, 75); age += 2) {
        spouse1Ages.push(age);
      }
      // Spouse 2: current age to current age + 25 years  
      for (let age = scenarioData.spouse2CurrentAge; age <= Math.min(scenarioData.spouse2CurrentAge + 25, 75); age += 2) {
        spouse2Ages.push(age);
      }
      
      // Ensure we have exactly 10x10 grid by limiting to first 10 of each
      const finalSpouse1Ages = spouse1Ages.slice(0, 10);
      const finalSpouse2Ages = spouse2Ages.slice(0, 10);
      
      finalSpouse1Ages.forEach(s1Age => {
        finalSpouse2Ages.forEach(s2Age => {
          const result = calculateRetirementScenario(s1Age, s2Age);
          heatmapResults.push({
            spouse1RetirementAge: s1Age,
            spouse2RetirementAge: s2Age,
            portfolioValue: result.medianPath[selectedHeatmapAge - Math.min(s1Age, s2Age)],
            isViable: result.medianPath.length > selectedHeatmapAge - Math.min(s1Age, s2Age) && selectedHeatmapAge - Math.min(s1Age, s2Age) >= 0,
            firstRetirementAge: Math.min(s1Age, s2Age),
            lastRetirementAge: Math.max(s1Age, s2Age)
          });
        });
      });
      
      setHeatmapData(heatmapResults);
      setIsCalculating(false);
    }, 100);
  }

  const getHeatmapColor = (value) => {
    const currentNetWorth = scenarioData.currentNetWorth;
    if (value < currentNetWorth * 0.8) return '#EF4444'; // Red - significant loss
    if (value < currentNetWorth) return '#F97316'; // Orange - some loss
    if (value < currentNetWorth * 1.5) return '#EAB308'; // Yellow - minimal gain
    if (value < currentNetWorth * 2.5) return '#84CC16'; // Lime - good growth
    return '#22C55E'; // Green - excellent growth
  };

  // Generate time series data for all Monte Carlo scenarios
  const generateTimeSeriesData = () => {
    if (!assetData.monteCarloResults) {
        return []; // Return empty array if the main simulation hasn't run yet
    }

    const { spouse1RetirementAge, spouse2RetirementAge } = scenarioData;
    const results = calculateRetirementScenario(spouse1RetirementAge, spouse2RetirementAge);

    const timeSeries = results.medianPath.map((value, index) => {
      const year = scenarioData.spouse1CurrentAge + index;
      return {
        age: year,
        year,
        best: results.bestPath[index] || value,
        optimistic: results.optimisticPath[index] || value,
        median: results.medianPath[index] || value,
        pessimistic: results.pessimisticPath[index] || value,
        worst: results.worstPath[index] || value
      };
    });
    
    return timeSeries;
  };

  const timeSeriesData = generateTimeSeriesData();
  
  return (
    <div className="max-w-full mx-auto px-4">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Advanced Retirement Planning</h2>
        <p className="text-lg text-gray-600 mb-4">Plan retirement scenarios for both spouses with detailed drawdown phases and heatmap analysis</p>
      </div>

      {/* Three-Column Wide Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        
        {/* Column 1: Setup - Basic Information */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3">
                <span className="text-lg">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Step 1: Basic Information</h3>
            </div>
            
            {/* Spouse Information */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Spouse Details</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h5 className="font-medium text-blue-900 mb-3">{scenarioData.spouse1Name}</h5>
                  <div className="grid grid-cols-2 gap-3">
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Age</label>
              <input
                type="number"
                        value={scenarioData.spouse1CurrentAge}
                        onChange={(e) => handleInputChange('spouse1CurrentAge', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Retirement Age</label>
              <input
                type="number"
                        value={scenarioData.spouse1RetirementAge}
                        onChange={(e) => handleInputChange('spouse1RetirementAge', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
            </div>
            
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <h5 className="font-medium text-blue-900 mb-3">{scenarioData.spouse2Name}</h5>
                  <div className="grid grid-cols-2 gap-3">
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Age</label>
              <input
                type="number"
                        value={scenarioData.spouse2CurrentAge}
                        onChange={(e) => handleInputChange('spouse2CurrentAge', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Retirement Age</label>
              <input
                type="number"
                        value={scenarioData.spouse2RetirementAge}
                        onChange={(e) => handleInputChange('spouse2RetirementAge', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Financial Position */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Financial Position</h4>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Net Worth</label>
              <input
                type="number"
                      value={scenarioData.currentNetWorth}
                      onChange={(e) => handleInputChange('currentNetWorth', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Annual Savings</label>
                    <input
                      type="number"
                      value={scenarioData.annualSavings}
                      onChange={(e) => handleInputChange('annualSavings', parseInt(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
            </div>
            
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return (% real)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={scenarioData.expectedReturn}
                    onChange={(e) => handleInputChange('expectedReturn', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className={`mt-2 p-3 rounded-lg ${assetData.monteCarloResults ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{assetData.monteCarloResults ? '✅' : '⚠️'}</span>
                      <p className="text-sm font-medium">
                        {assetData.monteCarloResults ? 
                          `Linked to ${assetData.riskProfile} allocation (${formatPercent(assetData.expectedReturn / 100, 2)} real return)` : 
                          'Run Asset Allocation Planner for integrated analysis'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mt-4">
                  <button
                    onClick={() => {
                      const newAssetData = loadAssetAllocationData();
                      setAssetData(newAssetData); // Update assetData state
                      setScenarioData(prev => ({
                        ...prev,
                        currentNetWorth: newAssetData.currentNetWorth,
                        annualSavings: newAssetData.annualSavings,
                        expectedReturn: newAssetData.expectedReturn,
                        riskProfile: newAssetData.riskProfile
                      }));
                      setHeatmapData([]);
                    }}
                    className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    <span>🔄</span>
                    <span>Refresh Data</span>
                  </button>
                  <button
                    onClick={rerunMonteCarloSimulation}
                    disabled={isRerunningMonteCarlo}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <span>🎲</span>
                    <span>{isRerunningMonteCarlo ? 'Running...' : 'Rerun Monte Carlo'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Configure - Analysis Settings */}
        <div className="xl:col-span-3 space-y-6">
          {/* Heatmap Configuration */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white mr-3">
                <span className="text-lg">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Step 2: Analysis Settings</h3>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-purple-100 mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Heatmap Configuration</h4>
              <div className="grid grid-cols-1 gap-4">
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Age</label>
              <input
                type="number"
                    value={selectedHeatmapAge}
                    onChange={(e) => setSelectedHeatmapAge(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nest egg analysis at this age</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monte Carlo Scenario</label>
                  <select
                    value={monteCarloScenario}
                    onChange={(e) => setMonteCarloScenario(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="best">Best Case (Top 1%)</option>
                    <option value="optimistic">Optimistic Case (90th percentile)</option>
                    <option value="median">Median Case (50th percentile)</option>
                    <option value="pessimistic">Pessimistic Case (10th percentile)</option>
                    <option value="worst">Worst Case (1st percentile)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {assetData.monteCarloResults ? 'Using Monte Carlo results' : 'Run Asset Allocation Planner first'}
                  </p>
                </div>
            </div>
            
              {/* Auto-update notification */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-blue-800 flex items-center">
                  <span className="mr-1">🔄</span>
                  <strong>Auto-Update:</strong> Heatmap automatically regenerates when you change any inputs above
                </p>
              </div>
              
              <button
                onClick={generateHeatmap}
                disabled={isCalculating}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors mt-4 font-semibold"
              >
                {isCalculating ? '🔄 Calculating...' : '🔄 Refresh Heatmap Analysis'}
              </button>
            </div>
          </div>

          {/* Drawdown Phases */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white mr-3">
                  <span className="text-lg">📅</span>
                </div>
                <h4 className="text-xl font-bold text-gray-900">Retirement Drawdown Phases</h4>
              </div>
              <button
                onClick={addDrawdownPhase}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <span>+</span>
                <span>Add Phase</span>
              </button>
            </div>
            
            {/* Helper text explaining automatic linking */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                💡 <strong>Smart Linking:</strong> First phase starts when the later spouse retires ({Math.max(scenarioData.spouse1RetirementAge, scenarioData.spouse2RetirementAge)}) and ends at analysis age ({selectedHeatmapAge}). 
                Changing phase end ages automatically updates the next phase's start age.
              </p>
            </div>
            
            <div className="space-y-4">
              {scenarioData.drawdownPhases.map((phase, index) => {
                const isFirstPhase = index === 0;
                const isLastPhase = index === scenarioData.drawdownPhases.length - 1;
                const laterRetirementAge = Math.max(scenarioData.spouse1RetirementAge, scenarioData.spouse2RetirementAge);
                
                return (
                  <div key={index} className="bg-white border border-green-100 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Phase header with connection indicator */}
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-semibold text-gray-700">
                          Phase {index + 1} 
                          {isFirstPhase && <span className="text-blue-600 ml-2">→ Linked to retirement</span>}
                          {!isFirstPhase && !isLastPhase && <span className="text-purple-600 ml-2">→ Auto-linked</span>}
                        </h5>
                        {!isFirstPhase && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <span className="mr-1">🔗</span>
                            Follows Phase {index}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
            <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Age
                            {isFirstPhase && <span className="text-blue-600 text-xs ml-1">(Auto: Later retirement)</span>}
              </label>
              <input
                type="number"
                            value={phase.startAge}
                            onChange={(e) => handleDrawdownChange(index, 'startAge', parseInt(e.target.value))}
                            disabled={isFirstPhase}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-transparent ${
                              isFirstPhase 
                                ? 'border-blue-300 bg-blue-50 text-blue-700 cursor-not-allowed' 
                                : 'border-gray-300 focus:ring-green-500'
                            }`}
                            title={isFirstPhase ? `Automatically set to later retirement age (${laterRetirementAge})` : ''}
              />
            </div>
            <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Age
                            {!isLastPhase && <span className="text-purple-600 text-xs ml-1">(Links to next phase)</span>}
              </label>
              <input
                type="number"
                            value={phase.endAge}
                            onChange={(e) => handleDrawdownChange(index, 'endAge', parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Annual Amount</label>
                        <input
                          type="number"
                          value={phase.annualAmount}
                          onChange={(e) => handleDrawdownChange(index, 'annualAmount', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={phase.description}
                          onChange={(e) => handleDrawdownChange(index, 'description', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Phase description"
                        />
                        {scenarioData.drawdownPhases.length > 1 && (
                          <button
                            onClick={() => removeDrawdownPhase(index)}
                            className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                            title="Remove this phase"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
          
        {/* Column 3: Analyze - Results */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl shadow-lg p-6 sticky top-6">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 ${heatmapData.length > 0 ? 'bg-orange-600' : 'bg-gray-400'} rounded-lg flex items-center justify-center text-white mr-3`}>
                <span className="text-lg">📈</span>
          </div>
              <h3 className="text-xl font-bold text-gray-900">Step 3: Analysis Results</h3>
        </div>
        
            {heatmapData.length > 0 ? (
              <div className="bg-white rounded-lg border border-orange-100 p-4">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Retirement Scenario Analysis
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Analysis Age:</span>
                        <span className="ml-2 text-gray-900">{selectedHeatmapAge}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Scenario:</span>
                        <span className="ml-2 text-gray-900">{monteCarloScenario} case</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Net Worth:</span>
                        <span className="ml-2 text-gray-900">{formatCurrency(scenarioData.currentNetWorth)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Model:</span>
                        <span className="ml-2 text-gray-900">{assetData.monteCarloResults ? 'Monte Carlo' : 'Simplified'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Time Series Chart */}
                {timeSeriesData.length > 0 && (
                  <div className="mb-6">
                    <h5 className="text-base font-semibold text-gray-800 mb-3">Portfolio Progression Over Time</h5>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={timeSeriesData}
                          margin={{ top: 20, right: 30, left: 70, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="age" 
                            stroke="#6B7280"
                            fontSize={12}
                            label={{ value: 'Age', position: 'insideBottom', offset: -5, textAnchor: 'middle' }}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            fontSize={12}
                            tickFormatter={(value) => formatCurrency(value, { decimals: 1, compact: true })}
                            label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [formatCurrency(value, { decimals: 1, compact: true }), name]}
                            labelFormatter={(age) => `Age ${age}`}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{ paddingBottom: '20px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="best" 
                            stroke="#16a34a" 
                            strokeWidth={2}
                            name="Best Case (Top 1%)"
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="optimistic" 
                            stroke="#22C55E" 
                            strokeWidth={2}
                            name="Optimistic Case (90th %)"
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="median" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            name="Median Case (50th %)"
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="pessimistic" 
                            stroke="#F59E0B" 
                            strokeWidth={2}
                            name="Pessimistic Case (10th %)"
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="worst" 
                            stroke="#EF4444" 
                            strokeWidth={2}
                            name="Worst Case (1st %)"
                            dot={false}
                          />
                        </LineChart>
            </ResponsiveContainer>
          </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 This chart shows how your portfolio might grow under different market scenarios, including the effects of retirement timing and drawdown phases.
                    </p>
                  </div>
                )}
                
                {/* Heatmap Section */}
                <div className="mb-4">
                  <h5 className="text-base font-semibold text-gray-800 mb-3">
                    Retirement Timing Heatmap - Portfolio Value at Age {selectedHeatmapAge}
                  </h5>
            </div>
            
                {/* Heatmap with improved axis labels */}
                <div className="relative">
                  {/* Y-axis label - positioned far to the left of the entire heatmap area */}
                  <div className="absolute -left-20 top-1/2 transform -rotate-90 -translate-y-1/2">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{scenarioData.spouse1Name} Retirement Age</span>
            </div>
            
                  {/* Heatmap Grid */}
                  <div className="ml-12 mr-4">
                    {/* X-axis label (top) */}
                    <div className="text-center mb-3">
                      <span className="text-sm font-medium text-gray-700">{scenarioData.spouse2Name} Retirement Age</span>
            </div>
                    
                    {/* X-axis values */}
                    <div className="grid grid-cols-10 gap-1 mb-2">
                      {heatmapData.length > 0 && Array.from({length: 10}, (_, i) => {
                        const uniqueSpouse2Ages = [...new Set(heatmapData.map(d => d.spouse2RetirementAge))].sort((a,b) => a-b);
                        const age = uniqueSpouse2Ages[i] || scenarioData.spouse2CurrentAge + (i * 2);
                        return (
                          <div key={i} className="text-xs text-center text-gray-600 font-medium">
                            {age}
                          </div>
                        );
                      })}
          </div>

                    {/* Heatmap cells with Y-axis labels */}
                    <div className="grid grid-cols-10 gap-1">
                      {heatmapData.slice(0, 100).map((cell, index) => {
                        const rowIndex = Math.floor(index / 10);
                        const colIndex = index % 10;
                        const showYLabel = colIndex === 0;
                        
                        const uniqueSpouse1Ages = [...new Set(heatmapData.map(d => d.spouse1RetirementAge))].sort((a,b) => a-b);
                        const yAge = uniqueSpouse1Ages[rowIndex] || cell.spouse1RetirementAge;
                        
                        return (
                          <div key={index} className="relative">
                            {showYLabel && (
                              <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
                                <span className="text-xs text-gray-600 font-medium">{yAge}</span>
          </div>
                            )}
                            <div
                              className="aspect-square flex items-center justify-center text-xs font-medium text-white rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400 hover:scale-105 transition-all"
                              style={{ backgroundColor: getHeatmapColor(cell.portfolioValue) }}
                              title={`${scenarioData.spouse1Name}: ${cell.spouse1RetirementAge}, ${scenarioData.spouse2Name}: ${cell.spouse2RetirementAge} → ${formatCurrency(cell.portfolioValue, { decimals: 1, compact: true })}`}
                            >
                              {formatCurrency(cell.portfolioValue, { decimals: 1, compact: true })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Legend */}
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-gray-800 mb-3">Portfolio Value Legend</h5>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span>Significant Loss</span>
                      </div>
                      <span className="font-mono">&lt; {Math.round(scenarioData.currentNetWorth * 0.8 / 1000)}K</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-500 rounded"></div>
                        <span>Some Loss</span>
                      </div>
                      <span className="font-mono">{Math.round(scenarioData.currentNetWorth * 0.8 / 1000)}K - {Math.round(scenarioData.currentNetWorth / 1000)}K</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span>Minimal Gain</span>
                      </div>
                      <span className="font-mono">{Math.round(scenarioData.currentNetWorth / 1000)}K - {Math.round(scenarioData.currentNetWorth * 1.5 / 1000)}K</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-lime-500 rounded"></div>
                        <span>Good Growth</span>
                      </div>
                      <span className="font-mono">{Math.round(scenarioData.currentNetWorth * 1.5 / 1000)}K - {Math.round(scenarioData.currentNetWorth * 2.5 / 1000)}K</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>Excellent Growth</span>
                      </div>
                      <span className="font-mono">&gt; {Math.round(scenarioData.currentNetWorth * 2.5 / 1000)}K</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-orange-100 p-6">
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready for Analysis</h4>
                  <p className="text-sm text-gray-600 mb-4">Configure your settings in Step 2 and generate the heatmap to visualize retirement scenarios</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">💡 The heatmap will show portfolio values at different retirement age combinations</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance; 