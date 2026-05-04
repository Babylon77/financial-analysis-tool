export const RENOVATION_COST_ESTIMATES = {
  teardown: { base: 100, range: [80, 150] },
  poor: { base: 60, range: [50, 80] },
  fair: { base: 35, range: [25, 45] },
  good: { base: 15, range: [10, 25] },
};

export const REGIONAL_MULTIPLIERS = {
  'AL': 0.85, 'AK': 1.25, 'AZ': 0.95, 'AR': 0.85, 'CA': 1.35, 'CO': 1.10,
  'CT': 1.15, 'DE': 1.05, 'FL': 0.95, 'GA': 0.90, 'HI': 1.40, 'ID': 0.90,
  'IL': 1.05, 'IN': 0.90, 'IA': 0.90, 'KS': 0.90, 'KY': 0.90, 'LA': 0.90,
  'ME': 1.00, 'MD': 1.10, 'MA': 1.25, 'MI': 1.00, 'MN': 1.05, 'MS': 0.85,
  'MO': 0.90, 'MT': 0.95, 'NE': 0.90, 'NV': 1.05, 'NH': 1.05, 'NJ': 1.20,
  'NM': 0.90, 'NY': 1.35, 'NC': 0.90, 'ND': 0.95, 'OH': 0.95, 'OK': 0.85,
  'OR': 1.10, 'PA': 1.05, 'RI': 1.15, 'SC': 0.90, 'SD': 0.90, 'TN': 0.90,
  'TX': 0.90, 'UT': 0.95, 'VT': 1.05, 'VA': 1.00, 'WA': 1.15, 'WV': 0.90,
  'WI': 1.00, 'WY': 0.95, 'DC': 1.30,
};

export const DIY_FACTORS = {
  'significant': 0.55,
  'some': 0.70,
  'gc': 0.80,
  'hire': 1.0,
};

export const EXPENSE_RATIOS = {
  propertyTax: 0.012,
  insurance: 0.005,
  maintenance: 0.01,
  strMaintenance: 0.015,
  utilities: 0.005,
  strUtilities: 0.02,
  capex: 0.05,
  strCapex: 0.08,
};

export const AVG_NIGHTLY_RATES_BY_LOCATION = {
  'AL': 100, 'AK': 150, 'AZ': 130, 'AR': 90, 'CA': 220, 'CO': 180,
  'CT': 160, 'DE': 140, 'FL': 170, 'GA': 130, 'HI': 300, 'ID': 120,
  'IL': 160, 'IN': 110, 'IA': 100, 'KS': 100, 'KY': 110, 'LA': 130,
  'ME': 150, 'MD': 160, 'MA': 200, 'MI': 130, 'MN': 140, 'MS': 90,
  'MO': 110, 'MT': 130, 'NE': 100, 'NV': 150, 'NH': 150, 'NJ': 190,
  'NM': 120, 'NY': 220, 'NC': 140, 'ND': 100, 'OH': 120, 'OK': 100,
  'OR': 160, 'PA': 140, 'RI': 170, 'SC': 140, 'SD': 100, 'TN': 130,
  'TX': 140, 'UT': 150, 'VT': 160, 'VA': 150, 'WA': 180, 'WV': 100,
  'WI': 130, 'WY': 120, 'DC': 210,
};

export const DEFAULT_OBJECTIVE_WEIGHTS = {
  roi: 35,
  cashFlow: 30,
  risk: 20,
  workload: 15,
};

export const STRATEGY_COLORS = {
  flip: '#8b5cf6',
  ltr: '#10b981',
  str: '#f59e0b',
};

export const STRATEGY_LABELS = {
  flip: 'Fix & Flip',
  ltr: 'Long-Term Rental',
  str: 'Short-Term Rental',
};

export const RENOVATION_PHASES = {
  'teardown': [
    { phase: 'Planning & Permits', weeks: 4, costPct: 0.10 },
    { phase: 'Demolition', weeks: 2, costPct: 0.15 },
    { phase: 'Foundation/Structure', weeks: 6, costPct: 0.25 },
    { phase: 'Plumbing/Electrical', weeks: 4, costPct: 0.20 },
    { phase: 'Drywall/Insulation', weeks: 3, costPct: 0.10 },
    { phase: 'Flooring/Paint', weeks: 3, costPct: 0.15 },
    { phase: 'Final/Cleanup', weeks: 2, costPct: 0.05 },
  ],
  'poor': [
    { phase: 'Planning & Permits', weeks: 2, costPct: 0.10 },
    { phase: 'Major Repairs', weeks: 4, costPct: 0.35 },
    { phase: 'Plumbing/Electrical', weeks: 3, costPct: 0.25 },
    { phase: 'Flooring/Paint', weeks: 2, costPct: 0.25 },
    { phase: 'Final/Cleanup', weeks: 1, costPct: 0.05 },
  ],
  'fair': [
    { phase: 'Planning', weeks: 1, costPct: 0.10 },
    { phase: 'Updates/Repairs', weeks: 3, costPct: 0.50 },
    { phase: 'Cosmetic Work', weeks: 2, costPct: 0.35 },
    { phase: 'Final/Cleanup', weeks: 1, costPct: 0.05 },
  ],
  'good': [
    { phase: 'Planning', weeks: 1, costPct: 0.15 },
    { phase: 'Light Cosmetic', weeks: 2, costPct: 0.70 },
    { phase: 'Final/Cleanup', weeks: 1, costPct: 0.15 },
  ],
};
