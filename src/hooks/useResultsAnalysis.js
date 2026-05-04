import { useState, useEffect } from 'react';
import { EXPENSE_RATIOS, AVG_NIGHTLY_RATES_BY_LOCATION, RENOVATION_PHASES } from '../utils/constants/realEstateConstants';
import { calculateFlipROI } from '../utils/calculations/flipCalculations';
import { calculateRentalROI, calculateRemainingLoanBalance } from '../utils/calculations/rentalCalculations';

function formatCurrency(value) {
  if (!isFinite(value)) return '0';
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatPercent(value) {
  if (!isFinite(value)) return '0.0';
  return value.toFixed(1);
}

export { formatCurrency, formatPercent };

export function useResultsAnalysis(formData) {
  const [sensitivityInputs, setSensitivityInputs] = useState({
    purchasePrice: 0,
    renovationCost: 0,
    arv: 0,
    holdingPeriod: 0,
    interestRate: 0,
    monthlyRent: 0,
    occupancyRate: 0,
    nightlyRate: 0,
  });

  function estimateNightlyRate() {
    const location = formData.location || 'TX';
    const sqft = parseFloat(formData.houseSize) || 1500;
    const baseRate = AVG_NIGHTLY_RATES_BY_LOCATION[location] || 150;
    const sizeMultiplier = Math.max(0.8, Math.min(1.5, sqft / 1500));
    return Math.round(baseRate * sizeMultiplier);
  }

  useEffect(() => {
    if (formData) {
      setSensitivityInputs({
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        renovationCost: parseFloat(formData.renovationCost) || 0,
        arv: parseFloat(formData.expectedSellingPrice) || 0,
        holdingPeriod: parseFloat(formData.holdingPeriod) || 0,
        interestRate: parseFloat(formData.interestRate) || 0,
        monthlyRent: parseFloat(formData.expectedMonthlyRent) || 0,
        occupancyRate: parseFloat(formData.occupancyRate) || 65,
        nightlyRate: parseFloat(formData.nightlyRate) || estimateNightlyRate(),
      });
    }
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSensitivityChange = (name, value) => {
    setSensitivityInputs(prev => ({ ...prev, [name]: value }));
  };

  const flipROI = calculateFlipROI(formData);
  const rentalROI = calculateRentalROI(formData);

  const purchasePrice = sensitivityInputs.purchasePrice || parseFloat(formData.purchasePrice) || 0;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const downPayment = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPayment;
  const interestRate = sensitivityInputs.interestRate || parseFloat(formData.interestRate) || 0;
  const monthlyInterestRate = interestRate / 100 / 12;
  const numberOfPayments = (parseFloat(formData.loanTerm) || 30) * 12;
  const closingCostPercent = parseFloat(formData.closingCosts) || 3;
  const closingCosts = (purchasePrice * closingCostPercent) / 100;

  const monthlyPayment = loanAmount > 0 && monthlyInterestRate > 0
    ? loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
    : loanAmount > 0 ? loanAmount / numberOfPayments : 0;

  const renovationCost = sensitivityInputs.renovationCost || parseFloat(formData.renovationCost) || 0;
  const holdingPeriod = sensitivityInputs.holdingPeriod || parseFloat(formData.holdingPeriod) || 6;
  const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
  const totalHoldingCosts = (monthlyPayment + monthlyExpenses) * holdingPeriod;

  const expectedSellingPrice = sensitivityInputs.arv || parseFloat(formData.expectedSellingPrice) || 0;
  const sellingCostPercent = parseFloat(formData.sellingCosts) || 6;
  const sellingCosts = (expectedSellingPrice * sellingCostPercent) / 100;

  const totalInvestment = downPayment + renovationCost + closingCosts + totalHoldingCosts;
  const netProfit = expectedSellingPrice - sellingCosts - purchasePrice - renovationCost - closingCosts - totalHoldingCosts;
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

  const arvToPurchaseRatio = expectedSellingPrice / purchasePrice;
  const renovationToArvRatio = (renovationCost / expectedSellingPrice) * 100;
  const annualizedROI = holdingPeriod > 0 && (1 + roi / 100) > 0
    ? (Math.pow(1 + roi / 100, 12 / holdingPeriod) - 1) * 100
    : holdingPeriod > 0 ? -100 : 0;

  // LTR calculations
  const monthlyRent = sensitivityInputs.monthlyRent || parseFloat(formData.expectedMonthlyRent) || 0;
  const annualRent = monthlyRent * 12;
  const vacancyRate = parseFloat(formData.vacancyRate) || 8;
  const effectiveAnnualRent = annualRent * (1 - vacancyRate / 100);
  const propertyManagementFee = effectiveAnnualRent * (parseFloat(formData.propertyManagement) || 8) / 100;

  const propertyTaxAnnual = purchasePrice * EXPENSE_RATIOS.propertyTax;
  const insuranceAnnual = purchasePrice * EXPENSE_RATIOS.insurance;
  const maintenanceAnnual = purchasePrice * EXPENSE_RATIOS.maintenance;
  const utilitiesAnnual = purchasePrice * EXPENSE_RATIOS.utilities;
  const capexAnnual = monthlyRent * EXPENSE_RATIOS.capex * 12;

  const totalAnnualExpenses = propertyTaxAnnual + insuranceAnnual + maintenanceAnnual + utilitiesAnnual + capexAnnual + propertyManagementFee;
  const annualCashFlow = effectiveAnnualRent - totalAnnualExpenses - monthlyPayment * 12;
  const ltrCashOnCashReturn = (annualCashFlow / (downPayment + renovationCost + closingCosts)) * 100;

  // STR calculations
  const nightlyRate = sensitivityInputs.nightlyRate || parseFloat(formData.nightlyRate) || estimateNightlyRate();
  const occupancyRate = sensitivityInputs.occupancyRate || parseFloat(formData.occupancyRate) || 65;
  const annualStrRevenue = nightlyRate * 365 * (occupancyRate / 100);
  const strManagementFee = annualStrRevenue * (parseFloat(formData.strManagementFee) || 20) / 100;

  const strPropertyTaxAnnual = propertyTaxAnnual;
  const strInsuranceAnnual = insuranceAnnual * 1.5;
  const strMaintenanceAnnual = purchasePrice * EXPENSE_RATIOS.strMaintenance;
  const strUtilitiesAnnual = purchasePrice * EXPENSE_RATIOS.strUtilities;
  const strCapexAnnual = annualStrRevenue * EXPENSE_RATIOS.strCapex;
  const additionalStrExpenses = (parseFloat(formData.additionalStrExpenses) || 250) * 12;
  const strCleaningCosts = (parseFloat(formData.cleaningPerTurn) || 100) *
    Math.ceil(365 * (occupancyRate / 100) / (parseFloat(formData.averageStay) || 3));

  const totalStrAnnualExpenses = strPropertyTaxAnnual + strInsuranceAnnual + strMaintenanceAnnual +
    strUtilitiesAnnual + strCapexAnnual + strManagementFee + strCleaningCosts + additionalStrExpenses;
  const annualStrCashFlow = annualStrRevenue - totalStrAnnualExpenses - monthlyPayment * 12;
  const strCashOnCashReturn = (annualStrCashFlow / (downPayment + renovationCost + closingCosts)) * 100;

  // Deal quality
  const dealQuality = (() => {
    if (roi >= 30 && arvToPurchaseRatio >= 1.3 && renovationToArvRatio <= 20) return 'Excellent';
    if (roi >= 20 && arvToPurchaseRatio >= 1.2 && renovationToArvRatio <= 25) return 'Good';
    if (roi >= 10 && arvToPurchaseRatio >= 1.1 && renovationToArvRatio <= 30) return 'Fair';
    return 'Poor';
  })();

  // 5-year projections
  const annualAppreciationRate = parseFloat(formData.annualAppreciation) / 100 || 0.03;
  const futureValue = purchasePrice * Math.pow(1 + annualAppreciationRate, 5);
  const appreciationProfit = futureValue - purchasePrice;

  const remainingLoanBalance = calculateRemainingLoanBalance(loanAmount, monthlyInterestRate, numberOfPayments, 5 * 12);
  const loanPaydown = loanAmount - remainingLoanBalance;

  const futureSellingCosts = futureValue * sellingCostPercent / 100;
  const initialInvestment = downPayment + renovationCost + closingCosts;
  const rentalProfit = (annualCashFlow * 5) + appreciationProfit + loanPaydown - futureSellingCosts;
  const rentalROIValue = initialInvestment > 0 ? (rentalProfit / initialInvestment) * 100 : 0;
  const cashOnCashReturn = initialInvestment > 0 ? (annualCashFlow / initialInvestment) * 100 : 0;

  const strTotalProfit = (annualStrCashFlow * 5) + appreciationProfit + loanPaydown - futureSellingCosts;
  const strTotalROI = initialInvestment > 0 ? (strTotalProfit / initialInvestment) * 100 : 0;

  const ltrTotalROIAnnualized = (1 + rentalROIValue / 100) > 0
    ? (Math.pow(1 + rentalROIValue / 100, 1 / 5) - 1) * 100
    : -100;
  const strTotalROIAnnualized = (1 + strTotalROI / 100) > 0
    ? (Math.pow(1 + strTotalROI / 100, 1 / 5) - 1) * 100
    : -100;

  const monthlyCashFlow = annualCashFlow / 12;
  const capRate = (effectiveAnnualRent - totalAnnualExpenses) / purchasePrice * 100;

  // Cash flow projection data
  const cashFlowProjectionData = buildCashFlowProjection({
    effectiveAnnualRent, propertyTaxAnnual, insuranceAnnual, maintenanceAnnual,
    utilitiesAnnual, capexAnnual, monthlyPayment, formData,
    annualStrRevenue, strPropertyTaxAnnual, strInsuranceAnnual, strMaintenanceAnnual,
    strUtilitiesAnnual, strCapexAnnual, strCleaningCosts, additionalStrExpenses,
  });

  // ROI progression data
  const roiProgressionData = buildRoiProgression({
    cashFlowProjectionData, purchasePrice, annualAppreciationRate,
    loanAmount, monthlyInterestRate, numberOfPayments,
    initialInvestment, annualizedROI,
  });

  // Renovation timeline
  const renovationTimelineData = buildRenovationTimeline(formData, renovationCost);

  return {
    sensitivityInputs,
    handleSensitivityChange,
    estimateNightlyRate,
    flipROI, rentalROI,
    purchasePrice, downPayment, downPaymentPercent, loanAmount, monthlyInterestRate, numberOfPayments, monthlyPayment,
    renovationCost, holdingPeriod, monthlyExpenses, totalHoldingCosts, closingCosts,
    expectedSellingPrice, sellingCosts, totalInvestment, netProfit, roi,
    arvToPurchaseRatio, renovationToArvRatio, annualizedROI,
    monthlyRent, annualRent, vacancyRate, effectiveAnnualRent, propertyManagementFee,
    propertyTaxAnnual, insuranceAnnual, maintenanceAnnual, utilitiesAnnual, capexAnnual,
    totalAnnualExpenses, annualCashFlow, ltrCashOnCashReturn,
    nightlyRate, occupancyRate, annualStrRevenue, strManagementFee,
    strPropertyTaxAnnual, strInsuranceAnnual, strMaintenanceAnnual, strUtilitiesAnnual,
    strCapexAnnual, strCleaningCosts, additionalStrExpenses, totalStrAnnualExpenses, annualStrCashFlow, strCashOnCashReturn,
    dealQuality, annualAppreciationRate,
    appreciationProfit, loanPaydown, futureSellingCosts, rentalProfit, rentalROIValue,
    cashOnCashReturn, strTotalProfit, strTotalROI,
    ltrTotalROIAnnualized, strTotalROIAnnualized,
    monthlyCashFlow, capRate, initialInvestment,
    cashFlowProjectionData, roiProgressionData, renovationTimelineData,
    investmentBreakdown: [
      { name: 'Down Payment', value: downPayment },
      { name: 'Closing Costs', value: closingCosts },
      { name: 'Renovation', value: renovationCost },
      { name: 'Holding Costs', value: totalHoldingCosts },
    ],
  };
}

function buildCashFlowProjection({
  effectiveAnnualRent, propertyTaxAnnual, insuranceAnnual, maintenanceAnnual,
  utilitiesAnnual, capexAnnual, monthlyPayment, formData,
  annualStrRevenue, strPropertyTaxAnnual, strInsuranceAnnual, strMaintenanceAnnual,
  strUtilitiesAnnual, strCapexAnnual, strCleaningCosts, additionalStrExpenses,
}) {
  const annualRentIncrease = 0.025;
  const annualPropertyTaxIncrease = 0.02;
  const annualInsuranceIncrease = 0.04;
  const annualMaintenanceIncrease = 0.03;

  const data = [{ year: 'Year 0', ltr: 0, str: 0 }];

  for (let year = 1; year <= 5; year++) {
    const adjustedAnnualRent = effectiveAnnualRent * Math.pow(1 + annualRentIncrease, year - 1);
    const adjustedPropertyTaxAnnual = propertyTaxAnnual * Math.pow(1 + annualPropertyTaxIncrease, year - 1);
    const adjustedInsuranceAnnual = insuranceAnnual * Math.pow(1 + annualInsuranceIncrease, year - 1);
    const adjustedMaintenanceAnnual = maintenanceAnnual * Math.pow(1 + annualMaintenanceIncrease, year - 1);
    const adjustedPropertyManagementFee = (adjustedAnnualRent * (parseFloat(formData.propertyManagement) || 8) / 100);

    const ltrTotalExpenses = adjustedPropertyTaxAnnual + adjustedInsuranceAnnual + adjustedMaintenanceAnnual +
      utilitiesAnnual + capexAnnual + adjustedPropertyManagementFee + (monthlyPayment * 12);
    const ltrYearCashFlow = adjustedAnnualRent - ltrTotalExpenses;

    const adjustedStrRevenue = annualStrRevenue * Math.pow(1 + annualRentIncrease, year - 1);
    const adjustedStrPropertyTax = strPropertyTaxAnnual * Math.pow(1 + annualPropertyTaxIncrease, year - 1);
    const adjustedStrInsurance = strInsuranceAnnual * Math.pow(1 + annualInsuranceIncrease, year - 1);
    const adjustedStrMaintenance = strMaintenanceAnnual * Math.pow(1 + annualMaintenanceIncrease, year - 1);
    const adjustedStrManagementFee = adjustedStrRevenue * (parseFloat(formData.strManagementFee) || 20) / 100;

    const strTotalExpenses = adjustedStrPropertyTax + adjustedStrInsurance + adjustedStrMaintenance +
      strUtilitiesAnnual + strCapexAnnual + adjustedStrManagementFee +
      strCleaningCosts + additionalStrExpenses + (monthlyPayment * 12);
    const strYearCashFlow = adjustedStrRevenue - strTotalExpenses;

    data.push({
      year: `Year ${year}`,
      ltr: Math.round(ltrYearCashFlow),
      str: Math.round(strYearCashFlow),
    });
  }

  return data;
}

function buildRoiProgression({
  cashFlowProjectionData, purchasePrice, annualAppreciationRate,
  loanAmount, monthlyInterestRate, numberOfPayments,
  initialInvestment, annualizedROI,
}) {
  const data = [];
  let cumulativeLtrCashFlow = 0;
  let cumulativeStrCashFlow = 0;

  for (let year = 1; year <= 5; year++) {
    cumulativeLtrCashFlow += cashFlowProjectionData[year].ltr;
    cumulativeStrCashFlow += cashFlowProjectionData[year].str;

    const cumulativeAppreciation = purchasePrice * (Math.pow(1 + annualAppreciationRate, year) - 1);
    const balanceNow = calculateRemainingLoanBalance(loanAmount, monthlyInterestRate, numberOfPayments, year * 12);
    const cumulativePrincipalPaydown = loanAmount - balanceNow;

    const ltrCumulativeROI = initialInvestment > 0
      ? ((cumulativeLtrCashFlow + cumulativeAppreciation + cumulativePrincipalPaydown) / initialInvestment) * 100
      : 0;
    const strCumulativeROI = initialInvestment > 0
      ? ((cumulativeStrCashFlow + cumulativeAppreciation + cumulativePrincipalPaydown) / initialInvestment) * 100
      : 0;
    const flipCumulativeROI = year === 1 ? annualizedROI : data[0]?.flip || annualizedROI;

    data.push({
      year: `Year ${year}`,
      flip: Math.round(flipCumulativeROI * 100) / 100,
      ltr: Math.round(ltrCumulativeROI * 100) / 100,
      str: Math.round(strCumulativeROI * 100) / 100,
    });
  }

  return data;
}

function buildRenovationTimeline(formData, renovationCost) {
  const data = [];
  const condition = formData.houseCondition || 'fair';
  if (condition === '' && renovationCost <= 0) return data;

  const selectedPhases = RENOVATION_PHASES[condition] || RENOVATION_PHASES['fair'];

  let cumulativeWeeks = 0;
  let cumulativeCost = 0;

  selectedPhases.forEach(phase => {
    cumulativeWeeks += phase.weeks;
    cumulativeCost += renovationCost * phase.costPct;
    data.push({
      phase: phase.phase,
      weeks: cumulativeWeeks,
      cost: Math.round(cumulativeCost),
      weeklyProgress: Math.round((cumulativeWeeks / selectedPhases.reduce((sum, p) => sum + p.weeks, 0)) * 100),
    });
  });

  return data;
}
