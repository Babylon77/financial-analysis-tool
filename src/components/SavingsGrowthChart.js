import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SavingsGrowthChart = ({ 
  timeSeriesData, 
  savingsGrowthRate, 
  initialSavings, 
  spouse1RetirementAge, 
  spouse2RetirementAge,
  spouse1Age,
  spouse2Age 
}) => {
  // Generate savings growth data
  const generateSavingsData = () => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];
    
    const data = [];
    const startYear = new Date().getFullYear();
    
    timeSeriesData.forEach((item, index) => {
      const year = startYear + index;
      const spouse1CurrentAge = spouse1Age + index;
      const spouse2CurrentAge = spouse2Age + index;
      
      // Calculate theoretical savings growth (no retirement impact)
      const theoreticalSavings = initialSavings * Math.pow(1 + savingsGrowthRate / 100, index);
      
      // Calculate actual savings considering retirement
      let actualSavings = theoreticalSavings;
      
      // Check if either spouse has retired
      const spouse1Retired = spouse1CurrentAge >= spouse1RetirementAge;
      const spouse2Retired = spouse2CurrentAge >= spouse2RetirementAge;
      
      if (spouse1Retired && spouse2Retired) {
        actualSavings = 0; // Both retired, no more savings
      } else if (spouse1Retired || spouse2Retired) {
        actualSavings = theoreticalSavings * 0.5; // One retired, half savings
      }
      
      data.push({
        year,
        age: `${spouse1CurrentAge}/${spouse2CurrentAge}`,
        theoreticalSavings: Math.round(theoreticalSavings),
        actualSavings: Math.round(actualSavings),
        portfolioValue: Math.round(item.portfolioValue || 0)
      });
    });
    
    return data;
  };

  const savingsData = generateSavingsData();
  
  if (savingsData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Savings Growth Over Time</h3>
        <p className="text-gray-500">No data available. Please run a simulation first.</p>
      </div>
    );
  }

  // Calculate key metrics
  const peakTheoreticalSavings = Math.max(...savingsData.map(d => d.theoreticalSavings));
  const peakActualSavings = Math.max(...savingsData.map(d => d.actualSavings));
  const finalPortfolioValue = savingsData[savingsData.length - 1]?.portfolioValue || 0;

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`Year: ${label}`}</p>
          <p className="text-gray-600">{`Ages: ${payload[0]?.payload?.age}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Savings Growth Over Time</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800">Starting Savings</h4>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(initialSavings)}</p>
          <p className="text-sm text-blue-600">per year</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800">Growth Rate</h4>
          <p className="text-2xl font-bold text-green-600">{savingsGrowthRate}%</p>
          <p className="text-sm text-green-600">per year</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800">Peak Savings</h4>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(peakActualSavings)}</p>
          <p className="text-sm text-purple-600">per year</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={savingsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="theoreticalSavings" 
              stroke="#8884d8" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Theoretical Savings (No Retirement)"
            />
            <Line 
              type="monotone" 
              dataKey="actualSavings" 
              stroke="#82ca9d" 
              strokeWidth={3}
              name="Actual Savings (With Retirement)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Understanding the Chart:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Theoretical Savings:</strong> Shows what your savings would be with {savingsGrowthRate}% annual growth (career progression)</li>
          <li>• <strong>Actual Savings:</strong> Shows realistic savings considering retirement timing</li>
          <li>• Savings drop to 50% when one spouse retires, and to 0% when both retire</li>
          <li>• This demonstrates the importance of working longer for financial security</li>
        </ul>
      </div>
    </div>
  );
};

export default SavingsGrowthChart; 