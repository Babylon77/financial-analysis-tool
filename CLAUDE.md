# Ultronic Terminal

**Financial analysis platform with 80s Wall Street terminal aesthetic.**
Two modules: Financial Planning (wealth accumulation, spend-down, Monte Carlo, tax optimization, retirement analysis) and Real Estate (fix & flip, LTR, STR, MODA comparison).

## Quick Start

```bash
npm install
npm start        # Dev server on localhost:3000
npm run build    # Production build
npm test         # Run tests
```

## Tech Stack

- **Framework:** React 18 (CRA) with HashRouter
- **UI:** MUI 5 + Tailwind CSS 3 (dark terminal theme)
- **Charts:** Recharts (primary), ApexCharts (secondary)
- **Fonts:** JetBrains Mono (data), Inter (body), Space Grotesk (display)
- **State:** React Context + useReducer (FinancialPlanContext, RealEstateContext)
- **Auth:** Supabase (Google OAuth + email) via AuthContext
- **Export:** SheetJS (xlsx) for Excel/CSV, @react-pdf/renderer for PDF reports
- **Backend:** Node/Express + MongoDB (in `/backend/`, not yet connected)

## App Structure

### Navigation
- `/` — Home (module selection)
- `/real-estate` — Real estate analysis (Calculator → Results)
- `/financial-planning` — **Financial Planning Hub** (sidebar layout with nested routes):
  - `/financial-planning/profile` — Unified financial profile inputs
  - `/financial-planning/accumulate` — Monte Carlo simulation + accumulation
  - `/financial-planning/spend-down` — Withdrawal strategies + survival analysis
  - `/financial-planning/advanced` — Dual-spouse heatmap + advanced retirement
  - `/financial-planning/reports` — Report generation + Excel/CSV/PDF export

### Key Pages and Components
```
src/
  pages/
    Home.js                      # Module cards (Real Estate, Financial Planning)
    Calculator.js + Results.js   # Real estate analysis
    FinancialPlanningHub.js      # Sidebar hub layout with <Outlet>
    SpendDown.js                 # Spend-down analysis (withdrawal strategies, survival, RMD, Roth, SS, tax)
  components/
    Layout.js                    # Top nav (Home, Real Estate, Financial Planning) + auth UI
    ChatbotWidget.js             # Context-aware help assistant (financial planning + real estate)
    TutorialHints.js             # Real estate tips (only shown on RE pages, localStorage persistence)
    planning/
      PlanningHubSidebar.js      # Sidebar nav with section links
      SectionNav.js              # Vertical nav items
      FinancialProfileSection.js # Unified profile form
      AccumulateSection.js       # Wraps MonteCarloSimulator
      SpendDownSection.js        # Wraps SpendDown.js
      AdvancedRetirementSection.js
      ReportsSection.js          # Report generation + export buttons
      SectionNextStep.js         # "Continue to X" footer
    MonteCarloSimulator.js       # Core MC UI (config, charts, results)
    finance/AdvancedRetirementPlanner.js
    common/                      # Shared themed primitives (TerminalCard, GlowButton, etc.)
    charts/                      # MonteCarloChart, SavingsGrowthChart
    realEstate/                  # Real estate analysis components
```

### State Management
```
FinancialPlanContext (src/context/FinancialPlanContext.js)
├── profile              # Unified financial profile (ages, accounts, income, SS, pension)
├── simulationConfig     # MC settings (riskProfile, numberOfSimulations, inflationRate)
├── simulationResults    # MC output (medianCAGR, percentile paths, success rate)
├── spendDownAnalysis    # Cached spend-down results (MC paths, survival analysis)
├── drawdownPhases       # Drawdown phase configuration
├── heatmapData          # Advanced retirement heatmap
├── selectedHeatmapAge
└── monteCarloScenario

AuthContext (src/context/AuthContext.js)
├── user, isAuthenticated, loading
├── login/logout/updateProfile
├── loadFinancialData / saveFinancialData (Supabase cloud sync)
└── Google OAuth + email/password auth

RealEstateContext (src/context/AppContext.js)
└── Real estate analysis state
```

### Utilities
```
src/utils/
  monteCarloSimulation.js          # Core MC engine
    ├── ASSET_CLASS_PARAMS         # stocks: 9% real arithmetic, bonds: 2.5% real
    ├── RISK_PROFILES              # conservative/balanced/growth/aggressive allocations
    ├── runSingleSimulation()      # Full simulation with correlated assets, regimes, O-U inflation
    └── generateCorrelatedSequences() # Lightweight MC for spend-down (1000 paths)
  calculations/
    withdrawalStrategies.js        # 7 strategies: Fixed, Percent, GK, Bucket, VPW, RMD, Vanguard
    taxEngine.js                   # Federal tax, marginal rates, SS taxation, IRMAA
    rothConversion.js              # Roth conversion optimization + ladder
    socialSecurity.js              # Claiming age analysis, break-even, spousal benefits
    flipCalculations.js            # Fix & flip ROI with compound annualization
    rentalCalculations.js          # LTR and STR cash flow, 5-year projections
    modaAnalysis.js                # Multi-objective decision analysis scoring
  reportExport.js                  # Excel/CSV export via SheetJS
  pdfReport.js                     # PDF report generation via @react-pdf/renderer
  formatters.js                    # formatCurrency, formatPercent (canonical source)
  stateMigration.js                # v1 → v2 state migration
  constants/
    taxConstants.js                # Tax brackets, RMD table, IRMAA, standard deduction
    realEstateConstants.js         # Regional multipliers, renovation costs, expense ratios
```

### Data Flow: Spend-Down Analysis
1. User configures profile (ages, accounts, spending, risk profile)
2. "Run Analysis" triggers `handleRunAnalysis` callback in SpendDown.js
3. Generates 1,000 correlated MC return paths via `generateCorrelatedSequences`
4. Runs `computeSurvivalAnalysis` — binary search for max safe withdrawal across 7 strategies
5. Income bridge: SS + pension income by year reduces portfolio withdrawal needs
6. Results cached in module-level `_analysisCache` (persists across navigation) AND dispatched to context (`spendDownAnalysis`) for Reports page access
7. Cheap derivations (strategy table, RMD, Roth, SS, tax) computed via useMemo from cached MC paths
8. Reports page reads `state.spendDownAnalysis` for export

### Data Flow: Real Estate Analysis
1. User enters property details in Calculator.js (price, condition, location, financing)
2. Submit navigates to Results.js with formData in route state
3. `useResultsAnalysis` hook computes all metrics: flip ROI, rental cash flow, STR revenue, 5-year projections
4. Compound-annualized ROI for apples-to-apples comparison across strategies
5. MODA scoring weights user priorities (ROI, cash flow, risk, workload) for recommendation
6. Sensitivity sliders allow real-time stress testing

### Persistence Layers
- **Session**: `sessionStorage` — profile, simulationConfig, simulationResults (auto-save on change)
- **Cloud**: Supabase `financial_data` table — same fields, synced when authenticated (5s debounce)
- **Module cache**: `_analysisCache` in SpendDown.js — MC paths + survival analysis (survives navigation, not page refresh)
- **Context**: `spendDownAnalysis` — shared between SpendDown and Reports pages (not persisted to storage/cloud due to size)

## Architecture Decisions

- **Theme:** All colors as CSS custom properties in `src/theme/colors.js`, consumed by MUI + Tailwind. Dark terminal aesthetic everywhere.
- **Formatting:** Use `formatCurrency` and `formatPercent` from `src/utils/formatters.js` only. Never define inline.
- **Constants:** Real estate in `realEstateConstants.js`. Tax in `taxConstants.js`.
- **Monte Carlo:** Correlated multi-asset model with bull/bear regime switching, Cholesky decomposition for stock-bond correlation (-0.2), Ornstein-Uhlenbeck stochastic inflation. Returns are REAL (above inflation). `stocks.mean = 0.09` is arithmetic mean (produces ~7% CAGR after volatility drag).
- **Withdrawal strategies:** inflationRate: 0 for spend-down since MC returns are already real. Percent-of-portfolio uses spending-floor success test (never truly depletes).
- **Real estate ROI:** Compound annualization for all strategies. Closing costs included in total investment. STR includes cleaning/turnover costs.
- **Income bridge:** SS and pension income reduces portfolio withdrawal needs. Amount-based strategies (fixed, GK, bucket) subtract income from portfolio draw. Rate-based strategies (percent, VPW, RMD, Vanguard) add income to reported total spending.
- **Hub architecture:** Sidebar-based at `/financial-planning` with nested routes via `<Outlet>`. Sections are lazy-loaded.
- **Help assistant:** Context-aware chatbot in ChatbotWidget.js. Shows relevant quick questions based on current route (financial planning vs real estate). Pattern-matched responses covering both modules.
- **Tutorial tips:** Real estate only (Calculator + Results pages). localStorage persistence — auto-popup dismissed permanently after first dismissal. Lightbulb button always available.

## Conventions

- Plain JavaScript (no TypeScript yet)
- Functional components with hooks only
- Component files: PascalCase (`TerminalCard.js`)
- Utility files: camelCase (`formatters.js`)
- No default exports for utility modules; named exports preferred for components
- Minimal comments — only when the WHY is non-obvious
- Green = positive/gain, Red = negative/loss, Amber = warning/highlight, Cyan = interactive
- No emojis in UI text or chatbot responses
- Font-mono for all data, font-display for headers, uppercase tracking-wider for section labels
