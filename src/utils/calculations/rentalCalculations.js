import { EXPENSE_RATIOS } from '../constants/realEstateConstants';

export function calculateRentalROI(formData) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const renovationCost = parseFloat(formData.renovationCost) || 0;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const interestRate = parseFloat(formData.interestRate) || 7.5;
  const monthlyRent = parseFloat(formData.expectedMonthlyRent) || 0;
  const propertyTaxRate = parseFloat(formData.propertyTax) || 1.2;
  const insuranceRate = parseFloat(formData.insurance) || 0.5;
  const maintenanceRate = parseFloat(formData.maintenance) || 0.5;
  const propertyManagementPercent = parseFloat(formData.propertyManagement) || 8;
  const vacancyRate = parseFloat(formData.vacancyRate) || 8;
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

  const annualAppreciationRate = parseFloat(formData.annualAppreciation) / 100 || 0.03;
  const rentIncreaseRate = 0.02;
  const yearsToHold = 5;

  const futureValue = purchasePrice * Math.pow(1 + annualAppreciationRate, yearsToHold);
  const appreciationProfit = futureValue - purchasePrice;

  const remainingLoanBalance = calculateRemainingLoanBalance(
    loanAmount, monthlyInterestRate, numberOfPayments, yearsToHold * 12
  );
  const principalPaydown = loanAmount - remainingLoanBalance;

  const sellingCostPercent = parseFloat(formData.sellingCosts) || 6;
  const futureSellingCosts = futureValue * sellingCostPercent / 100;
  const closingCosts = (purchasePrice * closingCostPercent) / 100;

  let totalCashFlow = 0;
  for (let year = 0; year < yearsToHold; year++) {
    const adjustedAnnualRent = monthlyRent * Math.pow(1 + rentIncreaseRate, year) * 12;
    const effectiveAnnualRent = adjustedAnnualRent * (1 - vacancyRate / 100);
    const inflationRate = 0.02;
    const annualPropertyTax = purchasePrice * Math.pow(1 + inflationRate, year) * propertyTaxRate / 100;
    const annualInsurance = purchasePrice * (insuranceRate / 100) * Math.pow(1 + inflationRate, year);
    const annualMaintenance = purchasePrice * (maintenanceRate / 100) * Math.pow(1 + inflationRate, year);
    const annualPropertyManagement = effectiveAnnualRent * propertyManagementPercent / 100;

    const yearCashFlow = effectiveAnnualRent - annualPropertyTax - annualInsurance -
      annualMaintenance - annualPropertyManagement - (monthlyPayment * 12);

    totalCashFlow += yearCashFlow;
  }

  const initialInvestment = downPayment + renovationCost + closingCosts;
  const totalProfit = totalCashFlow + appreciationProfit + principalPaydown - futureSellingCosts;
  const totalROI = initialInvestment > 0 ? (totalProfit / initialInvestment) * 100 : 0;
  const annualizedROI = (1 + totalROI / 100) > 0
    ? (Math.pow(1 + totalROI / 100, 1 / yearsToHold) - 1) * 100
    : -100;

  return annualizedROI;
}

export function calculateStrBreakdown(formData, nightlyRate, occupancyRate) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;

  const annualRevenue = nightlyRate * 365 * (occupancyRate / 100);

  const propertyTax = purchasePrice * EXPENSE_RATIOS.propertyTax;
  const insurance = purchasePrice * EXPENSE_RATIOS.insurance * 1.5;
  const maintenance = purchasePrice * EXPENSE_RATIOS.strMaintenance;
  const utilities = purchasePrice * EXPENSE_RATIOS.strUtilities;
  const capex = annualRevenue * EXPENSE_RATIOS.strCapex;
  const managementFee = annualRevenue * (parseFloat(formData.strManagementFee) || 20) / 100;
  const cleaningFees = (parseFloat(formData.cleaningPerTurn) || 100) * Math.ceil(365 * (occupancyRate / 100) / (parseFloat(formData.averageStay) || 3));
  const additionalExpenses = (parseFloat(formData.additionalStrExpenses) || 250) * 12;

  return {
    revenue: {
      total: annualRevenue,
      breakdown: [
        { name: 'Nightly Revenue', value: annualRevenue },
        { name: 'Other Income', value: 0 },
      ],
    },
    expenses: {
      propertyTax,
      insurance,
      maintenance,
      utilities,
      capex,
      managementFee,
      cleaningFees,
      additionalExpenses,
      total: propertyTax + insurance + maintenance + utilities + capex + managementFee + cleaningFees + additionalExpenses,
    },
  };
}

export function calculateLtrBreakdown(formData, monthlyRent, vacancyRate) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;

  const annualRevenue = monthlyRent * 12;
  const effectiveRevenue = annualRevenue * (1 - vacancyRate / 100);

  const propertyTax = purchasePrice * EXPENSE_RATIOS.propertyTax;
  const insurance = purchasePrice * EXPENSE_RATIOS.insurance;
  const maintenance = purchasePrice * EXPENSE_RATIOS.maintenance;
  const utilities = purchasePrice * EXPENSE_RATIOS.utilities;
  const capex = monthlyRent * EXPENSE_RATIOS.capex * 12;
  const managementFee = effectiveRevenue * (parseFloat(formData.propertyManagementFee) || 10) / 100;
  const additionalExpenses = (parseFloat(formData.otherMonthlyExpenses) || 0) * 12;

  return {
    revenue: {
      total: effectiveRevenue,
      breakdown: [
        { name: 'Rental Income', value: annualRevenue },
        { name: 'Vacancy Loss', value: -annualRevenue * (vacancyRate / 100) },
      ],
    },
    expenses: {
      propertyTax,
      insurance,
      maintenance,
      utilities,
      capex,
      managementFee,
      additionalExpenses,
      total: propertyTax + insurance + maintenance + utilities + capex + managementFee + additionalExpenses,
    },
  };
}

function calculateRemainingLoanBalance(principal, monthlyRate, totalPayments, paymentsMade) {
  if (monthlyRate === 0) return principal > 0 ? principal * (1 - paymentsMade / totalPayments) : 0;
  return principal *
    (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, paymentsMade)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

export { calculateRemainingLoanBalance };
