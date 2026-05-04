export function calculateFlipROI(formData) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const renovationCost = parseFloat(formData.renovationCost) || 0;
  const expectedSellingPrice = parseFloat(formData.expectedSellingPrice) || 0;
  const sellingCostPercent = parseFloat(formData.sellingCosts) || 6;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const interestRate = parseFloat(formData.interestRate) || 7.5;
  const holdingPeriod = parseInt(formData.holdingPeriod) || 6;
  const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
  const closingCostPercent = parseFloat(formData.closingCosts) || 3;

  const downPayment = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPayment;
  const monthlyInterestRate = interestRate / 100 / 12;
  const loanTermYears = parseFloat(formData.loanTerm) || 30;
  const numberOfPayments = loanTermYears * 12;

  const monthlyPayment = loanAmount > 0 && monthlyInterestRate > 0
    ? loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
    : loanAmount > 0 ? loanAmount / numberOfPayments : 0;

  const closingCosts = (purchasePrice * closingCostPercent) / 100;
  const totalHoldingCosts = (monthlyPayment + monthlyExpenses) * holdingPeriod;
  const sellingCosts = (expectedSellingPrice * sellingCostPercent) / 100;
  const totalInvestment = downPayment + renovationCost + closingCosts + totalHoldingCosts;
  const netProfit = expectedSellingPrice - sellingCosts - purchasePrice - renovationCost - closingCosts - totalHoldingCosts;
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  const annualizedROI = holdingPeriod > 0 && (1 + roi / 100) > 0
    ? (Math.pow(1 + roi / 100, 12 / holdingPeriod) - 1) * 100
    : holdingPeriod > 0 ? -100 : 0;

  return annualizedROI;
}

export function calculateFlipBreakdown(formData) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const renovationCost = parseFloat(formData.renovationCost) || 0;
  const expectedSellingPrice = parseFloat(formData.expectedSellingPrice) || 0;
  const sellingCostPercent = parseFloat(formData.sellingCosts) || 6;
  const holdingPeriod = parseInt(formData.holdingPeriod) || 6;
  const closingCostPercent = parseFloat(formData.closingCosts) || 3;

  const revenue = expectedSellingPrice;
  const sellingCosts = (expectedSellingPrice * sellingCostPercent) / 100;
  const closingCosts = (purchasePrice * closingCostPercent) / 100;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const downPayment = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPayment;
  const interestRate = parseFloat(formData.interestRate) || 7.5;
  const monthlyInterestRate = interestRate / 100 / 12;
  const loanTermYears = parseFloat(formData.loanTerm) || 30;
  const numberOfPayments = loanTermYears * 12;

  const monthlyPayment = loanAmount > 0 && monthlyInterestRate > 0
    ? loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
    : loanAmount > 0 ? loanAmount / numberOfPayments : 0;

  const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
  const mortgagePayments = monthlyPayment * holdingPeriod;
  const otherHoldingCosts = monthlyExpenses * holdingPeriod;
  const totalHoldingCosts = mortgagePayments + otherHoldingCosts;

  return {
    revenue: {
      total: revenue,
      breakdown: [{ name: 'Sale Price', value: revenue }],
    },
    expenses: {
      purchasePrice,
      renovationCost,
      closingCosts,
      sellingCosts,
      mortgagePayments,
      otherHoldingCosts,
      total: purchasePrice + renovationCost + closingCosts + sellingCosts + totalHoldingCosts,
    },
  };
}
