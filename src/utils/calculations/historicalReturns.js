/**
 * Historical backtesting engine for retirement plan analysis.
 * Tests portfolio survival against actual US market return data (1928-2024).
 * Data sourced from Shiller/SBBI: S&P 500 total returns, 10-year Treasury bond returns, CPI inflation.
 * All values are NOMINAL (not inflation-adjusted).
 */

const HISTORICAL_DATA = [
  { year: 1928, stock: 0.4381, bond: 0.0084, inflation: -0.0116 },
  { year: 1929, stock: -0.0830, bond: 0.0420, inflation: 0.0058 },
  { year: 1930, stock: -0.2512, bond: 0.0454, inflation: -0.0640 },
  { year: 1931, stock: -0.4384, bond: -0.0256, inflation: -0.0932 },
  { year: 1932, stock: -0.0864, bond: 0.0879, inflation: -0.1027 },
  { year: 1933, stock: 0.4998, bond: 0.0186, inflation: 0.0076 },
  { year: 1934, stock: -0.0119, bond: 0.0796, inflation: 0.0203 },
  { year: 1935, stock: 0.4674, bond: 0.0447, inflation: 0.0299 },
  { year: 1936, stock: 0.3194, bond: 0.0531, inflation: 0.0121 },
  { year: 1937, stock: -0.3534, bond: 0.0176, inflation: 0.0293 },
  { year: 1938, stock: 0.2928, bond: 0.0521, inflation: -0.0278 },
  { year: 1939, stock: -0.0110, bond: 0.0439, inflation: 0.0000 },
  { year: 1940, stock: -0.1067, bond: 0.0502, inflation: 0.0096 },
  { year: 1941, stock: -0.1277, bond: -0.0202, inflation: 0.0972 },
  { year: 1942, stock: 0.1917, bond: 0.0229, inflation: 0.0929 },
  { year: 1943, stock: 0.2534, bond: 0.0249, inflation: 0.0316 },
  { year: 1944, stock: 0.1944, bond: 0.0258, inflation: 0.0211 },
  { year: 1945, stock: 0.3582, bond: 0.0380, inflation: 0.0225 },
  { year: 1946, stock: -0.0843, bond: 0.0313, inflation: 0.1802 },
  { year: 1947, stock: 0.0520, bond: 0.0092, inflation: 0.0888 },
  { year: 1948, stock: 0.0557, bond: 0.0195, inflation: 0.0271 },
  { year: 1949, stock: 0.1830, bond: 0.0445, inflation: -0.0180 },
  { year: 1950, stock: 0.3081, bond: -0.0036, inflation: 0.0579 },
  { year: 1951, stock: 0.2368, bond: -0.0074, inflation: 0.0587 },
  { year: 1952, stock: 0.1815, bond: 0.0270, inflation: 0.0088 },
  { year: 1953, stock: -0.0121, bond: 0.0414, inflation: 0.0062 },
  { year: 1954, stock: 0.5256, bond: 0.0329, inflation: -0.0050 },
  { year: 1955, stock: 0.3260, bond: -0.0034, inflation: 0.0037 },
  { year: 1956, stock: 0.0744, bond: -0.0190, inflation: 0.0286 },
  { year: 1957, stock: -0.1046, bond: 0.0645, inflation: 0.0302 },
  { year: 1958, stock: 0.4372, bond: -0.0078, inflation: 0.0176 },
  { year: 1959, stock: 0.1206, bond: -0.0226, inflation: 0.0150 },
  { year: 1960, stock: 0.0034, bond: 0.1115, inflation: 0.0149 },
  { year: 1961, stock: 0.2664, bond: 0.0206, inflation: 0.0067 },
  { year: 1962, stock: -0.0881, bond: 0.0569, inflation: 0.0133 },
  { year: 1963, stock: 0.2261, bond: 0.0364, inflation: 0.0165 },
  { year: 1964, stock: 0.1642, bond: 0.0397, inflation: 0.0119 },
  { year: 1965, stock: 0.1240, bond: 0.0071, inflation: 0.0192 },
  { year: 1966, stock: -0.0997, bond: 0.0218, inflation: 0.0335 },
  { year: 1967, stock: 0.2380, bond: -0.0101, inflation: 0.0304 },
  { year: 1968, stock: 0.1081, bond: 0.0326, inflation: 0.0472 },
  { year: 1969, stock: -0.0824, bond: -0.0501, inflation: 0.0611 },
  { year: 1970, stock: 0.0400, bond: 0.1875, inflation: 0.0549 },
  { year: 1971, stock: 0.1431, bond: 0.0979, inflation: 0.0336 },
  { year: 1972, stock: 0.1898, bond: 0.0291, inflation: 0.0341 },
  { year: 1973, stock: -0.1466, bond: 0.0150, inflation: 0.0880 },
  { year: 1974, stock: -0.2647, bond: 0.0523, inflation: 0.1220 },
  { year: 1975, stock: 0.3720, bond: 0.0320, inflation: 0.0701 },
  { year: 1976, stock: 0.2384, bond: 0.1423, inflation: 0.0477 },
  { year: 1977, stock: -0.0698, bond: 0.0067, inflation: 0.0677 },
  { year: 1978, stock: 0.0670, bond: -0.0099, inflation: 0.0903 },
  { year: 1979, stock: 0.1844, bond: 0.0118, inflation: 0.1331 },
  { year: 1980, stock: 0.3174, bond: -0.0296, inflation: 0.1240 },
  { year: 1981, stock: -0.0470, bond: 0.0820, inflation: 0.0894 },
  { year: 1982, stock: 0.2042, bond: 0.3291, inflation: 0.0387 },
  { year: 1983, stock: 0.2234, bond: 0.0341, inflation: 0.0380 },
  { year: 1984, stock: 0.0615, bond: 0.1393, inflation: 0.0395 },
  { year: 1985, stock: 0.3124, bond: 0.2571, inflation: 0.0377 },
  { year: 1986, stock: 0.1849, bond: 0.1946, inflation: 0.0113 },
  { year: 1987, stock: 0.0581, bond: -0.0296, inflation: 0.0441 },
  { year: 1988, stock: 0.1654, bond: 0.0822, inflation: 0.0442 },
  { year: 1989, stock: 0.3148, bond: 0.1769, inflation: 0.0465 },
  { year: 1990, stock: -0.0306, bond: 0.0624, inflation: 0.0611 },
  { year: 1991, stock: 0.3023, bond: 0.1530, inflation: 0.0306 },
  { year: 1992, stock: 0.0749, bond: 0.0940, inflation: 0.0290 },
  { year: 1993, stock: 0.0997, bond: 0.1424, inflation: 0.0275 },
  { year: 1994, stock: 0.0133, bond: -0.0804, inflation: 0.0267 },
  { year: 1995, stock: 0.3720, bond: 0.2348, inflation: 0.0254 },
  { year: 1996, stock: 0.2268, bond: 0.0143, inflation: 0.0332 },
  { year: 1997, stock: 0.3310, bond: 0.0993, inflation: 0.0170 },
  { year: 1998, stock: 0.2834, bond: 0.1492, inflation: 0.0161 },
  { year: 1999, stock: 0.2089, bond: -0.0782, inflation: 0.0268 },
  { year: 2000, stock: -0.0903, bond: 0.1666, inflation: 0.0339 },
  { year: 2001, stock: -0.1185, bond: 0.0535, inflation: 0.0155 },
  { year: 2002, stock: -0.2197, bond: 0.1512, inflation: 0.0238 },
  { year: 2003, stock: 0.2836, bond: 0.0138, inflation: 0.0188 },
  { year: 2004, stock: 0.1074, bond: 0.0449, inflation: 0.0326 },
  { year: 2005, stock: 0.0483, bond: 0.0287, inflation: 0.0342 },
  { year: 2006, stock: 0.1561, bond: 0.0196, inflation: 0.0254 },
  { year: 2007, stock: 0.0548, bond: 0.1021, inflation: 0.0408 },
  { year: 2008, stock: -0.3655, bond: 0.2025, inflation: 0.0009 },
  { year: 2009, stock: 0.2594, bond: -0.1112, inflation: 0.0272 },
  { year: 2010, stock: 0.1482, bond: 0.0836, inflation: 0.0150 },
  { year: 2011, stock: 0.0200, bond: 0.1604, inflation: 0.0296 },
  { year: 2012, stock: 0.1589, bond: 0.0297, inflation: 0.0174 },
  { year: 2013, stock: 0.3215, bond: -0.0918, inflation: 0.0150 },
  { year: 2014, stock: 0.1352, bond: 0.1075, inflation: 0.0076 },
  { year: 2015, stock: 0.0138, bond: 0.0127, inflation: 0.0073 },
  { year: 2016, stock: 0.1177, bond: 0.0069, inflation: 0.0207 },
  { year: 2017, stock: 0.2161, bond: 0.0214, inflation: 0.0211 },
  { year: 2018, stock: -0.0423, bond: -0.0002, inflation: 0.0191 },
  { year: 2019, stock: 0.3121, bond: 0.0920, inflation: 0.0231 },
  { year: 2020, stock: 0.1840, bond: 0.1140, inflation: 0.0124 },
  { year: 2021, stock: 0.2833, bond: -0.0432, inflation: 0.0700 },
  { year: 2022, stock: -0.1811, bond: -0.1722, inflation: 0.0651 },
  { year: 2023, stock: 0.2606, bond: 0.0395, inflation: 0.0309 },
  { year: 2024, stock: 0.2300, bond: 0.0150, inflation: 0.0250 },
];

/**
 * Run a historical backtest across all possible start years.
 * For each start year, simulates a retirement drawdown using actual stock/bond returns.
 *
 * @param {Object} params
 * @param {number} params.portfolioValue - Starting portfolio balance
 * @param {number} params.annualWithdrawal - Annual withdrawal amount (year-0 dollars)
 * @param {number} [params.years=30] - Duration of retirement in years
 * @param {number} [params.stockAllocation=0.6] - Fraction allocated to stocks (rest goes to bonds)
 * @param {boolean} [params.inflationAdjustWithdrawals=true] - Grow withdrawals with actual CPI
 * @param {boolean} [params.useRealReturns=false] - Subtract inflation from returns (real vs nominal)
 * @returns {Object} Backtest results with scenarios, success rate, best/worst years, etc.
 */
export function runHistoricalBacktest({
  portfolioValue,
  annualWithdrawal,
  years = 30,
  stockAllocation = 0.6,
  inflationAdjustWithdrawals = true,
  useRealReturns = false,
}) {
  const bondAllocation = 1 - stockAllocation;
  const maxStartIndex = HISTORICAL_DATA.length - years;

  if (maxStartIndex < 1) {
    return {
      scenarios: [],
      successRate: 0,
      worstStartYear: null,
      bestStartYear: null,
      medianFinalBalance: 0,
      failedYears: [],
    };
  }

  const scenarios = [];

  for (let startIdx = 0; startIdx <= maxStartIndex; startIdx++) {
    const startYear = HISTORICAL_DATA[startIdx].year;
    let balance = portfolioValue;
    let cumulativeInflation = 1;
    let survived = true;
    const yearlyData = [];

    for (let y = 0; y < years; y++) {
      const dataIdx = startIdx + y;
      const row = HISTORICAL_DATA[dataIdx];

      const nominalReturn = row.stock * stockAllocation + row.bond * bondAllocation;
      const annualReturn = useRealReturns
        ? (1 + nominalReturn) / (1 + row.inflation) - 1
        : nominalReturn;

      // Inflation-adjust withdrawals using compounded actual CPI from the data
      if (y > 0) {
        cumulativeInflation *= (1 + HISTORICAL_DATA[startIdx + y - 1].inflation);
      }
      const withdrawal = inflationAdjustWithdrawals
        ? annualWithdrawal * cumulativeInflation
        : annualWithdrawal;

      const portfolioStart = balance;

      if (balance <= 0) {
        yearlyData.push({
          year: row.year,
          portfolioValue: 0,
          withdrawal: 0,
          return: annualReturn,
        });
        survived = false;
        continue;
      }

      // Withdraw first, then grow remaining balance
      const actualWithdrawal = Math.min(withdrawal, balance);
      balance -= actualWithdrawal;
      balance *= (1 + annualReturn);
      balance = Math.max(balance, 0);

      if (balance <= 0) {
        survived = false;
      }

      yearlyData.push({
        year: row.year,
        portfolioValue: balance,
        withdrawal: actualWithdrawal,
        return: annualReturn,
      });
    }

    scenarios.push({
      startYear,
      survived,
      finalBalance: balance,
      yearlyData,
    });
  }

  const successCount = scenarios.filter(s => s.survived).length;
  const successRate = successCount / scenarios.length;

  const sorted = [...scenarios].sort((a, b) => a.finalBalance - b.finalBalance);
  const worstStartYear = sorted[0].startYear;
  const bestStartYear = sorted[sorted.length - 1].startYear;

  const midIdx = Math.floor(sorted.length / 2);
  const medianFinalBalance = sorted.length % 2 === 0
    ? (sorted[midIdx - 1].finalBalance + sorted[midIdx].finalBalance) / 2
    : sorted[midIdx].finalBalance;

  const failedYears = scenarios.filter(s => !s.survived).map(s => s.startYear);

  return {
    scenarios,
    successRate,
    worstStartYear,
    bestStartYear,
    medianFinalBalance,
    failedYears,
  };
}

/**
 * Extract percentile return sequences from historical data for use by the MC engine
 * or withdrawal strategies as an alternative to synthetic returns.
 * Matches the shape of generatePercentileSequences: { pessimistic, median, optimistic }
 * where each is an array of annual blended returns.
 *
 * @param {number} years - Number of years for each sequence
 * @param {number} [stockAllocation=0.6] - Fraction allocated to stocks
 * @returns {{ pessimistic: number[], median: number[], optimistic: number[] }}
 */
export function getHistoricalPercentileReturns(years, stockAllocation = 0.6) {
  const bondAllocation = 1 - stockAllocation;
  const maxStartIndex = HISTORICAL_DATA.length - years;

  if (maxStartIndex < 1) {
    const empty = new Array(years).fill(0);
    return { pessimistic: empty, median: empty, optimistic: empty };
  }

  // Build all possible start-year paths with their terminal values
  const paths = [];
  for (let startIdx = 0; startIdx <= maxStartIndex; startIdx++) {
    const returns = [];
    let terminalValue = 1;
    for (let y = 0; y < years; y++) {
      const row = HISTORICAL_DATA[startIdx + y];
      const blended = row.stock * stockAllocation + row.bond * bondAllocation;
      returns.push(blended);
      terminalValue *= (1 + blended);
    }
    paths.push({ startIdx, returns, terminalValue });
  }

  // Sort by terminal value to find percentile paths
  paths.sort((a, b) => a.terminalValue - b.terminalValue);

  const pick = (pct) => {
    const idx = Math.min(Math.floor(pct * paths.length / 100), paths.length - 1);
    return paths[idx].returns;
  };

  return {
    pessimistic: pick(10),
    median: pick(50),
    optimistic: pick(90),
  };
}

/**
 * Compute summary statistics from the full historical dataset.
 *
 * @returns {Object} Stats including averages, standard deviations, correlation, extremes
 */
export function getHistoricalStats() {
  const n = HISTORICAL_DATA.length;
  const stocks = HISTORICAL_DATA.map(d => d.stock);
  const bonds = HISTORICAL_DATA.map(d => d.bond);
  const inflations = HISTORICAL_DATA.map(d => d.inflation);

  const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const stdDev = (arr) => {
    const m = mean(arr);
    const variance = arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
  };

  const stockMean = mean(stocks);
  const bondMean = mean(bonds);
  const inflationMean = mean(inflations);
  const stockStdDev = stdDev(stocks);
  const bondStdDev = stdDev(bonds);
  const inflationStdDev = stdDev(inflations);

  // Pearson correlation between stocks and bonds
  const covariance = stocks.reduce((s, sv, i) => {
    return s + (sv - stockMean) * (bonds[i] - bondMean);
  }, 0) / (n - 1);
  const stockBondCorrelation = covariance / (stockStdDev * bondStdDev);

  // Real (inflation-adjusted) returns
  const realStocks = HISTORICAL_DATA.map(d => (1 + d.stock) / (1 + d.inflation) - 1);
  const realBonds = HISTORICAL_DATA.map(d => (1 + d.bond) / (1 + d.inflation) - 1);
  const realStockMean = mean(realStocks);
  const realBondMean = mean(realBonds);

  // Extremes
  const worstStockYear = HISTORICAL_DATA.reduce((worst, d) =>
    d.stock < worst.stock ? d : worst, HISTORICAL_DATA[0]);
  const bestStockYear = HISTORICAL_DATA.reduce((best, d) =>
    d.stock > best.stock ? d : best, HISTORICAL_DATA[0]);
  const worstBondYear = HISTORICAL_DATA.reduce((worst, d) =>
    d.bond < worst.bond ? d : worst, HISTORICAL_DATA[0]);
  const bestBondYear = HISTORICAL_DATA.reduce((best, d) =>
    d.bond > best.bond ? d : best, HISTORICAL_DATA[0]);
  const highestInflationYear = HISTORICAL_DATA.reduce((worst, d) =>
    d.inflation > worst.inflation ? d : worst, HISTORICAL_DATA[0]);

  // Worst drawdown: largest peak-to-trough decline in cumulative stock returns
  let peak = 1;
  let worstDrawdown = 0;
  let worstDrawdownYear = HISTORICAL_DATA[0].year;
  let cumulativeStock = 1;
  for (const row of HISTORICAL_DATA) {
    cumulativeStock *= (1 + row.stock);
    if (cumulativeStock > peak) {
      peak = cumulativeStock;
    }
    const drawdown = (cumulativeStock - peak) / peak;
    if (drawdown < worstDrawdown) {
      worstDrawdown = drawdown;
      worstDrawdownYear = row.year;
    }
  }

  return {
    dataRange: { from: HISTORICAL_DATA[0].year, to: HISTORICAL_DATA[HISTORICAL_DATA.length - 1].year },
    totalYears: n,

    stockMean,
    bondMean,
    inflationMean,
    stockStdDev,
    bondStdDev,
    inflationStdDev,
    stockBondCorrelation,

    realStockMean,
    realBondMean,

    worstStockYear: { year: worstStockYear.year, return: worstStockYear.stock },
    bestStockYear: { year: bestStockYear.year, return: bestStockYear.stock },
    worstBondYear: { year: worstBondYear.year, return: worstBondYear.bond },
    bestBondYear: { year: bestBondYear.year, return: bestBondYear.bond },
    highestInflationYear: { year: highestInflationYear.year, rate: highestInflationYear.inflation },

    worstDrawdown: { drawdown: worstDrawdown, year: worstDrawdownYear },
  };
}

export { HISTORICAL_DATA };
