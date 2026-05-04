import React from 'react';
import { formatCurrency, formatPercent } from '../../hooks/useResultsAnalysis';
import { STRATEGY_COLORS } from '../../utils/constants/realEstateConstants';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell,
  Tooltip as RechartsTooltip, LineChart, Line, AreaChart, Area,
} from 'recharts';

export default function ModaAnalysis({ analysis, modaResults, objectiveWeights, onWeightChange, formData }) {
  const {
    annualizedROI,
    ltrTotalROIAnnualized,
    strTotalROIAnnualized,
    cashFlowProjectionData,
    renovationTimelineData,
  } = analysis;

  // Prepare radar chart data for strategy comparison (rounded to integers)
  const radarData = [
    { objective: 'ROI', flip: Math.round(modaResults.scores.flip.roi), ltr: Math.round(modaResults.scores.ltr.roi), str: Math.round(modaResults.scores.str.roi) },
    { objective: 'Cash Flow', flip: Math.round(modaResults.scores.flip.cashFlow), ltr: Math.round(modaResults.scores.ltr.cashFlow), str: Math.round(modaResults.scores.str.cashFlow) },
    { objective: 'Risk', flip: Math.round(modaResults.scores.flip.risk), ltr: Math.round(modaResults.scores.ltr.risk), str: Math.round(modaResults.scores.str.risk) },
    { objective: 'Workload', flip: Math.round(modaResults.scores.flip.workload), ltr: Math.round(modaResults.scores.ltr.workload), str: Math.round(modaResults.scores.str.workload) },
  ];

  // Prepare bar chart data for weighted scores
  const weightedScoreData = [
    { name: 'Fix & Flip', score: modaResults.weightedScores.flip, color: STRATEGY_COLORS.flip },
    { name: 'Long-Term Rental', score: modaResults.weightedScores.ltr, color: STRATEGY_COLORS.ltr },
    { name: 'Short-Term Rental', score: modaResults.weightedScores.str, color: STRATEGY_COLORS.str },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-txt-primary mb-4">Strategy Comparison (MODA Analysis)</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar Chart for Strategy Comparison */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <h3 className="text-lg font-medium text-txt-primary mb-4">Strategy Performance by Objective</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(0, 255, 65, 0.1)" />
                <PolarAngleAxis dataKey="objective" tick={{ fill: '#8b949e', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#8b949e', fontSize: 10 }} />
                <Radar name="Fix & Flip" dataKey="flip" stroke="#00ff41" fill="#00ff41" fillOpacity={0.5} />
                <Radar name="Long-Term Rental" dataKey="ltr" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.5} />
                <Radar name="Short-Term Rental" dataKey="str" stroke="#ffb000" fill="#ffb000" fillOpacity={0.5} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <RechartsTooltip
                  formatter={(value) => [`${value} / 10`, '']}
                  labelFormatter={(label) => `${label} Score`}
                  contentStyle={{ backgroundColor: '#161b22', borderRadius: '4px', border: '1px solid #30363d', color: '#c9d1d9' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart for Weighted Scores */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <h3 className="text-lg font-medium text-txt-primary mb-4">Overall Strategy Score</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weightedScoreData} layout="vertical" margin={{ left: 20, right: 70, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 10]} tickCount={6} tick={{ fontSize: 12, fill: '#8b949e' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: '#8b949e' }}
                  width={120}
                />
                <RechartsTooltip
                  formatter={(value) => [`${value.toFixed(2)} / 10`, 'Score']}
                  contentStyle={{ backgroundColor: '#161b22', borderRadius: '4px', border: '1px solid #30363d', color: '#c9d1d9' }}
                />
                <Bar
                  dataKey="score"
                  fill="#00ff41"
                  label={{
                    position: 'right',
                    formatter: (value) => value.toFixed(2),
                    fill: '#8b949e',
                    fontSize: 12,
                    fontWeight: 500,
                    offset: 10
                  }}
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                >
                  {weightedScoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Objective Weights */}
      <div className="bg-surface-primary p-6 rounded-lg">
        <h3 className="text-lg font-medium text-txt-primary mb-4">Customize Objective Weights</h3>
        <p className="text-sm text-txt-muted mb-6">
          Adjust the importance of each objective to match your investment priorities
        </p>

        {/* Metric Explanations */}
        <div className="bg-surface-elevated rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-txt-primary mb-3">Metric Explanations:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-txt-secondary">
            <div>
              <span className="font-medium text-terminal-cyan">ROI:</span> Total annualized return including cash flow, appreciation, and principal paydown
            </div>
            <div>
              <span className="font-medium text-terminal-green">Cash Flow:</span> Monthly income after all expenses (mortgage, taxes, insurance, maintenance)
            </div>
            <div>
              <span className="font-medium text-terminal-amber">Risk:</span> Market volatility, regulatory changes, vacancy rates, holding period uncertainty
            </div>
            <div>
              <span className="font-medium text-terminal-amber">Workload:</span> Time and effort required for management, maintenance, tenant relations, marketing
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="roi-weight" className="block text-sm font-medium text-txt-primary">Return on Investment</label>
              <span className="text-sm font-medium text-terminal-cyan">{objectiveWeights.roi}%</span>
            </div>
            <input
              type="range"
              id="roi-weight"
              min="0"
              max="100"
              value={objectiveWeights.roi}
              onChange={(e) => onWeightChange('roi', parseInt(e.target.value))}
              className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="cashFlow-weight" className="block text-sm font-medium text-txt-primary">Cash Flow</label>
              <span className="text-sm font-medium text-terminal-cyan">{objectiveWeights.cashFlow}%</span>
            </div>
            <input
              type="range"
              id="cashFlow-weight"
              min="0"
              max="100"
              value={objectiveWeights.cashFlow}
              onChange={(e) => onWeightChange('cashFlow', parseInt(e.target.value))}
              className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="risk-weight" className="block text-sm font-medium text-txt-primary">Lower Risk</label>
              <span className="text-sm font-medium text-terminal-cyan">{objectiveWeights.risk}%</span>
            </div>
            <input
              type="range"
              id="risk-weight"
              min="0"
              max="100"
              value={objectiveWeights.risk}
              onChange={(e) => onWeightChange('risk', parseInt(e.target.value))}
              className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="workload-weight" className="block text-sm font-medium text-txt-primary">Lower Workload</label>
              <span className="text-sm font-medium text-terminal-cyan">{objectiveWeights.workload}%</span>
            </div>
            <input
              type="range"
              id="workload-weight"
              min="0"
              max="100"
              value={objectiveWeights.workload}
              onChange={(e) => onWeightChange('workload', parseInt(e.target.value))}
              className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Advanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cash Flow Projection Chart */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <h3 className="text-lg font-medium text-txt-primary mb-4">Cash Flow Progression (Years 0-5)</h3>
          <p className="text-sm text-txt-secondary mb-4">
            Annual cash flow progression starting from Year 0, accounting for rent increases, property tax, and insurance changes
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowProjectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.1)" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12, fill: '#8b949e' }}
                  axisLine={{ stroke: 'rgba(0, 255, 65, 0.1)' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#8b949e' }}
                  axisLine={{ stroke: 'rgba(0, 255, 65, 0.1)' }}
                  tickFormatter={(value) => `$${formatCurrency(value)}`}
                />
                <RechartsTooltip
                  formatter={(value, name, props) => {
                    const strategyName = name === 'ltr' ? 'Long-Term Rental' :
                                       name === 'str' ? 'Short-Term Rental' : name;
                    return [`$${formatCurrency(value)}`, strategyName];
                  }}
                  labelFormatter={(label) => label}
                  contentStyle={{ backgroundColor: '#161b22', borderRadius: '6px', border: '1px solid #30363d', color: '#c9d1d9' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ltr"
                  stroke="#00d4ff"
                  strokeWidth={3}
                  name="Long-Term Rental"
                  dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="str"
                  stroke="#ffb000"
                  strokeWidth={3}
                  name="Short-Term Rental"
                  dot={{ fill: '#ffb000', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI Comparison Chart */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <h3 className="text-lg font-medium text-txt-primary mb-4">ROI Comparison</h3>
          <p className="text-sm text-txt-secondary mb-4">
            Annualized total return comparison across all strategies
          </p>
          <p className="text-xs text-txt-muted mb-4">
            Based on 5-year hold period including cash flow + appreciation + principal paydown ÷ 5 years
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                {
                  strategy: 'Fix & Flip',
                  roi: annualizedROI,
                  color: '#00ff41'
                },
                {
                  strategy: 'Long-Term Rental',
                  roi: ltrTotalROIAnnualized,
                  color: '#00d4ff'
                },
                {
                  strategy: 'Short-Term Rental',
                  roi: strTotalROIAnnualized,
                  color: '#ffb000'
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.1)" />
                <XAxis
                  dataKey="strategy"
                  tick={{ fontSize: 12, fill: '#8b949e' }}
                  axisLine={{ stroke: 'rgba(0, 255, 65, 0.1)' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#8b949e' }}
                  axisLine={{ stroke: 'rgba(0, 255, 65, 0.1)' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <RechartsTooltip
                  formatter={(value) => [`${formatPercent(value)}%`, 'Annual ROI']}
                  labelFormatter={(label) => label}
                  contentStyle={{ backgroundColor: '#161b22', borderRadius: '6px', border: '1px solid #30363d', color: '#c9d1d9' }}
                />
                <Bar
                  dataKey="roi"
                  fill="#00ff41"
                  radius={[4, 4, 0, 0]}
                >
                  {[
                    { strategy: 'Fix & Flip', roi: annualizedROI, color: '#00ff41' },
                    { strategy: 'Long-Term Rental', roi: ltrTotalROIAnnualized, color: '#00d4ff' },
                    { strategy: 'Short-Term Rental', roi: strTotalROIAnnualized, color: '#ffb000' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Renovation Timeline Chart (if condition is selected) */}
      {(renovationTimelineData.length > 0) && (
        <div className="bg-surface-primary p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-txt-primary mb-4">
            Renovation Timeline & Budget {formData.propertyCondition ?
              `(${formData.propertyCondition.charAt(0).toUpperCase() + formData.propertyCondition.slice(1)} Condition)` :
              '(Estimated Timeline)'}
          </h3>
          <p className="text-sm text-txt-secondary mb-6">
            Estimated renovation phases and budget allocation over time
          </p>

          {/* Timeline Visual */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-txt-primary">Project Timeline</span>
              <span className="text-sm text-txt-muted">
                Total Duration: {renovationTimelineData[renovationTimelineData.length - 1]?.weeks || 0} weeks
              </span>
            </div>

            <div className="relative">
              {/* Timeline bar */}
              <div className="w-full bg-surface-elevated rounded-lg h-4 mb-4">
                {renovationTimelineData.map((phase, index) => {
                  const totalWeeks = renovationTimelineData[renovationTimelineData.length - 1]?.weeks || 1;
                  const startWeek = index === 0 ? 0 : renovationTimelineData[index - 1]?.weeks || 0;
                  const phaseWeeks = phase.weeks - startWeek;
                  const startPercent = (startWeek / totalWeeks) * 100;
                  const widthPercent = (phaseWeeks / totalWeeks) * 100;

                  const colors = ['#00ff41', '#00d4ff', '#ffb000', '#ff073a', '#00ff41', '#00d4ff', '#ffb000'];
                  const color = colors[index % colors.length];

                  return (
                    <div
                      key={index}
                      className="absolute top-0 h-4 rounded transition-all duration-300 hover:opacity-80"
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: color
                      }}
                      title={`${phase.phase}: ${phaseWeeks} weeks, $${formatCurrency(phase.cost - (index === 0 ? 0 : renovationTimelineData[index - 1]?.cost || 0))}`}
                    />
                  );
                })}
              </div>

              {/* Phase labels */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                {renovationTimelineData.map((phase, index) => {
                  const colors = ['#00ff41', '#00d4ff', '#ffb000', '#ff073a', '#00ff41', '#00d4ff', '#ffb000'];
                  const color = colors[index % colors.length];
                  const phaseWeeks = index === 0 ? phase.weeks : phase.weeks - renovationTimelineData[index - 1]?.weeks;
                  const phaseCost = index === 0 ? phase.cost : phase.cost - renovationTimelineData[index - 1]?.cost;

                  return (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-surface-elevated rounded">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <div className="font-medium text-txt-primary">{phase.phase}</div>
                        <div className="text-txt-muted">{phaseWeeks}w • ${formatCurrency(phaseCost)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cost Progression Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={renovationTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 65, 0.1)" />
                <XAxis
                  dataKey="weeks"
                  tick={{ fontSize: 12, fill: '#8b949e' }}
                  axisLine={{ stroke: 'rgba(0, 255, 65, 0.1)' }}
                  tickFormatter={(value) => `${value}w`}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#8b949e' }}
                  axisLine={{ stroke: 'rgba(0, 255, 65, 0.1)' }}
                  tickFormatter={(value) => `$${formatCurrency(value)}`}
                />
                <RechartsTooltip
                  formatter={(value, name) => [`$${formatCurrency(value)}`, 'Cumulative Cost']}
                  labelFormatter={(label) => `Week ${label}`}
                  contentStyle={{ backgroundColor: '#161b22', borderRadius: '6px', border: '1px solid #30363d', color: '#c9d1d9' }}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#00ff41"
                  fill="#00ff41"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
