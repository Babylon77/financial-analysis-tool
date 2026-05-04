# Ultronic Terminal

**Financial analysis platform with 80s Wall Street terminal aesthetic.**
Wealth accumulation, spend-down planning, Monte Carlo simulation, tax optimization, and real estate analysis.

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
- **Export:** SheetJS (xlsx) for Excel/CSV report generation
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
  - `/financial-planning/reports` — Report generation + Excel/CSV export

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
    widgets/                     # Chatbot, tutorial hints
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
    taxEngine.js                   # Federal tax, marginal rates, SS taxation
    rothConversion.js              # Roth conversion optimization + ladder
    socialSecurity.js              # Claiming age analysis, break-even
  reportExport.js                  # Excel/CSV export via SheetJS
  formatters.js                    # formatCurrency, formatPercent (canonical source)
  stateMigration.js                # v1 → v2 state migration
  constants/
    taxConstants.js                # Tax brackets, RMD table, IRMAA, standard deduction
    realEstateConstants.js         # Regional multipliers, renovation costs
```

### Data Flow: Spend-Down Analysis
1. User configures profile (ages, accounts, spending, risk profile)
2. "Run Analysis" triggers `handleRunAnalysis` callback in SpendDown.js
3. Generates 1,000 correlated MC return paths via `generateCorrelatedSequences`
4. Runs `computeSurvivalAnalysis` — binary search for max safe withdrawal across 7 strategies
5. Results cached in module-level `_analysisCache` (persists across navigation) AND dispatched to context (`spendDownAnalysis`) for Reports page access
6. Cheap derivations (strategy table, RMD, Roth, SS, tax) computed via useMemo from cached MC paths
7. Reports page reads `state.spendDownAnalysis` for export

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
- **Hub architecture:** Sidebar-based at `/financial-planning` with nested routes via `<Outlet>`. Sections are lazy-loaded.

## Conventions

- Plain JavaScript (no TypeScript yet)
- Functional components with hooks only
- Component files: PascalCase (`TerminalCard.js`)
- Utility files: camelCase (`formatters.js`)
- No default exports for utility modules; named exports preferred for components
- Minimal comments — only when the WHY is non-obvious
- Green = positive/gain, Red = negative/loss, Amber = warning/highlight, Cyan = interactive
