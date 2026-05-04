import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_OBJECTIVE_WEIGHTS, STRATEGY_LABELS } from '../utils/constants/realEstateConstants';
import { calculateModaScores, getRecommendedStrategy } from '../utils/calculations/modaAnalysis';
import { useResultsAnalysis } from '../hooks/useResultsAnalysis';
import ResultsDashboard from '../components/realEstate/ResultsDashboard';
import SensitivityAnalysis from '../components/realEstate/SensitivityAnalysis';
import StrategySelector from '../components/realEstate/StrategySelector';
import FlipAnalysis from '../components/realEstate/FlipAnalysis';
import LtrAnalysis from '../components/realEstate/LtrAnalysis';
import StrAnalysis from '../components/realEstate/StrAnalysis';
import StrategyComparison from '../components/realEstate/StrategyComparison';
import ModaAnalysis from '../components/realEstate/ModaAnalysis';
import TutorialHints from '../components/TutorialHints';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state?.formData || {};

  const [objectiveWeights, setObjectiveWeights] = useState(DEFAULT_OBJECTIVE_WEIGHTS);
  const [selectedStrategy, setSelectedStrategy] = useState('all');

  const analysis = useResultsAnalysis(formData);

  if (!formData.purchasePrice) {
    return (
      <div className="min-h-screen bg-terminal-bg py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="terminal-card p-6 text-center">
            <h2 className="text-xl font-semibold text-txt-primary mb-4">
              No calculation data available
            </h2>
            <button
              onClick={() => navigate('/real-estate')}
              className="glow-btn glow-btn-green px-4 py-2 text-sm font-medium rounded-md"
            >
              Go to Calculator
            </button>
          </div>
        </div>
      </div>
    );
  }

  const modaResults = calculateModaScores({
    annualizedROI: analysis.annualizedROI,
    holdingPeriod: analysis.holdingPeriod,
    ltrTotalROIAnnualized: analysis.ltrTotalROIAnnualized,
    annualCashFlow: analysis.annualCashFlow,
    downPayment: analysis.downPayment,
    renovationCost: analysis.renovationCost,
    strTotalROIAnnualized: analysis.strTotalROIAnnualized,
    annualStrCashFlow: analysis.annualStrCashFlow,
    objectiveWeights,
  });

  const recommendedStrategy = getRecommendedStrategy(modaResults.weightedScores);

  const handleWeightChange = (objective, value) => {
    setObjectiveWeights(prev => ({ ...prev, [objective]: value }));
  };

  return (
    <div className="min-h-screen bg-terminal-bg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="terminal-card p-6">
          <h1 className="text-3xl font-display font-bold text-center text-terminal-green crt-glow uppercase tracking-wider mb-2">
            Investment Analysis Results
          </h1>
          <p className="text-center text-txt-muted mb-6">
            Compare different exit strategies to find the best option for this property
          </p>

          <ResultsDashboard
            analysis={analysis}
            recommendedStrategy={recommendedStrategy}
            strategyLabels={STRATEGY_LABELS}
          />

          <SensitivityAnalysis
            formData={formData}
            sensitivityInputs={analysis.sensitivityInputs}
            onSensitivityChange={analysis.handleSensitivityChange}
            estimateNightlyRate={analysis.estimateNightlyRate}
          />

          <StrategySelector
            selected={selectedStrategy}
            onSelect={setSelectedStrategy}
          />

          {selectedStrategy === 'flip' && (
            <FlipAnalysis analysis={analysis} formData={formData} />
          )}
          {selectedStrategy === 'ltr' && (
            <LtrAnalysis analysis={analysis} formData={formData} />
          )}
          {selectedStrategy === 'str' && (
            <StrAnalysis analysis={analysis} formData={formData} />
          )}

          <StrategyComparison
            analysis={analysis}
            selectedStrategy={selectedStrategy}
            recommendedStrategy={recommendedStrategy}
            formData={formData}
          />

          <ModaAnalysis
            analysis={analysis}
            modaResults={modaResults}
            objectiveWeights={objectiveWeights}
            onWeightChange={handleWeightChange}
            formData={formData}
          />

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/real-estate')}
              className="glow-btn glow-btn-green px-6 py-3 text-base font-medium rounded-md"
            >
              Back to Calculator
            </button>
          </div>
        </div>
      </div>
      <TutorialHints />
    </div>
  );
}

export default Results;
