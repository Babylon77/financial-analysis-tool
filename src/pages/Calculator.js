import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Renovation cost estimates per square foot by condition
const RENOVATION_COST_ESTIMATES = {
  teardown: { base: 100, range: [80, 150] },
  poor: { base: 60, range: [50, 80] },
  fair: { base: 35, range: [25, 45] },
  good: { base: 15, range: [10, 25] }
};

// Regional cost multipliers
const REGIONAL_MULTIPLIERS = {
  'CA': 1.5, 'NY': 1.4, 'NJ': 1.3, 'MA': 1.3,
  'WA': 1.2, 'CO': 1.2, 'OR': 1.1, 'CT': 1.1,
  'MD': 1.1, 'VA': 1.1, 'IL': 1.0, 'TX': 0.9,
  'FL': 0.9, 'GA': 0.9, 'NC': 0.9, 'SC': 0.9,
  'TN': 0.8, 'AL': 0.8, 'MS': 0.8, 'LA': 0.8,
  'AR': 0.8, 'OK': 0.8, 'MO': 0.8, 'KS': 0.8,
  'NE': 0.8, 'IA': 0.8, 'SD': 0.8, 'ND': 0.8,
  'MN': 0.9, 'WI': 0.9, 'MI': 0.9, 'IN': 0.9,
  'OH': 0.9, 'PA': 0.9, 'WV': 0.8, 'KY': 0.8
};

// DIY discount factors
const DIY_FACTORS = {
  'significant': 0.6,  // 40% savings
  'minimal': 0.85,     // 15% savings
  'gc': 0.9,          // 10% savings
  'none': 1.0         // No savings
};

function Calculator() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    purchasePrice: '485000',
    renovationCost: '',
    expectedSellingPrice: '700000',
    expectedMonthlyRent: '4500',
    holdingPeriod: '12',
    downPayment: '20',
    interestRate: '7',
    loanTerm: '30',
    propertyTax: '1.2',
    insurance: '0.5',
    maintenance: '0.5',
    vacancyRate: '5',
    propertyManagement: '8',
    closingCosts: '3',
    sellingCosts: '6',
    annualAppreciation: '3',
    annualInflation: '2',
    houseSize: '2000',
    houseCondition: 'poor',
    location: 'NJ',
    diyLevel: 'minimal',
    monthlyExpenses: '4000',
    nightlyRate: '340',
    occupancyRate: '65',
    strManagementFee: '20',
    additionalStrExpenses: '250'
  });

  const [openBreakdown, setOpenBreakdown] = useState(false);
  const [openEstimator, setOpenEstimator] = useState(false);
  const [renovationTab, setRenovationTab] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBreakdownChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      renovationBreakdown: {
        ...prev.renovationBreakdown,
        [name]: value
      }
    }));
  };

  const handleBreakdownOpen = () => {
    setOpenBreakdown(true);
  };

  const handleBreakdownClose = () => {
    setOpenBreakdown(false);
  };

  const handleEstimatorOpen = () => {
    setOpenEstimator(true);
  };

  const handleEstimatorClose = () => {
    setOpenEstimator(false);
  };

  const applyBreakdownTotal = () => {
    const total = Object.values(formData.renovationBreakdown)
      .reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
    
    setFormData(prev => ({
      ...prev,
      renovationCost: total.toString(),
      useBreakdown: true,
      renovationMethod: 'manual'
    }));
    
    setOpenBreakdown(false);
  };

  const calculateRenovationEstimate = () => {
    const size = parseFloat(formData.houseSize) || 1500;
    const condition = formData.houseCondition || 'fair';
    const location = formData.location || 'TX';
    const diyLevel = formData.diyLevel || 'minimal';
    
    const baseCost = RENOVATION_COST_ESTIMATES[condition].base;
    const regionalMultiplier = REGIONAL_MULTIPLIERS[location] || 1.0;
    const diyFactor = DIY_FACTORS[diyLevel] || 1.0;
    
    const estimatedCost = Math.round(size * baseCost * regionalMultiplier * diyFactor / 100) * 100;
    
    // Calculate timeline based on condition and size
    let timeline;
    if (condition === 'teardown') {
      timeline = Math.max(6, Math.ceil(size / 1000) * 2); // 2 months per 1000 sq ft, minimum 6 months
    } else if (condition === 'poor') {
      timeline = Math.max(4, Math.ceil(size / 1000) * 1.5); // 1.5 months per 1000 sq ft, minimum 4 months
    } else if (condition === 'fair') {
      timeline = Math.max(3, Math.ceil(size / 1000)); // 1 month per 1000 sq ft, minimum 3 months
    } else {
      timeline = Math.max(2, Math.ceil(size / 1500)); // 1 month per 1500 sq ft, minimum 2 months
    }
    
    setFormData(prev => ({
      ...prev,
      renovationCost: estimatedCost.toString(),
      renovationMethod: 'estimate',
      useBreakdown: false,
      holdingPeriod: timeline.toString()
    }));
    
    setOpenEstimator(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/results', { state: { formData } });
  };

        return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Real Estate Flip Calculator
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            Fields marked with * are required
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Purchase Details Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Purchase Details
              </h2>
              <p className="text-gray-500 text-sm">
                Enter the property purchase details including price, financing terms, and down payment.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700">
                    Purchase Price *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                name="purchasePrice"
                      id="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700">
                    Down Payment (%) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                name="downPayment"
                      id="downPayment"
                value={formData.downPayment}
                onChange={handleChange}
                required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="20"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
                    Interest Rate (%) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                name="interestRate"
                      id="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="7.5"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700">
                    Loan Term (years) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                name="loanTerm"
                      id="loanTerm"
                value={formData.loanTerm}
                onChange={handleChange}
                required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="30"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">years</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Renovation Details Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Renovation Details
              </h2>
              <p className="text-gray-500 text-sm">
                You can choose to estimate renovation costs based on property condition, input a top-line estimate, or break down the renovation costs per item.
              </p>

              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setRenovationTab(0)}
                    className={`${
                      renovationTab === 0
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Condition Estimator
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenovationTab(1)}
                    className={`${
                      renovationTab === 1
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Manual Entry
                  </button>
                </nav>
              </div>

              {renovationTab === 0 ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="houseSize" className="block text-sm font-medium text-gray-700">
                      House Size (sq ft)
                    </label>
                    <input
                      type="number"
                      name="houseSize"
                      id="houseSize"
                      value={formData.houseSize}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="houseCondition" className="block text-sm font-medium text-gray-700">
                      House Condition
                    </label>
                    <select
                      id="houseCondition"
                      name="houseCondition"
                      value={formData.houseCondition}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="teardown">Teardown</option>
                      <option value="poor">Poor</option>
                      <option value="fair">Fair</option>
                      <option value="good">Good</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location (State)
                    </label>
                    <select
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="AL">Alabama</option>
                      <option value="AK">Alaska</option>
                      <option value="AZ">Arizona</option>
                      <option value="AR">Arkansas</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="CT">Connecticut</option>
                      <option value="DE">Delaware</option>
                      <option value="FL">Florida</option>
                      <option value="GA">Georgia</option>
                      <option value="HI">Hawaii</option>
                      <option value="ID">Idaho</option>
                      <option value="IL">Illinois</option>
                      <option value="IN">Indiana</option>
                      <option value="IA">Iowa</option>
                      <option value="KS">Kansas</option>
                      <option value="KY">Kentucky</option>
                      <option value="LA">Louisiana</option>
                      <option value="ME">Maine</option>
                      <option value="MD">Maryland</option>
                      <option value="MA">Massachusetts</option>
                      <option value="MI">Michigan</option>
                      <option value="MN">Minnesota</option>
                      <option value="MS">Mississippi</option>
                      <option value="MO">Missouri</option>
                      <option value="MT">Montana</option>
                      <option value="NE">Nebraska</option>
                      <option value="NV">Nevada</option>
                      <option value="NH">New Hampshire</option>
                      <option value="NJ">New Jersey</option>
                      <option value="NM">New Mexico</option>
                      <option value="NY">New York</option>
                      <option value="NC">North Carolina</option>
                      <option value="ND">North Dakota</option>
                      <option value="OH">Ohio</option>
                      <option value="OK">Oklahoma</option>
                      <option value="OR">Oregon</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="RI">Rhode Island</option>
                      <option value="SC">South Carolina</option>
                      <option value="SD">South Dakota</option>
                      <option value="TN">Tennessee</option>
                      <option value="TX">Texas</option>
                      <option value="UT">Utah</option>
                      <option value="VT">Vermont</option>
                      <option value="VA">Virginia</option>
                      <option value="WA">Washington</option>
                      <option value="WV">West Virginia</option>
                      <option value="WI">Wisconsin</option>
                      <option value="WY">Wyoming</option>
                      <option value="DC">District of Columbia</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="diyLevel" className="block text-sm font-medium text-gray-700">
                      DIY Level
                    </label>
                    <select
                      id="diyLevel"
                      name="diyLevel"
                      value={formData.diyLevel}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="significant">Significant DIY (40% savings)</option>
                      <option value="minimal">Minimal DIY (15% savings)</option>
                      <option value="gc">General Contractor (10% savings)</option>
                      <option value="none">No DIY (0% savings)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={calculateRenovationEstimate}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Calculate Estimate
                  </button>

                  {formData.renovationCost && (
                    <div className="mt-4 p-4 bg-green-50 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">Estimated Renovation Cost</h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>${parseInt(formData.renovationCost).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="renovationCost" className="block text-sm font-medium text-gray-700">
                      Renovation Cost *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                name="renovationCost"
                        id="renovationCost"
                value={formData.renovationCost}
                onChange={handleChange}
                required
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBreakdownOpen}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Cost Breakdown
                  </button>
                </div>
              )}

              <div>
                <label htmlFor="holdingPeriod" className="block text-sm font-medium text-gray-700">
                  Renovation Timeline (months) *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                name="holdingPeriod"
                    id="holdingPeriod"
                value={formData.holdingPeriod}
                onChange={handleChange}
                required
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="6"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">months</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selling Details Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Selling Details
              </h2>
              <p className="text-gray-500 text-sm">
                Enter the After Repair Value (ARV) and associated selling costs.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="expectedSellingPrice" className="block text-sm font-medium text-gray-700">
                    After Repair Value (ARV) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                type="number"
                name="expectedSellingPrice"
                      id="expectedSellingPrice"
                value={formData.expectedSellingPrice}
                onChange={handleChange}
                required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sellingCosts" className="block text-sm font-medium text-gray-700">
                    Selling Costs (%) *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                name="sellingCosts"
                      id="sellingCosts"
                value={formData.sellingCosts}
                onChange={handleChange}
                required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="8"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="monthlyExpenses" className="block text-sm font-medium text-gray-700">
                    Monthly Expenses *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="monthlyExpenses"
                      id="monthlyExpenses"
                      value={formData.monthlyExpenses}
                      onChange={handleChange}
                      required
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Analysis Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Rental Analysis (Optional)
              </h2>
              <p className="text-gray-500 text-sm">
                Enter the expected monthly rent to compare flip vs. rental strategy.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="expectedMonthlyRent" className="block text-sm font-medium text-gray-700">
                    Expected Monthly Rent
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="expectedMonthlyRent"
                      id="expectedMonthlyRent"
                      value={formData.expectedMonthlyRent}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="propertyManagementFee" className="block text-sm font-medium text-gray-700">
                    Property Management Fee (%)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="propertyManagementFee"
                      id="propertyManagementFee"
                      value={formData.propertyManagementFee || "10"}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="vacancyRate" className="block text-sm font-medium text-gray-700">
                    Vacancy Rate (%)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="vacancyRate"
                      id="vacancyRate"
                      value={formData.vacancyRate || "8"}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="8"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="annualAppreciation" className="block text-sm font-medium text-gray-700">
                    Annual Appreciation (%)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="annualAppreciation"
                      id="annualAppreciation"
                      value={formData.annualAppreciation || "3"}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="3"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Short-Term Rental Analysis Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Short-Term Rental Analysis (Optional)
              </h2>
              <p className="text-gray-500 text-sm">
                Enter details to analyze potential as a short-term rental property.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="nightlyRate" className="block text-sm font-medium text-gray-700">
                    Average Nightly Rate
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="nightlyRate"
                      id="nightlyRate"
                      value={formData.nightlyRate || ""}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="occupancyRate" className="block text-sm font-medium text-gray-700">
                    Occupancy Rate (%)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="occupancyRate"
                      id="occupancyRate"
                      value={formData.occupancyRate || "65"}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="65"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="strManagementFee" className="block text-sm font-medium text-gray-700">
                    STR Management Fee (%)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="strManagementFee"
                      id="strManagementFee"
                      value={formData.strManagementFee || "20"}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="20"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="additionalStrExpenses" className="block text-sm font-medium text-gray-700">
                    Additional Monthly Expenses
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="additionalStrExpenses"
                      id="additionalStrExpenses"
                      value={formData.additionalStrExpenses || "250"}
                      onChange={handleChange}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="250"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Calculate
              </button>
            </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default Calculator; 