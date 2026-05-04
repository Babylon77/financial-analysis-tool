// ============================================================================
// US Tax Constants — 2025 Tax Year
// ============================================================================

export const TAX_CONSTANTS_YEAR = '2025';

// ============================================================================
// Federal Income Tax Brackets
// ============================================================================

export const FEDERAL_TAX_BRACKETS = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  married_filing_separately: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
};

// ============================================================================
// Long-Term Capital Gains Brackets
// ============================================================================

export const CAPITAL_GAINS_BRACKETS = {
  single: [
    { min: 0, max: 47025, rate: 0.00 },
    { min: 47025, max: 518900, rate: 0.15 },
    { min: 518900, max: Infinity, rate: 0.20 },
  ],
  married_filing_jointly: [
    { min: 0, max: 94050, rate: 0.00 },
    { min: 94050, max: 583750, rate: 0.15 },
    { min: 583750, max: Infinity, rate: 0.20 },
  ],
  married_filing_separately: [
    { min: 0, max: 47025, rate: 0.00 },
    { min: 47025, max: 291850, rate: 0.15 },
    { min: 291850, max: Infinity, rate: 0.20 },
  ],
  head_of_household: [
    { min: 0, max: 63000, rate: 0.00 },
    { min: 63000, max: 551350, rate: 0.15 },
    { min: 551350, max: Infinity, rate: 0.20 },
  ],
};

// ============================================================================
// Net Investment Income Tax (3.8%)
// ============================================================================

export const NIIT_THRESHOLD = {
  rate: 0.038,
  single: 200000,
  married_filing_jointly: 250000,
  married_filing_separately: 125000,
  head_of_household: 200000,
};

// ============================================================================
// Social Security Tax Parameters
// ============================================================================

export const SOCIAL_SECURITY_TAX = {
  taxableWageBase: 168600,
  employeeRate: 0.062,
  employerRate: 0.062,
  selfEmployedRate: 0.124,

  taxablePercentages: [0, 0.50, 0.85],

  provisionalIncomeThresholds: {
    single: [
      { min: 0, max: 25000, taxablePercent: 0 },
      { min: 25000, max: 34000, taxablePercent: 0.50 },
      { min: 34000, max: Infinity, taxablePercent: 0.85 },
    ],
    married_filing_jointly: [
      { min: 0, max: 32000, taxablePercent: 0 },
      { min: 32000, max: 44000, taxablePercent: 0.50 },
      { min: 44000, max: Infinity, taxablePercent: 0.85 },
    ],
    married_filing_separately: [
      { min: 0, max: 0, taxablePercent: 0 },
      { min: 0, max: Infinity, taxablePercent: 0.85 },
    ],
    head_of_household: [
      { min: 0, max: 25000, taxablePercent: 0 },
      { min: 25000, max: 34000, taxablePercent: 0.50 },
      { min: 34000, max: Infinity, taxablePercent: 0.85 },
    ],
  },

  maxBenefit: {
    age62: 2710,
    fra: 3822,
    age70: 4873,
  },

  costOfLivingAdjustment: 0.032,
};

// ============================================================================
// Medicare IRMAA (Income-Related Monthly Adjustment Amount)
// ============================================================================

export const MEDICARE_IRMAA = {
  standardPartBPremium: 174.70,

  single: [
    { min: 0, max: 103000, surcharge: 0 },
    { min: 103000, max: 129000, surcharge: 69.90 },
    { min: 129000, max: 161000, surcharge: 174.70 },
    { min: 161000, max: 193000, surcharge: 279.50 },
    { min: 193000, max: 500000, surcharge: 384.30 },
    { min: 500000, max: Infinity, surcharge: 419.30 },
  ],
  married_filing_jointly: [
    { min: 0, max: 206000, surcharge: 0 },
    { min: 206000, max: 258000, surcharge: 69.90 },
    { min: 258000, max: 322000, surcharge: 174.70 },
    { min: 322000, max: 386000, surcharge: 279.50 },
    { min: 386000, max: 750000, surcharge: 384.30 },
    { min: 750000, max: Infinity, surcharge: 419.30 },
  ],
  married_filing_separately: [
    { min: 0, max: 103000, surcharge: 0 },
    { min: 103000, max: 397000, surcharge: 384.30 },
    { min: 397000, max: Infinity, surcharge: 419.30 },
  ],
  head_of_household: [
    { min: 0, max: 103000, surcharge: 0 },
    { min: 103000, max: 129000, surcharge: 69.90 },
    { min: 129000, max: 161000, surcharge: 174.70 },
    { min: 161000, max: 193000, surcharge: 279.50 },
    { min: 193000, max: 500000, surcharge: 384.30 },
    { min: 500000, max: Infinity, surcharge: 419.30 },
  ],
};

// ============================================================================
// Medicare IRMAA Part D Surcharges (same income tiers as Part B)
// ============================================================================

export const MEDICARE_IRMAA_PART_D = {
  single: [
    { min: 0, max: 103000, surcharge: 0 },
    { min: 103000, max: 129000, surcharge: 12.90 },
    { min: 129000, max: 161000, surcharge: 33.30 },
    { min: 161000, max: 193000, surcharge: 53.80 },
    { min: 193000, max: 500000, surcharge: 74.20 },
    { min: 500000, max: Infinity, surcharge: 81.00 },
  ],
  married_filing_jointly: [
    { min: 0, max: 206000, surcharge: 0 },
    { min: 206000, max: 258000, surcharge: 12.90 },
    { min: 258000, max: 322000, surcharge: 33.30 },
    { min: 322000, max: 386000, surcharge: 53.80 },
    { min: 386000, max: 750000, surcharge: 74.20 },
    { min: 750000, max: Infinity, surcharge: 81.00 },
  ],
  married_filing_separately: [
    { min: 0, max: 103000, surcharge: 0 },
    { min: 103000, max: 397000, surcharge: 74.20 },
    { min: 397000, max: Infinity, surcharge: 81.00 },
  ],
  head_of_household: [
    { min: 0, max: 103000, surcharge: 0 },
    { min: 103000, max: 129000, surcharge: 12.90 },
    { min: 129000, max: 161000, surcharge: 33.30 },
    { min: 161000, max: 193000, surcharge: 53.80 },
    { min: 193000, max: 500000, surcharge: 74.20 },
    { min: 500000, max: Infinity, surcharge: 81.00 },
  ],
};

// ============================================================================
// Required Minimum Distribution (RMD) — IRS Uniform Lifetime Table
// ============================================================================

export const RMD_TABLE = {
  72: 27.4,
  73: 26.5,
  74: 25.5,
  75: 24.6,
  76: 23.7,
  77: 22.9,
  78: 22.0,
  79: 21.1,
  80: 20.2,
  81: 19.4,
  82: 18.5,
  83: 17.7,
  84: 16.8,
  85: 16.0,
  86: 15.2,
  87: 14.4,
  88: 13.7,
  89: 12.9,
  90: 12.2,
  91: 11.5,
  92: 10.8,
  93: 10.1,
  94: 9.5,
  95: 8.9,
  96: 8.4,
  97: 7.8,
  98: 7.3,
  99: 6.8,
  100: 6.4,
  101: 6.0,
  102: 5.6,
  103: 5.2,
  104: 4.9,
  105: 4.6,
  106: 4.3,
  107: 4.1,
  108: 3.9,
  109: 3.7,
  110: 3.5,
  111: 3.4,
  112: 3.3,
  113: 3.1,
  114: 3.0,
  115: 2.9,
  116: 2.8,
  117: 2.7,
  118: 2.5,
  119: 2.3,
  120: 2.0,
};

// Joint Life and Last Survivor Table (used when sole beneficiary is spouse >10 years younger)
// Keyed by account owner age, value is distribution period assuming beneficiary is 10 years younger
export const JOINT_LIFE_TABLE = {
  72: 28.8,
  73: 27.8,
  74: 26.8,
  75: 25.9,
  76: 24.9,
  77: 24.0,
  78: 23.1,
  79: 22.2,
  80: 21.3,
  81: 20.4,
  82: 19.5,
  83: 18.7,
  84: 17.8,
  85: 17.0,
  86: 16.2,
  87: 15.4,
  88: 14.6,
  89: 13.8,
  90: 13.1,
  91: 12.4,
  92: 11.7,
  93: 11.0,
  94: 10.3,
  95: 9.7,
  96: 9.1,
  97: 8.5,
  98: 8.0,
  99: 7.5,
  100: 7.0,
  101: 6.5,
  102: 6.1,
  103: 5.7,
  104: 5.3,
  105: 5.0,
  106: 4.7,
  107: 4.4,
  108: 4.2,
  109: 3.9,
  110: 3.7,
  111: 3.5,
  112: 3.4,
  113: 3.2,
  114: 3.1,
  115: 2.9,
  116: 2.8,
  117: 2.7,
  118: 2.6,
  119: 2.4,
  120: 2.2,
};

// ============================================================================
// Contribution Limits (2025)
// ============================================================================

export const CONTRIBUTION_LIMITS = {
  traditional401k: 23500,
  roth401k: 23500,
  traditionalIRA: 7000,
  rothIRA: 7000,

  hsa: {
    single: 4300,
    family: 8550,
  },

  catchUp401k: 7500,
  catchUpIRA: 1000,
  catchUp401kSuperAge60to63: 11250,

  rothIRAIncomePhaseout: {
    single: { start: 146000, end: 161000 },
    married_filing_jointly: { start: 230000, end: 240000 },
    married_filing_separately: { start: 0, end: 10000 },
    head_of_household: { start: 146000, end: 161000 },
  },

  traditionalIRADeductionPhaseout: {
    single: { start: 77000, end: 87000 },
    married_filing_jointly: { start: 123000, end: 143000 },
    married_filing_separately: { start: 0, end: 10000 },
    head_of_household: { start: 77000, end: 87000 },
  },

  annualGiftExclusion: 18000,
};

// ============================================================================
// Estate Tax
// ============================================================================

export const ESTATE_TAX = {
  exemption: 13610000,
  topRate: 0.40,
  portabilityAllowed: true,
};

// ============================================================================
// Standard Deduction
// ============================================================================

export const STANDARD_DEDUCTION = {
  single: { amount: 15000, additional: 2000 },
  married_filing_jointly: { amount: 30000, additional: 1600 },
  married_filing_separately: { amount: 15000, additional: 1600 },
  head_of_household: { amount: 22500, additional: 2000 },
};

// ============================================================================
// State Income Tax — Top Marginal Rates (2024)
// States with no income tax are listed as 0.
// ============================================================================

export const STATE_TAX_RATES = {
  'AL': 0.050,
  'AK': 0.000,
  'AZ': 0.025,
  'AR': 0.044,
  'CA': 0.133,
  'CO': 0.044,
  'CT': 0.0699,
  'DE': 0.066,
  'FL': 0.000,
  'GA': 0.0549,
  'HI': 0.110,
  'ID': 0.058,
  'IL': 0.0495,
  'IN': 0.0315,
  'IA': 0.060,
  'KS': 0.057,
  'KY': 0.044,
  'LA': 0.0425,
  'ME': 0.0715,
  'MD': 0.0575,
  'MA': 0.090,
  'MI': 0.0425,
  'MN': 0.0985,
  'MS': 0.050,
  'MO': 0.048,
  'MT': 0.059,
  'NE': 0.0584,
  'NV': 0.000,
  'NH': 0.000,
  'NJ': 0.1075,
  'NM': 0.059,
  'NY': 0.109,
  'NC': 0.045,
  'ND': 0.0225,
  'OH': 0.035,
  'OK': 0.0475,
  'OR': 0.099,
  'PA': 0.0307,
  'RI': 0.0599,
  'SC': 0.064,
  'SD': 0.000,
  'TN': 0.000,
  'TX': 0.000,
  'UT': 0.0465,
  'VT': 0.0875,
  'VA': 0.0575,
  'WA': 0.000,
  'WV': 0.0512,
  'WI': 0.0765,
  'WY': 0.000,
  'DC': 0.1075,
};
