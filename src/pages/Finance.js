import React, { useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import MonteCarloSimulator from '../components/MonteCarloSimulator';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('retirement');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Financial Planning Tools
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-base text-gray-500 sm:text-lg">
            Plan your financial future and see the incredible power of compound interest over time.
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('retirement')}
              className={`${
                activeTab === 'retirement'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Retirement Calculator
            </button>
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
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'retirement' && <RetirementCalculator />}
          {activeTab === 'allocation' && <MonteCarloSimulator initialInvestment={100000} />}
        </div>
      </div>
    </div>
  );
};

// Retirement Calculator Component
const RetirementCalculator = () => {
  const [formData, setFormData] = useState({
    currentAge: 30,
    retirementAge: 65,
    currentSavings: 50000,
    monthlySavings: 1000,
    annualRaise: 3,
    expectedReturn: 7,
    currentIncome: 75000,
    desiredIncomePercent: 80,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  // Calculate retirement metrics
  const calculateRetirementMetrics = () => {
    const {
      currentAge,
      retirementAge,
      currentSavings,
      monthlySavings,
      annualRaise,
      expectedReturn,
      currentIncome,
      desiredIncomePercent
    } = formData;

    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    
    let savingsData = [];
    let totalSavings = currentSavings;
    let monthlySavingsAmount = monthlySavings;
    
    // Calculate annual compound interest with increasing contributions
    for (let year = 1; year <= yearsToRetirement; year++) {
      // If not the first year, increase monthly savings by annual raise
      if (year > 1) {
        monthlySavingsAmount *= (1 + annualRaise / 100);
      }
      
      const yearlyContribution = monthlySavingsAmount * 12;
      
      // Calculate growth with monthly contributions (simplified)
      totalSavings = totalSavings * (1 + expectedReturn / 100) + yearlyContribution;
      
      savingsData.push({
        age: currentAge + year,
        savings: Math.round(totalSavings),
        contributions: Math.round(currentSavings + yearlyContribution * year),
        growth: Math.round(totalSavings - currentSavings - yearlyContribution * year)
      });
    }
    
    // Calculate retirement income metrics
    const monthlyRetirementIncome = (totalSavings * 0.04) / 12; // 4% rule
    const desiredMonthlyIncome = (currentIncome * desiredIncomePercent / 100) / 12;
    const incomePercentageAchieved = (monthlyRetirementIncome / desiredMonthlyIncome) * 100;
    
    return {
      totalSavings,
      savingsData,
      monthlyRetirementIncome,
      desiredMonthlyIncome,
      incomePercentageAchieved,
      yearsToRetirement
    };
  };

  const {
    totalSavings,
    savingsData,
    monthlyRetirementIncome,
    desiredMonthlyIncome,
    incomePercentageAchieved,
    yearsToRetirement
  } = calculateRetirementMetrics();

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Create custom tooltip for the area chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded shadow-md border border-gray-200">
          <p className="font-medium text-gray-900">Age {label}</p>
          <p className="text-green-600">Total: {formatCurrency(payload[0].value)}</p>
          <p className="text-blue-600">Contributions: {formatCurrency(payload[1].value)}</p>
          <p className="text-purple-600">Growth: {formatCurrency(payload[2].value)}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Compound Interest & Retirement Calculator</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs Panel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Information</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="currentAge" className="block text-sm font-medium text-gray-700">
                Current Age
              </label>
              <input
                type="number"
                name="currentAge"
                id="currentAge"
                value={formData.currentAge}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="retirementAge" className="block text-sm font-medium text-gray-700">
                Retirement Age
              </label>
              <input
                type="number"
                name="retirementAge"
                id="retirementAge"
                value={formData.retirementAge}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="currentSavings" className="block text-sm font-medium text-gray-700">
                Current Savings ($)
              </label>
              <input
                type="number"
                name="currentSavings"
                id="currentSavings"
                value={formData.currentSavings}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="monthlySavings" className="block text-sm font-medium text-gray-700">
                Monthly Contributions ($)
              </label>
              <input
                type="number"
                name="monthlySavings"
                id="monthlySavings"
                value={formData.monthlySavings}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="annualRaise" className="block text-sm font-medium text-gray-700">
                Annual Raise in Contributions (%)
              </label>
              <input
                type="number"
                name="annualRaise"
                id="annualRaise"
                value={formData.annualRaise}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="expectedReturn" className="block text-sm font-medium text-gray-700">
                Expected Annual Return (%)
              </label>
              <input
                type="number"
                name="expectedReturn"
                id="expectedReturn"
                value={formData.expectedReturn}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="currentIncome" className="block text-sm font-medium text-gray-700">
                Current Annual Income ($)
              </label>
              <input
                type="number"
                name="currentIncome"
                id="currentIncome"
                value={formData.currentIncome}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="desiredIncomePercent" className="block text-sm font-medium text-gray-700">
                Desired Retirement Income (% of current)
              </label>
              <input
                type="number"
                name="desiredIncomePercent"
                id="desiredIncomePercent"
                value={formData.desiredIncomePercent}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">The Power of Starting Early</h4>
            <p className="text-xs text-blue-700 mb-2">
              If you started 10 years earlier, your nest egg would be approximately <span className="font-bold">{formatCurrency(totalSavings * 2)}</span> instead.
            </p>
            <p className="text-xs text-blue-700">
              If you increased your monthly savings by just $200, you would have an additional <span className="font-bold">{formatCurrency(200 * 12 * yearsToRetirement * (1 + formData.expectedReturn/100))}</span> at retirement.
            </p>
          </div>
        </div>
        
        {/* Results Panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Projected Growth</h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={savingsData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottomRight', offset: -10 }} />
                <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="savings" name="Total Savings" stackId="1" stroke="#4F46E5" fill="#4F46E5" />
                <Area type="monotone" dataKey="contributions" name="Your Contributions" stackId="2" stroke="#3B82F6" fill="#93C5FD" />
                <Area type="monotone" dataKey="growth" name="Investment Growth" stackId="3" stroke="#8B5CF6" fill="#C4B5FD" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800">Projected Nest Egg</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalSavings)}</p>
              <p className="text-xs text-blue-700">At retirement age {formData.retirementAge}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-800">Monthly Income</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(monthlyRetirementIncome)}</p>
              <p className="text-xs text-green-700">Using 4% withdrawal rule</p>
            </div>
            
            <div className={`${incomePercentageAchieved >= 100 ? 'bg-green-50' : 'bg-yellow-50'} p-4 rounded-lg`}>
              <h4 className={`text-sm font-medium ${incomePercentageAchieved >= 100 ? 'text-green-800' : 'text-yellow-800'}`}>
                Income Goal
              </h4>
              <p className={`text-2xl font-bold ${incomePercentageAchieved >= 100 ? 'text-green-900' : 'text-yellow-900'}`}>
                {Math.round(incomePercentageAchieved)}%
              </p>
              <p className={`text-xs ${incomePercentageAchieved >= 100 ? 'text-green-700' : 'text-yellow-700'}`}>
                Of your ${formatCurrency(desiredMonthlyIncome)} goal
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Key Insights</h4>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Your monthly savings rate is <strong>{Math.round((formData.monthlySavings / (formData.currentIncome / 12)) * 100)}%</strong> of your current income.</li>
              <li>By retirement, your investments will be <strong>{Math.round((totalSavings - formData.currentSavings - (formData.monthlySavings * 12 * yearsToRetirement)) / totalSavings * 100)}%</strong> investment growth.</li>
              <li>For each year you delay retirement, you add approximately <strong>{formatCurrency(totalSavings * 0.04)}</strong> to your annual income.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance; 