# Technical Model Specification: Retirement Planning Calculator
*Mathematical Models and Implementation Details for Professional Validation*

## Executive Summary

This document provides the complete mathematical specification for the Monte Carlo-based retirement planning model. All formulas, algorithms, and assumptions are documented to enable professional validation and peer review.

## Model Architecture

### Core Calculation Engine
- **Primary Formula**: Discrete-time wealth evolution model with stochastic returns
- **Simulation Method**: Monte Carlo with historical bootstrap sampling
- **Time Horizon**: Annual discrete periods from current age to specified end age
- **Currency**: All values in real (inflation-adjusted) terms

---

## 1. Monte Carlo Simulation Framework

### 1.1 Core Wealth Evolution Formula

For each simulation path `i` and time period `t`:

```
W[i,t+1] = W[i,t] × (1 + R[i,t]) + S[t] - D[t] + I[t]
```

Where:
- `W[i,t]` = Portfolio wealth in simulation `i` at time `t`
- `R[i,t]` = Real return rate in simulation `i` at time `t`
- `S[t]` = Real savings contribution at time `t`
- `D[t]` = Real drawdown/withdrawal at time `t`
- `I[t]` = Real income (pension, Social Security) at time `t`

### 1.2 Return Generation Process

**Historical Bootstrap Method:**
```
R[i,t] = HistoricalReturns[RandomSelection[i,t]]
```

**Implementation Details:**
- Source: Historical S&P 500 real returns (1926-2023)
- Sampling: Uniform random selection with replacement
- No temporal correlation imposed (each year independent)
- No regime switching or structural breaks modeled

### 1.3 Simulation Parameters

```
N_SIMULATIONS = 10,000 (default, user configurable 1,000-50,000)
CONFIDENCE_LEVELS = [0.01, 0.10, 0.50, 0.90]
```

**Percentile Calculations:**
- P90 (Best Case): 90th percentile of final wealth distribution
- P50 (Median): 50th percentile of final wealth distribution  
- P10 (Pessimistic): 10th percentile of final wealth distribution
- P01 (Worst Case): 1st percentile of final wealth distribution

---

## 2. Savings Function S[t]

### 2.1 Employment-Based Savings Logic

```
S[t] = BASE_SAVINGS × Employment_Factor[t] × (1 + g)^t
```

Where:
- `BASE_SAVINGS` = Annual real savings amount (user input)
- `g` = Real savings growth rate (user input, default 3%)
- `Employment_Factor[t]` defined as:

```
Employment_Factor[t] = {
    1.0    if both spouses working at time t
    0.5    if exactly one spouse working at time t  
    0.0    if both spouses retired at time t
}
```

### 2.2 Retirement Status Determination

```
Spouse_Working[s,t] = (Current_Age[s] + t) < Retirement_Age[s]
```

For spouse `s` ∈ {1,2}

---

## 3. Drawdown Function D[t]

### 3.1 Phase-Based Withdrawal System

```
D[t] = Σ[phases] Phase_Amount[j] × Phase_Active[j,t]
```

Where:
```
Phase_Active[j,t] = {
    1  if Start_Age[j] ≤ (Current_Age + t) ≤ End_Age[j]
    0  otherwise
}
```

### 3.2 Overlapping Phase Logic

Multiple phases can be active simultaneously. Total withdrawal is the sum of all active phases:

```
D[t] = Σ[j=1 to N_phases] Amount[j] × I(Start[j] ≤ age[t] ≤ End[j])
```

Where `I(·)` is the indicator function.

---

## 4. Income Function I[t]

### 4.1 Pension and Social Security Income

```
I[t] = Σ[spouses] [Pension[s,t] + SS[s,t]]
```

Where for spouse `s`:
```
Pension[s,t] = {
    Pension_Amount[s]  if age[s,t] ≥ Pension_Start_Age[s]
    0                  otherwise
}

SS[s,t] = {
    SS_Amount[s]  if age[s,t] ≥ SS_Start_Age[s]  
    0             otherwise
}
```

### 4.2 Age Calculation

```
age[s,t] = Current_Age[s] + t
```

---

## 5. Heatmap Analysis Model

### 5.1 Parameter Space Definition

**Grid Generation:**
```
Spouse1_Ages = [Current_Age[1] : 2 : min(Current_Age[1] + 25, 75)]
Spouse2_Ages = [Current_Age[2] : 2 : min(Current_Age[2] + 25, 75)]
```

Truncated to 10×10 grid for computational efficiency.

### 5.2 Scenario Calculation

For each combination `(ret_age_1, ret_age_2)`:

```
W_target = Wealth_Evolution(
    retirement_ages = [ret_age_1, ret_age_2],
    target_age = Analysis_Age,
    scenario = Selected_Scenario
)
```

Where `Selected_Scenario` ∈ {P90, P50, P10, P01}

### 5.3 Color Mapping Function

```
Color[W] = {
    RED     if W < 0.8 × W_initial
    ORANGE  if 0.8 × W_initial ≤ W < W_initial  
    YELLOW  if W_initial ≤ W < 1.5 × W_initial
    LIME    if 1.5 × W_initial ≤ W < 2.5 × W_initial
    GREEN   if W ≥ 2.5 × W_initial
}
```

---

## 6. Time Series Projection Model

### 6.1 Deterministic Scenario Modeling

For each scenario `k` ∈ {Best, Median, Pessimistic, Worst}:

```
W[k,t+1] = W[k,t] × (1 + r[k]) + S[t] - D[t] + I[t]
```

Where `r[k]` is the constant annual return for scenario `k`.

### 6.2 Return Rate Mapping

```
r[Best] = P90_annual_return
r[Median] = P50_annual_return  
r[Pessimistic] = P10_annual_return
r[Worst] = max(0.3 × P10_annual_return, 0.01)
```

**Source of Percentile Returns:**
- Derived from Monte Carlo simulation results
- Converted from final wealth percentiles to equivalent constant annual returns
- Formula: `r = (Final_Wealth / Initial_Wealth)^(1/years) - 1`

---

## 7. Key Model Assumptions

### 7.1 Market Model Assumptions

1. **Return Distribution**: Historical bootstrap (non-parametric)
2. **Serial Correlation**: None (each year independent)
3. **Regime Changes**: Not modeled
4. **Asset Allocation**: Static, implicit in historical returns
5. **Rebalancing**: Annual, implicit
6. **Transaction Costs**: Not explicitly modeled

### 7.2 Inflation Assumptions

1. **All Values**: Real (inflation-adjusted) terms
2. **Inflation Rate**: Implicit in historical real return data
3. **Income Growth**: Real growth rates applied to pensions/SS
4. **Expense Growth**: Real growth rates applied to drawdowns

### 7.3 Tax Assumptions

1. **Tax Treatment**: Not explicitly modeled
2. **User Responsibility**: Input after-tax values
3. **Account Types**: Model agnostic (pre-tax, post-tax, Roth)

### 7.4 Demographic Assumptions

1. **Longevity**: User-specified end age
2. **Health Events**: Not modeled
3. **Long-term Care**: Not explicitly modeled
4. **Employment**: Binary work/retire state

---

## 8. Numerical Implementation Details

### 8.1 Computational Precision

- **Floating Point**: Double precision (64-bit)
- **Currency**: Rounded to nearest dollar for display
- **Age Calculations**: Integer years only
- **Random Seed**: Not fixed (new randomness each run)

### 8.2 Edge Case Handling

```javascript
// Portfolio depletion
if (W[i,t] < 0) {
    W[i,t] = 0;  // Floor at zero
    success[i] = false;  // Mark simulation as failed
}

// Negative drawdown (income exceeds expenses)
if (D[t] < 0) {
    D[t] = 0;  // No negative withdrawals
}
```

### 8.3 Performance Optimizations

- **Batch Processing**: All simulations run in parallel loops
- **Early Termination**: Simulations stop if portfolio reaches zero
- **Memory Management**: Results stored as percentile summaries, not full paths

---

## 9. Model Validation Framework

### 9.1 Unit Tests Required

1. **Wealth Evolution**: Test single-period calculation accuracy
2. **Savings Logic**: Verify employment factor transitions
3. **Drawdown Phases**: Test overlapping phase calculations
4. **Income Timing**: Verify age-based income activation
5. **Percentile Calculation**: Test against known distributions

### 9.2 Integration Tests Required

1. **Monte Carlo Convergence**: Verify stability with increasing N_SIMULATIONS
2. **Scenario Consistency**: Ensure P90 > P50 > P10 > P01
3. **Time Series Accuracy**: Compare deterministic vs. Monte Carlo medians
4. **Heatmap Monotonicity**: Later retirement should generally improve outcomes

### 9.3 Sensitivity Analysis

Key parameters for sensitivity testing:
- `N_SIMULATIONS`: Convergence analysis
- `Historical Period`: Bootstrap sample robustness  
- `Return Assumptions`: Alternative market scenarios
- `Income/Drawdown Timing`: Phase boundary effects

---

## 10. Known Limitations and Areas for Enhancement

### 10.1 Current Model Limitations

1. **Static Asset Allocation**: No glide path or tactical changes
2. **No Sequence Risk Mitigation**: No bond tent or bucket strategies
3. **Tax Optimization**: No tax-loss harvesting or Roth conversions
4. **Healthcare Costs**: No explicit long-term care modeling
5. **Behavioral Factors**: No spending flexibility or panic selling
6. **Economic Regimes**: No structural break modeling

### 10.2 Recommended Enhancements

1. **Dynamic Asset Allocation**: Age-based glide paths
2. **Tax Module**: Explicit tax calculations by account type
3. **Stochastic Income**: Variable pension/SS benefits
4. **Healthcare Module**: Probabilistic LTC cost modeling
5. **Behavioral Module**: Spending flexibility and market timing errors

---

## 11. Data Sources and References

### 11.1 Historical Return Data
- **Source**: S&P 500 real returns 1926-2023
- **Frequency**: Annual
- **Methodology**: CPI-adjusted nominal returns
- **Provider**: [Specific data source to be documented]

### 11.2 Validation Benchmarks
- **Monte Carlo**: Compare against established financial planning software
- **Statistical Properties**: Verify return distribution matches historical data
- **Professional Standards**: CFP Board practice standards compliance

---

## 12. Version Control and Change Log

### Version 1.0 (December 2024)
- Initial implementation
- Basic Monte Carlo framework
- Heatmap analysis capability
- Time series projections

### Planned Version 1.1
- Enhanced tax modeling
- Dynamic asset allocation
- Improved UI/UX for professional users

---

## Appendix A: Mathematical Notation Reference

| Symbol | Definition |
|--------|------------|
| W[i,t] | Wealth in simulation i at time t |
| R[i,t] | Return rate in simulation i at time t |
| S[t] | Savings at time t |
| D[t] | Drawdown at time t |
| I[t] | Income at time t |
| P[x] | x-th percentile |
| N | Number of simulations |
| T | Time horizon |

## Appendix B: Implementation Checklist

- [ ] Validate Monte Carlo convergence
- [ ] Test edge cases (portfolio depletion)
- [ ] Verify percentile calculations
- [ ] Cross-check time series vs. Monte Carlo
- [ ] Validate heatmap generation logic
- [ ] Test savings/drawdown phase transitions
- [ ] Verify income timing calculations
- [ ] Performance testing with max simulations

---

*This specification serves as the authoritative reference for model implementation and validation. All code implementations should conform to these mathematical definitions.*

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Review Status**: Draft - Pending Professional Validation 