import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line,
  LineChart,
  Area,
  AreaChart,
} from 'recharts';

// Renovation cost constants
const RENOVATION_COST_ESTIMATES = {
  teardown: { base: 100, range: [80, 150] },
  poor: { base: 60, range: [50, 80] },
  fair: { base: 35, range: [25, 45] },
  good: { base: 15, range: [10, 25] }
};

// Regional cost multipliers
const REGIONAL_MULTIPLIERS = {
  'AL': 0.85, 'AK': 1.25, 'AZ': 0.95, 'AR': 0.85, 'CA': 1.35, 'CO': 1.10, 
  'CT': 1.15, 'DE': 1.05, 'FL': 0.95, 'GA': 0.90, 'HI': 1.40, 'ID': 0.90,
  'IL': 1.05, 'IN': 0.90, 'IA': 0.90, 'KS': 0.90, 'KY': 0.90, 'LA': 0.90,
  'ME': 1.00, 'MD': 1.10, 'MA': 1.25, 'MI': 1.00, 'MN': 1.05, 'MS': 0.85,
  'MO': 0.90, 'MT': 0.95, 'NE': 0.90, 'NV': 1.05, 'NH': 1.05, 'NJ': 1.20,
  'NM': 0.90, 'NY': 1.35, 'NC': 0.90, 'ND': 0.95, 'OH': 0.95, 'OK': 0.85,
  'OR': 1.10, 'PA': 1.05, 'RI': 1.15, 'SC': 0.90, 'SD': 0.90, 'TN': 0.90,
  'TX': 0.90, 'UT': 0.95, 'VT': 1.05, 'VA': 1.00, 'WA': 1.15, 'WV': 0.90,
  'WI': 1.00, 'WY': 0.95, 'DC': 1.30
};

// DIY discount factors
const DIY_FACTORS = {
  'significant': 0.6, // 40% savings
  'minimal': 0.85,    // 15% savings
  'gc': 0.9,          // 10% savings with you as GC
  'none': 1.0         // No savings
};

function formatCurrency(value) {
  return value.toLocaleString(undefined, {maximumFractionDigits: 0});
}

function formatPercent(value) {
  return value.toFixed(1);
}

// Industry standard expense ratios for rental properties
const EXPENSE_RATIOS = {
  propertyTax: 0.012, // 1.2% of property value annually
  insurance: 0.005, // 0.5% of property value annually
  maintenance: 0.01, // 1% of property value annually for LTR
  strMaintenance: 0.015, // 1.5% of property value annually for STR
  utilities: 0.005, // 0.5% of property value annually for LTR
  strUtilities: 0.02, // 2% of property value annually for STR
  capex: 0.05, // 5% of monthly rent for long-term rentals
  strCapex: 0.08, // 8% of monthly revenue for short-term rentals
};

// Average nightly rates by state (placeholder - would be pulled from API in production)
const AVG_NIGHTLY_RATES_BY_LOCATION = {
  'AL': 100, 'AK': 150, 'AZ': 130, 'AR': 90, 'CA': 220, 'CO': 180, 
  'CT': 160, 'DE': 140, 'FL': 170, 'GA': 130, 'HI': 300, 'ID': 120,
  'IL': 160, 'IN': 110, 'IA': 100, 'KS': 100, 'KY': 110, 'LA': 130,
  'ME': 150, 'MD': 160, 'MA': 200, 'MI': 130, 'MN': 140, 'MS': 90,
  'MO': 110, 'MT': 130, 'NE': 100, 'NV': 150, 'NH': 150, 'NJ': 190,
  'NM': 120, 'NY': 220, 'NC': 140, 'ND': 100, 'OH': 120, 'OK': 100,
  'OR': 160, 'PA': 140, 'RI': 170, 'SC': 140, 'SD': 100, 'TN': 130,
  'TX': 140, 'UT': 150, 'VT': 160, 'VA': 150, 'WA': 180, 'WV': 100,
  'WI': 130, 'WY': 120, 'DC': 210
};

// MODA Weights for different objectives
const DEFAULT_OBJECTIVE_WEIGHTS = {
  roi: 35,
  cashFlow: 30,
  risk: 20,
  workload: 15
};

// Function to calculate Flip ROI
function calculateFlipROI(formData) {
  // Parse necessary values
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const renovationCost = parseFloat(formData.renovationCost) || 0;
  const expectedSellingPrice = parseFloat(formData.expectedSellingPrice) || 0;
  const sellingCostPercent = parseFloat(formData.sellingCosts) || 8;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const interestRate = parseFloat(formData.interestRate) || 7.5;
  const holdingPeriod = parseInt(formData.holdingPeriod) || 6;
  const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
  
  // Calculate downPayment and other values
  const downPayment = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPayment;
  const monthlyInterestRate = interestRate / 100 / 12;
  const loanTermYears = parseFloat(formData.loanTerm) || 30;
  const numberOfPayments = loanTermYears * 12;
  
  // Calculate monthly mortgage payment
  const monthlyPayment = loanAmount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  // Calculate holding costs
  const totalHoldingCosts = (monthlyPayment + monthlyExpenses) * holdingPeriod;
  
  // Calculate selling costs and profit
  const sellingCosts = (expectedSellingPrice * sellingCostPercent) / 100;
  
  // Total cash invested: down payment + renovation + holding costs
  const totalInvestment = downPayment + renovationCost + totalHoldingCosts;
  
  // Net profit: sale price - selling costs - purchase price - renovation - holding costs
  const netProfit = expectedSellingPrice - sellingCosts - purchasePrice - renovationCost - totalHoldingCosts;
  
  // Calculate ROI
  const roi = (netProfit / totalInvestment) * 100;
  
  // Calculate annualized ROI
  const annualizedROI = (roi / holdingPeriod) * 12;
  
  // Return the annualized ROI for better comparison with rental strategies
  return annualizedROI;
}

// Function to calculate Rental ROI
function calculateRentalROI(formData) {
  // Parse necessary values
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const renovationCost = parseFloat(formData.renovationCost) || 0;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const interestRate = parseFloat(formData.interestRate) || 7.5;
  const monthlyRent = parseFloat(formData.expectedMonthlyRent) || 0;
  const propertyTaxRate = parseFloat(formData.propertyTaxRate) || 1.2; // Default 1.2% of property value annually
  const insuranceCost = parseFloat(formData.insuranceCost) || (purchasePrice * 0.005); // Default 0.5% of property value
  const maintenancePercent = parseFloat(formData.maintenancePercent) || 5; // Default 5% of rent
  const propertyManagementPercent = parseFloat(formData.propertyManagementPercent) || 8; // Default 8% of rent
  const vacancyRate = parseFloat(formData.vacancyRate) || 8; // Default 8% vacancy
  const otherMonthlyExpenses = parseFloat(formData.otherMonthlyExpenses) || 0;
  
  // Calculate downPayment
  const downPayment = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPayment;
  const monthlyInterestRate = interestRate / 100 / 12;
  const loanTermYears = parseFloat(formData.loanTerm) || 30;
  const numberOfPayments = loanTermYears * 12;
  
  // Calculate monthly mortgage payment
  const monthlyPayment = loanAmount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  // Define constants for rental analysis
  const annualAppreciationRate = parseFloat(formData.appreciationRate) / 100 || 0.03; // Default 3% annual appreciation
  const rentIncreaseRate = 0.02; // 2% annual rent increase
  const yearsToHold = 5; // 5-year analysis period
  
  // Calculate monthly income and expenses
  const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate / 100);
  const monthlyPropertyTax = (purchasePrice * propertyTaxRate / 100) / 12;
  const monthlyInsurance = insuranceCost / 12;
  const monthlyMaintenance = monthlyRent * maintenancePercent / 100;
  const monthlyPropertyManagement = effectiveMonthlyRent * propertyManagementPercent / 100;
  
  // Calculate monthly cash flow
  const monthlyCashFlow = effectiveMonthlyRent - monthlyPropertyTax - monthlyInsurance - 
                         monthlyMaintenance - monthlyPropertyManagement - 
                         monthlyPayment - otherMonthlyExpenses;
  
  // Calculate annual cash flow
  const annualCashFlow = monthlyCashFlow * 12;
  
  // Calculate cash on cash return (first year)
  const cashOnCashReturn = (annualCashFlow / (downPayment + renovationCost)) * 100;
  
  // Calculate future property value after 5 years
  const futureValue = purchasePrice * Math.pow(1 + annualAppreciationRate, yearsToHold);
  const appreciationProfit = futureValue - purchasePrice;
  
  // Calculate remaining loan balance after 5 years
  function calculateRemainingLoanBalance(principal, monthlyRate, totalPayments, paymentsMade) {
    return principal * 
      (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, paymentsMade)) / 
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
  }
  
  const remainingLoanBalance = calculateRemainingLoanBalance(
    loanAmount,
    monthlyInterestRate,
    numberOfPayments,
    yearsToHold * 12
  );
  
  // Calculate principal paydown (equity buildup through loan payments)
  const principalPaydown = loanAmount - remainingLoanBalance;
  
  // Calculate selling costs after 5 years
  const sellingCostPercent = parseFloat(formData.sellingCosts) || 6;
  const futureSellingCosts = futureValue * sellingCostPercent / 100;
  
  // Calculate total cash flow over 5 years (accounting for rent increases)
  let totalCashFlow = 0;
  for (let year = 0; year < yearsToHold; year++) {
    // Adjust rent by annual increase
    const adjustedAnnualRent = monthlyRent * Math.pow(1 + rentIncreaseRate, year) * 12;
    // Adjust for vacancy
    const effectiveAnnualRent = adjustedAnnualRent * (1 - vacancyRate / 100);
    // Calculate expenses (assuming some expenses like property tax and insurance increase with inflation)
    const inflationRate = 0.02; // 2% annual inflation
    const annualPropertyTax = (purchasePrice * Math.pow(1 + inflationRate, year) * propertyTaxRate / 100);
    const annualInsurance = (insuranceCost * Math.pow(1 + inflationRate, year));
    const annualMaintenance = (adjustedAnnualRent * maintenancePercent / 100);
    const annualPropertyManagement = (effectiveAnnualRent * propertyManagementPercent / 100);
    const annualOtherExpenses = (otherMonthlyExpenses * 12 * Math.pow(1 + inflationRate, year));
    
    // Annual cash flow for this year
    const yearCashFlow = effectiveAnnualRent - annualPropertyTax - annualInsurance - 
                        annualMaintenance - annualPropertyManagement - 
                        (monthlyPayment * 12) - annualOtherExpenses;
    
    totalCashFlow += yearCashFlow;
  }
  
  // Calculate total profit from rental + sale
  const initialInvestment = downPayment + renovationCost;
  const totalProfit = totalCashFlow + appreciationProfit + principalPaydown - futureSellingCosts;
  
  // Calculate ROI over 5 years
  const totalROI = (totalProfit / initialInvestment) * 100;
  
  // Calculate annualized ROI
  const annualizedROI = totalROI / yearsToHold;
  
  return annualizedROI;
}

// Function to calculate STR revenue and expenses breakdown
function calculateStrBreakdown(formData, nightlyRate, occupancyRate) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  
  // Calculate annual revenue
  const annualRevenue = nightlyRate * 365 * (occupancyRate / 100);
  
  // Calculate expenses
  const propertyTax = purchasePrice * EXPENSE_RATIOS.propertyTax;
  const insurance = purchasePrice * EXPENSE_RATIOS.insurance * 1.5; // Higher for STR
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
        { name: 'Other Income', value: 0 } // Placeholder for additional revenue streams
      ]
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
      total: propertyTax + insurance + maintenance + utilities + capex + managementFee + cleaningFees + additionalExpenses
    }
  };
}

// Function to calculate LTR revenue and expenses breakdown
function calculateLtrBreakdown(formData, monthlyRent, vacancyRate) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  
  // Calculate annual revenue
  const annualRevenue = monthlyRent * 12;
  const effectiveRevenue = annualRevenue * (1 - vacancyRate / 100);
  
  // Calculate expenses
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
        { name: 'Vacancy Loss', value: -annualRevenue * (vacancyRate / 100) } 
      ]
    },
    expenses: {
      propertyTax,
      insurance,
      maintenance,
      utilities,
      capex,
      managementFee,
      additionalExpenses,
      total: propertyTax + insurance + maintenance + utilities + capex + managementFee + additionalExpenses
    }
  };
}

// Function to calculate Flip revenue and expenses breakdown
function calculateFlipBreakdown(formData) {
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const renovationCost = parseFloat(formData.renovationCost) || 0;
  const expectedSellingPrice = parseFloat(formData.expectedSellingPrice) || 0;
  const sellingCostPercent = parseFloat(formData.sellingCosts) || 8;
  const holdingPeriod = parseInt(formData.holdingPeriod) || 6;
  
  // Calculate revenue
  const revenue = expectedSellingPrice;
  
  // Calculate expenses
  const sellingCosts = (expectedSellingPrice * sellingCostPercent) / 100;
  const downPaymentPercent = parseFloat(formData.downPayment) || 20;
  const downPayment = (purchasePrice * downPaymentPercent) / 100;
  const loanAmount = purchasePrice - downPayment;
  const interestRate = parseFloat(formData.interestRate) || 7.5;
  const monthlyInterestRate = interestRate / 100 / 12;
  const loanTermYears = parseFloat(formData.loanTerm) || 30;
  const numberOfPayments = loanTermYears * 12;
  
  // Calculate monthly mortgage payment
  const monthlyPayment = loanAmount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  const monthlyExpenses = parseFloat(formData.monthlyExpenses) || 0;
  
  // Calculate holding costs
  const mortgagePayments = monthlyPayment * holdingPeriod;
  const otherHoldingCosts = monthlyExpenses * holdingPeriod;
  const totalHoldingCosts = mortgagePayments + otherHoldingCosts;
  
  return {
    revenue: {
      total: revenue,
      breakdown: [
        { name: 'Sale Price', value: revenue }
      ]
    },
    expenses: {
      purchasePrice,
      renovationCost,
      sellingCosts,
      mortgagePayments,
      otherHoldingCosts,
      total: purchasePrice + renovationCost + sellingCosts + totalHoldingCosts
    }
  };
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const formData = location.state?.formData || {};
  
  // Strategy recommendation logic
  const flipROI = calculateFlipROI(formData);
  const rentalROI = calculateRentalROI(formData);
  const initialRecommendedStrategy = flipROI > rentalROI ? 'flip' : 'rental';
  const initialStrategyLabels = {
    'flip': 'Fix & Flip',
    'rental': 'Buy & Hold'
  };
  
  // State for sensitivity analysis
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
  
  // State for MODA analysis
  const [objectiveWeights, setObjectiveWeights] = useState(DEFAULT_OBJECTIVE_WEIGHTS);
  const [selectedStrategy, setSelectedStrategy] = useState('all');

  useEffect(() => {
    // Initialize with some reasonable values for sensitivity analysis
    if (formData) {
      setSensitivityInputs({
        purchasePrice: parseFloat(formData.purchasePrice),
        renovationCost: parseFloat(formData.renovationCost),
        arv: parseFloat(formData.expectedSellingPrice),
        holdingPeriod: parseFloat(formData.holdingPeriod),
        interestRate: parseFloat(formData.interestRate),
        monthlyRent: parseFloat(formData.expectedMonthlyRent) || 0,
        occupancyRate: parseFloat(formData.occupancyRate) || 65,
        nightlyRate: parseFloat(formData.nightlyRate) || estimateNightlyRate(),
      });
    }
  }, [formData]);

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
            No calculation data available
            </h2>
            <button
            onClick={() => navigate('/calculator')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Calculator
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estimate nightly rate based on location and property size if not provided
  function estimateNightlyRate() {
    const location = formData.location || 'TX';
    const sqft = parseFloat(formData.houseSize) || 1500;
    
    // Base nightly rate from state averages
    const baseRate = AVG_NIGHTLY_RATES_BY_LOCATION[location] || 150;
    
    // Adjust for property size (larger properties have higher rates)
    const sizeMultiplier = Math.max(0.8, Math.min(1.5, sqft / 1500));
    
    return Math.round(baseRate * sizeMultiplier);
  }

  // Basic flip calculations
  const purchasePrice = sensitivityInputs.purchasePrice || parseFloat(formData.purchasePrice);
  const downPayment = (purchasePrice * parseFloat(formData.downPayment)) / 100;
  const loanAmount = purchasePrice - downPayment;
  const monthlyInterestRate = (sensitivityInputs.interestRate || parseFloat(formData.interestRate)) / 100 / 12;
  const numberOfPayments = parseFloat(formData.loanTerm) * 12;
  const monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  const renovationCost = sensitivityInputs.renovationCost || parseFloat(formData.renovationCost);
  const holdingPeriod = sensitivityInputs.holdingPeriod || parseFloat(formData.holdingPeriod);
  const monthlyExpenses = parseFloat(formData.monthlyExpenses);
  const totalHoldingCosts = (monthlyPayment + monthlyExpenses) * holdingPeriod;
  
  const expectedSellingPrice = sensitivityInputs.arv || parseFloat(formData.expectedSellingPrice);
  const sellingCosts = (expectedSellingPrice * parseFloat(formData.sellingCosts)) / 100;
  
  const totalInvestment = downPayment + renovationCost + totalHoldingCosts;
  const netProfit = expectedSellingPrice - sellingCosts - purchasePrice - renovationCost - totalHoldingCosts;
  const roi = (netProfit / totalInvestment) * 100;

  // Key metrics for house flipping
  const arvToPurchaseRatio = expectedSellingPrice / purchasePrice;
  const renovationToArvRatio = (renovationCost / expectedSellingPrice) * 100;
  const annualizedROI = (roi / holdingPeriod) * 12;

  // Long-term rental calculations
  const monthlyRent = sensitivityInputs.monthlyRent || parseFloat(formData.expectedMonthlyRent) || 0;
  const annualRent = monthlyRent * 12;
  const vacancyRate = parseFloat(formData.vacancyRate) || 8;
  const effectiveAnnualRent = annualRent * (1 - vacancyRate / 100);
  const propertyManagementFee = effectiveAnnualRent * (parseFloat(formData.propertyManagementFee) || 10) / 100;
  
  // Calculate annual expenses for LTR
  const propertyTaxAnnual = purchasePrice * EXPENSE_RATIOS.propertyTax;
  const insuranceAnnual = purchasePrice * EXPENSE_RATIOS.insurance;
  const maintenanceAnnual = purchasePrice * EXPENSE_RATIOS.maintenance;
  const utilitiesAnnual = purchasePrice * EXPENSE_RATIOS.utilities;
  const capexAnnual = monthlyRent * EXPENSE_RATIOS.capex * 12;
  
  const totalAnnualExpenses = propertyTaxAnnual + insuranceAnnual + maintenanceAnnual + utilitiesAnnual + capexAnnual + propertyManagementFee;
  const annualCashFlow = effectiveAnnualRent - totalAnnualExpenses - monthlyPayment * 12;
  const ltrCashOnCashReturn = (annualCashFlow / (downPayment + renovationCost)) * 100;
  
  // Short-term rental calculations
  const nightlyRate = sensitivityInputs.nightlyRate || parseFloat(formData.nightlyRate) || estimateNightlyRate();
  const occupancyRate = sensitivityInputs.occupancyRate || parseFloat(formData.occupancyRate) || 65;
  const annualStrRevenue = nightlyRate * 365 * (occupancyRate / 100);
  const strManagementFee = annualStrRevenue * (parseFloat(formData.strManagementFee) || 20) / 100;
  
  // Calculate annual expenses for STR
  const strPropertyTaxAnnual = propertyTaxAnnual; // Same as LTR
  const strInsuranceAnnual = insuranceAnnual * 1.5; // Higher for STR
  const strMaintenanceAnnual = purchasePrice * EXPENSE_RATIOS.strMaintenance;
  const strUtilitiesAnnual = purchasePrice * EXPENSE_RATIOS.strUtilities;
  const strCapexAnnual = annualStrRevenue * EXPENSE_RATIOS.strCapex;
  const additionalStrExpenses = (parseFloat(formData.additionalStrExpenses) || 250) * 12;
  
  const totalStrAnnualExpenses = strPropertyTaxAnnual + strInsuranceAnnual + strMaintenanceAnnual + 
                               strUtilitiesAnnual + strCapexAnnual + strManagementFee + additionalStrExpenses;
  const annualStrCashFlow = annualStrRevenue - totalStrAnnualExpenses - monthlyPayment * 12;
  const strCashOnCashReturn = (annualStrCashFlow / (downPayment + renovationCost)) * 100;

  // Monthly breakdown variables for chart calculations
  const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate / 100);
  const monthlyPropertyTax = propertyTaxAnnual / 12;
  const monthlyInsurance = insuranceAnnual / 12;
  const monthlyMaintenance = maintenanceAnnual / 12;
  const monthlyPropertyManagement = propertyManagementFee / 12;

  // Deal quality assessment
  const getDealQuality = () => {
    if (roi >= 30 && arvToPurchaseRatio >= 1.3 && renovationToArvRatio <= 20) return 'Excellent';
    if (roi >= 20 && arvToPurchaseRatio >= 1.2 && renovationToArvRatio <= 25) return 'Good';
    if (roi >= 10 && arvToPurchaseRatio >= 1.1 && renovationToArvRatio <= 30) return 'Fair';
    return 'Poor';
  };

  const dealQuality = getDealQuality();
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Data for charts
  const investmentBreakdown = [
    { name: 'Down Payment', value: downPayment },
    { name: 'Renovation', value: renovationCost },
    { name: 'Holding Costs', value: totalHoldingCosts },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  // Function to handle sensitivity sliders
  const handleSensitivityChange = (name, value) => {
    setSensitivityInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle objective weight changes
  const handleWeightChange = (objective, value) => {
    setObjectiveWeights(prev => ({
      ...prev,
      [objective]: value
    }));
  };
  
  // MODA scoring for each strategy
  const calculateModaScores = () => {
    // Normalize weights to sum to 100
    const totalWeight = Object.values(objectiveWeights).reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = {};
    Object.entries(objectiveWeights).forEach(([key, value]) => {
      normalizedWeights[key] = (value / totalWeight) * 100;
    });
    
    // Score each strategy on each objective (0-10 scale)
    const scores = {
      flip: {
        roi: Math.min(10, annualizedROI / 5), // 50% annualized ROI would be a 10
        cashFlow: 0, // No cash flow for flip
        risk: Math.max(0, 10 - (holdingPeriod / 1.2)), // Shorter holding periods are less risky (12 months = 0, 1 month = 9.2)
        workload: 8, // Low ongoing workload: intensive during project but time-limited, no ongoing management
      },
      ltr: {
        roi: Math.min(10, ltrTotalROIAnnualized / 2), // 20% total annual ROI would be a 10
        cashFlow: Math.min(10, annualCashFlow / (downPayment + renovationCost) * 20), // 5% monthly cash flow would be a 10
        risk: 7, // Lower risk: stable income, established market, predictable expenses
        workload: 5, // Medium workload: tenant screening, occasional maintenance, annual lease renewal
      },
      str: {
        roi: Math.min(10, strTotalROIAnnualized / 3), // 30% total annual ROI would be a 10
        cashFlow: Math.min(10, annualStrCashFlow / (downPayment + renovationCost) * 15), // 6.7% monthly cash flow would be a 10
        risk: 4, // Higher risk: regulatory changes, market volatility, seasonal demand, higher vacancy
        workload: 2, // High workload: daily guest management, frequent cleaning, marketing, pricing optimization, 24/7 availability
      }
    };
    
    // Calculate weighted scores for each strategy
    const weightedScores = {
      flip: 0,
      ltr: 0,
      str: 0
    };
    
    Object.entries(scores).forEach(([strategy, strategyScores]) => {
      Object.entries(strategyScores).forEach(([objective, score]) => {
        weightedScores[strategy] += (score * normalizedWeights[objective]) / 100;
      });
    });
    
    return {
      scores,
      weightedScores
    };
  };
  
  // Additional rental calculations for 5-year projections
  const annualAppreciationRate = 0.03; // 3% annual appreciation
  const rentIncreaseRate = 0.02; // 2% annual rent increase
  const futureValue = purchasePrice * Math.pow(1 + annualAppreciationRate, 5);
  const appreciationProfit = futureValue - purchasePrice;
  
  // Calculate remaining loan balance after 5 years
  function calculateRemainingLoanBalance(principal, monthlyRate, totalPayments, paymentsMade) {
    return principal * 
      (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, paymentsMade)) / 
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
  }
  
  const remainingLoanBalance = calculateRemainingLoanBalance(
    loanAmount,
    monthlyInterestRate,
    numberOfPayments,
    5 * 12 // 5 years worth of payments
  );
  
  // Calculate principal paydown
  const loanPaydown = loanAmount - remainingLoanBalance;
  
  // Calculate selling costs after 5 years
  const futureSellingCosts = futureValue * parseFloat(formData.sellingCosts) / 100;
  
  // Calculate total rental profit over 5 years
  const rentalProfit = (annualCashFlow * 5) + appreciationProfit + loanPaydown - futureSellingCosts;
  
  // Calculate rental ROI
  const rentalROIValue = (rentalProfit / (downPayment + renovationCost)) * 100;
  
  // Calculate cash on cash return
  const cashOnCashReturn = (annualCashFlow / (downPayment + renovationCost)) * 100;
  
  // Calculate STR total profit over 5 years (same methodology as LTR)
  const strTotalProfit = (annualStrCashFlow * 5) + appreciationProfit + loanPaydown - futureSellingCosts;
  const strTotalROI = (strTotalProfit / (downPayment + renovationCost)) * 100;
  
  // Calculate annualized total returns for normalized comparison
  const ltrTotalROIAnnualized = rentalROIValue / 5; // Convert 5-year total to annual
  const strTotalROIAnnualized = strTotalROI / 5; // Convert 5-year total to annual
  
  // Now calculate MODA scores after all variables are defined
  const modaResults = calculateModaScores();
  
  // Prepare radar chart data for strategy comparison (rounded to integers)
  const radarData = [
    { objective: 'ROI', flip: Math.round(modaResults.scores.flip.roi), ltr: Math.round(modaResults.scores.ltr.roi), str: Math.round(modaResults.scores.str.roi) },
    { objective: 'Cash Flow', flip: Math.round(modaResults.scores.flip.cashFlow), ltr: Math.round(modaResults.scores.ltr.cashFlow), str: Math.round(modaResults.scores.str.cashFlow) },
    { objective: 'Risk', flip: Math.round(modaResults.scores.flip.risk), ltr: Math.round(modaResults.scores.ltr.risk), str: Math.round(modaResults.scores.str.risk) },
    { objective: 'Workload', flip: Math.round(modaResults.scores.flip.workload), ltr: Math.round(modaResults.scores.ltr.workload), str: Math.round(modaResults.scores.str.workload) },
  ];
  
  // Strategy color scheme (consistent across all charts)
  const STRATEGY_COLORS = {
    flip: '#8b5cf6',  // Purple
    ltr: '#10b981',   // Green
    str: '#f59e0b'    // Orange
  };

  // Prepare bar chart data for weighted scores
  const weightedScoreData = [
    { name: 'Fix & Flip', score: modaResults.weightedScores.flip, color: STRATEGY_COLORS.flip },
    { name: 'Long-Term Rental', score: modaResults.weightedScores.ltr, color: STRATEGY_COLORS.ltr },
    { name: 'Short-Term Rental', score: modaResults.weightedScores.str, color: STRATEGY_COLORS.str },
  ];

  // Prepare cash flow projection data (5-year timeline)
  const cashFlowProjectionData = [];
  const annualRentIncrease = 0.025; // 2.5% annual rent increase
  const annualPropertyTaxIncrease = 0.02; // 2% annual property tax increase  
  const annualInsuranceIncrease = 0.04; // 4% annual insurance increase
  const annualMaintenanceIncrease = 0.03; // 3% annual maintenance increase
  
  // Start with Year 0 at $0 cash flow
  cashFlowProjectionData.push({
    year: 'Year 0',
    ltr: 0,
    str: 0
  });
  
  for (let year = 1; year <= 5; year++) {
    // LTR Cash Flow Calculation - Start with current year 1 values, then project
    const baseYear = year === 1;
    
    // Calculate adjusted annual values for LTR
    const adjustedAnnualRent = effectiveAnnualRent * Math.pow(1 + annualRentIncrease, year - 1);
    const adjustedPropertyTaxAnnual = propertyTaxAnnual * Math.pow(1 + annualPropertyTaxIncrease, year - 1);
    const adjustedInsuranceAnnual = insuranceAnnual * Math.pow(1 + annualInsuranceIncrease, year - 1);
    const adjustedMaintenanceAnnual = maintenanceAnnual * Math.pow(1 + annualMaintenanceIncrease, year - 1);
    const adjustedPropertyManagementFee = (adjustedAnnualRent * (parseFloat(formData.propertyManagementFee) || 10) / 100);
    
    const ltrTotalExpenses = adjustedPropertyTaxAnnual + adjustedInsuranceAnnual + adjustedMaintenanceAnnual + 
                           utilitiesAnnual + capexAnnual + adjustedPropertyManagementFee + (monthlyPayment * 12);
    const ltrYearCashFlow = adjustedAnnualRent - ltrTotalExpenses;
    
    // STR Cash Flow Calculation - Apply increases to revenue and expenses
    const adjustedStrRevenue = annualStrRevenue * Math.pow(1 + annualRentIncrease, year - 1);
    const adjustedStrPropertyTax = strPropertyTaxAnnual * Math.pow(1 + annualPropertyTaxIncrease, year - 1);
    const adjustedStrInsurance = strInsuranceAnnual * Math.pow(1 + annualInsuranceIncrease, year - 1);
    const adjustedStrMaintenance = strMaintenanceAnnual * Math.pow(1 + annualMaintenanceIncrease, year - 1);
    const adjustedStrManagementFee = adjustedStrRevenue * (parseFloat(formData.strManagementFee) || 20) / 100;
    
    const strTotalExpenses = adjustedStrPropertyTax + adjustedStrInsurance + adjustedStrMaintenance + 
                           strUtilitiesAnnual + strCapexAnnual + adjustedStrManagementFee + 
                           additionalStrExpenses + (monthlyPayment * 12);
    const strYearCashFlow = adjustedStrRevenue - strTotalExpenses;
    
    cashFlowProjectionData.push({
      year: `Year ${year}`,
      ltr: Math.round(ltrYearCashFlow),
      str: Math.round(strYearCashFlow)
    });
  }

  // Prepare ROI progression data (cumulative over 5 years)
  const roiProgressionData = [];
  let cumulativeLtrCashFlow = 0;
  let cumulativeStrCashFlow = 0;
  const initialInvestment = downPayment + renovationCost;
  
  for (let year = 1; year <= 5; year++) {
    cumulativeLtrCashFlow += cashFlowProjectionData[year].ltr; // Now year index matches because we added Year 0
    cumulativeStrCashFlow += cashFlowProjectionData[year].str;
    
    // Calculate cumulative appreciation (not yearly)
    const cumulativeAppreciation = purchasePrice * (Math.pow(1 + annualAppreciationRate, year) - 1);
    // Calculate cumulative principal paydown
    const cumulativePrincipalPaydown = (loanPaydown / 5) * year; // Simplified linear distribution
    
    const ltrCumulativeROI = ((cumulativeLtrCashFlow + cumulativeAppreciation + cumulativePrincipalPaydown) / initialInvestment) * 100;
    const strCumulativeROI = ((cumulativeStrCashFlow + cumulativeAppreciation + cumulativePrincipalPaydown) / initialInvestment) * 100;
    
    // Fix & Flip shows total ROI in year 1, then carries forward
    const flipCumulativeROI = year === 1 ? annualizedROI : roiProgressionData[0]?.flip || annualizedROI;
    
    roiProgressionData.push({
      year: `Year ${year}`,
      flip: Math.round(flipCumulativeROI * 100) / 100,
      ltr: Math.round(ltrCumulativeROI * 100) / 100,
      str: Math.round(strCumulativeROI * 100) / 100
    });
  }

  // Prepare renovation timeline data (if condition data is available or renovation cost > 0)
  const renovationTimelineData = [];
  if ((formData.propertyCondition && formData.propertyCondition !== '') || renovationCost > 0) {
    const condition = formData.propertyCondition || 'fair'; // Default to 'fair' if no condition specified
    const phases = {
      'teardown': [
        { phase: 'Planning & Permits', weeks: 4, cost: renovationCost * 0.1 },
        { phase: 'Demolition', weeks: 2, cost: renovationCost * 0.15 },
        { phase: 'Foundation/Structure', weeks: 6, cost: renovationCost * 0.25 },
        { phase: 'Plumbing/Electrical', weeks: 4, cost: renovationCost * 0.20 },
        { phase: 'Drywall/Insulation', weeks: 3, cost: renovationCost * 0.10 },
        { phase: 'Flooring/Paint', weeks: 3, cost: renovationCost * 0.15 },
        { phase: 'Final/Cleanup', weeks: 2, cost: renovationCost * 0.05 }
      ],
      'poor': [
        { phase: 'Planning & Permits', weeks: 2, cost: renovationCost * 0.1 },
        { phase: 'Major Repairs', weeks: 4, cost: renovationCost * 0.35 },
        { phase: 'Plumbing/Electrical', weeks: 3, cost: renovationCost * 0.25 },
        { phase: 'Flooring/Paint', weeks: 2, cost: renovationCost * 0.25 },
        { phase: 'Final/Cleanup', weeks: 1, cost: renovationCost * 0.05 }
      ],
      'fair': [
        { phase: 'Planning', weeks: 1, cost: renovationCost * 0.1 },
        { phase: 'Updates/Repairs', weeks: 3, cost: renovationCost * 0.50 },
        { phase: 'Cosmetic Work', weeks: 2, cost: renovationCost * 0.35 },
        { phase: 'Final/Cleanup', weeks: 1, cost: renovationCost * 0.05 }
      ],
      'good': [
        { phase: 'Planning', weeks: 1, cost: renovationCost * 0.15 },
        { phase: 'Light Cosmetic', weeks: 2, cost: renovationCost * 0.70 },
        { phase: 'Final/Cleanup', weeks: 1, cost: renovationCost * 0.15 }
      ]
    };
    
    const selectedPhases = phases[condition] || phases['fair'];
    let cumulativeWeeks = 0;
    let cumulativeCost = 0;
    
    selectedPhases.forEach(phase => {
      cumulativeWeeks += phase.weeks;
      cumulativeCost += phase.cost;
      renovationTimelineData.push({
        phase: phase.phase,
        weeks: cumulativeWeeks,
        cost: Math.round(cumulativeCost),
        weeklyProgress: Math.round((cumulativeWeeks / selectedPhases.reduce((sum, p) => sum + p.weeks, 0)) * 100)
      });
    });
  }
  
  // Find recommended strategy based on highest MODA score
  const recommendedStrategy = Object.entries(modaResults.weightedScores)
    .reduce((best, [strategy, score]) => (score > best.score ? { strategy, score } : best), { strategy: 'ltr', score: 0 })
    .strategy;
  
  const strategyLabels = {
    flip: 'Fix & Flip',
    ltr: 'Long-Term Rental',
    str: 'Short-Term Rental'
  };
  
  // Additional variables needed in the UI
  const monthlyCashFlow = annualCashFlow / 12;
  const capRate = (effectiveAnnualRent - totalAnnualExpenses) / purchasePrice * 100;
  const annualExpensesExclMortgage = totalAnnualExpenses - (monthlyPayment * 12);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Investment Analysis Results
          </h1>
          <p className="text-center text-gray-500 mb-6">Compare different exit strategies to find the best option for this property</p>

          {/* Dashboard Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg shadow-lg p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-1">Property</h3>
                  <p className="text-3xl font-bold">${formatCurrency(purchasePrice)}</p>
                  <p className="text-sm opacity-80">Purchase Price</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-1">Best Strategy</h3>
                  <p className="text-2xl font-bold">{strategyLabels[recommendedStrategy]}</p>
                  <p className="text-sm opacity-80">Based on your priorities</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-1">Highest ROI</h3>
                  <p className="text-3xl font-bold">{formatPercent(Math.max(annualizedROI, ltrTotalROIAnnualized, strTotalROIAnnualized))}%</p>
                  <p className="text-sm opacity-80">Total Annual Return</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-1">5-Year Profit</h3>
                  <p className="text-3xl font-bold">${formatCurrency(Math.max(netProfit, annualCashFlow * 5, annualStrCashFlow * 5))}</p>
                  <p className="text-sm opacity-80">Maximum Strategy</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Purchase & Renovation Summary */}
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Purchase & Renovation</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Initial Investment</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Purchase Price:</span>
                    <span className="font-medium">${formatCurrency(purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Down Payment:</span>
                    <span className="font-medium">${formatCurrency(downPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Renovation Cost:</span>
                    <span className="font-medium">${formatCurrency(renovationCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Initial Investment:</span>
                    <span className="font-medium">${formatCurrency(downPayment + renovationCost)}</span>
                  </div>
                </div>
              </div>
              
              {/* ARV & Projected Value */}
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">ARV & Projected Value</h3>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">After Improvements</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">After Repair Value:</span>
                    <span className="font-medium">${formatCurrency(expectedSellingPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ARV to Purchase Ratio:</span>
                    <span className="font-medium">{formatPercent(arvToPurchaseRatio)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Renovation to ARV:</span>
                    <span className="font-medium">{formatPercent(renovationToArvRatio)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estimated Equity:</span>
                    <span className="font-medium">${formatCurrency(expectedSellingPrice - loanAmount)}</span>
                  </div>
                </div>
              </div>
              
              {/* Deal Quality Assessment */}
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Deal Assessment</h3>
                  <span className={`${getQualityColor(dealQuality)} text-xs font-medium px-2.5 py-0.5 rounded-full`}>{dealQuality}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ 
                        width: `${Math.min(100, 
                          roi >= 30 ? 100 : // Excellent = 100%
                          roi >= 20 ? 75 :  // Good = 75%
                          roi >= 10 ? 50 :  // Fair = 50%
                          (roi / 10) * 25   // Poor = proportional up to 25%
                        )}%` 
                      }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-500 w-20">ROI {formatPercent(roi)}%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ 
                        width: `${Math.min(100,
                          arvToPurchaseRatio >= 1.3 ? 100 : // Excellent = 100%
                          arvToPurchaseRatio >= 1.2 ? 75 :  // Good = 75%
                          arvToPurchaseRatio >= 1.1 ? 50 :  // Fair = 50%
                          ((arvToPurchaseRatio - 1) / 0.1) * 25 // Poor = proportional up to 25%
                        )}%` 
                      }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-500 w-20">ARV {formatPercent(arvToPurchaseRatio)}x</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-yellow-600 h-2.5 rounded-full" style={{ 
                        width: `${Math.min(100,
                          renovationToArvRatio <= 20 ? 100 : // Excellent = 100%
                          renovationToArvRatio <= 25 ? 75 :  // Good = 75%
                          renovationToArvRatio <= 30 ? 50 :  // Fair = 50%
                          Math.max(0, (40 - renovationToArvRatio) / 10 * 25) // Poor = decreasing to 0%
                        )}%` 
                      }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-500 w-20">Reno {formatPercent(renovationToArvRatio)}%</span>
                  </div>
                  <div className="mt-4 text-sm text-gray-700">
                    <p>Based on the key metrics analysis, this deal is rated <span className="font-semibold">{dealQuality}</span>. {
                      dealQuality === 'Excellent' ? 'All metrics exceed investment targets.' :
                      dealQuality === 'Good' ? 'Most metrics meet investment targets.' :
                      dealQuality === 'Fair' ? 'Some metrics meet investment targets.' :
                      'Few metrics meet investment targets.'
                    }</p>
                  </div>
                </div>
              </div>

              {/* Industry Standards Key - NEW SEPARATE CARD */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Industry Standards</h3>
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Reference</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Top Left - Excellent */}
                  <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-semibold text-green-800">Excellent</span>
                    </div>
                    <div className="text-xs text-green-700 space-y-1">
                      <div>• ROI ≥ 30%</div>
                      <div>• ARV ≥ 1.3x</div>
                      <div>• Reno ≤ 20%</div>
                    </div>
                  </div>
                  
                  {/* Top Right - Good */}
                  <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm font-semibold text-blue-800">Good</span>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>• ROI ≥ 20%</div>
                      <div>• ARV ≥ 1.2x</div>
                      <div>• Reno ≤ 25%</div>
                    </div>
                  </div>
                  
                  {/* Bottom Left - Fair */}
                  <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm font-semibold text-yellow-800">Fair</span>
                    </div>
                    <div className="text-xs text-yellow-700 space-y-1">
                      <div>• ROI ≥ 10%</div>
                      <div>• ARV ≥ 1.1x</div>
                      <div>• Reno ≤ 30%</div>
                    </div>
                  </div>
                  
                  {/* Bottom Right - Poor */}
                  <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm font-semibold text-red-800">Poor</span>
                    </div>
                    <div className="text-xs text-red-700 space-y-1">
                      <div>• ROI &lt; 10%</div>
                      <div>• ARV &lt; 1.1x</div>
                      <div>• Reno &gt; 30%</div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 italic text-center">
                    Bar length shows performance vs. these benchmarks
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sensitivity Analysis */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sensitivity Analysis</h2>
            <p className="text-sm text-gray-500 mb-4">
              Adjust these parameters to see how changes affect your investment outcomes
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Purchase Price Slider */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between">
                  <label htmlFor="purchase-price" className="block text-sm font-medium text-gray-700">Purchase Price</label>
                  <span className="text-sm text-gray-500">${formatCurrency(sensitivityInputs.purchasePrice || parseFloat(formData.purchasePrice))}</span>
                </div>
                <input
                  type="range"
                  id="purchase-price"
                  min={parseFloat(formData.purchasePrice) * 0.8}
                  max={parseFloat(formData.purchasePrice) * 1.2}
                  step={1000}
                  value={sensitivityInputs.purchasePrice || parseFloat(formData.purchasePrice)}
                  onChange={(e) => handleSensitivityChange('purchasePrice', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-20%</span>
                  <span>Original: ${formatCurrency(parseFloat(formData.purchasePrice))}</span>
                  <span>+20%</span>
                </div>
              </div>
              
              {/* Renovation Cost Slider */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between">
                  <label htmlFor="renovation-cost" className="block text-sm font-medium text-gray-700">Renovation Cost</label>
                  <span className="text-sm text-gray-500">${formatCurrency(sensitivityInputs.renovationCost || parseFloat(formData.renovationCost))}</span>
                </div>
                <input
                  type="range"
                  id="renovation-cost"
                  min={parseFloat(formData.renovationCost) * 0.7}
                  max={parseFloat(formData.renovationCost) * 1.5}
                  step={1000}
                  value={sensitivityInputs.renovationCost || parseFloat(formData.renovationCost)}
                  onChange={(e) => handleSensitivityChange('renovationCost', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-30%</span>
                  <span>Original: ${formatCurrency(parseFloat(formData.renovationCost))}</span>
                  <span>+50%</span>
                </div>
              </div>
              
              {/* ARV Slider */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between">
                  <label htmlFor="arv" className="block text-sm font-medium text-gray-700">After Repair Value</label>
                  <span className="text-sm text-gray-500">${formatCurrency(sensitivityInputs.arv || parseFloat(formData.expectedSellingPrice))}</span>
                </div>
                <input
                  type="range"
                  id="arv"
                  min={parseFloat(formData.expectedSellingPrice) * 0.85}
                  max={parseFloat(formData.expectedSellingPrice) * 1.15}
                  step={1000}
                  value={sensitivityInputs.arv || parseFloat(formData.expectedSellingPrice)}
                  onChange={(e) => handleSensitivityChange('arv', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-15%</span>
                  <span>Original: ${formatCurrency(parseFloat(formData.expectedSellingPrice))}</span>
                  <span>+15%</span>
                </div>
              </div>
              
              {/* Monthly Rent Slider */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between">
                  <label htmlFor="monthly-rent" className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                  <span className="text-sm text-gray-500">${formatCurrency(sensitivityInputs.monthlyRent || parseFloat(formData.expectedMonthlyRent || 0))}</span>
                </div>
                <input
                  type="range"
                  id="monthly-rent"
                  min={(parseFloat(formData.expectedMonthlyRent) || 0) * 0.7}
                  max={(parseFloat(formData.expectedMonthlyRent) || 0) * 1.3}
                  step={50}
                  value={sensitivityInputs.monthlyRent || parseFloat(formData.expectedMonthlyRent || 0)}
                  onChange={(e) => handleSensitivityChange('monthlyRent', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-30%</span>
                  <span>Original: ${formatCurrency(parseFloat(formData.expectedMonthlyRent || 0))}</span>
                  <span>+30%</span>
                </div>
              </div>
              
              {/* STR Nightly Rate Slider */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between">
                  <label htmlFor="nightly-rate" className="block text-sm font-medium text-gray-700">STR Nightly Rate</label>
                  <span className="text-sm text-gray-500">${formatCurrency(sensitivityInputs.nightlyRate || parseFloat(formData.nightlyRate) || estimateNightlyRate())}</span>
                </div>
                <input
                  type="range"
                  id="nightly-rate"
                  min={(parseFloat(formData.nightlyRate) || estimateNightlyRate()) * 0.6}
                  max={(parseFloat(formData.nightlyRate) || estimateNightlyRate()) * 1.4}
                  step={5}
                  value={sensitivityInputs.nightlyRate || parseFloat(formData.nightlyRate) || estimateNightlyRate()}
                  onChange={(e) => handleSensitivityChange('nightlyRate', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-40%</span>
                  <span>Original: ${formatCurrency(parseFloat(formData.nightlyRate) || estimateNightlyRate())}</span>
                  <span>+40%</span>
                </div>
              </div>
              
              {/* STR Occupancy Rate Slider */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between">
                  <label htmlFor="occupancy-rate" className="block text-sm font-medium text-gray-700">STR Occupancy (%)</label>
                  <span className="text-sm text-gray-500">{(sensitivityInputs.occupancyRate || parseFloat(formData.occupancyRate) || 65).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  id="occupancy-rate"
                  min={40}
                  max={90}
                  step={1}
                  value={sensitivityInputs.occupancyRate || parseFloat(formData.occupancyRate) || 65}
                  onChange={(e) => handleSensitivityChange('occupancyRate', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>40%</span>
                  <span>Original: {parseFloat(formData.occupancyRate) || 65}%</span>
                  <span>90%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setSelectedStrategy('all')}
                className={`${
                  selectedStrategy === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } px-4 py-2 text-sm font-medium rounded-l-lg border border-gray-200`}
              >
                All Strategies
              </button>
              <button
                type="button"
                onClick={() => setSelectedStrategy('flip')}
                className={`${
                  selectedStrategy === 'flip'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } px-4 py-2 text-sm font-medium border-t border-b border-gray-200`}
              >
                Fix & Flip
              </button>
              <button
                type="button"
                onClick={() => setSelectedStrategy('ltr')}
                className={`${
                  selectedStrategy === 'ltr'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } px-4 py-2 text-sm font-medium border-t border-b border-gray-200`}
              >
                Long-Term Rental
              </button>
              <button
                type="button"
                onClick={() => setSelectedStrategy('str')}
                className={`${
                  selectedStrategy === 'str'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } px-4 py-2 text-sm font-medium rounded-r-lg border border-gray-200`}
              >
                Short-Term Rental
              </button>
            </div>
          </div>

          {/* Strategy Detailed Analysis */}
          {selectedStrategy === 'flip' && (
            <div className="mb-8 border border-indigo-100 rounded-lg shadow bg-white overflow-hidden">
              <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-4">
                <h2 className="text-xl font-semibold text-indigo-800">Fix & Flip Strategy Detailed Analysis</h2>
                <p className="text-sm text-indigo-600">Complete breakdown of investment returns and cash flow</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Financial Summary */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Purchase Price</span>
                        <span className="font-medium">${formatCurrency(purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Down Payment</span>
                        <span className="font-medium">${formatCurrency(downPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Loan Amount</span>
                        <span className="font-medium">${formatCurrency(loanAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Interest Rate</span>
                        <span className="font-medium">{formData.interestRate}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Payment</span>
                        <span className="font-medium">${formatCurrency(monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Renovation Cost</span>
                        <span className="font-medium">${formatCurrency(renovationCost)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Expenses</span>
                        <span className="font-medium">${formatCurrency(monthlyExpenses)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Timeline</span>
                        <span className="font-medium">{holdingPeriod} months</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-gray-900">
                        <span>Total Holding Costs</span>
                        <span>${formatCurrency(totalHoldingCosts)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Profit Calculation */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Calculation</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">After Repair Value (ARV)</span>
                        <span className="font-medium">${formatCurrency(expectedSellingPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Selling Costs ({formData.sellingCosts}%)</span>
                        <span className="font-medium">-${formatCurrency(sellingCosts)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Purchase Price</span>
                        <span className="font-medium">-${formatCurrency(purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Renovation Cost</span>
                        <span className="font-medium">-${formatCurrency(renovationCost)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Holding Costs</span>
                        <span className="font-medium">-${formatCurrency(totalHoldingCosts)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-green-600 pt-2">
                        <span>Net Profit</span>
                        <span>${formatCurrency(netProfit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Key Metrics */}
                <div className="bg-white border rounded-lg shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-700 mb-1">Total Investment</p>
                      <p className="text-2xl font-bold text-blue-900">${formatCurrency(totalInvestment)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-700 mb-1">Net Profit</p>
                      <p className="text-2xl font-bold text-green-900">${formatCurrency(netProfit)}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-indigo-700 mb-1">Return on Investment</p>
                      <p className="text-2xl font-bold text-indigo-900">{formatPercent(roi)}%</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-purple-700 mb-1">Annualized ROI</p>
                      <p className="text-2xl font-bold text-purple-900">{formatPercent(annualizedROI)}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Math Explanation */}
                <div className="bg-white border rounded-lg shadow-sm p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Understanding the Math</h3>
                  
                  <div className="space-y-4 text-sm text-gray-600">
                    <p>
                      <strong className="text-gray-700">Total Investment:</strong> The sum of your initial cash investment (down payment), renovation costs, and holding costs during the renovation period.
                    </p>
                    <div className="bg-gray-50 p-3 rounded">
                      <code>Total Investment = Down Payment + Renovation Cost + Holding Costs</code><br />
                      <code>Total Investment = ${formatCurrency(downPayment)} + ${formatCurrency(renovationCost)} + ${formatCurrency(totalHoldingCosts)} = ${formatCurrency(totalInvestment)}</code>
                    </div>
                    
                    <p>
                      <strong className="text-gray-700">Net Profit:</strong> The difference between your selling price (minus selling costs) and all expenses (purchase price, renovation, and holding costs).
                    </p>
                    <div className="bg-gray-50 p-3 rounded">
                      <code>Net Profit = ARV - Selling Costs - Purchase Price - Renovation Cost - Holding Costs</code><br />
                      <code>Net Profit = ${formatCurrency(expectedSellingPrice)} - ${formatCurrency(sellingCosts)} - ${formatCurrency(purchasePrice)} - ${formatCurrency(renovationCost)} - ${formatCurrency(totalHoldingCosts)} = ${formatCurrency(netProfit)}</code>
                    </div>
                    
                    <p>
                      <strong className="text-gray-700">Return on Investment (ROI):</strong> The percentage return on your total investment.
                    </p>
                    <div className="bg-gray-50 p-3 rounded">
                      <code>ROI = (Net Profit / Total Investment) × 100%</code><br />
                      <code>ROI = (${formatCurrency(netProfit)} / ${formatCurrency(totalInvestment)}) × 100% = {formatPercent(roi)}%</code>
                    </div>
                    
                    <p>
                      <strong className="text-gray-700">Annualized ROI:</strong> The ROI converted to an annual rate, accounting for the holding period.
                    </p>
                    <div className="bg-gray-50 p-3 rounded">
                      <code>Annualized ROI = (ROI / Holding Period in Months) × 12</code><br />
                      <code>Annualized ROI = ({formatPercent(roi)}% / {holdingPeriod}) × 12 = {formatPercent(annualizedROI)}%</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedStrategy === 'ltr' && (
            <div className="mb-8 border border-green-100 rounded-lg shadow bg-white overflow-hidden">
              <div className="bg-green-50 border-b border-green-100 px-6 py-4">
                <h2 className="text-xl font-semibold text-green-800">Long-Term Rental Strategy Detailed Analysis</h2>
                <p className="text-sm text-green-600">Complete breakdown of rental income, expenses, and long-term returns</p>
              </div>
              
              <div className="p-6">
                {/* Initial Investment - LTR DATA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Financial Summary */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Initial Investment</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Purchase Price</span>
                        <span className="font-medium">${formatCurrency(purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Down Payment ({formData.downPayment}%)</span>
                        <span className="font-medium">${formatCurrency(downPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Loan Amount</span>
                        <span className="font-medium">${formatCurrency(loanAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Interest Rate</span>
                        <span className="font-medium">{formData.interestRate}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Loan Term</span>
                        <span className="font-medium">{formData.loanTerm} years</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Payment</span>
                        <span className="font-medium">${formatCurrency(monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Renovation Cost</span>
                        <span className="font-medium">${formatCurrency(renovationCost)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-gray-900">
                        <span>Total Initial Investment</span>
                        <span>${formatCurrency(downPayment + renovationCost)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly Cash Flow - LTR DATA */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Cash Flow</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Rent (effective)</span>
                        <span className="font-medium">${formatCurrency(effectiveAnnualRent / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Mortgage Payment</span>
                        <span className="font-medium">-${formatCurrency(monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Property Tax</span>
                        <span className="font-medium">-${formatCurrency(propertyTaxAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Insurance</span>
                        <span className="font-medium">-${formatCurrency(insuranceAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Maintenance</span>
                        <span className="font-medium">-${formatCurrency(maintenanceAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Utilities</span>
                        <span className="font-medium">-${formatCurrency(utilitiesAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Management Fee ({formData.propertyManagementFee || 10}%)</span>
                        <span className="font-medium">-${formatCurrency(propertyManagementFee / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Capital Reserves</span>
                        <span className="font-medium">-${formatCurrency(capexAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-green-600">
                        <span>Monthly Cash Flow</span>
                        <span>${formatCurrency(annualCashFlow / 12)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Annual Revenue and Expense Breakdown - LTR DATA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Annual Revenue Breakdown */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Revenue Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Rent</span>
                        <span className="font-medium">${formatCurrency(monthlyRent)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Vacancy Rate</span>
                        <span className="font-medium">{vacancyRate}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Effective Annual Rent</span>
                        <span className="font-medium">${formatCurrency(effectiveAnnualRent)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-green-600 pt-2 border-t border-gray-100">
                        <span>Total Annual Revenue</span>
                        <span>${formatCurrency(effectiveAnnualRent)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Occupancy Distribution</h4>
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${100 - vacancyRate}%` }} 
                          title={`Occupied: ${100 - vacancyRate}%`}
                        ></div>
                        <div 
                          className="bg-gray-300" 
                          style={{ width: `${vacancyRate}%` }} 
                          title={`Vacant: ${vacancyRate}%`}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-green-600">Occupied: {Math.round(365 * (100 - vacancyRate) / 100)} days</span>
                        <span className="text-gray-500">Vacant: {Math.round(365 * vacancyRate / 100)} days</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Annual Expense Breakdown */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Expense Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Property Tax</span>
                        <span className="font-medium">-${formatCurrency(propertyTaxAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Insurance</span>
                        <span className="font-medium">-${formatCurrency(insuranceAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Maintenance</span>
                        <span className="font-medium">-${formatCurrency(maintenanceAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Utilities</span>
                        <span className="font-medium">-${formatCurrency(utilitiesAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Capital Expenditures</span>
                        <span className="font-medium">-${formatCurrency(capexAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Management Fee ({formData.propertyManagementFee || 10}%)</span>
                        <span className="font-medium">-${formatCurrency(propertyManagementFee)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Mortgage Payments</span>
                        <span className="font-medium">-${formatCurrency(monthlyPayment * 12)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-red-600">
                        <span>Total Annual Expenses</span>
                        <span>-${formatCurrency(totalAnnualExpenses + monthlyPayment * 12)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-center font-medium text-green-600 pt-2 border-t border-gray-200">
                        <span>Annual Net Cash Flow</span>
                        <span>${formatCurrency(annualCashFlow)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 pt-1">
                        <span>Monthly Average</span>
                        <span>${formatCurrency(annualCashFlow / 12)}/month</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* LTR Expense Distribution Chart */}
                <div className="bg-white border rounded-lg shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">LTR Expense Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Property Tax', value: propertyTaxAnnual },
                            { name: 'Insurance', value: insuranceAnnual },
                            { name: 'Maintenance', value: maintenanceAnnual },
                            { name: 'Utilities', value: utilitiesAnnual },
                            { name: 'CapEx', value: capexAnnual },
                            { name: 'Management', value: propertyManagementFee },
                            { name: 'Mortgage', value: monthlyPayment * 12 }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
                            '#a05195', '#d45087', '#f95d6a'
                          ].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value) => [`$${formatCurrency(value)}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Key Performance Metrics */}
                <div className="bg-white border rounded-lg shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-orange-700 mb-1">Cash Flow</p>
                      <p className="text-2xl font-bold text-orange-900">${formatCurrency(annualCashFlow / 12)}/mo</p>
                      <p className="text-sm text-orange-700">${formatCurrency(annualCashFlow)}/yr</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-700 mb-1">Cash-on-Cash Return</p>
                      <p className="text-2xl font-bold text-green-900">{formatPercent(cashOnCashReturn)}%</p>
                      <p className="text-sm text-green-700">Annual return on investment</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-700 mb-1">Vacancy Rate</p>
                      <p className="text-2xl font-bold text-blue-900">{vacancyRate}%</p>
                      <p className="text-sm text-blue-700">{Math.round(365 * vacancyRate / 100)} days/year</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-purple-700 mb-1">Monthly Rent</p>
                      <p className="text-2xl font-bold text-purple-900">${formatCurrency(monthlyRent)}</p>
                      <p className="text-sm text-purple-700">gross monthly</p>
                    </div>
                  </div>
                </div>

                {/* 5-Year Projection */}
                <div className="bg-white border rounded-lg shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">5-Year Return Projection</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Cash Flow (5 years)</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${formatCurrency(monthlyCashFlow * 12 * 5)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(monthlyCashFlow)} × 12 months × 5 years</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Appreciation ({formData.appreciationRate || 3}% annually)</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${formatCurrency(appreciationProfit)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(purchasePrice)} × (1 + {formData.appreciationRate || 3}%)^5 - ${formatCurrency(purchasePrice)}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Loan Principal Paydown</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${formatCurrency(loanPaydown)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Reduction in loan balance over 5 years</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total Return</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">${formatCurrency(monthlyCashFlow * 12 * 5 + appreciationProfit + loanPaydown)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sum of all components</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total ROI (Annualized)</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">{formatPercent(((monthlyCashFlow * 12 * 5 + appreciationProfit + loanPaydown) / (downPayment + renovationCost)) / 5 * 100)}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Annual return on ${formatCurrency(downPayment + renovationCost)} investment</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedStrategy === 'str' && (
            <div className="mb-8 border border-indigo-100 rounded-lg shadow bg-white overflow-hidden">
              <div className="bg-orange-50 border-b border-orange-100 px-6 py-4">
                <h2 className="text-xl font-semibold text-orange-800">Short-Term Rental Strategy (Airbnb/VRBO)</h2>
                <p className="text-sm text-orange-600">Complete breakdown of vacation rental income, expenses, and returns</p>
              </div>
              
              <div className="p-6">
                {/* Initial Investment - NEW SECTION TO MATCH LTR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Financial Summary */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Initial Investment</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Purchase Price</span>
                        <span className="font-medium">${formatCurrency(purchasePrice)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Down Payment ({formData.downPayment}%)</span>
                        <span className="font-medium">${formatCurrency(downPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Loan Amount</span>
                        <span className="font-medium">${formatCurrency(loanAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Interest Rate</span>
                        <span className="font-medium">{formData.interestRate}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Loan Term</span>
                        <span className="font-medium">{formData.loanTerm} years</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Payment</span>
                        <span className="font-medium">${formatCurrency(monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Renovation Cost</span>
                        <span className="font-medium">${formatCurrency(renovationCost)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-gray-900">
                        <span>Total Initial Investment</span>
                        <span>${formatCurrency(downPayment + renovationCost)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Monthly Cash Flow - NEW SECTION TO MATCH LTR */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Cash Flow</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Revenue (avg)</span>
                        <span className="font-medium">${formatCurrency(annualStrRevenue / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Mortgage Payment</span>
                        <span className="font-medium">-${formatCurrency(monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Property Tax</span>
                        <span className="font-medium">-${formatCurrency(strPropertyTaxAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Insurance (STR)</span>
                        <span className="font-medium">-${formatCurrency(strInsuranceAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Maintenance</span>
                        <span className="font-medium">-${formatCurrency(strMaintenanceAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Utilities</span>
                        <span className="font-medium">-${formatCurrency(strUtilitiesAnnual / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Management Fee ({formData.strManagementFee || 20}%)</span>
                        <span className="font-medium">-${formatCurrency(strManagementFee / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Other Expenses</span>
                        <span className="font-medium">-${formatCurrency(formData.additionalStrExpenses || 250)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-green-600">
                        <span>Monthly Cash Flow</span>
                        <span>${formatCurrency(annualStrCashFlow / 12)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Annual Revenue and Expense Breakdown - UPDATED TO MATCH LTR STRUCTURE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Annual Revenue Breakdown */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Revenue Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Average Nightly Rate</span>
                        <span className="font-medium">${formatCurrency(nightlyRate)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Annual Nights Booked ({occupancyRate}% occupancy)</span>
                        <span className="font-medium">{Math.round(365 * occupancyRate / 100)} nights</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-green-600 pt-2 border-t border-gray-100">
                        <span>Annual Revenue</span>
                        <span>${formatCurrency(annualStrRevenue)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Occupancy Distribution</h4>
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${occupancyRate}%` }} 
                          title={`Occupied: ${occupancyRate}%`}
                        ></div>
                        <div 
                          className="bg-gray-300" 
                          style={{ width: `${100 - occupancyRate}%` }} 
                          title={`Vacant: ${100 - occupancyRate}%`}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-green-600">Occupied: {Math.round(365 * occupancyRate / 100)} nights</span>
                        <span className="text-gray-500">Vacant: {365 - Math.round(365 * occupancyRate / 100)} nights</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Annual Expense Breakdown */}
                  <div className="bg-white border rounded-lg shadow-sm p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Annual Expense Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Property Tax</span>
                        <span className="font-medium">-${formatCurrency(strPropertyTaxAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Insurance (STR)</span>
                        <span className="font-medium">-${formatCurrency(strInsuranceAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Maintenance</span>
                        <span className="font-medium">-${formatCurrency(strMaintenanceAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Utilities</span>
                        <span className="font-medium">-${formatCurrency(strUtilitiesAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Capital Expenditures</span>
                        <span className="font-medium">-${formatCurrency(strCapexAnnual)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Management Fee ({formData.strManagementFee || 20}%)</span>
                        <span className="font-medium">-${formatCurrency(strManagementFee)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Cleaning & Turnover</span>
                        <span className="font-medium">-${formatCurrency((formData.cleaningPerTurn || 100) * Math.ceil(365 * (occupancyRate / 100) / (formData.averageStay || 3)))}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Other Expenses</span>
                        <span className="font-medium">-${formatCurrency((formData.additionalStrExpenses || 250) * 12)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Mortgage Payments</span>
                        <span className="font-medium">-${formatCurrency(monthlyPayment * 12)}</span>
                      </div>
                      <div className="flex justify-between items-center font-medium text-red-600">
                        <span>Total Annual Expenses</span>
                        <span>-${formatCurrency(totalStrAnnualExpenses + monthlyPayment * 12)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-center font-medium text-green-600 pt-2 border-t border-gray-200">
                        <span>Annual Net Cash Flow</span>
                        <span>${formatCurrency(annualStrCashFlow)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 pt-1">
                        <span>Monthly Average</span>
                        <span>${formatCurrency(annualStrCashFlow / 12)}/month</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* STR Expense Distribution Chart */}
                <div className="bg-white border rounded-lg shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">STR Expense Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Property Tax', value: strPropertyTaxAnnual },
                            { name: 'Insurance', value: strInsuranceAnnual },
                            { name: 'Maintenance', value: strMaintenanceAnnual },
                            { name: 'Utilities', value: strUtilitiesAnnual },
                            { name: 'CapEx', value: strCapexAnnual },
                            { name: 'Management', value: strManagementFee },
                            { name: 'Cleaning', value: (formData.cleaningPerTurn || 100) * Math.ceil(365 * (occupancyRate / 100) / (formData.averageStay || 3)) },
                            { name: 'Other', value: (formData.additionalStrExpenses || 250) * 12 },
                            { name: 'Mortgage', value: monthlyPayment * 12 }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
                            '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'
                          ].map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value) => [`$${formatCurrency(value)}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Key Performance Metrics */}
                <div className="bg-white border rounded-lg shadow-sm p-5 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Key Performance Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-orange-700 mb-1">Cash Flow</p>
                      <p className="text-2xl font-bold text-orange-900">${formatCurrency(annualStrCashFlow / 12)}/mo</p>
                      <p className="text-sm text-orange-700">${formatCurrency(annualStrCashFlow)}/yr</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-green-700 mb-1">Cash-on-Cash Return</p>
                      <p className="text-2xl font-bold text-green-900">{formatPercent(strCashOnCashReturn)}%</p>
                      <p className="text-sm text-green-700">Annual return on investment</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-blue-700 mb-1">Occupancy Rate</p>
                      <p className="text-2xl font-bold text-blue-900">{occupancyRate}%</p>
                      <p className="text-sm text-blue-700">{Math.round(365 * occupancyRate / 100)} nights/year</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-purple-700 mb-1">Average Rate</p>
                      <p className="text-2xl font-bold text-purple-900">${formatCurrency(nightlyRate)}</p>
                      <p className="text-sm text-purple-700">per night</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation Banner */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Recommended Strategy: {strategyLabels[recommendedStrategy]}</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Based on your priorities and property details, {strategyLabels[recommendedStrategy].toLowerCase()} appears to be the best exit strategy for this investment.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Metrics Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Normalized Strategy Comparison</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Total ROI</strong> includes all returns: cash flow + appreciation + principal paydown (for rentals). This allows true apples-to-apples comparison across strategies.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fix & Flip Metrics */}
              <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-purple-500 ${selectedStrategy === 'flip' || selectedStrategy === 'all' ? '' : 'opacity-50'}`}>
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  Fix & Flip
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total ROI (Annualized)</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatPercent(annualizedROI)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Monthly Cash Flow</dt>
                    <dd className="text-sm font-medium text-gray-900">$0</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Net Profit</dt>
                    <dd className="text-sm font-medium text-gray-900">${formatCurrency(netProfit)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Timeline</dt>
                    <dd className="text-sm font-medium text-gray-900">{holdingPeriod} months</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Risk Level</dt>
                    <dd className="text-sm font-medium text-gray-900">Medium</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Workload</dt>
                    <dd className="text-sm font-medium text-gray-900">Medium</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Liquidity</dt>
                    <dd className="text-sm font-medium text-gray-900">High</dd>
                  </div>
                </dl>
              </div>

              {/* Long-Term Rental Metrics */}
              <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-green-500 ${selectedStrategy === 'ltr' || selectedStrategy === 'all' ? '' : 'opacity-50'}`}>
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  Long-Term Rental
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total ROI (Annualized)</dt>
                    <dd className="text-sm font-medium text-green-700">{formatPercent(ltrTotalROIAnnualized)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Monthly Rent</dt>
                    <dd className="text-sm font-medium text-gray-900">${formatCurrency(monthlyRent)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Monthly Cash Flow</dt>
                    <dd className="text-sm font-medium text-gray-900">${formatCurrency(annualCashFlow / 12)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Cash-on-Cash Return</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatPercent(ltrCashOnCashReturn)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Cap Rate</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatPercent(capRate)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Vacancy Rate</dt>
                    <dd className="text-sm font-medium text-gray-900">{vacancyRate}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Risk Level</dt>
                    <dd className="text-sm font-medium text-green-600">Low</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Workload</dt>
                    <dd className="text-sm font-medium text-green-600">Medium</dd>
                  </div>
                </dl>
              </div>

              {/* Short-Term Rental Metrics */}
              <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500 ${selectedStrategy === 'str' || selectedStrategy === 'all' ? '' : 'opacity-50'}`}>
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  Short-Term Rental
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total ROI (Annualized)</dt>
                    <dd className="text-sm font-medium text-yellow-700">{formatPercent(strTotalROIAnnualized)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Nightly Rate</dt>
                    <dd className="text-sm font-medium text-gray-900">${formatCurrency(nightlyRate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Occupancy Rate</dt>
                    <dd className="text-sm font-medium text-gray-900">{occupancyRate}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Monthly Revenue</dt>
                    <dd className="text-sm font-medium text-gray-900">${formatCurrency(annualStrRevenue / 12)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Monthly Cash Flow</dt>
                    <dd className="text-sm font-medium text-gray-900">${formatCurrency(annualStrCashFlow / 12)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Cash-on-Cash Return</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatPercent(strCashOnCashReturn)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Risk Level</dt>
                    <dd className="text-sm font-medium text-red-600">High</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Workload</dt>
                    <dd className="text-sm font-medium text-red-600">High</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Investment Breakdown Chart */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Investment Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={investmentBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {investmentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Analysis</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Purchase Details</h3>
                  <dl className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Purchase Price</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(purchasePrice)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Down Payment</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(downPayment)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Loan Amount</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(loanAmount)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Renovation Details</h3>
                  <dl className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Renovation Cost</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(renovationCost)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Holding Period</dt>
                      <dd className="text-sm font-medium text-gray-900">{holdingPeriod} months</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Monthly Expenses</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(monthlyExpenses)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Selling Details</h3>
                  <dl className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Expected Selling Price</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(expectedSellingPrice)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Selling Costs</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(sellingCosts)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total Holding Costs</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(totalHoldingCosts)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Investment Summary</h3>
                  <dl className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total Investment</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(totalInvestment)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Net Profit</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(netProfit)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">ROI</dt>
                      <dd className="text-sm font-medium text-gray-900">{formatPercent(roi)}%</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* MODA Analysis Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Strategy Comparison (MODA Analysis)</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Radar Chart for Strategy Comparison */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Strategy Performance by Objective</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="objective" tick={{ fill: '#4b5563', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#4b5563', fontSize: 10 }} />
                      <Radar name="Fix & Flip" dataKey="flip" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
                      <Radar name="Long-Term Rental" dataKey="ltr" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.5} />
                      <Radar name="Short-Term Rental" dataKey="str" stroke="#ffc658" fill="#ffc658" fillOpacity={0.5} />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                      <RechartsTooltip 
                        formatter={(value) => [`${value} / 10`, '']}
                        labelFormatter={(label) => `${label} Score`}
                        contentStyle={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Bar Chart for Weighted Scores */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Strategy Score</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weightedScoreData} layout="vertical" margin={{ left: 20, right: 70, top: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 10]} tickCount={6} tick={{ fontSize: 12, fill: '#4b5563' }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 12, fill: '#4b5563' }}
                        width={120}
                      />
                      <RechartsTooltip 
                        formatter={(value) => [`${value.toFixed(2)} / 10`, 'Score']}
                        contentStyle={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                      />
                      <Bar 
                        dataKey="score" 
                        fill="#8884d8" 
                        label={{ 
                          position: 'right', 
                          formatter: (value) => value.toFixed(2),
                          fill: '#4b5563',
                          fontSize: 12,
                          fontWeight: 500,
                          offset: 10
                        }} 
                        radius={[0, 4, 4, 0]}
                        barSize={30}
                      >
                        {weightedScoreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Objective Weights */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customize Objective Weights</h3>
              <p className="text-sm text-gray-500 mb-6">
                Adjust the importance of each objective to match your investment priorities
              </p>
              
              {/* Metric Explanations */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Metric Explanations:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                  <div>
                    <span className="font-medium text-blue-700">ROI:</span> Total annualized return including cash flow, appreciation, and principal paydown
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Cash Flow:</span> Monthly income after all expenses (mortgage, taxes, insurance, maintenance)
                  </div>
                  <div>
                    <span className="font-medium text-orange-700">Risk:</span> Market volatility, regulatory changes, vacancy rates, holding period uncertainty
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Workload:</span> Time and effort required for management, maintenance, tenant relations, marketing
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="roi-weight" className="block text-sm font-medium text-gray-700">Return on Investment</label>
                    <span className="text-sm font-medium text-indigo-600">{objectiveWeights.roi}%</span>
                  </div>
                  <input
                    type="range"
                    id="roi-weight"
                    min="0"
                    max="100"
                    value={objectiveWeights.roi}
                    onChange={(e) => handleWeightChange('roi', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="cashFlow-weight" className="block text-sm font-medium text-gray-700">Cash Flow</label>
                    <span className="text-sm font-medium text-indigo-600">{objectiveWeights.cashFlow}%</span>
                  </div>
                  <input
                    type="range"
                    id="cashFlow-weight"
                    min="0"
                    max="100"
                    value={objectiveWeights.cashFlow}
                    onChange={(e) => handleWeightChange('cashFlow', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="risk-weight" className="block text-sm font-medium text-gray-700">Lower Risk</label>
                    <span className="text-sm font-medium text-indigo-600">{objectiveWeights.risk}%</span>
                  </div>
                  <input
                    type="range"
                    id="risk-weight"
                    min="0"
                    max="100"
                    value={objectiveWeights.risk}
                    onChange={(e) => handleWeightChange('risk', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="workload-weight" className="block text-sm font-medium text-gray-700">Lower Workload</label>
                    <span className="text-sm font-medium text-indigo-600">{objectiveWeights.workload}%</span>
                  </div>
                  <input
                    type="range"
                    id="workload-weight"
                    min="0"
                    max="100"
                    value={objectiveWeights.workload}
                    onChange={(e) => handleWeightChange('workload', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* New Advanced Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Cash Flow Projection Chart */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cash Flow Progression (Years 0-5)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Annual cash flow progression starting from Year 0, accounting for rent increases, property tax, and insurance changes
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cashFlowProjectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12, fill: '#4b5563' }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#4b5563' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickFormatter={(value) => `$${formatCurrency(value)}`}
                      />
                      <RechartsTooltip 
                        formatter={(value, name, props) => {
                          const strategyName = name === 'ltr' ? 'Long-Term Rental' : 
                                             name === 'str' ? 'Short-Term Rental' : name;
                          return [`$${formatCurrency(value)}`, strategyName];
                        }}
                        labelFormatter={(label) => label}
                        contentStyle={{ backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="ltr" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="Long-Term Rental"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="str" 
                        stroke="#f59e0b" 
                        strokeWidth={3}
                        name="Short-Term Rental"
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ROI Comparison Chart */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ROI Comparison</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Annualized total return comparison across all strategies
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Based on 5-year hold period including cash flow + appreciation + principal paydown ÷ 5 years
                </p>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { 
                        strategy: 'Fix & Flip', 
                        roi: annualizedROI,
                        color: '#8b5cf6'
                      },
                      { 
                        strategy: 'Long-Term Rental', 
                        roi: ltrTotalROIAnnualized,
                        color: '#10b981'
                      },
                      { 
                        strategy: 'Short-Term Rental', 
                        roi: strTotalROIAnnualized,
                        color: '#f59e0b'
                      }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="strategy" 
                        tick={{ fontSize: 12, fill: '#4b5563' }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#4b5563' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <RechartsTooltip 
                        formatter={(value) => [`${formatPercent(value)}%`, 'Annual ROI']}
                        labelFormatter={(label) => label}
                        contentStyle={{ backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                      />
                      <Bar 
                        dataKey="roi" 
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      >
                        {[
                          { strategy: 'Fix & Flip', roi: annualizedROI, color: '#8b5cf6' },
                          { strategy: 'Long-Term Rental', roi: ltrTotalROIAnnualized, color: '#10b981' },
                          { strategy: 'Short-Term Rental', roi: strTotalROIAnnualized, color: '#f59e0b' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Renovation Timeline Chart (if condition is selected) */}
            {(renovationTimelineData.length > 0) && (
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Renovation Timeline & Budget {formData.propertyCondition ? 
                    `(${formData.propertyCondition.charAt(0).toUpperCase() + formData.propertyCondition.slice(1)} Condition)` : 
                    '(Estimated Timeline)'}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Estimated renovation phases and budget allocation over time
                </p>
                
                {/* Timeline Visual */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Project Timeline</span>
                    <span className="text-sm text-gray-500">
                      Total Duration: {renovationTimelineData[renovationTimelineData.length - 1]?.weeks || 0} weeks
                    </span>
                  </div>
                  
                  <div className="relative">
                    {/* Timeline bar */}
                    <div className="w-full bg-gray-200 rounded-lg h-4 mb-4">
                      {renovationTimelineData.map((phase, index) => {
                        const totalWeeks = renovationTimelineData[renovationTimelineData.length - 1]?.weeks || 1;
                        const startWeek = index === 0 ? 0 : renovationTimelineData[index - 1]?.weeks || 0;
                        const phaseWeeks = phase.weeks - startWeek;
                        const startPercent = (startWeek / totalWeeks) * 100;
                        const widthPercent = (phaseWeeks / totalWeeks) * 100;
                        
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
                        const color = colors[index % colors.length];
                        
                        return (
                          <div
                            key={index}
                            className="absolute top-0 h-4 rounded transition-all duration-300 hover:opacity-80"
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: color
                            }}
                            title={`${phase.phase}: ${phaseWeeks} weeks, $${formatCurrency(phase.cost - (index === 0 ? 0 : renovationTimelineData[index - 1]?.cost || 0))}`}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Phase labels */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                      {renovationTimelineData.map((phase, index) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
                        const color = colors[index % colors.length];
                        const phaseWeeks = index === 0 ? phase.weeks : phase.weeks - renovationTimelineData[index - 1]?.weeks;
                        const phaseCost = index === 0 ? phase.cost : phase.cost - renovationTimelineData[index - 1]?.cost;
                        
                        return (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: color }}
                            />
                            <div>
                              <div className="font-medium text-gray-900">{phase.phase}</div>
                              <div className="text-gray-500">{phaseWeeks}w • ${formatCurrency(phaseCost)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cost Progression Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={renovationTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="weeks"
                        tick={{ fontSize: 12, fill: '#4b5563' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickFormatter={(value) => `${value}w`}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#4b5563' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickFormatter={(value) => `$${formatCurrency(value)}`}
                      />
                      <RechartsTooltip 
                        formatter={(value, name) => [`$${formatCurrency(value)}`, 'Cumulative Cost']}
                        labelFormatter={(label) => `Week ${label}`}
                        contentStyle={{ backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>



          {/* Property Details Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Purchase</h3>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Purchase Price:</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(purchasePrice)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Down Payment ({formData.downPaymentPercent}%):</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(downPayment)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Loan Amount:</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(loanAmount)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Interest Rate:</dt>
                      <dd className="text-sm font-medium text-gray-900">{formData.interestRate}%</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Renovation</h3>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Renovation Cost:</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(renovationCost)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Timeline:</dt>
                      <dd className="text-sm font-medium text-gray-900">{holdingPeriod} months</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Monthly Expenses:</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(monthlyExpenses)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Total Holding Costs:</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(totalHoldingCosts)}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Exit</h3>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">After Repair Value:</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(expectedSellingPrice)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Selling Costs ({formData.sellingCosts}%):</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(sellingCosts)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Monthly Rent:</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(monthlyRent)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Nightly Rate:</dt>
                      <dd className="text-sm font-medium text-gray-900">${formatCurrency(nightlyRate)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
            onClick={() => navigate('/calculator')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Calculator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results; 