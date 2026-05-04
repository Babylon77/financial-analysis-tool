import * as XLSX from 'xlsx';
import { formatCurrency } from './formatters';

function buildSummarySheet(data) {
  const { profile, projectedPortfolio, riskProfile, retYears, ages } = data;
  const totalPortfolio = Object.values(profile.accounts).reduce((s, v) => s + v, 0);
  const rows = [
    ['ULTRONIC TERMINAL — Spend-Down Analysis Report'],
    ['Generated', new Date().toLocaleDateString()],
    [],
    ['RETIREMENT PROFILE'],
    ['Current Age', ages.current],
    ['Retirement Age', ages.retirement],
    ['Life Expectancy', ages.life],
    ['Retirement Span', `${retYears} years`],
    ['Filing Status', profile.filingStatus],
    ['Portfolio Allocation', riskProfile],
    [],
    ['FINANCIAL SUMMARY'],
    ['Current Portfolio', totalPortfolio],
    ['Projected at Retirement', projectedPortfolio],
    ['Annual Spending', profile.annualSpending],
    ['Initial Withdrawal Rate', `${((profile.annualSpending / projectedPortfolio) * 100).toFixed(2)}%`],
    ['Annual Savings', profile.annualSavings],
    [],
    ['INCOME SOURCES'],
    ['SS Benefit (Spouse 1)', profile.ss1 * 12],
    ['SS Benefit (Spouse 2)', profile.ss2 * 12],
    ['Pension (Annual)', (profile.pension1?.annualAmount || 0) + (profile.pension2?.annualAmount || 0)],
    [],
    ['ACCOUNT BALANCES'],
    ['Traditional 401(k)', profile.accounts.trad401k],
    ['Traditional IRA', profile.accounts.tradIRA],
    ['Roth 401(k)', profile.accounts.roth401k],
    ['Roth IRA', profile.accounts.rothIRA],
    ['HSA', profile.accounts.hsa],
    ['Taxable', profile.accounts.taxable],
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildSurvivalSheet(data) {
  const { survivalAnalysis, spending, projectedPortfolio } = data;
  if (!survivalAnalysis) return null;

  const rows = [
    ['STRATEGY SURVIVAL ANALYSIS'],
    [`Simulations: ${survivalAnalysis.numSims.toLocaleString()}`],
    [],
    ['MAXIMUM SAFE SPENDING (95% Success)'],
    ['Strategy', 'Safe Rate', 'Annual Amount', 'Monthly Amount'],
    ...survivalAnalysis.strategies
      .filter(s => s.maxSafeRate != null)
      .sort((a, b) => b.maxSafeRate - a.maxSafeRate)
      .map(s => [
        s.label,
        `${(s.maxSafeRate * 100).toFixed(2)}%`,
        s.maxSafeAnnual,
        Math.round(s.maxSafeAnnual / 12),
      ]),
    [],
    [`AT CURRENT SPENDING (${formatCurrency(spending)}/yr — ${((spending / projectedPortfolio) * 100).toFixed(1)}%)`],
    ['Strategy', 'Survival Rate', 'Worst-Case Floor (p10)', 'Median Lifetime Total'],
    ...survivalAnalysis.strategies.map(s => [
      s.label,
      s.neverDepletes ? '100%' : `${(s.successRate * 100).toFixed(1)}%`,
      s.p10MinWithdrawal,
      s.medianTotalSpending,
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildStrategySheet(data) {
  const { strategyResults } = data;
  if (!strategyResults) return null;

  const rows = [
    ['WITHDRAWAL STRATEGY COMPARISON (Median Path)'],
    [],
    ['Strategy', 'Year-1 Withdrawal', 'Year-10 Withdrawal', 'Year-20 Withdrawal', 'Final Balance', 'Max Withdrawal Rate'],
    ...strategyResults.table.map(s => [
      s.label,
      s.initialWd,
      s.yr10Wd,
      s.yr20Wd,
      s.depletesByDesign && s.finalBalance <= 0 ? '$0 (by design)' : s.finalBalance,
      s.depletesByDesign ? 'N/A' : `${(s.maxRate * 100).toFixed(1)}%`,
    ]),
    [],
    ['YEAR-BY-YEAR PORTFOLIO BALANCES'],
    ['Age', ...strategyResults.chartData.length > 0 ? Object.keys(strategyResults.chartData[0]).filter(k => k !== 'year' && k !== 'age') : []],
    ...strategyResults.chartData.map(row => [
      row.age,
      ...Object.entries(row).filter(([k]) => k !== 'year' && k !== 'age').map(([, v]) => v),
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildRmdSheet(data) {
  const { rmdData } = data;
  if (!rmdData?.length) return null;

  const rows = [
    ['REQUIRED MINIMUM DISTRIBUTIONS'],
    [],
    ['Age', 'Account Balance', 'RMD Amount', 'RMD % of Balance'],
    ...rmdData.map(r => [
      r.age,
      r.balance,
      r.rmdAmount,
      `${(r.pctOfBalance * 100).toFixed(2)}%`,
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildRothSheet(data) {
  const { rothLadderData } = data;
  if (!rothLadderData) return null;

  const rows = [
    ['ROTH CONVERSION LADDER'],
    [],
    ['Marginal Rate at Retirement', `${(rothLadderData.conversionInfo.currentMarginalRate * 100).toFixed(0)}%`],
    ['Optimal Annual Conversion', rothLadderData.conversionInfo.optimalConversion],
    ['Tax on Conversion', rothLadderData.conversionInfo.taxOnConversion],
    [],
    ['Age', 'Conversion', 'Tax Paid', 'RMD', 'Traditional Balance', 'Roth Balance', 'Penalty-Free Roth', 'IRMAA Impact'],
    ...rothLadderData.ladder.schedule.map(r => [
      r.age,
      r.conversion,
      r.taxOnConversion,
      r.rmdAmount || 0,
      r.traditionalBalance,
      r.rothBalance,
      r.penaltyFreeRothBalance,
      r.estimatedIrmaaImpact || 0,
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildSsSheet(data) {
  const { ssData } = data;
  if (!ssData) return null;

  const rows = [['SOCIAL SECURITY OPTIMIZER'], []];

  for (const { label, d } of [
    { label: 'Spouse 1', d: ssData.spouse1 },
    { label: 'Spouse 2', d: ssData.spouse2 },
  ]) {
    if (!d) continue;
    rows.push(
      [label],
      ['Optimal Claiming Age', d.optimalAge],
      ['Claiming Age', 'Monthly Benefit', 'Lifetime Total'],
      ...d.scenarios.map(s => [s.claimingAge, s.monthlyBenefit, s.nominalLifetimeTotal]),
      [],
    );
  }

  if (ssData.breakEven62v67) {
    rows.push(['Break-Even: 62 vs 67', ssData.breakEven62v67.breakEvenAge ? `Age ${ssData.breakEven62v67.breakEvenAge}` : 'Never']);
  }
  if (ssData.breakEven67v70) {
    rows.push(['Break-Even: 67 vs 70', ssData.breakEven67v70.breakEvenAge ? `Age ${ssData.breakEven67v70.breakEvenAge}` : 'Never']);
  }
  return XLSX.utils.aoa_to_sheet(rows);
}

function buildTaxSheet(data) {
  const { taxData } = data;
  if (!taxData) return null;

  const rows = [
    ['TAX BRACKET MANAGEMENT'],
    [],
    ['Est. Retirement Income', taxData.retirementIncome],
    ['Taxable Social Security', taxData.taxableSS],
    ['Total Pension', taxData.totalPension],
    ['Withdrawal from Deferred', taxData.withdrawalFromDeferred],
    [],
    ['Marginal Bracket', `${(taxData.marginalInfo.marginalRate * 100).toFixed(0)}%`],
    ['Effective Rate', `${(taxData.taxResult.effectiveRate * 100).toFixed(1)}%`],
    ['Federal Tax', taxData.taxResult.tax],
    ['Bracket Fill', `${(taxData.bracketFillPct * 100).toFixed(0)}%`],
    ...(taxData.conversionSpace != null ? [['Roth Conversion Space', taxData.conversionSpace]] : []),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

function formatCurrencyCells(ws) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === 'number' && Math.abs(cell.v) >= 100) {
        cell.z = '#,##0';
      }
    }
  }
}

export function exportSpendDownToExcel(reportData) {
  const wb = XLSX.utils.book_new();

  const sheets = [
    { name: 'Summary', builder: buildSummarySheet },
    { name: 'Survival Analysis', builder: buildSurvivalSheet },
    { name: 'Strategy Comparison', builder: buildStrategySheet },
    { name: 'RMD Projections', builder: buildRmdSheet },
    { name: 'Roth Conversion', builder: buildRothSheet },
    { name: 'Social Security', builder: buildSsSheet },
    { name: 'Tax Brackets', builder: buildTaxSheet },
  ];

  for (const { name, builder } of sheets) {
    const ws = builder(reportData);
    if (ws) {
      formatCurrencyCells(ws);
      const colWidths = [];
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let c = range.s.c; c <= range.e.c; c++) {
        let max = 10;
        for (let r = range.s.r; r <= range.e.r; r++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c })];
          if (cell?.v != null) max = Math.max(max, String(cell.v).length + 2);
        }
        colWidths.push({ wch: Math.min(max, 30) });
      }
      ws['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, name);
    }
  }

  const filename = `Ultronic_SpendDown_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}

export function exportSpendDownToCSV(reportData) {
  const wb = XLSX.utils.book_new();

  const allRows = [];
  const addSection = (builder, title) => {
    const ws = builder(reportData);
    if (!ws) return;
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    allRows.push([`=== ${title} ===`]);
    allRows.push(...data);
    allRows.push([]);
  };

  addSection(buildSummarySheet, 'SUMMARY');
  addSection(buildSurvivalSheet, 'SURVIVAL ANALYSIS');
  addSection(buildStrategySheet, 'STRATEGY COMPARISON');
  addSection(buildRmdSheet, 'RMD PROJECTIONS');
  addSection(buildRothSheet, 'ROTH CONVERSION');
  addSection(buildSsSheet, 'SOCIAL SECURITY');
  addSection(buildTaxSheet, 'TAX BRACKETS');

  const ws = XLSX.utils.aoa_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  const filename = `Ultronic_SpendDown_${new Date().toISOString().slice(0, 10)}.csv`;
  XLSX.writeFile(wb, filename, { bookType: 'csv' });
  return filename;
}
