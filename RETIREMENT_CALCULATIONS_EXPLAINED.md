# How Retirement Planning Calculations Work
*A Plain English Guide to Understanding Your Financial Projections*

## Overview

This document explains exactly how the Advanced Retirement Planner calculates your financial projections. We've broken down complex financial mathematics into understandable concepts so you know precisely what the tool is doing with your numbers.

## Table of Contents

1. [Monte Carlo Simulation](#monte-carlo-simulation)
2. [Retirement Scenario Calculations](#retirement-scenario-calculations)
3. [Heatmap Analysis](#heatmap-analysis)
4. [Time Series Projections](#time-series-projections)
5. [Market Scenarios Explained](#market-scenarios-explained)
6. [Savings and Drawdown Logic](#savings-and-drawdown-logic)
7. [Key Assumptions](#key-assumptions)

---

## Monte Carlo Simulation

### What It Is
Think of Monte Carlo simulation as running your retirement plan through thousands of different possible market scenarios. Instead of assuming the stock market will return exactly 7% every year, it simulates realistic market volatility where some years you might gain 25% and others you might lose 15%.

### How It Works
1. **Random Market Years**: The simulation creates thousands of possible "market histories" by randomly selecting actual historical return patterns
2. **Sequence Risk**: The order of good and bad years matters enormously - losing 30% in your first year of retirement is much worse than losing 30% in your last year
3. **Multiple Runs**: We run 10,000+ different scenarios to see how often your plan succeeds or fails
4. **Percentile Results**: 
   - **Best Case (90th percentile)**: Better than 90% of scenarios
   - **Median (50th percentile)**: The middle result - half do better, half do worse
   - **Pessimistic (10th percentile)**: Only 10% of scenarios do worse than this
   - **Worst Case (1st percentile)**: Simulates timing as bad as 2008 financial crisis

### Why This Matters
A plan that works with steady 7% returns might completely fail when you factor in real market volatility and sequence risk. Monte Carlo shows you the range of possible outcomes.

---

## Retirement Scenario Calculations

### The Basic Formula
For each year of your retirement projection, we calculate:

```
New Portfolio Value = (Previous Portfolio Value × Market Return) + Annual Savings - Annual Withdrawals
```

### Step-by-Step Process

#### Year 1 (Starting Point)
- Start with your current net worth (e.g., $4.2 million)
- Apply the market return for that year
- Add any savings (if still working)
- Subtract any withdrawals (if retired)

#### Each Subsequent Year
- Take the previous year's ending balance
- Multiply by the market return (which varies by scenario)
- Add savings if applicable (see savings logic below)
- Subtract withdrawals based on your drawdown phases
- Add any pension or Social Security income

#### Success/Failure Determination
- **Success**: Portfolio never goes below zero through your target age
- **Failure**: Portfolio is depleted before your target age

---

## Heatmap Analysis

### What It Shows
The heatmap displays your projected portfolio value at a specific age (default: 62) across different combinations of retirement ages for both spouses.

### How It's Generated
1. **Age Combinations**: Tests retirement ages from your current age up to 25 years later for both spouses
2. **For Each Combination**: Runs the full retirement calculation to your target analysis age
3. **Color Coding**:
   - **Red**: Significant loss (below 80% of starting value)
   - **Orange**: Some loss (below starting value)
   - **Yellow**: Minimal gain (50% growth or less)
   - **Light Green**: Good growth (50-150% growth)
   - **Dark Green**: Excellent growth (150%+ growth)

### Key Insights
- **Later Retirement = More Savings**: Each extra year of work means one more year of savings and one less year of withdrawals
- **Sweet Spots**: The heatmap reveals optimal retirement timing combinations
- **Risk Assessment**: Shows how sensitive your plan is to retirement timing

---

## Time Series Projections

### The Line Chart Explained
The time series chart shows how your portfolio value changes year by year from now until your target analysis age, displaying four different market scenarios simultaneously.

### Calculation Method
1. **Starting Point**: Your current net worth
2. **Each Year Forward**:
   - Apply the appropriate market return for that scenario
   - Add savings (if still working)
   - Subtract withdrawals (based on retirement status and drawdown phases)
   - Account for any pension/Social Security income

### The Four Lines
- **Best Case**: Uses 90th percentile returns from Monte Carlo
- **Median**: Uses 50th percentile returns (most likely outcome)
- **Pessimistic**: Uses 10th percentile returns
- **Worst Case**: Simulates historically bad market timing

---

## Market Scenarios Explained

### Best Case (90th Percentile)
- **Average Annual Return**: ~12-15%
- **What This Means**: Markets perform better than usual, similar to the 1990s bull market
- **Reality Check**: Only happens 1 in 10 times historically

### Median Case (50th Percentile)
- **Average Annual Return**: ~7-8%
- **What This Means**: Average historical market performance
- **Reality Check**: The most statistically likely outcome

### Pessimistic Case (10th Percentile)
- **Average Annual Return**: ~2-4%
- **What This Means**: Markets perform poorly, like the 2000-2010 "lost decade"
- **Reality Check**: Happens about 1 in 10 times historically

### Worst Case (1st Percentile)
- **Average Annual Return**: ~0-2%
- **What This Means**: Severe bear market timing, multiple major crashes
- **Reality Check**: Think 2008 financial crisis timing but potentially worse

---

## Savings and Drawdown Logic

### Savings Phase Logic
The tool automatically adjusts your savings based on retirement status:

1. **Both Working**: Full annual savings amount
2. **One Retired**: 50% of annual savings (assuming one spouse still working)
3. **Both Retired**: $0 savings

### Drawdown Phases
You can set up multiple spending phases with different amounts:

#### Example Setup
- **Ages 48-54**: $200,000/year (travel and active retirement)
- **Ages 54-62**: $160,000/year (settling down but still active)
- **Ages 62+**: $100,000/year (reduced expenses, Social Security kicks in)

#### How It Works
- The tool checks your age each year against your defined phases
- Automatically applies the appropriate withdrawal amount
- Phases can overlap with income sources (pensions, Social Security)

---

## Key Assumptions

### Market Returns
- **Source**: Based on historical U.S. stock market data
- **Inflation Adjustment**: All returns are "real returns" (already adjusted for inflation)
- **Asset Allocation**: Assumes diversified portfolio appropriate for your risk level

### Sequence of Returns Risk
- **Critical Factor**: The order of good/bad years matters enormously
- **Early Retirement Risk**: Poor returns in early retirement years are much more damaging
- **Modeling**: Uses actual historical return sequences, not just averages

### Income Sources
- **Pensions**: Assumed to be inflation-adjusted
- **Social Security**: Assumed to be inflation-adjusted
- **Timing**: All income sources start exactly on the ages you specify

### Expenses
- **Inflation**: All withdrawal amounts are in today's purchasing power
- **Consistency**: Assumes spending stays constant within each phase
- **Healthcare**: Not explicitly modeled - should be included in your withdrawal amounts

### Taxes
- **Current Limitation**: Tax implications are not explicitly modeled
- **Your Responsibility**: Withdrawal amounts should be gross (before-tax) amounts
- **Future Enhancement**: Tax modeling may be added in future versions

---

## Understanding Your Results

### What Success Means
- Your portfolio never reaches zero before your target age
- You can maintain your desired spending throughout retirement
- There's cushion for unexpected expenses

### What the Percentiles Tell You
- **90th Percentile**: Your "best case" - don't count on this
- **50th Percentile**: Most likely outcome - plan around this
- **10th Percentile**: Your "stress test" - you should survive this
- **1st Percentile**: Disaster scenario - acceptable to fail here

### Using Multiple Scenarios
- **Conservative Planning**: Ensure success in pessimistic case
- **Optimistic Planning**: Plan based on median case
- **Aggressive Planning**: Plan based on best case (not recommended)

---

## Real-World Considerations

### What This Model Captures Well
- Market volatility and sequence risk
- Impact of retirement timing
- Basic withdrawal and savings patterns
- Historical market behavior

### What This Model Doesn't Include
- Detailed tax planning
- Healthcare cost spikes
- Long-term care needs
- Inheritance planning
- Economic regime changes
- Black swan events beyond historical precedent

### Recommended Usage
1. Use these projections as a starting point
2. Stress-test your plan with pessimistic scenarios
3. Build in safety margins for unexpected events
4. Consult with financial professionals for comprehensive planning
5. Review and update regularly as circumstances change

---

## Conclusion

This retirement planning tool provides sophisticated financial modeling in an accessible format. By understanding how the calculations work, you can make more informed decisions about your retirement timing and spending plans.

Remember: All financial models are simplifications of reality. Use these projections as guides, not guarantees, and always maintain appropriate safety margins in your planning.

---

*Last Updated: December 2024* 