import React, { useState, useMemo, useCallback } from 'react';
import { useFinancialPlan } from '../../context/FinancialPlanContext';
import { RISK_PROFILES } from '../../utils/monteCarloSimulation';
import { formatCurrency } from '../../utils/formatters';
import { exportSpendDownToExcel, exportSpendDownToCSV } from '../../utils/reportExport';
import { pdf } from '@react-pdf/renderer';
import { FinancialPlanPDF } from '../../utils/pdfReport';

function ReportCard({ title, description, available, onExportExcel, onExportCSV, onExportPDF, pdfGenerating, children }) {
  return (
    <div className={`terminal-card p-5 ${available ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-display font-bold text-terminal-green uppercase tracking-wider text-sm">
            {title}
          </h3>
          <p className="text-txt-secondary font-mono text-xs mt-1">{description}</p>
        </div>
        {available && (
          <div className="flex gap-2 flex-shrink-0">
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-txt-secondary text-xs font-mono uppercase tracking-wider hover:text-terminal-cyan hover:border-terminal-dark-green transition-colors"
              >
                CSV
              </button>
            )}
            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="glow-btn glow-btn-green px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider"
              >
                Excel
              </button>
            )}
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                disabled={pdfGenerating}
                className="px-3 py-1.5 rounded-lg bg-[#1a2332] border border-[#c8a951] text-[#c8a951] text-xs font-mono uppercase tracking-wider hover:bg-[#c8a951] hover:text-[#1a2332] transition-colors disabled:opacity-50"
              >
                {pdfGenerating ? 'Generating...' : 'PDF Report'}
              </button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ReportsSection() {
  const { state } = useFinancialPlan();
  const [lastExport, setLastExport] = useState(null);

  const profile = state.profile;
  const riskProfile = state.simulationConfig?.riskProfile || 'balanced';
  const riskParams = RISK_PROFILES[riskProfile] || RISK_PROFILES.balanced;

  const hasMCResults = state.simulationResults != null;
  const hasSpendDown = state.spendDownAnalysis != null;

  const totalPortfolio = useMemo(
    () => Object.values(profile.accounts).reduce((s, v) => s + v, 0),
    [profile.accounts],
  );

  const spendDownReportData = useMemo(() => {
    if (!hasSpendDown) return null;
    const sd = state.spendDownAnalysis;
    const ages = {
      current: profile.spouse1.currentAge,
      retirement: profile.spouse1.retirementAge,
      life: profile.lifeExpectancy,
    };
    const retYears = Math.max(1, ages.life - ages.retirement);
    const mcMeanReturn = state.simulationResults?.medianCAGR || (riskParams.meanReturn / 100);
    const yearsToRetire = Math.max(0, ages.retirement - ages.current);
    let projectedPortfolio = totalPortfolio;
    if (yearsToRetire > 0) {
      for (let y = 0; y < yearsToRetire; y++) {
        projectedPortfolio = (projectedPortfolio + profile.annualSavings) * (1 + mcMeanReturn);
      }
      projectedPortfolio = Math.round(projectedPortfolio);
    }
    return {
      profile,
      projectedPortfolio,
      riskProfile,
      retYears,
      ages,
      spending: profile.annualSpending,
      survivalAnalysis: sd.survivalAnalysis,
      strategyResults: null,
      rmdData: null,
      rothLadderData: null,
      ssData: null,
      taxData: null,
    };
  }, [hasSpendDown, state.spendDownAnalysis, profile, riskProfile, riskParams, totalPortfolio, state.simulationResults]);

  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handlePDF = useCallback(async (data) => {
    setPdfGenerating(true);
    try {
      const blob = await pdf(<FinancialPlanPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ultronic_Financial_Plan_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastExport({ filename: a.download, time: new Date(), format: 'PDF' });
    } catch (e) {
      console.error('PDF generation failed:', e);
    } finally {
      setPdfGenerating(false);
    }
  }, []);

  const handleExcel = (data) => {
    try {
      const filename = exportSpendDownToExcel(data);
      setLastExport({ filename, time: new Date(), format: 'Excel' });
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleCSV = (data) => {
    try {
      const filename = exportSpendDownToCSV(data);
      setLastExport({ filename, time: new Date(), format: 'CSV' });
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-terminal-green crt-glow uppercase tracking-wider">
          Reports
        </h2>
        <p className="text-txt-secondary font-mono text-sm mt-2">
          Generate and export comprehensive financial reports
        </p>
      </div>

      {lastExport && (
        <div className="terminal-card p-3 mb-6 border-terminal-green">
          <p className="text-terminal-green font-mono text-xs">
            Exported {lastExport.format}: <span className="text-terminal-cyan">{lastExport.filename}</span>
            <span className="text-txt-muted ml-2">({lastExport.time.toLocaleTimeString()})</span>
          </p>
        </div>
      )}

      {/* Data Availability Summary */}
      <div className="terminal-card p-5 mb-6">
        <h3 className="font-display font-bold text-terminal-amber uppercase tracking-wider text-xs mb-4">
          Available Data
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded p-3 border ${totalPortfolio > 0 ? 'border-terminal-green bg-terminal-dark-green/10' : 'border-surface-border bg-surface-elevated'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${totalPortfolio > 0 ? 'bg-terminal-green' : 'bg-txt-muted'}`} />
              <span className="text-xs font-mono uppercase tracking-wider text-txt-secondary">Financial Profile</span>
            </div>
            <p className="text-xs font-mono text-txt-muted ml-4">
              {totalPortfolio > 0
                ? `${formatCurrency(totalPortfolio)} across ${Object.values(profile.accounts).filter(v => v > 0).length} accounts`
                : 'Enter account balances in Profile'}
            </p>
          </div>
          <div className={`rounded p-3 border ${hasMCResults ? 'border-terminal-green bg-terminal-dark-green/10' : 'border-surface-border bg-surface-elevated'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${hasMCResults ? 'bg-terminal-green' : 'bg-txt-muted'}`} />
              <span className="text-xs font-mono uppercase tracking-wider text-txt-secondary">Monte Carlo Simulation</span>
            </div>
            <p className="text-xs font-mono text-txt-muted ml-4">
              {hasMCResults
                ? `${riskProfile} (${Math.round(riskParams.stocks * 100)}/${Math.round((1 - riskParams.stocks) * 100)}) — ${riskParams.meanReturn}% expected CAGR`
                : 'Run simulation in Accumulate'}
            </p>
          </div>
          <div className={`rounded p-3 border ${hasSpendDown ? 'border-terminal-green bg-terminal-dark-green/10' : 'border-surface-border bg-surface-elevated'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${hasSpendDown ? 'bg-terminal-green' : 'bg-txt-muted'}`} />
              <span className="text-xs font-mono uppercase tracking-wider text-txt-secondary">Spend-Down Analysis</span>
            </div>
            <p className="text-xs font-mono text-txt-muted ml-4">
              {hasSpendDown
                ? `${state.spendDownAnalysis.survivalAnalysis?.numSims?.toLocaleString()} simulations, ${state.spendDownAnalysis.survivalAnalysis?.strategies?.length} strategies`
                : 'Run analysis in Spend-Down'}
            </p>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="space-y-4">
        <ReportCard
          title="Spend-Down Analysis Report"
          description="Withdrawal strategy comparison, survival analysis, SWR by strategy, RMD projections, Roth conversion ladder, Social Security, and tax bracket analysis."
          available={hasSpendDown}
          onExportExcel={spendDownReportData ? () => handleExcel(spendDownReportData) : null}
          onExportCSV={spendDownReportData ? () => handleCSV(spendDownReportData) : null}
          onExportPDF={spendDownReportData ? () => handlePDF(spendDownReportData) : null}
          pdfGenerating={pdfGenerating}
        >
          {hasSpendDown && state.spendDownAnalysis.survivalAnalysis && (
            <div className="mt-4 border-t border-surface-border pt-4">
              <p className="text-txt-muted text-xs font-mono uppercase tracking-wider mb-2">Preview — Safe Withdrawal Rates (95% Success)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-surface-border">
                      <th className="text-left text-terminal-amber uppercase tracking-wider py-1.5 px-2">Strategy</th>
                      <th className="text-left text-terminal-amber uppercase tracking-wider py-1.5 px-2">Safe Rate</th>
                      <th className="text-left text-terminal-amber uppercase tracking-wider py-1.5 px-2">Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.spendDownAnalysis.survivalAnalysis.strategies
                      .filter(s => s.maxSafeRate != null)
                      .sort((a, b) => b.maxSafeRate - a.maxSafeRate)
                      .map((s, i) => (
                        <tr key={i} className="border-b border-surface-border/30">
                          <td className="py-1.5 px-2 text-terminal-green">{s.label}</td>
                          <td className="py-1.5 px-2 text-terminal-cyan">{(s.maxSafeRate * 100).toFixed(2)}%</td>
                          <td className="py-1.5 px-2 text-txt-primary">{formatCurrency(s.maxSafeAnnual)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!hasSpendDown && (
            <p className="text-txt-muted font-mono text-xs mt-3 italic">
              Go to Spend-Down and click "Run Analysis" to generate this report.
            </p>
          )}
        </ReportCard>

        <ReportCard
          title="Monte Carlo Simulation Report"
          description="Full simulation results, return distributions, portfolio growth projections, and risk metrics."
          available={hasMCResults}
        >
          {hasMCResults && (
            <div className="mt-4 border-t border-surface-border pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Median CAGR', value: `${(state.simulationResults.medianCAGR * 100).toFixed(1)}%` },
                  { label: 'Median Final', value: formatCurrency(state.simulationResults.medianFinalValue) },
                  { label: 'Success Rate', value: `${state.simulationResults.successRate?.toFixed(1) || '—'}%` },
                  { label: 'Simulations', value: state.simulationConfig?.numberOfSimulations?.toLocaleString() },
                ].map((m, i) => (
                  <div key={i} className="bg-surface-elevated rounded p-2">
                    <p className="text-txt-muted text-[10px] uppercase tracking-wider font-mono">{m.label}</p>
                    <p className="text-terminal-cyan text-sm font-bold font-mono">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!hasMCResults && (
            <p className="text-txt-muted font-mono text-xs mt-3 italic">
              Go to Accumulate and run a Monte Carlo simulation first.
            </p>
          )}
        </ReportCard>

        <ReportCard
          title="Comprehensive Financial Plan"
          description="Combined report with all sections: profile, accumulation, spend-down, tax optimization."
          available={hasMCResults && hasSpendDown}
        >
          {!(hasMCResults && hasSpendDown) && (
            <p className="text-txt-muted font-mono text-xs mt-3 italic">
              Complete both Accumulate and Spend-Down analyses to unlock this report.
            </p>
          )}
        </ReportCard>
      </div>
    </div>
  );
}
