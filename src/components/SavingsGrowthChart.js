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
      <div className="bg-surface-primary p-6 rounded-lg border border-surface-border">
        <h3 className="text-lg font-display font-semibold mb-4 text-terminal-green">Savings Growth Over Time</h3>
        <p className="text-txt-secondary">No data available. Please run a simulation first.</p>
      </div>
    );
  }

  const peakActualSavings = Math.max(...savingsData.map(d => d.actualSavings));

  const formatAbbreviated = (value) => {
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
        <div className="bg-surface-elevated p-3 border border-terminal-dark-green rounded shadow-glow-green-sm">
          <p className="font-semibold text-terminal-green">{`Year: ${label}`}</p>
          <p className="text-txt-secondary">{`Ages: ${payload[0]?.payload?.age}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatAbbreviated(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface-primary p-6 rounded-lg border border-surface-border">
      <h3 className="text-lg font-display font-semibold mb-4 text-terminal-green">Savings Growth Over Time</h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-elevated p-4 rounded-lg border border-surface-border">
          <h4 className="font-semibold font-display text-terminal-green">Starting Savings</h4>
          <p className="text-2xl font-bold text-terminal-green data-cell">{formatAbbreviated(initialSavings)}</p>
          <p className="text-sm text-txt-secondary">per year</p>
        </div>
        <div className="bg-surface-elevated p-4 rounded-lg border border-surface-border">
          <h4 className="font-semibold font-display text-terminal-amber">Growth Rate</h4>
          <p className="text-2xl font-bold text-terminal-amber data-cell">{savingsGrowthRate}%</p>
          <p className="text-sm text-txt-secondary">per year</p>
        </div>
        <div className="bg-surface-elevated p-4 rounded-lg border border-surface-border">
          <h4 className="font-semibold font-display text-terminal-cyan">Peak Savings</h4>
          <p className="text-2xl font-bold text-terminal-cyan data-cell">{formatAbbreviated(peakActualSavings)}</p>
          <p className="text-sm text-txt-secondary">per year</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={savingsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.1)" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: '#8b949e' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#8b949e' }}
              tickFormatter={formatAbbreviated}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="theoreticalSavings"
              stroke="#ffb000"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Theoretical Savings (No Retirement)"
            />
            <Line
              type="monotone"
              dataKey="actualSavings"
              stroke="#00ff41"
              strokeWidth={3}
              name="Actual Savings (With Retirement)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Explanation */}
      <div className="mt-4 p-4 bg-surface-elevated rounded-lg border border-surface-border">
        <h4 className="font-semibold font-display mb-2 text-terminal-green">Understanding the Chart:</h4>
        <ul className="text-sm text-txt-primary space-y-1">
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