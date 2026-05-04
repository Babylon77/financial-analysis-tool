export function calculateFlipROI(formData) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const renovationCost = parseFloat(formData.renovationCost) || 0;
  const expectedSellingPrice = parseFloat(formData.expectedSellingPrice) || 0;
  const sellingCostPercent = parseFloat(formData.sellingCosts) || 8;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const interestRate = parseFloat(formData.interestRate) || 7.5;
  const holdingPeriod = parseInt(formData.holdingPeriod) || 6;
  const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;

  const downPayment = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPayment;
  const monthlyInterestRate = interestRate / 100 / 12;
  const loanTermYears = parseFloat(formData.loanTerm) || 30;
  const numberOfPayments = loanTermYears * 12;

  const monthlyPayment = loanAmount *
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

  const totalHoldingCosts = (monthlyPayment + monthlyExpenses) * holdingPeriod;
  const sellingCosts = (expectedSellingPrice * sellingCostPercent) / 100;
  const totalInvestment = downPayment + renovationCost + totalHoldingCosts;
  const netProfit = expectedSellingPrice - sellingCosts - purchasePrice - renovationCost - totalHoldingCosts;
  const roi = (netProfit / totalInvestment) * 100;
  const annualizedROI = (roi / holdingPeriod) * 12;

  return annualizedROI;
}

export function calculateFlipBreakdown(formData) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const renovationCost = parseFloat(formData.renovationCost) || 0;
  const expectedSellingPrice = parseFloat(formData.expectedSellingPrice) || 0;
  const sellingCostPercent = parseFloat(formData.sellingCosts) || 8;
  const holdingPeriod = parseInt(formData.holdingPeriod) || 6;

  const revenue = expectedSellingPrice;
  const sellingCosts = (expectedSellingPrice * sellingCostPercent) / 100;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const downPayment = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPayment;
  const interestRate = parseFloat(formData.interestRate) || 7.5;
  const monthlyInterestRate = interestRate / 100 / 12;
  const loanTermYears = parseFloat(formData.loanTerm) || 30;
  const numberOfPayments = loanTermYears * 12;

  const monthlyPayment = loanAmount *
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

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
      sellingCosts,
      mortgagePayments,
      otherHoldingCosts,
      total: purchasePrice + renovationCost + sellingCosts + totalHoldingCosts,
    },
  };
}
