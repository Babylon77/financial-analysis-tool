# Ultronic Terminal

A professional financial analysis platform with an 80s Wall Street terminal aesthetic. Two integrated modules: **Financial Planning** for retirement accumulation and spend-down analysis, and **Real Estate** for investment property strategy comparison.

**Live site:** [financial-analysis-tool.netlify.app](https://financial-analysis-tool.netlify.app)

---

## Financial Planning Module

A guided, sidebar-based hub at `/financial-planning` with five sections that flow top to bottom.

### 1. Profile

Captures your complete financial picture:
- Filing status, both spouses' ages and target retirement ages, life expectancy
- Account balances across 6 types: Traditional 401(k), Roth 401(k), Traditional IRA, Roth IRA, HSA, and Taxable Brokerage
- Annual income, spending, savings, and savings growth rate
- Employer match details and HSA eligibility
- Social Security monthly benefit at full retirement age (each spouse)
- Pension income (start age and annual amount, each spouse)

All profile data auto-syncs to the Monte Carlo simulator and spend-down analysis.

### 2. Accumulate (Monte Carlo Simulation)

Projects portfolio growth from today to retirement using Monte Carlo simulation.

**Model details:**
- Correlated multi-asset simulation with stocks (9% real arithmetic mean, 18% vol) and bonds (2.5% real mean, 7% vol)
- Bull/bear market regime switching — not a random walk
- Ornstein-Uhlenbeck stochastic inflation (mean-reverting, default 3%)
- Cholesky decomposition for stock-bond correlation (-0.2)
- All returns are **real** (inflation-adjusted) — values shown in today's dollars

**Risk profiles:**
| Profile | Stocks/Bonds | Expected Real Return | Single-Year Range |
|---------|-------------|---------------------|-------------------|
| Conservative | 30/70 | ~4.5% | -22% to +28% |
| Balanced | 60/40 | ~6.5% | -33% to +38% |
| Growth | 80/20 | ~7.5% | -42% to +48% |
| Aggressive | 95/5 | ~8.5% | -50% to +55% |

**Output:** Percentile fan charts (5th through 95th), median CAGR, median final value, drawdown statistics, savings growth chart.

### 3. Spend-Down (Withdrawal Strategies)

Answers: *"How much can I safely withdraw in retirement?"*

Runs 1,000 Monte Carlo return paths and tests **7 withdrawal strategies** at increasing withdrawal rates. For each, finds the maximum safe withdrawal rate at 95% confidence.

**The 7 strategies:**
1. **Fixed Dollar** — constant inflation-adjusted amount each year
2. **Percent of Portfolio** — fixed percentage of current balance
3. **Guyton-Klinger** — guardrails that cut or boost spending based on portfolio performance
4. **Bucket** — splits portfolio into cash (2yr), income (5yr), and growth buckets
5. **VPW (Variable Percentage Withdrawal)** — actuarial formula, adjusts with age and remaining years
6. **RMD-Based** — follows IRS Required Minimum Distribution tables
7. **Vanguard Dynamic** — percentage of portfolio with floor (2.5%) and ceiling (5%)

**Income bridge:** Social Security and pension income reduces portfolio withdrawal needs. If you retire at 55 but SS starts at 67, you only need to bridge 12 years from your portfolio. Safe withdrawal rates are higher when income sources are factored in.

**Additional analysis sections:**
- **RMD projections** — year-by-year Required Minimum Distributions from age 73+
- **Roth conversion ladder** — optimal annual conversions to fill low tax brackets before RMDs start
- **Social Security optimizer** — claiming age analysis (62–70) with break-even calculations
- **Tax bracket analysis** — projected marginal and effective rates, IRMAA Medicare surcharge warnings, Roth conversion space

### 4. Advanced Retirement

- **Heatmap** — portfolio survival for every combination of Spouse 1 and Spouse 2 retirement ages. Green = viable, red = depleted. Shows the double benefit of working longer: more savings AND fewer retirement years.
- **Drawdown phases** — model changing spending patterns (e.g., active travel at 65, slower pace at 75, minimal at 85)
- **Projection chart** — 5-scenario fan (best/optimistic/median/pessimistic/worst) with drawdown phase overlays

### 5. Reports

Export comprehensive reports once you've run both Monte Carlo and Spend-Down analyses:
- **Excel** (.xlsx) — multi-sheet workbook with all data
- **CSV** — flat file for spreadsheet import
- **PDF** — formatted report with key metrics and strategy comparison

---

## Real Estate Module

Compares three investment strategies for any property: Fix & Flip, Long-Term Rental (LTR), and Short-Term Rental (STR).

### Input

Property details: purchase price, location (all 50 states with regional cost adjustments), house size, condition (teardown/poor/fair/good), and financing (down payment, interest rate, loan term). Optional: monthly rent, nightly STR rate, occupancy, management fees.

Renovation costs auto-estimate from condition + size + location + DIY level, or can be entered manually.

### Analysis

**Fix & Flip:**
- Net profit after purchase, renovation, closing costs, holding costs, and selling costs
- Compound-annualized ROI based on holding period
- 70% rule check: never pay more than 70% of ARV minus renovation costs

**Long-Term Rental:**
- Monthly cash flow (rent minus mortgage, taxes, insurance, maintenance, management, vacancy reserve)
- 5-year total return: cash flow + appreciation (default 3%/yr) + mortgage principal paydown - selling costs
- Compound-annualized ROI, cap rate, cash-on-cash return

**Short-Term Rental:**
- Revenue from nightly rate × occupancy with cleaning/turnover costs, higher insurance (1.5×), utilities, management (20%), and supplies
- Same 5-year appreciation and paydown components as LTR

**MODA (Multi-Objective Decision Analysis):**
- Scores each strategy 0-10 on ROI, cash flow, risk, and workload
- User-adjustable priority weights
- Recommends the best strategy for your priorities

**Deal quality grading:**
- Excellent: ROI ≥ 30%, ARV ≥ 1.3× purchase, renovation ≤ 20% of ARV
- Good: ROI ≥ 20%, ARV ≥ 1.2×, renovation ≤ 25%
- Fair: ROI ≥ 10%, ARV ≥ 1.1×, renovation ≤ 30%
- Poor: below Fair thresholds

**Sensitivity analysis:** Real-time sliders for purchase price, renovation cost, ARV, rent, occupancy, and interest rate.

**5-year projections:** Cash flow growth with 2.5% rent increases, 2% tax increases, 4% insurance increases, and 3% maintenance increases.

---

## Authentication & Data Persistence

- **Session storage** — profile, simulation config, and results auto-save to browser session
- **Cloud sync** — sign in with Google OAuth or email/password to sync financial profile to Supabase (5-second debounce)
- **Spend-down cache** — MC paths and survival analysis cached in memory during navigation, lost on page refresh

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 (Create React App) with HashRouter |
| UI | MUI 5 + Tailwind CSS 3 (dark terminal theme) |
| Charts | Recharts (primary), ApexCharts (secondary) |
| Fonts | JetBrains Mono (data), Inter (body), Space Grotesk (display) |
| State | React Context + useReducer |
| Auth | Supabase (Google OAuth + email/password) |
| Export | SheetJS (xlsx), @react-pdf/renderer |
| Hosting | Netlify |

## Development

```bash
npm install        # Install dependencies
npm start          # Dev server on localhost:3000
npm run build      # Production build
npm test           # Run tests
```

Environment variables (`.env.local`):
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Disclaimer

This tool is for educational and planning purposes only. It does not constitute financial, tax, or investment advice. Monte Carlo simulations model probabilities based on historical patterns — actual market conditions may differ significantly. Always consult qualified professionals before making financial or investment decisions.
