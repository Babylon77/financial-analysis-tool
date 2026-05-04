import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const NAVY = '#1a2332';
const GOLD = '#c8a951';
const GREEN = '#2d8a4e';
const LIGHT_BG = '#f8f9fa';
const BORDER = '#dee2e6';
const TEXT_PRIMARY = '#212529';
const TEXT_SECONDARY = '#6c757d';
const WHITE = '#ffffff';
const RED = '#dc3545';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' },
  ],
});

const s = StyleSheet.create({
  page: { padding: 50, fontSize: 9, fontFamily: 'Helvetica', color: TEXT_PRIMARY, position: 'relative' },
  pageFooter: { position: 'absolute', bottom: 25, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 7, color: TEXT_SECONDARY },
  footerLine: { position: 'absolute', bottom: 40, left: 50, right: 50, height: 0.5, backgroundColor: BORDER },

  // Cover
  coverPage: { padding: 0, fontFamily: 'Helvetica' },
  coverTop: { backgroundColor: NAVY, height: 260, justifyContent: 'flex-end', padding: 50, paddingBottom: 40 },
  coverTitle: { fontSize: 28, color: WHITE, fontWeight: 'bold', letterSpacing: 1 },
  coverSubtitle: { fontSize: 12, color: GOLD, marginTop: 8, letterSpacing: 2, textTransform: 'uppercase' },
  coverBody: { padding: 50, paddingTop: 40 },
  coverMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  coverMetaBlock: {},
  coverMetaLabel: { fontSize: 8, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  coverMetaValue: { fontSize: 12, color: TEXT_PRIMARY, fontWeight: 'bold' },
  coverDivider: { height: 2, backgroundColor: GOLD, width: 60, marginBottom: 30 },
  coverHighlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  coverHighlight: { width: '48%', backgroundColor: LIGHT_BG, borderRadius: 4, padding: 12, marginBottom: 8, borderLeft: `3px solid ${GOLD}` },
  coverHighlightLabel: { fontSize: 7, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  coverHighlightValue: { fontSize: 14, color: NAVY, fontWeight: 'bold' },
  coverDisclaimer: { position: 'absolute', bottom: 40, left: 50, right: 50 },
  coverDisclaimerText: { fontSize: 6.5, color: TEXT_SECONDARY, lineHeight: 1.5 },
  coverBrand: { position: 'absolute', bottom: 25, right: 50, fontSize: 7, color: TEXT_SECONDARY, letterSpacing: 1 },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: NAVY, marginBottom: 4, marginTop: 20 },
  sectionSubtitle: { fontSize: 8, color: TEXT_SECONDARY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  sectionBar: { height: 2, backgroundColor: GOLD, width: 40, marginBottom: 16 },
  subheading: { fontSize: 11, fontWeight: 'bold', color: NAVY, marginTop: 16, marginBottom: 8 },

  // Tables
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: NAVY, borderRadius: 2, paddingVertical: 5, paddingHorizontal: 8 },
  tableHeaderCell: { fontSize: 7, color: WHITE, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottom: `0.5px solid ${BORDER}` },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottom: `0.5px solid ${BORDER}`, backgroundColor: LIGHT_BG },
  tableCell: { fontSize: 8.5, color: TEXT_PRIMARY },
  tableCellBold: { fontSize: 8.5, color: TEXT_PRIMARY, fontWeight: 'bold' },
  tableCellGreen: { fontSize: 8.5, color: GREEN, fontWeight: 'bold' },
  tableCellRed: { fontSize: 8.5, color: RED, fontWeight: 'bold' },
  tableCellMuted: { fontSize: 8.5, color: TEXT_SECONDARY, fontStyle: 'italic' },

  // Metric cards
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: LIGHT_BG, borderRadius: 4, padding: 10, borderTop: `2px solid ${GOLD}` },
  metricLabel: { fontSize: 7, color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  metricValue: { fontSize: 13, fontWeight: 'bold', color: NAVY },
  metricValueGreen: { fontSize: 13, fontWeight: 'bold', color: GREEN },

  // Text
  paragraph: { fontSize: 9, color: TEXT_PRIMARY, lineHeight: 1.6, marginBottom: 8 },
  callout: { backgroundColor: LIGHT_BG, borderLeft: `3px solid ${GOLD}`, padding: 10, marginBottom: 12, borderRadius: 2 },
  calloutText: { fontSize: 8.5, color: TEXT_PRIMARY, lineHeight: 1.5 },
  note: { fontSize: 7.5, color: TEXT_SECONDARY, lineHeight: 1.4, marginTop: 4 },

  // Phase cards
  phaseCard: { marginBottom: 8, borderLeft: `2px solid ${GREEN}`, paddingLeft: 10, paddingVertical: 4 },
  phaseTitle: { fontSize: 9, fontWeight: 'bold', color: NAVY },
  phaseRange: { fontSize: 7.5, color: TEXT_SECONDARY, marginBottom: 3 },
  phaseStep: { fontSize: 8, color: TEXT_PRIMARY, marginBottom: 2 },
});

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

function pct(n, decimals = 1) {
  if (n == null || isNaN(n)) return '—';
  return (n * 100).toFixed(decimals) + '%';
}

function PageFooter({ date }) {
  return (
    <>
      <View style={s.footerLine} fixed />
      <View style={s.pageFooter} fixed>
        <Text style={s.footerText}>Confidential — Prepared {date}</Text>
        <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </>
  );
}

function DataTable({ columns, rows }) {
  return (
    <View style={s.table}>
      <View style={s.tableHeader}>
        {columns.map((col, i) => (
          <Text key={i} style={[s.tableHeaderCell, { width: col.width || 'auto', flex: col.flex || 1 }]}>{col.label}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={ri % 2 === 1 ? s.tableRowAlt : s.tableRow}>
          {columns.map((col, ci) => {
            const val = col.render ? col.render(row) : row[col.key];
            const cellStyle = col.style === 'bold' ? s.tableCellBold
              : col.style === 'green' ? s.tableCellGreen
              : col.style === 'red' ? s.tableCellRed
              : col.style === 'muted' ? s.tableCellMuted
              : typeof col.style === 'function' ? col.style(row)
              : s.tableCell;
            return (
              <Text key={ci} style={[cellStyle, { width: col.width || 'auto', flex: col.flex || 1 }]}>{val ?? '—'}</Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function CoverPage({ data }) {
  const { profile, projectedPortfolio, riskProfile, retYears, ages, spending, survivalAnalysis } = data;
  const totalPortfolio = Object.values(profile.accounts).reduce((s2, v) => s2 + v, 0);
  const bestStrategy = survivalAnalysis?.strategies
    ?.filter(st => st.maxSafeRate != null)
    ?.sort((a, b) => b.maxSafeRate - a.maxSafeRate)?.[0];
  const clientName = [profile.spouse1?.name, profile.spouse2?.name].filter(Boolean).join(' & ') || 'Client';
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Page size="LETTER" style={s.coverPage}>
      <View style={s.coverTop}>
        <Text style={s.coverTitle}>Financial Plan</Text>
        <Text style={s.coverSubtitle}>Comprehensive Retirement Analysis</Text>
      </View>
      <View style={s.coverBody}>
        <View style={s.coverMeta}>
          <View style={s.coverMetaBlock}>
            <Text style={s.coverMetaLabel}>Prepared For</Text>
            <Text style={s.coverMetaValue}>{clientName}</Text>
          </View>
          <View style={s.coverMetaBlock}>
            <Text style={s.coverMetaLabel}>Date</Text>
            <Text style={s.coverMetaValue}>{date}</Text>
          </View>
          <View style={s.coverMetaBlock}>
            <Text style={s.coverMetaLabel}>Retirement Horizon</Text>
            <Text style={s.coverMetaValue}>Age {ages.retirement} – {ages.life} ({retYears} years)</Text>
          </View>
        </View>
        <View style={s.coverDivider} />
        <View style={s.coverHighlights}>
          <View style={s.coverHighlight}>
            <Text style={s.coverHighlightLabel}>Current Portfolio</Text>
            <Text style={s.coverHighlightValue}>{fmt(totalPortfolio)}</Text>
          </View>
          <View style={s.coverHighlight}>
            <Text style={s.coverHighlightLabel}>Projected at Retirement</Text>
            <Text style={s.coverHighlightValue}>{fmt(projectedPortfolio)}</Text>
          </View>
          <View style={s.coverHighlight}>
            <Text style={s.coverHighlightLabel}>Target Annual Spending</Text>
            <Text style={s.coverHighlightValue}>{fmt(spending)}</Text>
          </View>
          <View style={s.coverHighlight}>
            <Text style={s.coverHighlightLabel}>Portfolio Allocation</Text>
            <Text style={s.coverHighlightValue}>{riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}</Text>
          </View>
          {bestStrategy && (
            <>
              <View style={s.coverHighlight}>
                <Text style={s.coverHighlightLabel}>Recommended Safe Rate</Text>
                <Text style={s.coverHighlightValue}>{pct(bestStrategy.maxSafeRate, 2)}</Text>
              </View>
              <View style={s.coverHighlight}>
                <Text style={s.coverHighlightLabel}>Top Strategy</Text>
                <Text style={s.coverHighlightValue}>{bestStrategy.label}</Text>
              </View>
            </>
          )}
        </View>
      </View>
      <View style={s.coverDisclaimer}>
        <Text style={s.coverDisclaimerText}>
          This report is generated for informational purposes only and does not constitute financial advice.
          All projections are based on Monte Carlo simulations and historical assumptions. Past performance
          does not guarantee future results. Consult a qualified financial advisor before making decisions.
        </Text>
      </View>
      <Text style={s.coverBrand}>ULTRONIC TERMINAL</Text>
    </Page>
  );
}

function ExecutiveSummary({ data }) {
  const { profile, projectedPortfolio, riskProfile, retYears, ages, spending, survivalAnalysis } = data;
  const totalPortfolio = Object.values(profile.accounts).reduce((s2, v) => s2 + v, 0);
  const withdrawalRate = projectedPortfolio > 0 ? spending / projectedPortfolio : 0;
  const strategies = survivalAnalysis?.strategies || [];
  const tunable = strategies.filter(st => st.maxSafeRate != null).sort((a, b) => b.maxSafeRate - a.maxSafeRate);
  const bestStrategy = tunable[0];
  const fixedStrategy = strategies.find(st => st.label?.includes('Fixed'));
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Page size="LETTER" style={s.page}>
      <PageFooter date={date} />
      <Text style={s.sectionTitle}>Executive Summary</Text>
      <View style={s.sectionBar} />

      <Text style={s.paragraph}>
        This analysis evaluates your retirement readiness using {survivalAnalysis?.numSims?.toLocaleString() || '1,000'} Monte
        Carlo simulations with correlated stock-bond returns, regime switching, and stochastic inflation.
        Your {riskProfile} portfolio allocation is modeled over a {retYears}-year retirement horizon
        from age {ages.retirement} to {ages.life}.
      </Text>

      <View style={s.metricsRow}>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>Current Portfolio</Text>
          <Text style={s.metricValue}>{fmt(totalPortfolio)}</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>At Retirement</Text>
          <Text style={s.metricValue}>{fmt(projectedPortfolio)}</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>Target Spending</Text>
          <Text style={s.metricValue}>{fmt(spending)}/yr</Text>
        </View>
        <View style={s.metricCard}>
          <Text style={s.metricLabel}>Withdrawal Rate</Text>
          <Text style={withdrawalRate > 0.04 ? s.metricValue : s.metricValueGreen}>{pct(withdrawalRate, 2)}</Text>
        </View>
      </View>

      {bestStrategy && (
        <View style={s.callout}>
          <Text style={[s.calloutText, { fontWeight: 'bold', marginBottom: 4 }]}>Key Finding</Text>
          <Text style={s.calloutText}>
            The {bestStrategy.label} strategy supports the highest safe withdrawal rate of {pct(bestStrategy.maxSafeRate, 2)} ({fmt(bestStrategy.maxSafeAnnual)}/year)
            at 95% confidence. {fixedStrategy && fixedStrategy.maxSafeRate != null && `For comparison, the traditional fixed-dollar approach supports ${pct(fixedStrategy.maxSafeRate, 2)}.`}
            {withdrawalRate > (bestStrategy.maxSafeRate || 0)
              ? ` Your current target of ${pct(withdrawalRate, 2)} exceeds even the highest safe rate — consider reducing spending or adjusting your plan.`
              : ` Your current target of ${pct(withdrawalRate, 2)} is within safe bounds.`}
          </Text>
        </View>
      )}

      <Text style={s.subheading}>Account Summary</Text>
      <DataTable
        columns={[
          { label: 'Account', key: 'account', flex: 2, style: 'bold' },
          { label: 'Balance', key: 'balance', flex: 1, render: r => fmt(r.balance) },
          { label: '% of Portfolio', key: 'pct', flex: 1, render: r => totalPortfolio > 0 ? pct(r.balance / totalPortfolio) : '—' },
        ]}
        rows={[
          { account: 'Traditional 401(k)', balance: profile.accounts.trad401k },
          { account: 'Traditional IRA', balance: profile.accounts.tradIRA },
          { account: 'Roth 401(k)', balance: profile.accounts.roth401k },
          { account: 'Roth IRA', balance: profile.accounts.rothIRA },
          { account: 'HSA', balance: profile.accounts.hsa },
          { account: 'Taxable Brokerage', balance: profile.accounts.taxable },
        ].filter(r => r.balance > 0)}
      />

      <Text style={s.subheading}>Income Sources in Retirement</Text>
      <DataTable
        columns={[
          { label: 'Source', key: 'source', flex: 2, style: 'bold' },
          { label: 'Annual Amount', key: 'amount', flex: 1, render: r => fmt(r.amount) },
        ]}
        rows={[
          profile.ss1 > 0 && { source: 'Social Security (Spouse 1)', amount: profile.ss1 * 12 },
          profile.ss2 > 0 && { source: 'Social Security (Spouse 2)', amount: profile.ss2 * 12 },
          (profile.pension1?.annualAmount || 0) > 0 && { source: 'Pension', amount: profile.pension1.annualAmount },
        ].filter(Boolean)}
      />
    </Page>
  );
}

function SurvivalAnalysisPage({ data }) {
  const { survivalAnalysis, spending, projectedPortfolio, retYears } = data;
  if (!survivalAnalysis) return null;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const strategies = survivalAnalysis.strategies || [];
  const tunable = strategies.filter(st => st.maxSafeRate != null).sort((a, b) => b.maxSafeRate - a.maxSafeRate);

  return (
    <Page size="LETTER" style={s.page}>
      <PageFooter date={date} />
      <Text style={s.sectionTitle}>Withdrawal Strategy Analysis</Text>
      <View style={s.sectionBar} />

      <Text style={s.paragraph}>
        Seven withdrawal strategies were evaluated across {survivalAnalysis.numSims.toLocaleString()} simulated
        market scenarios for a {retYears}-year retirement. The table below shows the maximum initial spending
        level at which each strategy achieves 95% portfolio survival.
      </Text>

      <Text style={s.subheading}>Maximum Safe Spending by Strategy</Text>
      <Text style={s.note}>95% confidence — the highest spending where at least 95% of simulations survive the full retirement.</Text>
      <DataTable
        columns={[
          { label: 'Strategy', key: 'label', flex: 3, style: 'bold' },
          { label: 'Safe Rate', flex: 1, render: r => pct(r.maxSafeRate, 2), style: (r) => r === tunable[0] ? s.tableCellGreen : s.tableCell },
          { label: 'Annual Amount', flex: 1.5, render: r => fmt(r.maxSafeAnnual), style: (r) => r === tunable[0] ? s.tableCellGreen : s.tableCell },
          { label: 'Monthly Amount', flex: 1.5, render: r => fmt(r.maxSafeAnnual / 12) },
        ]}
        rows={tunable}
      />

      <Text style={s.subheading}>Performance at Current Spending ({fmt(spending)}/yr)</Text>
      <Text style={s.note}>How each strategy performs when withdrawing your target spending amount.</Text>
      <DataTable
        columns={[
          { label: 'Strategy', key: 'label', flex: 3, style: 'bold' },
          { label: 'Survival Rate', flex: 1.2, render: r => r.neverDepletes ? '100%' : pct(r.successRate),
            style: r => r.successRate >= 0.95 || r.neverDepletes ? s.tableCellGreen : r.successRate >= 0.80 ? s.tableCell : s.tableCellRed },
          { label: 'Worst-Case Floor', flex: 1.5, render: r => fmt(r.p10MinWithdrawal),
            style: r => r.p10MinWithdrawal < spending * 0.5 ? s.tableCellRed : s.tableCell },
          { label: 'Median Lifetime Total', flex: 1.5, render: r => fmt(r.medianTotalSpending) },
        ]}
        rows={strategies}
      />

      {survivalAnalysis.swrCurve && (
        <>
          <Text style={s.subheading}>Fixed-Dollar Success Rate Curve</Text>
          <Text style={s.note}>Shows how survival probability changes as the initial withdrawal rate increases.</Text>
          <DataTable
            columns={[
              { label: 'Withdrawal Rate', flex: 1, render: r => pct(r.rate), style: 'bold' },
              { label: 'Annual Amount', flex: 1, render: r => fmt(projectedPortfolio * r.rate) },
              { label: 'Survival Probability', flex: 1, render: r => pct(r.successPct),
                style: r => r.successPct >= 0.95 ? s.tableCellGreen : r.successPct >= 0.80 ? s.tableCell : s.tableCellRed },
            ]}
            rows={survivalAnalysis.swrCurve.testedRates}
          />
        </>
      )}
    </Page>
  );
}

function WithdrawalPhasesPage({ data }) {
  const { ages, profile, rmdData, rothLadderData, taxData } = data;
  if (!ages) return null;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const birthYear = new Date().getFullYear() - ages.current;
  const rmdAge = birthYear >= 1960 ? 75 : 73;

  return (
    <Page size="LETTER" style={s.page}>
      <PageFooter date={date} />
      <Text style={s.sectionTitle}>Retirement Income & Tax Planning</Text>
      <View style={s.sectionBar} />

      <Text style={s.paragraph}>
        Your retirement spans multiple tax and income phases. The withdrawal sequence below is optimized
        for tax efficiency, penalty avoidance, and maximum wealth preservation.
      </Text>

      {ages.retirement < 60 && (
        <View style={s.phaseCard}>
          <Text style={s.phaseTitle}>Phase 1: Early Retirement (Age {ages.retirement} – 59)</Text>
          <Text style={s.phaseRange}>Pre-penalty-free access to retirement accounts</Text>
          <Text style={s.phaseStep}>Draw from taxable brokerage accounts</Text>
          <Text style={s.phaseStep}>Use Roth IRA contributions (not earnings) penalty-free</Text>
          <Text style={s.phaseStep}>Aggressively convert Traditional to Roth while income is low</Text>
        </View>
      )}
      <View style={s.phaseCard}>
        <Text style={s.phaseTitle}>Phase {ages.retirement < 60 ? '2' : '1'}: Pre-Social Security (Age {Math.max(ages.retirement, 60)} – 66)</Text>
        <Text style={s.phaseRange}>Penalty-free withdrawals, prime Roth conversion window</Text>
        <Text style={s.phaseStep}>Begin Traditional IRA/401(k) withdrawals</Text>
        <Text style={s.phaseStep}>Fill low tax brackets with Roth conversions</Text>
        <Text style={s.phaseStep}>Consider delaying Social Security for higher benefit</Text>
      </View>
      <View style={s.phaseCard}>
        <Text style={s.phaseTitle}>RMD Phase (Age {rmdAge}+)</Text>
        <Text style={s.phaseRange}>Required Minimum Distributions from Traditional accounts</Text>
        <Text style={s.phaseStep}>RMDs are taxable ordinary income</Text>
        <Text style={s.phaseStep}>Use Roth for additional tax-free spending</Text>
        <Text style={s.phaseStep}>Consider QCDs to offset RMD tax impact</Text>
      </View>

      {taxData && (
        <>
          <Text style={s.subheading}>Tax Bracket Analysis</Text>
          <View style={s.metricsRow}>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Est. Retirement Income</Text>
              <Text style={s.metricValue}>{fmt(taxData.retirementIncome)}</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Marginal Bracket</Text>
              <Text style={s.metricValue}>{pct(taxData.marginalInfo.marginalRate, 0)}</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Effective Rate</Text>
              <Text style={s.metricValue}>{pct(taxData.taxResult.effectiveRate)}</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Federal Tax</Text>
              <Text style={s.metricValue}>{fmt(taxData.taxResult.tax)}</Text>
            </View>
          </View>
          {taxData.conversionSpace != null && (
            <View style={s.callout}>
              <Text style={s.calloutText}>
                Roth Conversion Opportunity: You have {fmt(taxData.conversionSpace)} of space remaining in your current
                tax bracket for Roth conversions before triggering a higher marginal rate.
              </Text>
            </View>
          )}
        </>
      )}

      {rothLadderData && (
        <>
          <Text style={s.subheading}>Roth Conversion Strategy</Text>
          <View style={s.metricsRow}>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Optimal Annual Conversion</Text>
              <Text style={s.metricValueGreen}>{fmt(rothLadderData.conversionInfo.optimalConversion)}</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Tax on Conversion</Text>
              <Text style={s.metricValue}>{fmt(rothLadderData.conversionInfo.taxOnConversion)}</Text>
            </View>
            <View style={s.metricCard}>
              <Text style={s.metricLabel}>Marginal Rate</Text>
              <Text style={s.metricValue}>{pct(rothLadderData.conversionInfo.currentMarginalRate, 0)}</Text>
            </View>
          </View>
        </>
      )}
    </Page>
  );
}

function RmdPage({ data }) {
  const { rmdData } = data;
  if (!rmdData || rmdData.length === 0) return null;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Page size="LETTER" style={s.page}>
      <PageFooter date={date} />
      <Text style={s.sectionTitle}>Required Minimum Distribution Schedule</Text>
      <View style={s.sectionBar} />

      <Text style={s.paragraph}>
        Projected RMDs based on your Traditional account balances and expected portfolio growth. RMDs are
        mandatory withdrawals that begin at age {rmdData[0]?.age || 73} and increase as a percentage of
        your account balance each year.
      </Text>

      <DataTable
        columns={[
          { label: 'Age', key: 'age', flex: 0.7, style: 'bold' },
          { label: 'Account Balance', flex: 1.5, render: r => fmt(r.balance) },
          { label: 'RMD Amount', flex: 1.2, render: r => fmt(r.rmdAmount), style: () => s.tableCellBold },
          { label: '% of Balance', flex: 1, render: r => pct(r.pctOfBalance, 2) },
        ]}
        rows={rmdData.filter((_, i) => i % 2 === 0 || rmdData.length <= 20)}
      />
      {rmdData.length > 20 && (
        <Text style={s.note}>Showing every other year for brevity. Full schedule available in Excel export.</Text>
      )}
    </Page>
  );
}

function SocialSecurityPage({ data }) {
  const { ssData } = data;
  if (!ssData || (!ssData.spouse1 && !ssData.spouse2)) return null;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Page size="LETTER" style={s.page}>
      <PageFooter date={date} />
      <Text style={s.sectionTitle}>Social Security Optimization</Text>
      <View style={s.sectionBar} />

      <Text style={s.paragraph}>
        Claiming age significantly impacts lifetime Social Security benefits. Delaying from 62 to 70
        increases monthly benefits by approximately 77%, but requires funding retirement from other
        sources during the gap years.
      </Text>

      {[{ label: 'Spouse 1', d: ssData.spouse1 }, { label: 'Spouse 2', d: ssData.spouse2 }]
        .filter(sp => sp.d)
        .map(({ label, d }) => (
          <View key={label}>
            <Text style={s.subheading}>{label} — Optimal Claiming Age: {d.optimalAge}</Text>
            <DataTable
              columns={[
                { label: 'Claiming Age', flex: 1, render: r => String(r.claimingAge),
                  style: r => r.claimingAge === d.optimalAge ? s.tableCellGreen : s.tableCellBold },
                { label: 'Monthly Benefit', flex: 1, render: r => fmt(r.monthlyBenefit) },
                { label: 'Lifetime Total', flex: 1.5, render: r => fmt(r.nominalLifetimeTotal),
                  style: r => r.claimingAge === d.optimalAge ? s.tableCellGreen : s.tableCell },
              ]}
              rows={d.scenarios}
            />
          </View>
        ))}

      {ssData.breakEven62v67 && (
        <View style={s.callout}>
          <Text style={s.calloutText}>
            Break-Even: Delaying from 62 to 67 pays off at age {ssData.breakEven62v67.breakEvenAge || 'N/A'}.
            {ssData.breakEven67v70 && ` Delaying from 67 to 70 pays off at age ${ssData.breakEven67v70.breakEvenAge || 'N/A'}.`}
          </Text>
        </View>
      )}
    </Page>
  );
}

function DisclaimerPage() {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <Page size="LETTER" style={s.page}>
      <PageFooter date={date} />
      <Text style={s.sectionTitle}>Methodology & Disclaimers</Text>
      <View style={s.sectionBar} />

      <Text style={s.subheading}>Monte Carlo Simulation Model</Text>
      <Text style={s.paragraph}>
        Portfolio returns are modeled using a correlated multi-asset framework with log-normal return distributions.
        Equities use a 9% real arithmetic mean with 18% annualized volatility. Bonds use a 2.5% real mean with
        7% volatility. Stock-bond correlation is set to -0.2, implemented via Cholesky decomposition.
      </Text>
      <Text style={s.paragraph}>
        The model incorporates bull/bear market regime switching (4-7 year bulls, 1-2 year bears) and
        mean-reverting stochastic inflation via an Ornstein-Uhlenbeck process (3% mean, 4% volatility).
        A consecutive crash dampener prevents unrealistic multi-year cascading drawdowns.
      </Text>

      <Text style={s.subheading}>Withdrawal Strategies</Text>
      <Text style={s.paragraph}>
        Fixed Dollar: Constant inflation-adjusted withdrawals. Percent of Portfolio: Fixed percentage of current balance.
        Guyton-Klinger: Guardrails that cut spending in downturns and raise it in strong markets.
        Bucket: Short/medium/long-term buckets with periodic rebalancing. VPW: Annuity-style variable
        percentage based on remaining life expectancy. RMD-Based: Follows IRS RMD divisor tables.
        Vanguard Dynamic: Target rate with ceiling (+5%) and floor (-2.5%) adjustments.
      </Text>

      <Text style={s.subheading}>Safe Withdrawal Rate</Text>
      <Text style={s.paragraph}>
        The "safe rate" for each strategy is determined via binary search across the simulation paths:
        the highest initial spending level where at least 95% of simulations maintain a positive portfolio
        balance through the full retirement horizon. For percent-of-portfolio strategies, a spending-floor
        test is used (withdrawals must stay above 50% of initial).
      </Text>

      <Text style={s.subheading}>Important Disclaimers</Text>
      <Text style={s.paragraph}>
        This report is generated by Ultronic Terminal for informational and educational purposes only.
        It does not constitute investment advice, tax advice, or a recommendation to buy or sell any
        securities. All projections are based on historical assumptions and simulated scenarios that may
        not reflect future market conditions. Past performance does not guarantee future results.
      </Text>
      <Text style={s.paragraph}>
        Tax calculations are estimates based on current federal tax law and may not reflect state taxes,
        AMT, NIIT, or recent legislative changes. Social Security projections use current benefit formulas
        which may be modified by future legislation. Consult a qualified financial advisor, tax professional,
        and/or estate planning attorney before making financial decisions.
      </Text>
    </Page>
  );
}

export function FinancialPlanPDF({ data }) {
  return (
    <Document
      title="Financial Plan — Ultronic Terminal"
      author="Ultronic Terminal"
      subject="Comprehensive Retirement Analysis"
    >
      <CoverPage data={data} />
      <ExecutiveSummary data={data} />
      <SurvivalAnalysisPage data={data} />
      <WithdrawalPhasesPage data={data} />
      {data.rmdData && data.rmdData.length > 0 && <RmdPage data={data} />}
      {data.ssData && (data.ssData.spouse1 || data.ssData.spouse2) && <SocialSecurityPage data={data} />}
      <DisclaimerPage />
    </Document>
  );
}
