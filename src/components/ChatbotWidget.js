import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RESPONSES = {
  // ── GENERAL / GETTING STARTED ──────────────────────────────────────
  overview: {
    patterns: ['what does this tool do', 'purpose', 'overview', 'what is ultronic', 'what is this app', 'about'],
    reply: "Ultronic Terminal is a financial analysis platform with two modules:\n\n1. Financial Planning — Monte Carlo simulation, retirement accumulation, spend-down withdrawal strategies, tax optimization, Roth conversion, Social Security analysis, and exportable reports.\n\n2. Real Estate — Compare fix & flip, long-term rental, and short-term rental strategies with sensitivity analysis and MODA scoring.\n\nEverything auto-saves to your browser session, and if you sign in, it syncs to the cloud.",
  },
  gettingStarted: {
    patterns: ['how to start', 'getting started', 'begin', 'where do i start', 'first step'],
    reply: "For Financial Planning: Start at Profile to enter your ages, accounts, income, and savings. Then go to Accumulate to run a Monte Carlo simulation, then Spend-Down to analyze withdrawal strategies. The sidebar guides you through each step.\n\nFor Real Estate: Go to Real Estate, fill in the property details (price, condition, location, financing), and hit Calculate. The results page compares all three strategies automatically.",
  },
  saving: {
    patterns: ['save', 'cloud', 'sync', 'data persist', 'lose my data', 'session'],
    reply: "Your data auto-saves to your browser session — it persists across page navigation but not if you clear browser data. If you sign in (Google or email), your financial profile and simulation config sync to the cloud automatically. Spend-down analysis results are cached in memory during your session but aren't persisted due to their size — just re-run the analysis if you refresh.",
  },
  signIn: {
    patterns: ['sign in', 'log in', 'account', 'google', 'auth', 'register'],
    reply: "Click 'Sign In' in the top nav bar. You can use Google OAuth or create an account with email and password. Once signed in, your financial profile syncs to the cloud so it's available on any device. Your real estate analyses are browser-only for now.",
  },
  export: {
    patterns: ['export', 'download', 'excel', 'csv', 'pdf', 'report'],
    reply: "Go to Financial Planning > Reports. Once you've run both the Monte Carlo simulation and Spend-Down analysis, you can export:\n\n- Excel (.xlsx) — multi-sheet workbook with all data\n- CSV — flat file for spreadsheet import\n- PDF — formatted report with key metrics\n\nThe Reports page shows which data sources are available and previews safe withdrawal rates before you export.",
  },

  // ── FINANCIAL PLANNING: PROFILE ────────────────────────────────────
  profile: {
    patterns: ['profile', 'financial profile', 'accounts', 'spouse', 'filing status'],
    reply: "The Profile section captures your complete financial picture:\n\n- Filing status (single, married filing jointly, etc.)\n- Both spouses' ages and retirement ages\n- Account balances: Traditional 401k, Roth 401k, Traditional IRA, Roth IRA, HSA, Taxable\n- Annual income, spending, and savings\n- Employer match details\n- Social Security estimates (monthly at full retirement age)\n- Pension details (start age and annual amount)\n\nAll of this flows into the Monte Carlo simulation, spend-down analysis, and retirement planner automatically.",
  },

  // ── MONTE CARLO SIMULATION ─────────────────────────────────────────
  monteCarlo: {
    patterns: ['monte carlo', 'simulation', 'accumulate', 'investment projection'],
    reply: "The Monte Carlo simulator runs thousands of randomized market scenarios to project your portfolio growth from now until retirement.\n\nKey inputs: initial investment, annual contribution, savings growth rate, time horizon, risk profile, inflation rate, and number of simulations.\n\nIt uses a correlated multi-asset model with bull/bear regime switching, Cholesky decomposition for stock-bond correlation, and stochastic inflation. Returns are real (inflation-adjusted). The output shows percentile fan charts (5th through 95th), median final value, and CAGR.",
  },
  riskProfile: {
    patterns: ['risk profile', 'conservative', 'balanced', 'growth', 'aggressive', 'allocation'],
    reply: "Risk profiles control the stock/bond allocation:\n\n- Conservative: 30% stocks / 70% bonds — ~4.5% expected real return\n- Balanced: 60% stocks / 40% bonds — ~6.5% expected real return\n- Growth: 80% stocks / 20% bonds — ~7.5% expected real return\n- Aggressive: 95% stocks / 5% bonds — ~8.5% expected real return\n\nHigher stock allocation means higher expected returns but more volatility. The simulation models realistic drawdowns — aggressive portfolios can drop 50%+ in bad years.",
  },
  realReturns: {
    patterns: ['real return', 'inflation adjusted', 'nominal', 'inflation rate', 'why low'],
    reply: "All returns in the Monte Carlo simulation are REAL (above inflation). So a 7% CAGR means 7% purchasing-power growth, equivalent to roughly 10% nominal with 3% inflation.\n\nIf the numbers seem lower than you expected, that's probably because you're comparing to nominal returns you've seen elsewhere. A 7% real return is excellent — it means your money's buying power doubles roughly every 10 years.",
  },
  timeHorizon: {
    patterns: ['time horizon', 'years to retirement', 'how many years'],
    reply: "Time horizon auto-syncs from your profile: retirement age minus current age. You can override it in the simulator. This controls how many years the Monte Carlo simulation runs. Longer horizons mean more compounding but also more exposure to market cycles.",
  },
  savingsGrowth: {
    patterns: ['savings growth', 'contribution growth', 'annual contribution'],
    reply: "The savings growth rate increases your annual contribution each year to model career progression, raises, and lifestyle optimization. For example, 3% savings growth means if you save $50,000 this year, you'll save $51,500 next year. This compounds over your working years and can significantly boost your final portfolio.",
  },

  // ── SPEND-DOWN ANALYSIS ────────────────────────────────────────────
  spendDown: {
    patterns: ['spend down', 'spend-down', 'withdrawal', 'retirement spending', 'decumulation'],
    reply: "Spend-down analysis answers: 'How much can I safely withdraw in retirement without running out of money?'\n\nIt runs 1,000 Monte Carlo return paths and tests 7 withdrawal strategies at increasing withdrawal rates. For each strategy, it finds the maximum safe withdrawal rate at 95% success (meaning your portfolio survived in 950 out of 1,000 simulations).\n\nIt also factors in Social Security, pensions, RMDs, Roth conversions, and tax brackets.",
  },
  strategies: {
    patterns: ['withdrawal strategies', 'seven strategies', '7 strategies', 'which strategy'],
    reply: "The 7 withdrawal strategies tested:\n\n1. Fixed Dollar — constant inflation-adjusted amount\n2. Percent of Portfolio — fixed % of current balance each year\n3. Guyton-Klinger — adjusts based on portfolio performance (guardrails)\n4. Bucket — splits portfolio into short/medium/long-term buckets\n5. VPW (Variable Percentage Withdrawal) — actuarial-based, adjusts with age\n6. RMD-Based — follows IRS Required Minimum Distribution tables\n7. Vanguard Dynamic — floor/ceiling rules around a target percentage\n\nEach handles market volatility differently. The analysis shows which lets you spend the most while keeping a 95% success rate.",
  },
  safeWithdrawal: {
    patterns: ['safe withdrawal', 'swr', '4% rule', 'four percent', 'how much can i withdraw'],
    reply: "The 4% rule is a starting point, but the real safe rate depends on your time horizon, asset allocation, and income sources.\n\nOur analysis tests each strategy across 1,000 market scenarios to find YOUR safe rate at 95% confidence. With Social Security and pensions factored in, your safe portfolio withdrawal rate is often higher than 4% because you only need to bridge the gap until those income sources start.",
  },
  incomeBridge: {
    patterns: ['income bridge', 'bridge', 'social security gap', 'pension gap', 'early retirement'],
    reply: "The income bridge is key for early retirees. If you retire at 55 but Social Security starts at 67, you need to fund 12 years entirely from your portfolio. But once SS and pensions kick in, your portfolio withdrawal drops dramatically.\n\nThe spend-down analysis builds a year-by-year income schedule from your SS claiming age and pension start ages. Strategies like Fixed Dollar subtract this income from the portfolio draw — so you might safely withdraw 5-6% in early years, dropping to 2-3% once SS starts.",
  },

  // ── RMD / ROTH / SS / TAX ─────────────────────────────────────────
  rmd: {
    patterns: ['rmd', 'required minimum', 'distribution'],
    reply: "Required Minimum Distributions (RMDs) start at age 73 for traditional retirement accounts. The IRS calculates them by dividing your account balance by a life expectancy factor.\n\nThe spend-down page shows projected RMDs by year so you can plan for the tax hit. If your RMDs will push you into a higher bracket, consider Roth conversions before 73 to reduce future mandatory withdrawals.",
  },
  roth: {
    patterns: ['roth', 'conversion', 'roth ladder', 'roth conversion'],
    reply: "Roth conversion means moving money from traditional (pre-tax) accounts to Roth (post-tax) accounts, paying income tax now to avoid it later.\n\nThe analysis shows an optimal conversion strategy that fills up lower tax brackets each year before RMDs start. A 'Roth ladder' converts a set amount annually during early retirement when your income is low, creating tax-free growth and withdrawals later. The key window is between retirement and age 73.",
  },
  socialSecurity: {
    patterns: ['social security', 'ss', 'claiming age', 'when to claim', 'full retirement'],
    reply: "Social Security benefits depend on when you claim:\n\n- Age 62: earliest, but permanently reduced (~30% less)\n- Full Retirement Age (66-67): full benefit\n- Age 70: maximum benefit (~24% more than FRA)\n\nThe analysis shows break-even ages — when the higher monthly payment from delaying overtakes the total from claiming early. For most people with average life expectancy, delaying to 67-70 pays off. The spend-down analysis uses your claimed benefit to reduce portfolio withdrawals.",
  },
  tax: {
    patterns: ['tax', 'tax bracket', 'marginal rate', 'federal tax', 'irmaa'],
    reply: "The tax analysis shows your projected federal tax bracket in retirement based on your withdrawal sources:\n\n- Traditional account withdrawals are ordinary income\n- Roth withdrawals are tax-free\n- Social Security is 0-85% taxable depending on total income\n- Taxable account withdrawals may trigger capital gains\n\nIt also flags IRMAA surcharges — if your income exceeds certain thresholds, Medicare premiums increase. Strategic Roth conversions can minimize lifetime taxes.",
  },

  // ── ADVANCED RETIREMENT ────────────────────────────────────────────
  heatmap: {
    patterns: ['heatmap', 'heat map', 'retirement age', 'when to retire', 'advanced retirement'],
    reply: "The heatmap shows portfolio survival probability for every combination of retirement age and withdrawal rate. Green = high survival, red = likely depletion.\n\nIt accounts for continued savings until retirement, drawdown phases you define, and both spouses' retirement ages. The key insight: each year you work longer adds savings AND reduces the number of retirement years to fund — a double benefit that the heatmap makes visual.",
  },
  drawdownPhases: {
    patterns: ['drawdown', 'phases', 'spending phases'],
    reply: "Drawdown phases let you model changing spending patterns in retirement. For example:\n\n- Phase 1 (ages 65-75): Active retirement, $100k/year travel and activities\n- Phase 2 (ages 75-85): Slower pace, $70k/year\n- Phase 3 (ages 85+): Minimal spending, $50k/year\n\nIf no phases cover a particular year, the model uses your base annual spending from your profile. Phases appear in the heatmap and projection charts.",
  },

  // ── REAL ESTATE ────────────────────────────────────────────────────
  realEstateOverview: {
    patterns: ['real estate', 'property', 'investment property'],
    reply: "The Real Estate module analyzes a property across three strategies: Fix & Flip, Long-Term Rental (LTR), and Short-Term Rental (STR).\n\nEnter property details (price, condition, location, size, financing) and it calculates ROI, cash flow, 5-year projections, and deal quality for each. The MODA analysis weights your priorities (ROI, cash flow, risk, workload) to recommend the best strategy for you.",
  },
  flip: {
    patterns: ['fix and flip', 'fix & flip', 'flipping', 'flip strategy'],
    reply: "Fix & Flip: buy, renovate, sell for profit. The tool calculates your total investment (down payment + closing costs + renovation + holding costs) versus net profit after selling costs.\n\nROI is compound-annualized based on holding period. The 70% rule: never pay more than 70% of the after-repair value minus renovation costs. Target 20%+ ROI and aim to complete within 6 months — every extra month adds holding costs.",
  },
  ltr: {
    patterns: ['long term rental', 'ltr', 'buy and hold', 'landlord', 'tenant'],
    reply: "Long-Term Rental: buy, fix up, rent with year-long leases. The tool projects 5 years of cash flow with rent increases (2.5%/yr), expense inflation, plus property appreciation (default 3%) and mortgage principal paydown.\n\nTarget $200+/month positive cash flow. The 1% rule (monthly rent = 1% of purchase price) is a good screening benchmark. ROI includes all three profit sources: income, appreciation, and equity building.",
  },
  str: {
    patterns: ['short term rental', 'str', 'airbnb', 'vrbo', 'vacation rental'],
    reply: "Short-Term Rental: the Airbnb route. Higher income potential but significantly more expenses — cleaning ($100+/turnover), higher insurance (1.5x), utilities, supplies, and 20% management fees.\n\nThe tool estimates nightly rates by location and property size. Default occupancy is 65%. Check local laws first — many cities restrict or ban STRs. Budget for 30-40% occupancy in off-seasons. Expenses typically eat 50-60% of revenue.",
  },
  roiCalculation: {
    patterns: ['roi', 'return on investment', 'how is roi calculated', 'annualized'],
    reply: "ROI uses compound annualization:\n\nFlip: (1 + totalROI)^(12/months) - 1 — properly accounts for holding period.\n\nRentals: (1 + 5yearTotalROI)^(1/5) - 1 — total return includes cash flow, appreciation, and principal paydown minus selling costs.\n\nTotal investment includes down payment, closing costs, renovation, and holding costs. This gives an apples-to-apples comparison across strategies with different time horizons.",
  },
  cashFlow: {
    patterns: ['cash flow', 'monthly income', 'expenses'],
    reply: "Cash flow = income minus all expenses per month.\n\nLTR expenses: mortgage, property tax (1.2%), insurance (0.5%), maintenance (0.5% of purchase price), property management (8-10%), vacancy reserve (5-8%), and CapEx reserve.\n\nSTR adds: cleaning/turnover costs, higher utilities, higher insurance, management (20%), and supplies. The 5-year projection models rent increases and expense inflation so you can see if cash flow improves or deteriorates over time.",
  },
  sensitivity: {
    patterns: ['sensitivity', 'sliders', 'what if', 'stress test'],
    reply: "The sensitivity sliders let you stress-test scenarios in real time: what if renovation costs 30% more? What if rent drops? What if occupancy is only 50%?\n\nGood deals should still work even in bad scenarios. If your analysis only works with perfect assumptions, it probably won't work in real life. Test the downside before you commit.",
  },
  moda: {
    patterns: ['moda', 'weights', 'priorities', 'scoring', 'multi-objective'],
    reply: "MODA (Multi-Objective Decision Analysis) scores each strategy 0-10 on four factors:\n\n- ROI: financial performance\n- Cash Flow: monthly income generation\n- Risk: lower score = higher risk (STR is riskiest due to regulations and seasonality)\n- Workload: lower score = more work (flips need active project management, STR needs daily guest management, LTR is most passive)\n\nAdjust the weight sliders to match YOUR priorities. The highest weighted score wins.",
  },
  dealQuality: {
    patterns: ['deal quality', 'excellent deal', 'good deal', 'grading'],
    reply: "Deals are graded on three metrics:\n\n- Excellent: ROI >= 30%, ARV >= 1.3x purchase, renovation <= 20% of ARV\n- Good: ROI >= 20%, ARV >= 1.2x purchase, renovation <= 25% of ARV\n- Fair: ROI >= 10%, ARV >= 1.1x purchase, renovation <= 30% of ARV\n- Poor: below Fair thresholds\n\nStick to Good or better. Poor deals rarely work out unless you have an edge the numbers don't capture.",
  },
  closingCosts: {
    patterns: ['closing cost', 'closing costs'],
    reply: "Closing costs (buyer-side, typically 2-5% of purchase price) are factored into the total investment for all strategies. They include title insurance, appraisal, inspection, attorney fees, and lender fees. Selling costs (6% default) cover realtor commissions and seller-side closing when you exit.",
  },

  // ── TROUBLESHOOTING / FAQ ──────────────────────────────────────────
  notWorking: {
    patterns: ['not working', 'error', 'problem', 'bug', 'broken', 'crash'],
    reply: "Common issues:\n\n1. Spend-down shows no results — you need to click 'Run Analysis' after setting up your profile. Results don't persist across page refresh.\n2. Monte Carlo shows old data — run the simulation again after changing inputs.\n3. Reports page says data unavailable — run both Monte Carlo and Spend-Down analyses first.\n4. Numbers look wrong — check that your profile has realistic values (ages, account balances, spending).\n5. Sign-in not working — make sure you're on the production site with proper configuration.\n\nTry refreshing the page if things seem stuck.",
  },
  numbersWrong: {
    patterns: ['numbers seem wrong', 'too low', 'too high', 'unrealistic', 'doesn\'t match'],
    reply: "Common reasons numbers might surprise you:\n\n- Monte Carlo returns are REAL (inflation-adjusted), so 7% here equals ~10% nominal\n- Spend-down withdrawal rates factor in Social Security and pensions — higher rates are safe if you have income sources starting later\n- Real estate ROI now uses compound annualization, which is lower than the old linear formula for short holds\n- STR now includes cleaning costs (~$8k/year) that weren't previously factored in\n- Closing costs are now included in total investment, which slightly lowers ROI",
  },
  spendDownEmpty: {
    patterns: ['spend down empty', 'no results', 'run analysis', 'nothing showing'],
    reply: "The spend-down page requires you to click 'Run Analysis' to generate results. It runs 1,000 Monte Carlo simulations which takes a few seconds. Results are cached while you navigate between sections but are lost on page refresh. The Reports page needs spend-down data too — run the analysis first, then go to Reports.",
  },
};

function getResponse(userMessage) {
  const message = userMessage.toLowerCase();

  for (const entry of Object.values(RESPONSES)) {
    if (entry.patterns.some(p => message.includes(p))) {
      return entry.reply;
    }
  }

  if (message.includes('help') || message.includes('what can you')) {
    return "I can help with:\n\nFinancial Planning — Monte Carlo simulation, risk profiles, withdrawal strategies, safe withdrawal rates, income bridge, RMDs, Roth conversions, Social Security, tax brackets, heatmap, drawdown phases, reports/export.\n\nReal Estate — fix & flip, long-term rental, short-term rental, ROI calculations, cash flow, sensitivity analysis, MODA scoring, deal quality, closing costs.\n\nGeneral — saving/syncing data, signing in, exporting reports, troubleshooting.\n\nJust ask about any topic!";
  }

  return "I can help with both the Financial Planning tools (Monte Carlo, spend-down, retirement, tax optimization) and Real Estate analysis (flip, rental, STR strategies). Try asking about a specific topic like 'safe withdrawal rate', 'Monte Carlo simulation', 'fix & flip', or 'how to get started'.";
}

const QUICK_QUESTIONS_FINANCIAL = [
  "How does Monte Carlo work?",
  "What are the withdrawal strategies?",
  "What's the income bridge?",
  "When should I do Roth conversions?",
  "How do I export reports?",
];

const QUICK_QUESTIONS_REALESTATE = [
  "How is ROI calculated?",
  "Explain Fix & Flip",
  "What is MODA analysis?",
  "What makes a good deal?",
  "How does sensitivity analysis work?",
];

const QUICK_QUESTIONS_GENERAL = [
  "What does this tool do?",
  "How do I get started?",
  "How is my data saved?",
];

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const isFinancialPlanning = location.pathname.startsWith('/financial-planning');
  const isRealEstate = location.pathname.startsWith('/real-estate') || location.pathname.startsWith('/results');

  useEffect(() => {
    setMessages([{
      type: 'bot',
      message: isFinancialPlanning
        ? "Need help with financial planning? Ask me about Monte Carlo simulation, withdrawal strategies, Roth conversions, Social Security, tax optimization, or anything else."
        : isRealEstate
        ? "Need help with your real estate analysis? Ask me about flip ROI, rental cash flow, STR analysis, MODA scoring, or anything else."
        : "Welcome to Ultronic Terminal. I can help with Financial Planning (Monte Carlo, retirement, withdrawals) or Real Estate analysis (flip, rental, STR). What would you like to know?",
      timestamp: new Date(),
    }]);
  }, [isFinancialPlanning, isRealEstate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickQuestions = isFinancialPlanning
    ? QUICK_QUESTIONS_FINANCIAL
    : isRealEstate
    ? QUICK_QUESTIONS_REALESTATE
    : QUICK_QUESTIONS_GENERAL;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { type: 'user', message: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    const reply = getResponse(inputValue);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', message: reply, timestamp: new Date() }]);
    }, 300);

    setInputValue('');
  };

  const handleQuickQuestion = (question) => {
    const userMsg = { type: 'user', message: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const reply = getResponse(question);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', message: reply, timestamp: new Date() }]);
    }, 300);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-surface-elevated border border-terminal-dark-green hover:border-terminal-green text-terminal-green rounded-full p-3 transition-all duration-200 hover:shadow-glow-green-sm group"
          aria-label="Toggle help assistant"
        >
          {isOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 group-hover:drop-shadow-[0_0_6px_var(--terminal-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-[420px] h-[460px] terminal-card p-0 z-50 flex flex-col overflow-hidden">
          <div className="bg-surface-elevated px-4 py-3 border-b border-surface-border flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-display font-bold text-terminal-green uppercase tracking-wider text-sm crt-glow">
                Help Assistant
              </h3>
              <p className="text-txt-muted font-mono text-[10px] mt-0.5">
                {isFinancialPlanning ? 'Financial Planning' : isRealEstate ? 'Real Estate Analysis' : 'Ultronic Terminal'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-txt-muted hover:text-terminal-green transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 terminal-scrollbar">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg font-mono text-xs leading-relaxed whitespace-pre-line ${
                  msg.type === 'user'
                    ? 'bg-terminal-dark-green/30 border border-terminal-dark-green text-terminal-green rounded-br-none'
                    : 'bg-surface-elevated border border-surface-border text-txt-primary rounded-bl-none'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex-shrink-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-txt-muted mb-1.5">Quick questions</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-[10px] font-mono bg-surface-elevated border border-surface-border hover:border-terminal-dark-green text-txt-secondary hover:text-terminal-cyan px-2 py-1 rounded transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-3 border-t border-surface-border flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                className="terminal-input flex-1 rounded-lg px-3 py-2 text-xs font-mono"
              />
              <button
                type="submit"
                className="glow-btn glow-btn-green px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
