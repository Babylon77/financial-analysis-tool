// ============================================================================
// US Tax Constants — 2026 Tax Year
// Sources: IRS Rev. Proc. 2025-32 (brackets, std deduction, cap gains, estate/
// gift), IRS Notice on 2026 retirement limits, SSA 2026 fact sheet, CMS 2026
// IRMAA. NIIT and Social Security taxation thresholds are statutory and NOT
// inflation-indexed.
// ============================================================================

export const TAX_CONSTANTS_YEAR = '2026';

// ============================================================================
// Federal Income Tax Brackets (2026)
// ============================================================================

export const FEDERAL_TAX_BRACKETS = {
  single: [
    { min: 0, max: 12400, rate: 0.10 },
    { min: 12400, max: 50400, rate: 0.12 },
    { min: 50400, max: 105700, rate: 0.22 },
    { min: 105700, max: 201775, rate: 0.24 },
    { min: 201775, max: 256225, rate: 0.32 },
    { min: 256225, max: 640600, rate: 0.35 },
    { min: 640600, max: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { min: 0, max: 24800, rate: 0.10 },
    { min: 24800, max: 100800, rate: 0.12 },
    { min: 100800, max: 211400, rate: 0.22 },
    { min: 211400, max: 403550, rate: 0.24 },
    { min: 403550, max: 512450, rate: 0.32 },
    { min: 512450, max: 768700, rate: 0.35 },
    { min: 768700, max: Infinity, rate: 0.37 },
  ],
  married_filing_separately: [
    { min: 0, max: 12400, rate: 0.10 },
    { min: 12400, max: 50400, rate: 0.12 },
    { min: 50400, max: 105700, rate: 0.22 },
    { min: 105700, max: 201775, rate: 0.24 },
    { min: 201775, max: 256225, rate: 0.32 },
    { min: 256225, max: 384350, rate: 0.35 },
    { min: 384350, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 17700, rate: 0.10 },
    { min: 17700, max: 67450, rate: 0.12 },
    { min: 67450, max: 105700, rate: 0.22 },
    { min: 105700, max: 201775, rate: 0.24 },
    { min: 201775, max: 256200, rate: 0.32 },
    { min: 256200, max: 640600, rate: 0.35 },
    { min: 640600, max: Infinity, rate: 0.37 },
  ],
};

// ============================================================================
// Long-Term Capital Gains Brackets (2026)
// ============================================================================

export const CAPITAL_GAINS_BRACKETS = {
  single: [
    { min: 0, max: 49450, rate: 0.00 },
    { min: 49450, max: 545500, rate: 0.15 },
    { min: 545500, max: Infinity, rate: 0.20 },
  ],
  married_filing_jointly: [
    { min: 0, max: 98900, rate: 0.00 },
    { min: 98900, max: 613700, rate: 0.15 },
    { min: 613700, max: Infinity, rate: 0.20 },
  ],
  married_filing_separately: [
    { min: 0, max: 49450, rate: 0.00 },
    { min: 49450, max: 306850, rate: 0.15 },
    { min: 306850, max: Infinity, rate: 0.20 },
  ],
  head_of_household: [
    { min: 0, max: 66200, rate: 0.00 },
    { min: 66200, max: 579600, rate: 0.15 },
    { min: 579600, max: Infinity, rate: 0.20 },
  ],
};

// ============================================================================
// Net Investment Income Tax (3.8%) — statutory, not inflation-indexed
// ============================================================================

export const NIIT_THRESHOLD = {
  rate: 0.038,
  single: 200000,
  married_filing_jointly: 250000,
  married_filing_separately: 125000,
  head_of_household: 200000,
};

// ============================================================================
// Social Security Tax Parameters (2026)
// ============================================================================

export const SOCIAL_SECURITY_TAX = {
  taxableWageBase: 184500,
  employeeRate: 0.062,
  employerRate: 0.062,
  selfEmployedRate: 0.124,

  taxablePercentages: [0, 0.50, 0.85],

  // Provisional-income thresholds are statutory (set in 1983/1993) and are NOT
  // inflation-indexed.
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
    // MFS taxpayers who lived with their spouse at any time during the year have
    // a $0 threshold — up to 85% of benefits are taxable from the first dollar.
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
    age62: 2969,
    fra: 4207,
    age70: 5181,
  },

  // Retirement Earnings Test exempt amounts (2026)
  earningsTest: {
    underFRA: 24480,
    yearOfFRA: 65160,
  },

  costOfLivingAdjustment: 0.028,
};

// ============================================================================
// Medicare IRMAA (Income-Related Monthly Adjustment Amount) — 2026
// Surcharges are the monthly add-on over the standard premium; income tiers use
// MAGI from 2 years prior (2024 for 2026).
// ============================================================================

export const MEDICARE_IRMAA = {
  standardPartBPremium: 202.90,

  single: [
    { min: 0, max: 109000, surcharge: 0 },
    { min: 109000, max: 137000, surcharge: 81.16 },
    { min: 137000, max: 171000, surcharge: 202.90 },
    { min: 171000, max: 205000, surcharge: 324.64 },
    { min: 205000, max: 500000, surcharge: 446.38 },
    { min: 500000, max: Infinity, surcharge: 486.96 },
  ],
  married_filing_jointly: [
    { min: 0, max: 218000, surcharge: 0 },
    { min: 218000, max: 274000, surcharge: 81.16 },
    { min: 274000, max: 342000, surcharge: 202.90 },
    { min: 342000, max: 410000, surcharge: 324.64 },
    { min: 410000, max: 750000, surcharge: 446.38 },
    { min: 750000, max: Infinity, surcharge: 486.96 },
  ],
  married_filing_separately: [
    { min: 0, max: 109000, surcharge: 0 },
    { min: 109000, max: 391000, surcharge: 446.38 },
    { min: 391000, max: Infinity, surcharge: 486.96 },
  ],
  head_of_household: [
    { min: 0, max: 109000, surcharge: 0 },
    { min: 109000, max: 137000, surcharge: 81.16 },
    { min: 137000, max: 171000, surcharge: 202.90 },
    { min: 171000, max: 205000, surcharge: 324.64 },
    { min: 205000, max: 500000, surcharge: 446.38 },
    { min: 500000, max: Infinity, surcharge: 486.96 },
  ],
};

// ============================================================================
// Medicare IRMAA Part D Surcharges (2026, same income tiers as Part B)
// ============================================================================

export const MEDICARE_IRMAA_PART_D = {
  single: [
    { min: 0, max: 109000, surcharge: 0 },
    { min: 109000, max: 137000, surcharge: 14.50 },
    { min: 137000, max: 171000, surcharge: 37.50 },
    { min: 171000, max: 205000, surcharge: 60.40 },
    { min: 205000, max: 500000, surcharge: 83.30 },
    { min: 500000, max: Infinity, surcharge: 91.00 },
  ],
  married_filing_jointly: [
    { min: 0, max: 218000, surcharge: 0 },
    { min: 218000, max: 274000, surcharge: 14.50 },
    { min: 274000, max: 342000, surcharge: 37.50 },
    { min: 342000, max: 410000, surcharge: 60.40 },
    { min: 410000, max: 750000, surcharge: 83.30 },
    { min: 750000, max: Infinity, surcharge: 91.00 },
  ],
  married_filing_separately: [
    { min: 0, max: 109000, surcharge: 0 },
    { min: 109000, max: 391000, surcharge: 83.30 },
    { min: 391000, max: Infinity, surcharge: 91.00 },
  ],
  head_of_household: [
    { min: 0, max: 109000, surcharge: 0 },
    { min: 109000, max: 137000, surcharge: 14.50 },
    { min: 137000, max: 171000, surcharge: 37.50 },
    { min: 171000, max: 205000, surcharge: 60.40 },
    { min: 205000, max: 500000, surcharge: 83.30 },
    { min: 500000, max: Infinity, surcharge: 91.00 },
  ],
};

// ============================================================================
// Required Minimum Distribution (RMD) — IRS Uniform Lifetime Table
// (Table values are not inflation-adjusted; current post-2022 table.)
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
// Contribution Limits (2026)
// ============================================================================

export const CONTRIBUTION_LIMITS = {
  traditional401k: 24500,
  roth401k: 24500,
  traditionalIRA: 7500,
  rothIRA: 7500,

  hsa: {
    single: 4400,
    family: 8750,
  },

  catchUp401k: 8000,
  catchUpIRA: 1100,
  catchUp401kSuperAge60to63: 11250,

  rothIRAIncomePhaseout: {
    single: { start: 153000, end: 168000 },
    married_filing_jointly: { start: 242000, end: 252000 },
    married_filing_separately: { start: 0, end: 10000 },
    head_of_household: { start: 153000, end: 168000 },
  },

  traditionalIRADeductionPhaseout: {
    single: { start: 81000, end: 91000 },
    married_filing_jointly: { start: 129000, end: 149000 },
    married_filing_separately: { start: 0, end: 10000 },
    head_of_household: { start: 81000, end: 91000 },
  },

  annualGiftExclusion: 19000,
};

// ============================================================================
// Estate Tax (2026)
// ============================================================================

export const ESTATE_TAX = {
  exemption: 15000000,
  topRate: 0.40,
  portabilityAllowed: true,
};

// ============================================================================
// Standard Deduction (2026)
// `additional` is the extra deduction per qualifying age-65+ taxpayer.
// ============================================================================

export const STANDARD_DEDUCTION = {
  single: { amount: 16100, additional: 2050 },
  married_filing_jointly: { amount: 32200, additional: 1650 },
  married_filing_separately: { amount: 16100, additional: 1650 },
  head_of_household: { amount: 24150, additional: 2050 },
};

// ============================================================================
// State Income Tax — Approximate Top Marginal Rates
// NOTE: These are top marginal rates applied as a flat rate; a simplification
// that overstates tax for graduated-rate states at lower incomes.
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
