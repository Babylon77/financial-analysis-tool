import React from 'react';
import { formatCurrency } from '../../hooks/useResultsAnalysis';

export default function SensitivityAnalysis({ formData, sensitivityInputs, onSensitivityChange, estimateNightlyRate }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-txt-primary mb-4">Sensitivity Analysis</h2>
      <p className="text-sm text-txt-muted mb-4">
        Adjust these parameters to see how changes affect your investment outcomes
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Purchase Price Slider */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <div className="flex justify-between">
            <label htmlFor="purchase-price" className="block text-sm font-medium text-txt-primary">Purchase Price</label>
            <span className="text-sm text-txt-muted">${formatCurrency(sensitivityInputs.purchasePrice || parseFloat(formData.purchasePrice))}</span>
          </div>
          <input
            type="range"
            id="purchase-price"
            min={parseFloat(formData.purchasePrice) * 0.8}
            max={parseFloat(formData.purchasePrice) * 1.2}
            step={1000}
            value={sensitivityInputs.purchasePrice || parseFloat(formData.purchasePrice)}
            onChange={(e) => onSensitivityChange('purchasePrice', parseFloat(e.target.value))}
            className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-txt-muted mt-1">
            <span>-20%</span>
            <span>Original: ${formatCurrency(parseFloat(formData.purchasePrice))}</span>
            <span>+20%</span>
          </div>
        </div>

        {/* Renovation Cost Slider */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <div className="flex justify-between">
            <label htmlFor="renovation-cost" className="block text-sm font-medium text-txt-primary">Renovation Cost</label>
            <span className="text-sm text-txt-muted">${formatCurrency(sensitivityInputs.renovationCost || parseFloat(formData.renovationCost))}</span>
          </div>
          <input
            type="range"
            id="renovation-cost"
            min={parseFloat(formData.renovationCost) * 0.7}
            max={parseFloat(formData.renovationCost) * 1.5}
            step={1000}
            value={sensitivityInputs.renovationCost || parseFloat(formData.renovationCost)}
            onChange={(e) => onSensitivityChange('renovationCost', parseFloat(e.target.value))}
            className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-txt-muted mt-1">
            <span>-30%</span>
            <span>Original: ${formatCurrency(parseFloat(formData.renovationCost))}</span>
            <span>+50%</span>
          </div>
        </div>

        {/* ARV Slider */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <div className="flex justify-between">
            <label htmlFor="arv" className="block text-sm font-medium text-txt-primary">After Repair Value</label>
            <span className="text-sm text-txt-muted">${formatCurrency(sensitivityInputs.arv || parseFloat(formData.expectedSellingPrice))}</span>
          </div>
          <input
            type="range"
            id="arv"
            min={parseFloat(formData.expectedSellingPrice) * 0.85}
            max={parseFloat(formData.expectedSellingPrice) * 1.15}
            step={1000}
            value={sensitivityInputs.arv || parseFloat(formData.expectedSellingPrice)}
            onChange={(e) => onSensitivityChange('arv', parseFloat(e.target.value))}
            className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-txt-muted mt-1">
            <span>-15%</span>
            <span>Original: ${formatCurrency(parseFloat(formData.expectedSellingPrice))}</span>
            <span>+15%</span>
          </div>
        </div>

        {/* Monthly Rent Slider */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <div className="flex justify-between">
            <label htmlFor="monthly-rent" className="block text-sm font-medium text-txt-primary">Monthly Rent</label>
            <span className="text-sm text-txt-muted">${formatCurrency(sensitivityInputs.monthlyRent || parseFloat(formData.expectedMonthlyRent || 0))}</span>
          </div>
          <input
            type="range"
            id="monthly-rent"
            min={(parseFloat(formData.expectedMonthlyRent) || 0) * 0.7}
            max={(parseFloat(formData.expectedMonthlyRent) || 0) * 1.3}
            step={50}
            value={sensitivityInputs.monthlyRent || parseFloat(formData.expectedMonthlyRent || 0)}
            onChange={(e) => onSensitivityChange('monthlyRent', parseFloat(e.target.value))}
            className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-txt-muted mt-1">
            <span>-30%</span>
            <span>Original: ${formatCurrency(parseFloat(formData.expectedMonthlyRent || 0))}</span>
            <span>+30%</span>
          </div>
        </div>

        {/* STR Nightly Rate Slider */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <div className="flex justify-between">
            <label htmlFor="nightly-rate" className="block text-sm font-medium text-txt-primary">STR Nightly Rate</label>
            <span className="text-sm text-txt-muted">${formatCurrency(sensitivityInputs.nightlyRate || parseFloat(formData.nightlyRate) || estimateNightlyRate())}</span>
          </div>
          <input
            type="range"
            id="nightly-rate"
            min={(parseFloat(formData.nightlyRate) || estimateNightlyRate()) * 0.6}
            max={(parseFloat(formData.nightlyRate) || estimateNightlyRate()) * 1.4}
            step={5}
            value={sensitivityInputs.nightlyRate || parseFloat(formData.nightlyRate) || estimateNightlyRate()}
            onChange={(e) => onSensitivityChange('nightlyRate', parseFloat(e.target.value))}
            className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-txt-muted mt-1">
            <span>-40%</span>
            <span>Original: ${formatCurrency(parseFloat(formData.nightlyRate) || estimateNightlyRate())}</span>
            <span>+40%</span>
          </div>
        </div>

        {/* STR Occupancy Rate Slider */}
        <div className="bg-surface-primary p-4 rounded-lg">
          <div className="flex justify-between">
            <label htmlFor="occupancy-rate" className="block text-sm font-medium text-txt-primary">STR Occupancy (%)</label>
            <span className="text-sm text-txt-muted">{(sensitivityInputs.occupancyRate || parseFloat(formData.occupancyRate) || 65).toFixed(1)}%</span>
          </div>
          <input
            type="range"
            id="occupancy-rate"
            min={40}
            max={90}
            step={1}
            value={sensitivityInputs.occupancyRate || parseFloat(formData.occupancyRate) || 65}
            onChange={(e) => onSensitivityChange('occupancyRate', parseFloat(e.target.value))}
            className="w-full h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs text-txt-muted mt-1">
            <span>40%</span>
            <span>Original: {parseFloat(formData.occupancyRate) || 65}%</span>
            <span>90%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
