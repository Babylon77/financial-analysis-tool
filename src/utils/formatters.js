/**
 * Format a number as currency
 * @param {number} value - The value to format
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Number of decimal places (default: 0)
 * @param {boolean} options.compact - Whether to use compact notation for large numbers (default: false)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  if (value === undefined || value === null) return '-';
  
  const decimals = options.decimals !== undefined ? options.decimals : 0;
  const compact = options.compact || false;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact && value >= 10000 ? 'compact' : 'standard'
  }).format(value);
};

/**
 * Format a number as percentage
 * @param {number} value - The value to format (e.g., 0.0543 for 5.43%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === undefined || value === null) return '-';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format a number with commas for thousands
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === undefined || value === null) return '-';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format a large number in a compact way (K, M, B)
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted compact number string
 */
export const formatCompact = (value, decimals = 1) => {
  if (value === undefined || value === null) return '-';
  
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format a number for input display (no currency symbol, just commas)
 * @param {string|number} value - The value to format
 * @returns {string} Formatted number string with commas
 */
export const formatNumberInput = (value) => {
  if (!value) return '';
  
  // Remove any non-digit characters except decimal point
  const numericValue = value.toString().replace(/[^\d.]/g, '');
  
  // Convert to number and format with commas
  const number = parseFloat(numericValue);
  if (isNaN(number)) return '';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

/**
 * Parse a formatted number input back to a numeric string
 * @param {string} formattedValue - The formatted value with commas
 * @returns {string} Clean numeric string
 */
export const parseNumberInput = (formattedValue) => {
  if (!formattedValue) return '';
  
  // Remove commas and any other non-numeric characters except decimal point
  return formattedValue.toString().replace(/[^\d.]/g, '');
}; 