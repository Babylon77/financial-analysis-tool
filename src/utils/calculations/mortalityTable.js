// ============================================================================
// Mortality Table — SSA 2021 Period Life Table (simplified)
// Ages 40-110, probability of death within one year (qx)
// ============================================================================

const MORTALITY_MALE = {
  40: 0.00183, 41: 0.00197, 42: 0.00213, 43: 0.00232, 44: 0.00256,
  45: 0.00289, 46: 0.00320, 47: 0.00351, 48: 0.00383, 49: 0.00419,
  50: 0.00478, 51: 0.00520, 52: 0.00564, 53: 0.00612, 54: 0.00670,
  55: 0.00753, 56: 0.00815, 57: 0.00880, 58: 0.00948, 59: 0.01020,
  60: 0.01101, 61: 0.01195, 62: 0.01289, 63: 0.01383, 64: 0.01477,
  65: 0.01571, 66: 0.01681, 67: 0.01792, 68: 0.01918, 69: 0.02044,
  70: 0.02171, 71: 0.02329, 72: 0.02487, 73: 0.02680, 74: 0.02906,
  75: 0.03132, 76: 0.03377, 77: 0.03621, 78: 0.03935, 79: 0.04320,
  80: 0.04754, 81: 0.05177, 82: 0.05600, 83: 0.06108, 84: 0.06700,
  85: 0.07293, 86: 0.07997, 87: 0.08700, 88: 0.09500, 89: 0.10420,
  90: 0.11475, 91: 0.12488, 92: 0.13500, 93: 0.14600, 94: 0.15900,
  95: 0.17652, 96: 0.19076, 97: 0.20500, 98: 0.22000, 99: 0.24000,
  100: 0.26316, 101: 0.28500, 102: 0.31000, 103: 0.33500, 104: 0.36500,
  105: 0.40000, 106: 0.42500, 107: 0.44500, 108: 0.46500, 109: 0.48500,
  110: 0.50000,
};

const MORTALITY_FEMALE = {
  40: 0.00109, 41: 0.00118, 42: 0.00127, 43: 0.00137, 44: 0.00150,
  45: 0.00168, 46: 0.00186, 47: 0.00204, 48: 0.00223, 49: 0.00244,
  50: 0.00275, 51: 0.00299, 52: 0.00325, 53: 0.00354, 54: 0.00388,
  55: 0.00432, 56: 0.00468, 57: 0.00508, 58: 0.00551, 59: 0.00597,
  60: 0.00652, 61: 0.00711, 62: 0.00770, 63: 0.00838, 64: 0.00914,
  65: 0.00998, 66: 0.01082, 67: 0.01175, 68: 0.01282, 69: 0.01404,
  70: 0.01541, 71: 0.01685, 72: 0.01845, 73: 0.02030, 74: 0.02238,
  75: 0.02470, 76: 0.02710, 77: 0.02975, 78: 0.03285, 79: 0.03638,
  80: 0.04034, 81: 0.04440, 82: 0.04890, 83: 0.05410, 84: 0.06000,
  85: 0.06658, 86: 0.07360, 87: 0.08120, 88: 0.08980, 89: 0.09980,
  90: 0.11100, 91: 0.12200, 92: 0.13400, 93: 0.14700, 94: 0.16200,
  95: 0.17800, 96: 0.19500, 97: 0.21200, 98: 0.23100, 99: 0.25200,
  100: 0.27500, 101: 0.29800, 102: 0.32200, 103: 0.34800, 104: 0.37600,
  105: 0.40500, 106: 0.43000, 107: 0.45000, 108: 0.47000, 109: 0.49000,
  110: 0.50000,
};

function getMortalityTable(gender) {
  return gender === 'female' ? MORTALITY_FEMALE : MORTALITY_MALE;
}

// Interpolate qx for any age (including fractional) from the sparse table
function getQx(age, gender) {
  const table = getMortalityTable(gender);
  const floorAge = Math.floor(age);

  if (floorAge >= 110) return table[110];
  if (floorAge < 40) {
    // Below our table range — use a conservative low estimate
    return gender === 'female' ? 0.0005 : 0.0008;
  }

  const qx = table[floorAge];
  if (qx !== undefined) return qx;

  // Shouldn't happen with the full table above, but guard against gaps
  const ages = Object.keys(table).map(Number).sort((a, b) => a - b);
  let lower = ages[0];
  let upper = ages[ages.length - 1];

  for (let i = 0; i < ages.length - 1; i++) {
    if (ages[i] <= floorAge && ages[i + 1] > floorAge) {
      lower = ages[i];
      upper = ages[i + 1];
      break;
    }
  }

  const fraction = (floorAge - lower) / (upper - lower);
  return table[lower] + fraction * (table[upper] - table[lower]);
}

// ── Survival Probability ──
// Probability of surviving from currentAge to targetAge
export function survivalProbability(currentAge, targetAge, gender = 'male') {
  if (targetAge <= currentAge) return 1.0;
  if (currentAge >= 110) return 0.0;

  let survival = 1.0;
  for (let age = Math.floor(currentAge); age < Math.floor(targetAge); age++) {
    const qx = getQx(age, gender);
    survival *= (1 - qx);
    if (survival <= 0) return 0;
  }

  return survival;
}

// ── Random Death Age ──
// Stochastic draw from the mortality distribution for Monte Carlo use
export function randomDeathAge(currentAge, gender = 'male') {
  const startAge = Math.floor(currentAge);

  for (let age = startAge; age <= 120; age++) {
    const qx = getQx(Math.min(age, 110), gender);
    if (Math.random() < qx) {
      return age;
    }
  }

  // Absolute cap — everyone dies by 120
  return 120;
}

// ── Life Expectancy ──
// Expected remaining years from currentAge
export function lifeExpectancy(currentAge, gender = 'male') {
  let expectation = 0;
  let survival = 1.0;
  const startAge = Math.floor(currentAge);

  for (let age = startAge; age <= 120; age++) {
    const qx = getQx(Math.min(age, 110), gender);
    // Add the probability of surviving to this age (contributes 1 year to expectation)
    expectation += survival;
    survival *= (1 - qx);
    if (survival < 1e-10) break;
  }

  // Subtract the starting year (we want remaining years, not total)
  // expectation already counts each year of survival from startAge forward
  // The first term (survival=1.0 at startAge) counts the current year,
  // so remaining life expectancy = expectation - 1 (the current partial year)
  return Math.max(0, expectation - 1);
}

// ── Longevity Percentiles ──
// Returns ages at which X% of the cohort has died
// p90 means "10% of people live past this age" (90th percentile of death)
export function longevityPercentiles(currentAge, gender = 'male') {
  const startAge = Math.floor(currentAge);
  const cumulativeDeaths = [];
  let survival = 1.0;

  for (let age = startAge; age <= 120; age++) {
    const qx = getQx(Math.min(age, 110), gender);
    const deathsThisYear = survival * qx;
    survival *= (1 - qx);
    cumulativeDeaths.push({
      age,
      cumulativeDeath: 1 - survival,
    });

    if (survival < 1e-10) break;
  }

  function findPercentileAge(percentile) {
    for (const entry of cumulativeDeaths) {
      if (entry.cumulativeDeath >= percentile) {
        return entry.age;
      }
    }
    return 120;
  }

  return {
    p10: findPercentileAge(0.10),
    p25: findPercentileAge(0.25),
    p50: findPercentileAge(0.50),
    p75: findPercentileAge(0.75),
    p90: findPercentileAge(0.90),
  };
}
