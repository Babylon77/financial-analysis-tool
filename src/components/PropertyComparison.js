import React, { useState, useEffect } from 'react';

const PropertyComparison = () => {
  const [properties, setProperties] = useState([
    {
      id: 1,
      name: 'Property A',
      purchasePrice: 485000,
      renovationCost: 75000,
      expectedSellingPrice: 700000,
      expectedMonthlyRent: 4500,
      location: 'NJ',
      strategy: 'LTR',
      isActive: true
    },
    {
      id: 2,
      name: 'Property B',
      purchasePrice: 425000,
      renovationCost: 60000,
      expectedSellingPrice: 650000,
      expectedMonthlyRent: 4200,
      location: 'NJ',
      strategy: 'Fix & Flip',
      isActive: true
    }
  ]);

  const [newProperty, setNewProperty] = useState({
    name: '',
    purchasePrice: '',
    renovationCost: '',
    expectedSellingPrice: '',
    expectedMonthlyRent: '',
    location: 'NJ',
    strategy: 'LTR'
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [recommendation, setRecommendation] = useState(null);

  // Calculate property analysis
  const calculatePropertyAnalysis = (property) => {
    const totalInvestment = property.purchasePrice + property.renovationCost;
    const downPayment = totalInvestment * 0.20;
    
    if (property.strategy === 'Fix & Flip') {
      const profit = property.expectedSellingPrice - totalInvestment - (totalInvestment * 0.09);
      const roi = (profit / downPayment) * 100;
      const annualizedROI = (roi / 6) * 12; // 6 month project
      
      return {
        ...property,
        totalInvestment,
        downPayment,
        profit,
        roi: annualizedROI,
        cashFlow: 0,
        overallScore: annualizedROI * 0.4 + (10 - 7) * 0.6 // Simple scoring
      };
    } else {
      // LTR Analysis
      const loanAmount = totalInvestment * 0.80;
      const monthlyMortgage = (loanAmount * 0.07 / 12) / (1 - Math.pow(1 + 0.07/12, -360));
      const monthlyExpenses = monthlyMortgage + (property.purchasePrice * 0.015 / 12);
      const monthlyCashFlow = property.expectedMonthlyRent - monthlyExpenses;
      const annualCashFlow = monthlyCashFlow * 12;
      const totalROI = (annualCashFlow / downPayment) * 100;

      return {
        ...property,
        totalInvestment,
        downPayment,
        monthlyCashFlow,
        roi: totalROI,
        overallScore: totalROI * 0.4 + Math.max(0, monthlyCashFlow/200) * 0.6
      };
    }
  };

  useEffect(() => {
    const activeProperties = properties.filter(p => p.isActive);
    const results = activeProperties.map(calculatePropertyAnalysis);
    setComparisonResults(results);
    
    if (results.length > 0) {
      const best = results.reduce((prev, current) => 
        prev.overallScore > current.overallScore ? prev : current
      );
      setRecommendation(best);
    }
  }, [properties]);

  const addProperty = () => {
    if (newProperty.name && newProperty.purchasePrice) {
      const property = {
        id: Date.now(),
        ...newProperty,
        purchasePrice: parseFloat(newProperty.purchasePrice),
        renovationCost: parseFloat(newProperty.renovationCost) || 0,
        expectedSellingPrice: parseFloat(newProperty.expectedSellingPrice),
        expectedMonthlyRent: parseFloat(newProperty.expectedMonthlyRent) || 0,
        isActive: true
      };
      
      setProperties([...properties, property]);
      setNewProperty({
        name: '',
        purchasePrice: '',
        renovationCost: '',
        expectedSellingPrice: '',
        expectedMonthlyRent: '',
        location: 'NJ',
        strategy: 'LTR'
      });
      setShowAddForm(false);
    }
  };

  const toggleProperty = (id) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const removeProperty = (id) => {
    setProperties(properties.filter(p => p.id !== id));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-txt-primary mb-2">Property Comparison Tool</h1>
        <p className="text-txt-secondary">Compare multiple investment properties and get recommendations</p>
      </div>

      {/* Add Property Section */}
      <div className="bg-surface-primary rounded-lg shadow-glow-green-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Properties</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="glow-btn glow-btn-green px-4 py-2 rounded-md transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Property'}
          </button>
        </div>

        {showAddForm && (
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-1">Property Name</label>
                <input
                  type="text"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                  className="terminal-input w-full"
                  placeholder="e.g., Main St Duplex"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-1">Purchase Price</label>
                <input
                  type="number"
                  value={newProperty.purchasePrice}
                  onChange={(e) => setNewProperty({...newProperty, purchasePrice: e.target.value})}
                  className="terminal-input w-full"
                  placeholder="485000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-1">Renovation Cost</label>
                <input
                  type="number"
                  value={newProperty.renovationCost}
                  onChange={(e) => setNewProperty({...newProperty, renovationCost: e.target.value})}
                  className="terminal-input w-full"
                  placeholder="75000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-1">Expected Sale Price</label>
                <input
                  type="number"
                  value={newProperty.expectedSellingPrice}
                  onChange={(e) => setNewProperty({...newProperty, expectedSellingPrice: e.target.value})}
                  className="terminal-input w-full"
                  placeholder="700000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-1">Monthly Rent</label>
                <input
                  type="number"
                  value={newProperty.expectedMonthlyRent}
                  onChange={(e) => setNewProperty({...newProperty, expectedMonthlyRent: e.target.value})}
                  className="terminal-input w-full"
                  placeholder="4500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt-secondary mb-1">Strategy</label>
                <select
                  value={newProperty.strategy}
                  onChange={(e) => setNewProperty({...newProperty, strategy: e.target.value})}
                  className="terminal-input w-full"
                >
                  <option value="LTR">Long-term Rental</option>
                  <option value="Fix & Flip">Fix & Flip</option>
                  <option value="STR">Short-term Rental</option>
                </select>
              </div>
            </div>
            <button
              onClick={addProperty}
              className="glow-btn glow-btn-green px-6 py-2 rounded-md transition-colors"
            >
              Add Property
            </button>
          </div>
        )}

        {/* Property List */}
        <div className="space-y-3 mt-4">
          {properties.map(property => (
            <div key={property.id} className={`flex items-center justify-between p-3 border rounded-md ${property.isActive ? 'border-terminal-green bg-terminal-dark-green/20' : 'border-surface-border bg-surface-elevated'}`}>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={property.isActive}
                  onChange={() => toggleProperty(property.id)}
                  className="h-4 w-4 text-terminal-cyan"
                />
                <div>
                  <h4 className="font-medium text-txt-primary">{property.name}</h4>
                  <p className="text-sm text-txt-secondary">
                    {formatCurrency(property.purchasePrice)} • {property.strategy} • {property.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeProperty(property.id)}
                className="text-terminal-red hover:text-terminal-red-dim text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Section */}
      {recommendation && (
        <div className="bg-surface-elevated border border-terminal-dark-green rounded-lg shadow-glow-green-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-txt-primary mb-4">🏆 Recommended Property</h2>
          <div className="bg-surface-primary rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-terminal-green">{recommendation.name}</h3>
                <p className="text-txt-secondary mb-2">Overall Score: {Math.round(recommendation.overallScore * 10) / 10}/10</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ROI:</span> {Math.round(recommendation.roi)}%
                  </div>
                  <div>
                    <span className="font-medium">Strategy:</span> {recommendation.strategy}
                  </div>
                  <div>
                    <span className="font-medium">Cash Flow:</span> {recommendation.monthlyCashFlow ? formatCurrency(recommendation.monthlyCashFlow) : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Investment:</span> {formatCurrency(recommendation.downPayment)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      {comparisonResults.length > 0 && (
        <div className="bg-surface-primary rounded-lg shadow-glow-green-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Property Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-surface-border">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider">Investment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider">ROI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider">Cash Flow</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-txt-muted uppercase tracking-wider">Overall Score</th>
                </tr>
              </thead>
              <tbody className="bg-surface-primary divide-y divide-surface-border">
                {comparisonResults.map((property, index) => (
                  <tr key={property.id} className={index % 2 === 0 ? 'bg-surface-primary' : 'bg-surface-elevated'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-txt-primary">{property.name}</div>
                      <div className="text-sm text-txt-muted">{property.strategy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-primary">
                      {formatCurrency(property.downPayment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-primary">
                      {Math.round(property.roi)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-txt-primary">
                      {property.monthlyCashFlow ? formatCurrency(property.monthlyCashFlow) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-txt-primary">
                          {Math.round(property.overallScore * 10) / 10}/10
                        </div>
                        <div className="ml-2 w-16 bg-surface-overlay rounded-full h-2">
                          <div
                            className="bg-terminal-green h-2 rounded-full"
                            style={{ width: `${(property.overallScore / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyComparison; 